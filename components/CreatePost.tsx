import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { apiFetchAuth, uploadFile } from '../constants/api';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

interface CreatePostProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePost({ visible, onClose, onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // New post type states
  const [postType, setPostType] = useState<'TEXT' | 'POLL' | 'QUESTION'>('TEXT');
  
  // Poll states
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  
  // Question states
  const [questionOptions, setQuestionOptions] = useState<string[]>(['', '']);
  const [questionType, setQuestionType] = useState<'MCQ' | 'TRUE_FALSE'>('MCQ');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Start entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation for post button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animations when modal closes
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      scaleAnim.setValue(0.9);
      pulseAnim.setValue(1);
    }
  }, [visible, fadeAnim, slideAnim, scaleAnim, pulseAnim]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  // Poll helper functions
  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Question helper functions
  const addQuestionOption = () => {
    if (questionOptions.length < 6) {
      setQuestionOptions([...questionOptions, '']);
    }
  };

  const removeQuestionOption = (index: number) => {
    if (questionOptions.length > 2) {
      setQuestionOptions(questionOptions.filter((_, i) => i !== index));
    }
  };

  const updateQuestionOption = (index: number, value: string) => {
    const newOptions = [...questionOptions];
    newOptions[index] = value;
    setQuestionOptions(newOptions);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    // Validate poll options
    if (postType === 'POLL') {
      const validOptions = pollOptions.filter(option => option.trim().length > 0);
      if (validOptions.length < 2) {
        Alert.alert('Error', 'Please add at least 2 poll options');
        return;
      }
    }

    // Validate question options
    if (postType === 'QUESTION') {
      const validOptions = questionOptions.filter(option => option.trim().length > 0);
      if (validOptions.length < 2) {
        Alert.alert('Error', 'Please add at least 2 question options');
        return;
      }
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (image) {
        setUploadingImage(true);
        try {
          const uploadedImageUrl = await uploadFile(image, user?.token || '');
          imageUrl = uploadedImageUrl;
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const hashtagsArray = hashtags
        .split(',')
        .map(tag => tag.trim().replace('#', ''))
        .filter(tag => tag.length > 0);

      let postData: any = {
        content: content.trim(),
        hashtags: hashtagsArray,
        isPrivate: false, // Always public
        imageUrl: imageUrl,
        postType: postType,
      };

      // Add poll-specific data
      if (postType === 'POLL') {
        postData.pollOptions = pollOptions.filter(option => option.trim().length > 0);
        postData.allowMultipleVotes = allowMultipleVotes;
      }

      // Add question-specific data
      if (postType === 'QUESTION') {
        postData.questionOptions = questionOptions.filter(option => option.trim().length > 0);
        postData.questionType = questionType;
      }

      const response = await apiFetchAuth('/student/posts', user?.token || '', {
        method: 'POST',
        body: postData,
      });

      if (response.ok) {
        Alert.alert('Success', 'Post published successfully!');
        resetForm();
        onPostCreated();
        onClose();
      } else {
        Alert.alert('Error', 'Failed to create post. Please try again.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setHashtags('');
    setIsPrivate(false);
    setImage(null);
    setPostType('TEXT');
    setPollOptions(['', '']);
    setAllowMultipleVotes(false);
    setQuestionOptions(['', '']);
    setQuestionType('MCQ');
  };

  const handleClose = () => {
    if (content.trim() || hashtags.trim() || image) {
      Alert.alert(
        'Discard Post?',
        'Are you sure you want to discard this post?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
                 {/* Enhanced Header with App Style Gradient */}
         <LinearGradient
           colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
           style={styles.header}
           start={{ x: 0, y: 0 }}
           end={{ x: 1, y: 1 }}
         >
           {/* Animated Background Elements */}
           <Animated.View 
             style={[
               styles.headerBackgroundElement,
               {
                 opacity: fadeAnim,
                 transform: [{ scale: scaleAnim }]
               }
             ]}
           >
             <View style={styles.floatingCircle1} />
             <View style={styles.floatingCircle2} />
             <View style={styles.floatingCircle3} />
           </Animated.View>

           <View style={styles.headerContent}>
             {/* Enhanced Center Content - Moved to Left */}
             <Animated.View 
               style={[
                 styles.headerCenter,
                 {
                   opacity: fadeAnim,
                   transform: [{ translateY: slideAnim }]
                 }
               ]}
             >
               <View style={styles.titleContainer}>
                 <Text style={styles.headerTitle}>📝 Create Post</Text>
               </View>
               
             </Animated.View>
             
             {/* Enhanced Close Button - Moved to Right */}
             <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
               <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                 <LinearGradient
                   colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                   style={styles.closeButtonGradient}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 1 }}
                 >
                   <View style={styles.closeButtonInner}>
                     <Ionicons name="close" size={20} color="#fff" />
                   </View>
                 </LinearGradient>
               </TouchableOpacity>
             </Animated.View>
           </View>
         </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Post Type Selector */}
          <Animated.View 
            style={[
              styles.postTypeSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            
            <View style={styles.postTypeButtons}>
              <TouchableOpacity
                style={[styles.postTypeButton, postType === 'TEXT' && styles.postTypeButtonActive]}
                onPress={() => setPostType('TEXT')}
              >
                <LinearGradient
                  colors={postType === 'TEXT' ? ['#4F46E5', '#7C3AED'] : ['#f1f5f9', '#e2e8f0']}
                  style={styles.postTypeButtonGradient}
                >
                  <Ionicons 
                    name="create-outline" 
                    size={20} 
                    color={postType === 'TEXT' ? '#fff' : '#64748b'} 
                  />
                  <Text style={[styles.postTypeButtonText, postType === 'TEXT' && styles.postTypeButtonTextActive]}>
                    Text Post
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.postTypeButton, postType === 'POLL' && styles.postTypeButtonActive]}
                onPress={() => setPostType('POLL')}
              >
                <LinearGradient
                  colors={postType === 'POLL' ? ['#4F46E5', '#7C3AED'] : ['#f1f5f9', '#e2e8f0']}
                  style={styles.postTypeButtonGradient}
                >
                  <Ionicons 
                    name="bar-chart-outline" 
                    size={20} 
                    color={postType === 'POLL' ? '#fff' : '#64748b'} 
                  />
                  <Text style={[styles.postTypeButtonText, postType === 'POLL' && styles.postTypeButtonTextActive]}>
                    Poll
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.postTypeButton, postType === 'QUESTION' && styles.postTypeButtonActive]}
                onPress={() => setPostType('QUESTION')}
              >
                <LinearGradient
                  colors={postType === 'QUESTION' ? ['#4F46E5', '#7C3AED'] : ['#f1f5f9', '#e2e8f0']}
                  style={styles.postTypeButtonGradient}
                >
                  <Ionicons 
                    name="help-circle-outline" 
                    size={20} 
                    color={postType === 'QUESTION' ? '#fff' : '#64748b'} 
                  />
                  <Text style={[styles.postTypeButtonText, postType === 'QUESTION' && styles.postTypeButtonTextActive]}>
                    Question
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Enhanced Content Input */}
          <Animated.View 
            style={[
              styles.contentSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.inputHeader}>
              <LinearGradient
                colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                style={styles.inputIconContainer}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.inputLabel}>What's on your mind?</Text>
            </View>
            
            {/* Enhanced Input Container with Better Visual Hierarchy */}
            <LinearGradient
              colors={['#ffffff', '#f8fafc', '#f1f5f9']}
              style={styles.contentInputContainer}
            >
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.contentInput}
                  placeholder="Share your thoughts, ideas, or experiences..."
                  placeholderTextColor="#94a3b8"
                  value={content}
                  onChangeText={setContent}
                  multiline
                  textAlignVertical="top"
                  maxLength={1000}
                />
                
                {/* Enhanced Character Counter with Visual Progress */}
                <View style={styles.charCounterContainer}>
                  <View style={styles.charCounterBar}>
                    <LinearGradient
                      colors={content.length > 800 ? ['#EF4444', '#DC2626'] : content.length > 600 ? ['#F59E0B', '#D97706'] : ['#4F46E5', '#7C3AED']}
                      style={[
                        styles.charCounterFill,
                        { width: `${Math.min((content.length / 1000) * 100, 100)}%` }
                      ]}
                    />
                  </View>
                  <Text style={[
                    styles.charCounterText,
                    { color: content.length > 800 ? '#EF4444' : content.length > 600 ? '#F59E0B' : '#4F46E5' }
                  ]}>
                    {content.length}/1000
                  </Text>
                </View>
              </View>
            </LinearGradient>
            
          </Animated.View>

                     {/* Enhanced Add Photo Section */}
           <Animated.View 
             style={[
               styles.addPhotoContainer,
               {
                 opacity: fadeAnim,
                 transform: [{ translateY: slideAnim }]
               }
             ]}
           >
             <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
               <LinearGradient
                 colors={['#ffffff', '#f8fafc', '#f1f5f9']}
                 style={styles.addPhotoButtonGradient}
               >
                 <Ionicons name="camera-outline" size={32} color="#667eea" />
                 <Text style={styles.addPhotoText}>Add a photo to your post</Text>
                 <Text style={styles.addPhotoSubtext}>Tap to select from gallery</Text>
               </LinearGradient>
             </TouchableOpacity>
           </Animated.View>

           {/* Enhanced Image Preview */}
           {image && (
             <Animated.View 
               style={[
                 styles.imageContainer,
                 {
                   opacity: fadeAnim,
                   transform: [{ scale: scaleAnim }]
                 }
               ]}
             >
               <Image source={{ uri: image }} style={styles.previewImage} />
               <LinearGradient
                 colors={['rgba(0,0,0,0.6)', 'transparent']}
                 style={styles.imageOverlay}
               />
               <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                 <LinearGradient
                   colors={['#EF4444', '#DC2626']}
                   style={styles.removeButtonGradient}
                 >
                   <Ionicons name="close" size={20} color="#fff" />
                 </LinearGradient>
               </TouchableOpacity>
               {uploadingImage && (
                 <View style={styles.uploadingOverlay}>
                   <ActivityIndicator size="large" color="#fff" />
                   <Text style={styles.uploadingText}>Uploading image...</Text>
                 </View>
               )}
             </Animated.View>
           )}

           {/* Enhanced Hashtags Section */}
          <Animated.View 
            style={[
              styles.hashtagsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#10B981', '#059669', '#047857']}
                style={styles.iconContainer}
              >
                <Ionicons name="pricetag" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Hashtags</Text>
            </View>
            <LinearGradient
              colors={['#ffffff', '#f8fafc', '#f1f5f9']}
              style={styles.hashtagsInputContainer}
            >
              <TextInput
                style={styles.hashtagsInput}
                placeholder="Enter hashtags separated by commas (e.g., study, math, exam)"
                placeholderTextColor="#94a3b8"
                value={hashtags}
                onChangeText={setHashtags}
              />
            </LinearGradient>
            {hashtags && (
              <View style={styles.hashtagsPreview}>
                {hashtags.split(',').map((tag, index) => {
                  const cleanTag = tag.trim().replace('#', '');
                  if (cleanTag) {
                    return (
                      <LinearGradient
                        key={index}
                        colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                        style={styles.hashtagChip}
                      >
                        <Text style={styles.hashtagText}>#{cleanTag}</Text>
                      </LinearGradient>
                    );
                  }
                  return null;
                })}
              </View>
            )}
          </Animated.View>


          {/* Poll Options Section */}
          {postType === 'POLL' && (
            <Animated.View 
              style={[
                styles.pollOptionsSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                  style={styles.iconContainer}
                >
                  <Ionicons name="bar-chart-outline" size={18} color="#fff" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Poll Options</Text>
              </View>
              
              <View style={styles.optionsContainer}>
                {pollOptions.map((option, index) => (
                  <View key={index} style={styles.optionRow}>
                    <TextInput
                      style={styles.optionInput}
                      placeholder={`Option ${index + 1}`}
                      placeholderTextColor="#94a3b8"
                      value={option}
                      onChangeText={(value) => updatePollOption(index, value)}
                    />
                    {pollOptions.length > 2 && (
                      <TouchableOpacity
                        style={styles.removeOptionButton}
                        onPress={() => removePollOption(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                
                {pollOptions.length < 6 && (
                  <TouchableOpacity style={styles.addOptionButton} onPress={addPollOption}>
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      style={styles.addOptionButtonGradient}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                      <Text style={styles.addOptionText}>Add Option</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.pollSettings}>
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => setAllowMultipleVotes(!allowMultipleVotes)}
                >
                  <View style={styles.settingInfo}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#4F46E5" />
                    <Text style={styles.settingText}>Allow multiple votes</Text>
                  </View>
                  <View style={[styles.toggleSwitch, allowMultipleVotes && styles.toggleSwitchActive]}>
                    <View style={[styles.toggleKnob, allowMultipleVotes && styles.toggleKnobActive]} />
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Question Options Section */}
          {postType === 'QUESTION' && (
            <Animated.View 
              style={[
                styles.questionOptionsSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706', '#B45309']}
                  style={styles.iconContainer}
                >
                  <Ionicons name="help-circle-outline" size={18} color="#fff" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Question Options</Text>
              </View>

              <View style={styles.questionTypeSelector}>
                <TouchableOpacity
                  style={[styles.questionTypeButton, questionType === 'MCQ' && styles.questionTypeButtonActive]}
                  onPress={() => setQuestionType('MCQ')}
                >
                  <Text style={[styles.questionTypeButtonText, questionType === 'MCQ' && styles.questionTypeButtonTextActive]}>
                    Multiple Choice
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.questionTypeButton, questionType === 'TRUE_FALSE' && styles.questionTypeButtonActive]}
                  onPress={() => setQuestionType('TRUE_FALSE')}
                >
                  <Text style={[styles.questionTypeButtonText, questionType === 'TRUE_FALSE' && styles.questionTypeButtonTextActive]}>
                    True/False
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.optionsContainer}>
                {questionOptions.map((option, index) => (
                  <View key={index} style={styles.optionRow}>
                    <TextInput
                      style={styles.optionInput}
                      placeholder={questionType === 'TRUE_FALSE' ? (index === 0 ? 'True' : 'False') : `Option ${index + 1}`}
                      placeholderTextColor="#94a3b8"
                      value={option}
                      onChangeText={(value) => updateQuestionOption(index, value)}
                    />
                    {questionOptions.length > 2 && questionType === 'MCQ' && (
                      <TouchableOpacity
                        style={styles.removeOptionButton}
                        onPress={() => removeQuestionOption(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                
                {questionType === 'MCQ' && questionOptions.length < 6 && (
                  <TouchableOpacity style={styles.addOptionButton} onPress={addQuestionOption}>
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      style={styles.addOptionButtonGradient}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                      <Text style={styles.addOptionText}>Add Option</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}
        </ScrollView>

                 {/* Enhanced Bottom Actions */}
         <Animated.View 
           style={[
             styles.bottomActions,
             {
               opacity: fadeAnim,
               transform: [{ translateY: slideAnim }]
             }
           ]}
         >
           {/* Enhanced Submit Button with Better Visual Feedback */}
           <TouchableOpacity
             onPress={handleSubmit}
             disabled={loading || !content.trim()}
             style={[styles.actionButton, !content.trim() && styles.disabledButton]}
           >
             {loading ? (
               <LinearGradient
                 colors={['#FF6B6B', '#FF8E53']}
                 style={styles.actionButtonGradient}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 1 }}
               >
                 <ActivityIndicator size="small" color="#fff" />
                 <Text style={styles.actionButtonText}>Publishing your post...</Text>
               </LinearGradient>
             ) : (
               <LinearGradient
                 colors={content.trim() ? ['#FF6B6B', '#FF8E53'] : ['#9CA3AF', '#6B7280']}
                 style={styles.actionButtonGradient}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 1 }}
               >
                 <Ionicons name="send" size={24} color="#fff" />
                 <Text style={styles.actionButtonText}>
                   {content.trim() ? 'Publish Post' : 'Write something first...'}
                 </Text>
               </LinearGradient>
             )}
           </TouchableOpacity>
           
         </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
     header: {
     paddingTop: Platform.OS === 'ios' ? 20 : 8,
     paddingBottom: 8,
     position: 'relative',
     overflow: 'hidden',
   },
   headerBackgroundElement: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
   },
   floatingCircle1: {
     position: 'absolute',
     top: 20,
     right: 30,
     width: 60,
     height: 60,
     borderRadius: 30,
     backgroundColor: 'rgba(255,255,255,0.1)',
   },
   floatingCircle2: {
     position: 'absolute',
     top: 60,
     left: 20,
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: 'rgba(255,255,255,0.08)',
   },
   floatingCircle3: {
     position: 'absolute',
     bottom: 30,
     right: 60,
     width: 50,
     height: 50,
     borderRadius: 25,
     backgroundColor: 'rgba(255,255,255,0.06)',
   },
   headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  headerButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
     closeButtonGradient: {
     width: 50,
     height: 50,
     borderRadius: 25,
     justifyContent: 'center',
     alignItems: 'center',
   },
   closeButtonInner: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: 'rgba(255,255,255,0.2)',
     justifyContent: 'center',
     alignItems: 'center',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 4,
   },
   headerCenter: {
     flex: 1,
     alignItems: 'flex-start',
     marginHorizontal: 10,
   },
   titleContainer: {
     marginBottom: 4,
   },
   titleBackground: {
     paddingHorizontal: 16,
     paddingVertical: 6,
     borderRadius: 20,
   },
   subtitleContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 8,
   },
   progressContainer: {
     alignItems: 'center',
     width: '100%',
     marginTop: 4,
   },
   progressBar: {
     width: '70%',
     height: 2,
     backgroundColor: 'rgba(255,255,255,0.3)',
     borderRadius: 1,
     marginBottom: 2,
     overflow: 'hidden',
   },
   progressFill: {
     height: '100%',
     backgroundColor: 'rgba(255,255,255,0.8)',
     borderRadius: 1,
   },
      progressText: {
     fontSize: 11,
     color: 'rgba(255,255,255,0.95)',
     fontWeight: '600',
   },
   headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
    lineHeight: 26,
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
    fontFamily: 'System',
  },
  postButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  postButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userInfoGradient: {
    borderRadius: 20,
    marginBottom: 20,
    padding: 2,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 3,
    borderColor: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ECDC4',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
     contentSection: {
     marginBottom: 20,
   },
   addPhotoContainer: {
     marginBottom: 20,
   },
   addPhotoButton: {
     borderRadius: 16,
     overflow: 'hidden',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.1,
     shadowRadius: 12,
     elevation: 8,
     borderWidth: 1,
     borderColor: 'rgba(102, 126, 234, 0.1)',
   },
   addPhotoButtonGradient: {
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 24,
     paddingHorizontal: 16,
     backgroundColor: 'transparent',
   },
  addPhotoText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#667eea',
    marginTop: 10,
    marginBottom: 6,
  },
  addPhotoSubtext: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
  },
   inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 10,
    letterSpacing: 0.3,
    fontFamily: 'System',
  },
  inputIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentInputContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  contentInput: {
    fontSize: 17,
    lineHeight: 26,
    color: '#1f2937',
    minHeight: 130,
    padding: 18,
    backgroundColor: 'transparent', // Make background transparent for gradient effect
    fontWeight: '400',
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  charCountGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  charCount: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 20,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  removeImageButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  removeButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  hashtagsContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.3,
    fontFamily: 'System',
  },
  hashtagsInputContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  hashtagsInput: {
    fontSize: 15,
    color: '#1f2937',
    padding: 18,
    backgroundColor: 'transparent', // Make background transparent for gradient effect
    fontWeight: '400',
  },
  hashtagsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  hashtagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  hashtagText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  privacyContainer: {
    marginBottom: 20,
  },
  privacyToggleContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'transparent', // Make background transparent for gradient effect
  },
  privacyInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyTextContainer: {
    marginLeft: 12,
  },
  privacyToggleText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 3,
  },
  privacyDescription: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleSwitchActive: {
    backgroundColor: '#667eea',
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  toggleKnobActive: {
    transform: [{ translateX: 24 }],
  },
  bottomActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(102, 126, 234, 0.1)',
    backgroundColor: '#fff',
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.3,
    fontFamily: 'System',
  },
  sendIcon: {
    marginRight: 6,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
  },
  uploadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 17,
    fontWeight: 'bold',
  },

  // Post Type Selector Styles
  postTypeSection: {
    marginBottom: 20,
  },
  postTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  postTypeButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postTypeButtonActive: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  postTypeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  postTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  postTypeButtonTextActive: {
    color: '#fff',
  },

  // Poll Options Styles
  pollOptionsSection: {
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  removeOptionButton: {
    padding: 4,
  },
  addOptionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addOptionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  addOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pollSettings: {
    marginTop: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },

  // Question Options Styles
  questionOptionsSection: {
    marginBottom: 20,
  },
  questionTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  questionTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  questionTypeButtonActive: {
    backgroundColor: '#4F46E5',
  },
  questionTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  questionTypeButtonTextActive: {
    color: '#fff',
  },
  
  // Enhanced Input Styles
  inputWrapper: {
    padding: 16,
  },
  charCounterContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  charCounterBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  charCounterFill: {
    height: '100%',
    borderRadius: 2,
  },
  charCounterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tipsContainer: {
    marginTop: 16,
  },
  tipsGradient: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
    marginLeft: 6,
  },
  tipsList: {
    gap: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 16,
  },
  postPreview: {
    marginTop: 16,
    marginHorizontal: 20,
  },
  previewGradient: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
    marginLeft: 6,
  },
  previewContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  previewStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewStat: {
    fontSize: 11,
    color: '#0369A1',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
}); 
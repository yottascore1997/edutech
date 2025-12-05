import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { apiFetchAuth, uploadFile } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    course: '',
    year: '',
    profilePhoto: '',
    isPrivate: false
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        username: (user as any).username || '',
        email: user.email || '',
        bio: (user as any).bio || '',
        course: (user as any).course || '',
        year: (user as any).year || '',
        profilePhoto: user.profilePhoto || '',
        isPrivate: (user as any).isPrivate || false
      });
    }
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Start pulse animation for save button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [user, fadeAnim, slideAnim, scaleAnim, pulseAnim]);

  const handleProfilePhotoUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingPhoto(true);
        
        try {
          // Upload the image
          const imageUrl = await uploadFile(result.assets[0].uri, user?.token || '');
          
          // Update local state with new photo
          setProfileData(prev => ({
            ...prev,
            profilePhoto: imageUrl
          }));
          
          Alert.alert('Success', 'Profile picture updated successfully!');
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!profileData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!profileData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setLoading(true);
    try {
      const updateResponse = await apiFetchAuth('/student/profile', user?.token || '', {
        method: 'PUT',
        body: profileData,
      });

             if (updateResponse.ok) {
        // Update the user context with new profile data
        if (user) {
          const updatedUser = { ...user, ...updateResponse.data };
          updateUser(updatedUser);
        }
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('profile' as never) }
        ]);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  // Helper for initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

    return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.enhancedContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 50 }}
      >
        {/* Profile Photo Section */}
        <View style={styles.compactPhotoSection}>
          <View style={styles.compactAvatarContainer}>
            {uploadingPhoto ? (
              <View style={styles.compactAvatarLoading}>
                <ActivityIndicator size="small" color="#4F46E5" />
              </View>
            ) : profileData.profilePhoto ? (
              <Image
                source={{ uri: profileData.profilePhoto }}
                style={styles.compactAvatar}
              />
            ) : (
              <View style={styles.compactAvatarPlaceholder}>
                <Text style={styles.compactAvatarInitials}>
                  {getInitials(profileData.name)}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              onPress={handleProfilePhotoUpload}
              disabled={uploadingPhoto}
              style={styles.compactEditButton}
            >
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.enhancedFormSection}>
          {/* Enhanced Name Field */}
          <View style={styles.enhancedInputGroup}>
            <View style={styles.enhancedInputLabelContainer}>
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.enhancedInputIconContainer}
              >
                <Ionicons name="person" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.enhancedInputLabel}>👤 Full Name *</Text>
            </View>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
              style={styles.enhancedInputContainer}
            >
              <TextInput
                style={styles.enhancedInput}
                value={profileData.name}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                placeholder="Enter your full name"
                placeholderTextColor="#94a3b8"
              />
            </LinearGradient>
          </View>

          {/* Username Field */}
          <View style={styles.enhancedInputGroup}>
            <View style={styles.enhancedInputLabelContainer}>
              <LinearGradient
                colors={['#8B5CF6', '#A855F7']}
                style={styles.enhancedInputIconContainer}
              >
                <Ionicons name="at" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.enhancedInputLabel}>🏷️ Username *</Text>
            </View>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
              style={styles.enhancedInputContainer}
            >
              <TextInput
                style={styles.enhancedInput}
                value={profileData.username}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, username: text }))}
                placeholder="Enter your username"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
            </LinearGradient>
          </View>

          {/* Enhanced Bio Field */}
          <View style={styles.enhancedInputGroup}>
            <View style={styles.enhancedInputLabelContainer}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.enhancedInputIconContainer}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.enhancedInputLabel}>💭 Bio</Text>
            </View>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
              style={styles.enhancedInputContainer}
            >
              <TextInput
                style={[styles.enhancedInput, styles.enhancedTextArea]}
                value={profileData.bio}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </LinearGradient>
          </View>

          {/* Enhanced Course and Year Row */}
          <View style={styles.enhancedRow}>
            <View style={[styles.enhancedInputGroup, styles.enhancedHalfWidth]}>
              <View style={styles.enhancedInputLabelContainer}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.enhancedInputIconContainer}
                >
                  <Ionicons name="school" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.enhancedInputLabel}>🎓 Course</Text>
              </View>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                style={styles.enhancedInputContainer}
              >
                <TextInput
                  style={styles.enhancedInput}
                  value={profileData.course}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, course: text }))}
                  placeholder="e.g., Computer Science"
                  placeholderTextColor="#94a3b8"
                />
              </LinearGradient>
            </View>

            <View style={[styles.enhancedInputGroup, styles.enhancedHalfWidth]}>
              <View style={styles.enhancedInputLabelContainer}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.enhancedInputIconContainer}
                >
                  <Ionicons name="calendar" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.enhancedInputLabel}>📅 Year</Text>
              </View>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                style={styles.enhancedInputContainer}
              >
                <TextInput
                  style={styles.enhancedInput}
                  value={profileData.year}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, year: text }))}
                  placeholder="e.g., 2025"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </LinearGradient>
            </View>
          </View>

          {/* Enhanced Privacy Switch */}
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
            style={styles.enhancedSwitchGroup}
          >
            <View style={styles.enhancedSwitchContent}>
              <View style={styles.enhancedSwitchLabelContainer}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.enhancedSwitchIconContainer}
                >
                  <Ionicons name="lock-closed" size={24} color="#fff" />
                </LinearGradient>
                <View style={styles.enhancedSwitchTextContainer}>
                  <Text style={styles.enhancedSwitchLabel}>🔒 Private Profile</Text>
                  <Text style={styles.enhancedSwitchDescription}>Only approved followers can see your posts and profile</Text>
                </View>
              </View>
              <Switch
                value={profileData.isPrivate}
                onValueChange={(value) => setProfileData(prev => ({ ...prev, isPrivate: value }))}
                trackColor={{ false: '#e2e8f0', true: '#4F46E5' }}
                thumbColor={profileData.isPrivate ? '#fff' : '#f4f3f4'}
                ios_backgroundColor="#e2e8f0"
              />
            </View>
          </LinearGradient>

          {/* Save Button */}
          <View style={styles.enhancedSaveButtonContainer}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={[
                styles.enhancedSaveButton,
                loading && styles.enhancedSaveButtonDisabled
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#9CA3AF', '#6B7280'] : ['#4F46E5', '#7C3AED', '#8B5CF6', '#A855F7']}
                style={styles.enhancedSaveButtonGradient}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.enhancedSaveButtonText}>Saving...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.enhancedSaveButtonText}>✨ Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
       </ScrollView>
    </View>
   );
 }

 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#f8f9fa',
   },
   
   // Enhanced Content
   enhancedContent: {
     flex: 1,
   },
   
   // Compact Photo Section Styles
   compactPhotoSection: {
     alignItems: 'center',
     marginBottom: 20,
     paddingHorizontal: 20,
   },
   compactAvatarContainer: {
     position: 'relative',
     alignItems: 'center',
   },
   compactAvatarLoading: {
     width: 80,
     height: 80,
     borderRadius: 40,
     backgroundColor: '#F3F4F6',
     justifyContent: 'center',
     alignItems: 'center',
   },
   compactAvatar: {
     width: 80,
     height: 80,
     borderRadius: 40,
   },
   compactAvatarPlaceholder: {
     width: 80,
     height: 80,
     borderRadius: 40,
     backgroundColor: '#4F46E5',
     justifyContent: 'center',
     alignItems: 'center',
   },
   compactAvatarInitials: {
     fontSize: 24,
     fontWeight: 'bold',
     color: '#fff',
   },
   compactEditButton: {
     position: 'absolute',
     bottom: -2,
     right: -2,
     width: 36,
     height: 36,
     borderRadius: 18,
     backgroundColor: '#4F46E5',
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 3,
     borderColor: '#fff',
     shadowColor: '#4F46E5',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.4,
     shadowRadius: 8,
     elevation: 8,
   },
   
   // Form Section Styles
   enhancedFormSection: {
     paddingHorizontal: 16,
     paddingBottom: 40,
   },
   enhancedInputGroup: {
     marginBottom: 24,
   },
   enhancedInputLabelContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 12,
   },
   enhancedInputIconContainer: {
     width: 40,
     height: 40,
     borderRadius: 20,
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 12,
   },
   enhancedInputLabel: {
     fontSize: 16,
     fontWeight: '600',
     color: '#374151',
     marginLeft: 8,
   },
   enhancedInputContainer: {
     borderRadius: 12,
     padding: 16,
     shadowColor: '#4F46E5',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 2,
   },
   enhancedInput: {
     fontSize: 16,
     color: '#1F2937',
     paddingVertical: 4,
   },
   enhancedTextArea: {
     minHeight: 50,
   },
   enhancedRow: {
     flexDirection: 'row',
     gap: 12,
   },
   enhancedHalfWidth: {
     flex: 1,
   },
   
   // Switch Styles
   enhancedSwitchGroup: {
     borderRadius: 16,
     paddingHorizontal: 16,
     paddingVertical: 16,
     marginHorizontal: 16,
     marginBottom: 24,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.05,
     shadowRadius: 8,
     elevation: 2,
   },
   enhancedSwitchContent: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
   },
   enhancedSwitchLabelContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,
   },
   enhancedSwitchIconContainer: {
     width: 40,
     height: 40,
     borderRadius: 20,
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 12,
   },
   enhancedSwitchTextContainer: {
     flex: 1,
   },
   enhancedSwitchLabel: {
     fontSize: 16,
     fontWeight: '600',
     color: '#1F2937',
     marginBottom: 4,
   },
   enhancedSwitchDescription: {
     fontSize: 14,
     color: '#6B7280',
   },
   
   // Save Button Styles
   enhancedSaveButtonContainer: {
     marginHorizontal: 20,
     marginTop: 30,
     marginBottom: 20,
     backgroundColor: '#fff',
     borderRadius: 16,
     shadowColor: '#4F46E5',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.2,
     shadowRadius: 8,
     elevation: 6,
   },
   enhancedSaveButton: {
     borderRadius: 16,
     overflow: 'hidden',
     minHeight: 56,
     backgroundColor: '#4F46E5',
   },
   enhancedSaveButtonDisabled: {
     opacity: 0.6,
     backgroundColor: '#9CA3AF',
   },
   enhancedSaveButtonGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 18,
     paddingHorizontal: 24,
     gap: 12,
     minHeight: 56,
   },
   enhancedSaveButtonText: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#fff',
     textAlign: 'center',
   },
});

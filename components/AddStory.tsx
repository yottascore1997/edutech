import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiFetchAuth, uploadFile } from '../constants/api';
import { useAuth } from '../context/AuthContext';

interface AddStoryProps {
  visible: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

export default function AddStory({ visible, onClose, onStoryCreated }: AddStoryProps) {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [creatingStory, setCreatingStory] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16], // Story aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadImage = async (imageUri: string): Promise<string> => {
    try {

      const result = await uploadFile(imageUri, user?.token || '');

      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const createStory = async (mediaUrl: string) => {
    try {
      const payload = {
        mediaUrl,
        mediaType: 'IMAGE',
        caption: caption.trim(),
      };
      

      
      const response = await apiFetchAuth('/student/stories', user?.token || '', {
        method: 'POST',
        body: payload,
      });



      if (response.ok) {
        Alert.alert('Success', 'Story created successfully!');
        onStoryCreated();
        resetForm();
        onClose();
      } else {
        console.error('Story creation failed:', response);
        throw new Error(`Failed to create story: ${response.status} - ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.error('Error in createStory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', 'Failed to create story: ' + errorMessage);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setUploading(true);
    setCreatingStory(true);

    try {
      // First upload the image

      const mediaUrl = await uploadImage(selectedImage);

      
      if (!mediaUrl) {
        throw new Error('Failed to upload image - no URL returned');
      }
      
      // Then create the story
      console.log('Creating story with payload:', {
        mediaUrl,
        mediaType: 'IMAGE',
        caption: caption.trim(),
      });
      
      await createStory(mediaUrl);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', 'Failed to upload image or create story: ' + errorMessage);
    } finally {
      setUploading(false);
      setCreatingStory(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setCaption('');
  };

  const handleClose = () => {
    if (uploading || creatingStory) {
      Alert.alert('Please wait', 'Please wait for the upload to complete');
      return;
    }
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Story</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!selectedImage || uploading || creatingStory}
              style={[
                styles.postButton,
                (!selectedImage || uploading || creatingStory) && styles.postButtonDisabled,
              ]}
            >
              {uploading || creatingStory ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {!selectedImage ? (
              // Image selection options
              <View style={styles.imageSelectionContainer}>
                <View style={styles.imageSelectionCard}>
                  <Ionicons name="camera" size={48} color="#667eea" />
                  <Text style={styles.imageSelectionTitle}>Add to Your Story</Text>
                  <Text style={styles.imageSelectionSubtitle}>
                    Share a photo or video that will appear at the top of your story for 24 hours
                  </Text>
                  
                  <View style={styles.imageSelectionButtons}>
                    <TouchableOpacity style={styles.selectionButton} onPress={takePhoto}>
                      <Ionicons name="camera-outline" size={24} color="#667eea" />
                      <Text style={styles.selectionButtonText}>Camera</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.selectionButton} onPress={pickImage}>
                      <Ionicons name="images-outline" size={24} color="#667eea" />
                      <Text style={styles.selectionButtonText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              // Image preview and caption
              <View style={styles.previewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                
                <View style={styles.captionContainer}>
                  <TextInput
                    style={styles.captionInput}
                    placeholder="Write a caption..."
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                    maxLength={200}
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.characterCount}>{caption.length}/200</Text>
                </View>

                <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                  <Ionicons name="refresh" size={20} color="#667eea" />
                  <Text style={styles.changeImageText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  postButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imageSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSelectionCard: {
    backgroundColor: '#f8f9fa',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 300,
  },
  imageSelectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  imageSelectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  imageSelectionButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  selectionButton: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectionButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#667eea',
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 15,
    marginBottom: 20,
  },
  captionContainer: {
    marginBottom: 20,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  changeImageText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
}); 

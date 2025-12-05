import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface KYCDocumentFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const documentTypes = [
  { value: 'AADHAR_CARD', label: 'Aadhar Card' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'VOTER_ID', label: 'Voter ID' },
];

export default function KYCDocumentForm({ visible, onClose, onSuccess }: KYCDocumentFormProps) {
  const { user } = useAuth();
  const [documentType, setDocumentType] = useState('AADHAR_CARD');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDocumentTypeModal, setShowDocumentTypeModal] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload document image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setDocumentImage(base64Image);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setDocumentImage(base64Image);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!documentNumber.trim()) {
      Alert.alert('Error', 'Please enter document number.');
      return;
    }

    if (!documentImage) {
      Alert.alert('Error', 'Please upload document image.');
      return;
    }

    if (!user?.token) {
      Alert.alert('Error', 'Please log in to submit KYC documents.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        documentType,
        documentNumber: documentNumber.trim(),
        documentImage,
      };

      const response = await apiFetchAuth('/user/kyc/upload', user.token, {
        method: 'POST',
        body: payload,
      });

      if (response.ok) {
        Alert.alert(
          '🎉 Success!',
          'Your KYC document has been uploaded successfully!\n\nOur team will verify your documents shortly. You will be notified once the verification is complete.',
          [
            {
              text: 'Great!',
              onPress: () => {
                onClose();
                onSuccess?.();
                // Reset form
                setDocumentNumber('');
                setDocumentImage(null);
              },
              style: 'default'
            },
          ],
          {
            cancelable: false,
            titleStyle: {
              fontSize: 20,
              fontWeight: '700',
              color: '#059669',
              textAlign: 'center',
              letterSpacing: 0.5,
            },
            messageStyle: {
              fontSize: 16,
              lineHeight: 24,
              color: '#374151',
              textAlign: 'center',
              marginTop: 12,
              marginBottom: 16,
              letterSpacing: 0.3,
            },
          }
        );
      } else {
        Alert.alert(
          '❌ Upload Failed',
          response.data?.message || 'We encountered an issue while uploading your KYC document. Please try again.',
          [
            {
              text: 'Try Again',
              style: 'default'
            }
          ],
          {
            cancelable: true,
            titleStyle: {
              fontSize: 18,
              fontWeight: '600',
              color: '#DC2626',
              textAlign: 'center',
              letterSpacing: 0.3,
            },
            messageStyle: {
              fontSize: 15,
              lineHeight: 22,
              color: '#4B5563',
              textAlign: 'center',
              marginTop: 8,
              marginBottom: 12,
              letterSpacing: 0.2,
            },
          }
        );
      }
    } catch (error: any) {
      console.error('Error uploading KYC document:', error);
      if (error.status === 401) {
        Alert.alert(
          '⚠️ Session Expired',
          'Your session has expired. Please log in again to continue.',
          [
            {
              text: 'Log In',
              onPress: () => logout(),
              style: 'default'
            }
          ],
          {
            cancelable: false,
            titleStyle: {
              fontSize: 18,
              fontWeight: '600',
              color: '#D97706',
              textAlign: 'center',
              letterSpacing: 0.3,
            },
            messageStyle: {
              fontSize: 15,
              lineHeight: 22,
              color: '#4B5563',
              textAlign: 'center',
              marginTop: 8,
              marginBottom: 12,
              letterSpacing: 0.2,
            },
          }
        );
      } else {
        Alert.alert(
          '❌ Error',
          error.data?.message || 'We encountered an unexpected error. Please try again later.',
          [
            {
              text: 'OK',
              style: 'default'
            }
          ],
          {
            cancelable: true,
            titleStyle: {
              fontSize: 18,
              fontWeight: '600',
              color: '#DC2626',
              textAlign: 'center',
              letterSpacing: 0.3,
            },
            messageStyle: {
              fontSize: 15,
              lineHeight: 22,
              color: '#4B5563',
              textAlign: 'center',
              marginTop: 8,
              marginBottom: 12,
              letterSpacing: 0.2,
            },
          }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (value: string) => {
    const type = documentTypes.find(t => t.value === value);
    return type ? type.label : value;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Upload KYC Document</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Document Type Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Document Type *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDocumentTypeModal(true)}
              >
                <Text style={styles.dropdownText}>
                  {getDocumentTypeLabel(documentType)}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Document Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Document Number *</Text>
              <TextInput
                style={styles.textInput}
                value={documentNumber}
                onChangeText={setDocumentNumber}
                placeholder="Enter document number"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
              />
            </View>

            {/* Document Image Upload */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Document Image *</Text>
              
              {documentImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: documentImage }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setDocumentImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadContainer}>
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <Ionicons name="image" size={22} color="#4F46E5" />
                    <Text style={styles.uploadText}>Choose from Gallery</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.orText}>OR</Text>
                  
                  <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                    <Ionicons name="camera" size={22} color="#4F46E5" />
                    <Text style={styles.uploadText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Submit</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Document Type Selection Modal */}
        <Modal
          visible={showDocumentTypeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDocumentTypeModal(false)}
        >
          <View style={styles.typeModalOverlay}>
            <View style={styles.typeModalContent}>
              <View style={styles.typeModalHeader}>
                <Text style={styles.typeModalTitle}>Select Document Type</Text>
                <TouchableOpacity onPress={() => setShowDocumentTypeModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.typeModalBody}>
                {documentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      documentType === type.value && styles.selectedTypeOption,
                    ]}
                    onPress={() => {
                      setDocumentType(type.value);
                      setShowDocumentTypeModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        documentType === type.value && styles.selectedTypeOptionText,
                      ]}
                    >
                      {type.label}
                    </Text>
                    {documentType === type.value && (
                      <Ionicons name="checkmark" size={20} color="#4F46E5" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '92%',
    maxHeight: '90%',
    minHeight: '75%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    lineHeight: 18,
  },
  closeButton: {
    padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalBody: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 0,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 0,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    letterSpacing: 0.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 0,
  },
  uploadContainer: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 0,
  },
  uploadButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 0,
  },
  uploadText: {
    marginTop: 6,
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  orText: {
    fontSize: 13,
    color: '#6B7280',
    marginVertical: 6,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 0,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 0,
  },
  submitButton: {
    backgroundColor: '#FB923C',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 0,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.2)',
    position: 'absolute',
    bottom: -35,
    left: '50%',
    transform: [{ translateX: -100 }],
    width: 200,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(156, 163, 175, 0.9)',
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  typeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '85%',
    maxHeight: '65%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  typeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
  },
  typeModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  typeModalBody: {
    padding: 14,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTypeOption: {
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  typeOptionText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  selectedTypeOptionText: {
    color: '#4F46E5',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

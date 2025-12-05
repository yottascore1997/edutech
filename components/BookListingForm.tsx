import { apiFetchAuth, uploadFile } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface BookListingFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  listingType: 'SELL' | 'DONATE' | 'RENT';
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  price: string;
  category: string;
  location: string;
  coverImage: string | null;
  backImage: string | null;
  additionalImages: string[];
}

const BookListingForm: React.FC<BookListingFormProps> = ({ visible, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    listingType: 'SELL',
    condition: 'GOOD',
    price: '',
    category: '',
    location: '',
    coverImage: null,
    backImage: null,
    additionalImages: [],
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const categories = [
    'Academic', 'Fiction', 'Non-Fiction', 'Science', 'Mathematics',
    'Engineering', 'Medical', 'Law', 'Business', 'Arts', 'Other'
  ];

  const conditions = [
    { value: 'EXCELLENT', label: 'Excellent', color: '#10B981' },
    { value: 'GOOD', label: 'Good', color: '#3B82F6' },
    { value: 'FAIR', label: 'Fair', color: '#F59E0B' },
    { value: 'POOR', label: 'Poor', color: '#EF4444' },
  ];

  const listingTypes = [
    { value: 'SELL', label: 'Sell', color: '#EF4444' },
    { value: 'DONATE', label: 'Donate', color: '#10B981' },
    { value: 'RENT', label: 'Rent', color: '#3B82F6' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.coverImage) newErrors.coverImage = 'Cover image is required';
    
    if (formData.listingType !== 'DONATE' && !formData.price.trim()) {
      newErrors.price = 'Price is required for sell/rent';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async (type: 'cover' | 'back' | 'additional') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        if (type === 'cover') {
          setFormData(prev => ({ ...prev, coverImage: asset.uri }));
        } else if (type === 'back') {
          setFormData(prev => ({ ...prev, backImage: asset.uri }));
        } else {
          setFormData(prev => ({ 
            ...prev, 
            additionalImages: [...prev.additionalImages, asset.uri] 
          }));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImages = async (): Promise<{ coverImage: string; backImage?: string; additionalImages: string[] }> => {
    const uploadPromises: Promise<string>[] = [];
    
    // Upload cover image
    if (formData.coverImage) {
      uploadPromises.push(uploadFile(formData.coverImage, user?.token || ''));
    }
    
    // Upload back image
    if (formData.backImage) {
      uploadPromises.push(uploadFile(formData.backImage, user?.token || ''));
    }
    
    // Upload additional images
    formData.additionalImages.forEach(imageUri => {
      uploadPromises.push(uploadFile(imageUri, user?.token || ''));
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    
    return {
      coverImage: uploadedUrls[0],
      backImage: formData.backImage ? uploadedUrls[1] : undefined,
      additionalImages: uploadedUrls.slice(formData.backImage ? 2 : 1),
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Upload images first
      const uploadedImages = await uploadImages();
      
      // Prepare payload
      const payload = {
        title: formData.title,
        listingType: formData.listingType,
        condition: formData.condition,
        price: formData.listingType === 'DONATE' ? 0 : parseInt(formData.price),
        category: formData.category,
        location: formData.location,
        latitude: 21.2404203, // Default coordinates - you might want to get user's location
        longitude: 78.9061866,
        coverImage: uploadedImages.coverImage,
        backImage: uploadedImages.backImage,
        additionalImages: uploadedImages.additionalImages,
      };

      const response = await apiFetchAuth('/books', user?.token || '', {
        method: 'POST',
        body: payload,
      });

      if (response.ok) {
        Alert.alert('Success', 'Book listed successfully!');
        onSuccess();
        handleClose();
      } else {
        Alert.alert('Error', 'Failed to list book');
      }
    } catch (error) {
      console.error('Error listing book:', error);
      Alert.alert('Error', 'Failed to list book');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      listingType: 'SELL',
      condition: 'GOOD',
      price: '',
      category: '',
      location: '',
      coverImage: null,
      backImage: null,
      additionalImages: [],
    });
    setErrors({});
    onClose();
  };

  const removeImage = (type: 'cover' | 'back' | 'additional', index?: number) => {
    if (type === 'cover') {
      setFormData(prev => ({ ...prev, coverImage: null }));
    } else if (type === 'back') {
      setFormData(prev => ({ ...prev, backImage: null }));
    } else if (type === 'additional' && index !== undefined) {
      setFormData(prev => ({
        ...prev,
        additionalImages: prev.additionalImages.filter((_, i) => i !== index)
      }));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>List your book</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Book Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Book Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Enter book title"
              placeholderTextColor="#9CA3AF"
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Listing Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Listing Type *</Text>
            <View style={styles.optionContainer}>
              {listingTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.optionButton,
                    formData.listingType === type.value && styles.activeOptionButton,
                    { borderColor: type.color }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, listingType: type.value as any }))}
                >
                  <Text style={[
                    styles.optionText,
                    formData.listingType === type.value && styles.activeOptionText,
                    { color: formData.listingType === type.value ? '#FFFFFF' : type.color }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price (only for SELL and RENT) */}
          {formData.listingType !== 'DONATE' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price (₹) *</Text>
              <TextInput
                style={[styles.input, errors.price && styles.inputError]}
                value={formData.price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                placeholder="Enter price"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>
          )}

          {/* Condition */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Condition *</Text>
            <View style={styles.optionContainer}>
              {conditions.map((condition) => (
                <TouchableOpacity
                  key={condition.value}
                  style={[
                    styles.optionButton,
                    formData.condition === condition.value && styles.activeOptionButton,
                    { borderColor: condition.color }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, condition: condition.value as any }))}
                >
                  <Text style={[
                    styles.optionText,
                    formData.condition === condition.value && styles.activeOptionText,
                    { color: formData.condition === condition.value ? '#FFFFFF' : condition.color }
                  ]}>
                    {condition.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <TextInput
              style={[styles.input, errors.category && styles.inputError]}
              value={formData.category}
              onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
              placeholder="Enter category"
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.categorySuggestions}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.categoryChip}
                  onPress={() => setFormData(prev => ({ ...prev, category }))}
                >
                  <Text style={styles.categoryChipText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              placeholder="Enter location"
              placeholderTextColor="#9CA3AF"
            />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

          {/* Images */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Book Images *</Text>
            
            {/* Cover Image */}
            <View style={styles.imageSection}>
              <Text style={styles.imageLabel}>Cover Image *</Text>
              {formData.coverImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: formData.coverImage }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage('cover')}
                  >
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.imagePicker}
                  onPress={() => pickImage('cover')}
                >
                  <Ionicons name="camera" size={24} color="#6B7280" />
                  <Text style={styles.imagePickerText}>Add Cover Image</Text>
                </TouchableOpacity>
              )}
              {errors.coverImage && <Text style={styles.errorText}>{errors.coverImage}</Text>}
            </View>

            {/* Back Image */}
            <View style={styles.imageSection}>
              <Text style={styles.imageLabel}>Back Image (Optional)</Text>
              {formData.backImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: formData.backImage }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage('back')}
                  >
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.imagePicker}
                  onPress={() => pickImage('back')}
                >
                  <Ionicons name="camera" size={24} color="#6B7280" />
                  <Text style={styles.imagePickerText}>Add Back Image</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Additional Images */}
            <View style={styles.imageSection}>
              <Text style={styles.imageLabel}>Additional Images (Optional)</Text>
              <View style={styles.additionalImagesContainer}>
                {formData.additionalImages.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeImage('additional', index)}
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {formData.additionalImages.length < 3 && (
                  <TouchableOpacity 
                    style={styles.imagePicker}
                    onPress={() => pickImage('additional')}
                  >
                    <Ionicons name="add" size={24} color="#6B7280" />
                    <Text style={styles.imagePickerText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Submit Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.submitButtonBottom, loading && styles.submitButtonDisabled]}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? ['#9CA3AF', '#6B7280'] : ['#4F46E5', '#7C3AED']}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <View style={styles.submitButtonContent}>
                  <Text style={styles.submitButtonTextBottom}>Listing...</Text>
                </View>
              ) : (
                <View style={styles.submitButtonContent}>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.submitButtonTextBottom}>List your Book</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButtonBottom: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonTextBottom: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  activeOptionButton: {
    backgroundColor: '#4F46E5',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeOptionText: {
    color: '#FFFFFF',
  },
  categorySuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  imageSection: {
    marginBottom: 16,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePicker: {
    width: 100,
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  additionalImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default BookListingForm;

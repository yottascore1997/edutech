import { apiFetchAuth, uploadFile } from '@/constants/api';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const listingTypes = [
  { value: 'SELL' as const, label: 'Sell', color: '#EF4444', icon: 'pricetag' as const },
  { value: 'DONATE' as const, label: 'Donate', color: '#10B981', icon: 'heart' as const },
  { value: 'RENT' as const, label: 'Rent', color: '#3B82F6', icon: 'time' as const },
];

const conditions = [
  { value: 'EXCELLENT' as const, label: 'Excellent', color: '#10B981' },
  { value: 'GOOD' as const, label: 'Good', color: '#3B82F6' },
  { value: 'FAIR' as const, label: 'Fair', color: '#F59E0B' },
  { value: 'POOR' as const, label: 'Poor', color: '#EF4444' },
];

const categories = [
  'Academic', 'Fiction', 'Non-Fiction', 'Science', 'Mathematics',
  'Engineering', 'Medical', 'Law', 'Business', 'Arts', 'Other',
];

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={18} color="#6366F1" />
        </View>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

const BookListingForm: React.FC<BookListingFormProps> = ({ visible, onClose, onSuccess }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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
          setFormData((prev) => ({ ...prev, coverImage: asset.uri }));
        } else if (type === 'back') {
          setFormData((prev) => ({ ...prev, backImage: asset.uri }));
        } else {
          setFormData((prev) => ({
            ...prev,
            additionalImages: [...prev.additionalImages, asset.uri],
          }));
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImages = async (): Promise<{
    coverImage: string;
    backImage?: string;
    additionalImages: string[];
  }> => {
    const uploadPromises: Promise<string>[] = [];
    if (formData.coverImage) {
      uploadPromises.push(uploadFile(formData.coverImage, user?.token || ''));
    }
    if (formData.backImage) {
      uploadPromises.push(uploadFile(formData.backImage, user?.token || ''));
    }
    formData.additionalImages.forEach((imageUri) => {
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
      const uploadedImages = await uploadImages();
      const payload = {
        title: formData.title,
        listingType: formData.listingType,
        condition: formData.condition,
        price: formData.listingType === 'DONATE' ? 0 : parseInt(formData.price),
        category: formData.category,
        location: formData.location,
        latitude: 21.2404203,
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
    } catch {
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
      setFormData((prev) => ({ ...prev, coverImage: null }));
    } else if (type === 'back') {
      setFormData((prev) => ({ ...prev, backImage: null }));
    } else if (type === 'additional' && index !== undefined) {
      setFormData((prev) => ({
        ...prev,
        additionalImages: prev.additionalImages.filter((_, i) => i !== index),
      }));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 2 }]}
        >
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.8}>
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>List your book</Text>
          <View style={styles.headerPlaceholder} />
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SectionCard title="Book details" subtitle="Title and listing type" icon="document-text-outline">
            <FieldLabel text="Book Title" required />
            <View style={[styles.inputWrap, errors.title && styles.inputWrapError]}>
              <Ionicons name="book-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
                placeholder="Enter book title"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

            <FieldLabel text="Listing Type" required />
            <View style={styles.optionRow}>
              {listingTypes.map((type) => {
                const active = formData.listingType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typePill,
                      active && { backgroundColor: type.color, borderColor: type.color },
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, listingType: type.value }))}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={type.icon}
                      size={16}
                      color={active ? '#FFF' : type.color}
                    />
                    <Text style={[styles.typePillText, active && styles.typePillTextActive]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {formData.listingType !== 'DONATE' ? (
              <>
                <FieldLabel text="Price (₹)" required />
                <View style={[styles.inputWrap, errors.price && styles.inputWrapError]}>
                  <Text style={styles.rupeeIcon}>₹</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.price}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, price: text }))}
                    placeholder="Enter price"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
              </>
            ) : null}
          </SectionCard>

          <SectionCard title="Condition & category" subtitle="Help buyers find your book" icon="layers-outline">
            <FieldLabel text="Condition" required />
            <View style={styles.optionRow}>
              {conditions.map((condition) => {
                const active = formData.condition === condition.value;
                return (
                  <TouchableOpacity
                    key={condition.value}
                    style={[
                      styles.conditionPill,
                      active && { backgroundColor: condition.color, borderColor: condition.color },
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, condition: condition.value }))
                    }
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.conditionText,
                        active && styles.conditionTextActive,
                        !active && { color: condition.color },
                      ]}
                    >
                      {condition.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FieldLabel text="Category" required />
            <View style={[styles.inputWrap, errors.category && styles.inputWrapError]}>
              <Ionicons name="grid-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, category: text }))}
                placeholder="Select or type category"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chipRow}>
                {categories.map((category) => {
                  const active = formData.category === category;
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                      onPress={() => setFormData((prev) => ({ ...prev, category }))}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

            <FieldLabel text="Location" required />
            <View style={[styles.inputWrap, errors.location && styles.inputWrapError]}>
              <Ionicons name="location-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, location: text }))}
                placeholder="City or area"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
          </SectionCard>

          <SectionCard title="Book photos" subtitle="Add clear images of your book" icon="images-outline">
            <FieldLabel text="Cover Image" required />
            {formData.coverImage ? (
              <View style={styles.imageContainerLarge}>
                <Image source={{ uri: formData.coverImage }} style={styles.imagePreviewLarge} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage('cover')}
                >
                  <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.changePhotoBtn} onPress={() => pickImage('cover')}>
                  <Text style={styles.changePhotoTxt}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePickerLarge} onPress={() => pickImage('cover')} activeOpacity={0.85}>
                <View style={styles.imagePickerIcon}>
                  <Ionicons name="camera" size={28} color="#6366F1" />
                </View>
                <Text style={styles.imagePickerTitle}>Add cover photo</Text>
                <Text style={styles.imagePickerHint}>Front cover, well lit</Text>
              </TouchableOpacity>
            )}
            {errors.coverImage ? <Text style={styles.errorText}>{errors.coverImage}</Text> : null}

            <FieldLabel text="Back Image" />
            <View style={styles.imageRow}>
              {formData.backImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: formData.backImage }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage('back')}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('back')} activeOpacity={0.85}>
                  <Ionicons name="image-outline" size={22} color="#6366F1" />
                  <Text style={styles.imagePickerText}>Back</Text>
                </TouchableOpacity>
              )}

              {formData.additionalImages.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage('additional', index)}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {formData.additionalImages.length < 3 ? (
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={() => pickImage('additional')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={24} color="#6366F1" />
                  <Text style={styles.imagePickerText}>More</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </SectionCard>

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitButtonBottom, loading && styles.submitButtonDisabled]}
            disabled={loading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={loading ? ['#9CA3AF', '#6B7280'] : ['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <View style={styles.submitButtonContent}>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={styles.submitButtonTextBottom}>Listing...</Text>
                </View>
              ) : (
                <View style={styles.submitButtonContent}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
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
    backgroundColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    minHeight: 44,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  headerPlaceholder: { width: 30 },
  content: { flex: 1 },
  contentInner: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: { flex: 1 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#94A3B8',
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: '#475569',
    marginBottom: 8,
    marginTop: 4,
  },
  required: {
    color: '#EF4444',
    fontFamily: FontFamily.bold,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    minHeight: 50,
    marginBottom: 4,
  },
  inputWrapError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: { marginRight: 10 },
  rupeeIcon: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#9CA3AF',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: '#1E293B',
    paddingVertical: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: FontFamily.medium,
    marginTop: 4,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  typePill: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  typePillText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: '#475569',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  conditionPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  conditionText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
  conditionTextActive: {
    color: '#FFFFFF',
  },
  chipScroll: { marginTop: 10, marginBottom: 4 },
  chipRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  categoryChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#4F46E5',
    fontFamily: FontFamily.semiBold,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  imageContainerLarge: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  imagePreviewLarge: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changePhotoBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changePhotoTxt: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },
  imagePickerLarge: {
    width: '100%',
    height: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  imagePickerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  imagePickerTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: '#334155',
  },
  imagePickerHint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#94A3B8',
    marginTop: 4,
  },
  imageSection: { marginBottom: 12 },
  imageContainer: {
    position: 'relative',
    width: 96,
    height: 118,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(239,68,68,0.92)',
    borderRadius: 12,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePicker: {
    width: 96,
    height: 118,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: 4,
  },
  imagePickerText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonBottom: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 16,
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
    fontFamily: FontFamily.bold,
  },
  submitButtonDisabled: { opacity: 0.7 },
});

export default BookListingForm;

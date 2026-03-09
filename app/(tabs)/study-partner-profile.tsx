import { apiFetchAuth, uploadFile } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import StudyPartnerBottomNav from '@/components/StudyPartnerBottomNav';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StudyPartnerProfileResponse = {
  id?: string;
  userId?: string;
  bio?: string | null;
  subjects?: string[];
  photos?: string[];
  examType?: string | null;
  goals?: string | null;
  studyTimeFrom?: string | null;
  studyTimeTo?: string | null;
  studyTimeSlot?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  language?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  age?: number;
  user?: {
    name?: string;
    profilePhoto?: string | null;
    emailVerified?: boolean;
    hasPhone?: boolean;
  };
};

const EXAM_TYPES = ['Railway', 'SSC CGL', 'SSC CHSL', 'Bank PO', 'Other'];
const LANGUAGES = ['Hindi', 'English', 'Both'];
const STUDY_TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const GENDERS = ['Male', 'Female', 'Other'];
const MAX_PHOTOS = 4;
const MIN_PHOTOS = 1;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_PAD = 16 * 2;
const CARD_PAD = 20 * 2;
const PHOTO_GAP = 12;
const PHOTO_SIZE = (SCREEN_WIDTH - CONTENT_PAD - CARD_PAD - PHOTO_GAP) / 2;

export default function StudyPartnerProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bio, setBio] = useState('');
  const [examType, setExamType] = useState('');
  const [goals, setGoals] = useState('');
  const [studyTimeFrom, setStudyTimeFrom] = useState('');
  const [studyTimeTo, setStudyTimeTo] = useState('');
  const [studyTimeSlot, setStudyTimeSlot] = useState('');
  const [language, setLanguage] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!user?.token) {
        setLoading(false);
        return;
      }
      setError(null);
      try {
        const res = await apiFetchAuth(
          '/student/study-partner/profile',
          user.token,
        );
        if (!isMounted) return;
        const data = (res.data || {}) as StudyPartnerProfileResponse;
        setBio(data.bio || '');
        setExamType(data.examType || '');
        setGoals(data.goals || '');
        setStudyTimeFrom(data.studyTimeFrom || '');
        setStudyTimeTo(data.studyTimeTo || '');
        setStudyTimeSlot(data.studyTimeSlot || '');
        setLanguage(data.language || '');
        setGender(data.gender || '');
        if (data.dateOfBirth) {
          const d = data.dateOfBirth.split('T')[0];
          setDateOfBirth(d);
        } else {
          setDateOfBirth('');
        }
        setPhotos(Array.isArray(data.photos) ? [...data.photos] : []);
        setIsActive(data.isActive !== false);
      } catch (e: any) {
        if (!isMounted) return;
        console.error('StudyPartnerProfile load error:', e);
        setError('Unable to load profile. Please try again.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [user?.token]);

  const handleSave = async () => {
    if (!user?.token) return;
    if (!bio.trim()) {
      setError('Please add a short bio about yourself.');
      return;
    }
    if (photos.length < MIN_PHOTOS) {
      setError(`At least ${MIN_PHOTOS} photo is required (max ${MAX_PHOTOS}).`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetchAuth('/student/study-partner/profile', user.token, {
        method: 'PATCH',
        body: {
          bio: bio.trim(),
          examType: examType || undefined,
          goals: goals.trim() || undefined,
          studyTimeFrom: studyTimeFrom || undefined,
          studyTimeTo: studyTimeTo || undefined,
          studyTimeSlot: studyTimeSlot || undefined,
          gender: gender || undefined,
          dateOfBirth: dateOfBirth || undefined,
          language: language || undefined,
          isActive,
          photos,
        },
      });

      router.back();
    } catch (e: any) {
      console.error('StudyPartnerProfile save error:', e);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pickAndUploadPhoto = async () => {
    if (!user?.token || photos.length >= MAX_PHOTOS) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to photos to upload.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      const uri = result.assets[0].uri;
      setUploadingPhotoIndex(photos.length);
      const url = await uploadFile(uri, user.token);
      setPhotos(prev => [...prev, url]);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhotoIndex(null);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const dateForPicker = dateOfBirth
    ? new Date(dateOfBirth + 'T12:00:00')
    : new Date(2000, 0, 1);
  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      setDateOfBirth(`${y}-${m}-${d}`);
    }
  };

  return (
    <View style={styles.screen}>
      {!user?.token ? (
        <View style={styles.centered}>
          <Text style={styles.title}>Study Partner Profile</Text>
          <Text style={styles.subtitle}>
            Please login to edit your study partner profile.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: 24 + 80 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
              >
                <Ionicons name="chevron-back" size={26} color="#111827" />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={22} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Section: Photos - at top */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="images" size={22} color="#D97706" />
                </View>
                <Text style={styles.sectionTitle}>Photos *</Text>
              </View>
              <Text style={styles.helperText}>
                At least {MIN_PHOTOS} required, max {MAX_PHOTOS}. Tap box to add from gallery.
              </Text>
              <View style={styles.photosGrid}>
              {[0, 1, 2, 3].map(i => {
                const url = photos[i];
                const isAddSlot = !url && (i === photos.length) && photos.length < MAX_PHOTOS;
                const isUploading = uploadingPhotoIndex === i;
                return (
                  <View key={i} style={styles.photoBoxWrapper}>
                    {url ? (
                      <View style={styles.photoBox}>
                        <Image source={{ uri: url }} style={styles.photoBoxImage} resizeMode="cover" />
                        <TouchableOpacity
                          style={styles.removePhotoBtn}
                          onPress={() => removePhoto(i)}
                        >
                          <Ionicons name="close-circle" size={28} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ) : isAddSlot ? (
                      <TouchableOpacity
                        style={styles.photoBoxAdd}
                        onPress={pickAndUploadPhoto}
                        disabled={uploadingPhotoIndex !== null}
                      >
                        {isUploading ? (
                          <ActivityIndicator size="small" color="#4F46E5" />
                        ) : (
                          <>
                            <Ionicons name="add" size={42} color="#6B7280" />
                            <Text style={styles.photoBoxAddText}>Add</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.photoBoxAdd, styles.photoBoxEmpty]} />
                    )}
                  </View>
                );
              })}
            </View>
            {photos.length > 0 && photos.length < MIN_PHOTOS && (
              <Text style={styles.errorText}>
                Add at least {MIN_PHOTOS} photo to save your profile.
              </Text>
            )}
            </View>

            {/* Section: About you */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="person" size={22} color="#EC4899" />
                </View>
                <Text style={styles.sectionTitle}>About you</Text>
              </View>
              <Text style={styles.helperText}>
                Tell others about your exam, strengths and study style.
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                placeholder=""
                placeholderTextColor="#9CA3AF"
                value={bio}
                onChangeText={setBio}
              />
            </View>

            {/* Section: Exam & goals */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#FDF2F8' }]}>
                  <Ionicons name="school" size={22} color="#DB2777" />
                </View>
                <Text style={styles.sectionTitle}>Exam & goals</Text>
              </View>
              <Text style={styles.label}>Exam type</Text>
              <View style={styles.chipRow}>
                {EXAM_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, examType === type && styles.chipSelected]}
                    onPress={() => setExamType(type)}
                  >
                    <Text style={[styles.chipText, examType === type && styles.chipTextSelected]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Goals</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Clear Tier-1 with 170+ score"
                placeholderTextColor="#9CA3AF"
                value={goals}
                onChangeText={setGoals}
              />
            </View>

            {/* Section: Schedule */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="time" size={22} color="#6366F1" />
                </View>
                <Text style={styles.sectionTitle}>Schedule</Text>
              </View>
              <Text style={styles.label}>Study time slot</Text>
              <View style={styles.chipRow}>
                {STUDY_TIME_SLOTS.map(slot => (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.chip, studyTimeSlot === slot && styles.chipSelected]}
                    onPress={() => setStudyTimeSlot(slot)}
                  >
                    <Text style={[styles.chipText, studyTimeSlot === slot && styles.chipTextSelected]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Preferred study time</Text>
              <View style={styles.timeRow}>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="From (e.g. 06:00)"
                  placeholderTextColor="#9CA3AF"
                  value={studyTimeFrom}
                  onChangeText={setStudyTimeFrom}
                />
                <Text style={styles.toText}>to</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="To (e.g. 09:00)"
                  placeholderTextColor="#9CA3AF"
                  value={studyTimeTo}
                  onChangeText={setStudyTimeTo}
                />
              </View>
            </View>

            {/* Section: About me */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="heart" size={22} color="#059669" />
                </View>
                <Text style={styles.sectionTitle}>About me</Text>
              </View>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.chipRow}>
                {GENDERS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, gender === g && styles.chipSelected]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.chipText, gender === g && styles.chipTextSelected]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Date of birth</Text>
              <TouchableOpacity style={styles.dateInputRow} onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.dateText, !dateOfBirth && styles.datePlaceholder]}>
                  {dateOfBirth || 'Select date (YYYY-MM-DD)'}
                </Text>
                <Ionicons name="calendar-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dateForPicker}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
              <Text style={styles.label}>Language preference</Text>
              <View style={styles.chipRow}>
                {LANGUAGES.map(lang => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.chip, language === lang && styles.chipSelected]}
                    onPress={() => setLanguage(lang)}
                  >
                    <Text style={[styles.chipText, language === lang && styles.chipTextSelected]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Section: Discovery */}
            <View style={styles.sectionCard}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelWrap}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#E0E7FF' }]}>
                    <Ionicons name="eye" size={22} color="#4F46E5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Show me in discovery</Text>
                    <Text style={styles.helperText}>
                      Turn off if you don&apos;t want new people to find you.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#E5E7EB', true: '#A78BFA' }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: 18 + insets.bottom }]}>
            <TouchableOpacity
              style={[styles.saveButtonWrap, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={saving ? ['#9CA3AF', '#6B7280'] : ['#EC4899', '#8B5CF6', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                    <Text style={styles.saveButtonText}>Save profile</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
      <StudyPartnerBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 17,
    color: '#4B5563',
    fontWeight: '500',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    marginTop: 12,
  },
  helperText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
  },
  toText: {
    marginHorizontal: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontSize: 18,
    color: '#111827',
  },
  datePlaceholder: {
    color: '#9CA3AF',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PHOTO_GAP,
    marginTop: 8,
    marginBottom: 8,
  },
  photoBoxWrapper: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
  },
  photoBox: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  photoBoxImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
  },
  photoBoxAdd: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  photoBoxEmpty: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  photoBoxAddText: {
    marginTop: 6,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  chipText: {
    fontSize: 16,
    color: '#4B5563',
  },
  chipTextSelected: {
    color: '#312E81',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  saveButtonWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 10,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 15,
    marginBottom: 8,
  },
});


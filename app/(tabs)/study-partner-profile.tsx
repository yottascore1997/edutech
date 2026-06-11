import StudyPartnerBottomNav from '@/components/StudyPartnerBottomNav';
import { apiFetchAuth, getImageUrl, uploadFile } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { ensurePhotoLibraryPermission } from '@/utils/imagePickerPermissions';
import { Ionicons } from '@expo/vector-icons';
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
  bio?: string | null;
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
  age?: number;
  user?: { name?: string; profilePhoto?: string | null };
};

const EXAM_TYPES = ['Railway', 'SSC CGL', 'SSC CHSL', 'Bank PO', 'Other'];
const LANGUAGES = ['Hindi', 'English', 'Both'];
const STUDY_TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const GENDERS = ['Male', 'Female', 'Other'];
const MAX_PHOTOS = 4;
const MIN_PHOTOS = 1;
const { width: SW } = Dimensions.get('window');
const PHOTO_W = (SW - 32 - 36) / 2.2;

const C = { primary: HomeTheme.primary, ink: HomeTheme.ink, muted: HomeTheme.inkMuted };

function SectionCard({
  icon,
  iconBg,
  iconColor,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={st.sectionCard}>
      <View style={st.sectionHead}>
        <View style={[st.sectionIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={st.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function StudyPartnerProfileScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      if (!user?.token) { setLoading(false); return; }
      setError(null);
      try {
        const res = await apiFetchAuth('/student/study-partner/profile', user.token);
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
        setDateOfBirth(data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '');
        setPhotos(Array.isArray(data.photos) ? [...data.photos] : []);
        setIsActive(data.isActive !== false);
      } catch {
        if (isMounted) setError('Unable to load profile. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [user?.token]);

  const handleSave = async () => {
    if (!user?.token) return;
    if (!bio.trim()) { setError('Please add a short bio about yourself.'); return; }
    if (photos.length < MIN_PHOTOS) {
      setError(`At least ${MIN_PHOTOS} photo is required (max ${MAX_PHOTOS}).`);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
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
      setSuccess('Profile saved successfully!');
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pickAndUploadPhoto = async () => {
    if (!user?.token || photos.length >= MAX_PHOTOS) return;
    try {
      if (!(await ensurePhotoLibraryPermission('Please allow access to photos to upload.'))) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      setUploadingPhotoIndex(photos.length);
      const url = await uploadFile(result.assets[0].uri, user.token);
      setPhotos((prev) => [...prev, url]);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhotoIndex(null);
    }
  };

  const removePhoto = (index: number) => setPhotos(photos.filter((_, i) => i !== index));

  const dateForPicker = dateOfBirth ? new Date(dateOfBirth + 'T12:00:00') : new Date(2000, 0, 1);
  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      setDateOfBirth(`${y}-${m}-${d}`);
    }
  };

  const renderChips = (items: string[], selected: string, onSelect: (v: string) => void) => (
    <View style={st.chipRow}>
      {items.map((item) => (
        <TouchableOpacity
          key={item}
          style={[st.chip, selected === item && st.chipOn]}
          onPress={() => onSelect(item)}
          activeOpacity={0.85}
        >
          <Text style={[st.chipTxt, selected === item && st.chipTxtOn]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={st.screen}>
      <LinearGradient colors={['#FFFBF7', '#F8F4FF', '#FAFAFF']} style={StyleSheet.absoluteFill} />

      {!user?.token ? (
        <View style={st.centered}>
          <Text style={st.emptyTitle}>My Profile</Text>
          <Text style={st.emptySub}>Please login to edit your study partner profile.</Text>
        </View>
      ) : loading ? (
        <View style={st.centered}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={st.loadingTxt}>Loading profile…</Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={st.scroll}
            contentContainerStyle={[st.content, { paddingTop: insets.top + 8, paddingBottom: 120 + insets.bottom }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error ? (
              <View style={st.errorCard}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={st.errorTxt}>{error}</Text>
              </View>
            ) : null}
            {success ? (
              <View style={st.successCard}>
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                <Text style={st.successTxt}>{success}</Text>
              </View>
            ) : null}

            {/* Photos */}
            <SectionCard icon="images" iconBg="#FEF3C7" iconColor="#D97706" title="Photos">
              <Text style={st.helper}>Min {MIN_PHOTOS}, max {MAX_PHOTOS}. First photo is your main picture.</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.photoRow}>
                {photos.map((url, i) => (
                  <View key={i} style={st.photoSlot}>
                    <Image source={{ uri: url.startsWith('http') ? url : getImageUrl(url) }} style={st.photoImg} />
                    {i === 0 ? (
                      <View style={st.mainBadge}><Text style={st.mainBadgeTxt}>Main</Text></View>
                    ) : null}
                    <TouchableOpacity style={st.removeBtn} onPress={() => removePhoto(i)}>
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                {photos.length < MAX_PHOTOS ? (
                  <TouchableOpacity
                    style={st.addPhoto}
                    onPress={pickAndUploadPhoto}
                    disabled={uploadingPhotoIndex !== null}
                    activeOpacity={0.85}
                  >
                    {uploadingPhotoIndex !== null ? (
                      <ActivityIndicator color={C.primary} />
                    ) : (
                      <>
                        <Ionicons name="camera" size={28} color={C.primary} />
                        <Text style={st.addPhotoTxt}>Add Photo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}
              </ScrollView>
            </SectionCard>

            <SectionCard icon="person" iconBg="#F3EEFF" iconColor={C.primary} title="About you">
              <Text style={st.helper}>Tell buddies about your exam prep & study style.</Text>
              <TextInput
                style={[st.input, st.textArea]}
                multiline
                placeholder="Write a short bio…"
                placeholderTextColor={C.muted}
                value={bio}
                onChangeText={setBio}
              />
            </SectionCard>

            <SectionCard icon="school" iconBg="#FDF2F8" iconColor="#DB2777" title="Exam & goals">
              <Text style={st.label}>Exam type</Text>
              {renderChips(EXAM_TYPES, examType, setExamType)}
              <Text style={st.label}>Goals</Text>
              <TextInput
                style={st.input}
                placeholder="e.g. Clear Tier-1 with 170+ score"
                placeholderTextColor={C.muted}
                value={goals}
                onChangeText={setGoals}
              />
            </SectionCard>

            <SectionCard icon="time" iconBg="#EEF2FF" iconColor="#6366F1" title="Schedule">
              <Text style={st.label}>Study time slot</Text>
              {renderChips(STUDY_TIME_SLOTS, studyTimeSlot, setStudyTimeSlot)}
              <Text style={st.label}>Preferred time</Text>
              <View style={st.timeRow}>
                <TextInput
                  style={[st.input, st.timeInput]}
                  placeholder="From 06:00"
                  placeholderTextColor={C.muted}
                  value={studyTimeFrom}
                  onChangeText={setStudyTimeFrom}
                />
                <Text style={st.toTxt}>to</Text>
                <TextInput
                  style={[st.input, st.timeInput]}
                  placeholder="To 09:00"
                  placeholderTextColor={C.muted}
                  value={studyTimeTo}
                  onChangeText={setStudyTimeTo}
                />
              </View>
            </SectionCard>

            <SectionCard icon="heart" iconBg="#D1FAE5" iconColor="#059669" title="Personal">
              <Text style={st.label}>Gender</Text>
              {renderChips(GENDERS, gender, setGender)}
              <Text style={st.label}>Date of birth</Text>
              <TouchableOpacity style={st.dateRow} onPress={() => setShowDatePicker(true)}>
                <Text style={[st.dateTxt, !dateOfBirth && st.datePlaceholder]}>
                  {dateOfBirth || 'Select date'}
                </Text>
                <Ionicons name="calendar-outline" size={22} color={C.muted} />
              </TouchableOpacity>
              {showDatePicker ? (
                <DateTimePicker
                  value={dateForPicker}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              ) : null}
              <Text style={st.label}>Language</Text>
              {renderChips(LANGUAGES, language, setLanguage)}
            </SectionCard>

            <View style={st.sectionCard}>
              <View style={st.toggleRow}>
                <View style={st.toggleLeft}>
                  <View style={[st.sectionIcon, { backgroundColor: '#E0E7FF' }]}>
                    <Ionicons name="eye" size={20} color="#4F46E5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.toggleTitle}>Show in discovery</Text>
                    <Text style={st.helper}>Turn off to hide from new people.</Text>
                  </View>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
          </ScrollView>

          <View style={[st.footer, { paddingBottom: 72 + insets.bottom }]}>
            <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.9} style={st.saveWrap}>
              <LinearGradient
                colors={saving ? ['#C4B5FD', '#A78BFA'] : [...HomeTheme.heroCta]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={st.saveBtn}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                    <Text style={st.saveTxt}>Save Profile</Text>
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

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFF' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 22, fontFamily: FontFamily.bold, color: C.ink },
  emptySub: { fontSize: 14, fontFamily: FontFamily.regular, color: C.muted, marginTop: 8, textAlign: 'center' },
  loadingTxt: { marginTop: 12, fontSize: 14, fontFamily: FontFamily.medium, color: C.muted },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorTxt: { flex: 1, fontSize: 13, fontFamily: FontFamily.medium, color: '#DC2626' },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successTxt: { flex: 1, fontSize: 13, fontFamily: FontFamily.medium, color: '#059669' },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#6344D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 17, fontFamily: FontFamily.bold, color: C.ink },
  helper: { fontSize: 13, fontFamily: FontFamily.regular, color: C.muted, marginBottom: 10 },
  label: { fontSize: 14, fontFamily: FontFamily.semiBold, color: C.ink, marginTop: 10, marginBottom: 8 },
  input: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: C.ink,
    backgroundColor: '#F8F9FC',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  photoRow: { gap: 12, paddingVertical: 4 },
  photoSlot: {
    width: PHOTO_W,
    height: PHOTO_W * 1.2,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImg: { width: '100%', height: '100%' },
  mainBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mainBadgeTxt: { fontSize: 10, fontFamily: FontFamily.bold, color: '#FFF' },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },
  addPhoto: {
    width: PHOTO_W,
    height: PHOTO_W * 1.2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#C4B5FD',
    borderStyle: 'dashed',
    backgroundColor: '#F8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addPhotoTxt: { fontSize: 12, fontFamily: FontFamily.semiBold, color: C.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8E8F0',
    backgroundColor: '#FFF',
  },
  chipOn: { borderColor: C.primary, backgroundColor: '#F3EEFF' },
  chipTxt: { fontSize: 13, fontFamily: FontFamily.medium, color: C.muted },
  chipTxtOn: { color: C.primary, fontFamily: FontFamily.bold },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeInput: { flex: 1 },
  toTxt: { marginHorizontal: 8, fontSize: 14, fontFamily: FontFamily.medium, color: C.muted },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8F9FC',
  },
  dateTxt: { fontSize: 15, fontFamily: FontFamily.medium, color: C.ink },
  datePlaceholder: { color: C.muted },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  toggleTitle: { fontSize: 15, fontFamily: FontFamily.semiBold, color: C.ink },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EDE9FE',
  },
  saveWrap: { borderRadius: 16, overflow: 'hidden' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveTxt: { fontSize: 16, fontFamily: FontFamily.bold, color: '#FFF' },
});

import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, MapPin, Star, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAD = 16;
const CARD_HEIGHT = 440;
const SLIDE_WIDTH = SCREEN_WIDTH - PAD * 2;
const PRIMARY = HomeTheme.primary;

function StatChip({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={chipStyles.wrap}>
      <View style={chipStyles.icon}>
        <Ionicons name={icon} size={16} color={PRIMARY} />
      </View>
      <Text style={chipStyles.label}>{label}</Text>
      <Text style={chipStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={detailStyles.row}>
      <LinearGradient colors={['#F3EEFF', '#EDE9FE']} style={detailStyles.iconWrap}>
        <Ionicons name={icon} size={18} color={PRIMARY} />
      </LinearGradient>
      <View style={detailStyles.rowText}>
        <Text style={detailStyles.rowLabel}>{label}</Text>
        <Text style={detailStyles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function StudyPartnerLikedUserScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    userId?: string;
    name?: string;
    profilePhoto?: string;
    age?: string;
    examType?: string;
    matchPct?: string;
    fromMatchOrChat?: string;
  }>();

  const userId = params.userId || '';
  const fromMatchOrChat = params.fromMatchOrChat === 'true';
  const matchPct = params.matchPct ? Number(params.matchPct) : null;

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [spProfile, setSpProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photoListRef = useRef<FlatList>(null);

  const fallbackProfile = useMemo(() => ({
    id: userId,
    name: params.name,
    profilePhoto: params.profilePhoto,
    age: params.age ? Number(params.age) : undefined,
    examType: params.examType,
  }), [params.age, params.examType, params.name, params.profilePhoto, userId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.token || !userId) {
        setLoading(false);
        setProfile(fallbackProfile);
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const res = await apiFetchAuth(`/student/profile?userId=${userId}`, user.token);
        if (!mounted) return;
        if (res.ok) {
          const data = res.data || {};
          setProfile(data);
          const fromProfile = Array.isArray(data.photos)
            ? data.photos
            : data.profilePhoto
              ? [data.profilePhoto]
              : [];
          if (fromProfile.length > 0) setPhotos(fromProfile);
          else if (data.profilePhoto) setPhotos([data.profilePhoto]);
        } else {
          setProfile(fallbackProfile);
          setError('Unable to load full profile.');
        }
        try {
          const spRes = await apiFetchAuth(`/student/study-partner/profile?userId=${userId}`, user.token);
          if (mounted && spRes?.ok) {
            const spData = spRes.data || {};
            setSpProfile(spData);
            const spPhotos = Array.isArray(spData.photos) ? spData.photos : [];
            if (spPhotos.length > 0) setPhotos(spPhotos);
          }
        } catch (_) {}
      } catch {
        if (!mounted) return;
        setProfile(fallbackProfile);
        setError('Unable to load full profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [fallbackProfile, user?.token, userId]);

  const displayName = profile?.name || fallbackProfile.name || 'User';
  const displayPhoto = profile?.profilePhoto || fallbackProfile.profilePhoto || '';
  const displayPhotos = photos.length > 0 ? photos : displayPhoto ? [displayPhoto] : [];

  useEffect(() => { setPhotoIndex(0); }, [displayPhotos.length]);

  const displayBio = spProfile?.bio || profile?.bio || profile?.about || profile?.description || '';
  const displayAge = spProfile?.age ?? profile?.age ?? fallbackProfile.age;
  const displayLanguage = spProfile?.language || profile?.language;
  const displayExamType = spProfile?.examType || profile?.examType || fallbackProfile.examType;
  const displayGoals = spProfile?.goals || '';
  const displayStudySlot = spProfile?.studyTimeSlot || '';
  const displayGender = spProfile?.gender || '';
  const displayStudyTimeFrom = spProfile?.studyTimeFrom || profile?.studyTimeFrom;
  const displayStudyTimeTo = spProfile?.studyTimeTo || profile?.studyTimeTo;
  const displaySubjects = Array.isArray(spProfile?.subjects) ? spProfile.subjects : [];

  const studyTimeLabel =
    displayStudyTimeFrom && displayStudyTimeTo
      ? `${displayStudyTimeFrom} – ${displayStudyTimeTo}`
      : displayStudySlot || 'Not set';

  const interestTags = useMemo(() => {
    const tags: string[] = [];
    if (displayExamType) tags.push(displayExamType.split(' ')[0] || displayExamType);
    if (displayLanguage) tags.push(displayLanguage);
    if (displaySubjects.length) tags.push(...displaySubjects.slice(0, 2));
    return tags.slice(0, 4);
  }, [displayExamType, displayLanguage, displaySubjects]);

  const openChat = () => {
    router.push({
      pathname: '/(tabs)/chat-screen',
      params: {
        userId,
        userName: displayName,
        userProfilePhoto: displayPhoto || '',
        isFollowing: 'true',
      },
    } as any);
  };

  const sendAction = async (action: 'like' | 'pass') => {
    if (!user?.token || !userId || actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await apiFetchAuth('/student/study-partner/like', user.token, {
        method: 'POST',
        body: { targetUserId: userId, action },
      });
      const data = res.data as any;
      if (action === 'like' && data?.newMatch) {
        router.push({
          pathname: '/(tabs)/study-partner-match',
          params: {
            otherUserId: userId,
            otherName: displayName,
            otherPhoto: displayPhoto || '',
          },
        } as any);
        return;
      }
      router.back();
    } catch {
      setError('Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const scrollToPhoto = (index: number) => {
    setPhotoIndex(index);
    photoListRef.current?.scrollToOffset({ offset: index * SLIDE_WIDTH, animated: true });
  };

  const renderPhotoSlide = (item: string) => {
    const uri = item.startsWith('http') ? item : getImageUrl(item);
    return (
      <View style={styles.slide}>
        <ImageBackground source={{ uri }} style={styles.photo} imageStyle={styles.photoImage}>
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} style={styles.topGrad} />
          <View style={styles.topRow}>
            {matchPct != null && !Number.isNaN(matchPct) ? (
              <LinearGradient colors={['#FDE047', '#FBBF24']} style={styles.matchPill}>
                <Star size={10} color="#78350F" fill="#78350F" />
                <Text style={styles.matchPillTxt}>{matchPct}% Match</Text>
              </LinearGradient>
            ) : (
              <View style={styles.verifiedPill}>
                <Ionicons name="shield-checkmark" size={12} color="#22C55E" />
                <Text style={styles.verifiedTxt}>Verified</Text>
              </View>
            )}
            {displayPhotos.length > 1 ? (
              <View style={styles.countPill}>
                <Text style={styles.countPillTxt}>{photoIndex + 1}/{displayPhotos.length}</Text>
              </View>
            ) : null}
          </View>

          {interestTags.length > 0 ? (
            <View style={styles.interestCol}>
              {interestTags.map((t) => (
                <View key={t} style={styles.interestPill}>
                  <Text style={styles.interestPillTxt}>{t}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <LinearGradient
            colors={['transparent', 'rgba(15,10,30,0.92)']}
            style={styles.bottomGrad}
          >
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{displayName}</Text>
              {displayAge ? <Text style={styles.ageText}>, {displayAge}</Text> : null}
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" style={{ marginLeft: 6 }} />
            </View>
            {displayExamType ? (
              <View style={styles.goalBadge}>
                <Text style={styles.goalBadgeTxt}>{displayExamType}</Text>
              </View>
            ) : null}
            {displayLanguage ? (
              <View style={styles.locRow}>
                <MapPin size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.locTxt}>{displayLanguage}</Text>
              </View>
            ) : null}
            {displayBio ? (
              <Text style={styles.bioText} numberOfLines={2}>{displayBio}</Text>
            ) : null}
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#FFFBF7', '#F8F4FF', '#FAFAFF']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 8, paddingBottom: (fromMatchOrChat ? 100 : 130) + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={22} color={HomeTheme.ink} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{fromMatchOrChat ? 'Study Buddy' : 'Profile'}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{displayName}</Text>
          </View>
          {fromMatchOrChat ? (
            <TouchableOpacity style={styles.chatBtn} onPress={openChat} activeOpacity={0.85}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Loading profile…</Text>
          </View>
        ) : (
          <>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Photo card */}
            <View style={styles.cardWrap}>
              <View style={styles.card}>
                {displayPhotos.length > 0 ? (
                  <>
                    <FlatList
                      ref={photoListRef}
                      data={displayPhotos}
                      keyExtractor={(_, i) => `photo-${i}`}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(e) => {
                        const i = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
                        setPhotoIndex(Math.min(i, displayPhotos.length - 1));
                      }}
                      getItemLayout={(_, index) => ({
                        length: SLIDE_WIDTH,
                        offset: SLIDE_WIDTH * index,
                        index,
                      })}
                      renderItem={({ item }) => renderPhotoSlide(item)}
                    />
                    {photoIndex > 0 ? (
                      <TouchableOpacity
                        style={[styles.sliderArrow, styles.sliderArrowLeft]}
                        onPress={() => scrollToPhoto(photoIndex - 1)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="chevron-back" size={26} color="#FFF" />
                      </TouchableOpacity>
                    ) : null}
                    {photoIndex < displayPhotos.length - 1 ? (
                      <TouchableOpacity
                        style={[styles.sliderArrow, styles.sliderArrowRight]}
                        onPress={() => scrollToPhoto(photoIndex + 1)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="chevron-forward" size={26} color="#FFF" />
                      </TouchableOpacity>
                    ) : null}
                  </>
                ) : (
                  <LinearGradient colors={['#C4B5FD', '#8E78E7', PRIMARY]} style={styles.photo}>
                    <Text style={styles.initial}>{displayName.charAt(0)}</Text>
                    <LinearGradient colors={['transparent', 'rgba(15,10,30,0.9)']} style={styles.bottomGrad}>
                      <Text style={styles.nameText}>{displayName}</Text>
                    </LinearGradient>
                  </LinearGradient>
                )}
              </View>
            </View>

            {/* Photo thumbnails */}
            {displayPhotos.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
                {displayPhotos.map((p, i) => {
                  const uri = p.startsWith('http') ? p : getImageUrl(p);
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => scrollToPhoto(i)}
                      style={[styles.thumb, i === photoIndex && styles.thumbActive]}
                      activeOpacity={0.9}
                    >
                      <Image source={{ uri }} style={styles.thumbImg} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* Quick stats */}
            <View style={styles.statsRow}>
              <StatChip icon="school-outline" label="Exam" value={displayExamType || '—'} />
              <StatChip icon="calendar-outline" label="Age" value={displayAge ? `${displayAge} yrs` : '—'} />
              <StatChip icon="language-outline" label="Language" value={displayLanguage || '—'} />
              <StatChip icon="time-outline" label="Study" value={studyTimeLabel} />
            </View>

            {/* Details card */}
            <View style={styles.detailsCard}>
              <View style={styles.detailsHead}>
                <LinearGradient colors={[...HomeTheme.btnGradient]} style={styles.detailsIcon}>
                  <Ionicons name="person" size={16} color="#FFF" />
                </LinearGradient>
                <Text style={styles.detailsTitle}>About {displayName.split(' ')[0]}</Text>
              </View>

              {displayBio ? (
                <View style={styles.aboutBox}>
                  <Text style={styles.aboutText}>{displayBio}</Text>
                </View>
              ) : null}

              <DetailRow icon="school-outline" label="Preparing for" value={displayExamType || 'Not set'} />
              <DetailRow icon="flag-outline" label="Goals" value={displayGoals || 'Not set'} />
              <DetailRow icon="time-outline" label="Study time" value={studyTimeLabel} />
              {displayGender ? (
                <DetailRow icon="person-outline" label="Gender" value={displayGender} />
              ) : null}

              {displaySubjects.length > 0 ? (
                <View style={styles.subjectsBlock}>
                  <Text style={styles.subjectsLabel}>Subjects</Text>
                  <View style={styles.subjectsRow}>
                    {displaySubjects.map((s: string) => (
                      <View key={s} style={styles.subjectChip}>
                        <Text style={styles.subjectChipText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>

            {/* Like / Pass */}
            {!fromMatchOrChat ? (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actBtnPass}
                  onPress={() => sendAction('pass')}
                  disabled={actionLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient colors={['#FFFFFF', '#F8F4FF']} style={styles.actBtnInner}>
                    <X size={26} color={PRIMARY} strokeWidth={2.5} />
                  </LinearGradient>
                  <Text style={styles.actLblPass}>Pass</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actBtnLike}
                  onPress={() => sendAction('like')}
                  disabled={actionLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient colors={['#F472B6', '#EC4899', '#DB2777']} style={styles.actBtnLikeGrad}>
                    {actionLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Heart size={28} color="#FFF" fill="#FFF" strokeWidth={2} />
                    )}
                  </LinearGradient>
                  <Text style={styles.actLblLike}>Like</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {fromMatchOrChat && !loading ? (
        <View style={[styles.bottomBar, { paddingBottom: 12 + insets.bottom }]}>
          <TouchableOpacity onPress={openChat} activeOpacity={0.9} style={styles.messageBtnWrap}>
            <LinearGradient
              colors={[...HomeTheme.heroCta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.messageBtn}
            >
              <Ionicons name="chatbubbles" size={22} color="#fff" />
              <Text style={styles.messageBtnText}>Send Message</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 10, fontFamily: FontFamily.medium, color: HomeTheme.inkMuted },
  value: { fontSize: 11, fontFamily: FontFamily.bold, color: HomeTheme.ink, marginTop: 2, textAlign: 'center' },
});

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 11, fontFamily: FontFamily.medium, color: HomeTheme.inkMuted, marginBottom: 2 },
  rowValue: { fontSize: 15, fontFamily: FontFamily.bold, color: HomeTheme.ink },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFF' },
  scroll: { paddingHorizontal: PAD },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSpacer: { width: 42 },
  headerTitle: { fontSize: 17, fontFamily: FontFamily.bold, color: HomeTheme.ink },
  headerSub: { fontSize: 12, fontFamily: FontFamily.medium, color: HomeTheme.inkMuted, marginTop: 2 },
  chatBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { alignItems: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 12, fontSize: 14, fontFamily: FontFamily.medium, color: HomeTheme.inkMuted },
  errorText: { color: '#DC2626', fontSize: 13, fontFamily: FontFamily.medium, marginBottom: 8, textAlign: 'center' },
  cardWrap: {
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 14,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    height: CARD_HEIGHT,
    width: SLIDE_WIDTH,
  },
  slide: { width: SLIDE_WIDTH, height: CARD_HEIGHT },
  photo: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoImage: { borderRadius: 24 },
  initial: { fontSize: 72, fontFamily: FontFamily.extraBold, color: 'rgba(255,255,255,0.5)' },
  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  topRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  matchPillTxt: { fontSize: 11, fontFamily: FontFamily.bold, color: '#78350F' },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedTxt: { fontSize: 11, fontFamily: FontFamily.semiBold, color: '#FFF' },
  countPill: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countPillTxt: { color: '#FFF', fontSize: 11, fontFamily: FontFamily.bold },
  interestCol: { position: 'absolute', right: 12, top: '28%', gap: 6 },
  interestPill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  interestPillTxt: { fontSize: 10, fontFamily: FontFamily.semiBold, color: HomeTheme.ink },
  bottomGrad: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 60,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  nameText: { fontSize: 26, fontFamily: FontFamily.extraBold, color: '#FFF' },
  ageText: { fontSize: 22, fontFamily: FontFamily.bold, color: 'rgba(255,255,255,0.9)' },
  goalBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(99,68,212,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  goalBadgeTxt: { fontSize: 12, fontFamily: FontFamily.semiBold, color: '#FFF' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  locTxt: { fontSize: 12, fontFamily: FontFamily.medium, color: 'rgba(255,255,255,0.9)' },
  bioText: { marginTop: 8, fontSize: 13, fontFamily: FontFamily.regular, color: 'rgba(255,255,255,0.85)', lineHeight: 19 },
  sliderArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderArrowLeft: { left: 10 },
  sliderArrowRight: { right: 10 },
  thumbScroll: { marginBottom: 14 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: { borderColor: PRIMARY },
  thumbImg: { width: '100%', height: '100%' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  detailsHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  detailsIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsTitle: { fontSize: 18, fontFamily: FontFamily.extraBold, color: HomeTheme.ink },
  aboutBox: {
    backgroundColor: '#F8F4FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
  },
  aboutText: { fontSize: 14, fontFamily: FontFamily.regular, color: HomeTheme.inkSecondary, lineHeight: 22 },
  subjectsBlock: { marginTop: 8 },
  subjectsLabel: { fontSize: 12, fontFamily: FontFamily.bold, color: HomeTheme.inkMuted, marginBottom: 8 },
  subjectsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectChip: {
    backgroundColor: '#F3EEFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  subjectChipText: { fontSize: 13, fontFamily: FontFamily.semiBold, color: PRIMARY },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 36,
    marginBottom: 8,
  },
  actBtnPass: { alignItems: 'center', gap: 6 },
  actBtnLike: { alignItems: 'center', gap: 6 },
  actBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  actBtnLikeGrad: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actLblPass: { fontSize: 12, fontFamily: FontFamily.semiBold, color: HomeTheme.inkMuted },
  actLblLike: { fontSize: 12, fontFamily: FontFamily.semiBold, color: '#EC4899' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: PAD,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EDE9FE',
  },
  messageBtnWrap: { borderRadius: 16, overflow: 'hidden' },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  messageBtnText: { fontSize: 16, fontFamily: FontFamily.bold, color: '#FFF' },
});

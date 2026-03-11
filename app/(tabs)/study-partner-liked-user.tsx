import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = 440;
const SLIDE_WIDTH = SCREEN_WIDTH - 32 - 8;

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
    fromMatchOrChat?: string;
  }>();

  const userId = params.userId || '';
  const fromMatchOrChat = params.fromMatchOrChat === 'true';

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const photoListRef = useRef<FlatList>(null);

  const fallbackProfile = useMemo(() => {
    return {
      id: userId,
      name: params.name,
      profilePhoto: params.profilePhoto,
      age: params.age ? Number(params.age) : undefined,
      examType: params.examType,
    };
  }, [params.age, params.examType, params.name, params.profilePhoto, userId]);

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
        // General profile
        const res = await apiFetchAuth(`/student/profile?userId=${userId}`, user.token);
        if (!mounted) return;
        if (res.ok) {
          const data = res.data || {};
          setProfile(data);
          const fromProfile = Array.isArray(data.photos) ? data.photos : (data.profilePhoto ? [data.profilePhoto] : []);
          if (fromProfile.length > 0) {
            setPhotos(fromProfile);
          } else if (data.profilePhoto) {
            setPhotos([data.profilePhoto]);
          }
        } else {
          setProfile(fallbackProfile);
          setError('Unable to load full profile.');
        }
        // Study-partner profile for more photos (same as Profile screen)
        try {
          const spRes = await apiFetchAuth(`/student/study-partner/profile?userId=${userId}`, user.token);
          if (mounted && spRes?.ok) {
            const spData = spRes.data || {};
            const spPhotos = Array.isArray(spData.photos) ? spData.photos : [];
            if (spPhotos.length > 0) {
              setPhotos(spPhotos);
            }
          }
        } catch (_) {}
      } catch (e: any) {
        if (!mounted) return;
        console.error('StudyPartnerLikedUser load error:', e);
        setProfile(fallbackProfile);
        setError('Unable to load full profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [fallbackProfile, user?.token, userId]);

  const displayName = profile?.name || fallbackProfile.name || 'User';
  const displayPhoto = profile?.profilePhoto || fallbackProfile.profilePhoto || '';
  const displayPhotos = photos.length > 0 ? photos : (displayPhoto ? [displayPhoto] : []);

  useEffect(() => {
    setPhotoIndex(0);
  }, [displayPhotos.length]);

  const displayExamType = profile?.examType || fallbackProfile.examType;
  const displayBio = profile?.bio || profile?.about || profile?.description || '';
  const displayAge = profile?.age || fallbackProfile.age;
  const displayLanguage = profile?.language;
  const displayStudyTimeFrom = profile?.studyTimeFrom;
  const displayStudyTimeTo = profile?.studyTimeTo;

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
    } catch (e: any) {
      console.error('StudyPartnerLikedUser action error:', e);
      setError('Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[
          styles.scrollContentContainer,
          { paddingTop: 10 + insets.top, paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row with back + title (Discover style) */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>{fromMatchOrChat ? 'Profile' : 'Discover'}</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Discover card (same look) */}
            <View style={styles.cardShadowWrapper}>
              <TouchableOpacity
                style={styles.detailsArrowBtn}
                activeOpacity={0.9}
                onPress={() => setDetailsOpen(v => !v)}
                disabled={actionLoading}
              >
                <Ionicons
                  name={detailsOpen ? 'chevron-down' : 'chevron-up'}
                  size={22}
                  color="#111827"
                />
              </TouchableOpacity>

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
                      renderItem={({ item }) => {
                        const uri = item.startsWith('http') ? item : getImageUrl(item);
                        return (
                          <View style={styles.slide}>
                            <ImageBackground
                              source={{ uri }}
                              style={styles.photo}
                              imageStyle={styles.photoImage}
                            >
                              <LinearGradient
                                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.85)']}
                                start={{ x: 0, y: 0.4 }}
                                end={{ x: 0, y: 1 }}
                                style={styles.photoOverlay}
                              >
                                <View style={styles.nameRow}>
                                  <Text style={styles.nameText}>{displayName}</Text>
                                </View>
                                <View style={styles.badgeRow}>
                                  {displayExamType ? (
                                    <View style={styles.badge}>
                                      <Text style={styles.badgeText}>{displayExamType}</Text>
                                    </View>
                                  ) : null}
                                  {displayLanguage ? (
                                    <View style={styles.badge}>
                                      <Text style={styles.badgeText}>{displayLanguage}</Text>
                                    </View>
                                  ) : null}
                                  {displayStudyTimeFrom && displayStudyTimeTo ? (
                                    <View style={styles.badge}>
                                      <Text style={styles.badgeText}>
                                        {displayStudyTimeFrom} - {displayStudyTimeTo}
                                      </Text>
                                    </View>
                                  ) : null}
                                  {displayAge ? (
                                    <View style={styles.badge}>
                                      <Text style={styles.badgeText}>{displayAge} yrs</Text>
                                    </View>
                                  ) : null}
                                </View>
                                {displayBio ? (
                                  <Text style={styles.bioText} numberOfLines={2}>
                                    {displayBio}
                                  </Text>
                                ) : null}
                              </LinearGradient>
                            </ImageBackground>
                          </View>
                        );
                      }}
                    />
                    {displayPhotos.length > 1 ? (
                      <>
                        {photoIndex > 0 ? (
                          <TouchableOpacity
                            style={[styles.sliderArrow, styles.sliderArrowLeft]}
                            onPress={() => {
                              const next = photoIndex - 1;
                              setPhotoIndex(next);
                              photoListRef.current?.scrollToOffset({
                                offset: next * SLIDE_WIDTH,
                                animated: true,
                              });
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="chevron-back" size={28} color="#FFF" />
                          </TouchableOpacity>
                        ) : null}
                        {photoIndex < displayPhotos.length - 1 ? (
                          <TouchableOpacity
                            style={[styles.sliderArrow, styles.sliderArrowRight]}
                            onPress={() => {
                              const next = photoIndex + 1;
                              setPhotoIndex(next);
                              photoListRef.current?.scrollToOffset({
                                offset: next * SLIDE_WIDTH,
                                animated: true,
                              });
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="chevron-forward" size={28} color="#FFF" />
                          </TouchableOpacity>
                        ) : null}
                        <View style={styles.dotsRow}>
                          {displayPhotos.map((_, i) => (
                            <View
                              key={i}
                              style={[
                                styles.dot,
                                i === photoIndex && styles.dotActive,
                              ]}
                            />
                          ))}
                        </View>
                      </>
                    ) : null}
                  </>
                ) : (
                  <LinearGradient
                    colors={['#e0e7ff', '#a5b4fc']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.photo, styles.photoOverlay]}
                  >
                    <View style={styles.nameRow}>
                      <Text style={styles.nameText}>{displayName}</Text>
                    </View>
                    <View style={styles.badgeRow}>
                      {displayExamType ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{displayExamType}</Text>
                        </View>
                      ) : null}
                      {displayLanguage ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{displayLanguage}</Text>
                        </View>
                      ) : null}
                      {displayStudyTimeFrom && displayStudyTimeTo ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {displayStudyTimeFrom} - {displayStudyTimeTo}
                          </Text>
                        </View>
                      ) : null}
                      {displayAge ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{displayAge} yrs</Text>
                        </View>
                      ) : null}
                    </View>
                    {displayBio ? (
                      <Text style={styles.bioText} numberOfLines={3}>
                        {displayBio}
                      </Text>
                    ) : null}
                  </LinearGradient>
                )}
              </View>
            </View>

            {/* Inline details (same as Discover inline details) */}
            {detailsOpen && (
              <View style={styles.inlineDetailsCard}>
                <Text style={styles.inlineTitle}>Details</Text>

                <View style={styles.inlineRow}>
                  <Ionicons name="person" size={16} color="#374151" />
                  <Text style={styles.inlineText}>{displayName}</Text>
                </View>
                <View style={styles.inlineRow}>
                  <Ionicons name="school" size={16} color="#374151" />
                  <Text style={styles.inlineText}>{displayExamType || 'Exam not set'}</Text>
                </View>
                <View style={styles.inlineRow}>
                  <Ionicons name="language" size={16} color="#374151" />
                  <Text style={styles.inlineText}>{displayLanguage || 'Language not set'}</Text>
                </View>
                <View style={styles.inlineRow}>
                  <Ionicons name="time" size={16} color="#374151" />
                  <Text style={styles.inlineText}>
                    {displayStudyTimeFrom && displayStudyTimeTo
                      ? `${displayStudyTimeFrom} - ${displayStudyTimeTo}`
                      : 'Study time not set'}
                  </Text>
                </View>

                {displayBio ? (
                  <View style={styles.inlineBioBox}>
                    <Text style={styles.inlineBioTitle}>About</Text>
                    <Text style={styles.inlineBioText}>{displayBio}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Bottom actions like Tinder (X / Heart) – only when coming from discovery / liked list */}
            {!fromMatchOrChat && (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.passButton]}
                  activeOpacity={0.9}
                  onPress={() => sendAction('pass')}
                  disabled={actionLoading}
                >
                  <Ionicons name="close" size={32} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.likeButton]}
                  activeOpacity={0.9}
                  onPress={() => sendAction('like')}
                  disabled={actionLoading}
                >
                  <Ionicons name="heart" size={32} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { flex: 1 },
  scrollContentContainer: { flexGrow: 1, paddingHorizontal: 16 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#4B5563', fontWeight: '500' },
  errorText: { color: '#DC2626', fontSize: 13, marginBottom: 8 },
  cardShadowWrapper: {
    marginTop: 8,
    marginHorizontal: 4,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  detailsArrowBtn: {
    position: 'absolute',
    right: 12,
    top: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    height: CARD_HEIGHT,
    width: SLIDE_WIDTH,
  },
  slide: {
    width: SLIDE_WIDTH,
    height: CARD_HEIGHT,
  },
  photo: { flex: 1 },
  photoImage: { borderRadius: 24, resizeMode: 'cover' },
  photoOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end' },
  nameText: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.7)',
    marginRight: 6,
    marginBottom: 4,
    maxWidth: SCREEN_WIDTH - 32,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#E5E7EB' },
  bioText: { marginTop: 8, fontSize: 13, color: '#E5E7EB' },
  inlineDetailsCard: {
    marginTop: 12,
    marginHorizontal: 4,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  inlineTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    marginTop: 10,
  },
  inlineText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  inlineBioBox: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
  },
  inlineBioTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9A3412',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inlineBioText: { fontSize: 14, color: '#7C2D12', lineHeight: 20, fontWeight: '500' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 26,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  passButton: { backgroundColor: '#FEE2E2' },
  likeButton: { backgroundColor: '#EC4899' },
  sliderArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderArrowLeft: { left: 8 },
  sliderArrowRight: { right: 8 },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#FFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});


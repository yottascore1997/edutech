import StudyPartnerBottomNav from '@/components/StudyPartnerBottomNav';
import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ImageBackground,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BOTTOM_NAV_HEIGHT = 80;
const SWIPE_THRESHOLD = 80;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DiscoveryProfile = {
  id: string;
  userId: string;
  name: string;
  profilePhoto?: string | null;
  photos?: string[] | null;
  bio?: string | null;
  examType?: string | null;
  language?: string | null;
  studyTimeFrom?: string | null;
  studyTimeTo?: string | null;
};

export default function StudyPartnerDiscoverScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsSectionY, setDetailsSectionY] = useState<number | null>(null);
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const cardRotate = useRef(new Animated.Value(0)).current;
  const [lastAction, setLastAction] = useState<'like' | 'pass' | null>(null);
  const lastActionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset card position when profile changes
  useEffect(() => {
    cardTranslateX.setValue(0);
    cardRotate.setValue(0);
    setDetailsOpen(false);
    setPhotoIndex(0);
  }, [index, cardTranslateX, cardRotate]);

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
          '/student/study-partner/discovery?limit=20',
          user.token,
        );
        if (!isMounted) return;
        const list = (res.data as any[]) || [];
        setProfiles(list);
        setIndex(0);
      } catch (e: any) {
        if (!isMounted) return;
        console.error('StudyPartnerDiscover load error:', e);
        setError('Unable to load profiles. Please try again.');
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

  const current = profiles[index];
  const displayPhotos =
    current
      ? (Array.isArray(current.photos) && current.photos.length > 0
          ? current.photos
          : current.profilePhoto
          ? [current.profilePhoto]
          : [])
      : [];
  const currentPhotoUri =
    displayPhotos.length > 0
      ? (displayPhotos[photoIndex] || displayPhotos[0])
      : current?.profilePhoto || '';

  const resolvedCurrentPhotoUri =
    currentPhotoUri && !currentPhotoUri.startsWith('http')
      ? getImageUrl(currentPhotoUri)
      : currentPhotoUri;

  const toggleDetails = () => {
    const next = !detailsOpen;
    setDetailsOpen(next);
    if (next) {
      // Let layout happen, then scroll the details into view
      setTimeout(() => {
        if (detailsSectionY != null) {
          scrollRef.current?.scrollTo({
            y: Math.max(0, detailsSectionY - 12),
            animated: true,
          });
        }
      }, 50);
    }
  };

  const handlePrevPhoto = () => {
    if (!displayPhotos.length) return;
    setPhotoIndex((prev) =>
      prev <= 0 ? displayPhotos.length - 1 : prev - 1,
    );
  };

  const handleNextPhoto = () => {
    if (!displayPhotos.length) return;
    setPhotoIndex((prev) =>
      prev >= displayPhotos.length - 1 ? 0 : prev + 1,
    );
  };

  const sendAction = async (action: 'like' | 'pass') => {
    if (!user?.token || !current || actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await apiFetchAuth('/student/study-partner/like', user.token, {
        method: 'POST',
        body: {
          targetUserId: current.userId,
          action,
        },
      });

      const data = res.data as any;
      if (action === 'like' && data?.newMatch) {
        router.push({
          pathname: '/(tabs)/study-partner-match',
          params: {
            otherUserId: current.userId,
            otherName: current.name,
            otherPhoto: current.profilePhoto || '',
          },
        } as any);
        return;
      }

      // Show quick feedback so user knows what happened
      if (lastActionTimerRef.current) {
        clearTimeout(lastActionTimerRef.current);
      }
      setLastAction(action);
      lastActionTimerRef.current = setTimeout(() => {
        setLastAction(null);
      }, 1500);

      setIndex(prev => prev + 1);
    } catch (e: any) {
      console.error('StudyPartnerDiscover action error:', e);
      setError('Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const triggerSwipe = (action: 'like' | 'pass') => {
    if (actionLoading || !current) return;
    const isLike = action === 'like';
    const toValue = isLike ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    const rotateTo = isLike ? 15 : -15;

    Animated.parallel([
      Animated.timing(cardTranslateX, {
        toValue,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(cardRotate, {
        toValue: rotateTo,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start(() => {
      sendAction(action);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        return !actionLoading && absDx > 25 && absDx > absDy;
      },
      onPanResponderMove: (_, { dx }) => {
        cardTranslateX.setValue(dx);
        cardRotate.setValue(dx / 20);
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        const threshold = SWIPE_THRESHOLD;
        const velocity = vx * 50;
        const shouldLike = dx + velocity > threshold;
        const shouldPass = dx + velocity < -threshold;

        if (shouldLike) {
          triggerSwipe('like');
        } else if (shouldPass) {
          triggerSwipe('pass');
        } else {
          Animated.parallel([
            Animated.spring(cardTranslateX, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
              tension: 80,
            }),
            Animated.spring(cardRotate, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
              tension: 80,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.screen}>
      {!user?.token ? (
        <View style={styles.centered}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>
            Please login to discover study partners.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </View>
      ) : !current ? (
        <View style={styles.centered}>
          <Text style={styles.title}>No more profiles</Text>
          <Text style={styles.subtitle}>
            You have viewed all available profiles. Please check again later.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              router.replace('/(tabs)/study-partner-discover' as any);
            }}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            style={styles.scrollContent}
            contentContainerStyle={[
              styles.scrollContentContainer,
              { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
          >
          {/* Top tip bar like "Learning your type" */}
          <View style={styles.tipBar}>
            <View style={styles.tipIconCircle}>
              <Ionicons name="heart" size={16} color="#22C55E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Learning your type</Text>
              <Text style={styles.tipSubtitle}>
                Swipe right to like, left to pass. Or use the buttons below.
              </Text>
            </View>
          </View>

          {lastAction && (
            <View
              style={[
                styles.actionFeedback,
                lastAction === 'like'
                  ? styles.actionFeedbackLike
                  : styles.actionFeedbackPass,
              ]}
            >
              <Ionicons
                name={lastAction === 'like' ? 'heart' : 'close'}
                size={16}
                color={lastAction === 'like' ? '#16A34A' : '#DC2626'}
              />
              <Text style={styles.actionFeedbackText}>
                {lastAction === 'like' ? 'You liked this profile' : 'You passed this profile'}
              </Text>
            </View>
          )}

          {/* Header row with back + title */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={22} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>Discover</Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Big swipe card - Right swipe = Like, Left swipe = Pass */}
          <View style={styles.cardShadowWrapper}>
            {/* Up arrow to open details panel */}
            <TouchableOpacity
              style={styles.detailsArrowBtn}
              activeOpacity={0.9}
              onPress={toggleDetails}
              disabled={actionLoading}
            >
              <Ionicons
                name={detailsOpen ? 'chevron-down' : 'chevron-up'}
                size={22}
                color="#111827"
              />
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.card,
                {
                  transform: [
                    { translateX: cardTranslateX },
                    {
                      rotate: cardRotate.interpolate({
                        inputRange: [-20, 20],
                        outputRange: ['-12deg', '12deg'],
                      }),
                    },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              {/* LIKE overlay - shows when swiping right */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.swipeOverlay,
                  styles.swipeOverlayLike,
                  {
                    opacity: cardTranslateX.interpolate({
                      inputRange: [0, 60, 120],
                      outputRange: [0, 0.6, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                <View style={styles.swipeOverlayBorder}>
                  <Ionicons name="heart" size={48} color="#FFFFFF" />
                  <Text style={styles.swipeOverlayTextLike}>LIKE</Text>
                </View>
              </Animated.View>

              {/* PASS overlay - shows when swiping left */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.swipeOverlay,
                  styles.swipeOverlayPass,
                  {
                    opacity: cardTranslateX.interpolate({
                      inputRange: [-120, -60, 0],
                      outputRange: [1, 0.6, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                <View style={styles.swipeOverlayBorderPass}>
                  <Ionicons name="close" size={48} color="#FFFFFF" />
                  <Text style={styles.swipeOverlayTextPass}>PASS</Text>
                </View>
              </Animated.View>

              {resolvedCurrentPhotoUri ? (
                <ImageBackground
                  source={{ uri: resolvedCurrentPhotoUri }}
                  style={styles.photo}
                  imageStyle={styles.photoImage}
                >
                  {displayPhotos.length > 1 && (
                    <>
                      <TouchableOpacity
                        style={[styles.photoNavButton, styles.photoNavButtonLeft]}
                        activeOpacity={0.9}
                        onPress={handlePrevPhoto}
                        disabled={actionLoading}
                      >
                        <Ionicons name="chevron-back" size={20} color="#111827" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.photoNavButton, styles.photoNavButtonRight]}
                        activeOpacity={0.9}
                        onPress={handleNextPhoto}
                        disabled={actionLoading}
                      >
                        <Ionicons name="chevron-forward" size={20} color="#111827" />
                      </TouchableOpacity>
                    </>
                  )}
                  <LinearGradient
                    colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.85)']}
                    start={{ x: 0, y: 0.4 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.photoOverlay}
                  >
                    <View style={styles.nameRow}>
                      <Text style={styles.nameText}>{current.name}</Text>
                    </View>
                    <View style={styles.badgeRow}>
                      {current.examType ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {current.examType}
                          </Text>
                        </View>
                      ) : null}
                      {current.language ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {current.language}
                          </Text>
                        </View>
                      ) : null}
                      {current.studyTimeFrom && current.studyTimeTo ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {current.studyTimeFrom} - {current.studyTimeTo}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {current.bio ? (
                      <Text style={styles.bioText} numberOfLines={2}>
                        {current.bio}
                      </Text>
                    ) : null}
                  </LinearGradient>
                </ImageBackground>
              ) : (
                <LinearGradient
                  colors={['#e0e7ff', '#a5b4fc']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.photo, styles.photoOverlay]}
                >
                  <View style={styles.nameRow}>
                    <Text style={styles.nameText}>{current.name}</Text>
                  </View>
                  <View style={styles.badgeRow}>
                    {current.examType ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{current.examType}</Text>
                      </View>
                    ) : null}
                    {current.language ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{current.language}</Text>
                      </View>
                    ) : null}
                    {current.studyTimeFrom && current.studyTimeTo ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {current.studyTimeFrom} - {current.studyTimeTo}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {current.bio ? (
                    <Text style={styles.bioText} numberOfLines={3}>
                      {current.bio}
                    </Text>
                  ) : null}
                  </LinearGradient>
              )}
            </Animated.View>
          </View>

          {/* Inline details (no popup) */}
          {detailsOpen && current && (
            <View
              onLayout={e => setDetailsSectionY(e.nativeEvent.layout.y)}
              style={styles.inlineDetailsCard}
            >
              <Text style={styles.inlineTitle}>Details</Text>

              <View style={styles.inlineRow}>
                <Ionicons name="person" size={16} color="#374151" />
                <Text style={styles.inlineText}>{current.name}</Text>
              </View>
              <View style={styles.inlineRow}>
                <Ionicons name="school" size={16} color="#374151" />
                <Text style={styles.inlineText}>
                  {current.examType || 'Exam not set'}
                </Text>
              </View>
              <View style={styles.inlineRow}>
                <Ionicons name="language" size={16} color="#374151" />
                <Text style={styles.inlineText}>
                  {current.language || 'Language not set'}
                </Text>
              </View>
              <View style={styles.inlineRow}>
                <Ionicons name="time" size={16} color="#374151" />
                <Text style={styles.inlineText}>
                  {current.studyTimeFrom && current.studyTimeTo
                    ? `${current.studyTimeFrom} - ${current.studyTimeTo}`
                    : 'Study time not set'}
                </Text>
              </View>

              {current.bio ? (
                <View style={styles.inlineBioBox}>
                  <Text style={styles.inlineBioTitle}>About</Text>
                  <Text style={styles.inlineBioText}>{current.bio}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Bottom actions like Tinder (X / Heart) */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.passButton]}
              activeOpacity={0.9}
              onPress={() => triggerSwipe('pass')}
              disabled={actionLoading}
            >
              <Ionicons name="close" size={32} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton]}
              activeOpacity={0.9}
              onPress={() => triggerSwipe('like')}
              disabled={actionLoading}
            >
              <Ionicons name="heart" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          </ScrollView>
        </>
      )}
      <StudyPartnerBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  tipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginBottom: 6,
  },
  tipIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  tipSubtitle: {
    fontSize: 11,
    color: '#4B5563',
  },
  actionFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  actionFeedbackLike: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  actionFeedbackPass: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  actionFeedbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
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
    height: 440,
  },
  swipeOverlay: {
    position: 'absolute',
    top: 24,
    zIndex: 10,
    transform: [{ rotate: '-20deg' }],
  },
  swipeOverlayLike: {
    left: 20,
    transform: [{ rotate: '-20deg' }],
  },
  swipeOverlayPass: {
    right: 20,
    transform: [{ rotate: '20deg' }],
  },
  swipeOverlayBorder: {
    borderWidth: 3,
    borderColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
  },
  swipeOverlayBorderPass: {
    borderWidth: 3,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  swipeOverlayTextLike: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  swipeOverlayTextPass: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  photo: {
    flex: 1,
  },
  photoImage: {
    borderRadius: 24,
    resizeMode: 'cover',
  },
  photoOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  photoNavButton: {
    position: 'absolute',
    top: '45%',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 15,
  },
  photoNavButtonLeft: {
    left: 10,
  },
  photoNavButtonRight: {
    right: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.7)',
    marginRight: 6,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  bioText: {
    marginTop: 8,
    fontSize: 13,
    color: '#E5E7EB',
  },
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
  passButton: {
    backgroundColor: '#FEE2E2',
  },
  likeButton: {
    backgroundColor: '#EC4899',
  },
  refreshButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 8,
  },
  inlineDetailsCard: {
    marginTop: 12,
    marginHorizontal: 4,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  inlineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
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
  inlineText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
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
  inlineBioText: {
    fontSize: 14,
    color: '#7C2D12',
    lineHeight: 20,
    fontWeight: '500',
  },
});


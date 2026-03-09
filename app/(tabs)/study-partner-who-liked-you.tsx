import StudyPartnerBottomNav from '@/components/StudyPartnerBottomNav';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useStudyPartner } from '@/context/StudyPartnerContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ImageBackground,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

type LikedUser = {
  userId: string;
  name: string;
  profilePhoto?: string | null;
  likedAt: string;
  age?: number;
  examType?: string | null;
  isRecentlyActive?: boolean;
};

type TabKey = 'likes' | 'topPicks';

export default function StudyPartnerWhoLikedYouScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setLikesCount } = useStudyPartner();

  const [list, setList] = useState<LikedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('likes');

  const load = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const res = await apiFetchAuth(
        '/student/study-partner/who-liked-you',
        user.token,
      );
      const rows = (res.data as any[]) || [];
      const mapped = rows.map((r: any) => ({
        userId: r.userId || r.id,
        name: r.name || r.user?.name || 'Someone',
        profilePhoto: r.profilePhoto ?? r.user?.profilePhoto ?? r.photos?.[0],
        likedAt: r.likedAt || r.createdAt || new Date().toISOString(),
        age: r.age ?? r.user?.age ?? 27,
        examType: r.examType ?? r.user?.examType,
        isRecentlyActive: r.isRecentlyActive ?? true,
      }));
      setList(mapped);
      setLikesCount(mapped.length);
    } catch (e: any) {
      console.error('StudyPartnerWhoLikedYou load error:', e);
      setError('Unable to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.token]);

  const handleLikeBack = async (targetUserId: string, name: string) => {
    if (!user?.token) return;
    try {
      const res = await apiFetchAuth(
        '/student/study-partner/like',
        user.token,
        { method: 'POST', body: { targetUserId, action: 'like' } },
      );
      const data = res.data as any;
      if (data?.newMatch) {
        router.push({
          pathname: '/(tabs)/study-partner-match',
          params: {
            otherUserId: targetUserId,
            otherName: name,
            otherPhoto: '',
          },
        } as any);
        return;
      }
      setList(prev => {
        const next = prev.filter(u => u.userId !== targetUserId);
        setLikesCount(next.length);
        return next;
      });
    } catch (e: any) {
      console.error('StudyPartnerWhoLikedYou like back error:', e);
      setError('Failed to like back. Please try again.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openProfile = (item: LikedUser) => {
    router.push({
      pathname: '/(tabs)/study-partner-liked-user',
      params: {
        userId: item.userId,
        name: item.name,
        profilePhoto: item.profilePhoto || '',
        age: item.age != null ? String(item.age) : '',
        examType: item.examType || '',
      },
    } as any);
  };

  const likeCount = list.length;
  const isPremium = false;

  const renderProfileCard = (item: LikedUser, index: number) => {
    const photoUri = item.profilePhoto || undefined;
    return (
      <TouchableOpacity
        key={item.userId}
        style={styles.cardWrapper}
        activeOpacity={0.9}
        onPress={() => openProfile(item)}
      >
        <View style={styles.card}>
          {photoUri ? (
            <ImageBackground
              source={{ uri: photoUri }}
              style={styles.cardImage}
              imageStyle={styles.cardImageStyle}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.cardOverlay}
              >
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardAge}>{item.age ?? ''} {item.age ? 'yrs' : ''}</Text>
                {item.examType ? (
                  <View style={styles.cardMetaRow}>
                    <Ionicons name="school" size={14} color="#E5E7EB" />
                    <Text style={styles.cardMetaText} numberOfLines={1}>
                      {item.examType}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cardMetaRow}>
                    <View style={styles.greenDot} />
                    <Text style={styles.cardMetaText}>Recently active</Text>
                  </View>
                )}
              </LinearGradient>
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={index === 0 ? ['#ea580c', '#78350f'] : ['#86efac', '#64748b']}
              style={styles.cardImage}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.cardOverlay}
              >
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardAge}>{item.age ?? ''} {item.age ? 'yrs' : ''}</Text>
                <View style={styles.cardMetaRow}>
                  <View style={styles.greenDot} />
                  <Text style={styles.cardMetaText}>Recently active</Text>
                </View>
              </LinearGradient>
            </LinearGradient>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {!user?.token ? (
        <View style={styles.centered}>
          <Text style={styles.mainTitle}>Likes</Text>
          <Text style={styles.subtitle}>Please login to see who liked you.</Text>
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4F46E5']}
                tintColor="#4F46E5"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
              >
                <Ionicons name="chevron-back" size={22} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.mainTitle}>Likes</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={styles.tab}
                onPress={() => setActiveTab('likes')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === 'likes' && styles.tabTextActive]}>
                  {likeCount} likes
                </Text>
                {activeTab === 'likes' && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
              <View style={styles.tabDivider} />
              <TouchableOpacity
                style={styles.tab}
                onPress={() => setActiveTab('topPicks')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === 'topPicks' && styles.tabTextActive]}>
                  Top Picks
                </Text>
                {activeTab === 'topPicks' && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Who liked you - no blur */}
            {list.length > 0 ? (
              <View style={styles.cardsGrid}>
                {list.map((item, i) => renderProfileCard(item, i))}
              </View>
            ) : (
              <View style={styles.emptyCardsPlaceholder}>
                <Ionicons name="heart-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyCardsText}>No likes yet</Text>
                <Text style={styles.emptyCardsSubtext}>
                  When someone likes you, they’ll show up here.
                </Text>
              </View>
            )}

            {/* Full list - Like back, premium nahi abhi */}
            {list.length > 0 && (
              <View style={styles.unlockedList}>
                {list.map(item => (
                  <View style={styles.listItem} key={item.userId}>
                    <TouchableOpacity
                      style={styles.listItemLeft}
                      onPress={() => openProfile(item)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{ uri: item.profilePhoto || '' }}
                        style={styles.listAvatar}
                      />
                      <View style={styles.listItemBody}>
                        <Text style={styles.listName}>{item.name}</Text>
                        <Text style={styles.listMeta}>
                          Liked you on {new Date(item.likedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.likeBackBtn}
                      onPress={() => handleLikeBack(item.userId, item.name)}
                    >
                      <Ionicons name="heart" size={16} color="#FFFFFF" />
                      <Text style={styles.likeBackBtnText}>Like back</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
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
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#111827',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    borderRadius: 2,
    backgroundColor: '#EC4899',
  },
  tabDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
  },
  upgradeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    marginBottom: 24,
    justifyContent: 'center',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: 24,
  },
  emptyCardsPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  emptyCardsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyCardsSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageStyle: {
    borderRadius: 16,
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardAge: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  cardMetaText: {
    fontSize: 12,
    color: '#E5E7EB',
    fontWeight: '500',
    flex: 1,
  },
  goldButton: {
    alignSelf: 'center',
    borderRadius: 999,
    overflow: 'hidden',
    minWidth: 260,
  },
  goldButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 8,
  },
  unlockedList: {
    marginTop: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  listItemBody: { flex: 1 },
  listName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  listMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  likeBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EC4899',
    gap: 6,
  },
  likeBackBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

import BookListingForm from '@/components/BookListingForm';
import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  Menu,
  Package,
  Plus,
  Sparkles,
  Tag,
} from 'lucide-react-native';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 16;
const STAT_W = Math.floor((SCREEN_W - PAD * 2 - 10) / 2);

const C = {
  bg: ['#EDE9FE', '#F5F3FF', '#FAFAFF'] as const,
  primary: '#6344D4',
  primaryLight: '#8E78E7',
  ink: '#0F0A1E',
  muted: '#64748B',
  card: '#FFFFFF',
  border: '#E8E8F0',
  ctaGrad: ['#8E78E7', '#6344D4', '#5546C9'] as const,
};

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  rentPrice?: number;
  listingType: 'SELL' | 'DONATE' | 'RENT';
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  category: string;
  coverImage: string;
  status: string;
  views: number;
  likes: number;
  isAvailable: boolean;
  createdAt: string;
}

const LISTING_COLORS: Record<string, string> = {
  SELL: '#DC2626',
  DONATE: '#059669',
  RENT: '#2563EB',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#059669',
  SOLD: '#64748B',
  RENTED: '#2563EB',
  INACTIVE: '#DC2626',
};

function coverUri(img?: string) {
  if (!img?.trim()) return null;
  return img.startsWith('http') ? img : getImageUrl(img);
}

function SummaryTile({
  icon,
  value,
  label,
  iconBg,
  accent,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  iconBg: string;
  accent: string;
}) {
  return (
    <LinearGradient colors={['#C4B5FD', '#DDD6FE', '#EDE9FE']} style={st.statBorder}>
      <View style={st.statTile}>
        <View style={[st.statIcon, { backgroundColor: iconBg }]}>
          {icon}
          <View style={[st.statAccent, { backgroundColor: accent }]} />
        </View>
        <Text style={st.statVal}>{value}</Text>
        <Text style={st.statLbl}>{label}</Text>
      </View>
    </LinearGradient>
  );
}

export default function MyListingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ total: 0, active: 0, sold: 0, rented: 0, inactive: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchMyListings = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await apiFetchAuth('/books/my-listings?page=1&limit=20', user.token);
      if (response.ok && response.data?.success) {
        setBooks(response.data.data?.books ?? []);
        setSummary(response.data.data?.summary ?? { total: 0, active: 0, sold: 0, rented: 0, inactive: 0 });
      } else {
        setBooks([]);
      }
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyListings();
    setRefreshing(false);
  };

  const openDrawer = () => {
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch {
      router.back();
    }
  };

  if (loading && !books.length) {
    return (
      <LinearGradient colors={[...C.bg]} style={[st.centered, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={st.loadTxt}>Loading your listings…</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={[...C.bg]} style={StyleSheet.absoluteFill} />
      <View style={st.orb1} pointerEvents="none" />
      <View style={st.orb2} pointerEvents="none" />

      <SafeAreaView style={st.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} colors={[C.primary]} />
          }
        >
          {/* Header */}
          <LinearGradient colors={['#C4B5FD', '#DDD6FE', '#EDE9FE']} style={st.headerBorder}>
            <View style={st.headerCard}>
              <View style={st.headerTop}>
                <TouchableOpacity style={st.menuBtn} onPress={openDrawer} activeOpacity={0.88}>
                  <Menu size={20} color={C.ink} strokeWidth={2.5} />
                </TouchableOpacity>
                <LinearGradient colors={['#8E78E7', C.primary]} style={st.hubPill}>
                  <Tag size={10} color="#FFF" strokeWidth={2.5} />
                  <Text style={st.hubPillTxt}>MY STORE</Text>
                </LinearGradient>
                <Image
                  source={require('@/assets/images/icons/book-shop.png')}
                  style={st.headerImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={st.headerTitle}>
                My <Text style={st.headerAccent}>Listings</Text>
              </Text>
              <Text style={st.headerSub}>Manage books you sell, rent or donate</Text>
              <TouchableOpacity activeOpacity={0.92} onPress={() => setShowCreateModal(true)}>
                <LinearGradient colors={[...C.ctaGrad]} style={st.addBtn}>
                  <Plus size={16} color="#FFF" strokeWidth={2.5} />
                  <Text style={st.addBtnTxt}>Add New Listing</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Stats 2x2 */}
          <View style={st.statsGrid}>
            <View style={st.statWrap}>
              <SummaryTile
                icon={<Package size={15} color={C.primary} strokeWidth={2} />}
                value={summary.total}
                label="Total"
                iconBg="#EDE9FE"
                accent={C.primary}
              />
            </View>
            <View style={st.statWrap}>
              <SummaryTile
                icon={<CheckCircle size={15} color="#059669" strokeWidth={2} />}
                value={summary.active}
                label="Active"
                iconBg="#ECFDF5"
                accent="#10B981"
              />
            </View>
            <View style={st.statWrap}>
              <SummaryTile
                icon={<Sparkles size={15} color="#64748B" strokeWidth={2} />}
                value={summary.sold}
                label="Sold"
                iconBg="#F1F5F9"
                accent="#64748B"
              />
            </View>
            <View style={st.statWrap}>
              <SummaryTile
                icon={<Clock size={15} color="#2563EB" strokeWidth={2} />}
                value={summary.rented}
                label="Rented"
                iconBg="#EFF6FF"
                accent="#3B82F6"
              />
            </View>
          </View>

          {/* List */}
          <View style={st.sectionHead}>
            <Text style={st.sectionTitle}>Your Books</Text>
            <View style={st.countPill}>
              <Text style={st.countPillTxt}>{books.length}</Text>
            </View>
          </View>

          {books.length === 0 ? (
            <View style={st.emptyBox}>
              <LinearGradient colors={['#EDE9FE', '#F5F3FF']} style={st.emptyIcon}>
                <BookOpen size={36} color={C.primary} strokeWidth={1.8} />
              </LinearGradient>
              <Text style={st.emptyTitle}>No listings yet</Text>
              <Text style={st.emptySub}>List your books so other students can buy, rent or get them free.</Text>
              <TouchableOpacity activeOpacity={0.92} onPress={() => setShowCreateModal(true)}>
                <LinearGradient colors={[...C.ctaGrad]} style={st.emptyCta}>
                  <Plus size={18} color="#FFF" strokeWidth={2.5} />
                  <Text style={st.emptyCtaTxt}>Create First Listing</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            books.map((book) => {
              const uri = coverUri(book.coverImage);
              const typeColor = LISTING_COLORS[book.listingType] ?? C.muted;
              const statusColor = STATUS_COLORS[book.status] ?? C.muted;
              return (
                <TouchableOpacity
                  key={book.id}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/(tabs)/book-details?bookId=${book.id}` as any)}
                  style={st.cardWrap}
                >
                  <LinearGradient colors={['#E9E5FF', '#F3EEFF', '#FAF8FF']} style={st.cardBorder}>
                    <View style={st.card}>
                      <View style={st.cardRow}>
                        <View style={st.coverWrap}>
                          {uri ? (
                            <Image source={{ uri }} style={st.cover} resizeMode="cover" />
                          ) : (
                            <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={st.coverPlaceholder}>
                              <BookOpen size={28} color={C.primaryLight} strokeWidth={1.8} />
                            </LinearGradient>
                          )}
                          <View style={[st.statusBadge, { backgroundColor: statusColor }]}>
                            <Text style={st.statusTxt}>{book.status}</Text>
                          </View>
                        </View>
                        <View style={st.cardBody}>
                          <Text style={st.cardTitle} numberOfLines={2}>{book.title}</Text>
                          <Text style={st.cardAuthor} numberOfLines={1}>{book.author}</Text>
                          <View style={st.badgeRow}>
                            <View style={[st.typeBadge, { backgroundColor: `${typeColor}18` }]}>
                              <Text style={[st.typeTxt, { color: typeColor }]}>{book.listingType}</Text>
                            </View>
                            <View style={st.condBadge}>
                              <Text style={st.condTxt}>{book.condition}</Text>
                            </View>
                          </View>
                        </View>
                        <ChevronRight size={18} color="#CBD5E1" strokeWidth={2} />
                      </View>
                      <View style={st.cardFooter}>
                        <View>
                          <Text style={st.price}>
                            {book.listingType === 'DONATE' ? 'Free' : `₹${book.price}`}
                          </Text>
                          {book.listingType === 'RENT' && book.rentPrice != null ? (
                            <Text style={st.rentTxt}>₹{book.rentPrice}/month</Text>
                          ) : null}
                        </View>
                        <View style={st.metrics}>
                          <View style={st.metric}>
                            <Eye size={12} color={C.muted} strokeWidth={2} />
                            <Text style={st.metricTxt}>{book.views}</Text>
                          </View>
                          <View style={st.metric}>
                            <Heart size={12} color={C.muted} strokeWidth={2} />
                            <Text style={st.metricTxt}>{book.likes}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <TouchableOpacity style={st.fabWrap} onPress={() => setShowCreateModal(true)} activeOpacity={0.92}>
          <LinearGradient colors={[...C.ctaGrad]} style={st.fab}>
            <Plus size={26} color="#FFF" strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>

      <BookListingForm
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchMyListings();
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadTxt: { marginTop: 14, fontFamily: FontFamily.medium, fontSize: 15, color: C.primary },
  orb1: {
    position: 'absolute',
    width: SCREEN_W * 0.65,
    height: SCREEN_W * 0.65,
    borderRadius: SCREEN_W,
    backgroundColor: 'rgba(142, 120, 231, 0.09)',
    top: -SCREEN_W * 0.18,
    right: -SCREEN_W * 0.2,
  },
  orb2: {
    position: 'absolute',
    width: SCREEN_W * 0.4,
    height: SCREEN_W * 0.4,
    borderRadius: SCREEN_W,
    backgroundColor: 'rgba(236, 72, 153, 0.05)',
    bottom: 60,
    left: -SCREEN_W * 0.1,
  },
  headerBorder: { marginHorizontal: PAD, marginTop: 8, borderRadius: 22, padding: 1.5, marginBottom: 14 },
  headerCard: { backgroundColor: C.card, borderRadius: 20.5, padding: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  hubPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 10,
  },
  hubPillTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: '#FFF', letterSpacing: 0.6 },
  headerImg: { width: 64, height: 56, marginLeft: 'auto' },
  headerTitle: { fontFamily: FontFamily.extraBold, fontSize: 24, color: C.ink, lineHeight: 30 },
  headerAccent: { color: C.primary },
  headerSub: { fontFamily: FontFamily.regular, fontSize: 13, color: C.muted, marginTop: 4, marginBottom: 14 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
  },
  addBtnTxt: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFF' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PAD,
    gap: 10,
    marginBottom: 16,
  },
  statWrap: { width: STAT_W },
  statBorder: { borderRadius: 16, padding: 1 },
  statTile: {
    backgroundColor: C.card,
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  statAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
  statVal: { fontFamily: FontFamily.extraBold, fontSize: 22, color: C.ink },
  statLbl: { fontFamily: FontFamily.medium, fontSize: 11, color: C.muted, marginTop: 2 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    marginBottom: 10,
  },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: C.ink },
  countPill: {
    backgroundColor: 'rgba(99, 68, 212, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countPillTxt: { fontFamily: FontFamily.bold, fontSize: 12, color: C.primary },
  cardWrap: { marginHorizontal: PAD, marginBottom: 10 },
  cardBorder: { borderRadius: 16, padding: 1 },
  card: {
    backgroundColor: C.card,
    borderRadius: 15,
    padding: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }
      : { elevation: 2 }),
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  coverWrap: { position: 'relative' },
  cover: { width: 88, height: 110, borderRadius: 12, backgroundColor: '#F1F5F9' },
  coverPlaceholder: {
    width: 88,
    height: 110,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: '#FFF', letterSpacing: 0.3 },
  cardBody: { flex: 1, minWidth: 0, paddingTop: 2 },
  cardTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: C.ink, lineHeight: 19 },
  cardAuthor: { fontFamily: FontFamily.regular, fontSize: 12, color: C.muted, marginTop: 2, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeTxt: { fontFamily: FontFamily.bold, fontSize: 10 },
  condBadge: { backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  condTxt: { fontFamily: FontFamily.semiBold, fontSize: 10, color: '#B45309' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  price: { fontFamily: FontFamily.extraBold, fontSize: 17, color: C.ink },
  rentTxt: { fontFamily: FontFamily.medium, fontSize: 11, color: C.muted, marginTop: 2 },
  metrics: { flexDirection: 'row', gap: 14 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricTxt: { fontFamily: FontFamily.semiBold, fontSize: 12, color: C.muted },
  emptyBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: PAD },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: C.ink },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
  },
  emptyCtaTxt: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFF' },
  fabWrap: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    borderRadius: 28,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 }
      : { elevation: 8 }),
  },
  fab: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});

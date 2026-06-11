import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useScreenLoadState } from '@/hooks/useScreenLoadState';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Bookmark,
  Calendar,
  ChevronDown,
  Clock,
  Filter,
  FlaskConical,
  Globe2,
  Grid3x3,
  Newspaper,
  Search,
  Shield,
  Star,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 16;
const FEATURE_W = SCREEN_W - PAD * 2;
const FEATURE_H = 228;

const C = {
  bg: '#FFFBF7',
  bgGrad: ['#FFFCF8', '#FFFBF7', '#FAF8F5'] as const,
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  ink: '#0F172A',
  inkSoft: '#1E3A8A',
  muted: '#64748B',
  card: '#FFFFFF',
  border: '#EDE8E3',
  sectionBg: '#EFF4FB',
  gold: '#F59E0B',
  heroCta: ['#60A5FA', '#2563EB', '#1D4ED8'] as const,
  filterGrad: ['#60A5FA', '#2563EB', '#1D4ED8'] as const,
  quizGrad: ['#1E40AF', '#2563EB', '#1D4ED8', '#0F172A'] as const,
  featureGrad: ['#0F172A', '#1E40AF', '#2563EB'] as const,
  borderGrad: ['#E8EEF8', '#F3F6FC', '#FFFCF8'] as const,
  cardBorderGrad: ['#EEF2F8', '#F7F9FC', '#FFFCF8'] as const,
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CATEGORY_LABELS: Record<string, string> = {
  NATIONAL: 'National',
  INTERNATIONAL: 'World',
  ECONOMY: 'Economy',
  SPORTS: 'Sports',
  SCIENCE_TECH: 'Science',
  SCHEMES_REPORTS: 'Schemes',
  AWARDS: 'Awards',
  MISCELLANEOUS: 'Misc',
  DEFENCE: 'Defence',
};

const CATEGORY_COLORS: Record<string, string> = {
  NATIONAL: '#2563EB',
  INTERNATIONAL: '#2563EB',
  ECONOMY: '#059669',
  SPORTS: '#EA580C',
  SCIENCE_TECH: '#3B82F6',
  SCHEMES_REPORTS: '#2563EB',
  AWARDS: '#D97706',
  MISCELLANEOUS: '#64748B',
  DEFENCE: '#1D4ED8',
};

const CARD_THEMES = [
  { color: '#2563EB', grad: ['#DBEAFE', '#EFF6FF'] as const },
  { color: '#1D4ED8', grad: ['#BFDBFE', '#EFF6FF'] as const },
  { color: '#059669', grad: ['#D1FAE5', '#ECFDF5'] as const },
  { color: '#F59E0B', grad: ['#FEF3C7', '#FFFBEB'] as const },
];

type CAEntry = {
  id: string;
  title: string;
  content?: string;
  category: string;
  createdAt?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
};

type CategoryItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  apiKeys: string[] | null;
  grad: readonly [string, string];
};

const UI_CATEGORIES: CategoryItem[] = [
  { key: 'ALL', label: 'All', icon: <Grid3x3 size={22} color="#FFF" strokeWidth={2.2} />, inactiveIcon: <Grid3x3 size={22} color={C.primary} strokeWidth={2} />, apiKeys: null, grad: ['#93C5FD', '#2563EB'] },
  { key: 'NATIONAL', label: 'National', icon: <Ionicons name="flag" size={22} color="#FFF" />, inactiveIcon: <Ionicons name="flag" size={22} color="#DC2626" />, apiKeys: ['NATIONAL'], grad: ['#FCA5A5', '#EF4444'] },
  { key: 'INTERNATIONAL', label: 'World', icon: <Globe2 size={22} color="#FFF" strokeWidth={2} />, inactiveIcon: <Globe2 size={22} color="#2563EB" strokeWidth={2} />, apiKeys: ['INTERNATIONAL'], grad: ['#93C5FD', '#3B82F6'] },
  { key: 'ECONOMY', label: 'Economy', icon: <TrendingUp size={22} color="#FFF" strokeWidth={2.2} />, inactiveIcon: <TrendingUp size={22} color="#059669" strokeWidth={2.2} />, apiKeys: ['ECONOMY'], grad: ['#6EE7B7', '#10B981'] },
  { key: 'SCIENCE_TECH', label: 'Science', icon: <FlaskConical size={22} color="#FFF" strokeWidth={2.2} />, inactiveIcon: <FlaskConical size={22} color="#3B82F6" strokeWidth={2} />, apiKeys: ['SCIENCE_TECH'], grad: ['#93C5FD', '#2563EB'] },
  { key: 'SPORTS', label: 'Sports', icon: <Trophy size={22} color="#FFF" strokeWidth={2.2} />, inactiveIcon: <Trophy size={22} color="#F59E0B" strokeWidth={2} />, apiKeys: ['SPORTS'], grad: ['#FCD34D', '#F59E0B'] },
  { key: 'DEFENCE', label: 'Defence', icon: <Shield size={22} color="#FFF" strokeWidth={2.2} />, inactiveIcon: <Shield size={22} color="#1D4ED8" strokeWidth={2} />, apiKeys: ['DEFENCE', 'MISCELLANEOUS'], grad: ['#93C5FD', '#1D4ED8'] },
];

const FEATURE_IMAGES = [
  require('../../../assets/images/banner1.jpg'),
  require('../../../assets/images/banner2.jpg'),
  require('../../../assets/images/29369.jpg'),
  require('../../../assets/images/banner3.jpg'),
];

function formatMonthLabel(month: string) {
  try {
    const [y, m] = month.split('-').map(Number);
    return `${MONTH_NAMES[m - 1] ?? month} ${y}`;
  } catch {
    return month;
  }
}

function formatDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function readTime(content?: string) {
  const words = (content || '').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

function excerpt(text?: string, max = 90) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function sortMonths(list: string[]) {
  return [...list].sort((a, b) => {
    const [ya, ma] = a.split('-').map(Number);
    const [yb, mb] = b.split('-').map(Number);
    return yb * 100 + mb - (ya * 100 + ma);
  });
}

function QuickStat({ icon, value, label, colors, textColor }: {
  icon: React.ReactElement;
  value: string | number;
  label: string;
  colors: readonly [string, string];
  textColor: string;
}) {
  return (
    <View style={st.qStat}>
      <LinearGradient colors={colors} style={st.qStatRing}>{icon}</LinearGradient>
      <Text style={[st.qStatVal, { color: textColor }]}>{value}</Text>
      <Text style={st.qStatLbl}>{label}</Text>
    </View>
  );
}

export default function CurrentAffairsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const featureRef = useRef<FlatList>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [entries, setEntries] = useState<CAEntry[]>([]);
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [featureIndex, setFeatureIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const selectedMonthRef = useRef<string | null>(null);
  selectedMonthRef.current = selectedMonth;
  const { beginFetch, endFetch, hasLoadedOnceRef } = useScreenLoadState();

  const loadData = useCallback(
    async (refresh = false, monthOverride?: string) => {
      if (!user?.token) { setLoading(false); return; }
      beginFetch(setLoading, setRefreshing, { refresh });
      setError(null);
      try {
        const monthsRes = await apiFetchAuth('/student/current-affairs/months', user.token);
        const monthList = sortMonths(Array.isArray(monthsRes.data) ? monthsRes.data : []);
        setMonths(monthList);
        const month = monthOverride || selectedMonthRef.current || monthList[0] || null;
        if (!month) {
          setEntries([]);
          setApiCategories([]);
          setSelectedMonth(null);
          return;
        }
        setSelectedMonth(month);
        const [catsRes, entriesRes] = await Promise.all([
          apiFetchAuth(`/student/current-affairs/categories?month=${encodeURIComponent(month)}`, user.token),
          apiFetchAuth(`/student/current-affairs/entries?month=${encodeURIComponent(month)}`, user.token),
        ]);
        setApiCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
        setEntries(Array.isArray(entriesRes.data) ? entriesRes.data : []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        endFetch(setLoading, setRefreshing);
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      }
    },
    [user?.token, fadeAnim, beginFetch, endFetch]
  );

  useFocusEffect(useCallback(() => { loadData(hasLoadedOnceRef.current); }, [loadData]));

  const visibleCategories = useMemo(() => UI_CATEGORIES.filter((c) => {
    if (c.key === 'ALL') return true;
    if (!c.apiKeys) return false;
    return c.apiKeys.some((k) => apiCategories.includes(k) || entries.some((e) => e.category === k));
  }), [apiCategories, entries]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...entries];
    const cat = UI_CATEGORIES.find((c) => c.key === activeCategory);
    if (cat?.apiKeys) list = list.filter((e) => cat.apiKeys!.includes(e.category));
    if (q) list = list.filter((e) => `${e.title} ${e.content || ''} ${CATEGORY_LABELS[e.category] || ''}`.toLowerCase().includes(q));
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [entries, activeCategory, search]);

  const featured = useMemo(() => filteredEntries.slice(0, 5), [filteredEntries]);
  const trendingTopics = useMemo(() => {
    const tags: string[] = [];
    [...new Set(entries.map((e) => e.category))].slice(0, 3).forEach((c) => tags.push(`${CATEGORY_LABELS[c] || c} Updates`));
    entries.slice(0, 5).forEach((e) => tags.push(e.title.length > 26 ? `${e.title.slice(0, 26)}…` : e.title));
    return tags.slice(0, 7);
  }, [entries]);

  const openNote = (item: CAEntry) => router.push({ pathname: '/(tabs)/current-affairs/note' as any, params: { entry: JSON.stringify(item) } });
  const toggleBookmark = (id: string) => setBookmarks((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const onFeatureScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setFeatureIndex(Math.round(e.nativeEvent.contentOffset.x / FEATURE_W));

  if (loading && !entries.length && !refreshing) {
    return (
      <View style={[st.centered, { backgroundColor: C.bg }]}>
        <View style={st.loadRing}><ActivityIndicator size="large" color={C.primary} /></View>
        <Text style={st.loadTxt}>Curating today&apos;s news…</Text>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <LinearGradient colors={[...C.bgGrad]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={st.safe} edges={[]}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 2, paddingBottom: insets.bottom + 110, paddingHorizontal: PAD }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={C.primary} />}
          >
            {/* Hero header */}
            <View style={st.sectionPanel}>
                <View style={st.heroCard}>
                  <HeroDots />
                  <View style={st.heroOrb} />
                  <Text style={st.heroTitle}>Current Affairs</Text>
                  <Text style={st.heroSub}>Stay informed. Stay ahead. 📰</Text>
                  <View style={st.heroLine} />
                  {selectedMonth ? (
                    <TouchableOpacity style={st.monthChip} onPress={() => setShowMonthPicker(true)} activeOpacity={0.9}>
                      <Calendar size={12} color={C.primary} strokeWidth={2} />
                      <Text style={st.monthChipTxt}>{formatMonthLabel(selectedMonth)}</Text>
                      <ChevronDown size={12} color={C.primary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
            </View>

            {/* Quick stats */}
            <View style={st.sectionPanel}>
              <View style={st.statsCard}>
                <View style={st.statsRow}>
                  <QuickStat icon={<Newspaper size={16} color="#FFF" strokeWidth={2.2} />} value={entries.length} label="Articles" colors={['#60A5FA', C.primary]} textColor={C.primary} />
                  <View style={st.statDiv} />
                  <QuickStat icon={<Grid3x3 size={16} color="#FFF" strokeWidth={2.2} />} value={apiCategories.length} label="Topics" colors={['#60A5FA', '#3B82F6']} textColor="#2563EB" />
                  <View style={st.statDiv} />
                  <QuickStat icon={<Bookmark size={16} color="#FFF" strokeWidth={2.2} />} value={bookmarks.size} label="Saved" colors={['#FBBF24', '#F59E0B']} textColor="#D97706" />
                  <View style={st.statDiv} />
                  <QuickStat icon={<TrendingUp size={16} color="#FFF" strokeWidth={2.2} />} value={filteredEntries.length} label="Showing" colors={['#34D399', '#10B981']} textColor="#059669" />
                </View>
              </View>
            </View>

            {/* Search */}
            <View style={st.searchRow}>
              <View style={[st.searchBar, search.length > 0 && st.searchFocus]}>
                <Search size={18} color={C.primary} strokeWidth={2.2} />
                <TextInput placeholder="Search news, topics, keywords..." placeholderTextColor="#94A3B8" value={search} onChangeText={setSearch} style={st.searchInput} />
                {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}><X size={16} color={C.muted} /></TouchableOpacity>}
              </View>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setShowFilter(true)}>
                <LinearGradient colors={[...C.filterGrad]} style={st.filterBtn}>
                  <SlidersIcon />
                  <Text style={st.filterBtnTxt}>Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={st.errBox}>
                <Ionicons name="cloud-offline-outline" size={28} color="#EF4444" />
                <Text style={st.errTxt}>{error}</Text>
                <TouchableOpacity onPress={() => loadData(false)} activeOpacity={0.9}>
                  <LinearGradient colors={[...C.heroCta]} style={st.retryBtn}><Text style={st.retryTxt}>Try Again</Text></LinearGradient>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Featured */}
            {featured.length > 0 && (
              <>
                <View style={st.secHead}>
                  <View style={st.secLeft}>
                    <Star size={16} color={C.gold} fill={C.gold} />
                    <Text style={st.secTitle}>Top Stories</Text>
                  </View>
                  <Text style={st.secCount}>{featureIndex + 1}/{featured.length}</Text>
                </View>
                <FlatList
                  ref={featureRef}
                  data={featured}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onFeatureScroll}
                  keyExtractor={(item) => `f-${item.id}`}
                  contentContainerStyle={{ paddingHorizontal: PAD }}
                  renderItem={({ item, index }) => {
                    const catColor = CATEGORY_COLORS[item.category] || C.primary;
                    const catLabel = (CATEGORY_LABELS[item.category] || item.category).toUpperCase();
                    return (
                      <TouchableOpacity activeOpacity={0.94} onPress={() => openNote(item)} style={{ width: FEATURE_W, marginRight: index < featured.length - 1 ? 0 : 0 }}>
                        <View style={st.featShadow}>
                          <LinearGradient colors={['#93C5FD55', '#BFDBFE55']} style={st.featBorder}>
                            <ImageBackground source={FEATURE_IMAGES[index % FEATURE_IMAGES.length]} style={st.featureCard} imageStyle={st.featureImg}>
                              <LinearGradient colors={['transparent', 'rgba(15,10,30,0.5)', 'rgba(15,10,30,0.95)']} style={st.featureOverlay}>
                                <View style={st.topNewsBadge}>
                                  <Star size={10} color="#FFF" fill="#FFF" />
                                  <Text style={st.topNewsTxt}>TOP NEWS</Text>
                                </View>
                                <Text style={[st.featureCat, { color: catColor }]}>{catLabel}</Text>
                                <Text style={st.featureTitle} numberOfLines={3}>{item.title}</Text>
                                <Text style={st.featureExcerpt} numberOfLines={2}>{excerpt(item.content, 110)}</Text>
                                <View style={st.featureFoot}>
                                  <View style={st.featureDateRow}>
                                    <Calendar size={12} color="rgba(255,255,255,0.9)" />
                                    <Text style={st.featureDate}>{formatDate(item.createdAt)}</Text>
                                    <Clock size={12} color="rgba(255,255,255,0.7)" />
                                    <Text style={st.featureDate}>{readTime(item.content)}</Text>
                                  </View>
                                  <LinearGradient colors={['#FFFFFF', '#EFF6FF']} style={st.readChip}>
                                    <Text style={st.readChipTxt}>Read</Text>
                                    <ArrowRight size={12} color={C.primary} strokeWidth={2.5} />
                                  </LinearGradient>
                                </View>
                              </LinearGradient>
                            </ImageBackground>
                          </LinearGradient>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
                <View style={st.dots}>{featured.map((_, i) => <View key={i} style={[st.dot, i === featureIndex && st.dotOn]} />)}</View>
              </>
            )}

            {/* Categories */}
            <View style={st.secHead}>
              <View>
                <Text style={st.secTitle}>Browse by Category</Text>
                <Text style={st.secSub}>Tap to filter articles</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.catRow}>
              {visibleCategories.map((cat) => {
                const active = activeCategory === cat.key;
                return (
                  <TouchableOpacity key={cat.key} style={st.catItem} onPress={() => setActiveCategory(cat.key)} activeOpacity={0.9}>
                    {active ? (
                      <LinearGradient colors={[...cat.grad]} style={st.catIconOn}>{cat.icon}</LinearGradient>
                    ) : (
                      <View style={st.catIconOff}>{cat.inactiveIcon}</View>
                    )}
                    <Text style={[st.catLbl, active && st.catLblOn]}>{cat.label}</Text>
                    {active && <View style={st.catLine} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Trending */}
            <View style={st.secHead}>
              <View style={st.secLeft}>
                <TrendingUp size={17} color={C.primary} strokeWidth={2.5} />
                <Text style={st.secTitle}>Trending Topics</Text>
              </View>
              <TouchableOpacity style={st.viewAllBtn} activeOpacity={0.85} onPress={() => setSearch('')}>
                <Text style={st.viewAll}>View All</Text>
                <ArrowRight size={14} color={C.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.trendRow}>
              {trendingTopics.map((tag, i) => (
                <TouchableOpacity key={`${tag}-${i}`} onPress={() => setSearch(tag)} activeOpacity={0.88}>
                  <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={st.trendPill}>
                    <Text style={st.trendHash}>#</Text>
                    <Text style={st.trendTxt} numberOfLines={1}>{tag}</Text>
                    <Text style={st.trendFire}>🔥</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* News list */}
            <View style={st.secHead}>
              <View>
                <Text style={st.secTitle}>{"Today's Top News"}</Text>
                <Text style={st.secSub}>{filteredEntries.length} articles · updated daily</Text>
              </View>
              <TouchableOpacity style={st.latestBtn} onPress={() => setShowMonthPicker(true)} activeOpacity={0.88}>
                <Text style={st.latestTxt}>Latest</Text>
                <ChevronDown size={14} color={C.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {filteredEntries.length === 0 ? (
              <View style={st.emptyBox}>
                <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={st.emptyIcon}>
                  <Newspaper size={32} color={C.primary} strokeWidth={1.8} />
                </LinearGradient>
                <Text style={st.emptyTitle}>No articles found</Text>
                <Text style={st.emptySub}>Change category or month to explore more</Text>
              </View>
            ) : (
              filteredEntries.map((item, index) => {
                const theme = CARD_THEMES[index % CARD_THEMES.length];
                const catColor = CATEGORY_COLORS[item.category] || theme.color;
                const catLabel = (CATEGORY_LABELS[item.category] || item.category).toUpperCase();
                const thumbUri = item.thumbnailUrl || item.imageUrl;
                const saved = bookmarks.has(item.id);
                return (
                  <TouchableOpacity key={item.id} activeOpacity={0.93} onPress={() => openNote(item)}>
                    <View style={st.newsBorder}>
                      <View style={st.newsCard}>
                        <LinearGradient colors={[catColor, catColor + '99']} style={st.newsStripe} />
                        {thumbUri ? (
                          <Image source={{ uri: getImageUrl(thumbUri) }} style={st.newsThumb} />
                        ) : (
                          <LinearGradient colors={[...theme.grad]} style={st.newsThumb}>
                            <Ionicons name="newspaper" size={24} color={catColor} />
                          </LinearGradient>
                        )}
                        <View style={st.newsBody}>
                          <View style={st.newsTopRow}>
                            <View style={[st.catPill, { backgroundColor: catColor + '18' }]}>
                              <Text style={[st.catPillTxt, { color: catColor }]}>{catLabel}</Text>
                            </View>
                            <View style={[st.yearBadge, { borderColor: catColor + '40' }]}>
                              <Text style={[st.yearBadgeTxt, { color: catColor }]}>{item.createdAt ? new Date(item.createdAt).getFullYear() : '—'}</Text>
                            </View>
                          </View>
                          <Text style={st.newsTitle} numberOfLines={2}>{item.title}</Text>
                          <Text style={st.newsPreview} numberOfLines={1}>{excerpt(item.content, 60)}</Text>
                          <View style={st.newsMeta}>
                            <View style={st.metaChip}><Calendar size={10} color={C.muted} /><Text style={st.metaTxt}>{formatDate(item.createdAt)}</Text></View>
                            <View style={st.metaChip}><Clock size={10} color={C.muted} /><Text style={st.metaTxt}>{readTime(item.content)} read</Text></View>
                          </View>
                        </View>
                        <View style={st.newsActions}>
                          <TouchableOpacity onPress={() => toggleBookmark(item.id)} hitSlop={10} style={st.bookmarkWrap}>
                            <Bookmark size={18} color={saved ? C.primary : '#CBD5E1'} fill={saved ? C.primary : 'transparent'} strokeWidth={2} />
                          </TouchableOpacity>
                          <LinearGradient colors={[...C.heroCta]} style={st.readBtn}>
                            <ArrowRight size={14} color="#FFF" strokeWidth={2.5} />
                          </LinearGradient>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {/* Quiz CTA */}
            <View style={st.quizWrap}>
              <LinearGradient colors={[...C.quizGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.quizCard}>
                <View style={st.quizOrb1} /><View style={st.quizOrb2} />
                <View style={st.quizLeft}>
                  <View style={st.quizBadge}><Zap size={12} color={C.gold} fill={C.gold} /><Text style={st.quizBadgeTxt}>EARN POINTS</Text></View>
                  <Text style={st.quizTitle}>Test Your Knowledge ⚡</Text>
                  <Text style={st.quizSub}>Quick quiz on today&apos;s current affairs — boost your prep score!</Text>
                  <TouchableOpacity style={st.quizBtn} activeOpacity={0.92} onPress={() => router.push('/(tabs)/quiz' as any)}>
                    <Text style={st.quizBtnTxt}>Start Quiz</Text>
                    <ArrowRight size={15} color={C.primary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
                <Image source={require('../../../assets/images/icons/quizbanner.png')} style={st.quizImg} resizeMode="contain" />
              </LinearGradient>
            </View>

            {months.length > 1 && (
              <TouchableOpacity style={st.archiveBtn} onPress={() => router.push({ pathname: '/(tabs)/current-affairs/[month]' as any, params: { month: selectedMonth || months[0] } })} activeOpacity={0.9}>
                <LinearGradient colors={['#EFF6FF', '#FFFFFF']} style={st.archiveGrad}>
                  <Text style={st.archiveTxt}>Browse Full Month Archive</Text>
                  <ArrowRight size={16} color={C.primary} strokeWidth={2.5} />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      <Modal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
        <TouchableOpacity style={st.modalBg} activeOpacity={1} onPress={() => setShowMonthPicker(false)}>
          <View style={st.monthSheet}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>Select Month</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {months.map((m) => (
                <TouchableOpacity key={m} style={[st.monthRow, selectedMonth === m && st.monthRowOn]} onPress={() => { setShowMonthPicker(false); loadData(false, m); }}>
                  <Text style={[st.monthRowTxt, selectedMonth === m && st.monthRowTxtOn]}>{formatMonthLabel(m)}</Text>
                  {selectedMonth === m && <Ionicons name="checkmark-circle" size={22} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showFilter} transparent animationType="slide" onRequestClose={() => setShowFilter(false)}>
        <TouchableOpacity style={st.modalBg} activeOpacity={1} onPress={() => setShowFilter(false)}>
          <TouchableOpacity activeOpacity={1} style={st.filterSheet} onPress={(e) => e.stopPropagation()}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>Smart Filters</Text>
            <Text style={st.modalLbl}>Category</Text>
            <View style={st.fChips}>{visibleCategories.map((cat) => (
              <TouchableOpacity key={cat.key} onPress={() => setActiveCategory(cat.key)} style={[st.fChip, activeCategory === cat.key && st.fChipOn]}>
                <Text style={[st.fChipTxt, activeCategory === cat.key && st.fChipTxtOn]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}</View>
            <Text style={st.modalLbl}>Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
              {months.map((m) => (
                <TouchableOpacity key={m} onPress={() => loadData(false, m)} style={[st.fChip, selectedMonth === m && st.fChipOn]}>
                  <Text style={[st.fChipTxt, selectedMonth === m && st.fChipTxtOn]}>{formatMonthLabel(m)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowFilter(false)} style={st.applyWrap}>
              <LinearGradient colors={[...C.heroCta]} style={st.applyGrad}><Text style={st.applyTxt}>Apply Filters</Text></LinearGradient>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function SlidersIcon() {
  return <Filter size={16} color="#FFF" strokeWidth={2.2} />;
}

const blueShadow = Platform.select({
  ios: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14 },
  android: { elevation: 5 },
});

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadRing: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...blueShadow },
  loadTxt: { fontFamily: FontFamily.medium, fontSize: 14, color: C.muted, marginTop: 14 },
  sectionPanel: {
    marginBottom: 12,
    backgroundColor: C.sectionBg,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCE4F0',
  },
  heroCard: { backgroundColor: C.card, borderRadius: 14, padding: 20, overflow: 'hidden', minHeight: 130 },
  dotWrap: { ...StyleSheet.absoluteFillObject },
  dotPat: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.primary, opacity: 0.1 },
  heroOrb: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(37,99,235,0.1)', top: -30, right: -20 },
  heroTitle: { fontFamily: FontFamily.extraBold, fontSize: 28, color: C.ink, letterSpacing: -0.6 },
  heroSub: { fontFamily: FontFamily.regular, fontSize: 14, color: C.muted, marginTop: 4 },
  heroLine: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.primary, marginTop: 12, marginBottom: 10 },
  monthChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#BFDBFE' },
  monthChipTxt: { fontFamily: FontFamily.semiBold, fontSize: 12, color: C.primary },
  statsCard: { backgroundColor: C.card, borderRadius: 14, paddingVertical: 14 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  qStat: { flex: 1, alignItems: 'center' },
  qStatRing: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  qStatVal: { fontFamily: FontFamily.bold, fontSize: 15 },
  qStatLbl: { fontFamily: FontFamily.regular, fontSize: 9, color: C.muted },
  statDiv: { width: 1, height: 40, backgroundColor: C.border },
  searchRow: { flexDirection: 'row', paddingHorizontal: PAD, gap: 10, marginBottom: 16 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 18, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10, gap: 10, borderWidth: 1.5, borderColor: C.border, ...blueShadow },
  searchFocus: { borderColor: C.primaryLight, backgroundColor: '#F8FAFF' },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: 14, color: C.ink, padding: 0 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 18, gap: 6, ...Platform.select({ ios: { shadowColor: C.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 10 }, android: { elevation: 6 } }) },
  filterBtnTxt: { fontFamily: FontFamily.bold, fontSize: 13, color: '#FFF' },
  errBox: { marginHorizontal: PAD, padding: 18, backgroundColor: '#FEF2F2', borderRadius: 16, alignItems: 'center', marginBottom: 12, gap: 8 },
  errTxt: { fontFamily: FontFamily.medium, fontSize: 13, color: '#DC2626', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 14, marginTop: 4 },
  retryTxt: { fontFamily: FontFamily.bold, fontSize: 13, color: '#FFF' },
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: PAD, marginBottom: 12, marginTop: 6 },
  secLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: C.ink },
  secSub: { fontFamily: FontFamily.regular, fontSize: 11, color: C.muted, marginTop: 2 },
  secCount: { fontFamily: FontFamily.semiBold, fontSize: 12, color: C.primary },
  featShadow: { borderRadius: 22, ...blueShadow },
  featBorder: { borderRadius: 22, padding: 2 },
  featureCard: { height: FEATURE_H, borderRadius: 20, overflow: 'hidden' },
  featureImg: { borderRadius: 20 },
  featureOverlay: { flex: 1, padding: 20, justifyContent: 'flex-end' },
  topNewsBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, backgroundColor: C.primary, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, marginBottom: 10 },
  topNewsTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: '#FFF', letterSpacing: 0.8 },
  featureCat: { fontFamily: FontFamily.bold, fontSize: 11, marginBottom: 6, letterSpacing: 0.8 },
  featureTitle: { fontFamily: FontFamily.extraBold, fontSize: 19, color: '#FFF', lineHeight: 25, marginBottom: 6 },
  featureExcerpt: { fontFamily: FontFamily.regular, fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 17, marginBottom: 12 },
  featureFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featureDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureDate: { fontFamily: FontFamily.medium, fontSize: 11, color: 'rgba(255,255,255,0.9)' },
  readChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, gap: 3 },
  readChipTxt: { fontFamily: FontFamily.bold, fontSize: 11, color: C.primary },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB' },
  dotOn: { width: 22, backgroundColor: C.primary },
  catRow: { paddingHorizontal: PAD, gap: 14, paddingBottom: 18 },
  catItem: { alignItems: 'center', width: 68 },
  catIconOn: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 }, android: { elevation: 7 } }) },
  catIconOff: { width: 54, height: 54, borderRadius: 18, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, ...blueShadow },
  catLbl: { fontFamily: FontFamily.medium, fontSize: 11, color: C.muted, marginTop: 8 },
  catLblOn: { fontFamily: FontFamily.bold, color: C.primary },
  catLine: { width: 22, height: 3, borderRadius: 2, backgroundColor: C.primary, marginTop: 5 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewAll: { fontFamily: FontFamily.semiBold, fontSize: 13, color: C.primary },
  trendRow: { paddingHorizontal: PAD, gap: 8, paddingBottom: 18 },
  trendPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, gap: 4, borderWidth: 1, borderColor: '#BFDBFE', maxWidth: SCREEN_W * 0.72 },
  trendHash: { fontFamily: FontFamily.bold, fontSize: 13, color: C.primary },
  trendTxt: { fontFamily: FontFamily.medium, fontSize: 12, color: C.primary, flexShrink: 1 },
  trendFire: { fontSize: 12 },
  latestBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  latestTxt: { fontFamily: FontFamily.bold, fontSize: 12, color: C.primary },
  newsBorder: { marginHorizontal: PAD, borderRadius: 20, padding: 2, marginBottom: 12 },
  newsCard: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 18, padding: 12, gap: 10, overflow: 'hidden' },
  newsStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  newsThumb: { width: 82, height: 96, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  newsBody: { flex: 1, minWidth: 0 },
  newsTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  catPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catPillTxt: { fontFamily: FontFamily.bold, fontSize: 9, letterSpacing: 0.5 },
  yearBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  yearBadgeTxt: { fontFamily: FontFamily.bold, fontSize: 9 },
  newsTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: C.ink, lineHeight: 19, marginBottom: 4 },
  newsPreview: { fontFamily: FontFamily.regular, fontSize: 11, color: C.muted, marginBottom: 8 },
  newsMeta: { flexDirection: 'row', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F8FAFC', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8 },
  metaTxt: { fontFamily: FontFamily.medium, fontSize: 9, color: C.muted },
  newsActions: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  bookmarkWrap: { padding: 4 },
  readBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: PAD },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: C.ink },
  emptySub: { fontFamily: FontFamily.regular, fontSize: 12, color: C.muted, marginTop: 4, textAlign: 'center' },
  quizWrap: { paddingHorizontal: PAD, marginTop: 10, marginBottom: 14 },
  quizCard: { borderRadius: 24, padding: 22, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#1A0F3C', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20 }, android: { elevation: 10 } }) },
  quizOrb1: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)', top: -20, right: 60 },
  quizOrb2: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.06)', bottom: 10, left: 20 },
  quizLeft: { flex: 1, zIndex: 1 },
  quizBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  quizBadgeTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: '#FFF', letterSpacing: 0.5 },
  quizTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: '#FFF', marginBottom: 6 },
  quizSub: { fontFamily: FontFamily.regular, fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 16, marginBottom: 14 },
  quizBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#FFF', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 22, gap: 5 },
  quizBtnTxt: { fontFamily: FontFamily.bold, fontSize: 13, color: C.primary },
  quizImg: { width: 100, height: 100, zIndex: 1 },
  archiveBtn: { marginHorizontal: PAD, marginBottom: 8, borderRadius: 18, overflow: 'hidden', ...blueShadow },
  archiveGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 18 },
  archiveTxt: { fontFamily: FontFamily.bold, fontSize: 14, color: C.primary },
  modalBg: { flex: 1, backgroundColor: 'rgba(15,10,30,0.5)', justifyContent: 'flex-end' },
  monthSheet: { backgroundColor: C.card, marginHorizontal: 20, borderRadius: 24, padding: 22, marginBottom: 100 },
  filterSheet: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  modalHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 14 },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: C.ink, marginBottom: 8 },
  modalLbl: { fontFamily: FontFamily.medium, fontSize: 12, color: C.muted, marginBottom: 8, marginTop: 6 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  monthRowOn: { backgroundColor: '#EFF6FF', marginHorizontal: -10, paddingHorizontal: 10, borderRadius: 12, borderBottomWidth: 0 },
  monthRowTxt: { fontFamily: FontFamily.medium, fontSize: 15, color: C.ink },
  monthRowTxtOn: { fontFamily: FontFamily.bold, color: C.primary },
  fChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  fChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border },
  fChipOn: { backgroundColor: '#EFF6FF', borderColor: C.primary },
  fChipTxt: { fontFamily: FontFamily.medium, fontSize: 13, color: C.muted },
  fChipTxtOn: { color: C.primary, fontFamily: FontFamily.bold },
  applyWrap: { marginTop: 14, borderRadius: 16, overflow: 'hidden' },
  applyGrad: { paddingVertical: 15, alignItems: 'center' },
  applyTxt: { fontFamily: FontFamily.bold, fontSize: 15, color: '#FFF' },
});

function HeroDots() {
  const dots = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      dots.push(<View key={`${r}-${c}`} style={[st.dotPat, { left: c * 18 + 6, top: r * 18 + 4 }]} />);
    }
  }
  return <View style={st.dotWrap} pointerEvents="none">{dots}</View>;
}

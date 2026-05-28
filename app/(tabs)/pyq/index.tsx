import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { PYQExam } from '@/types/pyq';
import { fetchPYQList } from '@/utils/pyqApi';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  BookOpen,
  FileText,
  Search,
  Star,
  Trophy,
  X,
  Zap,
} from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
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

const PAD = 16;

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
  gold: '#F59E0B',
  heroBg: ['#FFFFFF', '#FFFCF8', '#FAF8F5'] as const,
  heroCta: ['#60A5FA', '#2563EB', '#1D4ED8'] as const,
  borderGrad: ['#E8EEF8', '#F3F6FC', '#FFFCF8'] as const,
  cardBorderGrad: ['#EEF2F8', '#F7F9FC', '#FFFCF8'] as const,
};

const QUICK_CHIPS = ['All', 'JEE', 'NEET', 'UPSC', 'GATE', 'SSC'] as const;

const POPULAR_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; grad: readonly [string, string] }> = {
  JEE: { icon: 'school', color: '#2563EB', bg: '#EFF6FF', grad: ['#93C5FD', '#2563EB'] },
  NEET: { icon: 'medical', color: '#059669', bg: '#ECFDF5', grad: ['#6EE7B7', '#10B981'] },
  UPSC: { icon: 'business', color: '#D97706', bg: '#FFFBEB', grad: ['#FCD34D', '#F59E0B'] },
  GATE: { icon: 'hardware-chip', color: '#2563EB', bg: '#EFF6FF', grad: ['#93C5FD', '#3B82F6'] },
  SSC: { icon: 'document-text', color: '#DC2626', bg: '#FEF2F2', grad: ['#FCA5A5', '#EF4444'] },
};

const CARD_ACCENTS = [
  { color: '#2563EB', grad: ['#DBEAFE', '#EFF6FF'] as const, glow: 'rgba(37, 99, 235, 0.12)' },
  { color: '#1D4ED8', grad: ['#BFDBFE', '#EFF6FF'] as const, glow: 'rgba(29, 78, 216, 0.12)' },
  { color: '#10B981', grad: ['#D1FAE5', '#ECFDF5'] as const, glow: 'rgba(16, 185, 129, 0.12)' },
  { color: '#F59E0B', grad: ['#FEF3C7', '#FFFBEB'] as const, glow: 'rgba(245, 158, 11, 0.12)' },
];

function examMeta(type: string) {
  const key = Object.keys(POPULAR_META).find((k) => type.toUpperCase().includes(k));
  return POPULAR_META[key || ''] || { icon: 'library' as const, color: C.primary, bg: '#EFF6FF', grad: ['#93C5FD', '#2563EB'] as const };
}

function formatCount(n: number) {
  if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, '')}L+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return n > 0 ? `${n}+` : '0';
}

type PopularGroup = { examType: string; count: number; yearMin: number; yearMax: number };

function HeroDots() {
  const dots = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 9; c++) {
      dots.push(<View key={`${r}-${c}`} style={[st.dot, { left: c * 20 + 8, top: r * 20 + 6, opacity: 0.12 + (c % 3) * 0.04 }]} />);
    }
  }
  return <View style={st.dotWrap} pointerEvents="none">{dots}</View>;
}

function StatMini({
  icon,
  value,
  label,
  ringColors,
  iconColor,
}: {
  icon: React.ReactElement;
  value: string;
  label: string;
  ringColors: readonly [string, string];
  iconColor: string;
}) {
  return (
    <View style={st.statMini}>
      <LinearGradient colors={ringColors} style={st.statIconRing}>
        {icon}
      </LinearGradient>
      <Text style={[st.statVal, { color: iconColor }]}>{value}</Text>
      <Text style={st.statLbl}>{label}</Text>
    </View>
  );
}

export default function PYQListScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const recentSectionY = useRef(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exams, setExams] = useState<PYQExam[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [activeChip, setActiveChip] = useState<string>('All');
  const [fadeAnim] = useState(new Animated.Value(0));

  const loadList = useCallback(
    async (refresh = false, overrides?: { examType?: string; year?: string }) => {
      if (!user?.token) return;
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const typeVal = overrides?.examType ?? examTypeFilter;
        const yearVal = overrides?.year ?? yearFilter;
        const filters: { examType?: string; year?: number } = {};
        if (typeVal.trim()) filters.examType = typeVal.trim();
        if (yearVal.trim()) filters.year = Number(yearVal);
        const data = await fetchPYQList(user.token, filters);
        setExams(Array.isArray(data) ? data : []);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.token, yearFilter, examTypeFilter, fadeAnim]
  );

  useFocusEffect(useCallback(() => { loadList(false); }, [loadList]));

  const firstName = user?.name?.split(' ')[0];

  const stats = useMemo(() => {
    const totalQ = exams.reduce((s, e) => s + (e._count?.questions ?? 0), 0);
    const years = new Set(exams.map((e) => e.year).filter(Boolean));
    const attempts = exams.reduce((s, e) => s + (e.myAttempts ?? 0), 0);
    return { exams: exams.length, questions: totalQ, years: years.size, attempts };
  }, [exams]);

  const popularExams = useMemo((): PopularGroup[] => {
    const map = new Map<string, { count: number; years: number[] }>();
    exams.forEach((e) => {
      const t = e.examType || 'Other';
      const cur = map.get(t) || { count: 0, years: [] };
      cur.count += 1;
      if (e.year) cur.years.push(e.year);
      map.set(t, cur);
    });
    return Array.from(map.entries())
      .map(([examType, v]) => ({
        examType,
        count: v.count,
        yearMin: v.years.length ? Math.min(...v.years) : 2019,
        yearMax: v.years.length ? Math.max(...v.years) : 2024,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [exams]);

  const filteredExams = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...exams];
    if (activeChip !== 'All') {
      list = list.filter((e) => e.examType?.toUpperCase().includes(activeChip.toUpperCase()));
    }
    if (q) {
      list = list.filter((e) => {
        const hay = `${e.title} ${e.examType} ${e.subject || ''} ${e.year}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return list.sort((a, b) => (b.year || 0) - (a.year || 0));
  }, [exams, search, activeChip]);

  const recentExams = filteredExams;

  const openExam = (id: string) => router.push(`/(tabs)/pyq/${id}` as any);

  const applyChip = (chip: string) => {
    setActiveChip(chip);
    if (chip === 'All') {
      setExamTypeFilter('');
      setSearch('');
      loadList(false, { examType: '' });
    } else {
      setExamTypeFilter(chip);
      setSearch(chip);
      loadList(false, { examType: chip });
    }
  };

  const scrollToRecent = () => {
    scrollRef.current?.scrollTo({ y: recentSectionY.current, animated: true });
  };

  if (loading && !exams.length && !refreshing) {
    return (
      <View style={[st.centered, { backgroundColor: C.bg }]}>
        <View style={st.loadRing}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
        <Text style={st.loadTxt}>Loading PYQ papers...</Text>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <LinearGradient colors={[...C.bgGrad]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={st.safe} edges={[]}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 2, paddingBottom: insets.bottom + 100, paddingHorizontal: PAD }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => loadList(true)} tintColor={C.primary} />
            }
          >
            {/* Greeting */}
            <Text style={st.greeting}>{firstName ? `Hello, ${firstName} 👋` : 'Hello 👋'}</Text>
            <Text style={st.greetingSub}>
              Master past papers — practice smarter, score higher
            </Text>

            {/* Search */}
            <View style={[st.searchBar, search.length > 0 && st.searchBarFocus]}>
              <Search size={18} color={C.primary} strokeWidth={2.2} />
              <TextInput
                placeholder="Search exams, subjects, years..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                style={st.searchInput}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <X size={16} color={C.muted} strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chipRow}>
              {QUICK_CHIPS.map((chip) => {
                const active = activeChip === chip;
                return (
                  <TouchableOpacity key={chip} onPress={() => applyChip(chip)} activeOpacity={0.9}>
                    {active ? (
                      <LinearGradient colors={[...C.heroCta]} style={st.chipOn}>
                        <Text style={st.chipOnTxt}>{chip}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={st.chipOff}>
                        <Text style={st.chipOffTxt}>{chip}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Hero */}
            <View style={st.heroShadow}>
              <LinearGradient colors={[...C.borderGrad]} style={st.heroBorder}>
                <View style={st.heroInner}>
                  <LinearGradient colors={[...C.heroBg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.heroCard}>
                    <HeroDots />
                    <View style={st.heroOrbGlow} />
                    <View style={st.heroRow}>
                      <View style={st.heroTextCol}>
                        <View style={st.heroBadge}>
                          <Zap size={11} color={C.gold} fill={C.gold} />
                          <Text style={st.heroBadgeTxt}>ACE YOUR PREPARATION</Text>
                        </View>
                        <Text style={st.heroTitle}>
                          Previous Year{'\n'}
                          <Text style={st.heroAccent}>Questions</Text>
                        </Text>
                        <Text style={st.heroSub} numberOfLines={2}>
                          Real exam papers from JEE, NEET, UPSC & more
                        </Text>
                        <TouchableOpacity activeOpacity={0.92} onPress={scrollToRecent}>
                          <LinearGradient colors={[...C.heroCta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.heroCta}>
                            <Text style={st.heroCtaTxt}>Explore Now</Text>
                            <ArrowRight size={15} color="#FFF" strokeWidth={2.5} />
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                      <Image
                        source={require('../../../assets/images/pyq-hero-books.png')}
                        style={st.heroImage}
                        resizeMode="contain"
                      />
                    </View>
                  </LinearGradient>
                </View>
              </LinearGradient>
            </View>

            {/* Stats card */}
            <LinearGradient colors={[...C.borderGrad]} style={st.statsBorder}>
              <View style={st.statsCard}>
                <View style={st.statsRow}>
                  <StatMini
                    icon={<BookOpen size={17} color="#FFF" strokeWidth={2.3} />}
                    value={formatCount(stats.exams)}
                    label="Exams"
                    ringColors={['#60A5FA', C.primary]}
                    iconColor={C.primary}
                  />
                  <View style={st.statDivider} />
                  <StatMini
                    icon={<FileText size={17} color="#FFF" strokeWidth={2.3} />}
                    value={formatCount(stats.questions)}
                    label="PYQs"
                    ringColors={['#60A5FA', '#3B82F6']}
                    iconColor="#2563EB"
                  />
                  <View style={st.statDivider} />
                  <StatMini
                    icon={<Trophy size={17} color="#FFF" strokeWidth={2.3} />}
                    value={formatCount(stats.attempts)}
                    label="Attempts"
                    ringColors={['#34D399', '#10B981']}
                    iconColor="#059669"
                  />
                  <View style={st.statDivider} />
                  <StatMini
                    icon={<Star size={17} color="#FFF" strokeWidth={2.3} />}
                    value={formatCount(stats.years)}
                    label="Years"
                    ringColors={['#FBBF24', '#F59E0B']}
                    iconColor="#D97706"
                  />
                </View>
              </View>
            </LinearGradient>

            {/* Popular Exams */}
            <View style={st.sectionHead}>
              <View>
                <Text style={st.sectionTitle}>Popular Exams</Text>
                <Text style={st.sectionSub}>Tap to filter by exam type</Text>
              </View>
              <TouchableOpacity activeOpacity={0.85} onPress={() => applyChip('All')} style={st.viewAllBtn}>
                <Text style={st.viewAll}>View All</Text>
                <ArrowRight size={14} color={C.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.popularRow}>
              {(popularExams.length ? popularExams : [
                { examType: 'JEE', count: 0, yearMin: 2019, yearMax: 2024 },
                { examType: 'NEET', count: 0, yearMin: 2019, yearMax: 2024 },
                { examType: 'UPSC', count: 0, yearMin: 2018, yearMax: 2024 },
                { examType: 'GATE', count: 0, yearMin: 2020, yearMax: 2024 },
              ]).map((item) => {
                const meta = examMeta(item.examType);
                const selected = activeChip === item.examType || examTypeFilter === item.examType;
                return (
                  <TouchableOpacity
                    key={item.examType}
                    activeOpacity={0.9}
                    onPress={() => applyChip(item.examType)}
                  >
                    {selected ? (
                      <LinearGradient colors={[...meta.grad]} style={st.popularCardSel}>
                        <View style={st.popularIconSel}>
                          <Ionicons name={meta.icon} size={24} color="#FFF" />
                        </View>
                        <Text style={st.popularNameSel} numberOfLines={1}>{item.examType}</Text>
                        <Text style={st.popularYearsSel}>{item.yearMin} – {item.yearMax}</Text>
                        {item.count > 0 && (
                          <View style={st.popularCountBadge}>
                            <Text style={st.popularCountTxt}>{item.count}</Text>
                          </View>
                        )}
                      </LinearGradient>
                    ) : (
                      <View style={st.popularCard}>
                        <LinearGradient colors={[meta.bg, '#FFFFFF']} style={st.popularIconWrap}>
                          <Ionicons name={meta.icon} size={24} color={meta.color} />
                        </LinearGradient>
                        <Text style={st.popularName} numberOfLines={1}>{item.examType}</Text>
                        <Text style={st.popularYears}>{item.yearMin} – {item.yearMax}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Recent PYQs */}
            <View
              style={[st.sectionHead, { marginTop: 6 }]}
              onLayout={(e) => { recentSectionY.current = e.nativeEvent.layout.y; }}
            >
              <View>
                <Text style={st.sectionTitle}>Recent PYQs</Text>
                <Text style={st.sectionSub}>{filteredExams.length} papers available</Text>
              </View>
            </View>

            {error ? (
              <View style={st.emptyBox}>
                <View style={st.emptyIcon}>
                  <Ionicons name="cloud-offline-outline" size={36} color="#EF4444" />
                </View>
                <Text style={st.emptyTitle}>{error}</Text>
                <TouchableOpacity onPress={() => loadList(false)} activeOpacity={0.9}>
                  <LinearGradient colors={[...C.heroCta]} style={st.retryBtn}>
                    <Text style={st.retryTxt}>Try Again</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : null}

            {!loading && !error && recentExams.length === 0 ? (
              <View style={st.emptyBox}>
                <View style={st.emptyIcon}>
                  <FileText size={32} color={C.primaryLight} strokeWidth={1.8} />
                </View>
                <Text style={st.emptyTitle}>No papers found</Text>
                <Text style={st.emptySub}>Try another filter or pull to refresh</Text>
              </View>
            ) : null}

            {recentExams.map((item, index) => {
              const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
              const subjects = item.subject
                ? item.subject.split(/[,|/]/).map((s) => s.trim()).filter(Boolean)
                : [];
              const subjectLine = subjects.length > 0 ? subjects.join(' • ') : item.examType || 'All Subjects';
              const attempts = item.myAttempts ?? 0;

              return (
                <TouchableOpacity key={item.id} activeOpacity={0.93} onPress={() => openExam(item.id)}>
                  <LinearGradient colors={[...C.cardBorderGrad]} style={st.recentBorder}>
                    <View style={st.recentCard}>
                      <LinearGradient colors={[accent.color, accent.color + '88']} style={st.recentAccent} />
                      <LinearGradient colors={[...accent.grad]} style={st.pdfWrap}>
                        <Ionicons name="document-text" size={22} color={accent.color} />
                        <View style={[st.pdfBadge, { backgroundColor: accent.color }]}>
                          <Text style={st.pdfBadgeTxt}>PDF</Text>
                        </View>
                      </LinearGradient>
                      <View style={st.recentBody}>
                        <View style={st.recentTitleRow}>
                          <Text style={st.recentTitle} numberOfLines={1}>
                            {item.title || `${item.examType} ${item.year}`}
                          </Text>
                          <View style={[st.yearPill, { backgroundColor: accent.color + '18' }]}>
                            <Text style={[st.yearPillTxt, { color: accent.color }]}>{item.year}</Text>
                          </View>
                        </View>
                        <Text style={st.recentSubjects} numberOfLines={1}>{subjectLine}</Text>
                        <View style={st.recentMeta}>
                          <View style={st.metaChip}>
                            <Ionicons name="ribbon-outline" size={11} color={C.muted} />
                            <Text style={st.metaChipTxt}>{item.totalMarks} marks</Text>
                          </View>
                          <View style={st.metaChip}>
                            <Ionicons name="help-circle-outline" size={11} color={C.muted} />
                            <Text style={st.metaChipTxt}>{item._count?.questions ?? 0} Qs</Text>
                          </View>
                          {attempts > 0 && (
                            <View style={[st.metaChip, st.attemptChip]}>
                              <Zap size={10} color={C.primary} fill={C.primary} />
                              <Text style={[st.metaChipTxt, { color: C.primary }]}>{attempts} tried</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <LinearGradient colors={[...C.heroCta]} style={st.viewBtn}>
                        <Text style={st.viewBtnTxt}>View</Text>
                        <ArrowRight size={13} color="#FFF" strokeWidth={2.5} />
                      </LinearGradient>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}

            {/* Tip banner */}
            {recentExams.length > 0 && (
              <LinearGradient colors={['#1E40AF', '#2563EB', '#1D4ED8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.tipBanner}>
                <View style={st.tipIcon}>
                  <Zap size={18} color={C.gold} fill={C.gold} />
                </View>
                <View style={st.tipText}>
                  <Text style={st.tipTitle}>Pro Tip 💡</Text>
                  <Text style={st.tipSub}>Solve PYQs under timed conditions to boost your exam speed</Text>
                </View>
              </LinearGradient>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const cardShadow = Platform.select({
  ios: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16 },
  android: { elevation: 4 },
});

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadRing: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center', ...cardShadow,
  },
  loadTxt: { fontFamily: FontFamily.medium, fontSize: 14, color: C.muted, marginTop: 16 },
  greeting: { fontFamily: FontFamily.extraBold, fontSize: 24, color: C.ink, marginTop: 0, letterSpacing: -0.3 },
  greetingSub: { fontFamily: FontFamily.regular, fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 19 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10, gap: 10,
    borderWidth: 1.5, borderColor: C.border, marginBottom: 12, ...cardShadow,
  },
  searchBarFocus: { borderColor: C.primaryLight, backgroundColor: '#FFFCF8' },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: 14, color: C.ink, padding: 0 },
  chipRow: { gap: 8, paddingBottom: 14 },
  chipOn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, marginRight: 4 },
  chipOnTxt: { fontFamily: FontFamily.semiBold, fontSize: 12, color: '#FFF' },
  chipOff: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, marginRight: 4,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  chipOffTxt: { fontFamily: FontFamily.medium, fontSize: 12, color: C.inkSoft },
  heroShadow: { marginBottom: 16, borderRadius: 24, ...cardShadow },
  heroBorder: { borderRadius: 24, padding: 2 },
  heroInner: { borderRadius: 22, overflow: 'hidden' },
  heroCard: { borderRadius: 22, padding: 20, minHeight: 175, overflow: 'hidden' },
  dotWrap: { ...StyleSheet.absoluteFillObject },
  dot: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(37,99,235,0.15)' },
  heroOrbGlow: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.55)', top: -30, right: 60,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroTextCol: { flex: 1, paddingRight: 4 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: 'rgba(37,99,235,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 10,
  },
  heroBadgeTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: C.primary, letterSpacing: 0.6 },
  heroTitle: { fontFamily: FontFamily.extraBold, fontSize: 21, lineHeight: 27, color: C.ink, marginBottom: 6 },
  heroAccent: { color: C.primary },
  heroSub: { fontFamily: FontFamily.regular, fontSize: 11, color: C.muted, lineHeight: 16, marginBottom: 14 },
  heroCta: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, gap: 5,
    ...Platform.select({ ios: { shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 }, android: { elevation: 6 } }),
  },
  heroCtaTxt: { fontFamily: FontFamily.bold, fontSize: 13, color: '#FFF' },
  heroImage: { width: 115, height: 125 },
  statsBorder: { borderRadius: 20, padding: 2, marginBottom: 20 },
  statsCard: { backgroundColor: C.card, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 8 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statMini: { flex: 1, alignItems: 'center' },
  statIconRing: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statVal: { fontFamily: FontFamily.bold, fontSize: 15 },
  statLbl: { fontFamily: FontFamily.regular, fontSize: 10, color: C.muted },
  statDivider: { width: 1, height: 44, backgroundColor: C.border },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: C.ink },
  sectionSub: { fontFamily: FontFamily.regular, fontSize: 11, color: C.muted, marginTop: 2 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewAll: { fontFamily: FontFamily.semiBold, fontSize: 13, color: C.primary },
  popularRow: { gap: 12, paddingBottom: 18 },
  popularCard: {
    width: 112, backgroundColor: C.card, borderRadius: 20, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: C.border, ...cardShadow,
  },
  popularIconWrap: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  popularName: { fontFamily: FontFamily.bold, fontSize: 13, color: C.ink },
  popularYears: { fontFamily: FontFamily.regular, fontSize: 10, color: C.muted, marginTop: 3 },
  popularCardSel: {
    width: 112, borderRadius: 20, padding: 14, alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 }, android: { elevation: 8 } }),
  },
  popularIconSel: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  popularNameSel: { fontFamily: FontFamily.bold, fontSize: 13, color: '#FFF' },
  popularYearsSel: { fontFamily: FontFamily.regular, fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  popularCountBadge: {
    position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
  },
  popularCountTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: '#FFF' },
  recentBorder: { borderRadius: 20, padding: 2, marginBottom: 12 },
  recentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
    borderRadius: 18, padding: 14, gap: 12, overflow: 'hidden',
  },
  recentAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  pdfWrap: { width: 54, height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pdfBadge: { position: 'absolute', bottom: -2, right: -4, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  pdfBadgeTxt: { fontFamily: FontFamily.bold, fontSize: 7, color: '#FFF' },
  recentBody: { flex: 1, minWidth: 0 },
  recentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  recentTitle: { flex: 1, fontFamily: FontFamily.bold, fontSize: 14, color: C.ink },
  yearPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  yearPillTxt: { fontFamily: FontFamily.bold, fontSize: 10 },
  recentSubjects: { fontFamily: FontFamily.regular, fontSize: 11, color: C.muted, marginBottom: 8 },
  recentMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FAF8F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  metaChipTxt: { fontFamily: FontFamily.medium, fontSize: 10, color: C.muted },
  attemptChip: { backgroundColor: '#F0F6FF' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 14, gap: 3,
  },
  viewBtnTxt: { fontFamily: FontFamily.semiBold, fontSize: 11, color: '#FFF' },
  emptyBox: { paddingVertical: 32, alignItems: 'center' },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#F5F3FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyTitle: { fontFamily: FontFamily.semiBold, fontSize: 16, color: C.ink },
  emptySub: { fontFamily: FontFamily.regular, fontSize: 12, color: C.muted, marginTop: 6, textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 16 },
  retryTxt: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFF' },
  tipBanner: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 16, marginTop: 8, gap: 12,
    ...Platform.select({ ios: { shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16 }, android: { elevation: 6 } }),
  },
  tipIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFF', marginBottom: 3 },
  tipSub: { fontFamily: FontFamily.regular, fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 16 },
  tipText: { flex: 1 },
});

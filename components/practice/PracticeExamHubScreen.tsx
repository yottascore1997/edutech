import { apiFetchAuth, getImageUrl as getImageUrlFromApi } from '@/constants/api';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import { useToast } from '@/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Crown,
  FileText,
  Flame,
  Grid3x3,
  Info,
  Menu,
  Play,
  Plus,
  Target,
  Trophy,
  TrendingUp,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
import Svg, { Circle } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 16;

const C = {
  bg: '#FAFAFF',
  bgGrad: ['#EDE9FE', '#FDF2F8', '#FAFAFF'] as const,
  primary: '#635BFF',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  ink: '#0F172A',
  inkSoft: '#312E81',
  muted: '#64748B',
  card: '#FFFFFF',
  border: '#E8E8F0',
  sectionBg: '#F3EEFF',
  heroGrad: ['#7C3AED', '#6366F1', '#3B82F6', '#2563EB'] as const,
  ctaGrad: ['#818CF8', '#635BFF', '#4F46E5'] as const,
  streakGrad: ['#8B7CF6', '#635BFF', '#4F46E5'] as const,
  premiumGrad: ['#FEF9C3', '#FEF3C7', '#FFFBEB'] as const,
  cardBorderGrad: ['#E8EEF8', '#F3F6FC', '#FFFCF8'] as const,
  featuredBorder: ['#C4B5FD', '#A5B4FC', '#93C5FD'] as const,
};

interface PracticeExam {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  spots: number;
  spotsLeft: number;
  startTime: string;
  endTime: string;
  attempted: boolean;
  duration?: number;
  categoryLogoUrl?: string;
}

interface CategoryStats {
  totalExams: number;
  attemptedExams: number;
  subcategories: string[];
  categoryLogoUrl?: string;
}

const CATEGORY_GRADS: readonly [string, string][] = [
  ['#818CF8', '#635BFF'],
  ['#60A5FA', '#3B82F6'],
  ['#34D399', '#10B981'],
  ['#FBBF24', '#F59E0B'],
  ['#F472B6', '#EC4899'],
];

const STREAK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const TOPIC_ICONS = [FileText, Target, BookOpen, Grid3x3];

function categoryIcon(name: string): keyof typeof Ionicons.glyphMap {
  const n = name.toLowerCase();
  if (n.includes('rail')) return 'train';
  if (n.includes('bank')) return 'card';
  if (n.includes('ssc')) return 'school';
  if (n.includes('upsc')) return 'library';
  if (n.includes('jee')) return 'calculator';
  if (n.includes('neet')) return 'medical';
  return 'library';
}

function resolveLogo(url?: string) {
  if (!url?.trim()) return null;
  try {
    const u = url.startsWith('http') ? url : getImageUrlFromApi(url);
    return u?.startsWith('http') ? u : null;
  } catch {
    return null;
  }
}

function AccuracyRing({ percent, size = 72 }: { percent: number; size?: number }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, percent)) / 100) * circ;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E0E7FF" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={C.primary}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={st.ringCenter}>
        <Text style={st.ringVal}>{Math.round(percent)}%</Text>
        <Text style={st.ringLbl}>Accuracy</Text>
      </View>
    </View>
  );
}

function StatCol({
  icon,
  value,
  label,
  trend,
  iconBg,
  valueColor,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  iconBg: string;
  valueColor?: string;
}) {
  return (
    <View style={st.statCol}>
      <View style={[st.statColIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={[st.statColVal, valueColor ? { color: valueColor } : null]}>{value}</Text>
      <Text style={st.statColLbl}>{label}</Text>
      {trend ? (
        <View style={st.trendRow}>
          <TrendingUp size={10} color="#059669" strokeWidth={2.5} />
          <Text style={st.trendTxt} numberOfLines={1}>{trend}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function PracticeExamHubScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showError } = useToast();
  const { selectedCategory: globalCategory } = useCategory();
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, CategoryStats>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const fetchPracticeExams = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const apiUrl = globalCategory
        ? `/student/practice-exams?category=${encodeURIComponent(globalCategory)}`
        : '/student/practice-exams';
      const response = await apiFetchAuth(apiUrl, user.token);
      if (response.ok) {
        setExams(Array.isArray(response.data) ? response.data : []);
      } else {
        showError('Failed to load practice exams.');
        setExams([]);
      }
    } catch {
      showError('Network error. Please try again.');
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [user?.token, globalCategory, showError]);

  useEffect(() => {
    fetchPracticeExams();
  }, [fetchPracticeExams]);

  useFocusEffect(
    useCallback(() => {
      fetchPracticeExams();
    }, [fetchPracticeExams])
  );

  useEffect(() => {
    const stats: Record<string, CategoryStats> = {};
    exams.forEach((exam: PracticeExam) => {
      if (!stats[exam.category]) {
        stats[exam.category] = {
          totalExams: 0,
          attemptedExams: 0,
          subcategories: [],
          categoryLogoUrl: exam.categoryLogoUrl,
        };
      }
      stats[exam.category].totalExams++;
      if (exam.attempted) stats[exam.category].attemptedExams++;
      if (exam.subcategory && !stats[exam.category].subcategories.includes(exam.subcategory)) {
        stats[exam.category].subcategories.push(exam.subcategory);
      }
      if (!stats[exam.category].categoryLogoUrl && exam.categoryLogoUrl) {
        stats[exam.category].categoryLogoUrl = exam.categoryLogoUrl;
      }
    });
    setCategoryStats(stats);
  }, [exams]);

  const stats = useMemo(() => {
    const total = exams.length;
    const attempted = exams.filter((e) => e.attempted).length;
    const accuracy = total > 0 ? Math.round((attempted / total) * 100) : 0;
    const totalQuestions = exams.reduce((sum, e) => sum + (e.spots > 0 ? e.spots : 50), 0);
    const bestPct = attempted > 0 ? Math.min(99, 72 + Math.round((attempted / total) * 20)) : 0;
    return { total, attempted, accuracy, totalQuestions, bestPct };
  }, [exams]);

  const categoryList = useMemo(
    () =>
      Object.entries(categoryStats).sort((a, b) => b[1].totalExams - a[1].totalExams),
    [categoryStats]
  );

  const featuredCategory = useMemo(() => {
    if (!categoryList.length) return null;
    const [name, cat] = categoryList[0];
    return { name, ...cat };
  }, [categoryList]);

  const topicCategories = useMemo(() => {
    const map = new Map<string, number>();
    exams.forEach((e) => {
      const key = e.subcategory?.trim() || 'General';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([title, count], i) => ({
        title,
        count,
        desc: `${count} practice tests available`,
        Icon: TOPIC_ICONS[i % TOPIC_ICONS.length],
        colors: CATEGORY_GRADS[i % CATEGORY_GRADS.length],
        badgeBg: `${CATEGORY_GRADS[i % CATEGORY_GRADS.length][1]}18`,
      }));
  }, [exams]);

  const recentExams = useMemo(
    () => [...exams].sort((a, b) => Number(b.attempted) - Number(a.attempted)).slice(0, 8),
    [exams]
  );

  const streakDays = Math.min(7, Math.max(stats.attempted, 1));

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPracticeExams();
    setRefreshing(false);
  };

  const openExam = (exam: PracticeExam) => {
    router.push(`/(tabs)/practice-exam/${exam.id}` as any);
  };

  const openDrawer = () => {
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch {
      router.back();
    }
  };

  const openCategory = (name: string) => {
    router.push(`/(tabs)/exam-category?category=${encodeURIComponent(name)}` as any);
  };

  if (loading && !exams.length) {
    return (
      <View style={[st.centered, { backgroundColor: C.bg, paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={st.loadTxt}>Loading practice exams…</Text>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={[...C.bgGrad]} style={StyleSheet.absoluteFill} />
      <View style={st.orb1} />
      <View style={st.orb2} />

      <SafeAreaView style={st.safe} edges={[]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[st.scrollContent, { paddingBottom: insets.bottom + 28 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} colors={[C.primary]} />
          }
        >
          {/* Header */}
          <View style={st.headerRow}>
            <TouchableOpacity style={st.menuBtn} onPress={openDrawer} activeOpacity={0.88}>
              <Menu size={20} color={C.inkSoft} strokeWidth={2.2} />
            </TouchableOpacity>
            <View style={st.headerCopy}>
              <Text style={st.headerTitle}>
                Practice <Text style={st.headerAccent}>Exams</Text>
              </Text>
              <Text style={st.headerSub}>Practice more. Improve faster.</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => categoryList[0] && openCategory(categoryList[0][0])}
            >
              <LinearGradient colors={[...C.ctaGrad]} style={st.newTestBtn}>
                <Plus size={15} color="#FFF" strokeWidth={2.5} />
                <Text style={st.newTestTxt}>New Test</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Stats dashboard */}
          <View style={st.statsCard}>
            <AccuracyRing percent={stats.accuracy} />
            <View style={st.statsDivider} />
            <View style={st.statsCols}>
              <StatCol
                icon={<ClipboardList size={16} color={C.primary} strokeWidth={2.2} />}
                value={stats.attempted}
                label="Tests Attempted"
                trend={`${Math.min(stats.attempted, 12)} this week`}
                iconBg="#EDE9FE"
              />
              <StatCol
                icon={<Target size={16} color="#059669" strokeWidth={2.2} />}
                value={stats.totalQuestions > 999 ? `${(stats.totalQuestions / 1000).toFixed(1)}k` : stats.totalQuestions}
                label="Total Questions"
                trend={`+${Math.min(120, stats.attempted * 8)} this week`}
                iconBg="#ECFDF5"
              />
              <StatCol
                icon={<Trophy size={16} color="#D97706" strokeWidth={2.2} />}
                value={stats.bestPct > 0 ? `${stats.bestPct}%` : '—'}
                label="Best Score"
                iconBg="#FFFBEB"
                valueColor="#D97706"
              />
            </View>
          </View>

          {/* Streak */}
          <LinearGradient colors={[...C.streakGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.streakCard}>
            <View style={st.streakLeft}>
              <View style={st.streakIconWrap}>
                <Flame size={22} color="#FFF" strokeWidth={2} fill="#FBBF24" />
              </View>
              <View style={st.streakCopy}>
                <Text style={st.streakTitle}>{streakDays} Days Streak</Text>
                <Text style={st.streakSub}>Keep it up! Consistency is the key.</Text>
              </View>
            </View>
            <View style={st.streakDaysRow}>
              {STREAK_DAYS.map((d, i) => {
                const done = i < streakDays;
                return (
                  <View key={`day-${i}`} style={[st.dayCircle, done && st.dayCircleDone]}>
                    {done ? (
                      <Ionicons name="checkmark" size={11} color={C.primary} />
                    ) : (
                      <Text style={st.dayTxt}>{d}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </LinearGradient>

          {/* Choose Exam */}
          {categoryList.length > 0 && (
            <>
              <Text style={st.sectionTitle}>Choose Exam</Text>
              {categoryList.slice(0, 2).map(([name, cat], index) => {
                const logo = resolveLogo(cat.categoryLogoUrl);
                const grad = CATEGORY_GRADS[index % CATEGORY_GRADS.length];
                const open = expandedCat === name;
                return (
                  <TouchableOpacity
                    key={name}
                    activeOpacity={0.9}
                    onPress={() => setExpandedCat(open ? null : name)}
                    style={st.chooseRowWrap}
                  >
                    <View style={st.chooseRow}>
                      <LinearGradient colors={[...grad]} style={st.chooseIcon}>
                        {logo ? (
                          <Image source={{ uri: logo }} style={st.chooseLogo} resizeMode="cover" />
                        ) : (
                          <Ionicons name={categoryIcon(name)} size={18} color="#FFF" />
                        )}
                      </LinearGradient>
                      <Text style={st.chooseName} numberOfLines={1}>{name}</Text>
                      <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
                        <ChevronDown size={18} color={C.muted} strokeWidth={2} />
                      </View>
                    </View>
                    {open ? (
                      <View style={st.chooseExpand}>
                        {exams
                          .filter((e) => e.category === name)
                          .slice(0, 3)
                          .map((exam) => (
                            <TouchableOpacity
                              key={exam.id}
                              style={st.chooseExamItem}
                              onPress={() => openExam(exam)}
                            >
                              <Text style={st.chooseExamTitle} numberOfLines={1}>{exam.title}</Text>
                              <ChevronRight size={14} color={C.primary} />
                            </TouchableOpacity>
                          ))}
                        <TouchableOpacity onPress={() => openCategory(name)}>
                          <Text style={st.chooseViewAll}>View all {cat.totalExams} tests →</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}

              {featuredCategory ? (
                <TouchableOpacity
                  activeOpacity={0.94}
                  onPress={() => openCategory(featuredCategory.name)}
                  style={st.featuredWrap}
                >
                  <LinearGradient colors={[...C.featuredBorder]} style={st.featuredBorder}>
                    <LinearGradient colors={[...C.heroGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.featuredCard}>
                      <View style={st.featuredTop}>
                        <View style={st.featuredIconWrap}>
                          {resolveLogo(featuredCategory.categoryLogoUrl) ? (
                            <Image
                              source={{ uri: resolveLogo(featuredCategory.categoryLogoUrl)! }}
                              style={st.featuredLogo}
                            />
                          ) : (
                            <Ionicons name={categoryIcon(featuredCategory.name)} size={26} color={C.primary} />
                          )}
                          <View style={st.featuredCheck}>
                            <Ionicons name="checkmark" size={10} color="#FFF" />
                          </View>
                        </View>
                        <View style={st.featuredCopy}>
                          <Text style={st.featuredTitle}>{featuredCategory.name}</Text>
                          <Text style={st.featuredSub} numberOfLines={1}>
                            {featuredCategory.subcategories[0] || 'All levels'} · Recruitment prep
                          </Text>
                          <Text style={st.featuredLevel}>
                            {featuredCategory.subcategories.length > 1
                              ? `${featuredCategory.subcategories.length} sections`
                              : 'Practice tests'}
                          </Text>
                        </View>
                        <TouchableOpacity style={st.featuredInfo} hitSlop={10}>
                          <Info size={16} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                      <View style={st.featuredStats}>
                        {[
                          { icon: 'document-text', val: `${featuredCategory.totalExams}`, lbl: 'Total Tests' },
                          { icon: 'help-circle', val: `${stats.totalQuestions > 999 ? '25k+' : stats.totalQuestions}+`, lbl: 'Questions' },
                          { icon: 'time', val: '120 min', lbl: 'Duration' },
                          { icon: 'grid', val: `${Math.max(1, featuredCategory.subcategories.length)}`, lbl: 'Sections' },
                        ].map((s) => (
                          <View key={s.lbl} style={st.featuredStat}>
                            <Ionicons name={s.icon as keyof typeof Ionicons.glyphMap} size={14} color="rgba(255,255,255,0.9)" />
                            <Text style={st.featuredStatVal}>{s.val}</Text>
                            <Text style={st.featuredStatLbl}>{s.lbl}</Text>
                          </View>
                        ))}
                      </View>
                    </LinearGradient>
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          {/* Test Categories */}
          {topicCategories.length > 0 && (
            <>
              <View style={st.sectionHead}>
                <Text style={st.sectionTitle}>Test Categories</Text>
                {categoryList[0] ? (
                  <TouchableOpacity onPress={() => openCategory(categoryList[0][0])}>
                    <Text style={st.viewAll}>View All</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {topicCategories.map((cat) => {
                const Icon = cat.Icon;
                return (
                  <TouchableOpacity
                    key={cat.title}
                    activeOpacity={0.9}
                    onPress={() => {
                      const match = categoryList[0]?.[0];
                      if (match) openCategory(match);
                    }}
                    style={st.topicWrap}
                  >
                    <LinearGradient colors={[...C.cardBorderGrad]} style={st.topicBorder}>
                      <View style={st.topicCard}>
                        <LinearGradient colors={[...cat.colors]} style={st.topicIcon}>
                          <Icon size={20} color="#FFF" strokeWidth={2.2} />
                        </LinearGradient>
                        <View style={st.topicBody}>
                          <Text style={st.topicTitle}>{cat.title}</Text>
                          <Text style={st.topicDesc} numberOfLines={1}>{cat.desc}</Text>
                        </View>
                        <View style={[st.topicBadge, { backgroundColor: cat.badgeBg }]}>
                          <Text style={[st.topicBadgeTxt, { color: cat.colors[1] }]}>{cat.count} Tests</Text>
                        </View>
                        <ChevronRight size={18} color="#CBD5E1" strokeWidth={2} />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Your Tests */}
          <View style={st.sectionHead}>
            <Text style={st.sectionTitle}>Your Tests</Text>
            <View style={st.countPill}>
              <Text style={st.countPillTxt}>{exams.length}</Text>
            </View>
          </View>

          {recentExams.length === 0 ? (
            <View style={st.emptyBox}>
              <LinearGradient colors={['#EDE9FE', '#EFF6FF']} style={st.emptyIcon}>
                <BookOpen size={36} color={C.primary} strokeWidth={1.8} />
              </LinearGradient>
              <Text style={st.emptyTitle}>No practice tests yet</Text>
              <Text style={st.emptySub}>Pick a category above and start your first test.</Text>
            </View>
          ) : (
            recentExams.map((exam) => {
              const progress = exam.attempted ? 92 : 0;
              return (
                <TouchableOpacity key={exam.id} activeOpacity={0.9} onPress={() => openExam(exam)} style={st.examWrap}>
                  <LinearGradient colors={[...C.cardBorderGrad]} style={st.examBorder}>
                    <View style={st.examCard}>
                      <View style={st.examTop}>
                        <LinearGradient
                          colors={exam.attempted ? ['#D1FAE5', '#ECFDF5'] : ['#EDE9FE', '#E0E7FF']}
                          style={st.examIcon}
                        >
                          <Ionicons
                            name={categoryIcon(exam.category)}
                            size={20}
                            color={exam.attempted ? '#059669' : C.primary}
                          />
                        </LinearGradient>
                        <View style={st.examBody}>
                          <Text style={st.examTitle} numberOfLines={2}>{exam.title}</Text>
                          <Text style={st.examMeta} numberOfLines={1}>
                            {exam.subcategory || exam.category} · {exam.spots || 50} Qs
                            {exam.duration ? ` · ${exam.duration} min` : ''}
                          </Text>
                        </View>
                        <ChevronRight size={18} color="#CBD5E1" strokeWidth={2} />
                      </View>
                      <View style={st.examFooter}>
                        {exam.attempted ? (
                          <View style={st.statusDone}>
                            <Text style={st.statusDoneTxt}>{progress}% Completed</Text>
                          </View>
                        ) : (
                          <View style={st.statusPending}>
                            <Clock size={11} color={C.primary} strokeWidth={2} />
                            <Text style={st.statusPendingTxt}>Not Attempted</Text>
                          </View>
                        )}
                        {!exam.attempted ? (
                          <LinearGradient colors={[...C.ctaGrad]} style={st.startBtn}>
                            <Play size={12} color="#FFF" fill="#FFF" strokeWidth={2} />
                            <Text style={st.startBtnTxt}>Start Test</Text>
                          </LinearGradient>
                        ) : (
                          <Text style={st.reviewLink}>View result</Text>
                        )}
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          )}

          {/* Premium */}
          <LinearGradient colors={[...C.premiumGrad]} style={st.premiumCard}>
            <View style={st.premiumTop}>
              <Crown size={24} color="#B45309" strokeWidth={2} />
              <View style={st.premiumCopy}>
                <Text style={st.premiumTitle}>Go Premium</Text>
                <Text style={st.premiumSub}>Unlock all tests, detailed analysis & more</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.92} onPress={() => router.push('/membership' as any)}>
              <LinearGradient colors={['#F59E0B', '#EA580C']} style={st.upgradeBtn}>
                <Text style={st.upgradeTxt}>Upgrade Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  orb1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#DDD6FE',
    top: -80,
    right: -60,
    opacity: 0.45,
  },
  orb2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FBCFE8',
    top: 400,
    left: -70,
    opacity: 0.35,
  },
  safe: { flex: 1 },
  scrollContent: { paddingTop: 2, paddingHorizontal: PAD },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadTxt: { marginTop: 14, fontFamily: FontFamily.medium, fontSize: 15, color: C.primary },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 0,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#635BFF', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8 }
      : { elevation: 2 }),
  },
  headerCopy: { flex: 1, minWidth: 0, paddingTop: 0 },
  headerTitle: { fontFamily: FontFamily.extraBold, fontSize: 22, color: C.ink, lineHeight: 28 },
  headerAccent: { color: C.primary },
  headerSub: { fontFamily: FontFamily.regular, fontSize: 12, color: C.muted, marginTop: 3 },
  newTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    marginTop: 0,
    ...(Platform.OS === 'ios'
      ? { shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
      : { elevation: 4 }),
  },
  newTestTxt: { fontFamily: FontFamily.bold, fontSize: 12, color: '#FFF' },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#635BFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14 }
      : { elevation: 3 }),
  },
  statsDivider: { width: 1, height: 72, backgroundColor: C.border, marginHorizontal: 12 },
  statsCols: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  statCol: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  statColIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statColVal: { fontFamily: FontFamily.extraBold, fontSize: 17, color: C.ink },
  statColLbl: { fontFamily: FontFamily.medium, fontSize: 9, color: C.muted, textAlign: 'center', marginTop: 2 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 },
  trendTxt: { fontFamily: FontFamily.medium, fontSize: 9, color: '#059669' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringVal: { fontFamily: FontFamily.extraBold, fontSize: 16, color: C.ink },
  ringLbl: { fontFamily: FontFamily.medium, fontSize: 9, color: C.muted },

  streakCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#635BFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 12 }
      : { elevation: 5 }),
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  streakIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCopy: { flex: 1 },
  streakTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: '#FFF' },
  streakSub: { fontFamily: FontFamily.regular, fontSize: 12, color: 'rgba(255,255,255,0.88)', marginTop: 2 },
  streakDaysRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleDone: { backgroundColor: '#FFF', borderColor: '#FFF' },
  dayTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: 'rgba(255,255,255,0.75)' },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: C.ink },
  viewAll: { fontFamily: FontFamily.semiBold, fontSize: 13, color: C.primary },

  chooseRowWrap: { marginBottom: 8 },
  chooseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  chooseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chooseLogo: { width: 40, height: 40, borderRadius: 12 },
  chooseName: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 15, color: C.ink },
  chooseExpand: {
    backgroundColor: C.sectionBg,
    borderRadius: 12,
    marginTop: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DCE4F0',
  },
  chooseExamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  chooseExamTitle: { flex: 1, fontFamily: FontFamily.medium, fontSize: 13, color: C.ink },
  chooseViewAll: { fontFamily: FontFamily.semiBold, fontSize: 12, color: C.primary, marginTop: 8 },

  featuredWrap: { marginBottom: 18 },
  featuredBorder: { borderRadius: 22, padding: 2 },
  featuredCard: { borderRadius: 20, padding: 16, overflow: 'hidden' },
  featuredTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  featuredIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  featuredLogo: { width: 52, height: 52, borderRadius: 14 },
  featuredCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  featuredCopy: { flex: 1, marginLeft: 12, minWidth: 0 },
  featuredTitle: { fontFamily: FontFamily.extraBold, fontSize: 17, color: '#FFF' },
  featuredSub: { fontFamily: FontFamily.medium, fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  featuredLevel: { fontFamily: FontFamily.regular, fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  featuredInfo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredStats: { flexDirection: 'row', justifyContent: 'space-between' },
  featuredStat: { alignItems: 'center', flex: 1 },
  featuredStatVal: { fontFamily: FontFamily.bold, fontSize: 12, color: '#FFF', marginTop: 4 },
  featuredStatLbl: { fontFamily: FontFamily.medium, fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  topicWrap: { marginBottom: 10 },
  topicBorder: { borderRadius: 16, padding: 1 },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 15,
    padding: 12,
    gap: 10,
  },
  topicIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicBody: { flex: 1, minWidth: 0 },
  topicTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: C.ink },
  topicDesc: { fontFamily: FontFamily.regular, fontSize: 11, color: C.muted, marginTop: 2 },
  topicBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  topicBadgeTxt: { fontFamily: FontFamily.bold, fontSize: 10 },

  countPill: {
    backgroundColor: 'rgba(99, 91, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countPillTxt: { fontFamily: FontFamily.bold, fontSize: 12, color: C.primary },

  examWrap: { marginBottom: 10 },
  examBorder: { borderRadius: 16, padding: 1 },
  examCard: {
    backgroundColor: C.card,
    borderRadius: 15,
    padding: 12,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#635BFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }
      : { elevation: 2 }),
  },
  examTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  examIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  examBody: { flex: 1, minWidth: 0 },
  examTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: C.ink, lineHeight: 19 },
  examMeta: { fontFamily: FontFamily.regular, fontSize: 11, color: C.muted, marginTop: 2 },
  examFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusDone: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusDoneTxt: { fontFamily: FontFamily.bold, fontSize: 11, color: '#059669' },
  statusPending: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusPendingTxt: { fontFamily: FontFamily.medium, fontSize: 11, color: C.primary },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  startBtnTxt: { fontFamily: FontFamily.bold, fontSize: 12, color: '#FFF' },
  reviewLink: { fontFamily: FontFamily.semiBold, fontSize: 12, color: C.primary },

  emptyBox: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: C.ink },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  premiumCard: {
    marginTop: 8,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    gap: 12,
  },
  premiumTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  premiumCopy: { flex: 1 },
  premiumTitle: { fontFamily: FontFamily.bold, fontSize: 15, color: '#92400E' },
  premiumSub: { fontFamily: FontFamily.regular, fontSize: 12, color: '#B45309', marginTop: 2, lineHeight: 17 },
  upgradeBtn: { paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  upgradeTxt: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFF' },
});

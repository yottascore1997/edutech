import { apiFetchAuth, getImageUrl as getImageUrlFromApi } from '@/constants/api';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    BookOpen,
    ChevronRight
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

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 20;

const C = {
  bg: '#F8FAFF',
  bgCard: '#FFFFFF',
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  secondary: '#EC4899',
  success: '#10B981',
  warning: '#F59E0B',
  ink: '#1F2937',
  inkSoft: '#6B7280',
  muted: '#9CA3AF',
  border: '#E5E7EB',
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
  categoryLogoUrl?: string;
}

const CATEGORY_GRADS: readonly [string, string][] = [
  ['#818CF8', '#4F46E5'],
  ['#F472B6', '#EC4899'],
  ['#34D399', '#10B981'],
  ['#FBBF24', '#F59E0B'],
  ['#A78BFA', '#7C3AED'],
  ['#60A5FA', '#2563EB'],
];

function cleanCategoryName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('ssc')) return 'SSC';
  if (lower.includes('bank')) return 'Banking';
  if (lower.includes('rail')) return 'Railways';
  if (lower.includes('upsc')) return 'UPSC';
  if (lower.includes('jee')) return 'JEE';
  if (lower.includes('neet')) return 'NEET';
  return name.split(' ')[0].toUpperCase();
}

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

function StatCard({
  icon,
  value,
  label,
  gradient,
  subValue,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  gradient: readonly [string, string];
  subValue?: string;
}) {
  return (
    <View style={st.statCardContainer}>
      <LinearGradient colors={[...gradient]} style={st.statCard}>
        <View style={st.statIcon}>{icon}</View>
        <Text style={st.statValue}>{value}</Text>
        <Text style={st.statLabel}>{label}</Text>
        {subValue && <Text style={st.statSubValue}>{subValue}</Text>}
      </LinearGradient>
    </View>
  );
}

function CategoryCard({
  name,
  stats,
  grad,
  index,
  onPress,
}: {
  name: string;
  stats: CategoryStats;
  grad: readonly [string, string];
  index: number;
  onPress: () => void;
}) {
  const logo = resolveLogo(stats.categoryLogoUrl);
  const progress = Math.round((stats.attemptedExams / stats.totalExams) * 100);
  return (
    <TouchableOpacity key={name} activeOpacity={0.9} onPress={onPress} style={st.categoryWrap}>
      <LinearGradient colors={[...grad]} style={st.categoryGrad}>
        <View style={st.categoryCard}>
          <View style={st.categoryLeft}>
            <View style={st.categoryIcon}>
              {logo ? (
                <Image source={{ uri: logo }} style={st.categoryLogo} resizeMode="cover" />
              ) : (
                <Ionicons name={categoryIcon(name)} size={28} color="#FFFFFF" />
              )}
            </View>
            <View style={st.categoryText}>
              <Text style={st.categoryName} numberOfLines={1}>{name}</Text>
              <Text style={st.categorySub}>{stats.totalExams} Tests • {progress}% Complete</Text>
            </View>
          </View>
          <View style={st.categoryRight}>
            <View style={st.progressCircle}>
              <Text style={st.progressText}>{progress}%</Text>
            </View>
            <ChevronRight size={22} color="#FFFFFF80" strokeWidth={2} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function PracticeExamHubScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showError } = useToast();
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, CategoryStats>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPracticeExams = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await apiFetchAuth('/student/practice-exams', user.token);
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
  }, [user?.token, showError]);

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
      const mainCategory = cleanCategoryName(exam.category);
      if (!stats[mainCategory]) {
        stats[mainCategory] = {
          totalExams: 0,
          attemptedExams: 0,
          categoryLogoUrl: exam.categoryLogoUrl,
        };
      }
      stats[mainCategory].totalExams++;
      if (exam.attempted) stats[mainCategory].attemptedExams++;
      if (!stats[mainCategory].categoryLogoUrl && exam.categoryLogoUrl) {
        stats[mainCategory].categoryLogoUrl = exam.categoryLogoUrl;
      }
    });
    setCategoryStats(stats);
  }, [exams]);

  const stats = useMemo(() => {
    const total = exams.length;
    const attempted = exams.filter((e) => e.attempted).length;
    const completion = Math.round((attempted / (total || 1)) * 100);
    const today = new Date().toDateString();
    const todayAttempted = exams.filter((e) => {
      if (!e.startTime) return false;
      try {
        return new Date(e.startTime).toDateString() === today;
      } catch {
        return false;
      }
    }).length;
    return { total, attempted, completion, todayAttempted };
  }, [exams]);

  const categoryList = useMemo(
    () =>
      Object.entries(categoryStats).sort((a, b) => b[1].totalExams - a[1].totalExams),
    [categoryStats]
  );

  const recentExams = useMemo(
    () => [...exams].sort((a, b) => Number(b.attempted) - Number(a.attempted)).slice(0, 3),
    [exams]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPracticeExams();
    setRefreshing(false);
  };

  const openExam = (exam: PracticeExam) => {
    router.push(`/(tabs)/practice-exam/${exam.id}` as any);
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

      <SafeAreaView style={st.safe} edges={[]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[st.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={C.primary}
              colors={[C.primary]}
              style={{ backgroundColor: C.bg }}
            />
          }
        >
          {/* Main Progress Card */}
          <View style={st.mainProgressContainer}>
            <LinearGradient colors={['#818CF8', '#4F46E5']} style={st.mainProgressCard}>
              <View style={st.mainProgressLeft}>
                <Text style={st.mainProgressTitle}>Your Progress</Text>
                <Text style={st.mainProgressSubtitle}>Keep it up! You're doing great! 🚀</Text>
                <View style={st.progressStatsRow}>
                  <View style={st.progressStat}>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={st.progressStatText}>{stats.attempted}</Text>
                    <Text style={st.progressStatLabel}>Completed</Text>
                  </View>
                  <View style={st.progressDivider} />
                  <View style={st.progressStat}>
                    <Ionicons name="calendar" size={18} color="#FFFFFF" />
                    <Text style={st.progressStatText}>{stats.todayAttempted}</Text>
                    <Text style={st.progressStatLabel}>Today</Text>
                  </View>
                  <View style={st.progressDivider} />
                  <View style={st.progressStat}>
                    <Ionicons name="target" size={18} color="#FFFFFF" />
                    <Text style={st.progressStatText}>{stats.total}</Text>
                    <Text style={st.progressStatLabel}>Total</Text>
                  </View>
                </View>
              </View>
              <View style={st.progressCircleContainer}>
                <View style={[st.progressCircleLarge, { borderColor: `rgba(255,255,255,0.3)` }]}>
                  <View style={[st.progressCircleInner, { borderColor: '#FFFFFF', borderWidth: 4 }]}>
                    <Text style={st.progressCircleText}>{stats.completion}%</Text>
                    <Text style={st.progressCircleLabel}>Completion</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Main Categories */}
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>Exam Categories 📚</Text>
            <Text style={st.sectionCount}>{categoryList.length} categories</Text>
          </View>
          {categoryList.map(([name, catStats], index) => (
            <CategoryCard
              key={name}
              name={name}
              stats={catStats}
              grad={CATEGORY_GRADS[index % CATEGORY_GRADS.length]}
              index={index}
              onPress={() => openCategory(name)}
            />
          ))}

          {/* Recent Tests */}
          {recentExams.length > 0 && (
            <>
              <View style={[st.sectionHeader, { marginTop: 16 }]}>
                <Text style={st.sectionTitle}>Recent Tests ✨</Text>
              </View>
              {recentExams.map((exam) => {
                return (
                  <TouchableOpacity key={exam.id} activeOpacity={0.9} onPress={() => openExam(exam)} style={st.recentWrap}>
                    <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={st.recentCard}>
                      <View style={st.recentLeft}>
                        <View style={[st.recentIcon, { backgroundColor: exam.attempted ? `${C.success}20` : `${C.primary}20` }]}>
                          <Ionicons
                            name={categoryIcon(exam.category)}
                            size={22}
                            color={exam.attempted ? C.success : C.primary}
                          />
                        </View>
                        <View style={st.recentText}>
                          <Text style={st.recentTitle} numberOfLines={1}>{exam.title}</Text>
                          <Text style={st.recentMeta}>
                            {cleanCategoryName(exam.category)}
                            {exam.duration ? ` • ${exam.duration} min` : ''}
                          </Text>
                        </View>
                      </View>
                      {!exam.attempted ? (
                        <LinearGradient colors={['#818CF8', '#4F46E5']} style={st.recentBtn}>
                          <Ionicons name="play" size={16} color="#FFFFFF" />
                          <Text style={st.recentBtnTxt}>Start</Text>
                        </LinearGradient>
                      ) : (
                        <View style={st.recentStatusDone}>
                          <Ionicons name="checkmark-circle" size={18} color={C.success} />
                          <Text style={st.recentStatusDoneTxt}>Done</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Empty State */}
          {categoryList.length === 0 && (
            <View style={st.emptyBox}>
              <LinearGradient colors={['#818CF820', '#4F46E520']} style={st.emptyIcon}>
                <BookOpen size={40} color={C.primary} strokeWidth={2} />
              </LinearGradient>
              <Text style={st.emptyTitle}>No practice tests yet</Text>
              <Text style={st.emptySub}>Check back later for new exams to practice!</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingHorizontal: PAD },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadTxt: { marginTop: 14, fontFamily: FontFamily.medium, fontSize: 15, color: C.primary },

  mainProgressContainer: { marginBottom: 20 },
  mainProgressCard: {
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16 }
      : { elevation: 6 }),
  },
  mainProgressLeft: { flex: 1 },
  mainProgressTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  mainProgressSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  progressStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressStat: {
    flex: 1,
    alignItems: 'center',
  },
  progressStatText: {
    fontFamily: FontFamily.extraBold,
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 6,
  },
  progressStatLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  progressDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressCircleContainer: {
    marginLeft: 12,
  },
  progressCircleLarge: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleText: {
    fontFamily: FontFamily.extraBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  progressCircleLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCardContainer: { flex: 1 },
  statCard: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }
      : { elevation: 4 }),
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontFamily: FontFamily.extraBold, fontSize: 20, color: '#FFFFFF' },
  statLabel: { fontFamily: FontFamily.medium, fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  statSubValue: { fontFamily: FontFamily.semiBold, fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontFamily: FontFamily.extraBold, fontSize: 19, color: C.ink },
  sectionCount: { fontFamily: FontFamily.medium, fontSize: 13, color: C.muted },

  categoryWrap: {
    marginBottom: 12,
  },
  categoryGrad: {
    borderRadius: 22,
    padding: 2,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16 }
      : { elevation: 6 }),
  },
  categoryCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryLogo: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  categoryText: {
    flex: 1,
  },
  categoryName: {
    fontFamily: FontFamily.extraBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  categorySub: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressText: {
    fontFamily: FontFamily.extraBold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  recentWrap: {
    marginBottom: 12,
  },
  recentCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: C.border,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }
      : { elevation: 2 }),
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  recentIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: {
    flex: 1,
  },
  recentTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: C.ink,
  },
  recentMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
  },
  recentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  recentBtnTxt: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  recentStatusDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: `${C.success}15`,
  },
  recentStatusDoneTxt: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: C.success,
  },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: 56,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: C.border,
  },
  emptyTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 17,
    color: C.ink,
  },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: '80%',
  },
});

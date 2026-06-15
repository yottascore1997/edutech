import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
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

const PAD = 16;
const isAndroid = Platform.OS === 'android';

const C = {
  bg: '#FAFAFF',
  bgGrad: ['#EDE9FE', '#FDF2F8', '#FAFAFF'] as const,
  primary: '#6344D4',
  primarySoft: '#8E78E7',
  ink: '#0F0A1E',
  muted: '#64748B',
  card: '#FFFFFF',
  border: '#E8E8F0',
  success: '#059669',
  successSoft: '#D1FAE5',
  heroGrad: ['#1A0F3C', '#2D2068', '#4B32AF', '#6D28D9'] as const,
  ctaGrad: ['#8E78E7', '#6344D4'] as const,
  doneGrad: ['#34D399', '#059669'] as const,
};

const CARD_GRADS: readonly [string, string, string][] = [
  ['#C4B5FD', '#8B5CF6', '#6D28D9'],
  ['#93C5FD', '#60A5FA', '#2563EB'],
  ['#A7F3D0', '#34D399', '#059669'],
  ['#FDE68A', '#FBBF24', '#D97706'],
];

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
  logoUrl?: string;
}

function categoryIcon(name: string): keyof typeof Ionicons.glyphMap {
  const n = name.toLowerCase();
  if (n.includes('rail')) return 'train';
  if (n.includes('bank')) return 'card';
  if (n.includes('ssc')) return 'school';
  if (n.includes('math')) return 'calculator';
  if (n.includes('science')) return 'flask';
  if (n.includes('english')) return 'book';
  return 'library';
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function ExamCategoryPage() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const catName = category || 'Practice';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');

  const fetchExamsByCategory = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await apiFetchAuth(
        `/student/practice-exams?category=${encodeURIComponent(catName)}`,
        user.token,
      );
      if (response.ok) {
        const examData = (response.data || []) as PracticeExam[];
        setExams(examData);
      } else {
        setExams([]);
      }
    } catch {
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [user?.token, catName]);

  useEffect(() => {
    fetchExamsByCategory();
  }, [fetchExamsByCategory]);

  const subcategories = useMemo(
    () => [...new Set(exams.map((e) => e.subcategory).filter(Boolean))],
    [exams],
  );

  const filteredExams = useMemo(
    () =>
      selectedSubcategory === 'all'
        ? exams
        : exams.filter((e) => e.subcategory === selectedSubcategory),
    [exams, selectedSubcategory],
  );

  const attemptedCount = exams.filter((e) => e.attempted).length;
  const pendingCount = exams.length - attemptedCount;

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExamsByCategory();
    setRefreshing(false);
  };

  const handleExamPress = (exam: PracticeExam) => {
    if (exam.attempted) {
      router.push(`/(tabs)/practice-exam/${exam.id}/result` as any);
    } else {
      router.push(`/(tabs)/practice-exam/${exam.id}` as any);
    }
  };

  if (loading) {
    return (
      <View style={[st.centered, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <LinearGradient colors={[...C.bgGrad]} style={StyleSheet.absoluteFill} />
        <View style={st.loadRing}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
        <Text style={st.loadTxt}>Loading tests…</Text>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[...C.bgGrad]} style={StyleSheet.absoluteFill} />
      <View style={st.orb1} />
      <View style={st.orb2} />

      <SafeAreaView style={st.safe} edges={[]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          }
        >
          <View style={st.heroWrap}>
            <LinearGradient
              colors={[...C.heroGrad]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.9 }}
              style={st.heroCard}
            >
              <View style={st.heroTop}>
                <TouchableOpacity style={st.backBtn} onPress={() => router.back()} activeOpacity={0.88}>
                  <Ionicons name="arrow-back" size={20} color="#FFF" />
                </TouchableOpacity>
                <View style={st.heroBadge}>
                  <Ionicons name="sparkles" size={14} color="#C4B5FD" />
                  <Text style={st.heroBadgeTxt}>PRACTICE</Text>
                </View>
              </View>

              <View style={st.heroTitleRow}>
                <View style={st.heroIconRing}>
                  <Ionicons name={categoryIcon(catName)} size={26} color="#FFF" />
                </View>
                <View style={st.heroTitleCol}>
                  <Text style={st.heroTitle} numberOfLines={2}>
                    {catName}
                  </Text>
                  <Text style={st.heroSub}>Choose a test & start practicing</Text>
                </View>
              </View>

              <View style={st.heroStats}>
                <View style={st.heroStat}>
                  <Text style={st.heroStatVal}>{exams.length}</Text>
                  <Text style={st.heroStatLbl}>Total</Text>
                </View>
                <View style={st.heroStatSep} />
                <View style={st.heroStat}>
                  <Text style={[st.heroStatVal, { color: '#6EE7B7' }]}>{attemptedCount}</Text>
                  <Text style={st.heroStatLbl}>Done</Text>
                </View>
                <View style={st.heroStatSep} />
                <View style={st.heroStat}>
                  <Text style={[st.heroStatVal, { color: '#FDE68A' }]}>{pendingCount}</Text>
                  <Text style={st.heroStatLbl}>Pending</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={st.body}>
            {subcategories.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={st.filterRow}
              >
                <TouchableOpacity
                  onPress={() => setSelectedSubcategory('all')}
                  activeOpacity={0.88}
                >
                  {selectedSubcategory === 'all' ? (
                    <LinearGradient colors={[...C.ctaGrad]} style={st.filterOn}>
                      <Text style={st.filterOnTxt}>All</Text>
                    </LinearGradient>
                  ) : (
                    <View style={st.filterOff}>
                      <Text style={st.filterOffTxt}>All</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {subcategories.map((sub) => {
                  const active = selectedSubcategory === sub;
                  return (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => setSelectedSubcategory(sub)}
                      activeOpacity={0.88}
                    >
                      {active ? (
                        <LinearGradient colors={[...C.ctaGrad]} style={st.filterOn}>
                          <Text style={st.filterOnTxt} numberOfLines={1}>
                            {sub}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={st.filterOff}>
                          <Text style={st.filterOffTxt} numberOfLines={1}>
                            {sub}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={st.listHead}>
              <Ionicons name="book" size={18} color={C.primary} />
              <Text style={st.listTitle}>
                {selectedSubcategory === 'all' ? 'Available Tests' : selectedSubcategory}
              </Text>
              <View style={st.countPill}>
                <Text style={st.countPillTxt}>{filteredExams.length}</Text>
              </View>
            </View>

            {filteredExams.length === 0 ? (
              <View style={st.empty}>
                <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={st.emptyIcon}>
                  <Ionicons name="library-outline" size={32} color={C.primary} />
                </LinearGradient>
                <Text style={st.emptyTitle}>No tests found</Text>
                <Text style={st.emptySub} numberOfLines={2}>
                  No practice tests in this category right now.
                </Text>
                <TouchableOpacity onPress={onRefresh} activeOpacity={0.9}>
                  <LinearGradient colors={[...C.ctaGrad]} style={st.emptyBtn}>
                    <Text style={st.emptyBtnTxt}>Refresh</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={st.list}>
                {filteredExams.map((exam, index) => {
                  const grad = CARD_GRADS[index % CARD_GRADS.length];
                  const logoUri = exam.logoUrl ? getImageUrl(exam.logoUrl) : null;
                  const done = exam.attempted;

                  return (
                    <TouchableOpacity
                      key={exam.id}
                      activeOpacity={0.92}
                      onPress={() => handleExamPress(exam)}
                    >
                      <View style={st.examCard}>
                        <LinearGradient
                          colors={[grad[0], grad[2]]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={st.examAccent}
                        />
                        <View style={st.examInner}>
                          <View style={st.examTop}>
                            <LinearGradient colors={[...grad]} style={st.examIcon}>
                              {logoUri ? (
                                <Image source={{ uri: logoUri }} style={st.examLogo} />
                              ) : (
                                <Ionicons
                                  name={categoryIcon(exam.category)}
                                  size={isAndroid ? 18 : 20}
                                  color="#FFF"
                                />
                              )}
                            </LinearGradient>
                            <View style={st.examInfo}>
                              <Text style={st.examTitle} numberOfLines={2}>
                                {exam.title}
                              </Text>
                              <Text style={st.examSub} numberOfLines={1}>
                                {exam.subcategory}
                              </Text>
                              <View style={st.metaRow}>
                                <Ionicons name="time" size={14} color={C.muted} />
                                <Text style={st.metaTxt}>{formatDate(exam.startTime)}</Text>
                                <Ionicons name="people" size={14} color={C.muted} />
                                <Text style={st.metaTxt}>
                                  {exam.spotsLeft}/{exam.spots}
                                </Text>
                              </View>
                            </View>
                            {done ? (
                              <View style={st.doneBadge}>
                                <Ionicons name="checkmark-circle" size={18} color={C.success} />
                                <Text style={st.doneBadgeTxt}>Done</Text>
                              </View>
                            ) : (
                              <View style={st.newBadge}>
                                <Text style={st.newBadgeTxt}>NEW</Text>
                              </View>
                            )}
                          </View>

                          <LinearGradient
                            colors={done ? [...C.doneGrad] : [...C.ctaGrad]}
                            style={st.examCta}
                          >
                            {done ? (
                              <Ionicons name="book" size={18} color="#FFF" />
                            ) : (
                              <Ionicons name="play" size={18} color="#FFF" />
                            )}
                            <Text style={st.examCtaTxt}>
                              {done ? 'Review Results' : 'Start Test'}
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color="#FFF" />
                          </LinearGradient>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const cardShadow = Platform.select({
  ios: { shadowColor: '#6D28D9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  android: { elevation: 3 },
});

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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadRing: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  loadTxt: { fontFamily: FontFamily.semiBold, fontSize: 14, color: C.primary },

  heroWrap: { marginHorizontal: PAD, marginTop: isAndroid ? 6 : 10 },
  heroCard: {
    borderRadius: 20,
    padding: isAndroid ? 14 : 16,
    ...cardShadow,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroBadgeTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: 9,
    color: '#E9D5FF',
    letterSpacing: 1,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  heroIconRing: {
    width: isAndroid ? 48 : 52,
    height: isAndroid ? 48 : 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroTitleCol: { flex: 1, minWidth: 0 },
  heroTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: isAndroid ? 20 : 22,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: isAndroid ? 10 : 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatVal: { fontFamily: FontFamily.extraBold, fontSize: 18, color: '#FFFFFF' },
  heroStatLbl: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  heroStatSep: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },

  body: { paddingHorizontal: PAD, marginTop: 14 },
  filterRow: { gap: 8, marginBottom: 12, paddingRight: 8 },
  filterOn: {
    paddingHorizontal: 14,
    paddingVertical: isAndroid ? 6 : 8,
    borderRadius: 18,
  },
  filterOnTxt: { fontFamily: FontFamily.bold, fontSize: 12, color: '#FFF' },
  filterOff: {
    paddingHorizontal: 14,
    paddingVertical: isAndroid ? 6 : 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
  },
  filterOffTxt: { fontFamily: FontFamily.semiBold, fontSize: 12, color: C.primary },

  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  listTitle: { flex: 1, fontFamily: FontFamily.bold, fontSize: 16, color: C.ink },
  countPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countPillTxt: { fontFamily: FontFamily.bold, fontSize: 11, color: C.primary },

  list: { gap: isAndroid ? 8 : 10 },
  examCard: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    ...cardShadow,
  },
  examAccent: { width: 4 },
  examInner: { flex: 1, padding: isAndroid ? 10 : 12 },
  examTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  examIcon: {
    width: isAndroid ? 44 : 48,
    height: isAndroid ? 44 : 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  examLogo: { width: '100%', height: '100%' },
  examInfo: { flex: 1, minWidth: 0 },
  examTitle: {
    fontFamily: FontFamily.bold,
    fontSize: isAndroid ? 14 : 15,
    color: C.ink,
    lineHeight: isAndroid ? 18 : 20,
  },
  examSub: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: C.muted,
    marginTop: 3,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  metaTxt: { fontFamily: FontFamily.medium, fontSize: 10, color: C.muted, marginRight: 8 },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.successSoft,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  doneBadgeTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: C.success },
  newBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: C.primary },
  examCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: isAndroid ? 10 : 11,
    borderRadius: 12,
  },
  examCtaTxt: { fontFamily: FontFamily.bold, fontSize: 13, color: '#FFF', flex: 1, textAlign: 'center' },

  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    ...cardShadow,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: C.ink },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  emptyBtn: {
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
  },
  emptyBtnTxt: { fontFamily: FontFamily.bold, fontSize: 13, color: '#FFF' },
});

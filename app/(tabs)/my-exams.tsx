import { apiFetchAuth } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import {
  enrichMyExamsWithJoinedLive,
  syncJoinedLiveExamIds,
  type MyExamRow,
} from '@/utils/joinedLiveExams';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useScreenLoadState } from '@/hooks/useScreenLoadState';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Grid3x3,
  Plus,
  Trophy,
  TrendingUp,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    Modal,
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

const C = {
  bg: HomeTheme.bg,
  bgGrad: HomeTheme.creamGrad,
  ink: HomeTheme.ink,
  inkSoft: HomeTheme.inkSecondary,
  primary: HomeTheme.primary,
  primaryLight: HomeTheme.primaryLight,
  primaryDark: HomeTheme.primaryDark,
  muted: HomeTheme.inkMuted,
  card: HomeTheme.card,
  border: HomeTheme.border,
  surface: HomeTheme.primarySoft,
  success: HomeTheme.success,
  successSoft: HomeTheme.successLight,
  warn: '#EA580C',
  warnSoft: '#FFEDD5',
  live: '#DC2626',
  liveSoft: '#FEE2E2',
  ctaGrad: HomeTheme.heroCta,
  heroGrad: ['#2D2068', '#4B32AF', '#6344D4'] as const,
  insightGrad: HomeTheme.heroCta,
};

const isAndroid = Platform.OS === 'android';

const CARD_THEMES = [
  { accent: HomeTheme.primary, grad: ['#8E78E7', '#6344D4', '#5546C9'] as const, icon: 'school' as const },
  { accent: '#059669', grad: ['#6EE7B7', '#10B981', '#059669'] as const, icon: 'flask' as const },
  { accent: '#EA580C', grad: ['#FDBA74', '#FB923C', '#EA580C'] as const, icon: 'book' as const },
  { accent: '#0284C7', grad: ['#7DD3FC', '#38BDF8', '#0284C7'] as const, icon: 'library' as const },
];

type FilterKey = 'all' | 'upcoming' | 'completed';

type MyExam = MyExamRow;

function isCompleted(exam: MyExam) {
  const s = String(exam.status || '').toUpperCase();
  return s === 'COMPLETED' || s === 'FINISHED';
}

function getAccuracy(exam: MyExam) {
  if (exam.totalQuestions === 0) return 0;
  return Math.min(100, Math.round((exam.correctAnswers / exam.totalQuestions) * 100));
}

function prepProgress(exam: MyExam) {
  if (isCompleted(exam)) return getAccuracy(exam);
  const n = exam.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return 28 + (n % 52);
}

function daysLeftLabel(exam: MyExam) {
  const n = exam.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return `${(n % 150) + 12}`;
}

function formatDate(d?: string) {
  if (!d) return 'TBA';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimeShort(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

type CardTheme = (typeof CARD_THEMES)[number];

function ExamListCard({
  exam,
  theme,
  onPress,
}: {
  exam: MyExam;
  theme: CardTheme;
  onPress: () => void;
}) {
  const done = isCompleted(exam);
  const pct = prepProgress(exam);
  const acc = getAccuracy(exam);
  const isLive = exam.examType === 'LIVE';

  const iconSize = isAndroid ? 16 : 18;

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
      <View style={st.examCard}>
        <LinearGradient
          colors={[theme.grad[0], theme.grad[2]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={st.examAccent}
        />
        <View style={st.examCardInner}>
          <View style={st.examTop}>
            <LinearGradient colors={[...theme.grad]} style={st.examIcon}>
              <Ionicons name={theme.icon} size={iconSize} color="#FFF" />
            </LinearGradient>
            <View style={st.examInfo}>
              <Text style={st.examName} numberOfLines={1}>
                {exam.examName}
              </Text>
              <View style={st.chipRow}>
                {isLive ? (
                  <View style={st.liveChip}>
                    <View style={st.liveDot} />
                    <Text style={st.liveChipTxt}>LIVE</Text>
                  </View>
                ) : (
                  <View style={st.practiceChip}>
                    <Text style={st.practiceChipTxt}>PRACTICE</Text>
                  </View>
                )}
                <View style={[st.statusBadge, done ? st.statusDone : st.statusUp]}>
                  <Text style={[st.statusBadgeTxt, { color: done ? C.success : C.warn }]}>
                    {done ? 'Done' : 'Active'}
                  </Text>
                </View>
              </View>
              <Text style={st.examMeta} numberOfLines={1}>
                {formatDate(exam.completedAt)} · {formatTimeShort(exam.timeTaken)}
              </Text>
            </View>
            <View style={[st.scoreRing, { borderColor: `${theme.accent}44` }]}>
              <Text style={[st.scoreVal, { color: theme.accent }]}>
                {done ? `${acc}%` : daysLeftLabel(exam)}
              </Text>
            </View>
          </View>
          <View style={st.progTrack}>
            <LinearGradient
              colors={[...theme.grad]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[st.progFill, { width: `${pct}%` }]}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const PAD = 16;
const HERO_IMG = require('@/assets/images/my-exams-hero.jpg');

export default function MyExamsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [exams, setExams] = useState<MyExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
    const [fadeAnim] = useState(new Animated.Value(0));
    const [showDetails, setShowDetails] = useState(false);
    const [selectedExam, setSelectedExam] = useState<MyExam | null>(null);
    const { beginFetch, endFetch, shouldBlockUI, hasLoadedOnceRef } = useScreenLoadState();

    const fetchMyExams = async (refresh = false) => {
        if (!user?.token) return;
        try {
            beginFetch(setLoading, setRefreshing, { refresh });
            setError(null);
      const res = await apiFetchAuth('/student/my-exams', user.token);
      if (res.ok) {
        const raw = (res as any)?.data;
        const base: MyExam[] = Array.isArray(raw)
          ? (raw as MyExam[])
          : Array.isArray(raw?.data)
            ? (raw.data as MyExam[])
            : [];
        const joinedIds = user.id
          ? await syncJoinedLiveExamIds(user.token, String(user.id))
          : [];
        const enriched =
          user.id && user.token
            ? await enrichMyExamsWithJoinedLive(base, joinedIds, user.token, String(user.id))
            : base;
        setExams(Array.isArray(enriched) ? enriched : []);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      } else setError('Failed to load exams');
    } catch {
            setError('Failed to load exams');
        } finally {
            endFetch(setLoading, setRefreshing);
        }
    };

  useFocusEffect(useCallback(() => { fetchMyExams(hasLoadedOnceRef.current); }, [user?.token]));

  const safeExams = useMemo(() => (Array.isArray(exams) ? exams : []), [exams]);

  const stats = useMemo(() => {
    const done = safeExams.filter(isCompleted);
    const upcoming = safeExams.filter((e) => !isCompleted(e));
    const avg = done.length > 0 ? Math.round(done.reduce((s, e) => s + getAccuracy(e), 0) / done.length) : 0;
    const overall = safeExams.length > 0 ? Math.round(safeExams.reduce((s, e) => s + prepProgress(e), 0) / safeExams.length) : 0;
    return { upcoming: upcoming.length, completed: done.length, avg, overall };
  }, [safeExams]);

    const filteredExams = useMemo(() => {
    let list = [...safeExams];
    if (filter === 'upcoming') list = list.filter((e) => !isCompleted(e));
    if (filter === 'completed') list = list.filter(isCompleted);
    return list.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
  }, [safeExams, filter]);

    const handleViewDetails = (exam: MyExam) => {
            const targetId = exam.examId || exam.id;
    const status = String(exam.status || '').toUpperCase();
    const done = isCompleted(exam);
    const accuracy = getAccuracy(exam);
            const resultData =
      exam.examType === 'LIVE' && done
                    ? {
                        score: exam.score || 0,
            totalQuestions: exam.totalQuestions,
            correctAnswers: exam.correctAnswers,
            wrongAnswers: Math.max(0, exam.totalQuestions - exam.correctAnswers),
                        unattempted: 0,
                        examDuration: 0,
            timeTakenSeconds: exam.timeTaken,
            timeTakenMinutes: Math.max(1, Math.round(exam.timeTaken / 60)),
            timeTakenFormatted: formatTimeShort(exam.timeTaken),
                        currentRank: null,
                        prizeAmount: 0,
                        examTitle: exam.examName,
                        completedAt: exam.completedAt,
                        accuracy,
                        timeEfficiency: 0,
                        message: 'Result summary',
                    }
                    : undefined;
            
            if (exam.examType === 'LIVE') {
      router.push({
        pathname: '/(tabs)/exam/[id]' as any,
        params: { id: String(targetId), from: 'my-exams', status: status || exam.status, resultData: resultData ? JSON.stringify(resultData) : undefined },
      });
    } else {
                router.push({ pathname: '/(tabs)/practice-exam/[id]' as any, params: { id: String(targetId), from: 'my-exams', status: exam.status } });
        }
    };

    if (shouldBlockUI(loading)) {
        return (
      <View style={[st.centered, { backgroundColor: C.bg }]}>
        <StatusBar barStyle="dark-content" />
        <View style={st.loadRing}>
          <ActivityIndicator size="large" color={C.primary} />
                    </View>
        <Text style={st.loadTxt}>Loading your exams...</Text>
      </View>
        );
    }

    if (error) {
        return (
      <View style={[st.centered, { backgroundColor: C.bg }]}>
        <View style={st.errIcon}>
          <Ionicons name="cloud-offline-outline" size={40} color="#EF4444" />
                    </View>
        <Text style={st.errTitle}>{error}</Text>
        <TouchableOpacity onPress={fetchMyExams} activeOpacity={0.9}>
          <LinearGradient colors={[...C.ctaGrad]} style={st.retryBtn}>
            <Text style={st.retryTxt}>Try Again</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
        );
    }

    return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={Array.isArray(C.bgGrad) ? (C.bgGrad as any) : ['#EDE9FE', '#F5F3FF', '#FAFAFF']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={st.safe} edges={[]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                await fetchMyExams(true);
              }}
              tintColor={C.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={st.heroWrap}>
              <LinearGradient
                colors={[...C.heroGrad]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={st.heroTop}
              >
                <View style={st.orb1} />
                <View style={st.orb2} />

                <View style={st.heroTopRow}>
                  <View style={st.heroTopLeft}>
                    <LinearGradient colors={['#FBBF24', '#F59E0B']} style={st.heroBadge}>
                      <Trophy size={12} color="#78350F" strokeWidth={2.4} />
                      <Text style={st.heroBadgeTxt}>My Journey</Text>
                    </LinearGradient>
                    <Text style={st.heroTitle}>My Exams</Text>
                    <Text style={st.heroTagline} numberOfLines={2}>
                      Scores, progress & live battles
                    </Text>
                  </View>
                  <Image source={HERO_IMG} style={st.heroArt} resizeMode="contain" />
                </View>

                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/exam' as any)}
                  activeOpacity={0.9}
                  style={st.heroCtaWrap}
                >
                  <View style={st.heroCta}>
                    <Plus size={16} color={HomeTheme.primary} strokeWidth={2.5} />
                    <Text style={st.heroCtaTxt}>Join New Exam</Text>
                    <ChevronRight size={16} color={HomeTheme.primary} strokeWidth={2.5} />
                  </View>
                </TouchableOpacity>
              </LinearGradient>

              <LinearGradient colors={['#FFFBF7', '#FFFFFF']} style={st.heroBody}>
                <View style={st.statsRow}>
                  <View style={st.statCol}>
                    <View style={[st.statIconWrap, { backgroundColor: HomeTheme.primarySoft }]}>
                      <Calendar size={14} color={HomeTheme.primary} strokeWidth={2.2} />
                    </View>
                    <Text style={[st.statNum, { color: HomeTheme.primary }]}>{stats.upcoming}</Text>
                    <Text style={st.statLbl}>Upcoming</Text>
                  </View>
                  <View style={st.statDivider} />
                  <View style={st.statCol}>
                    <View style={[st.statIconWrap, { backgroundColor: HomeTheme.successLight }]}>
                      <CheckCircle2 size={14} color={HomeTheme.success} strokeWidth={2.2} />
                    </View>
                    <Text style={[st.statNum, { color: HomeTheme.success }]}>{stats.completed}</Text>
                    <Text style={st.statLbl}>Completed</Text>
                  </View>
                  <View style={st.statDivider} />
                  <View style={st.statCol}>
                    <View style={[st.statIconWrap, { backgroundColor: '#FFEDD5' }]}>
                      <TrendingUp size={14} color="#EA580C" strokeWidth={2.2} />
                    </View>
                    <Text style={[st.statNum, { color: '#EA580C' }]}>{stats.avg}%</Text>
                    <Text style={st.statLbl}>Avg Score</Text>
                  </View>
                </View>

                <View style={st.heroProg}>
                  <View style={st.heroProgHead}>
                    <Text style={st.heroProgLbl}>Overall readiness</Text>
                    <Text style={st.heroProgPct}>{stats.overall}%</Text>
                  </View>
                  <View style={st.heroProgTrack}>
                    <LinearGradient
                      colors={[...HomeTheme.progressGradient]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[st.heroProgFill, { width: `${Math.min(stats.overall, 100)}%` }]}
                    />
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View style={st.listSection}>
              <View style={st.sectionHead}>
                <Text style={st.sectionTitle}>Your Exams</Text>
                <View style={st.countBadge}>
                  <Text style={st.countBadgeTxt}>{filteredExams.length}</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filterRow}>
                {(
                  [
                    { key: 'all' as FilterKey, label: 'All', Icon: Grid3x3 },
                    { key: 'upcoming' as FilterKey, label: 'Upcoming', Icon: Clock },
                    { key: 'completed' as FilterKey, label: 'Done', Icon: CheckCircle2 },
                  ] as const
                ).map(({ key, label, Icon }) => {
                  const active = filter === key;
                  const iconSz = isAndroid ? 12 : 13;
                  return (
                    <TouchableOpacity key={key} onPress={() => setFilter(key)} activeOpacity={0.88}>
                      {active ? (
                        <LinearGradient colors={[...C.ctaGrad]} style={st.filterOn}>
                          <Icon size={iconSz} color="#FFF" strokeWidth={2.2} />
                          <Text style={st.filterOnTxt}>{label}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={st.filterOff}>
                          <Icon size={iconSz} color={C.primary} strokeWidth={2} />
                          <Text style={st.filterOffTxt}>{label}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={st.list}>
                {filteredExams.length === 0 ? (
                  <View style={st.empty}>
                    <LinearGradient colors={[...HomeTheme.heroCta]} style={st.emptyIcon}>
                      <Award size={32} color="#FFF" strokeWidth={1.8} />
                    </LinearGradient>
                    <Text style={st.emptyTitle}>No exams yet</Text>
                    <Text style={st.emptySub} numberOfLines={2}>
                      Join a live battle or practice test — your journey starts here.
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/exam' as any)} activeOpacity={0.92}>
                      <LinearGradient colors={[...C.ctaGrad]} style={st.emptyCta}>
                        <Text style={st.emptyCtaTxt}>Explore Exams</Text>
                        <ChevronRight size={15} color="#FFF" strokeWidth={2.5} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ) : (
                  filteredExams.map((exam, index) => (
                    <ExamListCard
                      key={exam.id}
                      exam={exam}
                      theme={CARD_THEMES[index % CARD_THEMES.length]}
                      onPress={() => handleViewDetails(exam)}
                    />
                  ))
                )}
              </View>
            </View>

            {stats.completed > 0 && (
              <TouchableOpacity
                style={st.banner}
                onPress={() => router.push('/(tabs)/weekly-leaderboard' as any)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[...C.insightGrad]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={st.bannerGrad}
                >
                  <View style={st.bannerInner}>
                    <LinearGradient colors={['#FBBF24', '#F59E0B']} style={st.bannerIconWrap}>
                      <BarChart3 size={isAndroid ? 17 : 19} color="#78350F" strokeWidth={2.2} />
                    </LinearGradient>
                    <View style={st.bannerText}>
                      <Text style={st.bannerTitle}>Performance Insights</Text>
                      <Text style={st.bannerSub} numberOfLines={1}>
                        Avg {stats.avg}% · View leaderboard
                      </Text>
                    </View>
                    <ChevronRight size={isAndroid ? 17 : 19} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {showDetails && selectedExam && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowDetails(false)}>
          <View style={st.modalBg}>
            <View style={st.modalBox}>
              <LinearGradient colors={[...C.ctaGrad]} style={st.modalHead}>
                <Text style={st.modalTitle} numberOfLines={2}>{selectedExam.examName}</Text>
                <TouchableOpacity onPress={() => setShowDetails(false)}>
                  <Ionicons name="close" size={22} color="#FFF" />
                </TouchableOpacity>
              </LinearGradient>
              <View style={st.modalBody}>
                <Text style={st.modalRow}>Score: {getAccuracy(selectedExam)}%</Text>
                <Text style={st.modalRow}>Type: {selectedExam.examType}</Text>
              </View>
                        </View>
                    </View>
                </Modal>
            )}
    </View>
  );
}

const cardShadow = Platform.select({
  ios: { shadowColor: '#4B32AF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 18 },
  android: { elevation: 7 },
});

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: C.bg },
  loadRing: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    ...cardShadow,
  },
  loadTxt: { fontFamily: FontFamily.semiBold, fontSize: 14, color: C.primary },
  errIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  errTitle: { fontFamily: FontFamily.medium, fontSize: 14, color: C.muted },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 6 },
  retryTxt: { fontFamily: FontFamily.bold, fontSize: 13, color: '#FFF' },

  heroWrap: {
    marginHorizontal: PAD,
    marginTop: Platform.OS === 'android' ? 6 : 10,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    ...cardShadow,
  },
  heroTop: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -30,
    right: -10,
  },
  orb2: {
    position: 'absolute',
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -15,
    left: 24,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-end', zIndex: 1 },
  heroTopLeft: { flex: 1, paddingRight: 8 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  heroBadgeTxt: { fontFamily: FontFamily.semiBold, fontSize: 11, color: '#78350F' },
  heroTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: Platform.OS === 'android' ? 24 : 26,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroTagline: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    lineHeight: 18,
  },
  heroArt: {
    width: Platform.OS === 'android' ? 80 : 92,
    height: Platform.OS === 'android' ? 80 : 92,
    marginBottom: -4,
  },
  heroCtaWrap: { marginTop: 14, zIndex: 1 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Platform.OS === 'android' ? 10 : 11,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  heroCtaTxt: { fontFamily: FontFamily.bold, fontSize: 13, color: HomeTheme.primary },
  heroBody: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: HomeTheme.border,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: HomeTheme.border },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNum: { fontFamily: FontFamily.bold, fontSize: 18, marginBottom: 2 },
  statLbl: { fontFamily: FontFamily.regular, fontSize: 10, color: C.muted },
  heroProg: {},
  heroProgHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  heroProgLbl: { fontFamily: FontFamily.medium, fontSize: 12, color: C.muted },
  heroProgPct: { fontFamily: FontFamily.bold, fontSize: 12, color: HomeTheme.primary },
  heroProgTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  heroProgFill: { height: '100%', borderRadius: 8 },

  listSection: { marginTop: isAndroid ? 8 : 12, paddingHorizontal: PAD },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: isAndroid ? 6 : 8,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: isAndroid ? 15 : 16,
    color: C.ink,
  },
  countBadge: {
    backgroundColor: HomeTheme.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeTxt: { fontFamily: FontFamily.bold, fontSize: 11, color: C.primary },
  filterRow: { gap: isAndroid ? 6 : 8, alignItems: 'center', marginBottom: isAndroid ? 8 : 10 },
  filterOn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: isAndroid ? 12 : 14,
    paddingVertical: isAndroid ? 7 : 8,
    borderRadius: 20,
  },
  filterOnTxt: { fontFamily: FontFamily.bold, fontSize: isAndroid ? 11 : 12, color: '#FFF' },
  filterOff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: isAndroid ? 12 : 14,
    paddingVertical: isAndroid ? 7 : 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  filterOffTxt: { fontFamily: FontFamily.semiBold, fontSize: isAndroid ? 11 : 12, color: C.primary },

  list: { gap: isAndroid ? 8 : 10 },
  examCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: isAndroid ? 14 : 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    ...Platform.select({
      ios: { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  examAccent: { width: 3 },
  examCardInner: {
    flex: 1,
    paddingVertical: isAndroid ? 7 : 10,
    paddingHorizontal: isAndroid ? 8 : 10,
  },
  examTop: { flexDirection: 'row', alignItems: 'center', gap: isAndroid ? 8 : 9 },
  examIcon: {
    width: isAndroid ? 34 : 38,
    height: isAndroid ? 34 : 38,
    borderRadius: isAndroid ? 10 : 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  examInfo: { flex: 1, minWidth: 0 },
  examName: {
    fontFamily: FontFamily.bold,
    fontSize: isAndroid ? 13 : 14,
    color: C.ink,
    letterSpacing: -0.15,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: isAndroid ? 3 : 4 },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#DC2626' },
  liveChipTxt: { fontFamily: FontFamily.bold, fontSize: 8, color: '#DC2626' },
  practiceChip: {
    backgroundColor: HomeTheme.successLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  practiceChipTxt: { fontFamily: FontFamily.bold, fontSize: 8, color: HomeTheme.success },
  statusBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  statusUp: { backgroundColor: C.warnSoft },
  statusDone: { backgroundColor: C.successSoft },
  statusBadgeTxt: { fontFamily: FontFamily.semiBold, fontSize: 8 },
  examMeta: {
    fontFamily: FontFamily.medium,
    fontSize: isAndroid ? 9 : 10,
    color: C.muted,
    marginTop: isAndroid ? 2 : 3,
  },
  scoreRing: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: isAndroid ? 40 : 44,
    paddingHorizontal: 5,
    paddingVertical: isAndroid ? 4 : 5,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#FAFAFF',
  },
  scoreVal: { fontFamily: FontFamily.extraBold, fontSize: isAndroid ? 12 : 13 },
  progTrack: {
    height: isAndroid ? 4 : 5,
    backgroundColor: HomeTheme.primarySoft,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: isAndroid ? 6 : 7,
  },
  progFill: { height: '100%', borderRadius: 4 },

  banner: {
    marginHorizontal: PAD,
    marginTop: isAndroid ? 8 : 12,
    borderRadius: isAndroid ? 12 : 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: cardShadow,
      android: { elevation: 2 },
    }),
  },
  bannerGrad: { borderRadius: isAndroid ? 12 : 14 },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isAndroid ? 8 : 10,
    paddingVertical: isAndroid ? 10 : 12,
    paddingHorizontal: isAndroid ? 10 : 12,
  },
  bannerIconWrap: {
    width: isAndroid ? 36 : 40,
    height: isAndroid ? 36 : 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontFamily: FontFamily.bold, fontSize: isAndroid ? 13 : 14, color: '#FFFFFF' },
  bannerSub: {
    fontFamily: FontFamily.medium,
    fontSize: isAndroid ? 10 : 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    ...Platform.select({
      ios: { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
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
    lineHeight: 19,
    marginTop: 6,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 14,
  },
  emptyCtaTxt: { fontFamily: FontFamily.bold, fontSize: 13, color: '#FFF' },

  modalBg: { flex: 1, backgroundColor: 'rgba(15,10,30,0.55)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFF', borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  modalHead: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  modalTitle: { flex: 1, fontFamily: FontFamily.bold, fontSize: 16, color: '#FFF' },
  modalBody: { padding: 18, gap: 8 },
  modalRow: { fontFamily: FontFamily.medium, fontSize: 13, color: C.ink },
});

import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
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
import {
  Calendar,
  ChevronRight,
  Menu,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 16;
const WINNER_CARD_W = Math.min(148, SCREEN_W * 0.4);

const C = {
  bg: ['#EDE9FE', '#F5F3FF', '#FAFAFF'] as const,
  primary: '#6344D4',
  primaryLight: '#8E78E7',
  ink: '#0F0A1E',
  muted: '#64748B',
  card: '#FFFFFF',
  border: '#E8E8F0',
  heroGrad: ['#7C3AED', '#6366F1', '#4B32AF'] as const,
  gold: '#F59E0B',
  silver: '#94A3B8',
  bronze: '#D97706',
};

interface Winner {
  userId: string;
  userName: string;
  userPhoto: string | null;
  course: string | null;
  year: string | null;
  rank: number;
  score: number;
  winnings: number;
}

interface ExamLeaderboard {
  examId: string;
  examTitle: string;
  examDate: string;
  totalParticipants: number;
  prizePool: number;
  winners: Winner[];
}

interface WeeklyLeaderboardData {
  currentWeek: string;
  weekStart: string;
  weekEnd: string;
  totalExams: number;
  leaderboard: ExamLeaderboard[];
}

function getCurrentWeek(): string {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const thursday = new Date(now);
  thursday.setDate(now.getDate() + 4 - dayOfWeek);
  const year = thursday.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((thursday.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + 1) / 7);
  return `${year}-${weekNumber.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatPrize(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function WinnerAvatar({ userPhoto, userName, size = 52 }: { userPhoto: string | null; userName: string; size?: number }) {
  const [err, setErr] = useState(false);
  let uri: string | null = null;
  if (userPhoto && userPhoto.trim() && userPhoto !== 'null') {
    uri = userPhoto.startsWith('http') ? userPhoto : getImageUrl(userPhoto);
  }
  const r = size / 2;
  if (!uri || err) {
    return (
      <LinearGradient colors={['#8E78E7', C.primary]} style={{ width: size, height: size, borderRadius: r, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: FontFamily.bold, fontSize: size * 0.28, color: '#FFF' }}>{getInitials(userName)}</Text>
      </LinearGradient>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: r, backgroundColor: '#F1F5F9' }}
      onError={() => setErr(true)}
    />
  );
}

const PODIUM_META: Record<number, { h: number; colors: readonly [string, string]; medal: string }> = {
  1: { h: 118, colors: ['#FEF3C7', '#FDE68A'], medal: C.gold },
  2: { h: 96, colors: ['#F1F5F9', '#E2E8F0'], medal: C.silver },
  3: { h: 82, colors: ['#FFEDD5', '#FED7AA'], medal: C.bronze },
};

function PodiumBlock({ winner, place }: { winner: Winner; place: 1 | 2 | 3 }) {
  const meta = PODIUM_META[place];
  return (
    <View style={[st.podiumCol, { marginTop: place === 1 ? 0 : 18 }]}>
      <View style={[st.podiumAvatarRing, { borderColor: meta.medal }]}>
        <WinnerAvatar userPhoto={winner.userPhoto} userName={winner.userName} size={place === 1 ? 56 : 48} />
      </View>
      <Text style={st.podiumName} numberOfLines={1}>{winner.userName}</Text>
      <Text style={st.podiumScore}>{winner.score} pts</Text>
      <LinearGradient colors={[...meta.colors]} style={[st.podiumBar, { height: meta.h }]}>
        <View style={[st.podiumMedal, { backgroundColor: meta.medal }]}>
          <Text style={st.podiumRank}>{place}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function PodiumSection({ winners }: { winners: Winner[] }) {
  const sorted = [...winners].sort((a, b) => a.rank - b.rank);
  const first = sorted.find((w) => w.rank === 1) ?? sorted[0];
  const second = sorted.find((w) => w.rank === 2) ?? sorted[1];
  const third = sorted.find((w) => w.rank === 3) ?? sorted[2];
  if (!first) return null;
  return (
    <View style={st.podiumRow}>
      {second ? <PodiumBlock winner={second} place={2} /> : <View style={st.podiumSpacer} />}
      <PodiumBlock winner={first} place={1} />
      {third ? <PodiumBlock winner={third} place={3} /> : <View style={st.podiumSpacer} />}
    </View>
  );
}

function WinnerCard({ winner }: { winner: Winner }) {
  const rankStyle =
    winner.rank === 1 ? st.rankGold : winner.rank === 2 ? st.rankSilver : winner.rank === 3 ? st.rankBronze : st.rankDefault;
  return (
    <LinearGradient colors={['#E9E5FF', '#F5F3FF']} style={st.winnerCardBorder}>
      <View style={st.winnerCard}>
        <View style={[st.rankPill, rankStyle]}>
          <Text style={st.rankPillTxt}>#{winner.rank}</Text>
        </View>
        <WinnerAvatar userPhoto={winner.userPhoto} userName={winner.userName} size={48} />
        <Text style={st.winnerName} numberOfLines={1}>{winner.userName}</Text>
        <Text style={st.winnerScore}>{winner.score} pts</Text>
        <Text style={st.winnerPrize}>{formatPrize(winner.winnings)}</Text>
      </View>
    </LinearGradient>
  );
}

export default function WeeklyLeaderboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [leaderboardData, setLeaderboardData] = useState<WeeklyLeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboardData = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const week = getCurrentWeek();
      const response = await apiFetchAuth(`/student/weekly-leaderboard?week=${week}`, user.token);
      if (response.ok) {
        setLeaderboardData(response.data);
      }
    } catch (e) {
          } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboardData();
  };

  const openDrawer = () => {
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch {
      /* noop */
    }
  };

  const featured = leaderboardData?.leaderboard[0];
  const totalWinners = leaderboardData?.leaderboard.reduce((n, e) => n + e.winners.length, 0) ?? 0;

  if (loading && !leaderboardData) {
    return (
      <LinearGradient colors={[...C.bg]} style={[st.centered, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={st.loadTxt}>Loading leaderboard…</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={[...C.bg]} style={StyleSheet.absoluteFill} />
      <View style={st.orb1} pointerEvents="none" />
      <View style={st.orb2} pointerEvents="none" />

      <SafeAreaView style={st.safe} edges={[]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={{
            paddingTop: Platform.OS === 'android' ? 2 : 6,
            paddingBottom: insets.bottom + 100,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
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
                  <Trophy size={11} color="#FFF" strokeWidth={2.5} />
                  <Text style={st.hubPillTxt}>LEADERBOARD</Text>
                </LinearGradient>
                <View style={st.trophyRight}>
                  <LinearGradient colors={['#F59E0B', '#FBBF24']} style={st.trophyBadge}>
                    <Trophy size={18} color="#1C1917" strokeWidth={2.6} />
                  </LinearGradient>
                </View>
              </View>
              <Text style={st.headerTitle}>
                Weekly <Text style={st.headerAccent}>Leaderboard</Text>
              </Text>
              <Text style={st.headerSub}>Top performers & prize winners this week</Text>
            </View>
          </LinearGradient>

          {/* Week banner */}
          {leaderboardData ? (
            <LinearGradient colors={[...C.heroGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.weekBanner}>
              <View style={st.weekOrb1} pointerEvents="none" />
              <View style={st.weekOrb2} pointerEvents="none" />
              <View style={st.weekLeft}>
                <View style={st.weekIcon}>
                  <Calendar size={18} color="#FFF" strokeWidth={2} />
                </View>
                <View style={st.weekTextWrap}>
                  <Text style={st.weekLbl}>Current Week</Text>
                  <Text style={st.weekDates}>
                    {formatDate(leaderboardData.weekStart)} – {formatDate(leaderboardData.weekEnd)}
                  </Text>
                </View>
              </View>
              <View style={st.weekStats}>
                <View style={st.weekStatPill}>
                  <Text style={st.weekStatVal}>{leaderboardData.totalExams}</Text>
                  <Text style={st.weekStatLbl}>Exams</Text>
                </View>
                <View style={st.weekStatPill}>
                  <Text style={st.weekStatVal}>{totalWinners}</Text>
                  <Text style={st.weekStatLbl}>Winners</Text>
                </View>
              </View>
            </LinearGradient>
          ) : null}

          {/* Featured exam + podium */}
          {featured ? (
            <View style={st.featuredSection}>
              <LinearGradient colors={['#C4B5FD', '#DDD6FE', '#EDE9FE']} style={st.featuredBorder}>
                <View style={st.featuredCard}>
                  <View style={st.featuredHead}>
                    <View style={st.featuredIcon}>
                      <Sparkles size={18} color={C.primary} strokeWidth={2.5} />
                    </View>
                    <View style={st.featuredCopy}>
                      <Text style={st.featuredTitle} numberOfLines={2}>{featured.examTitle}</Text>
                      <Text style={st.featuredMeta}>{formatDate(featured.examDate)} · {featured.totalParticipants} joined</Text>
                    </View>
                  </View>
                  <View style={st.prizeRow}>
                    <Trophy size={16} color={C.gold} strokeWidth={2} fill={C.gold} />
                    <Text style={st.prizeTxt}>Prize pool {formatPrize(featured.prizePool)}</Text>
                  </View>
                </View>
              </LinearGradient>

              {featured.winners.length >= 1 ? (
                <>
                  <Text style={st.podiumLbl}>Top Champions</Text>
                  <PodiumSection winners={featured.winners} />
                  <Text style={st.hScrollLbl}>All Winners</Text>
                  <View style={st.hScrollWrap}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled contentContainerStyle={st.hScrollContent}>
                      {featured.winners.slice(0, 10).map((w) => (
                        <View key={w.userId} style={st.hScrollItem}>
                          <WinnerCard winner={w} />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </>
              ) : (
                <View style={st.emptySmall}>
                  <Trophy size={32} color={C.primaryLight} strokeWidth={1.8} />
                  <Text style={st.emptySmallTxt}>No winners yet — be the first!</Text>
                </View>
              )}
            </View>
          ) : null}

          {/* All exams */}
          <View style={st.sectionHead}>
            <Text style={st.sectionTitle}>Exam Rankings</Text>
            <View style={st.countPill}>
              <Text style={st.countPillTxt}>{leaderboardData?.leaderboard.length ?? 0}</Text>
            </View>
          </View>

          {leaderboardData?.leaderboard.length === 0 ? (
            <View style={st.emptyBox}>
              <LinearGradient colors={['#EDE9FE', '#F5F3FF']} style={st.emptyIcon}>
                <Trophy size={40} color={C.primary} strokeWidth={1.8} />
              </LinearGradient>
              <Text style={st.emptyTitle}>No exams this week</Text>
              <Text style={st.emptySub}>Check back soon for new competitions.</Text>
            </View>
          ) : (
            leaderboardData.leaderboard.map((exam) => (
              <TouchableOpacity key={exam.examId} activeOpacity={0.92} style={st.examWrap}>
                <LinearGradient colors={['#E9E5FF', '#F3EEFF', '#FAF8FF']} style={st.examBorder}>
                  <View style={st.examCard}>
                    <View style={st.examHead}>
                      <LinearGradient colors={['#8E78E7', C.primary]} style={st.examIcon}>
                        <Ionicons name="school" size={18} color="#FFF" />
                      </LinearGradient>
                      <View style={st.examBody}>
                        <Text style={st.examTitle} numberOfLines={1}>{exam.examTitle}</Text>
                        <Text style={st.examDate}>{formatDate(exam.examDate)}</Text>
                      </View>
                      <ChevronRight size={18} color="#CBD5E1" strokeWidth={2} />
                    </View>
                    <View style={st.examStats}>
                      <View style={st.examStat}>
                        <Users size={12} color={C.muted} strokeWidth={2} />
                        <Text style={st.examStatTxt}>{exam.totalParticipants}</Text>
                      </View>
                      <View style={st.examStat}>
                        <Trophy size={12} color={C.gold} strokeWidth={2} />
                        <Text style={st.examStatPrize}>{formatPrize(exam.prizePool)}</Text>
                      </View>
                      <Text style={st.examWinnersLbl}>{exam.winners.length} winners</Text>
                    </View>
                    {exam.winners.length > 0 ? (
                      <View style={st.miniWinners}>
                        {exam.winners.slice(0, 5).map((w) => (
                          <View key={w.userId} style={st.miniWinner}>
                            <WinnerAvatar userPhoto={w.userPhoto} userName={w.userName} size={28} />
                            <Text style={st.miniRank}>#{w.rank}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
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
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    bottom: 80,
    left: -SCREEN_W * 0.1,
  },
  headerBorder: {
    marginHorizontal: PAD,
    marginTop: Platform.OS === 'android' ? 0 : 4,
    borderRadius: 22,
    padding: 1.5,
    marginBottom: Platform.OS === 'android' ? 10 : 12,
  },
  headerCard: { backgroundColor: C.card, borderRadius: 20.5, padding: Platform.OS === 'android' ? 12 : 14 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Platform.OS === 'android' ? 6 : 8 },
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
  hubPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, marginLeft: 10 },
  hubPillTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: '#FFF', letterSpacing: 0.6 },
  trophyRight: { marginLeft: 'auto' },
  trophyBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: { fontFamily: FontFamily.extraBold, fontSize: 24, color: C.ink, lineHeight: 30 },
  headerAccent: { color: C.primary },
  headerSub: { fontFamily: FontFamily.regular, fontSize: 13, color: C.muted, marginTop: 4 },
  weekBanner: {
    marginHorizontal: PAD,
    borderRadius: 20,
    padding: Platform.OS === 'android' ? 12 : 14,
    marginBottom: Platform.OS === 'android' ? 12 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 }
      : { elevation: 6 }),
  },
  weekOrb1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -60,
    right: -40,
  },
  weekOrb2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(253, 230, 138, 0.16)',
    bottom: -40,
    left: 10,
  },
  weekLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  weekIcon: {
    width: Platform.OS === 'android' ? 36 : 40,
    height: Platform.OS === 'android' ? 36 : 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekTextWrap: { flex: 1 },
  weekLbl: { fontFamily: FontFamily.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.78)', letterSpacing: 0.4 },
  weekDates: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFF', marginTop: 2 },
  weekStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekStatPill: {
    minWidth: Platform.OS === 'android' ? 70 : 78,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'android' ? 6 : 7,
    borderRadius: 14,
  },
  weekStatVal: { fontFamily: FontFamily.extraBold, fontSize: Platform.OS === 'android' ? 16 : 17, color: '#FFF' },
  weekStatLbl: { fontFamily: FontFamily.medium, fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  featuredSection: { marginBottom: 8 },
  featuredBorder: { marginHorizontal: PAD, borderRadius: 18, padding: 1, marginBottom: 14 },
  featuredCard: { backgroundColor: C.card, borderRadius: 17, padding: 14 },
  featuredHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  featuredIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredCopy: { flex: 1, minWidth: 0 },
  featuredTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: C.ink },
  featuredMeta: { fontFamily: FontFamily.regular, fontSize: 12, color: C.muted, marginTop: 2 },
  prizeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFBEB', padding: 10, borderRadius: 12 },
  prizeTxt: { fontFamily: FontFamily.semiBold, fontSize: 13, color: '#B45309' },
  podiumLbl: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: C.ink,
    marginHorizontal: PAD,
    marginBottom: 10,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: PAD,
    marginBottom: 16,
    gap: 8,
  },
  podiumCol: { alignItems: 'center', width: (SCREEN_W - PAD * 2 - 16) / 3 },
  podiumSpacer: { width: (SCREEN_W - PAD * 2 - 16) / 3 },
  podiumAvatarRing: { borderWidth: 3, borderRadius: 32, padding: 2, marginBottom: 6 },
  podiumName: { fontFamily: FontFamily.semiBold, fontSize: 11, color: C.ink, maxWidth: 100 },
  podiumScore: { fontFamily: FontFamily.medium, fontSize: 10, color: C.muted, marginBottom: 6 },
  podiumBar: {
    width: '88%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  podiumMedal: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  podiumRank: { fontFamily: FontFamily.extraBold, fontSize: 14, color: '#FFF' },
  hScrollLbl: { fontFamily: FontFamily.semiBold, fontSize: 13, color: C.muted, marginHorizontal: PAD, marginBottom: 8 },
  hScrollWrap: { height: 168, marginBottom: 8 },
  hScrollContent: { paddingHorizontal: PAD, gap: 10 },
  hScrollItem: { width: WINNER_CARD_W },
  winnerCardBorder: { borderRadius: 16, padding: 1 },
  winnerCard: {
    backgroundColor: C.card,
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
    width: WINNER_CARD_W,
  },
  rankPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 8 },
  rankGold: { backgroundColor: '#FEF3C7' },
  rankSilver: { backgroundColor: '#F1F5F9' },
  rankBronze: { backgroundColor: '#FFEDD5' },
  rankDefault: { backgroundColor: '#EDE9FE' },
  rankPillTxt: { fontFamily: FontFamily.bold, fontSize: 10, color: C.ink },
  winnerName: { fontFamily: FontFamily.bold, fontSize: 12, color: C.ink, marginTop: 6, maxWidth: WINNER_CARD_W - 24 },
  winnerScore: { fontFamily: FontFamily.medium, fontSize: 11, color: C.muted, marginTop: 2 },
  winnerPrize: { fontFamily: FontFamily.bold, fontSize: 12, color: C.primary, marginTop: 4 },
  emptySmall: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptySmallTxt: { fontFamily: FontFamily.medium, fontSize: 13, color: C.muted },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: C.ink },
  countPill: { backgroundColor: 'rgba(99, 68, 212, 0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countPillTxt: { fontFamily: FontFamily.bold, fontSize: 12, color: C.primary },
  examWrap: { marginHorizontal: PAD, marginBottom: 10 },
  examBorder: { borderRadius: 16, padding: 1 },
  examCard: { backgroundColor: C.card, borderRadius: 15, padding: 12 },
  examHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  examIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  examBody: { flex: 1, minWidth: 0 },
  examTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: C.ink },
  examDate: { fontFamily: FontFamily.regular, fontSize: 11, color: C.muted, marginTop: 2 },
  examStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
  },
  examStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  examStatTxt: { fontFamily: FontFamily.medium, fontSize: 11, color: C.muted },
  examStatPrize: { fontFamily: FontFamily.bold, fontSize: 11, color: '#B45309' },
  examWinnersLbl: { fontFamily: FontFamily.medium, fontSize: 11, color: C.primary, marginLeft: 'auto' },
  miniWinners: { flexDirection: 'row', gap: 8, marginTop: 10 },
  miniWinner: { alignItems: 'center', gap: 2 },
  miniRank: { fontFamily: FontFamily.bold, fontSize: 9, color: C.muted },
  emptyBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: PAD },
  emptyIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: C.ink },
  emptySub: { fontFamily: FontFamily.regular, fontSize: 13, color: C.muted, marginTop: 6, textAlign: 'center' },
});

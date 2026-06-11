import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import StudyPartnerBottomNav from '@/components/StudyPartnerBottomNav';
import { Ionicons } from '@expo/vector-icons';
import { useScreenLoadState } from '@/hooks/useScreenLoadState';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  ChevronRight,
  Flame,
  Heart,
  MapPin,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 16;
const BUDDY_W = 168;
const DISCOVER_CARD_H = Math.min(400, SCREEN_W * 1.02);

const INTEREST_TAGS: Record<string, string[]> = {
  JEE: ['Physics', 'Mathematics', 'Mock Tests'],
  NEET: ['Biology', 'Chemistry', 'Physics'],
  GATE: ['Aptitude', 'Technical', 'Mock Tests'],
  UPSC: ['Current Affairs', 'GS', 'Essay'],
  default: ['Study Plan', 'Notes', 'Revision'],
};

const C = {
  bg: ['#EDE9FE', '#FDF2F8', '#FAFAFF'] as const,
  primary: '#6344D4',
  primaryLight: '#8E78E7',
  pink: '#EC4899',
  ink: '#0F0A1E',
  muted: '#64748B',
  card: '#FFFFFF',
  border: '#E8E8F0',
  heroGrad: ['#F8F4FF', '#FCE7F3', '#EDE9FE'] as const,
  ctaGrad: ['#1A0F3C', '#2D2068', '#312E81'] as const,
  heroCta: ['#A78BFA', '#8E78E7', '#6344D4', '#5546C9'] as const,
};

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  JEE: { bg: '#F3EEFF', text: '#6344D4' },
  NEET: { bg: '#ECFDF5', text: '#059669' },
  GATE: { bg: '#EFF6FF', text: '#2563EB' },
  UPSC: { bg: '#FFFBEB', text: '#D97706' },
  default: { bg: '#F3EEFF', text: '#7C3AED' },
};

type Buddy = {
  id: string;
  name: string;
  examType?: string | null;
  bio?: string | null;
  profilePhoto?: string | null;
  matchPct: number;
};

type DiscoverProfile = {
  id: string;
  userId: string;
  name: string;
  examType?: string | null;
  bio?: string | null;
  goals?: string | null;
  language?: string | null;
  profilePhoto?: string | null;
  photos?: string[] | null;
  matchPct: number;
};

function normalizeDiscovery(p: Record<string, unknown>): DiscoverProfile {
  const id = String(p.userId ?? p.id ?? '');
  return {
    id: String(p.id ?? id),
    userId: id,
    name: String(p.name ?? 'Student'),
    examType: (p.examType as string) ?? null,
    bio: (p.bio as string) ?? null,
    goals: (p.goals as string) ?? null,
    language: (p.language as string) ?? null,
    profilePhoto: (p.profilePhoto as string) ?? null,
    photos: Array.isArray(p.photos) ? (p.photos as string[]) : null,
    matchPct: pseudoMatch(id),
  };
}

function resolvePhotoUri(profile: DiscoverProfile) {
  const raw =
    (profile.photos?.[0] || profile.profilePhoto || '') as string;
  if (!raw) return null;
  return raw.startsWith('http') ? raw : getImageUrl(raw);
}

function interestTagsFor(exam?: string | null) {
  const key = Object.keys(INTEREST_TAGS).find((k) =>
    (exam || '').toUpperCase().includes(k)
  );
  return INTEREST_TAGS[key ?? 'default'] ?? INTEREST_TAGS.default;
}

function tagFor(exam?: string | null) {
  const e = (exam || 'General').toUpperCase();
  const key = Object.keys(TAG_COLORS).find((k) => e.includes(k)) || 'default';
  const colors = TAG_COLORS[key] ?? TAG_COLORS.default;
  return { label: exam || 'Exam Prep', ...colors };
}

function pseudoMatch(id: string) {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return 78 + (n % 22);
}

function formatCount(n: number, suffix = '') {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M${suffix}`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K${suffix}`;
  return `${n}${suffix}`;
}

function ProgressRing({ pct, size = 52 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E9E0FF" strokeWidth={5} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#6344D4"
          strokeWidth={5}
          fill="none"
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={st.ringTxt}>{Math.round(pct)}%</Text>
    </View>
  );
}

function StatCard({ icon, value, label, colors }: {
  icon: React.ReactElement;
  value: string;
  label: string;
  colors: readonly [string, string];
}) {
  return (
    <View style={st.statCardOuter}>
      <LinearGradient colors={['#FFFFFF', '#FAFAFF']} style={st.statCard}>
        <LinearGradient colors={colors} style={st.statIcon}>{icon}</LinearGradient>
        <Text style={st.statVal}>{value}</Text>
        <Text style={st.statLbl} numberOfLines={2}>{label}</Text>
      </LinearGradient>
    </View>
  );
}

function DiscoverSwipeCard({
  profiles,
  cardIndex,
  actionLoading,
  lastAction,
  onPass,
  onLike,
  onSuperLike,
  onOpenDiscover,
}: {
  profiles: DiscoverProfile[];
  cardIndex: number;
  actionLoading: boolean;
  lastAction: 'like' | 'pass' | null;
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onOpenDiscover: () => void;
}) {
  const safeProfiles = Array.isArray(profiles) ? profiles : [];
  const current = safeProfiles[cardIndex];
  const next = safeProfiles[cardIndex + 1];
  const total = Math.max(safeProfiles.length, 1);

  if (!current) {
    return (
      <View style={st.discoverEmpty}>
        <Ionicons name="people-outline" size={40} color={C.primaryLight} />
        <Text style={st.discoverEmptyTitle}>No more profiles right now</Text>
        <TouchableOpacity onPress={onOpenDiscover} activeOpacity={0.9}>
          <LinearGradient colors={[...C.heroCta]} style={st.discoverEmptyBtn}>
            <Text style={st.discoverEmptyBtnTxt}>Open Discover</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const photoUri = resolvePhotoUri(current);
  const tags = interestTagsFor(current.examType);
  const goalLabel = current.examType || current.goals || 'Exam Preparation';
  const eduLine = current.goals || 'Student • Exam Prep';
  const location = current.language ? `${current.language}` : '📍 India';

  return (
    <View style={st.discoverWrap}>
      {lastAction && (
        <View style={[st.actionFb, lastAction === 'like' ? st.actionFbLike : st.actionFbPass]}>
          <Ionicons name={lastAction === 'like' ? 'heart' : 'close'} size={14} color={lastAction === 'like' ? '#059669' : '#DC2626'} />
          <Text style={st.actionFbTxt}>{lastAction === 'like' ? 'You liked this profile' : 'Passed'}</Text>
        </View>
      )}

      <View style={st.cardStack}>
        {next ? (
          <View style={[st.swipeCard, st.swipeCardBehind]}>
            <LinearGradient colors={['#C4B5FD', '#E9D5FF']} style={st.swipeCardPlaceholder} />
          </View>
        ) : null}

        <View style={st.swipeCard}>
          {photoUri ? (
            <ImageBackground source={{ uri: photoUri }} style={st.swipePhoto} imageStyle={st.swipePhotoImg}>
              <CardOverlays
                current={current}
                cardIndex={cardIndex}
                total={total}
                tags={tags}
                goalLabel={goalLabel}
                eduLine={eduLine}
                location={location}
              />
            </ImageBackground>
          ) : (
            <LinearGradient colors={['#C4B5FD', '#8E78E7', '#6344D4']} style={st.swipePhoto}>
              <Text style={st.swipeInitial}>{current.name.charAt(0)}</Text>
              <CardOverlays
                current={current}
                cardIndex={cardIndex}
                total={total}
                tags={tags}
                goalLabel={goalLabel}
                eduLine={eduLine}
                location={location}
              />
            </LinearGradient>
          )}
        </View>
      </View>

      <View style={st.actionRow}>
        <TouchableOpacity style={st.actBtnPass} onPress={onPass} disabled={actionLoading} activeOpacity={0.9}>
          <LinearGradient colors={['#FFFFFF', '#F8F4FF']} style={st.actBtnInner}>
            <X size={24} color={C.primary} strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={st.actBtnStar} onPress={onSuperLike} disabled={actionLoading} activeOpacity={0.9}>
          <LinearGradient colors={['#FEF9C3', '#FDE68A']} style={st.actBtnInner}>
            <Star size={22} color="#B45309" strokeWidth={2.5} fill="#FBBF24" />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={st.actBtnLike} onPress={onLike} disabled={actionLoading} activeOpacity={0.9}>
          <LinearGradient colors={['#F472B6', '#EC4899', '#DB2777']} style={st.actBtnLikeGrad}>
            {actionLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Heart size={26} color="#FFF" fill="#FFF" strokeWidth={2} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CardOverlays({
  current,
  cardIndex,
  total,
  tags,
  goalLabel,
  eduLine,
  location,
}: {
  current: DiscoverProfile;
  cardIndex: number;
  total: number;
  tags: string[];
  goalLabel: string;
  eduLine: string;
  location: string;
}) {
  return (
    <>
      <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent']} style={st.swipeTopGrad} />
      <View style={st.swipeTopRow}>
        <LinearGradient colors={['#FDE047', '#FBBF24']} style={st.matchPill}>
          <Star size={10} color="#78350F" fill="#78350F" />
          <Text style={st.matchPillTxt}>{current.matchPct}% Match</Text>
        </LinearGradient>
        <View style={st.countPill}>
          <Text style={st.countPillTxt}>{cardIndex + 1}/{total}</Text>
        </View>
      </View>

      <View style={st.interestCol}>
        {tags.map((t) => (
          <View key={t} style={st.interestPill}>
            <Text style={st.interestPillTxt}>{t}</Text>
          </View>
        ))}
      </View>

      <LinearGradient colors={['transparent', 'rgba(15,10,30,0.92)']} style={st.swipeBottomGrad}>
        <View style={st.nameRow}>
          <Text style={st.swipeName}>{current.name}</Text>
          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
        </View>
        <Text style={st.swipeEdu}>{eduLine}</Text>
        <View style={st.goalBadge}>
          <Text style={st.goalBadgeTxt}>{goalLabel}</Text>
        </View>
        <View style={st.locRow}>
          <MapPin size={12} color="rgba(255,255,255,0.9)" />
          <Text style={st.locTxt}>{location}</Text>
        </View>
        {current.bio ? (
          <Text style={st.swipeBio} numberOfLines={2}>{current.bio}</Text>
        ) : (
          <Text style={st.swipeBio} numberOfLines={2}>
            Looking for a study partner to prepare together and achieve big! 🚀
          </Text>
        )}
      </LinearGradient>
    </>
  );
}

export default function StudyPartnerHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchesCount, setMatchesCount] = useState(0);
  const [whoLikedCount, setWhoLikedCount] = useState(0);
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [discoveryProfiles, setDiscoveryProfiles] = useState<DiscoverProfile[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastAction, setLastAction] = useState<'like' | 'pass' | null>(null);
  const [profileDone, setProfileDone] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const actionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { beginFetch, endFetch, shouldBlockUI, hasLoadedOnceRef } = useScreenLoadState();

  const load = useCallback(async (refresh = false) => {
    if (!user?.token) { setLoading(false); return; }
    beginFetch(setLoading, setRefreshing, { refresh });
      setError(null);
      try {
      const [profRes, matchesRes, whoRes, discRes] = await Promise.all([
          apiFetchAuth('/student/study-partner/profile', user.token),
          apiFetchAuth('/student/study-partner/matches', user.token),
          apiFetchAuth('/student/study-partner/who-liked-you', user.token),
        apiFetchAuth('/student/study-partner/discovery?limit=8', user.token),
      ]);
      const prof = (profRes.data as { bio?: string }) || {};
      setProfileDone(!!prof.bio);
      const matches = (matchesRes.data as unknown[]) || [];
      const who = (whoRes.data as unknown[]) || [];
      setMatchesCount(matches.length);
      setWhoLikedCount(who.length);
        const disc = (discRes.data as Array<Record<string, unknown>>) || [];
        const normalized = disc.map((p) => normalizeDiscovery(p));
        setDiscoveryProfiles(normalized);
        setCardIndex(0);
        setBuddies(
          normalized.slice(0, 6).map((p) => ({
            id: p.userId,
            name: p.name,
            examType: p.examType,
            bio: p.bio,
            profilePhoto: p.profilePhoto,
            matchPct: p.matchPct,
          }))
        );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
      endFetch(setLoading, setRefreshing);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  }, [user?.token, fadeAnim, beginFetch, endFetch]);

  useFocusEffect(useCallback(() => { load(hasLoadedOnceRef.current); }, [load]));

  const sendDiscoverAction = async (action: 'like' | 'pass') => {
    const current = discoveryProfiles[cardIndex];
    if (!user?.token || !current || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await apiFetchAuth('/student/study-partner/like', user.token, {
        method: 'POST',
        body: { targetUserId: current.userId, action },
      });
      const data = res.data as { newMatch?: boolean };
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
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
      setLastAction(action);
      actionTimerRef.current = setTimeout(() => setLastAction(null), 1400);
      setCardIndex((i) => i + 1);
    } catch (e) {
          } finally {
      setActionLoading(false);
    }
  };

  const displayBuddies = useMemo(() => {
    if (buddies.length) return buddies;
    return [
      { id: '1', name: 'Priya Sharma', examType: 'JEE Preparation', matchPct: 92, profilePhoto: null },
      { id: '2', name: 'Rahul Verma', examType: 'GATE Preparation', matchPct: 88, profilePhoto: null },
      { id: '3', name: 'Ananya Singh', examType: 'NEET Preparation', matchPct: 85, profilePhoto: null },
    ];
  }, [buddies]);

  if (!user?.token) {
    return (
      <View style={st.centered}>
        <Text style={st.loginTitle}>Study Partner</Text>
        <Text style={st.loginSub}>Please login to find your study buddy</Text>
      </View>
    );
  }

  if (shouldBlockUI(loading)) {
  return (
      <LinearGradient colors={[...C.bg]} style={[st.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={st.loadTxt}>Finding study buddies…</Text>
          </LinearGradient>
    );
  }

  return (
    <View style={st.root}>
      <LinearGradient colors={[...C.bg]} style={StyleSheet.absoluteFill} />
      <View style={st.orb1} /><View style={st.orb2} />

      <SafeAreaView style={st.safe} edges={[]}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 2, paddingBottom: insets.bottom + 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />}
          >
            {error ? (
              <TouchableOpacity style={st.errBox} onPress={() => load(false)}>
                <Text style={st.errTxt}>{error} — Tap to retry</Text>
              </TouchableOpacity>
            ) : null}

            {/* Screen header */}
            <View style={st.screenHeader}>
              <View style={st.screenHeaderLeft}>
                <LinearGradient colors={['#FDE047', '#FACC15']} style={st.screenBadge}>
                  <Sparkles size={11} color="#713F12" strokeWidth={2.2} />
                  <Text style={st.screenBadgeTxt}>Study Partner</Text>
                </LinearGradient>
                <Text style={st.screenTitle}>Find your study partner</Text>
                <Text style={st.screenSub}>Match with students preparing for the same goals</Text>
              </View>
              {matchesCount > 0 ? (
                <TouchableOpacity
                  style={st.matchChip}
                  activeOpacity={0.88}
                  onPress={() => router.push('/(tabs)/study-partner-matches' as any)}
                >
                  <Heart size={14} color={C.pink} fill={C.pink} />
                  <Text style={st.matchChipTxt}>{matchesCount}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Hero */}
            <View style={st.heroWrap}>
              <LinearGradient colors={['#C4B5FD', '#F0ABFC', '#DDD6FE']} style={st.heroBorder}>
                <LinearGradient colors={[...C.heroGrad]} style={st.heroCard}>
                  <View style={st.heroRow}>
                    <View style={st.heroCopy}>
                      <Text style={st.heroTitle}>
                        Study <Text style={st.heroAccent}>Together</Text>
                      </Text>
                      <Text style={st.heroSub}>Swipe, match & grow with the perfect buddy</Text>
                      <TouchableOpacity activeOpacity={0.92} onPress={() => router.push('/(tabs)/study-partner-discover' as any)}>
                        <LinearGradient colors={[...C.heroCta]} style={st.heroCta}>
                          <Text style={st.heroCtaTxt}>Start Discovering</Text>
                          <ArrowRight size={16} color="#FFF" strokeWidth={2.5} />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                    <Image
                      source={require('@/assets/images/icons/partner.png')}
                      style={st.heroImg}
                      resizeMode="contain"
                    />
                  </View>
                </LinearGradient>
              </LinearGradient>
            </View>

            {/* Stats — 3 blocks, no scroll */}
            <View style={st.statsRow}>
              <StatCard icon={<Users size={15} color="#FFF" strokeWidth={2.2} />} value="12K+" label="Active Buddies" colors={['#8E78E7', C.primary]} />
              <StatCard icon={<Target size={15} color="#FFF" strokeWidth={2.2} />} value={formatCount(Math.max(matchesCount, 8500), '+')} label="Matches Made" colors={['#F472B6', C.pink]} />
              <StatCard icon={<TrendingUp size={15} color="#FFF" strokeWidth={2.2} />} value="95%" label="Success Rate" colors={['#34D399', '#10B981']} />
            </View>

            {/* Study Journey */}
            <View style={st.secHead}>
              <Text style={st.secTitle}>Your Study Journey</Text>
              <TouchableOpacity style={st.viewProgress} activeOpacity={0.85} onPress={() => router.push('/(tabs)/study-partner-profile' as any)}>
                <Text style={st.viewProgressTxt}>View Progress</Text>
                <ArrowRight size={14} color={C.primary} strokeWidth={2.5} />
              </TouchableOpacity>
                  </View>
            <View style={st.journeyRow}>
              <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={st.journeyCard}>
                <View style={st.journeyIconWrap}>
                  <Flame size={16} color="#EA580C" fill="#F97316" />
                </View>
                <Text style={st.journeyVal}>7 Days</Text>
                <Text style={st.journeyLbl} numberOfLines={1}>Streak</Text>
              </LinearGradient>
              <View style={[st.journeyCard, st.journeyCardWhite]}>
                <ProgressRing pct={(matchesCount % 7) / 7 * 100 || 57} size={36} />
                <Text style={st.journeyVal}>{Math.min(matchesCount, 7)}/7</Text>
                <Text style={st.journeyLbl} numberOfLines={1}>Weekly</Text>
              </View>
              <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={st.journeyCard}>
                <View style={[st.journeyIconWrap, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="time-outline" size={16} color="#059669" />
                </View>
                <Text style={st.journeyVal}>12h</Text>
                <Text style={st.journeyLbl} numberOfLines={1}>This Week</Text>
              </LinearGradient>
            </View>

            {/* Discover swipe card — like & profile */}
            <View style={st.secHead}>
              <Text style={st.secTitle}>Swipe to Connect</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/study-partner-discover' as any)}>
                <Text style={st.seeAll}>Full Discover</Text>
              </TouchableOpacity>
              </View>
            <DiscoverSwipeCard
              profiles={discoveryProfiles}
              cardIndex={cardIndex}
              actionLoading={actionLoading}
              lastAction={lastAction}
              onPass={() => sendDiscoverAction('pass')}
              onLike={() => sendDiscoverAction('like')}
              onSuperLike={() => sendDiscoverAction('like')}
              onOpenDiscover={() => router.push('/(tabs)/study-partner-discover' as any)}
            />

            {/* Boost matches */}
            {!profileDone && (
            <TouchableOpacity
                style={st.boostWrap}
                activeOpacity={0.92}
                onPress={() => router.push('/(tabs)/study-partner-profile' as any)}
              >
                <LinearGradient colors={['#60A5FA', '#8E78E7', C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.boostBanner}>
                  <View style={st.boostTextCol}>
                    <Text style={st.boostTitle}>Boost your matches! 🚀</Text>
                    <Text style={st.boostSub}>Complete your profile for better buddy recommendations</Text>
                </View>
                  <View style={st.boostBtn}>
                    <Text style={st.boostBtnTxt}>Complete Profile</Text>
                    <ArrowRight size={14} color={C.primary} strokeWidth={2.5} />
              </View>
              </LinearGradient>
            </TouchableOpacity>
            )}

            {/* Top buddies */}
            <View style={st.secHead}>
              <Text style={st.secTitle}>Top Study Buddies</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/study-partner-discover' as any)}>
                <Text style={st.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.buddyRow}>
              {displayBuddies.map((b) => {
                const tag = tagFor(b.examType);
                const photo = b.profilePhoto
                  ? (b.profilePhoto.startsWith('http') ? b.profilePhoto : getImageUrl(b.profilePhoto))
                  : null;
                return (
            <TouchableOpacity
                    key={b.id}
                    activeOpacity={0.92}
                    style={st.buddyCard}
                    onPress={() => router.push({
                      pathname: '/(tabs)/study-partner-liked-user' as any,
                      params: {
                        userId: b.id,
                        name: b.name,
                        profilePhoto: b.profilePhoto || '',
                        examType: b.examType || '',
                        fromMatchOrChat: 'true',
                      },
                    })}
                  >
                    <View style={st.buddyPhotoRing}>
                      <View style={st.buddyPhotoWrap}>
                        {photo ? (
                          <Image source={{ uri: photo }} style={st.buddyPhoto} />
                        ) : (
                          <LinearGradient colors={['#C4B5FD', '#8E78E7', '#6344D4']} style={st.buddyPhoto}>
                            <Text style={st.buddyInitial}>{b.name.charAt(0)}</Text>
                          </LinearGradient>
                        )}
                        <View style={st.onlineDot} />
                      </View>
                    </View>
                    <Text style={st.buddyName} numberOfLines={1}>{b.name}</Text>
                    <Text style={st.buddyMeta} numberOfLines={1}>{b.examType || 'Exam Prep'}</Text>
                    <View style={[st.buddyTag, { backgroundColor: tag.bg }]}>
                      <Text style={[st.buddyTagTxt, { color: tag.text }]} numberOfLines={1}>{tag.label}</Text>
                </View>
                    <View style={st.buddyFoot}>
                      <Text style={st.matchTxt}>{b.matchPct}% Match</Text>
                      <TouchableOpacity
                        style={st.chatBtn}
                        onPress={() => router.push('/(tabs)/messages' as any)}
                        hitSlop={8}
                      >
                        <Ionicons name="chatbubble" size={14} color="#FFF" />
            </TouchableOpacity>
            </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Quick actions */}
          {whoLikedCount > 0 && (
              <TouchableOpacity style={st.likedBanner} activeOpacity={0.9} onPress={() => router.push('/(tabs)/study-partner-who-liked-you' as any)}>
                <LinearGradient colors={['#FDF2F8', '#F3EEFF']} style={st.likedGrad}>
                  <Heart size={18} color={C.pink} fill={C.pink} />
                  <Text style={st.likedTxt}>{whoLikedCount} people liked your profile</Text>
                  <ArrowRight size={16} color={C.primary} />
                </LinearGradient>
            </TouchableOpacity>
          )}

            {/* How it works */}
            <Text style={[st.secTitle, { paddingHorizontal: PAD, marginTop: 8, marginBottom: 12 }]}>How It Works</Text>
            <View style={st.howList}>
              {[
                { step: '01', icon: 'person-circle-outline' as const, title: 'Create Profile', sub: 'Set goals & exam preferences', color: '#6344D4', bg: '#F3EEFF' },
                { step: '02', icon: 'heart' as const, title: 'Find a Match', sub: 'Swipe & connect with buddies', color: '#EC4899', bg: '#FCE7F3' },
                { step: '03', icon: 'people' as const, title: 'Study Together', sub: 'Chat, plan & grow together', color: '#2563EB', bg: '#EFF6FF' },
              ].map((item) => (
                <View key={item.step} style={st.howCard}>
                  <View style={[st.howIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={st.howCardBody}>
                    <View style={st.howStepRow}>
                      <Text style={st.howStepNum}>{item.step}</Text>
                      <Text style={st.howTitle}>{item.title}</Text>
                    </View>
                    <Text style={st.howSub}>{item.sub}</Text>
                  </View>
                  <ChevronRight size={16} color={C.muted} strokeWidth={2} />
                </View>
              ))}
            </View>

            {/* Profile CTA */}
            {!profileDone && (
              <TouchableOpacity style={st.profileCta} activeOpacity={0.9} onPress={() => router.push('/(tabs)/study-partner-profile' as any)}>
                <LinearGradient colors={['#8E78E7', C.primary]} style={st.profileCtaGrad}>
                  <Sparkles size={18} color="#FFF" />
                  <View style={{ flex: 1 }}>
                    <Text style={st.profileCtaTitle}>Complete your profile</Text>
                    <Text style={st.profileCtaSub}>Get better matches — takes 2 min</Text>
                </View>
                  <ArrowRight size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
            )}

            <TouchableOpacity style={st.matchesLink} activeOpacity={0.9} onPress={() => router.push('/(tabs)/study-partner-matches' as any)}>
              <Text style={st.matchesLinkTxt}>{matchesCount} active match{matchesCount === 1 ? '' : 'es'} — View all</Text>
              <ArrowRight size={16} color={C.primary} />
            </TouchableOpacity>
        </ScrollView>
        </Animated.View>
      </SafeAreaView>
      <StudyPartnerBottomNav />
    </View>
  );
}

const purpleSh = Platform.select({
  ios: { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 12 },
  android: { elevation: 4 },
});

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAFF' },
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadTxt: { fontFamily: FontFamily.medium, fontSize: 14, color: C.muted, marginTop: 12 },
  loginTitle: { fontFamily: FontFamily.bold, fontSize: 22, color: C.ink },
  loginSub: { fontFamily: FontFamily.regular, fontSize: 14, color: C.muted, marginTop: 6 },
  orb1: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: '#DDD6FE', top: -80, right: -60, opacity: 0.45 },
  orb2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#FBCFE8', top: 400, left: -70, opacity: 0.35 },
  errBox: { marginHorizontal: PAD, padding: 12, backgroundColor: '#FEF2F2', borderRadius: 12, marginBottom: 10, marginTop: 4 },
  errTxt: { fontFamily: FontFamily.medium, fontSize: 13, color: '#DC2626', textAlign: 'center' },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    marginBottom: 12,
    marginTop: 6,
  },
  screenHeaderLeft: { flex: 1, paddingRight: 10 },
  screenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  screenBadgeTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: '#713F12',
    letterSpacing: 0.3,
  },
  screenTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 24,
    color: C.ink,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  screenSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
    lineHeight: 17,
  },
  matchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FBCFE8',
    ...purpleSh,
  },
  matchChipTxt: { fontFamily: FontFamily.bold, fontSize: 14, color: C.pink },
  heroWrap: { marginHorizontal: PAD, marginBottom: 16, ...purpleSh },
  heroBorder: { borderRadius: 22, padding: 2 },
  heroCard: { borderRadius: 20, padding: 16, overflow: 'hidden', minHeight: 152 },
  heroOrb: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.45)', top: -28, right: 24 },
  heroOrb2: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(236,72,153,0.12)', bottom: 8, left: 12 },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroCopy: { flex: 1, paddingRight: 4 },
  heroTitle: { fontFamily: FontFamily.extraBold, fontSize: 20, color: C.ink, lineHeight: 26 },
  heroAccent: { color: C.primary },
  heroSub: { fontFamily: FontFamily.regular, fontSize: 11, color: C.muted, marginTop: 4, marginBottom: 10, lineHeight: 16 },
  heroCta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, gap: 6 },
  heroCtaTxt: { fontFamily: FontFamily.bold, fontSize: 12, color: '#FFF' },
  heroImg: { width: 130, height: 130 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: PAD,
    gap: 8,
    paddingBottom: 14,
  },
  statCardOuter: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    padding: 1.5,
    backgroundColor: '#EDE9FE',
    ...purpleSh,
  },
  statCard: {
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    minHeight: 72,
  },
  statIcon: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statVal: { fontFamily: FontFamily.bold, fontSize: 12, color: C.ink },
  statLbl: { fontFamily: FontFamily.regular, fontSize: 8, color: C.muted, textAlign: 'center', marginTop: 1 },
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: PAD, marginBottom: 12 },
  secTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: C.ink },
  viewProgress: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewProgressTxt: { fontFamily: FontFamily.semiBold, fontSize: 13, color: C.primary },
  seeAll: { fontFamily: FontFamily.semiBold, fontSize: 13, color: C.primaryLight },
  journeyRow: {
    flexDirection: 'row',
    paddingHorizontal: PAD,
    gap: 8,
    paddingBottom: 14,
  },
  journeyCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
  },
  journeyCardWhite: { backgroundColor: C.card, borderColor: C.border, ...purpleSh },
  journeyIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  journeyVal: { fontFamily: FontFamily.bold, fontSize: 13, color: C.ink },
  journeyLbl: { fontFamily: FontFamily.medium, fontSize: 9, color: C.muted, marginTop: 1, textAlign: 'center' },
  ringTxt: { position: 'absolute', fontFamily: FontFamily.bold, fontSize: 9, color: C.primary },
  buddyRow: { paddingHorizontal: PAD, gap: 12, paddingBottom: 16 },
  buddyCard: {
    width: BUDDY_W,
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    ...purpleSh,
  },
  buddyPhotoRing: {
    alignSelf: 'center',
    marginBottom: 10,
    padding: 2.5,
    borderRadius: 40,
    backgroundColor: '#EDE9FE',
  },
  buddyPhotoWrap: { position: 'relative' },
  buddyPhoto: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  buddyInitial: { fontFamily: FontFamily.bold, fontSize: 28, color: '#FFF' },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#22C55E', borderWidth: 2.5, borderColor: '#FFF',
  },
  buddyName: { fontFamily: FontFamily.bold, fontSize: 14, color: C.ink, textAlign: 'center' },
  buddyMeta: { fontFamily: FontFamily.regular, fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 2 },
  buddyTag: { alignSelf: 'center', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  buddyTagTxt: { fontFamily: FontFamily.semiBold, fontSize: 10 },
  buddyFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  matchTxt: { fontFamily: FontFamily.bold, fontSize: 11, color: C.primary },
  chatBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  likedBanner: { marginHorizontal: PAD, marginBottom: 14, borderRadius: 16, overflow: 'hidden' },
  likedGrad: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, borderWidth: 1, borderColor: '#FBCFE8', borderRadius: 16 },
  likedTxt: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 13, color: C.ink },
  howList: { paddingHorizontal: PAD, gap: 10, marginBottom: 20 },
  howCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
    ...purpleSh,
  },
  howCardBody: { flex: 1, minWidth: 0 },
  howStepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  howStepNum: { fontFamily: FontFamily.bold, fontSize: 11, color: C.primaryLight },
  howIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  howTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: C.ink },
  howSub: { fontFamily: FontFamily.regular, fontSize: 11, color: C.muted, lineHeight: 15 },
  profileCta: { marginHorizontal: PAD, marginBottom: 12, borderRadius: 18, overflow: 'hidden' },
  profileCtaGrad: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  profileCtaTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFF' },
  profileCtaSub: { fontFamily: FontFamily.regular, fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  matchesLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginHorizontal: PAD },
  matchesLinkTxt: { fontFamily: FontFamily.semiBold, fontSize: 14, color: C.primary },
  discoverWrap: { marginHorizontal: PAD, marginBottom: 8 },
  actionFb: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 10 },
  actionFbLike: { backgroundColor: '#DCFCE7' },
  actionFbPass: { backgroundColor: '#FEE2E2' },
  actionFbTxt: { fontFamily: FontFamily.semiBold, fontSize: 12, color: C.ink },
  cardStack: { alignItems: 'center', marginBottom: 8, minHeight: DISCOVER_CARD_H + 16, width: '100%' },
  swipeCard: {
    width: SCREEN_W - PAD * 2,
    height: DISCOVER_CARD_H,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1A0F3C',
    ...Platform.select({
      ios: { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  swipeCardBehind: {
    position: 'absolute',
    top: 10,
    transform: [{ scale: 0.96 }],
    opacity: 0.55,
    zIndex: 0,
  },
  swipeCardPlaceholder: { flex: 1, borderRadius: 24 },
  swipePhoto: { flex: 1, justifyContent: 'flex-end' },
  swipePhotoImg: { borderRadius: 24 },
  swipeInitial: { position: 'absolute', top: '40%', alignSelf: 'center', fontFamily: FontFamily.extraBold, fontSize: 64, color: 'rgba(255,255,255,0.5)' },
  swipeTopGrad: { ...StyleSheet.absoluteFillObject, height: 100 },
  swipeTopRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, zIndex: 2 },
  matchPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  matchPillTxt: { fontFamily: FontFamily.bold, fontSize: 11, color: '#78350F' },
  countPill: { backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  countPillTxt: { fontFamily: FontFamily.semiBold, fontSize: 11, color: '#FFF' },
  interestCol: { position: 'absolute', right: 12, top: 56, gap: 8, zIndex: 2 },
  interestPill: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  interestPillTxt: { fontFamily: FontFamily.semiBold, fontSize: 10, color: '#FFF' },
  swipeBottomGrad: { padding: 16, paddingTop: 48 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  swipeName: { fontFamily: FontFamily.bold, fontSize: 22, color: '#FFF' },
  swipeEdu: { fontFamily: FontFamily.medium, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  goalBadge: { alignSelf: 'flex-start', backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginBottom: 8 },
  goalBadgeTxt: { fontFamily: FontFamily.semiBold, fontSize: 11, color: '#FFF' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  locTxt: { fontFamily: FontFamily.regular, fontSize: 11, color: 'rgba(255,255,255,0.9)' },
  swipeBio: { fontFamily: FontFamily.regular, fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 17 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 10 },
  actBtnPass: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E9E0FF',
    ...purpleSh,
  },
  actBtnStar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FDE68A',
    ...purpleSh,
  },
  actBtnLike: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#EC4899', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  actBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actBtnLikeGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  discoverEmpty: { alignItems: 'center', padding: 28, backgroundColor: C.card, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  discoverEmptyTitle: { fontFamily: FontFamily.semiBold, fontSize: 14, color: C.muted, marginTop: 10, marginBottom: 12 },
  discoverEmptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16 },
  discoverEmptyBtnTxt: { fontFamily: FontFamily.bold, fontSize: 13, color: '#FFF' },
  boostWrap: { marginHorizontal: PAD, marginBottom: 16, borderRadius: 18, overflow: 'hidden' },
  boostBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  boostTextCol: { flex: 1 },
  boostTitle: { fontFamily: FontFamily.bold, fontSize: 15, color: '#FFF' },
  boostSub: { fontFamily: FontFamily.regular, fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 15 },
  boostBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, gap: 4 },
  boostBtnTxt: { fontFamily: FontFamily.bold, fontSize: 11, color: C.primary },
});

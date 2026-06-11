import HomeLiveExamCard from '@/components/home/HomeLiveExamCard';
import { HomeTheme, QUICK_ITEMS } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Zap } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 16;
const HERO_W = SCREEN_W - PAD * 2;
const QUICK_W = 76;

const QUICK_HOME = QUICK_ITEMS.filter((item) => item.id !== 'partner');

type Props = {
  userName?: string;
  selectedCategory?: string | null;
  exams: any[];
  loading: boolean;
  examSliderRef: React.RefObject<FlatList<any> | null>;
  currentExamIndex: number;
  onExamIndexChange: (i: number) => void;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
  onStudyPartnerPress?: () => void;
};

type GreetingPeriod = 'morning' | 'afternoon' | 'evening';

function getGreetingPeriod(): GreetingPeriod {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getGreeting(): string {
  const p = getGreetingPeriod();
  if (p === 'morning') return 'Good morning';
  if (p === 'afternoon') return 'Good afternoon';
  return 'Good evening';
}

const GREETING_THEMES: Record<
  GreetingPeriod,
  {
    card: readonly [string, string, string];
    border: readonly [string, string];
    badge: readonly [string, string];
    badgeText: string;
    accent: string;
    nameColor: string;
    subColor: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconGrad: readonly [string, string];
    orb1: string;
    orb2: string;
    pillBg: string;
    pillText: string;
    emoji: string;
  }
> = {
  morning: {
    card: ['#FFF7ED', '#FFEDD5', '#FFFBEB'],
    border: ['#FDBA74', '#FBBF24'],
    badge: ['#FDE047', '#FACC15'],
    badgeText: '#78350F',
    accent: '#EA580C',
    nameColor: '#9A3412',
    subColor: '#C2410C',
    icon: 'sunny',
    iconGrad: ['#FBBF24', '#F97316'],
    orb1: 'rgba(251, 191, 36, 0.35)',
    orb2: 'rgba(249, 115, 22, 0.15)',
    pillBg: 'rgba(234, 88, 12, 0.12)',
    pillText: '#C2410C',
    emoji: '☀️',
  },
  afternoon: {
    card: ['#EFF6FF', '#E0E7FF', '#F5F3FF'],
    border: ['#93C5FD', '#A78BFA'],
    badge: ['#BFDBFE', '#93C5FD'],
    badgeText: '#1E40AF',
    accent: '#2563EB',
    nameColor: '#1E3A8A',
    subColor: '#4338CA',
    icon: 'partly-sunny',
    iconGrad: ['#60A5FA', '#6366F1'],
    orb1: 'rgba(96, 165, 250, 0.3)',
    orb2: 'rgba(99, 102, 241, 0.12)',
    pillBg: 'rgba(37, 99, 235, 0.1)',
    pillText: '#1D4ED8',
    emoji: '🌤️',
  },
  evening: {
    card: ['#EDE9FE', '#DDD6FE', '#F3E8FF'],
    border: ['#C4B5FD', '#A78BFA'],
    badge: ['#DDD6FE', '#C4B5FD'],
    badgeText: '#5B21B6',
    accent: '#7C3AED',
    nameColor: '#4C1D95',
    subColor: '#6D28D9',
    icon: 'moon',
    iconGrad: ['#A78BFA', '#6344D4'],
    orb1: 'rgba(167, 139, 250, 0.35)',
    orb2: 'rgba(99, 68, 212, 0.15)',
    pillBg: 'rgba(124, 58, 237, 0.12)',
    pillText: '#6D28D9',
    emoji: '🌙',
  },
};

function firstName(name?: string): string {
  if (!name?.trim()) return 'Student';
  return name.trim().split(/\s+/)[0];
}

export default function HomeScreenUI({
  userName,
  selectedCategory,
  exams,
  loading,
  examSliderRef,
  currentExamIndex,
  onExamIndexChange,
  onScrollBeginDrag,
  onScrollEndDrag,
  onStudyPartnerPress,
}: Props) {
  const router = useRouter();
  const period = useMemo(() => getGreetingPeriod(), []);
  const greeting = useMemo(() => getGreeting(), []);
  const displayName = firstName(userName);
  const theme = GREETING_THEMES[period];

  const renderExam = ({ item }: { item: any }) => (
    <View style={styles.liveExamSlide}>
      <HomeLiveExamCard exam={item} />
    </View>
  );

  return (
    <View style={styles.wrap}>
      {/* Hero — time-based greeting */}
      <LinearGradient colors={[...theme.border]} style={styles.heroBorder}>
        <LinearGradient colors={[...theme.card]} style={styles.heroSection}>
          <View style={[styles.heroOrb1, { backgroundColor: theme.orb1 }]} />
          <View style={[styles.heroOrb2, { backgroundColor: theme.orb2 }]} />

          <View style={styles.heroTop}>
            <View style={styles.heroTextCol}>
              <LinearGradient colors={[...theme.badge]} style={styles.greetingBadge}>
                <Text style={styles.greetingBadgeEmoji}>{theme.emoji}</Text>
                <Text style={[styles.greetingBadgeText, { color: theme.badgeText }]}>{greeting}</Text>
              </LinearGradient>

              <Text style={[styles.heroName, { color: theme.nameColor }]} numberOfLines={1}>
                {displayName} 👋
              </Text>

              {selectedCategory ? (
                <View style={[styles.categoryPill, { backgroundColor: theme.pillBg }]}>
                  <Ionicons name="ribbon-outline" size={12} color={theme.accent} />
                  <Text style={[styles.categoryPillText, { color: theme.pillText }]} numberOfLines={1}>
                    Preparing for {selectedCategory}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.heroSub, { color: theme.subColor }]}>
                  Ready to ace your exam today?
                </Text>
              )}
            </View>

            <LinearGradient colors={[...theme.iconGrad]} style={styles.heroIcon}>
              <Ionicons name={theme.icon} size={22} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </LinearGradient>
      </LinearGradient>

      {/* Live Exams */}
      <View style={styles.liveBlock}>
        <View style={styles.sectionHead}>
          <View style={styles.sectionHeadText}>
            <Text style={styles.sectionTitle}>Live Exams</Text>
            <Text style={styles.sectionSub}>Real-time competitive exams</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => router.push('/(tabs)/exam' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.viewAllText}>View all</Text>
            <ArrowRight size={14} color={HomeTheme.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.liveSection}>
          {loading ? (
            <View style={styles.liveLoading}>
              <ActivityIndicator color={HomeTheme.primary} />
              <Text style={styles.liveLoadingText}>Fetching live exams…</Text>
            </View>
          ) : exams.length === 0 ? (
            <View style={styles.liveEmpty}>
              <LinearGradient colors={['#F3EFFF', '#FFFFFF']} style={styles.liveEmptyInner}>
                <View style={styles.liveEmptyIcon}>
                  <Zap size={22} color={HomeTheme.primary} strokeWidth={1.5} />
                </View>
                <Text style={styles.liveEmptyTitle}>No live exams right now</Text>
                <Text style={styles.liveEmptyText}>
                  Check back soon or browse all upcoming exams
                </Text>
                <TouchableOpacity
                  style={styles.liveEmptyCta}
                  onPress={() => router.push('/(tabs)/exam' as any)}
                  activeOpacity={0.9}
                >
                  <LinearGradient colors={[...HomeTheme.heroCta]} style={styles.liveEmptyCtaGrad}>
                    <Text style={styles.liveEmptyCtaText}>Browse exams</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            <>
              <FlatList
                ref={examSliderRef}
                data={exams}
                renderItem={renderExam}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScrollBeginDrag={onScrollBeginDrag}
                onScrollEndDrag={onScrollEndDrag}
                onMomentumScrollEnd={(e) => {
                  const i = Math.round(e.nativeEvent.contentOffset.x / HERO_W);
                  onExamIndexChange(Math.min(i, exams.length - 1));
                }}
                getItemLayout={(_, index) => ({
                  length: HERO_W,
                  offset: HERO_W * index,
                  index,
                })}
                snapToInterval={HERO_W}
                decelerationRate="fast"
                pagingEnabled
              />
              {exams.length > 1 && (
                <View style={styles.examDots}>
                  {exams.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.examDot, i === currentExamIndex && styles.examDotActive]}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </View>

      {/* Quick access — horizontal scroll */}
      <View style={styles.quickSection}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <Text style={styles.sectionSub}>Jump in fast</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickScroll}
        >
          {QUICK_HOME.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.quickItem}
              activeOpacity={0.88}
              onPress={() => router.push(item.route as any)}
            >
              <LinearGradient colors={[...item.iconGrad]} style={styles.quickIcon}>
                <Image source={item.image} style={styles.quickIconImg} resizeMode="contain" />
              </LinearGradient>
              <Text style={styles.quickTitle} numberOfLines={1}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Study Partner */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onStudyPartnerPress ?? (() => router.push('/(tabs)/study-partner' as any))}
        style={styles.partnerWrap}
      >
        <LinearGradient
          colors={['#C4B5FD', '#A78BFA', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.partnerBorder}
        >
          <LinearGradient
            colors={[...HomeTheme.partnerGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.partnerCard}
          >
            <LinearGradient colors={['#FDE047', '#FACC15']} style={styles.partnerBadge}>
              <Ionicons name="sparkles" size={10} color="#713F12" />
              <Text style={styles.partnerBadgeText}>Study Partner</Text>
            </LinearGradient>
            <View style={styles.partnerContent}>
              <View style={styles.partnerTextCol}>
                <Text style={styles.partnerTitle}>Find your study partner</Text>
                <Text style={styles.partnerSub}>Match, chat & prepare together for your dream exam</Text>
                <LinearGradient colors={[...HomeTheme.heroCta]} style={styles.partnerCtaGrad}>
                  <Text style={styles.partnerCtaTextLight}>Explore Now</Text>
                  <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
              </View>
              <Image
                source={require('../../assets/images/icons/study-buddy.png')}
                style={styles.partnerImage}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 4 },

  heroBorder: {
    borderRadius: 22,
    padding: 2,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#6344D4',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.14,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  heroSection: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroOrb1: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    top: -28,
    right: 8,
  },
  heroOrb2: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    bottom: -12,
    left: -8,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  heroTextCol: { flex: 1, minWidth: 0, paddingRight: 12, gap: 6 },
  greetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  greetingBadgeEmoji: { fontSize: 13 },
  greetingBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  heroName: {
    fontFamily: FontFamily.extraBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  heroSub: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    maxWidth: '100%',
  },
  categoryPillText: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
  },

  liveBlock: { marginBottom: 12 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeadText: { flex: 1, paddingRight: 8 },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: HomeTheme.ink,
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: HomeTheme.inkMuted,
    marginTop: 2,
  },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center' },
  viewAllText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: HomeTheme.primary,
    marginRight: 2,
  },

  liveSection: {
    paddingBottom: 4,
  },
  liveExamSlide: { width: HERO_W, paddingHorizontal: 0 },
  liveLoading: { paddingVertical: 20, alignItems: 'center' },
  liveLoadingText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: HomeTheme.inkMuted,
    marginTop: 8,
  },
  liveEmpty: {
    marginHorizontal: 10,
    marginBottom: 4,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 68, 212, 0.12)',
  },
  liveEmptyInner: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  liveEmptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: HomeTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  liveEmptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: HomeTheme.ink,
    marginBottom: 4,
  },
  liveEmptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: HomeTheme.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  liveEmptyCta: { borderRadius: 12, overflow: 'hidden' },
  liveEmptyCtaGrad: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  liveEmptyCtaText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: '#FFF' },
  examDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 2,
  },
  examDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(99, 68, 212, 0.2)',
    marginHorizontal: 3,
  },
  examDotActive: {
    backgroundColor: HomeTheme.primary,
    width: 14,
    borderRadius: 3,
  },

  quickSection: { marginBottom: 14 },
  quickScroll: { paddingRight: 4 },
  quickItem: {
    width: QUICK_W,
    alignItems: 'center',
    marginRight: 12,
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  quickIconImg: { width: 26, height: 26 },
  quickTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: HomeTheme.ink,
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 16 : 14,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },

  partnerWrap: {
    marginBottom: 6,
    borderRadius: 20,
    ...HomeTheme.shadowPurple,
  },
  partnerBorder: {
    borderRadius: 20,
    padding: 2,
    overflow: 'hidden',
  },
  partnerCard: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
    minHeight: 148,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  partnerBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: '#713F12',
  },
  partnerContent: { flexDirection: 'row', alignItems: 'center' },
  partnerTextCol: { flex: 1, paddingRight: 4, justifyContent: 'center' },
  partnerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  partnerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 10,
    lineHeight: 16,
  },
  partnerCtaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  partnerCtaTextLight: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  partnerImage: {
    width: 140,
    height: 140,
  },
});

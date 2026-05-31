import HomeLiveExamCard from '@/components/home/HomeLiveExamCard';
import { HomeTheme, QUICK_ITEMS } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, ChevronRight, Search, Zap } from 'lucide-react-native';
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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
  const greeting = useMemo(() => getGreeting(), []);
  const displayName = firstName(userName);

  const renderExam = ({ item }: { item: any }) => (
    <View style={styles.liveExamSlide}>
      <HomeLiveExamCard exam={item} />
    </View>
  );

  return (
    <View style={styles.wrap}>
      {/* Hero — greeting + search in one section */}
      <LinearGradient colors={['#F3EFFF', '#FAF8FF', '#FFFFFF']} style={styles.heroSection}>
        <View style={styles.heroTop}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroGreetingLine} numberOfLines={2}>
              <Text style={styles.heroTime}>{greeting}, </Text>
              <Text style={styles.heroName}>{displayName} 👋</Text>
            </Text>
            {selectedCategory ? (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText} numberOfLines={1}>
                  Preparing for {selectedCategory}
                </Text>
              </View>
            ) : (
              <Text style={styles.heroSub}>Ready to ace your exam today?</Text>
            )}
          </View>
          <LinearGradient colors={[...HomeTheme.heroCta]} style={styles.heroIcon}>
            <Ionicons name="sparkles" size={18} color="#FFF" />
          </LinearGradient>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/exam' as any)}
          style={styles.searchOuter}
        >
          <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={styles.searchBorder}>
            <View style={styles.searchBar}>
              <View style={styles.searchIconWrap}>
                <Search size={16} color={HomeTheme.primary} strokeWidth={2.2} />
              </View>
              <Text style={styles.searchPlaceholder}>Search exams, topics & more...</Text>
              <View style={styles.searchGo}>
                <ChevronRight size={16} color={HomeTheme.primary} strokeWidth={2.5} />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Live Exams */}
      <View style={styles.liveBlock}>
        <View style={styles.sectionHead}>
          <View style={styles.sectionHeadLeft}>
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.liveBadge}>
              <Zap size={11} color="#FFF" fill="#FFF" strokeWidth={2} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </LinearGradient>
            <Text style={styles.sectionTitle}>Live Exams</Text>
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
          colors={[...HomeTheme.partnerGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.partnerCard}
        >
          <View style={styles.partnerOrb} />
          <View style={styles.partnerOrb2} />
          <View style={styles.partnerContent}>
            <View style={styles.partnerTextCol}>
              <View style={styles.partnerLabelRow}>
                <Ionicons name="people" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.partnerLabel}>Study Partner</Text>
              </View>
              <Text style={styles.partnerTitle}>Find your study buddy</Text>
              <Text style={styles.partnerSub}>Connect with students on the same exam prep journey</Text>
              <View style={styles.partnerCta}>
                <Text style={styles.partnerCtaText}>Find Now</Text>
                <ArrowRight size={14} color={HomeTheme.primary} strokeWidth={2.5} />
              </View>
            </View>
            <View style={styles.partnerImageWrap}>
              <Image
                source={require('../../assets/images/icons/study-buddy.png')}
                style={styles.partnerImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 4 },

  heroSection: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 68, 212, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#6344D4',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroTextCol: { flex: 1, minWidth: 0, paddingRight: 10 },
  heroGreetingLine: {
    lineHeight: Platform.OS === 'android' ? 28 : 26,
  },
  heroTime: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: HomeTheme.inkSecondary,
  },
  heroName: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: HomeTheme.ink,
  },
  heroSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: HomeTheme.inkMuted,
    marginTop: 4,
    lineHeight: Platform.OS === 'android' ? 18 : 16,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: 'rgba(99, 68, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: '100%',
  },
  categoryPillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: HomeTheme.primary,
  },

  searchOuter: {},
  searchBorder: { borderRadius: 16, padding: 1.5 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HomeTheme.card,
    borderRadius: 14.5,
    paddingHorizontal: 10,
    paddingVertical: 11,
    minHeight: 48,
  },
  searchIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: HomeTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: HomeTheme.inkMuted,
  },
  searchGo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: HomeTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  liveBlock: { marginBottom: 14 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeadLeft: { flexDirection: 'row', alignItems: 'center' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  liveBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#FFF',
    marginLeft: 3,
    letterSpacing: 0.5,
  },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: HomeTheme.ink },
  sectionSub: { fontFamily: FontFamily.medium, fontSize: 11, color: HomeTheme.inkMuted },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center' },
  viewAllText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: HomeTheme.primary,
    marginRight: 2,
  },

  liveSection: {
    borderRadius: 18,
    backgroundColor: HomeTheme.card,
    borderWidth: 1,
    borderColor: HomeTheme.border,
    paddingTop: 10,
    paddingBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#6344D4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  liveExamSlide: { width: HERO_W, paddingHorizontal: 4 },
  liveLoading: { paddingVertical: 28, alignItems: 'center' },
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  liveEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginTop: 8,
    marginBottom: 2,
  },
  examDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(99, 68, 212, 0.2)',
    marginHorizontal: 3,
  },
  examDotActive: {
    backgroundColor: HomeTheme.primary,
    width: 18,
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
    borderRadius: 18,
    overflow: 'hidden',
    ...HomeTheme.shadowPurple,
  },
  partnerCard: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
    minHeight: 120,
  },
  partnerOrb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -50,
    right: 20,
  },
  partnerOrb2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -10,
    left: 40,
  },
  partnerContent: { flexDirection: 'row', alignItems: 'center' },
  partnerTextCol: { flex: 1, paddingRight: 8 },
  partnerLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  partnerLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginLeft: 4,
  },
  partnerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 22,
  },
  partnerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 10,
    lineHeight: 16,
  },
  partnerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  partnerCtaText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: HomeTheme.primary,
    marginRight: 4,
  },
  partnerImageWrap: {
    width: 92,
    height: 92,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  partnerImage: { width: 76, height: 76 },
});

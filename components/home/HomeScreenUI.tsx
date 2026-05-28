import HomeLiveExamCard from '@/components/home/HomeLiveExamCard';
import { HomeTheme, QUICK_ITEMS } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Search, SlidersHorizontal, Zap } from 'lucide-react-native';
import React from 'react';
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
const QUICK_GAP = 10;
const QUICK_COLS = 3;
const QUICK_CARD_W = (HERO_W - QUICK_GAP * (QUICK_COLS - 1)) / QUICK_COLS;

type Props = {
  userName?: string;
  exams: any[];
  loading: boolean;
  examSliderRef: React.RefObject<FlatList<any> | null>;
  currentExamIndex: number;
  onExamIndexChange: (i: number) => void;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
  onStudyPartnerPress?: () => void;
};

export default function HomeScreenUI({
  userName: _userName,
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

  const renderExam = ({ item }: { item: any }) => (
    <View style={styles.liveExamSlide}>
      <HomeLiveExamCard exam={item} />
    </View>
  );

  return (
    <View style={styles.wrap}>
      {/* Search */}
      <View style={styles.searchRow}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/exam' as any)}
          style={styles.searchOuter}
        >
          <LinearGradient colors={['#EDE9FE', '#F5F3FF']} style={styles.searchBorder}>
            <View style={styles.searchBar}>
              <View style={styles.searchIconWrap}>
                <Search size={15} color={HomeTheme.primary} strokeWidth={2.2} />
              </View>
              <Text style={styles.searchPlaceholder}>Search exams, topics & more...</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.88}>
          <LinearGradient colors={['#F8FAFC', '#FFFFFF']} style={styles.filterInner}>
            <SlidersHorizontal size={16} color={HomeTheme.primary} strokeWidth={2} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Live Exams */}
      <LinearGradient colors={[...HomeTheme.creamGrad]} style={styles.liveSection}>
          {loading ? (
            <View style={styles.liveLoading}>
              <ActivityIndicator color={HomeTheme.primary} />
              <Text style={styles.liveLoadingText}>Fetching live exams…</Text>
            </View>
          ) : exams.length === 0 ? (
            <View style={styles.liveEmpty}>
              <LinearGradient colors={['#EDE9FE', '#FFFFFF']} style={styles.liveEmptyInner}>
                <Zap size={24} color={HomeTheme.primary} strokeWidth={1.5} />
                <Text style={styles.liveEmptyTitle}>No live exams right now</Text>
                <Text style={styles.liveEmptyText}>
                  New battles drop soon — turn on notifications
                </Text>
                <TouchableOpacity
                  style={styles.liveEmptyCta}
                  onPress={() => router.push('/(tabs)/exam' as any)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.liveEmptyCtaText}>Browse all exams</Text>
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
      </LinearGradient>

      {/* Quick access — 6 blocks */}
      <View style={styles.quickSection}>
        <View style={styles.quickHead}>
          <Text style={styles.quickHeadTitle}>Quick Access</Text>
          <View style={styles.quickHeadPill}>
            <Text style={styles.quickHeadPillTxt}>6 tools</Text>
          </View>
        </View>
        <View style={styles.quickGrid}>
          {QUICK_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.quickCardWrap}
              activeOpacity={0.9}
              onPress={() => router.push(item.route as any)}
            >
              <LinearGradient colors={[...item.cardGrad]} style={styles.quickCard}>
                <LinearGradient colors={[...item.iconGrad]} style={styles.quickIcon}>
                  <Image source={item.image} style={styles.quickIconImg} resizeMode="contain" />
                </LinearGradient>
                <Text style={styles.quickTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.quickSub} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
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
          end={{ x: 1, y: 0 }}
          style={styles.partnerCard}
        >
          <View style={styles.partnerOrb} />
          <View style={styles.partnerContent}>
            <View style={styles.partnerTextCol}>
              <Text style={styles.partnerLabel}>Study Partner</Text>
              <Text style={styles.partnerTitle}>Find your Study Buddy</Text>
              <View style={styles.partnerCta}>
                <Text style={styles.partnerCtaText}>Find Now</Text>
                <ArrowRight size={14} color={HomeTheme.primary} strokeWidth={2.5} />
              </View>
            </View>
            <Image
              source={require('../../assets/images/icons/homebuddy.png')}
              style={styles.partnerImage}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: PAD, paddingTop: 4 },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  searchOuter: { flex: 1 },
  searchBorder: { borderRadius: 16, padding: 1.5 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HomeTheme.card,
    borderRadius: 14.5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: HomeTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPlaceholder: { flex: 1, fontFamily: FontFamily.medium, fontSize: 13, color: HomeTheme.inkMuted },
  filterBtn: { borderRadius: 14, overflow: 'hidden', ...HomeTheme.shadow },
  filterInner: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: HomeTheme.border,
  },

  quickSection: { marginBottom: 14 },
  quickHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickHeadTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: HomeTheme.ink },
  quickHeadPill: {
    backgroundColor: HomeTheme.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  quickHeadPillTxt: { fontFamily: FontFamily.semiBold, fontSize: 11, color: HomeTheme.primary },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: QUICK_GAP,
  },
  quickCardWrap: {
    width: QUICK_CARD_W,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  quickCard: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    minHeight: 104,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  quickIconImg: { width: 24, height: 24 },
  quickTitle: { fontFamily: FontFamily.bold, fontSize: 11, color: HomeTheme.ink, textAlign: 'center' },
  quickSub: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: HomeTheme.inkMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: HomeTheme.ink },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: HomeTheme.primary },
  liveSection: {
    marginBottom: 12,
    marginHorizontal: -4,
    borderRadius: 18,
    paddingTop: 12,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 68, 212, 0.06)',
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
  liveLoading: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  liveLoadingText: { fontFamily: FontFamily.medium, fontSize: 13, color: HomeTheme.inkMuted },
  liveEmpty: {
    marginHorizontal: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 68, 212, 0.15)',
  },
  liveEmptyInner: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
  },
  liveEmptyTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: HomeTheme.ink, marginTop: 4 },
  liveEmptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: HomeTheme.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  liveEmptyCta: {
    marginTop: 10,
    backgroundColor: HomeTheme.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  liveEmptyCtaText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: '#FFF' },
  examDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 2,
  },
  examDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(99, 68, 212, 0.25)',
  },
  examDotActive: {
    backgroundColor: HomeTheme.primary,
    width: 20,
    borderRadius: 3,
  },
  partnerWrap: { marginBottom: 10, borderRadius: 18, overflow: 'hidden', ...HomeTheme.shadowPurple },
  partnerCard: { borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, overflow: 'hidden' },
  partnerOrb: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -40,
    right: 30,
  },
  partnerContent: { flexDirection: 'row', alignItems: 'center' },
  partnerTextCol: { flex: 1 },
  partnerLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  partnerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 20,
  },
  partnerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 3,
    ...HomeTheme.shadow,
  },
  partnerCtaText: { fontFamily: FontFamily.semiBold, fontSize: 12, color: HomeTheme.primary },
  partnerImage: { width: 80, height: 72 },
});

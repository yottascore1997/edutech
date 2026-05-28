import QuestionOfTheDayPreview from '@/components/QuestionOfTheDayPreview';
import { CATEGORY_GRADIENTS, QuizTheme } from '@/constants/QuizTheme';
import { FontFamily } from '@/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Globe,
  Landmark,
  Lightbulb,
  Target,
  TestTube,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react-native';
import {
  Image,
  ImageSourcePropType,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface QuizCategoryItem {
  id: string;
  name: string;
  color?: string;
  questionCount?: number;
}

const CATEGORY_IMAGES: (ImageSourcePropType | null)[] = [
  null,
  require('../../assets/images/sports-icon.png'),
  require('../../assets/images/history-icon.png'),
  require('../../assets/images/science-icon.png'),
  require('../../assets/images/math-icon.png'),
];

const CATEGORY_ICONS = [Globe, Target, Landmark, TestTube, Lightbulb];

const AVATARS = [
  require('../../assets/images/avatar1.jpg'),
  require('../../assets/images/avatar2.jpg'),
  require('../../assets/images/avatar3.jpg'),
];

type Props = {
  categories: QuizCategoryItem[];
  selectedCategoryId: string;
  refreshing: boolean;
  onRefresh: () => void;
  onCategoryPress: (category: QuizCategoryItem) => void;
  onHeroStart: () => void;
  onQuickQuiz: () => void;
  onDailyQuiz: () => void;
  onViewAllCategories?: () => void;
};

function CategoryIcon({ index }: { index: number }) {
  const img = CATEGORY_IMAGES[index];
  const grad = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
  const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];

  if (img) {
    return <Image source={img} style={styles.categoryImg} resizeMode="contain" />;
  }
  if (index === 0) {
    return (
      <Image
        source={require('../../assets/images/3d-character.png')}
        style={styles.categoryImgLg}
        resizeMode="contain"
      />
    );
  }
  return <Icon size={26} color={grad.icon} strokeWidth={2.4} />;
}

function AvatarStack() {
  return (
    <View style={styles.avatarRow}>
      {AVATARS.map((src, i) => (
        <Image key={i} source={src} style={[styles.avatar, i > 0 && { marginLeft: -10 }]} />
      ))}
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.blockTitle}>{children}</Text>
    </View>
  );
}

export default function QuizScreenUI({
  categories,
  selectedCategoryId,
  refreshing,
  onRefresh,
  onCategoryPress,
  onHeroStart,
  onQuickQuiz,
  onDailyQuiz,
  onViewAllCategories,
}: Props) {
  const activeId = selectedCategoryId || categories[0]?.id || '';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={QuizTheme.primary} />
      }
    >
      {/* Hero */}
      <View style={styles.heroOuter}>
        <LinearGradient
          colors={[...QuizTheme.heroGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroOrb1} />
          <View style={styles.heroOrb2} />
          <View style={styles.heroOrbGold} />

          <View style={styles.heroRow}>
            <View style={styles.heroTextCol}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroEyebrow}>Challenge Yourself</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>
                Play, Learn & Improve{' '}
                <Text style={styles.heroAccent}>Daily</Text>
              </Text>
              <Text style={styles.heroSub} numberOfLines={2}>
                Join quizzes, test your knowledge and achieve your goals.
              </Text>
              <TouchableOpacity onPress={onHeroStart} activeOpacity={0.9}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.heroBtn}
                >
                  <Text style={styles.heroBtnText}>Start Quiz</Text>
                  <LinearGradient colors={['#A78BFA', '#6D28D9']} style={styles.heroBtnIcon}>
                    <Zap size={15} color="#FFF" fill="#FFF" />
                  </LinearGradient>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={styles.heroTrophyWrap}>
              <View style={styles.heroTrophyGlow} />
              <LinearGradient colors={['#FBBF24', '#F59E0B']} style={styles.heroTrophyBadge}>
                <Trophy size={40} color="#1C1917" strokeWidth={2.4} />
              </LinearGradient>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Categories */}
      <View style={styles.block}>
        <View style={styles.blockHeader}>
          <SectionTitle>Quiz Categories</SectionTitle>
          <TouchableOpacity style={styles.viewAllPill} onPress={onViewAllCategories}>
            <Text style={styles.viewAllText}>View All</Text>
            <ChevronRight size={16} color={QuizTheme.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {categories.slice(0, 5).map((cat, index) => {
            const grad = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
            const isActive = activeId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.catItem}
                onPress={() => onCategoryPress(cat)}
                activeOpacity={0.85}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[QuizTheme.primary, QuizTheme.primaryDark]}
                    style={styles.catBoxActive}
                  >
                    <View style={styles.catBoxInner}>
                      <CategoryIcon index={index} />
                    </View>
                  </LinearGradient>
                ) : (
                  <LinearGradient colors={grad.colors} style={[styles.catBox, { borderColor: grad.border }]}>
                    <CategoryIcon index={index} />
                  </LinearGradient>
                )}
                <Text style={[styles.catLabel, isActive && styles.catLabelActive]} numberOfLines={1}>
                  {cat.name}
                </Text>
                {isActive && (
                  <LinearGradient
                    colors={[QuizTheme.primaryLight, QuizTheme.primary]}
                    style={styles.catUnderline}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Continue Journey */}
      <View style={styles.block}>
        <SectionTitle>Continue Your Journey</SectionTitle>
        <LinearGradient colors={[...QuizTheme.journeyBorder]} style={styles.journeyBorder}>
          <View style={styles.journeyCard}>
            <LinearGradient colors={[...QuizTheme.journeyIcon]} style={styles.journeyIconBox}>
              <Target size={22} color={QuizTheme.primary} strokeWidth={2.4} />
            </LinearGradient>
            <View style={styles.journeyMid}>
              <View style={styles.journeyTitleRow}>
                <Text style={styles.journeyTitle} numberOfLines={1}>
                  10 Questions Quiz
                </Text>
                <Text style={styles.journeyCount}>6/10</Text>
              </View>
              <Text style={styles.journeySub} numberOfLines={1}>
                General Knowledge
              </Text>
              <View style={styles.journeyBarBg}>
                <LinearGradient
                  colors={[...QuizTheme.progress]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.journeyBarFill, { width: '60%' }]}
                />
              </View>
            </View>
            <TouchableOpacity onPress={onQuickQuiz} activeOpacity={0.88}>
              <LinearGradient colors={[...QuizTheme.resumeBtn]} style={styles.resumeBtn}>
                <Text style={styles.resumeText}>Resume</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Popular Quizzes */}
      <View style={[styles.block, styles.popularBlock]}>
        <View style={[styles.blockHeader, styles.popularBlockHeader]}>
          <SectionTitle>Popular Quizzes</SectionTitle>
          <TouchableOpacity style={styles.viewAllPill}>
            <Text style={styles.viewAllText}>View All</Text>
            <ChevronRight size={16} color={QuizTheme.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.popularRow}>
          <TouchableOpacity style={styles.popCard} onPress={onQuickQuiz} activeOpacity={0.92}>
            <LinearGradient colors={[...QuizTheme.quickCard]} style={styles.popInner}>
              <View style={styles.popTopRow}>
                <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={styles.popIconWrap}>
                  <TrendingUp size={18} color={QuizTheme.primary} strokeWidth={2.5} />
                </LinearGradient>
                <View style={styles.popTextCol}>
                  <Text style={styles.popTitle} numberOfLines={1}>
                    Quick Quiz
                  </Text>
                  <Text style={styles.popMeta} numberOfLines={1}>
                    10 questions • 5 min
                  </Text>
                </View>
              </View>
              <View style={styles.popFooterRow}>
                <AvatarStack />
                <Text style={styles.popAttempts} numberOfLines={1}>
                  12.5K+ attempts
                </Text>
              </View>
              <LinearGradient colors={[...QuizTheme.quickPlay]} style={styles.playBtn}>
                <Text style={styles.playText}>Play Now</Text>
                <ArrowRight size={13} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.popCard} onPress={onDailyQuiz} activeOpacity={0.92}>
            <LinearGradient colors={[...QuizTheme.dailyCard]} style={styles.popInner}>
              <View style={styles.popTopRow}>
                <LinearGradient colors={['#D1FAE5', '#A7F3D0']} style={styles.popIconWrap}>
                  <Clock size={18} color="#047857" strokeWidth={2.5} />
                </LinearGradient>
                <View style={styles.popTextCol}>
                  <Text style={styles.popTitle} numberOfLines={1}>
                    Daily Quiz
                  </Text>
                  <Text style={styles.popMeta} numberOfLines={1}>
                    15 questions • 10 min
                  </Text>
                </View>
              </View>
              <View style={styles.popFooterRow}>
                <AvatarStack />
                <Text style={styles.popAttempts} numberOfLines={1}>
                  8.7K+ attempts
                </Text>
              </View>
              <LinearGradient colors={[...QuizTheme.dailyPlay]} style={styles.playBtn}>
                <Text style={styles.playText}>Play Now</Text>
                <ArrowRight size={13} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <QuestionOfTheDayPreview variant="quiz" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: QuizTheme.bg },
  scrollContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 120 },

  heroOuter: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: QuizTheme.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  heroGradient: { paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden' },
  heroOrb1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(167, 139, 250, 0.22)',
    top: -40,
    right: 20,
  },
  heroOrb2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    bottom: 0,
    left: -25,
  },
  heroOrbGold: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    top: 20,
    left: '40%',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroTextCol: { flex: 1, zIndex: 2 },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroEyebrow: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 19,
    lineHeight: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroAccent: { fontFamily: FontFamily.extraBold, color: QuizTheme.gold },
  heroSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  heroBtnText: { fontFamily: FontFamily.bold, fontSize: 13, color: QuizTheme.ink },
  heroBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTrophyWrap: {
    width: 88,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -4,
  },
  heroTrophyGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
  },
  heroTrophyBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },

  block: { marginBottom: 18 },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  popularBlock: { marginBottom: 22 },
  popularBlockHeader: { marginBottom: 12 },
  sectionTitleRow: { marginBottom: 10 },
  blockTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: QuizTheme.ink,
    letterSpacing: -0.25,
  },
  viewAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 2,
  },
  viewAllText: { fontFamily: FontFamily.semiBold, fontSize: 13, color: QuizTheme.primary },

  catRow: { gap: 14, paddingRight: 4 },
  catItem: { alignItems: 'center', width: 72, maxWidth: 72 },
  catBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
  },
  catBoxActive: {
    width: 68,
    height: 68,
    borderRadius: 20,
    padding: 2,
    marginBottom: 8,
    shadowColor: QuizTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  catBoxInner: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryImg: { width: 38, height: 38 },
  categoryImgLg: { width: 48, height: 48 },
  catLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: QuizTheme.inkMuted,
    textAlign: 'center',
    width: '100%',
    maxHeight: 16,
  },
  catLabelActive: { fontFamily: FontFamily.bold, color: QuizTheme.primary },
  catUnderline: { marginTop: 5, width: 28, height: 3, borderRadius: 2 },

  journeyBorder: { borderRadius: 17, padding: 1.5 },
  journeyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  journeyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  journeyMid: { flex: 1, minWidth: 0 },
  journeyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  journeyTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: QuizTheme.ink, flex: 1 },
  journeySub: { fontFamily: FontFamily.regular, fontSize: 11, color: '#94A3B8', marginBottom: 6 },
  journeyCount: { fontFamily: FontFamily.bold, fontSize: 11, color: QuizTheme.primary },
  journeyBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  journeyBarFill: { height: '100%', borderRadius: 3 },
  resumeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    marginLeft: 8,
    shadowColor: QuizTheme.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  resumeText: { fontFamily: FontFamily.bold, fontSize: 12, color: '#FFFFFF' },

  popularRow: { flexDirection: 'row', gap: 12 },
  popCard: { flex: 1 },
  popInner: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: QuizTheme.primaryDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  popTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  popTextCol: { flex: 1, minWidth: 0 },
  popIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: QuizTheme.ink },
  popMeta: { fontFamily: FontFamily.regular, fontSize: 11, color: QuizTheme.inkMuted, marginTop: 3 },
  popFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  popAttempts: { fontFamily: FontFamily.medium, fontSize: 10, color: '#94A3B8', flexShrink: 1 },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 11,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 3,
  },
  playText: { fontFamily: FontFamily.bold, fontSize: 12, color: '#FFFFFF' },
});

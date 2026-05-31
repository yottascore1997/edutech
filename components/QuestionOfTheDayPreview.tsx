import { HomeTheme } from '@/constants/HomeTheme';
import { QuizTheme } from '@/constants/QuizTheme';
import { FontFamily } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { ArrowRight, Calendar, HelpCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import QuestionOfTheDay from './QuestionOfTheDay';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const QuestionOfTheDayPreview = ({ variant = 'default' }: { variant?: 'default' | 'quiz' }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [timerElement, setTimerElement] = useState<React.ReactNode>(null);

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  // Legacy animations removed for cleaner home card
  useEffect(() => {
    if (variant !== '__legacy__') return;
  }, [variant]);

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <>
      {variant === 'quiz' ? (
        <TouchableOpacity activeOpacity={0.92} onPress={openModal}>
          <LinearGradient
            colors={[...QuizTheme.qotd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={quizBannerStyles.card}
          >
            <View style={quizBannerStyles.shine} />
            <LinearGradient colors={['#FDE68A', '#FBBF24']} style={quizBannerStyles.iconWrap}>
              <Calendar size={20} color="#78350F" strokeWidth={2.2} />
            </LinearGradient>
            <View style={quizBannerStyles.textCol}>
              <Text style={quizBannerStyles.title} numberOfLines={1}>
                Question of the Day
              </Text>
              <Text style={quizBannerStyles.sub} numberOfLines={2}>
                Test your knowledge daily and earn bonus points!
              </Text>
            </View>
            <View style={quizBannerStyles.outlineBtn}>
              <Text style={quizBannerStyles.outlineBtnText} numberOfLines={1}>
                View
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity activeOpacity={0.92} onPress={openModal} style={homePreviewStyles.wrap}>
          <LinearGradient
            colors={['#EA580C', '#F97316', '#FB923C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={homePreviewStyles.card}
          >
            <View style={homePreviewStyles.orb} />
            <View style={homePreviewStyles.row}>
              <View style={homePreviewStyles.left}>
                <View style={homePreviewStyles.dailyBadge}>
                  <Calendar size={12} color="#FFF" strokeWidth={2.2} />
                  <Text style={homePreviewStyles.dailyText}>DAILY · {todayLabel}</Text>
                </View>
                <Text style={homePreviewStyles.title}>Question of the Day</Text>
                <Text style={homePreviewStyles.sub} numberOfLines={1}>
                  Test your knowledge daily!
                </Text>
                <View style={homePreviewStyles.cta}>
                  <Text style={homePreviewStyles.ctaText}>Solve Now</Text>
                  <ArrowRight size={14} color="#FFF" strokeWidth={2.5} />
                </View>
              </View>
              <View style={homePreviewStyles.imageClip}>
                <Image
                  source={require('../assets/images/icons/question-girl.png')}
                  style={homePreviewStyles.image}
                  resizeMode="contain"
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Enhanced Modal */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.centeredOverlay}>
          <View style={styles.centeredCard}>
            <LinearGradient
              colors={[...HomeTheme.heroCta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.modalHeader}>
                <View style={styles.headerContent}>
                  <View style={styles.modalHeaderIcon}>
                    <HelpCircle size={18} color="#FFF" strokeWidth={2.2} />
                  </View>
                  <View style={styles.headerText}>
                    {timerElement}
                    <Text style={styles.modalTitle} numberOfLines={1}>Question of the Day</Text>
                    <Text style={styles.modalSubtitle} numberOfLines={1}>Daily challenge · {todayLabel}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal} activeOpacity={0.8}>
                  <Ionicons name="close" size={20} color={HomeTheme.ink} />
                </TouchableOpacity>
              </View>

              {/* Content Container - scrollable so result is never cut */}
              <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <QuestionOfTheDay onTimerRender={setTimerElement} />
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
    previewContainer: {
        marginVertical: 12,
        marginHorizontal: 6,
        borderRadius: 24,
        shadowColor: '#EA580C',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
        overflow: 'visible',
        position: 'relative',
        borderWidth: 2,
        borderColor: 'rgba(234, 88, 12, 0.15)',
    },
  previewGradient: {
    borderRadius: 18,
    padding: 18,
    paddingRight: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  patternCircle1: {
    position: 'absolute',
    top: 15,
    right: 25,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  patternCircle2: {
    position: 'absolute',
    top: 45,
    left: 15,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  patternCircle3: {
    position: 'absolute',
    bottom: 20,
    right: 45,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternDots: {
    position: 'absolute',
    top: 30,
    right: 65,
    width: 15,
    height: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 7.5,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  progressRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderTopColor: '#FFFFFF',
    top: -6,
    left: -6,
  },
  iconContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  iconGradient: {
    padding: 10,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  largeImageContainer: {
    position: 'absolute',
    left: -60,
    top: -30,
    zIndex: 10,
  },
  largeQuestionGirlIcon: {
    width: 180,
    height: 180,
  },
  previewTextContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-start',
    paddingTop: 10,
    marginLeft: 70,
  },
  titleWithButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: 10,
  },
  rightViewButton: {
    marginLeft: 8,
    flexShrink: 0,
  },
  rightViewButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DB2777',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(219, 39, 119, 0.3)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dailyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dailyBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
    fontWeight: '500',
  },
  previewTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    letterSpacing: 0.4,
    fontFamily: 'System',
    lineHeight: 22,
  },
  previewSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
    fontFamily: 'System',
    lineHeight: 18,
  },
  viewButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  viewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.4,
    fontFamily: 'System',
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 0,
    minHeight: 450,
    maxHeight: 650,
  },
  centeredOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centeredCard: {
    width: '92%',
    minHeight: 520,
    maxHeight: 780,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    minHeight: 520,
    maxHeight: 780,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    padding: 10,
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 0,
    lineHeight: 16,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  // Enhanced Animation Elements
  sparkleElement1: {
    position: 'absolute',
    top: 25,
    left: 40,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  sparkleElement2: {
    position: 'absolute',
    top: 60,
    right: 50,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  sparkleElement3: {
    position: 'absolute',
    bottom: 40,
    left: 60,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 9,
    elevation: 9,
  },
  sparkleElement4: {
    position: 'absolute',
    bottom: 25,
    right: 80,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 7,
    elevation: 7,
  },
  floatingParticle1: {
    position: 'absolute',
    top: 35,
    left: 80,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  floatingParticle2: {
    position: 'absolute',
    bottom: 50,
    right: 40,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  floatingParticle3: {
    position: 'absolute',
    top: 50,
    right: 100,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 5,
    elevation: 5,
  },
  rotatingRing: {
    position: 'absolute',
    top: 40,
    left: 120,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderTopColor: '#FFFFFF',
    borderRightColor: 'rgba(255, 255, 255, 0.9)',
  },
  glowOrb1: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 12,
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 35,
    left: 30,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  shimmerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
});

const quizBannerStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
  },
  shine: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  textCol: { flex: 1, minWidth: 0, paddingRight: 6 },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  sub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 14,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  outlineBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
});

const homePreviewStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
    }),
  },
  card: {
    borderRadius: 20,
    paddingTop: 14,
    paddingBottom: 0,
    paddingLeft: 16,
    paddingRight: 0,
    minHeight: 142,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -20,
    right: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  left: { flex: 1, paddingRight: 6, minWidth: 0, zIndex: 1, paddingBottom: 14 },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#B91C1C',
  },
  dailyText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#FFF',
    marginLeft: 5,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: '#FFF',
    marginBottom: 4,
    lineHeight: Platform.OS === 'android' ? 24 : 22,
  },
  sub: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 10,
    lineHeight: Platform.OS === 'android' ? 18 : 16,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  ctaText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#FFF',
    marginRight: 4,
  },
  imageClip: {
    alignSelf: 'flex-end',
    width: 114,
    height: 152,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: -12,
    marginRight: -2,
    overflow: 'hidden',
  },
  image: {
    width: 150,
    height: 150,
  },
});

export default QuestionOfTheDayPreview; 
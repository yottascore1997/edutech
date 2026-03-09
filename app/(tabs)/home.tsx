import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import { useWallet } from '@/context/WalletContext';
import { applyExamFilters } from '@/utils/examFilter';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBannerSlider from '../../components/CustomBannerSlider';
import ExamCard from '../../components/ExamCard';
import ExamNotificationsSection from '../../components/ExamNotificationsSection';
import PracticeCategoriesPreview from '../../components/PracticeCategoriesPreview';
import QuestionOfTheDayPreview from '../../components/QuestionOfTheDayPreview';
import StudentSuccessStories from '../../components/StudentSuccessStories';
import TopPerformersSection from '../../components/TopPerformersSection';
import HomeFeatureGrid from '../../components/HomeFeatureGrid';
import StudentsSelectedBanner from '../../components/StudentsSelectedBanner';
import PreviousYearPapersPreview from '../../components/PreviousYearPapersPreview';
import HomeFixedBanner from '../../components/HomeFixedBanner';
import CurrentAffairsPreview from '../../components/CurrentAffairsPreview';

const { width: screenWidth } = Dimensions.get('window');

const STUDY_PARTNER_SLIDER_IMAGES = [
  require('@/assets/images/icons/images.png'),
  require('@/assets/images/icons/student1.png'),
  require('@/assets/images/icons/student2.png'),
  require('@/assets/images/icons/homebuddy.png'),
];

type GreetingInfo = {
  label: 'Morning' | 'Afternoon' | 'Evening' | 'Good night';
  title: string;
  subtitle: string;
  colors: [string, string];
  pillColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  isDark?: boolean; // true = use white text (for night mode)
  image?: number; // require() for sunrise, ocean, full-moon
};

function getGreetingInfo(): GreetingInfo {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      label: 'Morning',
      title: "Let's start your day",
      subtitle: 'Begin with a mindful morning reflection.',
      colors: ['#FDE68A', '#FBBF24'],
      pillColor: '#FCD34D',
      icon: 'sunny',
      iconBg: '#FFFBEB',
      iconColor: '#F97316',
      image: require('../../assets/images/icons/sunrise.png'),
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      label: 'Afternoon',
      title: 'Keep your momentum going',
      subtitle: 'Pick a quick session to stay on track.',
      colors: ['#BAE6FD', '#38BDF8'],
      pillColor: '#0EA5E9',
      icon: 'sunny-outline',
      iconBg: '#E0F2FE',
      iconColor: '#0284C7',
      image: require('../../assets/images/icons/ocean.png'),
    };
  }

  if (hour >= 17 && hour < 21) {
    return {
      label: 'Evening',
      title: 'Unwind with a quick quiz',
      subtitle: 'Light revision to close your day well.',
      colors: ['#F9A8D4', '#FB7185'],
      pillColor: '#EC4899',
      icon: 'partly-sunny',
      iconBg: '#FEF2F2',
      iconColor: '#FB923C',
      image: require('../../assets/images/icons/full-moon.png'),
    };
  }

  return {
    label: 'Good night',
    title: 'Great job today',
    subtitle: 'Review a few concepts before you sleep.',
    colors: ['#1E3A8A', '#111827'],
    pillColor: '#1F2937',
    icon: 'moon',
    iconBg: '#020617',
    iconColor: '#E5E7EB',
    isDark: true,
    image: require('../../assets/images/icons/full-moon.png'),
  };
}


export default function HomeScreen() {
    const { user } = useAuth();
    const { walletAmount, refreshWalletAmount } = useWallet();
    const { selectedCategory } = useCategory();
    const router = useRouter();
    const navigation = useNavigation();

    // Force re-render when user state changes
    React.useEffect(() => {
        console.log('🏠 Home screen re-rendered, user state:', {
            hasUser: !!user,
            userId: user?.id,
            hasToken: !!user?.token,
            tokenLength: user?.token?.length,
            userName: user?.name
        });

        if (user?.token) {

        } else {

        }
    }, [user]);
    const [exams, setExams] = useState<any[]>([]);
    const [joinedLiveExamIds, setJoinedLiveExamIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [weeklyToppersRefreshTrigger, setWeeklyToppersRefreshTrigger] = useState(0);
    
    // Refs for sliders and components
    const examSliderRef = useRef<FlatList<any>>(null);
    const [currentExamIndex, setCurrentExamIndex] = useState(0);
    const autoScrollInterval = useRef<ReturnType<typeof setInterval>>(null);

    const studyPartnerSliderRef = useRef<FlatList<any>>(null);
    const [studyPartnerImageIndex, setStudyPartnerImageIndex] = useState(0);

    // Auto scroll function
    const startAutoScroll = () => {
        autoScrollInterval.current = setInterval(() => {
            if (featuredExams.length > 1) {
                const nextIndex = (currentExamIndex + 1) % featuredExams.length;
                examSliderRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                    viewPosition: 0
                });
                setCurrentExamIndex(nextIndex);
            }
        }, 3000); // Scroll every 3 seconds
    };

    // Stop auto scroll
    const stopAutoScroll = () => {
        if (autoScrollInterval.current) {
            clearInterval(autoScrollInterval.current);
        }
    };

    // Data for sliders - filter out expired exams and apply category filter
    const activeExams = applyExamFilters(exams, {
      category: selectedCategory || undefined,
      includeExpired: false,
      userId: user?.id,
      joinedExamIds: joinedLiveExamIds
    });
    const featuredExams = activeExams.slice(0, 5);

    // Fetch Exams Function
    const fetchJoinedLiveExams = async () => {
        if (!user?.token) return;
        try {
            const res = await apiFetchAuth('/student/my-exams', user.token);
            if (res.ok && Array.isArray(res.data)) {
                const ids = res.data
                    .filter((e: any) => e.examType === 'LIVE' && e.status !== 'COMPLETED')
                    .map((e: any) => e.examId || e.id)
                    .filter(Boolean);
                setJoinedLiveExamIds(ids);
            } else {
                setJoinedLiveExamIds([]);
            }
        } catch (error) {
            console.error('❌ Error fetching joined live exams:', error);
            setJoinedLiveExamIds([]);
        }
    };

    const fetchExams = async () => {
        console.log('🏠 Home screen - User data:', {
            hasUser: !!user,
            userId: user?.id,
            hasToken: !!user?.token,
            tokenLength: user?.token?.length,
            userName: user?.name
        });

        if (!user?.token) {

            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const response = await apiFetchAuth('/student/exams', user.token);

            if (response.ok) setExams(response.data);
            await fetchJoinedLiveExams();
        } catch (error) {
            console.error('❌ Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    // Simple Refresh Function (also refreshes Weekly Toppers)
    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchExams();
            setWeeklyToppersRefreshTrigger((t) => t + 1);
        } catch (error) {
            console.error('Error refreshing home page:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Fetch Exams Effect and Start Auto Scroll
    useEffect(() => {
        fetchExams();
        if (featuredExams.length > 0) {
            startAutoScroll();
            return () => stopAutoScroll();
        }
    }, [user, featuredExams.length]);

    // Study Partner card: auto-slide images every 5 sec
    useEffect(() => {
        const id = setInterval(() => {
            setStudyPartnerImageIndex((prev) => {
                const next = (prev + 1) % STUDY_PARTNER_SLIDER_IMAGES.length;
                setTimeout(() => {
                    studyPartnerSliderRef.current?.scrollToIndex({
                        index: next,
                        animated: true,
                        viewPosition: 0,
                    });
                }, 0);
                return next;
            });
        }, 5000);
        return () => clearInterval(id);
    }, []);

    // Auto-refresh every 1 hour when screen is active
    useEffect(() => {
        const interval = setInterval(() => {
            if (user?.token) {
                fetchExams();
            }
        }, 3600000); // 1 hour (3600000 milliseconds)

        return () => clearInterval(interval);
    }, [user?.token]);
    


    const renderExamCard = ({ item }: { item: any }) => (
        <View style={{ 
            width: screenWidth - 40,
            marginHorizontal: 10,
        }}>
            <ExamCard exam={item} navigation={router} />
        </View>
    );
    


  const greeting = getGreetingInfo();

  return (
    <>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Time-based greeting card */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <LinearGradient
              colors={greeting.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.greetingCard}
            >
              <View style={styles.greetingSunWrapper}>
                <View style={[styles.greetingSun, { backgroundColor: greeting.iconBg }]}>
                  {greeting.image ? (
                    <Image source={greeting.image} style={styles.greetingImage} resizeMode="contain" />
                  ) : (
                    <Ionicons name={greeting.icon} size={28} color={greeting.iconColor} />
                  )}
                </View>
              </View>
              <View style={styles.greetingTextWrapper}>
                <Text style={[styles.greetingTitle, greeting.isDark && styles.greetingTitleDark]}>{greeting.title}</Text>
                <Text style={[styles.greetingSubtitle, greeting.isDark && styles.greetingSubtitleDark]} numberOfLines={2}>
                  {greeting.subtitle}
                </Text>
              </View>
            </LinearGradient>

            <View style={[styles.greetingSidePill, { backgroundColor: greeting.pillColor }]}>
              <Text style={[styles.greetingSideText, greeting.isDark && styles.greetingSideTextDark]}>{greeting.label}</Text>
            </View>
          </View>
        </View>

        {/* Categories - clean premium grid, no boxes */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesGrid}>
            {[
              { id: '1', name: 'Live Exam', icon: 'flash', color: '#6366F1', gradient: ['#6366F1', '#8B5CF6'], route: '/(tabs)/exam', image: require('../../assets/images/icons/exam.png') },
              { id: '2', name: 'Practice', icon: 'school', color: '#8B5CF6', gradient: ['#8B5CF6', '#A78BFA'], route: '/(tabs)/practice-categories', image: require('../../assets/images/icons/exam-time.png') },
              { id: '3', name: 'Quiz', icon: 'help-circle', color: '#10B981', gradient: ['#10B981', '#34D399'], route: '/(tabs)/quiz', image: require('../../assets/images/icons/quiz.png') },
              { id: '4', name: 'Timetable', icon: 'calendar', color: '#F59E0B', gradient: ['#F59E0B', '#FBBF24'], route: '/(tabs)/timetable', image: require('../../assets/images/icons/study-time.png') },
              { id: '5', name: 'Books', icon: 'book', color: '#06B6D4', gradient: ['#06B6D4', '#22D3EE'], route: '/(tabs)/book-store', image: require('../../assets/images/icons/book-shop.png') },
              { id: '6', name: 'Study Partner', icon: 'people', color: '#EC4899', gradient: ['#EC4899', '#F472B6'], route: '/(tabs)/study-partner', image: require('../../assets/images/icons/online-dating.png') },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.categoryCard}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.75}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: item.color + '14' }]}>
                  {'image' in item && item.image ? (
                    <Image source={item.image} style={styles.categoryIconImage} resizeMode="contain" />
                  ) : (
                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                  )}
                </View>
                <Text style={styles.categoryName}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Banner Slider */}
        <CustomBannerSlider onBannerPress={(banner) => {
                        // Handle banner press - navigate to different screens based on banner
                        switch (banner.action) {
                        case 'practice-exam':
                                router.push('/(tabs)/practice-exam' as any);
                                break;
                            case 'exam':
                                router.push('/(tabs)/exam');
                                break;
                            case 'profile':
                                router.push('/(tabs)/profile');
                                break;
                            default:
                                break;
                        }
                    }} />

                    {/* Professional Live Exams Section */}
                    <View style={styles.professionalLiveExamsSection}>
                        <LinearGradient
                            colors={['#EFF6FF', '#DBEAFE', '#E0E7FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.professionalSectionContainer}
                        >
                            {/* Header Section */}
                            <View style={styles.professionalHeaderSection}>
                                <View style={styles.professionalHeaderLeft}>
                                    <View style={styles.professionalIconContainer}>
                                        <LinearGradient
                                            colors={['#6366F1', '#8B5CF6']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.professionalIconGradient}
                                        >
                                            <Ionicons name="flash" size={22} color="#FFFFFF" />
                                        </LinearGradient>
                                    </View>
                                    <View style={styles.professionalHeaderText}>
                                        <Text style={styles.professionalTitle}>Live Exams</Text>
                                        <View style={styles.professionalTitleUnderline} />
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={styles.professionalViewAllBtn}
                                    onPress={() => router.push('/(tabs)/exam')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.professionalViewAllText}>View All</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#6366F1" />
                                </TouchableOpacity>
                            </View>

                            {/* Exams Content Section */}
                            {loading ? (
                                <View style={styles.professionalLoadingContainer}>
                                    <ActivityIndicator size="large" color="#6366F1" />
                                </View>
                            ) : featuredExams.length === 0 ? (
                                <View style={styles.professionalEmptyContainer}>
                                    <Ionicons name="library-outline" size={48} color="#9CA3AF" />
                                    <Text style={styles.professionalEmptyTitle}>No Exams Available</Text>
                                    <Text style={styles.professionalEmptySubtext}>Check back later for new featured exams.</Text>
                                </View>
                            ) : (
                                <>
                                    <FlatList
                                        ref={examSliderRef}
                                        data={featuredExams}
                                        renderItem={renderExamCard}
                                        keyExtractor={(item) => item.id}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.professionalListContainer}
                                        onScrollBeginDrag={stopAutoScroll}
                                        onScrollEndDrag={startAutoScroll}
                                        onMomentumScrollEnd={(event) => {
                                            const offsetX = event.nativeEvent.contentOffset.x;
                                            const index = Math.round(offsetX / (screenWidth - 32));
                                            setCurrentExamIndex(Math.min(index, featuredExams.length - 1));
                                        }}
                                        getItemLayout={(data, index) => ({
                                            length: screenWidth - 32,
                                            offset: (screenWidth - 32) * index,
                                            index,
                                        })}
                                        snapToInterval={screenWidth - 32}
                                        snapToAlignment="center"
                                        decelerationRate="fast"
                                        pagingEnabled
                                    />
                                    <View style={styles.professionalPaginationContainer}>
                                        {featuredExams.map((_, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => {
                                                    setCurrentExamIndex(index);
                                                    examSliderRef.current?.scrollToIndex({ index, animated: true });
                                                }}
                                                style={styles.professionalPaginationWrapper}
                                            >
                                                <View
                                                    style={[
                                                        styles.professionalPaginationDot,
                                                        index === currentExamIndex && styles.professionalPaginationDotActive
                                                    ]}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}
                        </LinearGradient>
                    </View>
            
            {/* Study Partner Card - above Question of the Day */}
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => router.push('/(tabs)/study-partner' as any)}
              style={styles.studyPartnerCardWrap}
            >
              <LinearGradient
                colors={['#EDE9FE', '#F5F3FF', '#FCE7F3', '#FDF2F8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.studyPartnerCard}
              >
                <View style={styles.studyPartnerCardRow}>
                  <View style={styles.studyPartnerCardText}>
                    <View style={styles.studyPartnerCardLabelRow}>
                      <Ionicons name="heart" size={16} color="#7C3AED" />
                      <Text style={styles.studyPartnerCardLabel}>Study Partner</Text>
                    </View>
                    <Text style={styles.studyPartnerCardTitle}>Find your Study Buddy</Text>
                    <Text style={styles.studyPartnerCardSubtitle} numberOfLines={2}>
                      Match with like-minded students, study together & never feel alone.
                    </Text>
                    <LinearGradient
                      colors={['#FB923C', '#F97316', '#EA580C']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.studyPartnerCardCta}
                    >
                      <Text style={styles.studyPartnerCardCtaText}>Find a buddy</Text>
                      <Ionicons name="heart-outline" size={14} color="#FFF" />
                    </LinearGradient>
                  </View>
                  <View style={styles.studyPartnerCardImageWrap}>
                    <FlatList
                      ref={studyPartnerSliderRef}
                      data={STUDY_PARTNER_SLIDER_IMAGES}
                      horizontal
                      pagingEnabled
                      scrollEventThrottle={16}
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(_, i) => `study-partner-img-${i}`}
                      onMomentumScrollEnd={(e) => {
                        const i = Math.round(e.nativeEvent.contentOffset.x / 160);
                        setStudyPartnerImageIndex(Math.min(i, STUDY_PARTNER_SLIDER_IMAGES.length - 1));
                      }}
                      getItemLayout={(_, index) => ({ length: 160, offset: 160 * index, index })}
                      snapToInterval={160}
                      snapToAlignment="start"
                      decelerationRate="fast"
                      renderItem={({ item, index }) => (
                        <View style={[styles.studyPartnerSlideItem, index === 1 && styles.studyPartnerSlideItemTopAlign]}>
                          <Image
                            source={item}
                            style={styles.studyPartnerCardImage}
                            resizeMode="contain"
                          />
                        </View>
                      )}
                    />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Question of the Day Section */}
            <QuestionOfTheDayPreview />

            {/* Practice Categories Preview Section */}
            <PracticeCategoriesPreview />

            {/* Quiz promo - single card with banner (above Stories that inspire) */}
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => router.push('/(tabs)/quiz' as any)}
              style={styles.quizBannerCardWrap}
            >
              <Image
                source={require('../../assets/images/icons/quizbanner.png')}
                style={styles.quizBannerImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['#EEF2FF', '#E0E7FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quizBannerTextBlock}
              >
                <Text style={styles.quizBannerTitle}>Quiz</Text>
                <Text style={styles.quizBannerSubtitle} numberOfLines={2}>
                  Battle & live quizzes — challenge others and win coins.
                </Text>
                <LinearGradient
                  colors={['#059669', '#047857', '#065F46']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.quizBannerCta}
                >
                  <Text style={styles.quizBannerCtaText}>Play now</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </LinearGradient>
              </LinearGradient>
            </TouchableOpacity>

            {/* PYQ promo card */}
            <View style={styles.quizPromoSection}>
              <View style={styles.quizPromoStack}>
                {/* Previous Year Questions */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/pyq' as any)}
                  style={styles.quizPromoCardWrapper}
                >
                  <LinearGradient
                    colors={['#FFEDD5', '#FDBA74']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quizPromoCard}
                  >
                    <View style={styles.quizPromoLeft}>
                      <View style={[styles.quizPromoIconCircle, { backgroundColor: '#FFF7ED' }]}>
                        <Ionicons name="document-text" size={26} color="#C2410C" />
                      </View>
                      <View style={styles.quizPromoTextBlock}>
                        <Text style={styles.quizPromoTitle}>Previous Year Questions</Text>
                        <Text style={styles.quizPromoSubtitle} numberOfLines={2}>
                          Practice real exam questions and boost your score.
                        </Text>
                      </View>
                    </View>
                    <View style={styles.quizPromoCtaPill}>
                      <Text style={styles.quizPromoCtaText}>Solve now</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Student Success Stories Section */}
            <StudentSuccessStories />
            
            {/* Feature Grid Section (Study notes, PYPs, Practice, etc.) */}
            <HomeFeatureGrid />

            {/* Students selected banner */}
            <StudentsSelectedBanner />

            {/* Job Competition Banner */}
            {/* <JobCompetitionBanner onPress={() => {
                // router.push('/job-competition');
            }} /> */}

            {/* Top Performers Section */}
            <TopPerformersSection
                refreshTrigger={weeklyToppersRefreshTrigger}
                onPress={() => {
                    // router.push('/leaderboard'); // Example navigation
                }}
            />

            {/* Previous Year Papers Preview */}
            <PreviousYearPapersPreview />

            {/* Fixed banner below PYP */}
            <HomeFixedBanner />

            {/* Current Affairs Section */}
            <CurrentAffairsPreview />

            {/* Exam Notifications Section */}
            <ExamNotificationsSection />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    greetingSection: {
        marginTop: 12,
        marginHorizontal: 14,
        marginBottom: 8,
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    greetingCard: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginRight: 8,
        backgroundColor: '#FDE68A',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 3,
        flexDirection: 'row',
    },
    greetingSunWrapper: {
        justifyContent: 'center',
        marginRight: 10,
    },
    greetingSun: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFBEB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    greetingImage: {
        width: 32,
        height: 32,
    },
    greetingTextWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    greetingTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    greetingSubtitle: {
        fontSize: 12,
        color: '#4B5563',
    },
    greetingTitleDark: {
        color: '#FFFFFF',
    },
    greetingSubtitleDark: {
        color: '#E5E7EB',
    },
    greetingSidePill: {
        width: 56,
        borderRadius: 18,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    greetingSideText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        transform: [{ rotate: '-90deg' }],
    },
    greetingSideTextDark: {
        color: '#FFFFFF',
    },
    studyPartnerCardWrap: {
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 14,
        elevation: 6,
    },
    studyPartnerCard: {
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 18,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.15)',
    },
    studyPartnerCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    studyPartnerCardText: {
        flex: 1,
        minWidth: 0,
        paddingRight: 14,
    },
    studyPartnerCardLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    studyPartnerCardLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#7C3AED',
        letterSpacing: 0.5,
    },
    studyPartnerCardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#4C1D95',
        marginBottom: 4,
        lineHeight: 22,
    },
    studyPartnerCardSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#5B21B6',
        lineHeight: 17,
        marginBottom: 10,
    },
    studyPartnerCardCta: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
    },
    studyPartnerCardCtaText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    studyPartnerCardImageWrap: {
        width: 160,
        height: 160,
        overflow: 'hidden',
    },
    studyPartnerSlideItem: {
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
    },
    studyPartnerSlideItemTopAlign: {
        justifyContent: 'flex-start',
    },
    studyPartnerCardImage: {
        width: 240,
        height: 240,
    },
    quizBannerCardWrap: {
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 4,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    quizBannerImage: {
        width: '100%',
        height: 140,
        backgroundColor: '#E5E7EB',
    },
    quizBannerTextBlock: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        backgroundColor: '#E0E7FF',
    },
    quizBannerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: 0.3,
        marginBottom: 6,
    },
    quizBannerSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 12,
    },
    quizBannerCta: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#047857',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    quizBannerCtaText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    quizPromoSection: {
        marginHorizontal: 14,
        marginTop: 4,
        marginBottom: 12,
    },
    quizPromoStack: {
        gap: 10,
    },
    quizPromoCardWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    quizPromoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 18,
    },
    quizPromoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    quizPromoIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    quizPromoTextBlock: {
        flex: 1,
    },
    quizPromoTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 2,
    },
    quizPromoSubtitle: {
        fontSize: 12,
        color: '#4B5563',
    },
    quizPromoCtaPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#000000',
    },
    quizPromoCtaText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    
    // Categories - open, no boxes, professional
    categoriesSection: {
        marginHorizontal: 14,
        marginTop: 12,
        marginBottom: 8,
        paddingHorizontal: 0,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryCard: {
        width: (screenWidth - 28 - 12) / 3,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    categoryIconCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    categoryIconImage: {
        width: 36,
        height: 36,
    },
    categoryName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        marginTop: 0,
        letterSpacing: 0.1,
    },
    
    // Professional Live Exams Section
    professionalLiveExamsSection: {
        marginHorizontal: 0,
        marginTop: 12,
        marginBottom: 24,
        backgroundColor: '#FFFFFF',
    },
    professionalSectionContainer: {
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    professionalHeaderSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    professionalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    professionalIconContainer: {
        marginRight: 12,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    professionalIconGradient: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    professionalHeaderText: {
        flex: 1,
    },
    professionalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    professionalTitleUnderline: {
        width: 40,
        height: 3,
        backgroundColor: '#6366F1',
        borderRadius: 2,
    },
    professionalViewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
    },
    professionalViewAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6366F1',
        marginRight: 4,
        letterSpacing: 0.2,
    },
    professionalListContainer: {
        paddingHorizontal: 0,
        paddingBottom: 12,
    },
    professionalLoadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    professionalEmptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    professionalEmptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginTop: 12,
        marginBottom: 4,
    },
    professionalEmptySubtext: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    professionalPaginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 6,
    },
    professionalPaginationWrapper: {
        padding: 4,
    },
    professionalPaginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
    },
    professionalPaginationDotActive: {
        width: 24,
        backgroundColor: '#6366F1',
    },
    
    listContainer: {
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 5,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
        backgroundColor: '#D1D5DB',
    },
    paginationDotActive: {
        backgroundColor: '#047857',
        width: 24,
    },
    emptyCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        textAlign: 'center',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        fontFamily: 'System',
        lineHeight: 24,
    },
    emptySubtext: {
        fontSize: 15,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
        letterSpacing: 0.2,
        fontFamily: 'System',
    },
});

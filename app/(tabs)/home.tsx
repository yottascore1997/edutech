import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import { useWallet } from '@/context/WalletContext';
import { applyExamFilters } from '@/utils/examFilter';
import {
    mergeJoinedLiveExamsIntoExamList,
    syncJoinedLiveExamIds,
} from '@/utils/joinedLiveExams';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HomeScreenUI from '../../components/home/HomeScreenUI';
import ExamNotificationsSection from '../../components/ExamNotificationsSection';
import HomePracticeSection from '../../components/home/HomePracticeSection';
import HomePyqBanner from '../../components/home/HomePyqBanner';
import QuestionOfTheDayPreview from '../../components/QuestionOfTheDayPreview';
import StudentSuccessStories from '../../components/StudentSuccessStories';
import TopPerformersSection from '../../components/TopPerformersSection';
import HomeFeatureGrid from '../../components/HomeFeatureGrid';
import StudentsSelectedBanner from '../../components/StudentsSelectedBanner';
import PreviousYearPapersPreview from '../../components/PreviousYearPapersPreview';
import HomeFixedBanner from '../../components/HomeFixedBanner';
import HomeCurrentAffairsSection from '../../components/home/HomeCurrentAffairsSection';

const { width: screenWidth } = Dimensions.get('window');

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
            const joinedIds = user.id
                ? await syncJoinedLiveExamIds(user.token, String(user.id))
                : [];
            setJoinedLiveExamIds(joinedIds);

            if (response.ok) {
                const list = Array.isArray(response.data) ? response.data : [];
                const merged = user.token
                    ? await mergeJoinedLiveExamsIntoExamList(list, joinedIds, user.token)
                    : list;
                setExams(merged);
            }
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

    // Auto-refresh every 1 hour when screen is active
    useEffect(() => {
        const interval = setInterval(() => {
            if (user?.token) {
                fetchExams();
            }
        }, 3600000); // 1 hour (3600000 milliseconds)

        return () => clearInterval(interval);
    }, [user?.token]);
    




  return (
    <>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6344D4']}
            tintColor="#6344D4"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <HomeScreenUI
          userName={user?.name}
          exams={featuredExams}
          loading={loading}
          examSliderRef={examSliderRef}
          currentExamIndex={currentExamIndex}
          onExamIndexChange={setCurrentExamIndex}
          onScrollBeginDrag={stopAutoScroll}
          onScrollEndDrag={startAutoScroll}
          onStudyPartnerPress={() => router.push('/(tabs)/study-partner' as any)}
        />

            {/* Question of the Day Section */}
            <QuestionOfTheDayPreview />

            <HomePracticeSection />

            <HomePyqBanner />

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
            <HomeCurrentAffairsSection />

            {/* Exam Notifications Section */}
            <ExamNotificationsSection />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FC',
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

import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { filterActiveExams } from '@/utils/examFilter';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomBannerSlider from '../../components/CustomBannerSlider';
import ExamCard from '../../components/ExamCard';
import ExamNotificationsSection from '../../components/ExamNotificationsSection';
import PracticeCategoriesPreview from '../../components/PracticeCategoriesPreview';
import QuestionOfTheDayPreview from '../../components/QuestionOfTheDayPreview';
import StudentSuccessStories from '../../components/StudentSuccessStories';
import TopPerformersSection from '../../components/TopPerformersSection';

const { width: screenWidth } = Dimensions.get('window');


export default function HomeScreen() {
    const { user } = useAuth();
    const { walletAmount, refreshWalletAmount } = useWallet();
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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
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

    // Data for sliders - filter out expired exams
    const activeExams = filterActiveExams(exams);
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

            if (response.ok) setExams(response.data);
        } catch (error) {
            console.error('❌ Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    // Simple Refresh Function
    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchExams();
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

    // Auto-refresh every 30 seconds when screen is active
    useEffect(() => {
        const interval = setInterval(() => {
            if (user?.token) {
                fetchExams();
            }
        }, 30000); // 30 seconds

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
    


  return (
    <>
      <ScrollView 
        style={styles.container}
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
        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <FlatList
            data={[
              { id: '1', name: 'Live Exam', icon: 'flash', color: '#4F46E5', route: '/(tabs)/exam' },
                { id: '2', name: 'Practice', icon: 'school', color: '#7C3AED', route: '/(tabs)/practice-categories' },
                { id: '3', name: 'Quiz', icon: 'help-circle', color: '#10B981', route: '/(tabs)/quiz' },
                { id: '4', name: 'Social', icon: 'people', color: '#EC4899', route: '/(tabs)/social' },
                { id: '5', name: 'Timetable', icon: 'calendar', color: '#F59E0B', route: '/(tabs)/timetable' },
                { id: '6', name: 'Books', icon: 'book', color: '#06B6D4', route: '/(tabs)/book-store' },
              ]}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.categoryItem}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.categoryIconContainer, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.categoryText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            />
        </View>

        {/* Custom Banner Slider */}
        <CustomBannerSlider onBannerPress={(banner) => {
                        // Handle banner press - navigate to different screens based on banner
                        switch (banner.action) {
                            case 'practice-exam':
                                router.push('/(tabs)/practice-exam');
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

                    {/* Enhanced Live Exams Header */}
                    <View style={styles.enhancedLiveExamsHeader}>
                        <LinearGradient
                            colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.enhancedHeaderGradient}
                        >
                            <View style={styles.enhancedHeaderContent}>
                                <View style={styles.enhancedHeaderLeft}>
                                    <View style={styles.enhancedIconContainer}>
                                        <Ionicons name="flash" size={20} color="#FFFFFF" />
                                    </View>
                                    <View style={styles.enhancedTextContainer}>
                                        <Text style={styles.enhancedHeaderTitle}>Live Exams</Text>
                                        <Text style={styles.enhancedHeaderSubtitle}>Join now & win rewards</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={styles.enhancedViewAllButton}
                                    onPress={() => router.push('/(tabs)/exam')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.enhancedViewAllText}>View All</Text>
                                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>

            {loading ? (
                <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 20 }} />
            ) : featuredExams.length === 0 ? (
                <View style={styles.emptyCard}>
                    <View style={styles.emptyContainer}>
                        <Ionicons name="library-outline" size={48} color={AppColors.grey} />
                        <Text style={styles.emptyTitle}>No Exams Available</Text>
                        <Text style={styles.emptySubtext}>Check back later for new featured exams.</Text>
                    </View>
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
                        contentContainerStyle={styles.listContainer}
                        onScrollBeginDrag={stopAutoScroll}
                        onScrollEndDrag={startAutoScroll}
                        onMomentumScrollEnd={(event) => {
                            const offsetX = event.nativeEvent.contentOffset.x;
                            const index = Math.round(offsetX / (screenWidth - 20));
                            setCurrentExamIndex(Math.min(index, featuredExams.length - 1));
                        }}
                        getItemLayout={(data, index) => ({
                            length: screenWidth - 20,
                            offset: (screenWidth - 20) * index,
                            index,
                        })}
                        snapToInterval={screenWidth - 20}
                        snapToAlignment="center"
                        decelerationRate="fast"
                        pagingEnabled
                    />
                    <View style={styles.paginationContainer}>
                        {featuredExams.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.paginationDot,
                                    currentExamIndex === index && styles.paginationDotActive
                                ]}
                            />
                        ))}
                    </View>
                </>
            )}
            
            {/* Question of the Day Section */}
            <QuestionOfTheDayPreview />

            {/* Practice Categories Preview Section */}
            <PracticeCategoriesPreview />

            {/* Student Success Stories Section */}
            <StudentSuccessStories />

            {/* Job Competition Banner */}
            {/* <JobCompetitionBanner onPress={() => {
                // router.push('/job-competition');
            }} /> */}

            {/* Top Performers Section */}
            <TopPerformersSection onPress={() => {
                // router.push('/leaderboard'); // Example navigation
            }} />

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
    
    // Categories Section
    categoriesSection: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 12,
        marginTop: 8,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    categoriesContainer: {
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    categoryItem: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 70,
        marginVertical: 8,
        marginHorizontal: 4,
    },
    categoryIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
    
    // Enhanced Live Exams Header Styles
    enhancedLiveExamsHeader: {
        marginHorizontal: 16,
        marginTop: 0,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    enhancedHeaderGradient: {
        paddingVertical: 16,
        paddingHorizontal: 18,
    },
    enhancedHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    enhancedHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    enhancedIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    enhancedTextContainer: {
        flex: 1,
    },
    enhancedHeaderTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 2,
        letterSpacing: 0.4,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    enhancedHeaderSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    enhancedViewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    enhancedViewAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        marginRight: 4,
        letterSpacing: 0.3,
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

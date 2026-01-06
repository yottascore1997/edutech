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
        {/* Premium Categories Section */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesGrid}>
            {[
              { id: '1', name: 'Live Exam', icon: 'flash', color: '#6366F1', gradient: ['#6366F1', '#8B5CF6'], route: '/(tabs)/exam' },
              { id: '2', name: 'Practice', icon: 'school', color: '#8B5CF6', gradient: ['#8B5CF6', '#A78BFA'], route: '/(tabs)/practice-categories' },
              { id: '3', name: 'Quiz', icon: 'help-circle', color: '#10B981', gradient: ['#10B981', '#34D399'], route: '/(tabs)/quiz' },
              { id: '4', name: 'Social', icon: 'people', color: '#EC4899', gradient: ['#EC4899', '#F472B6'], route: '/(tabs)/social' },
              { id: '5', name: 'Timetable', icon: 'calendar', color: '#F59E0B', gradient: ['#F59E0B', '#FBBF24'], route: '/(tabs)/timetable' },
              { id: '6', name: 'Books', icon: 'book', color: '#06B6D4', gradient: ['#06B6D4', '#22D3EE'], route: '/(tabs)/book-store' },
            ].map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.categoryCard}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryCardInner}>
                  <LinearGradient
                    colors={item.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryIconWrapper}
                  >
                    <Ionicons name={item.icon as any} size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.categoryName}>{item.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
    
    // Premium Categories Section
    categoriesSection: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryCard: {
        width: (screenWidth - 48) / 3,
        marginBottom: 10,
    },
    categoryCardInner: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryIconWrapper: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    categoryName: {
        fontSize: 10,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        marginTop: 0,
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

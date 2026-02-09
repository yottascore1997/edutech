import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { apiFetchAuth, getImageUrl } from '../constants/api';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

interface Winner {
    userId: string;
    userName: string;
    name: string; // Mapped from userName
    rank: number;
    score: number;
    winnings: number;
    prizeAmount: number; // Mapped from winnings
    userPhoto?: string;
    course?: string;
    year?: string;
}

interface ExamLeaderboard {
    examId: string;
    examTitle: string;
    examDate: string;
    totalParticipants: number;
    prizePool: number;
    winners: Winner[];
}

interface WeeklyLeaderboardData {
    currentWeek: string;
    weekStart: string;
    weekEnd: string;
    totalExams: number;
    leaderboard: ExamLeaderboard[];
}

interface TopPerformersSectionProps {
    onPress?: () => void;
    /** Increment to trigger refetch (e.g. when parent pull-to-refresh). */
    refreshTrigger?: number;
}

// Enhanced Avatar Component with proper image loading
const WinnerAvatar = ({ userPhoto, userName }: { userPhoto?: string | null; userName: string }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const getInitials = (name: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const isValidPhoto = userPhoto && userPhoto.trim() !== '' && userPhoto !== 'null';
    const getImageUri = () => {
        if (!isValidPhoto) return null;
        if (userPhoto.startsWith('http://') || userPhoto.startsWith('https://')) {
            return userPhoto;
        }
        return getImageUrl(userPhoto);
    };

    const imageUri = getImageUri();

    if (!imageUri || imageError) {
        return (
            <View style={styles.avatarPlaceholder}>
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6', '#A855F7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarGradient}
                >
                    <Text style={styles.avatarInitials}>{getInitials(userName)}</Text>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.avatarContainer}>
            {imageLoading && (
                <View style={styles.avatarLoadingContainer}>
                    <ActivityIndicator size="small" color="#6366F1" />
                </View>
            )}
            <Image
                source={{ uri: imageUri }}
                style={styles.winnerAvatarImage}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => {
                    setImageLoading(false);
                    setImageError(false);
                }}
                onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                }}
                resizeMode="cover"
            />
        </View>
    );
};

const TopPerformersSection: React.FC<TopPerformersSectionProps> = ({ onPress, refreshTrigger }) => {
    const { user } = useAuth();
    const [leaderboardData, setLeaderboardData] = useState<WeeklyLeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentExamIndex, setCurrentExamIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const autoScrollInterval = useRef<ReturnType<typeof setInterval>>(null);
    
    // Auto-scroll functionality - disabled since we only show one exam (today's or most recent)
    const startAutoScroll = useCallback(() => {
        // No auto-scroll needed as we only show one exam
        // if (leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 1) {
        //     autoScrollInterval.current = setInterval(() => {
        //         setCurrentExamIndex((prevIndex) => {
        //             const nextIndex = (prevIndex + 1) % leaderboardData.leaderboard.length;
        //             scrollViewRef.current?.scrollTo({
        //                 x: nextIndex * 295, // card width + gap
        //                 animated: true
        //             });
        //             return nextIndex;
        //         });
        //     }, 4000); // 4 seconds interval
        // }
    }, [leaderboardData?.leaderboard]);

    const stopAutoScroll = useCallback(() => {
        if (autoScrollInterval.current) {
            clearInterval(autoScrollInterval.current);
        }
    }, []);

    useEffect(() => {
        startAutoScroll();
        return () => stopAutoScroll();
    }, [startAutoScroll, stopAutoScroll]);

    // Helper function to get current week in format YYYY-WW (ISO week)
    const getCurrentWeek = (): string => {
        const now = new Date();
        const dayOfWeek = now.getDay() || 7;
        now.setDate(now.getDate() + 4 - dayOfWeek);
        const year = now.getFullYear();
        const jan1 = new Date(year, 0, 1);
        const days = Math.floor((now.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((days + 1) / 7);
        return `${year}-${weekNumber.toString().padStart(2, '0')}`;
    };

    // Helper function to check if date is today
    const isToday = (dateString: string): boolean => {
        const examDate = new Date(dateString);
        const today = new Date();
        return examDate.toDateString() === today.toDateString();
    };

    // Helper function to filter and sort exams - today's exam first, then by date (most recent)
    const getFilteredExams = (exams: ExamLeaderboard[]): ExamLeaderboard[] => {
        if (!exams || exams.length === 0) return [];
        
        // Separate today's exams and other exams
        const todayExams = exams.filter(exam => isToday(exam.examDate));
        const otherExams = exams.filter(exam => !isToday(exam.examDate));
        
        // Sort other exams by date (most recent first)
        otherExams.sort((a, b) => {
            return new Date(b.examDate).getTime() - new Date(a.examDate).getTime();
        });
        
        // Return today's exams first, then most recent exam
        if (todayExams.length > 0) {
            return [todayExams[0]]; // Show first today's exam
        } else if (otherExams.length > 0) {
            return [otherExams[0]]; // Show most recent exam
        }
        
        return [];
    };

    // Fetch weekly leaderboard data
    const fetchLeaderboardData = async () => {
        try {
            if (!user?.token) return;
            
            const currentWeek = getCurrentWeek();
            const response = await apiFetchAuth(`/student/weekly-leaderboard?week=${currentWeek}`, user.token);
            
            if (response.ok) {
                if (response.data?.leaderboard) {
                    // Map API response fields to component expected fields
                    response.data.leaderboard.forEach((exam: any) => {
                        if (exam.winners && exam.winners.length > 0) {
                            exam.winners = exam.winners.map((winner: any) => ({
                                ...winner,
                                name: winner.userName || winner.name,
                                prizeAmount: winner.winnings || winner.prizeAmount,
                                score: winner.score || 0,
                                userPhoto: winner.userPhoto || null // Ensure userPhoto is preserved
                            }));
                        }
                    });
                    
                    // Filter to show today's exam or most recent exam
                    const filteredExams = getFilteredExams(response.data.leaderboard);
                    if (filteredExams.length > 0) {
                        response.data.leaderboard = filteredExams;
                    }
                }
                setLeaderboardData(response.data);
            } else {
                console.error('Failed to fetch leaderboard data:', response.data);
            }
        } catch (error) {
            console.error('Error fetching leaderboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboardData();
    }, [user?.token, refreshTrigger]);

    // Refetch when screen gains focus (e.g. back from another tab / week change)
    useFocusEffect(
        useCallback(() => {
            if (user?.token) fetchLeaderboardData();
        }, [user?.token])
    );

    useEffect(() => {
        // All animations removed for better performance
    }, []);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return '🎓';
            case 2:
                return '📚';
            case 3:
                return '📜';
            default:
                return '⭐';
        }
    };

    const getRankColors = (rank: number): [string, string] => {
        switch (rank) {
            case 1:
                return ['#10B981', '#059669']; // Green for excellence
            case 2:
                return ['#06B6D4', '#0891B2']; // Blue for achievement
            case 3:
                return ['#8B5CF6', '#7C3AED']; // Purple for progress
            default:
                return ['#E8E8E8', '#D0D0D0']; // Default
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Scholar':
                return '#10B981';
            case 'Achiever':
                return '#06B6D4';
            case 'Learner':
                return '#8B5CF6';
            default:
                return '#6B7280';
        }
    };

    // All animation interpolations removed for better performance





    return (
        <View style={styles.container}>
                            <LinearGradient
                    colors={['#FAFBFF', '#F8F9FF', '#FFFFFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sectionBackground}
                >










                                    {/* Header with Offer Soon Style Gradient & Animation */}
                    <LinearGradient
                        colors={['#2563EB', '#4F46E5', '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.headerGradient}
                    >
                        {/* Background pattern removed for better performance */}
                    <View style={styles.headerLeft}>
                        <View style={styles.headerIconContainer}>
                            <Image
                                source={require('../assets/images/icons/leadership.png')}
                                style={styles.headerLeadershipIcon}
                                resizeMode="contain"
                            />
                        </View>
                                                    {/* <Animated.View 
                                style={[
                                    styles.headerTextContainer,
                                    {
                                        transform: [{ translateY: headerFloatTranslateY }]
                                    }
                                ]}
                            > */}
                                <View style={styles.headerTextContainer}>
                                    <Text style={styles.headerTitle}>Weekly Toppers</Text>
                                </View>
                            {/* </Animated.View> */}
                    </View>
                    <TouchableOpacity style={styles.viewAllButton} onPress={onPress}>
                        <LinearGradient
                            colors={['#F59E0B', '#D97706']}
                            style={styles.viewAllGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.viewAllText}>View All</Text>
                            <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Exam-wise Toppers with Horizontal Scroll */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                        <Text style={styles.loadingText}>Loading weekly toppers...</Text>
                    </View>
                ) : leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0 ? (
                    <ScrollView 
                        ref={scrollViewRef}
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.examScrollContainer}
                        style={styles.examScrollView}
                        onScrollBeginDrag={stopAutoScroll}
                        onScrollEndDrag={startAutoScroll}
                        onMomentumScrollEnd={startAutoScroll}
                        pagingEnabled={false}
                        decelerationRate="fast"
                        snapToInterval={295} // card width + gap
                        snapToAlignment="start"
                    >
                        {leaderboardData.leaderboard.map((exam, examIndex) => (
                            <View
                                key={exam.examId}
                                style={styles.examCard}
                            >
                                <LinearGradient
                                    colors={['#FFFFFF', '#F8FAFC']}
                                    style={styles.examCardGradient}
                                >
                                    {/* Exam Header */}
                                    <View style={styles.examHeader}>
                                        <View style={styles.examIconContainer}>
                                            <Ionicons name="book" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={styles.examInfoContainer}>
                                            <Text style={styles.examTitle} numberOfLines={2}>
                                                {exam.examTitle}
                                            </Text>
                                            <Text style={styles.examDate}>
                                                {formatDate(exam.examDate)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Top 5 Winners with Winning Amounts */}
                                    <View style={styles.winnersContainer}>
                                        <Text style={styles.winnersSectionTitle}>Top 5 Winners</Text>
                                        {exam.winners && exam.winners.length > 0 ? (
                                            exam.winners.slice(0, 5).map((winner, winnerIndex) => (
                                                    <View key={winner.userId || winnerIndex} style={styles.winnerItem}>
                                                        <View style={styles.winnerRankContainer}>
                                                            <Text style={styles.winnerRank}>{winner.rank || winnerIndex + 1}</Text>
                                                        </View>
                                                        {/* Profile Photo */}
                                                        <WinnerAvatar 
                                                            userPhoto={winner.userPhoto} 
                                                            userName={winner.name || winner.userName || 'User'} 
                                                        />
                                                        <View style={styles.winnerInfo}>
                                                            <Text style={styles.winnerName} numberOfLines={1}>
                                                                {winner.name ? winner.name.split(' ')[0] : 'Unknown'}
                                                            </Text>
                                                            <Text style={styles.winnerScore}>
                                                                {winner.score || 0} pts
                                                            </Text>
                                                            {(winner.course || winner.year) && (
                                                                <Text style={styles.winnerDetails}>
                                                                    {winner.course} {winner.year}
                                                                </Text>
                                                            )}
                                                        </View>
                                                        <View style={styles.winnerPrizeContainer}>
                                                            <Text style={styles.winnerPrizeAmount}>
                                                                ₹{winner.prizeAmount || 0}
                                                            </Text>
                                                        </View>
                                                    </View>
                                            ))
                                        ) : (
                                            <View style={styles.noWinnersContainer}>
                                                <Text style={styles.noWinnersText}>No winners data available</Text>
                                                <Text style={styles.noWinnersText}>Check console for API response</Text>
                                            </View>
                                        )}
                                    </View>
                                </LinearGradient>
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.noDataContainer}>
                        <Ionicons name="trophy-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.noDataText}>No toppers this week yet</Text>
                        <Text style={styles.noDataSubtext}>Be the first! Give an exam and top the leaderboard.</Text>
                    </View>
                )}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 15,
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#047857',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
        borderWidth: 2,
        borderColor: 'rgba(4, 120, 87, 0.15)',
        backgroundColor: '#FFFFFF',
    },
    sectionBackground: {
        backgroundColor: '#FFFFFF',
        paddingTop: 0,
        paddingBottom: 20,
        position: 'relative',
        borderRadius: 24,
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        width: 100,
        opacity: 0.6,
    },
    sparkle: {
        position: 'absolute',
        zIndex: 1,
    },
    // sparkleText style removed



    headerGradient: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    },
    // Animation styles removed for better performance

    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        zIndex: 3,
    },
    headerIconContainer: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    headerLeadershipIcon: {
        width: 40,
        height: 40,
    },
    iconGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
        zIndex: 3,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.08)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        letterSpacing: 0.3,
        includeFontPadding: false,
        textAlignVertical: 'center',
        fontFamily: 'System',
        lineHeight: 20,
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.95)',
        fontWeight: '600',
        marginTop: 2,
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        includeFontPadding: false,
        fontFamily: 'System',
        lineHeight: 15,
    },
    viewAllButton: {
        borderRadius: 10,
        overflow: 'hidden',
        zIndex: 3,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    viewAllGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    viewAllText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
        marginRight: 3,
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        includeFontPadding: false,
        lineHeight: 15,
    },
    podiumItem: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 6,
    },
    performerCard: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        paddingHorizontal: 18,
        marginBottom: 15,
        width: 100,
        borderWidth: 3,
        borderColor: 'rgba(16, 185, 129, 0.4)',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    winnerCrown: {
        position: 'absolute',
        top: -15,
        left: '50%',
        marginLeft: -8,
        zIndex: 5,
    },
    crownEmoji: {
        fontSize: 16,
        textShadowColor: '#FFD700',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    winnerAura: {
        position: 'absolute',
        top: -20,
        left: -20,
        right: -20,
        bottom: -20,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        zIndex: -1,
    },

    avatar: {
        fontSize: 32,
    },
    rankBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    rankIcon: {
        fontSize: 16,
    },
    performerName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2D3748',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.8,
        textShadowColor: 'rgba(255, 215, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        includeFontPadding: false,
    },
    scoreContainer: {
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 17,
        fontWeight: '900',
        color: '#059669',
        textShadowColor: 'rgba(5, 150, 105, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 0.5,
    },
    scoreLabel: {
        fontSize: 11,
        color: '#4A5568',
        fontWeight: '700',
        letterSpacing: 0.4,
        textShadowColor: 'rgba(5, 150, 105, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    winnerGlow: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        borderRadius: 20,
        zIndex: 1,
    },
    otherPerformers: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: 'rgba(79, 70, 229, 0.2)',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    performerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(247, 147, 30, 0.2)',
    },
    performerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rankNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(79, 70, 229, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: 'rgba(79, 70, 229, 0.3)',
    },
    rankText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#4F46E5',
        textShadowColor: 'rgba(79, 70, 229, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    performerAvatar: {
        fontSize: 20,
        marginRight: 12,
    },
    performerInfo: {
        flex: 1,
    },
    performerRowName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 3,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(255, 107, 53, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        includeFontPadding: false,
    },
    levelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    levelDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    levelText: {
        fontSize: 12,
        color: '#4A5568',
        fontWeight: '700',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(5, 150, 105, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    performerRight: {
        alignItems: 'flex-end',
    },
    performerScore: {
        fontSize: 17,
        fontWeight: '900',
        color: '#059669',
        textShadowColor: 'rgba(5, 150, 105, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
        letterSpacing: 0.5,
    },
    examCount: {
        fontSize: 11,
        color: '#4A5568',
        fontWeight: '600',
        marginTop: 3,
        letterSpacing: 0.2,
        textShadowColor: 'rgba(5, 150, 105, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    // New styles for exam-wise toppers
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 12,
        fontWeight: '600',
    },
    examScrollView: {
        marginTop: 10,
    },
    examScrollContainer: {
        paddingHorizontal: 15,
        gap: 15,
    },
    examCard: {
        width: 280,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#047857',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 2,
        borderColor: 'rgba(4, 120, 87, 0.15)',
        backgroundColor: '#FFFFFF',
        marginVertical: 8,
    },
    examCardGradient: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
    },
    examHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    examIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(219, 39, 119, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(219, 39, 119, 0.2)',
    },
    examInfoContainer: {
        flex: 1,
    },
    examTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
        lineHeight: 20,
    },
    examDate: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    winnersContainer: {
        marginBottom: 16,
    },
    winnersSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    winnerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(4, 120, 87, 0.05)',
        borderRadius: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(4, 120, 87, 0.1)',
        justifyContent: 'space-between',
    },
    winnerRankContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#DB2777',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#DB2777',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    winnerRank: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    winnerInfo: {
        flex: 1,
        marginLeft: 8,
        marginRight: 8,
    },
    avatarContainer: {
        position: 'relative',
        width: 40,
        height: 40,
    },
    avatarLoadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        zIndex: 1,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    winnerAvatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        backgroundColor: '#F3F4F6',
    },
    winnerName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 1,
    },
    winnerScore: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },
    winnerDetails: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '400',
        marginTop: 1,
    },
    winnerPrizeContainer: {
        alignItems: 'flex-end',
    },
    winnerPrizeAmount: {
        fontSize: 13,
        fontWeight: '700',
        color: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(5, 150, 105, 0.2)',
    },
    noWinnersContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    noWinnersText: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    examStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 16,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(4, 120, 87, 0.1)',
        backgroundColor: 'rgba(4, 120, 87, 0.02)',
        borderRadius: 12,
        padding: 12,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#047857',
        marginBottom: 4,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(4, 120, 87, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#DB2777',
        fontWeight: '600',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    noDataContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    noDataText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
        marginTop: 12,
        textAlign: 'center',
    },
    noDataSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'center',
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        marginBottom: 30,
        paddingHorizontal: 15,
        marginTop: 10,
    },
    podium: {
        width: 100,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
        overflow: 'hidden',
    },
    podiumContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        paddingTop: 5,
    },
    podiumRank: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        zIndex: 2,
        textAlign: 'center',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
});

export default TopPerformersSection;

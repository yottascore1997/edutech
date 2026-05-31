import { Ionicons } from '@expo/vector-icons';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowRight, Trophy } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Platform,
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
                    colors={[...HomeTheme.heroCta]}
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
                    <ActivityIndicator size="small" color={HomeTheme.primary} />
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
    const router = useRouter();
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
                return ['#FBBF24', '#F59E0B'];
            case 2:
                return ['#CBD5E1', '#94A3B8'];
            case 3:
                return ['#FB923C', '#EA580C'];
            default:
                return ['#8E78E7', '#6344D4'];
        }
    };

    const getRankRowStyle = (rank: number) => {
        if (rank === 1) return styles.winnerItemGold;
        if (rank === 2) return styles.winnerItemSilver;
        if (rank === 3) return styles.winnerItemBronze;
        return null;
    };

    const handleViewAll = () => {
        if (onPress) {
            onPress();
            return;
        }
        router.push('/(tabs)/weekly-leaderboard' as any);
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
                colors={['#2D2068', '#4B32AF', '#6344D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.orb1} />
                <View style={styles.orb2} />

                <View style={styles.headerLeft}>
                    <LinearGradient colors={['#FBBF24', '#F59E0B']} style={styles.headerBadge}>
                        <Trophy size={12} color="#78350F" strokeWidth={2.4} />
                        <Text style={styles.headerBadgeText}>Weekly Toppers</Text>
                    </LinearGradient>
                    <Text style={styles.headerSubtitle}>This week&apos;s champions</Text>
                </View>

                <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll} activeOpacity={0.85}>
                    <Text style={styles.viewAllText}>View All</Text>
                    <ArrowRight size={14} color={HomeTheme.primary} strokeWidth={2.5} />
                </TouchableOpacity>
            </LinearGradient>

            <LinearGradient
                colors={['#FFFBF7', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sectionBackground}
            >










                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={HomeTheme.primary} />
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
                        {leaderboardData.leaderboard.map((exam) => (
                            <View key={exam.examId} style={styles.examCard}>
                                <View style={styles.examHeader}>
                                    <LinearGradient
                                        colors={[...HomeTheme.heroCta]}
                                        style={styles.examIconContainer}
                                    >
                                        <Ionicons name="book" size={18} color="#FFFFFF" />
                                    </LinearGradient>
                                    <View style={styles.examInfoContainer}>
                                        <Text style={styles.examTitle} numberOfLines={2}>
                                            {exam.examTitle}
                                        </Text>
                                        <View style={styles.examDateRow}>
                                            <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                                            <Text style={styles.examDate}>{formatDate(exam.examDate)}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.winnersContainer}>
                                    <View style={styles.winnersTitleRow}>
                                        <Trophy size={14} color={HomeTheme.primary} strokeWidth={2} />
                                        <Text style={styles.winnersSectionTitle}>Top 5 Winners</Text>
                                    </View>
                                    {exam.winners && exam.winners.length > 0 ? (
                                        exam.winners.slice(0, 5).map((winner, winnerIndex) => {
                                            const rank = winner.rank || winnerIndex + 1;
                                            const rankColors = getRankColors(rank);
                                            return (
                                                <View
                                                    key={winner.userId || winnerIndex}
                                                    style={[styles.winnerItem, getRankRowStyle(rank)]}
                                                >
                                                    <LinearGradient
                                                        colors={rankColors}
                                                        style={styles.winnerRankContainer}
                                                    >
                                                        <Text style={styles.winnerRank}>{rank}</Text>
                                                    </LinearGradient>
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
                                            );
                                        })
                                    ) : (
                                        <View style={styles.noWinnersContainer}>
                                            <Text style={styles.noWinnersText}>No winners yet for this exam</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.noDataContainer}>
                        <LinearGradient colors={[...HomeTheme.heroCta]} style={styles.noDataIconWrap}>
                            <Trophy size={28} color="#FFFFFF" strokeWidth={2} />
                        </LinearGradient>
                        <Text style={styles.noDataText}>No toppers this week yet</Text>
                        <Text style={styles.noDataSubtext}>
                            Be the first! Give an exam and top the leaderboard.
                        </Text>
                    </View>
                )}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#C4B5FD',
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            ios: {
                shadowColor: '#4B32AF',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 18,
            },
            android: { elevation: 7 },
        }),
    },
    sectionBackground: {
        paddingTop: 4,
        paddingBottom: 18,
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
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
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 16,
        overflow: 'hidden',
    },
    orb1: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.08)',
        top: -35,
        right: -15,
    },
    orb2: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.06)',
        bottom: -20,
        left: 20,
    },
    headerLeft: {
        flex: 1,
        zIndex: 2,
    },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    headerBadgeText: {
        fontSize: 11,
        fontFamily: FontFamily.semiBold,
        color: '#78350F',
        letterSpacing: 0.3,
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
        fontSize: 13,
        fontFamily: FontFamily.medium,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 8,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        zIndex: 2,
    },
    viewAllText: {
        fontSize: 12,
        fontFamily: FontFamily.semiBold,
        color: HomeTheme.primary,
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
        fontSize: 14,
        fontFamily: FontFamily.medium,
        color: '#6B7280',
        marginTop: 12,
    },
    examScrollView: {
        marginTop: 4,
    },
    examScrollContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    examCard: {
        width: 280,
        borderRadius: 16,
        padding: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9D5FF',
        marginVertical: 4,
        ...Platform.select({
            ios: {
                shadowColor: '#6344D4',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: { elevation: 3 },
        }),
    },
    examCardGradient: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
    },
    examHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    examIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    examInfoContainer: {
        flex: 1,
    },
    examTitle: {
        fontSize: 15,
        fontFamily: FontFamily.semiBold,
        color: '#1F2937',
        marginBottom: 4,
        lineHeight: 20,
    },
    examDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    examDate: {
        fontSize: 11,
        fontFamily: FontFamily.regular,
        color: '#9CA3AF',
    },
    winnersContainer: {
        marginBottom: 4,
    },
    winnersTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    winnersSectionTitle: {
        fontSize: 13,
        fontFamily: FontFamily.semiBold,
        color: HomeTheme.primary,
    },
    winnerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    winnerItemGold: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
    },
    winnerItemSilver: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
    },
    winnerItemBronze: {
        backgroundColor: '#FFF7ED',
        borderColor: '#FED7AA',
    },
    winnerRankContainer: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    winnerRank: {
        fontSize: 11,
        fontFamily: FontFamily.bold,
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
        borderColor: '#EDE9FE',
    },
    avatarGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        fontSize: 13,
        fontFamily: FontFamily.semiBold,
        color: '#FFFFFF',
    },
    winnerAvatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#EDE9FE',
        backgroundColor: '#F3F4F6',
    },
    winnerName: {
        fontSize: 13,
        fontFamily: FontFamily.semiBold,
        color: '#1F2937',
        marginBottom: 1,
    },
    winnerScore: {
        fontSize: 11,
        fontFamily: FontFamily.medium,
        color: '#6B7280',
    },
    winnerDetails: {
        fontSize: 10,
        fontFamily: FontFamily.regular,
        color: '#9CA3AF',
        marginTop: 1,
    },
    winnerPrizeContainer: {
        alignItems: 'flex-end',
    },
    winnerPrizeAmount: {
        fontSize: 12,
        fontFamily: FontFamily.bold,
        color: '#059669',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    noWinnersContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    noWinnersText: {
        fontSize: 12,
        fontFamily: FontFamily.regular,
        color: '#9CA3AF',
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
        paddingVertical: 36,
        paddingHorizontal: 20,
    },
    noDataIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noDataText: {
        fontSize: 15,
        fontFamily: FontFamily.semiBold,
        color: '#374151',
        marginTop: 14,
        textAlign: 'center',
    },
    noDataSubtext: {
        fontSize: 13,
        fontFamily: FontFamily.regular,
        color: '#9CA3AF',
        marginTop: 6,
        textAlign: 'center',
        lineHeight: 20,
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

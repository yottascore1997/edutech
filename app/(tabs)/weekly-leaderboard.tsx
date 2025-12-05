import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Winner {
  userId: string;
  userName: string;
  userPhoto: string | null;
  course: string | null;
  year: string | null;
  rank: number;
  score: number;
  winnings: number;
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

export default function WeeklyLeaderboardScreen() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<WeeklyLeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [podiumAnimation] = useState(new Animated.Value(0));

  const fetchLeaderboardData = async () => {
    try {
      if (!user?.token) return;
      
      const response = await apiFetchAuth('/student/weekly-leaderboard', user.token);
      
      if (response.ok) {
        setLeaderboardData(response.data);
      } else {
        console.error('Failed to fetch leaderboard data:', response.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
    
    // Animate podium on load
    Animated.timing(podiumAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboardData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrizeAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return { name: 'trophy', color: '#FFD700' };
      case 2:
        return { name: 'medal', color: '#C0C0C0' };
      case 3:
        return { name: 'ribbon', color: '#CD7F32' };
      default:
        return { name: 'star', color: '#8B5CF6' };
    }
  };

  const getAchievementBadge = (score: number, rank: number) => {
    if (rank === 1) return { name: 'crown', color: '#FFD700', text: 'Champion' };
    if (rank <= 3) return { name: 'medal', color: '#C0C0C0', text: 'Top 3' };
    if (score >= 90) return { name: 'star', color: '#4CAF50', text: 'Excellent' };
    if (score >= 80) return { name: 'checkmark-circle', color: '#2196F3', text: 'Good' };
    if (score >= 70) return { name: 'thumbs-up', color: '#FF9800', text: 'Average' };
    return { name: 'trophy-outline', color: '#9E9E9E', text: 'Participant' };
  };

  const getStreakInfo = (userId: string) => {
    // Generate streak data based on user's performance
    const user = leaderboardData?.leaderboard
      .flatMap(exam => exam.winners)
      .find(winner => winner.userId === userId);
    
    if (!user) return { current: 1, longest: 1 };
    
    // Calculate streak based on score and rank
    const baseStreak = Math.min(Math.floor(user.score / 10), 10);
    const rankBonus = user.rank <= 3 ? 3 : user.rank <= 10 ? 2 : 1;
    
    return { 
      current: baseStreak + rankBonus, 
      longest: baseStreak + rankBonus + 2 
    };
  };

  const getUserLevel = (userId: string) => {
    // Generate user level based on existing data
    const user = leaderboardData?.leaderboard
      .flatMap(exam => exam.winners)
      .find(winner => winner.userId === userId);
    
    if (!user) return 1;
    
    // Calculate level based on score and winnings
    const scoreLevel = Math.floor(user.score / 20);
    const winningsLevel = Math.floor(user.winnings / 100);
    const rankLevel = user.rank <= 3 ? 5 : user.rank <= 10 ? 3 : 1;
    
    return Math.min(scoreLevel + winningsLevel + rankLevel, 25);
  };

  const getUserAchievements = (userId: string) => {
    // Generate achievements based on existing data
    const user = leaderboardData?.leaderboard
      .flatMap(exam => exam.winners)
      .find(winner => winner.userId === userId);
    
    if (!user) return [];
    
    const achievements = [];
    
    // Score-based achievements
    if (user.score >= 90) achievements.push('perfect_score');
    if (user.score >= 80) achievements.push('excellent_performance');
    if (user.score >= 70) achievements.push('good_performance');
    
    // Rank-based achievements
    if (user.rank === 1) achievements.push('first_place');
    if (user.rank <= 3) achievements.push('top_three');
    if (user.rank <= 10) achievements.push('top_ten');
    
    // Winnings-based achievements
    if (user.winnings >= 500) achievements.push('high_earner');
    if (user.winnings >= 100) achievements.push('earner');
    
    return achievements;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading Weekly Leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* Week Info Card */}
        {leaderboardData && (
          <View style={styles.weekInfoCard}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5', '#4338CA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.weekInfoGradient}
            >
              <View style={styles.weekInfoContent}>
                <View style={styles.weekInfoLeft}>
                  <View style={styles.weekIconContainer}>
                    <Ionicons name="calendar" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.weekTextContainer}>
                    <Text style={styles.weekTitle}>Current Week</Text>
                    <Text style={styles.weekDates}>
                      {formatDate(leaderboardData.weekStart)} - {formatDate(leaderboardData.weekEnd)}
                    </Text>
                  </View>
                </View>
                <View style={styles.weekStatsContainer}>
                  <View style={styles.weekStatItem}>
                    <Text style={styles.weekStatValue}>{leaderboardData.totalExams}</Text>
                    <Text style={styles.weekStatLabel}>Exams</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Mega Exam Winner Section */}
        <View style={styles.megaExamSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mega Exam Winner</Text>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterText}>Filter</Text>
              <Ionicons name="menu" size={16} color="#1E40AF" />
            </TouchableOpacity>
          </View>
          
          {/* Exam Card - Show only if we have real data */}
          {leaderboardData?.leaderboard[0] && (
            <View style={styles.examCard}>
              <View style={styles.examCardTop}>
                <Text style={styles.examDay}>Today</Text>
                <View style={styles.examInfo}>
                  <View style={styles.examLogo}>
                    <Text style={styles.examLogoText}>{leaderboardData.leaderboard[0].examTitle?.substring(0, 3).toUpperCase() || 'EXAM'}</Text>
                  </View>
                  <Text style={styles.examTitle}>{leaderboardData.leaderboard[0].examTitle || 'Weekly Exam'}</Text>
                </View>
                <Text style={styles.examDate}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Text>
              </View>
            <View style={styles.examCardBottom}>
              <View style={styles.winningInfo}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
                <Text style={styles.winningText}>Total Winning {formatPrizeAmount(leaderboardData.leaderboard[0].prizePool)}</Text>
              </View>
            </View>
            </View>
          )}
          
          {/* Top 5 Winners - Horizontal Scrollable */}
          {leaderboardData?.leaderboard[0]?.winners && leaderboardData.leaderboard[0].winners.length > 0 ? (
            <View style={styles.topWinnersContainer}>
              <Text style={styles.topWinnersTitle}>Top 5 Winners</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.winnerCardsScroll}
                contentContainerStyle={styles.winnerCardsContainer}
              >
                {leaderboardData.leaderboard[0].winners.slice(0, 5).map((winner, index) => (
                  <View key={winner.userId} style={[
                    styles.winnerCard,
                    winner.rank === 1 && styles.firstPlaceCard,
                    winner.rank === 2 && styles.secondPlaceCard,
                    winner.rank === 3 && styles.thirdPlaceCard,
                    winner.rank === 4 && styles.fourthPlaceCard,
                    winner.rank === 5 && styles.fifthPlaceCard,
                  ]}>
                    <Text style={[
                      styles.rankText,
                      winner.rank === 1 && styles.firstPlaceRankText,
                      winner.rank === 2 && styles.secondPlaceRankText,
                      winner.rank === 3 && styles.thirdPlaceRankText,
                      winner.rank === 4 && styles.fourthPlaceRankText,
                      winner.rank === 5 && styles.fifthPlaceRankText,
                    ]}>Rank #{winner.rank}</Text>
                    <View style={styles.winnerAvatar}>
                      {winner.userPhoto ? (
                        <Image source={{ uri: winner.userPhoto }} style={styles.winnerImage} />
                      ) : (
                        <Ionicons name="person-circle" size={60} color="#E5E7EB" />
                      )}
                    </View>
                    <Text style={styles.winnerName}>{winner.userName}</Text>
                    <Text style={styles.winnerPrize}>Won ₹{formatPrizeAmount(winner.winnings)}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.noWinnersContainer}>
              <Ionicons name="trophy-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noWinnersText}>No winners yet</Text>
              <Text style={styles.noWinnersSubtext}>Be the first to participate!</Text>
            </View>
          )}
        </View>

        {/* Leaderboard List */}
        {leaderboardData?.leaderboard.map((exam, index) => (
          <View key={exam.examId} style={styles.leaderboardCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.leaderboardGradient}
            >
              <View style={styles.leaderboardHeader}>
                <View style={styles.leaderboardHeaderLeft}>
                  <View style={styles.examIconContainer}>
                    <Ionicons name="school" size={20} color="#8B5CF6" />
                  </View>
                  <View style={styles.leaderboardTitleContainer}>
                    <Text style={styles.leaderboardTitle}>{exam.examTitle}</Text>
                    <Text style={styles.leaderboardDate}>{formatDate(exam.examDate)}</Text>
                  </View>
                </View>
                <View style={styles.examStatsRow}>
                  <View style={styles.examStatBlock}>
                    <Text style={styles.examStatValue}>{exam.totalParticipants}</Text>
                    <Text style={styles.examStatLabel}>Participants</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.examStatBlock}>
                    <Text style={styles.prizeAmount}>{formatPrizeAmount(exam.prizePool)}</Text>
                    <Text style={styles.examStatLabel}>Prize Pool</Text>
                  </View>
                </View>
              </View>
              
              {exam.winners.length > 0 ? (
                <View style={styles.examWinnersContainer}>
                  <Text style={styles.examWinnersTitle}>Winners</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.examWinnerCardsScroll}
                    contentContainerStyle={styles.examWinnerCardsContainer}
                  >
                    {exam.winners.slice(0, 5).map((winner, winnerIndex) => (
                      <View key={winner.userId} style={[
                        styles.winnerCard,
                        winner.rank === 1 && styles.firstPlaceCard,
                        winner.rank === 2 && styles.secondPlaceCard,
                        winner.rank === 3 && styles.thirdPlaceCard,
                        winner.rank === 4 && styles.fourthPlaceCard,
                        winner.rank === 5 && styles.fifthPlaceCard,
                      ]}>
                        <Text style={[
                          styles.rankText,
                          winner.rank === 1 && styles.firstPlaceRankText,
                          winner.rank === 2 && styles.secondPlaceRankText,
                          winner.rank === 3 && styles.thirdPlaceRankText,
                          winner.rank === 4 && styles.fourthPlaceRankText,
                          winner.rank === 5 && styles.fifthPlaceRankText,
                        ]}>Rank #{winner.rank}</Text>
                        <View style={styles.winnerAvatar}>
                          {winner.userPhoto ? (
                            <Image source={{ uri: winner.userPhoto }} style={styles.winnerImage} />
                          ) : (
                            <Ionicons name="person-circle" size={60} color="#E5E7EB" />
                          )}
                        </View>
                        <Text style={styles.winnerName}>{winner.userName}</Text>
                        <Text style={styles.winnerPrize}>Won ₹{formatPrizeAmount(winner.winnings)}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.noWinnersSection}>
                  <View style={styles.noWinnersIconContainer}>
                    <Ionicons name="people-outline" size={48} color="#8B5CF6" />
                  </View>
                  <Text style={styles.noWinnersText}>No participants yet</Text>
                  <Text style={styles.noWinnersSubtext}>
                    Be the first to attempt this exam!
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        ))}

        {/* Empty State */}
        {leaderboardData?.leaderboard.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyStateTitle}>No Exams This Week</Text>
            <Text style={styles.emptyStateSubtext}>
              Check back later for weekly competitions!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Mega Exam Section Styles
  megaExamSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.3,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  // Exam Card Styles
  examCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  examCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  examDay: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  examInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },
  examLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  examLogoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  examDate: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  examCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  winningInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  winningText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '700',
  },
  viewResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  viewResultsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Bottom View Results Button
  viewResultsButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginHorizontal: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  viewResultsTextBottom: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Contest Title Styles
  contestTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FB923C',
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EA580C',
    letterSpacing: 0.3,
  },
  // Top Winners Container
  topWinnersContainer: {
    marginBottom: 16,
  },
  topWinnersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  // Exam Winners Container (for all exams in leaderboard list)
  examWinnersContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  examWinnersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  examWinnerCardsScroll: {
    marginBottom: 16,
  },
  examWinnerCardsContainer: {
    paddingRight: 16,
    paddingLeft: 4,
  },
  // Winner Cards Styles
  winnerCardsScroll: {
    marginBottom: 20,
  },
  winnerCardsContainer: {
    paddingRight: 20,
    paddingLeft: 4,
  },
  winnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 150,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 12,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  winnerAvatar: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  winnerImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  winnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  winnerPrize: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  // Rank-specific Card Backgrounds
  firstPlaceCard: {
    backgroundColor: '#FFF7ED', // Beautiful light orange background for Rank 1
    borderWidth: 1,
    borderColor: '#FB923C',
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  secondPlaceCard: {
    backgroundColor: '#F8FAFC', // Clean light gray background for Rank 2
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#CBD5E1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  thirdPlaceCard: {
    backgroundColor: '#FEF3C7', // Warm light yellow background for Rank 3
    borderWidth: 1,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  fourthPlaceCard: {
    backgroundColor: '#EEF2FF', // Soft light blue background for Rank 4
    borderWidth: 1,
    borderColor: '#A5B4FC',
    shadowColor: '#A5B4FC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  fifthPlaceCard: {
    backgroundColor: '#F0FDF4', // Fresh light green background for Rank 5
    borderWidth: 1,
    borderColor: '#86EFAC',
    shadowColor: '#86EFAC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  // Rank-specific Text Colors
  firstPlaceRankText: {
    color: '#EA580C',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FB923C',
  },
  secondPlaceRankText: {
    color: '#475569',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  thirdPlaceRankText: {
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  fourthPlaceRankText: {
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#A5B4FC',
  },
  fifthPlaceRankText: {
    color: '#059669',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  loadingText: {
    fontSize: 18,
    color: '#8B5CF6',
    marginTop: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  weekInfoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  weekInfoGradient: {
    padding: 20,
  },
  weekInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weekIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  weekTextContainer: {
    flex: 1,
  },
  weekStatsContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  weekStatItem: {
    alignItems: 'center',
  },
  noWinnersSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  noWinnersIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    backgroundColor: 'rgba(139, 92, 246, 0.02)',
    borderRadius: 20,
    marginTop: 20,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  weekDates: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  weekStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  weekStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '600',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyStateSubtext: {
    fontSize: 18,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Top Performers Section
  topPerformersSection: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  topPerformersGradient: {
    padding: 24,
  },
  championsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  topPerformersTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  prizePoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  prizePoolText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 4,
  },
  // Podium Styles
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  podiumCard: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  podium: {
    width: 70,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  firstPodium: {
    height: 100,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  secondPodium: {
    height: 80,
    backgroundColor: 'rgba(192, 192, 192, 0.9)',
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  thirdPodium: {
    height: 70,
    backgroundColor: 'rgba(205, 127, 50, 0.9)',
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  podiumNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  podiumContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  podiumAvatar: {
    marginBottom: 12,
    position: 'relative',
  },
  podiumImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  achievementBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  championBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderColor: '#FFD700',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  streakText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginLeft: 4,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumScore: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 4,
  },
  podiumPrize: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  // Leaderboard Card
  leaderboardCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  leaderboardGradient: {
    padding: 0,
  },
  leaderboardHeader: {
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
  },
  leaderboardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  examIconContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
  },
  leaderboardTitleContainer: {
    flex: 1,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  leaderboardDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  examStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  examStatBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  examStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
    textShadowColor: 'rgba(139, 92, 246, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  examStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '600',
  },
  prizeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    textShadowColor: 'rgba(16, 185, 129, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  leaderboardList: {
    padding: 20,
  },
  winnerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  winnerRankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  firstPlaceBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    shadowColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  secondPlaceBadge: {
    backgroundColor: 'rgba(192, 192, 192, 0.9)',
    shadowColor: '#C0C0C0',
    borderWidth: 2,
    borderColor: '#A0A0A0',
  },
  thirdPlaceBadge: {
    backgroundColor: 'rgba(205, 127, 50, 0.9)',
    shadowColor: '#CD7F32',
    borderWidth: 2,
    borderColor: '#B8860B',
  },
  winnerProfileContainer: {
    marginRight: 16,
  },
  winnerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  winnerInfo: {
    flex: 1,
  },
  winnerNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  winnerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  winnerDetailText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  winnerRight: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  winnerRankText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  winnerScore: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  // No Winners Styles
  noWinnersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noWinnersText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  noWinnersSubtext: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
});


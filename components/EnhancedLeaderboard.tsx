import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface LeaderboardUser {
  id: string;
  name: string;
  score: number;
  rank: number;
  avatar?: string;
  streak: number;
  level: number;
  achievements: string[];
  isCurrentUser?: boolean;
}

// Helper function to convert existing winner data to LeaderboardUser format
export const convertWinnerToLeaderboardUser = (winner: any, rank: number): LeaderboardUser => {
  // Generate level based on score and rank
  const scoreLevel = Math.floor(winner.score / 20);
  const rankLevel = rank <= 3 ? 5 : rank <= 10 ? 3 : 1;
  const level = Math.min(scoreLevel + rankLevel, 25);
  
  // Generate streak based on score and rank
  const baseStreak = Math.min(Math.floor(winner.score / 10), 10);
  const rankBonus = rank <= 3 ? 3 : rank <= 10 ? 2 : 1;
  const streak = baseStreak + rankBonus;
  
  // Generate achievements based on performance
  const achievements = [];
  if (winner.score >= 90) achievements.push('perfect_score');
  if (winner.score >= 80) achievements.push('excellent_performance');
  if (rank === 1) achievements.push('first_place');
  if (rank <= 3) achievements.push('top_three');
  if (rank <= 10) achievements.push('top_ten');
  if (winner.winnings >= 500) achievements.push('high_earner');
  
  return {
    id: winner.userId,
    name: winner.userName,
    score: winner.score,
    rank: rank,
    avatar: winner.userPhoto,
    streak: streak,
    level: level,
    achievements: achievements,
    isCurrentUser: false // This would be set based on current user ID
  };
};

interface EnhancedLeaderboardProps {
  users: LeaderboardUser[];
  onUserPress?: (user: LeaderboardUser) => void;
  onChallengePress?: (user: LeaderboardUser) => void;
}

export default function EnhancedLeaderboard({ 
  users, 
  onUserPress, 
  onChallengePress 
}: EnhancedLeaderboardProps) {
  const [selectedTab, setSelectedTab] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [podiumAnimation] = useState(new Animated.Value(0));
  const [listAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate podium
    Animated.timing(podiumAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Animate list with delay
    setTimeout(() => {
      Animated.timing(listAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 400);
  }, []);

  const getLevelColor = (level: number) => {
    // Dynamic level colors based on user's actual level
    if (level >= 20) return '#FFD700'; // Gold
    if (level >= 15) return '#C0C0C0'; // Silver
    if (level >= 10) return '#CD7F32'; // Bronze
    if (level >= 5) return '#4CAF50'; // Green
    return '#9E9E9E'; // Gray
  };

  const getAchievementIcon = (achievement: string) => {
    // Dynamic achievement icons based on user's actual achievements
    const achievementIcons: { [key: string]: string } = {
      'first_place': 'trophy',
      'streak_master': 'flame',
      'perfect_score': 'star',
      'speed_demon': 'flash',
      'consistent': 'checkmark-circle',
      'top_performer': 'medal',
      'exam_champion': 'crown',
      'quick_learner': 'rocket',
      'dedicated': 'heart',
      'scholar': 'book'
    };
    return achievementIcons[achievement] || 'medal';
  };

  const topThree = users.slice(0, 3);
  const others = users.slice(3);

  return (
    <View style={styles.container}>
      {/* Header with Tabs */}
      <LinearGradient
        colors={['#9C27B0', '#673AB7', '#3F51B5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="trophy" size={28} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Enhanced Leaderboard</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{users.length}</Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
          </View>
        </View>

        {/* Time Period Tabs */}
        <View style={styles.tabContainer}>
          {(['weekly', 'monthly', 'alltime'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                selectedTab === tab && styles.activeTab
              ]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText
              ]}>
                {tab === 'weekly' ? 'Weekly' : tab === 'monthly' ? 'Monthly' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Enhanced Podium */}
        <Animated.View 
          style={[
            styles.podiumSection,
            {
              opacity: podiumAnimation,
              transform: [{
                translateY: podiumAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              }]
            }
          ]}
        >
          <LinearGradient
            colors={['#FF6B35', '#F7931E', '#FFD23F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.podiumGradient}
          >
            <Text style={styles.podiumTitle}>🏆 Champions</Text>
            
            <View style={styles.podiumContainer}>
              {/* 2nd Place */}
              {topThree[1] && (
                <Animated.View 
                  style={[
                    styles.podiumCard,
                    styles.secondPlace,
                    {
                      transform: [{
                        scale: podiumAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <View style={styles.podiumBase}>
                    <Text style={styles.podiumRank}>2</Text>
                  </View>
                  <View style={styles.podiumContent}>
                     <View style={styles.avatarContainer}>
                       {topThree[1].avatar ? (
                         <Image 
                           source={{ uri: topThree[1].avatar }} 
                           style={styles.avatar}
                         />
                       ) : (
                         <View style={[styles.avatar, styles.defaultAvatar]}>
                           <Ionicons name="person" size={30} color="#9CA3AF" />
                         </View>
                       )}
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>Lv.{topThree[1].level}</Text>
                      </View>
                    </View>
                    <Text style={styles.userName}>{topThree[1].name}</Text>
                    <Text style={styles.userScore}>{topThree[1].score} pts</Text>
                    <View style={styles.streakBadge}>
                      <Ionicons name="flame" size={12} color="#FF6B35" />
                      <Text style={styles.streakText}>{topThree[1].streak}</Text>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <Animated.View 
                  style={[
                    styles.podiumCard,
                    styles.firstPlace,
                    {
                      transform: [{
                        scale: podiumAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <View style={[styles.podiumBase, styles.firstPodiumBase]}>
                    <Ionicons name="trophy" size={24} color="#FFD700" />
                  </View>
                  <View style={styles.podiumContent}>
                     <View style={styles.avatarContainer}>
                       {topThree[0].avatar ? (
                         <Image 
                           source={{ uri: topThree[0].avatar }} 
                           style={[styles.avatar, styles.championAvatar]}
                         />
                       ) : (
                         <View style={[styles.avatar, styles.championAvatar, styles.defaultAvatar]}>
                           <Ionicons name="person" size={35} color="#9CA3AF" />
                         </View>
                       )}
                      <View style={[styles.levelBadge, styles.championLevelBadge]}>
                        <Text style={styles.levelText}>Lv.{topThree[0].level}</Text>
                      </View>
                      <View style={styles.crownBadge}>
                        <Ionicons name="crown" size={16} color="#FFD700" />
                      </View>
                    </View>
                    <Text style={styles.userName}>{topThree[0].name}</Text>
                    <Text style={styles.userScore}>{topThree[0].score} pts</Text>
                    <View style={styles.streakBadge}>
                      <Ionicons name="flame" size={12} color="#FF6B35" />
                      <Text style={styles.streakText}>{topThree[0].streak}</Text>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <Animated.View 
                  style={[
                    styles.podiumCard,
                    styles.thirdPlace,
                    {
                      transform: [{
                        scale: podiumAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <View style={styles.podiumBase}>
                    <Text style={styles.podiumRank}>3</Text>
                  </View>
                  <View style={styles.podiumContent}>
                     <View style={styles.avatarContainer}>
                       {topThree[2].avatar ? (
                         <Image 
                           source={{ uri: topThree[2].avatar }} 
                           style={styles.avatar}
                         />
                       ) : (
                         <View style={[styles.avatar, styles.defaultAvatar]}>
                           <Ionicons name="person" size={30} color="#9CA3AF" />
                         </View>
                       )}
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>Lv.{topThree[2].level}</Text>
                      </View>
                    </View>
                    <Text style={styles.userName}>{topThree[2].name}</Text>
                    <Text style={styles.userScore}>{topThree[2].score} pts</Text>
                    <View style={styles.streakBadge}>
                      <Ionicons name="flame" size={12} color="#FF6B35" />
                      <Text style={styles.streakText}>{topThree[2].streak}</Text>
                    </View>
                  </View>
                </Animated.View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Enhanced List */}
        <Animated.View 
          style={[
            styles.listSection,
            {
              opacity: listAnimation,
              transform: [{
                translateY: listAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }]
            }
          ]}
        >
          <Text style={styles.listTitle}>All Participants</Text>
          
          {others.map((user, index) => (
            <TouchableOpacity
              key={user.id}
              style={[
                styles.userCard,
                user.isCurrentUser && styles.currentUserCard
              ]}
              onPress={() => onUserPress?.(user)}
            >
              <View style={styles.userLeft}>
                <View style={styles.rankContainer}>
                  <Text style={styles.rankText}>#{user.rank}</Text>
                </View>
                
                 <View style={styles.avatarContainer}>
                   {user.avatar ? (
                     <Image 
                       source={{ uri: user.avatar }} 
                       style={styles.listAvatar}
                     />
                   ) : (
                     <View style={[styles.listAvatar, styles.defaultAvatar]}>
                       <Ionicons name="person" size={25} color="#9CA3AF" />
                     </View>
                   )}
                  <View style={[styles.levelBadge, { backgroundColor: getLevelColor(user.level) }]}>
                    <Text style={styles.levelText}>Lv.{user.level}</Text>
                  </View>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.listUserName}>{user.name}</Text>
                  <View style={styles.userStats}>
                    <View style={styles.streakBadge}>
                      <Ionicons name="flame" size={10} color="#FF6B35" />
                      <Text style={styles.streakText}>{user.streak}</Text>
                    </View>
                    <Text style={styles.listUserScore}>{user.score} pts</Text>
                  </View>
                </View>
              </View>

              <View style={styles.userRight}>
                <View style={styles.achievementsContainer}>
                  {user.achievements.slice(0, 3).map((achievement, idx) => (
                    <View key={idx} style={styles.achievementIcon}>
                      <Ionicons 
                        name={getAchievementIcon(achievement) as any} 
                        size={12} 
                        color="#FFD700" 
                      />
                    </View>
                  ))}
                </View>
                
                <TouchableOpacity
                  style={styles.challengeButton}
                  onPress={() => onChallengePress?.(user)}
                >
                  <Ionicons name="flash" size={16} color="#9C27B0" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  activeTabText: {
    color: '#9C27B0',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  podiumSection: {
    margin: 16,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  podiumGradient: {
    padding: 24,
  },
  podiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  podiumCard: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  firstPlace: {
    transform: [{ translateY: -20 }],
    zIndex: 2,
  },
  secondPlace: {
    transform: [{ translateY: -10 }],
  },
  thirdPlace: {
    transform: [{ translateY: -5 }],
  },
  podiumBase: {
    width: 60,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  firstPodiumBase: {
    height: 100,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
  },
  podiumRank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  podiumContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    backdropFilter: 'blur(10px)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  championAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderColor: '#FFD700',
    borderWidth: 4,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  championLevelBadge: {
    backgroundColor: '#FFD700',
  },
  crownBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  userScore: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  streakText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginLeft: 4,
  },
  listSection: {
    padding: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  currentUserCard: {
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderColor: '#9C27B0',
    borderWidth: 2,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  listAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  listUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listUserScore: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  userRight: {
    alignItems: 'center',
    gap: 8,
  },
  achievementsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  achievementIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  challengeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.3)',
  },
  defaultAvatar: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

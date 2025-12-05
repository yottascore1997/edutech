import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'exam' | 'streak' | 'score' | 'time';
  target: number;
  current: number;
  reward: number;
  timeLimit: number; // in hours
  isActive: boolean;
  participants: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

interface Competition {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  prizePool: number;
  participants: number;
  timeRemaining: number; // in hours
  isActive: boolean;
  leaderboard: Array<{
    rank: number;
    name: string;
    score: number;
    avatar?: string;
  }>;
}

interface CompetitionSystemProps {
  challenges: Challenge[];
  competitions: Competition[];
  onChallengeJoin?: (challenge: Challenge) => void;
  onCompetitionJoin?: (competition: Competition) => void;
  onViewLeaderboard?: (competition: Competition) => void;
}

// Helper function to generate challenges based on existing exam data
export const generateChallengesFromExamData = (examData: any[]): Challenge[] => {
  const challenges: Challenge[] = [];
  
  examData.forEach((exam, index) => {
    // Daily Challenge
    challenges.push({
      id: `daily_${exam.examId}`,
      title: `Daily ${exam.examTitle} Challenge`,
      description: `Complete ${exam.examTitle} exam and score 70+ marks`,
      type: 'exam',
      target: 70,
      current: 0,
      reward: 50,
      timeLimit: 24,
      isActive: true,
      participants: Math.floor(Math.random() * 100) + 20,
      difficulty: 'medium'
    });
    
    // Score Challenge
    challenges.push({
      id: `score_${exam.examId}`,
      title: `High Score Challenge`,
      description: `Score 85+ marks in ${exam.examTitle}`,
      type: 'score',
      target: 85,
      current: 0,
      reward: 100,
      timeLimit: 48,
      isActive: true,
      participants: Math.floor(Math.random() * 50) + 10,
      difficulty: 'hard'
    });
  });
  
  return challenges;
};

// Helper function to generate competitions based on existing leaderboard data
export const generateCompetitionsFromLeaderboardData = (leaderboardData: any): Competition[] => {
  const competitions: Competition[] = [];
  
  // Weekly Competition
  competitions.push({
    id: 'weekly_competition',
    title: 'Weekly Championship',
    description: 'Compete for the top spot this week',
    type: 'weekly',
    prizePool: 1000,
    participants: 150,
    timeRemaining: 72,
    isActive: true,
    leaderboard: leaderboardData?.leaderboard[0]?.winners?.slice(0, 3).map((winner: any, index: number) => ({
      rank: index + 1,
      name: winner.userName,
      score: winner.score,
      avatar: winner.userPhoto
    })) || []
  });
  
  return competitions;
};

export default function CompetitionSystem({ 
  challenges, 
  competitions,
  onChallengeJoin,
  onCompetitionJoin,
  onViewLeaderboard
}: CompetitionSystemProps) {
  const [selectedTab, setSelectedTab] = useState<'challenges' | 'competitions'>('challenges');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [animationValue] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    // Dynamic difficulty colors based on challenge data
    const difficultyColors: { [key: string]: string } = {
      'easy': '#4CAF50',
      'medium': '#FF9800',
      'hard': '#F44336',
      'expert': '#9C27B0',
      'master': '#673AB7',
      'legendary': '#FFD700'
    };
    return difficultyColors[difficulty] || '#9E9E9E';
  };

  const getTypeIcon = (type: string) => {
    // Dynamic type icons based on challenge/competition data
    const typeIcons: { [key: string]: string } = {
      'exam': 'school',
      'streak': 'flame',
      'score': 'star',
      'time': 'time',
      'daily': 'calendar',
      'weekly': 'calendar-outline',
      'monthly': 'calendar-number',
      'special': 'diamond',
      'tournament': 'trophy',
      'challenge': 'flash',
      'contest': 'medal'
    };
    return typeIcons[type] || 'trophy';
  };

  const formatTimeRemaining = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const ChallengeCard = ({ challenge }: { challenge: Challenge }) => (
    <Animated.View
      style={[
        styles.challengeCard,
        {
          opacity: animationValue,
          transform: [{
            translateY: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }]
        }
      ]}
    >
      <LinearGradient
        colors={challenge.isActive 
          ? ['#FFFFFF', '#F8FAFC'] 
          : ['#F3F4F6', '#E5E7EB']
        }
        style={styles.challengeGradient}
      >
        <View style={styles.challengeHeader}>
          <View style={styles.challengeLeft}>
            <View style={[
              styles.typeIcon,
              { backgroundColor: challenge.isActive ? '#8B5CF6' : '#D1D5DB' }
            ]}>
              <Ionicons 
                name={getTypeIcon(challenge.type) as any} 
                size={20} 
                color={challenge.isActive ? '#FFFFFF' : '#9CA3AF'} 
              />
            </View>
            <View style={styles.challengeInfo}>
              <Text style={[
                styles.challengeTitle,
                !challenge.isActive && styles.inactiveText
              ]}>
                {challenge.title}
              </Text>
              <Text style={[
                styles.challengeDescription,
                !challenge.isActive && styles.inactiveText
              ]}>
                {challenge.description}
              </Text>
            </View>
          </View>
          
          <View style={styles.challengeRight}>
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(challenge.difficulty) }
            ]}>
              <Text style={styles.difficultyText}>{challenge.difficulty.toUpperCase()}</Text>
            </View>
            <Text style={[
              styles.rewardText,
              !challenge.isActive && styles.inactiveText
            ]}>
              {challenge.reward} pts
            </Text>
          </View>
        </View>

        <View style={styles.challengeProgress}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Progress: {challenge.current}/{challenge.target}
            </Text>
            <Text style={styles.timeText}>
              {formatTimeRemaining(challenge.timeLimit)} left
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${(challenge.current / challenge.target) * 100}%`,
                  backgroundColor: challenge.isActive ? '#8B5CF6' : '#D1D5DB'
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.challengeFooter}>
          <View style={styles.participantsInfo}>
            <Ionicons name="people" size={16} color="#6B7280" />
            <Text style={styles.participantsText}>{challenge.participants} participants</Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.joinButton,
              !challenge.isActive && styles.disabledButton
            ]}
            onPress={() => challenge.isActive && onChallengeJoin?.(challenge)}
            disabled={!challenge.isActive}
          >
            <Text style={[
              styles.joinButtonText,
              !challenge.isActive && styles.disabledButtonText
            ]}>
              {challenge.isActive ? 'Join Challenge' : 'Completed'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const CompetitionCard = ({ competition }: { competition: Competition }) => (
    <Animated.View
      style={[
        styles.competitionCard,
        {
          opacity: animationValue,
          transform: [{
            translateY: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }]
        }
      ]}
    >
      <LinearGradient
        colors={competition.isActive 
          ? ['#FF6B35', '#F7931E', '#FFD23F'] 
          : ['#F3F4F6', '#E5E7EB']
        }
        style={styles.competitionGradient}
      >
        <View style={styles.competitionHeader}>
          <View style={styles.competitionLeft}>
            <View style={[
              styles.typeIcon,
              { backgroundColor: competition.isActive ? 'rgba(255,255,255,0.2)' : '#D1D5DB' }
            ]}>
              <Ionicons 
                name={getTypeIcon(competition.type) as any} 
                size={20} 
                color={competition.isActive ? '#FFFFFF' : '#9CA3AF'} 
              />
            </View>
            <View style={styles.competitionInfo}>
              <Text style={[
                styles.competitionTitle,
                !competition.isActive && styles.inactiveText
              ]}>
                {competition.title}
              </Text>
              <Text style={[
                styles.competitionDescription,
                !competition.isActive && styles.inactiveText
              ]}>
                {competition.description}
              </Text>
            </View>
          </View>
          
          <View style={styles.competitionRight}>
            <Text style={[
              styles.prizeText,
              !competition.isActive && styles.inactiveText
            ]}>
              ₹{competition.prizePool.toLocaleString()}
            </Text>
            <Text style={[
              styles.timeText,
              !competition.isActive && styles.inactiveText
            ]}>
              {formatTimeRemaining(competition.timeRemaining)} left
            </Text>
          </View>
        </View>

        <View style={styles.leaderboardPreview}>
          <Text style={[
            styles.leaderboardTitle,
            !competition.isActive && styles.inactiveText
          ]}>
            Top 3
          </Text>
          <View style={styles.leaderboardRow}>
            {competition.leaderboard.slice(0, 3).map((player, index) => (
              <View key={index} style={styles.leaderboardItem}>
                <View style={styles.rankBadge}>
                  <Text style={[
                    styles.rankText,
                    !competition.isActive && styles.inactiveText
                  ]}>
                    #{player.rank}
                  </Text>
                </View>
                <Text style={[
                  styles.playerName,
                  !competition.isActive && styles.inactiveText
                ]}>
                  {player.name}
                </Text>
                <Text style={[
                  styles.playerScore,
                  !competition.isActive && styles.inactiveText
                ]}>
                  {player.score}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.competitionFooter}>
          <View style={styles.participantsInfo}>
            <Ionicons name="people" size={16} color={competition.isActive ? '#FFFFFF' : '#6B7280'} />
            <Text style={[
              styles.participantsText,
              !competition.isActive && styles.inactiveText
            ]}>
              {competition.participants} participants
            </Text>
          </View>
          
          <View style={styles.competitionButtons}>
            <TouchableOpacity
              style={styles.leaderboardButton}
              onPress={() => onViewLeaderboard?.(competition)}
            >
              <Text style={styles.leaderboardButtonText}>Leaderboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.joinButton,
                !competition.isActive && styles.disabledButton
              ]}
              onPress={() => competition.isActive && onCompetitionJoin?.(competition)}
              disabled={!competition.isActive}
            >
              <Text style={[
                styles.joinButtonText,
                !competition.isActive && styles.disabledButtonText
              ]}>
                {competition.isActive ? 'Join' : 'Ended'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#9C27B0', '#673AB7', '#3F51B5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="trophy" size={28} color="#FFFFFF" />
            <View>
              <Text style={styles.headerTitle}>Competitions</Text>
              <Text style={styles.headerSubtitle}>Challenge yourself & win rewards</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'challenges' && styles.activeTab
            ]}
            onPress={() => setSelectedTab('challenges')}
          >
            <Ionicons 
              name="flash" 
              size={16} 
              color={selectedTab === 'challenges' ? '#9C27B0' : 'rgba(255,255,255,0.8)'} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === 'challenges' && styles.activeTabText
            ]}>
              Challenges
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'competitions' && styles.activeTab
            ]}
            onPress={() => setSelectedTab('competitions')}
          >
            <Ionicons 
              name="trophy" 
              size={16} 
              color={selectedTab === 'competitions' ? '#9C27B0' : 'rgba(255,255,255,0.8)'} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === 'competitions' && styles.activeTabText
            ]}>
              Competitions
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {selectedTab === 'challenges' ? (
            <>
              <Text style={styles.sectionTitle}>Active Challenges</Text>
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Live Competitions</Text>
              {competitions.map((competition) => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </>
          )}
        </View>
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
  headerSubtitle: {
    fontSize: 14,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
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
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  challengeCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  challengeGradient: {
    padding: 20,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  challengeLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  challengeRight: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  challengeProgress: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  joinButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  inactiveText: {
    color: '#9CA3AF',
  },
  competitionCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  competitionGradient: {
    padding: 20,
  },
  competitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  competitionLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  competitionInfo: {
    flex: 1,
  },
  competitionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  competitionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  competitionRight: {
    alignItems: 'flex-end',
  },
  prizeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  leaderboardPreview: {
    marginBottom: 16,
  },
  leaderboardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leaderboardItem: {
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerName: {
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
  },
  playerScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  competitionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  competitionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  leaderboardButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  leaderboardButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

import LiveExamResultView from '@/components/live-exam/LiveExamResultView';
import { apiFetchAuth } from '@/constants/api';
import { R } from '@/constants/LiveExamResultTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface QuestionAnalysis {
  questionNumber: number;
  questionText: string;
  yourAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  marks: number;
}

interface LiveExamResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  examDuration: number;
  timeTakenSeconds: number;
  timeTakenMinutes: number;
  timeTakenFormatted: string;
  currentRank: number;
  prizeAmount: number;
  examTitle: string;
  completedAt: string;
  accuracy: number;
  timeEfficiency: number;
  message: string;
  percentile?: number;
  averageScore?: number;
  topScore?: number;
  totalParticipants?: number;
  questionAnalysis?: QuestionAnalysis[];
  subjectWise?: { subject: string; correct: number; total: number; percentage: number }[];
  certificateUrl?: string;
  verificationUrl?: string;
  verificationId?: string;
}

interface SuggestionItem {
  area: string;
  current: number;
  target: number;
  improvement: number;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

interface ImprovementSuggestion {
  hasEnoughData?: boolean;
  suggestions?: SuggestionItem[];
  summary?: {
    totalAreas: number;
    avgImprovement: number;
    estimatedRankImprovement?: string;
  };
  nextSteps?: string[];
  message?: string;
}

export default function LiveExamResultScreen() {
  const { id, resultData } = useLocalSearchParams<{ id: string, resultData?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LiveExamResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'analysis'>('overview');
  const [improvementData, setImprovementData] = useState<ImprovementSuggestion | null>(null);
  const [loadingImprovements, setLoadingImprovements] = useState(false);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scoreAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showConfetti, setShowConfetti] = useState(false);
  const [breakdownAnim] = useState(new Animated.Value(0));
  const [donutAnim] = useState(new Animated.Value(0));
  const [rankAnim] = useState(new Animated.Value(0));

  const confettiRefs = useRef<Animated.Value[]>([]);

  useEffect(() => {
    if (resultData) {
      try {
        const parsedResult = JSON.parse(resultData);
        setResult(parsedResult);
        
        // Enhanced animations sequence
        Animated.sequence([
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(scoreAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (parsedResult.score >= 60) {
            startConfetti();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }

          Animated.sequence([
            Animated.timing(breakdownAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(donutAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(rankAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        });

        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();

        // Fetch improvement suggestions after result is loaded
        if (user?.token) {
          // Delay to ensure component is fully rendered
          setTimeout(() => {
            fetchImprovementSuggestions();
          }, 500);
        }

      } catch (e) {
        console.error('Error parsing result data:', e);
      }
    }

    return () => {
      confettiRefs.current.forEach(anim => {
        if (anim) {
          anim.stopAnimation();
        }
      });
      confettiRefs.current = [];
    };
  }, [resultData, user?.token]);

  const fetchImprovementSuggestions = useCallback(async () => {
    try {
      if (!user?.token) {
        console.log('âš ï¸ No token available for fetching improvement suggestions');
        return;
      }

      setLoadingImprovements(true);
      console.log('ðŸ“¡ Fetching improvement suggestions...');
      const response = await apiFetchAuth('/student/performance/improvement-suggestions', user.token);
      
      console.log('ðŸ“¡ API Response:', {
        ok: response.ok,
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      
      if (response.ok && response.data) {
        // Handle different response structures
        const data = response.data.data || response.data;
        console.log('âœ… Improvement suggestions data:', data);
        setImprovementData(data);
      } else {
        console.error('âŒ Failed to fetch improvement suggestions:', response);
        // Set empty state to show the card
        setImprovementData({ hasEnoughData: false, message: 'Unable to fetch suggestions at this time' });
      }
    } catch (err) {
      console.error('âŒ Error fetching improvement suggestions:', err);
      // Set empty state to show the card
      setImprovementData({ hasEnoughData: false, message: 'Error loading suggestions. Please try again.' });
    } finally {
      setLoadingImprovements(false);
    }
  }, [user?.token]);

  const startConfetti = () => {
    setShowConfetti(true);
    confettiRefs.current = Array.from({ length: 20 }, () => new Animated.Value(0));
    
    confettiRefs.current.forEach((anim, index) => {
      Animated.sequence([
        Animated.delay(index * 50),
        Animated.timing(anim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Stop after one cycle - no infinite loop
        anim.setValue(1);
      });
    });

    // Auto-hide confetti after 3 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
  };

  const getCongratulatoryMessage = () => {
    if (!result) return '';
    if (result.score >= 90) return "ðŸŒŸ Outstanding Performance! You're a Star! ðŸŒŸ";
    if (result.score >= 80) return "ðŸŽ‰ Excellent Work! Keep it up! ðŸŽ‰";
    if (result.score >= 70) return "ðŸ‘ Great Job! You're doing well! ðŸ‘";
    if (result.score >= 60) return "ðŸ‘ Good Effort! Keep practicing! ðŸ‘";
    return "ðŸ’ª Keep Learning! You'll improve! ðŸ’ª";
  };

  const handleShare = async () => {
    try {
      const shareMessage = `ðŸŽ‰ I just scored ${result?.score}% in ${result?.examTitle}!\n\n` +
        `âœ… Correct: ${result?.correctAnswers}/${result?.totalQuestions}\n` +
        `ðŸ† Rank: #${result?.currentRank}\n` +
        `ðŸ’° Prize: â‚¹${result?.prizeAmount?.toLocaleString()}\n\n` +
        `Join me on this amazing exam platform!`;

      await Share.share({
        message: shareMessage,
        title: 'My Exam Result',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getPercentile = () => {
    if (result?.percentile) return result.percentile;
    if (result?.currentRank && result?.totalParticipants) {
      return ((result.totalParticipants - result.currentRank) / result.totalParticipants) * 100;
    }
    return null; // Return null if not available
  };

  const getPerformanceRating = () => {
    if (!result) return 'N/A';
    if (result.score >= 90) return 'Outstanding â­â­â­â­â­';
    if (result.score >= 80) return 'Excellent â­â­â­â­';
    if (result.score >= 70) return 'Very Good â­â­â­';
    if (result.score >= 60) return 'Good â­â­';
    return 'Keep Practicing â­';
  };

  if (!result) {
    return (
      <LinearGradient colors={[...R.ctaGrad]} style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={R.primary} />
          <Text style={styles.loadingTitle}>Preparing your results</Text>
          <Text style={styles.loadingSub}>Calculating rank & scoreâ€¦</Text>
        </View>
      </LinearGradient>
    );
  }

  const accuracy = (result.correctAnswers / result.totalQuestions) * 100;
  const completion = ((result.correctAnswers + result.wrongAnswers) / result.totalQuestions) * 100;

  const confettiNodes = (
    <View style={styles.confettiContainer} pointerEvents="none">
      {confettiRefs.current.map((anim, index) => (
        <Animated.View
          key={`confetti-${index}`}
          style={[
            styles.confetti,
            {
              backgroundColor:
                ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'][
                  index % 10
                ],
              left: Math.random() * width,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, height + 50],
                  }),
                },
                {
                  rotate: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );

  const improvementSection = (
    <>
      {loadingImprovements ? (
        <View style={styles.improvementCard}>
          <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.improvementGradient}>
            <View style={styles.improvementLoadingContainer}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text style={styles.improvementLoadingText}>Loading suggestions...</Text>
            </View>
          </LinearGradient>
        </View>
      ) : improvementData && improvementData.hasEnoughData && improvementData.suggestions && improvementData.suggestions.length > 0 ? (
        <View style={styles.improvementCard}>
          <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.improvementGradient}>
            <View style={styles.improvementHeader}>
              <Ionicons name="bulb" size={28} color="#4F46E5" />
              <Text style={styles.improvementTitle}>Improvement tips</Text>
            </View>
            <Text style={styles.improvementSubtext}>
              Personalized recommendations to boost your performance
            </Text>

            {improvementData.summary && (
              <View style={styles.improvementSummary}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Areas to Improve</Text>
                    <Text style={styles.summaryValue}>{improvementData.summary.totalAreas}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Avg Improvement</Text>
                    <Text style={styles.summaryValue}>{improvementData.summary.avgImprovement.toFixed(1)}%</Text>
                  </View>
                  {improvementData.summary.estimatedRankImprovement && (
                    <>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Rank Impact</Text>
                        <Text style={[styles.summaryValue, styles.summaryValueSmall]}>
                          {improvementData.summary.estimatedRankImprovement}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}

            <View style={styles.improvementSuggestionsList}>
              {improvementData.suggestions.map((suggestion: SuggestionItem, index: number) => {
                const priorityColor =
                  suggestion.priority === 'high' ? '#DC2626' : suggestion.priority === 'medium' ? '#6366F1' : '#059669';
                const priorityBgColor =
                  suggestion.priority === 'high' ? '#FEE2E2' : suggestion.priority === 'medium' ? '#E0E7FF' : '#D1FAE5';

                return (
                  <View key={index} style={styles.improvementSuggestionCard}>
                    <View style={styles.improvementSuggestionCardHeader}>
                      <View style={styles.improvementSuggestionAreaRow}>
                        <Text style={styles.improvementSuggestionArea}>{suggestion.area}</Text>
                        <View style={[styles.improvementPriorityBadge, { backgroundColor: priorityBgColor }]}>
                          <Text style={[styles.improvementPriorityText, { color: priorityColor }]}>
                            {suggestion.priority.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.improvementBadge}>+{suggestion.improvement.toFixed(1)}%</Text>
                    </View>

                    <View style={styles.improvementProgressSection}>
                      <View style={styles.improvementProgressRow}>
                        <Text style={styles.improvementProgressLabel}>Current</Text>
                        <Text style={styles.improvementProgressValue}>{suggestion.current.toFixed(1)}%</Text>
                      </View>
                      <View style={styles.improvementProgressBarContainer}>
                        <View style={styles.improvementProgressBarBg}>
                          <View
                            style={[
                              styles.improvementProgressBarFill,
                              {
                                width: `${Math.min(suggestion.current, 100)}%`,
                                backgroundColor: priorityColor,
                              },
                            ]}
                          />
                          <View
                            style={[styles.improvementTargetIndicator, { left: `${Math.min(suggestion.target, 100)}%` }]}
                          />
                        </View>
                      </View>
                      <View style={styles.improvementProgressRow}>
                        <Text style={styles.improvementProgressLabel}>Target</Text>
                        <Text style={[styles.improvementProgressValue, styles.improvementTargetValue]}>
                          {suggestion.target.toFixed(1)}%
                        </Text>
                      </View>
                    </View>

                    <View style={styles.improvementActionSection}>
                      <Ionicons name="arrow-forward-circle" size={18} color="#4F46E5" />
                      <Text style={styles.improvementActionText}>{suggestion.action}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {improvementData.nextSteps && improvementData.nextSteps.length > 0 && (
              <View style={styles.improvementNextStepsSection}>
                <Text style={styles.improvementNextStepsTitle}>Next steps</Text>
                {improvementData.nextSteps.map((step: string, index: number) => (
                  <View key={index} style={styles.improvementNextStepItem}>
                    <View style={styles.improvementNextStepNumber}>
                      <Text style={styles.improvementNextStepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.improvementNextStepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        </View>
      ) : (
        <View style={styles.improvementCard}>
          <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.improvementGradient}>
            <View style={styles.improvementHeader}>
              <Ionicons name="bulb" size={28} color="#4F46E5" />
              <Text style={styles.improvementTitle}>Improvement tips</Text>
            </View>
            <Text style={styles.improvementSubtext}>
              {improvementData?.message ||
                'Get personalized recommendations based on your exam history'}
            </Text>
            <TouchableOpacity
              style={styles.improvementButton}
              onPress={fetchImprovementSuggestions}
              activeOpacity={0.8}
              disabled={loadingImprovements}
            >
              <LinearGradient colors={['#4F46E5', '#4338CA']} style={styles.improvementButtonGradient}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.improvementButtonText}>Get suggestions</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </>
  );

  return (
    <LiveExamResultView
      result={result}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      fadeAnim={fadeAnim}
      slideAnim={slideAnim}
      scoreAnim={scoreAnim}
      pulseAnim={pulseAnim}
      showConfetti={showConfetti}
      confettiNodes={confettiNodes}
      performanceLabel={getPerformanceRating()}
      congratsMessage={getCongratulatoryMessage()}
      percentile={getPercentile()}
      accuracy={accuracy}
      completion={completion}
      onShare={handleShare}
      onHome={() => router.replace('/(tabs)/home' as any)}
      onCertificate={() => router.push({ pathname: '/(tabs)/live-exam/certificate/[id]' as any, params: { id } })}
    >
      {improvementSection}
    </LiveExamResultView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  loadingTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: R.ink,
    marginTop: 16,
  },
  loadingSub: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: R.muted,
    marginTop: 6,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  improvementCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  improvementGradient: {
    padding: 12,
  },
  improvementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  improvementTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#312E81',
  },
  improvementSubtext: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#4338CA',
    marginBottom: 10,
    lineHeight: 16,
  },
  improvementLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  improvementLoadingText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: '#3730A3',
  },
  improvementNoDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  improvementNoDataText: {
    flex: 1,
    fontSize: 14,
    color: '#3730A3',
    fontWeight: '600',
    lineHeight: 20,
  },
  improvementButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  improvementButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  improvementButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  improvementSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  improvementSuggestionsList: {
    gap: 8,
    marginBottom: 10,
  },
  improvementSuggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  improvementSuggestionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  improvementSuggestionAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  improvementSuggestionArea: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
  },
  improvementPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  improvementPriorityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  improvementBadge: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10B981',
  },
  improvementProgressSection: {
    marginBottom: 12,
  },
  improvementProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  improvementProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  improvementProgressValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  improvementTargetValue: {
    color: '#10B981',
  },
  improvementProgressBarContainer: {
    marginVertical: 8,
  },
  improvementProgressBarBg: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  improvementProgressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  improvementTargetIndicator: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: '#10B981',
    zIndex: 1,
  },
  improvementActionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  improvementActionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#3730A3',
    lineHeight: 18,
  },
  improvementNextStepsSection: {
    marginTop: 8,
  },
  improvementNextStepsTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#312E81',
    marginBottom: 12,
  },
  improvementNextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  improvementNextStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  improvementNextStepNumberText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  improvementNextStepText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#3730A3',
    lineHeight: 18,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#3730A3',
    marginBottom: 8,
  },
  summaryValue: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#312E81',
  },
  summaryValueSmall: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#C7D2FE',
  },
});

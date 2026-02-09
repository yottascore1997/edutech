import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface PracticeExamResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  examDuration: number;
  timeTakenSeconds: number;
  timeTakenMinutes: number;
  timeTakenFormatted: string;
  examTitle?: string;
  completedAt?: string;
  accuracy?: number;
  timeEfficiency?: number;
  message?: string;
  percentile?: number;
  averageScore?: number;
  topScore?: number;
  totalParticipants?: number;
  rank?: number;
  totalMarks?: number;
  earnedMarks?: number;
  answers?: { [questionId: string]: number };
}

interface RankPreview {
  hasEnoughData: boolean;
  projectedScore: number;
  rankRange: [number, number];
  performanceIndex: number;
  breakdown: {
    accuracy: number;
    attemptRatio: number;
    speedScore: number;
    consistency: number;
  };
  disclaimer: string;
  examType?: string;
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
    estimatedRankImprovement: string;
  };
  nextSteps?: string[];
}

export default function PracticeExamResultScreen() {
  const { id, resultData } = useLocalSearchParams<{ id: string, resultData?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PracticeExamResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');
  const [rankPreview, setRankPreview] = useState<RankPreview | null>(null);
  const [improvementData, setImprovementData] = useState<ImprovementSuggestion | null>(null);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scoreAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showConfetti, setShowConfetti] = useState(false);
  const [breakdownAnim] = useState(new Animated.Value(0));

  const confettiRefs = useRef<Animated.Value[]>([]);

  useEffect(() => {
    const loadResultData = async () => {
      setLoading(true);
      
      try {
        let parsedResult: PracticeExamResult | null = null;
        
        // First, try to parse from params
        if (resultData) {
          console.log('📊 Result data from params (raw length):', resultData.length);
          console.log('📊 Result data from params (first 500 chars):', resultData.substring(0, 500));
          try {
            const parsed = JSON.parse(resultData);
            console.log('📊 Parsed full response keys:', Object.keys(parsed));
            console.log('📊 Parsed full response:', JSON.stringify(parsed, null, 2));
            console.log('📊 parsed.result exists?', !!parsed.result);
            console.log('📊 parsed.rankPreview exists?', !!parsed.rankPreview);
            console.log('📊 parsed.rankPreview value:', parsed.rankPreview);
            
            // Handle nested response structure: { success, result: {...}, rankPreview: {...} } or direct result object
            parsedResult = parsed.result || parsed;
            
            // Extract rankPreview from response if available
            if (parsed.rankPreview) {
              console.log('📊 Rank preview data found:', parsed.rankPreview);
              console.log('📊 hasEnoughData:', parsed.rankPreview.hasEnoughData);
              console.log('📊 Setting rankPreview state...');
              setRankPreview(parsed.rankPreview);
              console.log('✅ Rank preview extracted and set in state:', parsed.rankPreview);
            } else {
              console.log('⚠️ No rankPreview found in parsed data');
              console.log('⚠️ Available keys in parsed:', Object.keys(parsed));
              console.log('⚠️ Full parsed object:', parsed);
            }
            
            console.log('✅ Parsed result data:', parsedResult);
          } catch (parseError) {
            console.error('❌ Error parsing result data from params:', parseError);
            console.error('❌ Raw data that failed to parse:', resultData);
          }
        }
        
        // If no data from params, try to fetch from API
        if (!parsedResult && id && user?.token) {
          console.log('📡 Fetching result from API for exam ID:', id);
          const response = await apiFetchAuth(`/student/practice-exams/${id}/result`, user.token);
          
          if (response.ok && response.data) {
            // Handle nested response structure: { success, result: {...}, rankPreview: {...} } or direct result object
            parsedResult = response.data.result || response.data;
            
            // Extract rankPreview from response if available
            if (response.data.rankPreview) {
              console.log('📊 Rank preview data found in API:', response.data.rankPreview);
              console.log('📊 hasEnoughData:', response.data.rankPreview.hasEnoughData);
              setRankPreview(response.data.rankPreview);
              console.log('✅ Rank preview extracted from API response:', response.data.rankPreview);
            } else {
              console.log('⚠️ No rankPreview found in API response');
            }
            
            console.log('✅ Fetched result from API:', parsedResult);
          } else {
            console.error('❌ Failed to fetch result from API:', response);
          }
        }
        
        // Fetch exam details to get examDuration and examTitle if missing
        if (parsedResult && (!parsedResult.examDuration || !parsedResult.examTitle) && id && user?.token) {
          try {
            console.log('📡 Fetching exam details for exam ID:', id);
            const examResponse = await apiFetchAuth(`/student/practice-exams/${id}`, user.token);
            if (examResponse.ok && examResponse.data) {
              const examData = examResponse.data;
              if (!parsedResult.examDuration && examData.duration) {
                parsedResult.examDuration = examData.duration;
              }
              if (!parsedResult.examTitle && examData.title) {
                parsedResult.examTitle = examData.title;
              }
              console.log('✅ Fetched exam details:', examData);
            }
          } catch (error) {
            console.error('❌ Error fetching exam details:', error);
          }
        }
        
        if (parsedResult) {
          // Calculate timeTakenMinutes from timeTakenSeconds if not provided
          const timeTakenMinutes = parsedResult.timeTakenMinutes ?? Math.floor((parsedResult.timeTakenSeconds ?? 0) / 60);
          
          // Ensure all required fields have default values
          const finalResult: PracticeExamResult = {
            score: parsedResult.score ?? 0,
            totalQuestions: parsedResult.totalQuestions ?? 0,
            correctAnswers: parsedResult.correctAnswers ?? 0,
            wrongAnswers: parsedResult.wrongAnswers ?? 0,
            unattempted: parsedResult.unattempted ?? 0,
            examDuration: parsedResult.examDuration ?? (parsedResult as any).duration ?? 0,
            timeTakenSeconds: parsedResult.timeTakenSeconds ?? 0,
            timeTakenMinutes: timeTakenMinutes,
            timeTakenFormatted: parsedResult.timeTakenFormatted ?? `${timeTakenMinutes}m`,
            examTitle: parsedResult.examTitle,
            completedAt: parsedResult.completedAt,
            accuracy: parsedResult.accuracy ?? (parsedResult.totalQuestions > 0 ? (parsedResult.correctAnswers / parsedResult.totalQuestions) * 100 : 0),
            timeEfficiency: parsedResult.timeEfficiency,
            message: parsedResult.message,
            percentile: parsedResult.percentile,
            averageScore: parsedResult.averageScore,
            topScore: parsedResult.topScore,
            totalParticipants: parsedResult.totalParticipants ?? parsedResult.totalParticipants,
            rank: parsedResult.rank ?? (parsedResult as any).currentRank,
            totalMarks: parsedResult.totalMarks,
            earnedMarks: parsedResult.earnedMarks,
            answers: parsedResult.answers,
          };
          
          console.log('📊 Final result data:', finalResult);
          setResult(finalResult);
          
          // Fetch improvement suggestions after result is loaded
          if (user?.token) {
            fetchImprovementSuggestions();
          }
          
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
            if (finalResult.score >= 60) {
              startConfetti();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }

            Animated.timing(breakdownAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }).start();
          });

          // Pulse animation
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnim, {
                toValue: 1.05,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
            ])
          ).start();
        } else {
          console.error('❌ No result data available');
        }
      } catch (error) {
        console.error('❌ Error loading result data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadResultData();
  }, [resultData, id, user?.token]);

  const fetchImprovementSuggestions = async () => {
    try {
      if (!user?.token) return;

      const response = await apiFetchAuth('/student/performance/improvement-suggestions', user.token);
      
      if (response.ok && response.data) {
        setImprovementData(response.data);
        console.log('✅ Improvement suggestions fetched:', response.data);
      } else {
        console.error('❌ Failed to fetch improvement suggestions:', response);
      }
    } catch (err) {
      console.error('❌ Error fetching improvement suggestions:', err);
    }
  };

  const startConfetti = () => {
    setShowConfetti(true);
    confettiRefs.current = Array.from({ length: 30 }, () => new Animated.Value(0));
    
    confettiRefs.current.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 3000 + Math.random() * 2000,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });

    setTimeout(() => setShowConfetti(false), 5000);
  };

  const getScoreColor = (): [string, string] => {
    if (!result) return ['#667eea', '#764ba2'];
    if (result.score >= 80) return ['#10B981', '#059669'];
    if (result.score >= 60) return ['#F59E0B', '#D97706'];
    if (result.score >= 40) return ['#EF4444', '#DC2626'];
    return ['#6B7280', '#4B5563'];
  };

  const getBackgroundGradient = (): [string, string, string] => {
    return ['#FFFFFF', '#F8FAFF', '#F0F4FF'];
  };

  const getPerformanceRating = () => {
    if (!result) return 'Keep Practicing';
    if (result.score >= 80) return 'Excellent! 🌟';
    if (result.score >= 60) return 'Good Job! 👍';
    if (result.score >= 40) return 'Keep Trying 💪';
    return 'Keep Practicing 📚';
  };

  const getPercentile = () => {
    return result?.percentile || null;
  };

  if (loading || !result) {
    return (
      <LinearGradient colors={getBackgroundGradient()} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </LinearGradient>
    );
  }

  const accuracy = result.accuracy ?? (result.correctAnswers / result.totalQuestions) * 100;
  const completion = ((result.correctAnswers + result.wrongAnswers) / result.totalQuestions) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient
        colors={getBackgroundGradient()}
        style={styles.container}
      >
        {/* Confetti Background */}
        {showConfetti && (
          <View style={styles.confettiContainer} pointerEvents="none">
            {confettiRefs.current.map((anim, index) => (
              <Animated.View
                key={`confetti-${index}`}
                style={[
                  styles.confetti,
                  {
                    backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'][index % 10],
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
        )}

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View 
            style={[
              styles.resultContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Ultra-Premium Header Section */}
            <View style={styles.ultraHeaderSection}>
              <LinearGradient
                colors={getScoreColor()}
                style={styles.ultraHeaderGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Decorative Elements */}
                <View style={styles.decorativeCircle1} />
                <View style={styles.decorativeCircle2} />
                <View style={styles.decorativeCircle3} />

                <Text style={styles.ultraHeaderTitle}>Exam Completed! 🎉</Text>
                {result.examTitle && (
                  <Text style={styles.ultraHeaderSubtitle}>{result.examTitle}</Text>
                )}
                
                {/* Massive Score Display */}
                <Animated.View 
                  style={[
                    styles.massiveScoreContainer,
                    { transform: [{ scale: scoreAnim }] }
                  ]}
                >
                  <Text style={styles.scoreLabel}>YOUR SCORE</Text>
                  <View style={styles.scoreRing}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 1)']}
                      style={styles.scoreInnerRing}
                    >
                      <View style={styles.scoreValueRow}>
                        <Text style={styles.massiveScore}>{result.score}</Text>
                        <Text style={styles.scorePercentage}>%</Text>
                      </View>
                    </LinearGradient>
                  </View>
                  <Animated.View 
                    style={[
                      styles.performancePill,
                      { transform: [{ scale: pulseAnim }] }
                    ]}
                  >
                    <Text style={styles.performancePillText}>
                      {getPerformanceRating()}
                    </Text>
                  </Animated.View>
                </Animated.View>

              </LinearGradient>
            </View>

            {/* Tabs Navigation */}
            <View style={styles.tabsContainer}>
              {['overview', 'detailed'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    activeTab === tab && styles.activeTab
                  ]}
                  onPress={() => setActiveTab(tab as any)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText
                  ]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <Animated.View style={{ opacity: fadeAnim }}>
                {/* Rank Premium Card - Show if rank is available */}
                {result.rank && (
                  <View style={styles.rankCard}>
                    <LinearGradient
                      colors={['#FFF7ED', '#FFEDD5']}
                      style={styles.rankGradient}
                    >
                      <View style={styles.rankHeader}>
                        <View style={styles.rankIconBox}>
                          <Ionicons name="trophy" size={32} color="#F59E0B" />
                        </View>
                        <Text style={styles.rankTitle}>Your Rank</Text>
                      </View>
                      <Text style={styles.rankValue}>#{result.rank}</Text>
                      {result.totalParticipants && (
                        <Text style={styles.rankSubtext}>
                          out of {result.totalParticipants} participants
                        </Text>
                      )}
                      {result.rank === 1 && (
                        <Text style={styles.rankCongrats}>🏆 Congratulations! You're #1!</Text>
                      )}
                    </LinearGradient>
                  </View>
                )}

                {/* Percentile Premium Card - Only show if available */}
                {getPercentile() !== null && (
                  <View style={styles.percentileCard}>
                    <LinearGradient
                      colors={['#DBEAFE', '#BFDBFE']}
                      style={styles.percentileGradient}
                    >
                      <View style={styles.percentileHeader}>
                        <Ionicons name="analytics" size={28} color="#1D4ED8" />
                        <Text style={styles.percentileTitle}>Your Percentile</Text>
                      </View>
                      <Text style={styles.percentileValue}>{getPercentile()!.toFixed(1)}</Text>
                      <Text style={styles.percentileUnit}>th percentile</Text>
                      <Text style={styles.percentileSubtext}>
                        You performed better than {getPercentile()!.toFixed(0)}% of all students! 🎯
                      </Text>
                    </LinearGradient>
                  </View>
                )}

                {/* Stats Grid - Heavy Premium Look */}
                <View style={styles.statsSection}>
                  <Text style={styles.sectionTitle}>📊 Performance Metrics</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <LinearGradient
                        colors={['#D1FAE5', '#A7F3D0']}
                        style={styles.statGradient}
                      >
                        <View style={styles.statIcon}>
                          <Ionicons name="checkmark-circle" size={24} color="#059669" />
                        </View>
                        <Text style={styles.statValue}>{result.correctAnswers}</Text>
                        <Text style={styles.statLabel}>Correct</Text>
                        <Text style={styles.statPercentage}>
                          {((result.correctAnswers / result.totalQuestions) * 100).toFixed(0)}%
                        </Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                      <LinearGradient
                        colors={['#FEE2E2', '#FECACA']}
                        style={styles.statGradient}
                      >
                        <View style={styles.statIcon}>
                          <Ionicons name="close-circle" size={24} color="#DC2626" />
                        </View>
                        <Text style={styles.statValue}>{result.wrongAnswers}</Text>
                        <Text style={styles.statLabel}>Wrong</Text>
                        <Text style={styles.statPercentage}>
                          {((result.wrongAnswers / result.totalQuestions) * 100).toFixed(0)}%
                        </Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                      <LinearGradient
                        colors={['#E0E7FF', '#C7D2FE']}
                        style={styles.statGradient}
                      >
                        <View style={styles.statIcon}>
                          <Ionicons name="help-circle" size={24} color="#4F46E5" />
                        </View>
                        <Text style={styles.statValue}>{result.totalQuestions}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                        <Text style={styles.statPercentage}>Questions</Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                      <LinearGradient
                        colors={['#FEF3C7', '#FDE68A']}
                        style={styles.statGradient}
                      >
                        <View style={styles.statIcon}>
                          <Ionicons name="time" size={24} color="#D97706" />
                        </View>
                        <Text style={styles.statValue}>{result.timeTakenMinutes}</Text>
                        <Text style={styles.statLabel}>Minutes</Text>
                        <Text style={styles.statPercentage}>Time Used</Text>
                      </LinearGradient>
                    </View>
                  </View>
                </View>

                {/* Performance Comparison - Only show if real data available */}
                {(result.averageScore !== undefined || result.topScore !== undefined) && (
                  <View style={styles.comparisonCard}>
                    <LinearGradient
                      colors={['#FFFFFF', '#F9FAFB']}
                      style={styles.comparisonGradient}
                    >
                      <Text style={styles.comparisonTitle}>📈 Performance Comparison</Text>
                      
                      <View style={styles.comparisonBars}>
                        <View style={styles.comparisonItem}>
                          <View style={styles.comparisonRow}>
                            <Text style={styles.comparisonLabel}>You</Text>
                            <Text style={styles.comparisonValue}>{result.score}%</Text>
                          </View>
                          <View style={styles.comparisonBarBg}>
                            <LinearGradient
                              colors={['#667eea', '#764ba2']}
                              style={[styles.comparisonBarFill, { width: `${result.score}%` }]}
                            />
                          </View>
                        </View>

                        {result.averageScore !== undefined && (
                          <View style={styles.comparisonItem}>
                            <View style={styles.comparisonRow}>
                              <Text style={styles.comparisonLabel}>Average</Text>
                              <Text style={styles.comparisonValue}>{result.averageScore}%</Text>
                            </View>
                            <View style={styles.comparisonBarBg}>
                              <LinearGradient
                                colors={['#F59E0B', '#D97706']}
                                style={[styles.comparisonBarFill, { width: `${result.averageScore}%` }]}
                              />
                            </View>
                          </View>
                        )}

                        {result.topScore !== undefined && (
                          <View style={styles.comparisonItem}>
                            <View style={styles.comparisonRow}>
                              <Text style={styles.comparisonLabel}>Top Score</Text>
                              <Text style={styles.comparisonValue}>{result.topScore}%</Text>
                            </View>
                            <View style={styles.comparisonBarBg}>
                              <LinearGradient
                                colors={['#10B981', '#059669']}
                                style={[styles.comparisonBarFill, { width: `${result.topScore}%` }]}
                              />
                            </View>
                          </View>
                        )}
                      </View>

                      {/* Performance Insights - Only if average is available */}
                      {result.averageScore !== undefined && (
                        <View style={styles.insightsBox}>
                          <Ionicons name="bulb" size={20} color="#F59E0B" />
                          <Text style={styles.insightsText}>
                            {result.score > result.averageScore 
                              ? "🎉 You're performing above average!" 
                              : "💪 Practice more to beat the average!"}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </View>
                )}

                {/* Achievement Badges - Ultra Premium */}
                <View style={styles.achievementsCard}>
                  <Text style={styles.achievementsTitle}>🏅 Achievements Unlocked</Text>
                  <View style={styles.badgesGrid}>
                    {result.score >= 80 && (
                      <View style={styles.badge}>
                        <LinearGradient
                          colors={['#FCD34D', '#F59E0B']}
                          style={styles.badgeGradient}
                        >
                          <Ionicons name="trophy" size={28} color="#fff" />
                          <Text style={styles.badgeText}>Top Scorer</Text>
                          <Text style={styles.badgeSubtext}>Score ≥ 80%</Text>
                        </LinearGradient>
                      </View>
                    )}
                    
                    {result.timeTakenMinutes < result.examDuration * 0.7 && (
                      <View style={styles.badge}>
                        <LinearGradient
                          colors={['#60A5FA', '#3B82F6']}
                          style={styles.badgeGradient}
                        >
                          <Ionicons name="flash" size={28} color="#fff" />
                          <Text style={styles.badgeText}>Speed Demon</Text>
                          <Text style={styles.badgeSubtext}>Fast Solver</Text>
                        </LinearGradient>
                      </View>
                    )}

                    {result.correctAnswers === result.totalQuestions && (
                      <View style={styles.badge}>
                        <LinearGradient
                          colors={['#34D399', '#10B981']}
                          style={styles.badgeGradient}
                        >
                          <Ionicons name="star" size={28} color="#fff" />
                          <Text style={styles.badgeText}>Perfect!</Text>
                          <Text style={styles.badgeSubtext}>100% Score</Text>
                        </LinearGradient>
                      </View>
                    )}

                    {getPercentile() !== null && getPercentile()! >= 90 && (
                      <View style={styles.badge}>
                        <LinearGradient
                          colors={['#EC4899', '#DB2777']}
                          style={styles.badgeGradient}
                        >
                          <Ionicons name="ribbon" size={28} color="#fff" />
                          <Text style={styles.badgeText}>Elite</Text>
                          <Text style={styles.badgeSubtext}>Top 10%</Text>
                        </LinearGradient>
                      </View>
                    )}
                  </View>
                </View>

                {/* Rank Preview Card */}
                {rankPreview && rankPreview.hasEnoughData && (
                  <View style={styles.rankPreviewCard}>
                    <LinearGradient
                      colors={['#F0F9FF', '#E0F2FE']}
                      style={styles.rankPreviewGradient}
                    >
                      <View style={styles.rankPreviewHeader}>
                        <Ionicons name="trending-up" size={28} color="#0284C7" />
                        <View style={styles.rankPreviewTitleContainer}>
                          <Text style={styles.rankPreviewTitle}>Future Rank Projection</Text>
                          {rankPreview.examType && (
                            <View style={styles.examTypeBadge}>
                              <Text style={styles.examTypeText}>{rankPreview.examType}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      {/* Projected Score - Prominent Display */}
                      <View style={styles.projectedScoreContainer}>
                        <LinearGradient
                          colors={['#FFFFFF', '#F8FAFF']}
                          style={styles.projectedScoreBox}
                        >
                          <Text style={styles.projectedScoreLabel}>Projected Score</Text>
                          <View style={styles.projectedScoreValueContainer}>
                            <Text style={styles.projectedScoreValue}>
                              {rankPreview.projectedScore != null ? rankPreview.projectedScore.toFixed(1) : '0.0'}
                            </Text>
                            <Text style={styles.projectedScoreUnit}>%</Text>
                          </View>
                        </LinearGradient>
                      </View>

                      {/* Key Metrics Row */}
                      <View style={styles.rankPreviewMetricsRow}>
                        <View style={styles.rankPreviewMetricItem}>
                          <View style={styles.rankRangeBox}>
                            <View style={styles.rankRangeIconContainer}>
                              <Ionicons name="trophy-outline" size={20} color="#0284C7" />
                            </View>
                            <Text style={styles.rankRangeLabel}>Expected Rank Range</Text>
                            <Text style={styles.rankRangeValue}>
                              #{rankPreview.rankRange?.[0]?.toLocaleString() ?? '0'} - #{rankPreview.rankRange?.[1]?.toLocaleString() ?? '0'}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.rankPreviewMetricItem}>
                          <View style={styles.performanceIndexBox}>
                            <View style={styles.rankRangeIconContainer}>
                              <Ionicons name="analytics-outline" size={20} color="#0284C7" />
                            </View>
                            <Text style={styles.performanceIndexLabel}>Performance Index</Text>
                            <Text style={styles.performanceIndexValue}>
                              {rankPreview.performanceIndex != null ? rankPreview.performanceIndex.toFixed(1) : '0.0'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Performance Breakdown with Progress Bars */}
                      {rankPreview.breakdown && (
                        <View style={styles.breakdownSection}>
                          <Text style={styles.breakdownTitle}>Performance Breakdown</Text>
                          <View style={styles.breakdownList}>
                            <View style={styles.breakdownItem}>
                              <View style={styles.breakdownItemHeader}>
                                <Text style={styles.breakdownLabel}>Accuracy</Text>
                                <Text style={styles.breakdownValue}>{rankPreview.breakdown.accuracy?.toFixed(1) ?? '0.0'}%</Text>
                              </View>
                              <View style={styles.breakdownProgressBar}>
                                <View style={[
                                  styles.breakdownProgressFill,
                                  { width: `${Math.min(rankPreview.breakdown.accuracy ?? 0, 100)}%`, backgroundColor: '#EF4444' }
                                ]} />
                              </View>
                            </View>
                            
                            <View style={styles.breakdownItem}>
                              <View style={styles.breakdownItemHeader}>
                                <Text style={styles.breakdownLabel}>Attempt Ratio</Text>
                                <Text style={styles.breakdownValue}>{rankPreview.breakdown.attemptRatio?.toFixed(1) ?? '0.0'}%</Text>
                              </View>
                              <View style={styles.breakdownProgressBar}>
                                <View style={[
                                  styles.breakdownProgressFill,
                                  { width: `${Math.min(rankPreview.breakdown.attemptRatio ?? 0, 100)}%`, backgroundColor: '#10B981' }
                                ]} />
                              </View>
                            </View>
                            
                            <View style={styles.breakdownItem}>
                              <View style={styles.breakdownItemHeader}>
                                <Text style={styles.breakdownLabel}>Speed Score</Text>
                                <Text style={styles.breakdownValue}>{rankPreview.breakdown.speedScore?.toFixed(1) ?? '0.0'}%</Text>
                              </View>
                              <View style={styles.breakdownProgressBar}>
                                <View style={[
                                  styles.breakdownProgressFill,
                                  { width: `${Math.min(rankPreview.breakdown.speedScore ?? 0, 100)}%`, backgroundColor: '#F59E0B' }
                                ]} />
                              </View>
                            </View>
                            
                            <View style={styles.breakdownItem}>
                              <View style={styles.breakdownItemHeader}>
                                <Text style={styles.breakdownLabel}>Consistency</Text>
                                <Text style={styles.breakdownValue}>{rankPreview.breakdown.consistency?.toFixed(1) ?? '0.0'}%</Text>
                              </View>
                              <View style={styles.breakdownProgressBar}>
                                <View style={[
                                  styles.breakdownProgressFill,
                                  { width: `${Math.min(rankPreview.breakdown.consistency ?? 0, 100)}%`, backgroundColor: '#8B5CF6' }
                                ]} />
                              </View>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Disclaimer */}
                      {rankPreview.disclaimer && (
                        <View style={styles.disclaimerBox}>
                          <Ionicons name="information-circle" size={16} color="#64748B" />
                          <Text style={styles.disclaimerText}>{rankPreview.disclaimer}</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </View>
                )}

                {/* Marks Display Card */}
                {(result.totalMarks !== undefined || result.earnedMarks !== undefined) && (
                  <View style={styles.marksCard}>
                    <LinearGradient
                      colors={['#FEF3C7', '#FDE68A']}
                      style={styles.marksGradient}
                    >
                      <View style={styles.marksHeader}>
                        <Ionicons name="medal" size={28} color="#D97706" />
                        <Text style={styles.marksTitle}>Marks Breakdown</Text>
                      </View>
                      
                      <View style={styles.marksContent}>
                        <View style={styles.marksItem}>
                          <Text style={styles.marksLabel}>Earned Marks</Text>
                          <Text style={styles.marksValue}>{result.earnedMarks ?? 0}</Text>
                        </View>
                        <View style={styles.marksDivider} />
                        <View style={styles.marksItem}>
                          <Text style={styles.marksLabel}>Total Marks</Text>
                          <Text style={styles.marksValue}>{result.totalMarks ?? 0}</Text>
                        </View>
                      </View>
                      
                      {result.totalMarks !== undefined && result.totalMarks > 0 && (
                        <View style={styles.marksPercentageBox}>
                          <Text style={styles.marksPercentageLabel}>Marks Percentage</Text>
                          <Text style={styles.marksPercentageValue}>
                            {((result.earnedMarks ?? 0) / result.totalMarks * 100).toFixed(1)}%
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </View>
                )}

                {/* Improvement Suggestions Card */}
                {improvementData && improvementData.hasEnoughData && improvementData.suggestions && improvementData.suggestions.length > 0 && (
                  <View style={styles.improvementCard}>
                    <LinearGradient
                      colors={['#F0FDF4', '#ECFEFF']}
                      style={styles.improvementGradient}
                    >
                      <View style={styles.improvementHeader}>
                        <View style={styles.improvementIconWrap}>
                          <Ionicons name="bulb" size={26} color="#0D9488" />
                        </View>
                        <Text style={styles.improvementTitle}>Improvement Suggestions</Text>
                      </View>
                      <Text style={styles.improvementSubtext}>
                        Personalized recommendations to boost your performance
                      </Text>

                      {/* Summary Section */}
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
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                              <Text style={styles.summaryLabel}>Rank Impact</Text>
                              <Text style={[styles.summaryValue, styles.summaryValueSmall]}>
                                {improvementData.summary.estimatedRankImprovement}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Suggestions List */}
                      <View style={styles.suggestionsList}>
                        {improvementData.suggestions.map((suggestion: SuggestionItem, index: number) => {
                          const priorityColor = suggestion.priority === 'high' ? '#DC2626' : 
                                                suggestion.priority === 'medium' ? '#D97706' : '#059669';
                          const priorityBgColor = suggestion.priority === 'high' ? '#FEE2E2' : 
                                                  suggestion.priority === 'medium' ? '#FEF3C7' : '#D1FAE5';
                          
                          return (
                            <View key={index} style={styles.suggestionCard}>
                              <View style={styles.suggestionCardHeader}>
                                <View style={styles.suggestionAreaRow}>
                                  <Text style={styles.suggestionArea}>{suggestion.area}</Text>
                                  <View style={[styles.priorityBadge, { backgroundColor: priorityBgColor }]}>
                                    <Text style={[styles.priorityText, { color: priorityColor }]}>
                                      {suggestion.priority.toUpperCase()}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.improvementBadge}>+{suggestion.improvement.toFixed(1)}%</Text>
                              </View>

                              {/* Current vs Target */}
                              <View style={styles.progressSection}>
                                <View style={styles.progressRow}>
                                  <Text style={styles.progressLabel}>Current</Text>
                                  <Text style={styles.progressValue}>{suggestion.current.toFixed(1)}%</Text>
                                </View>
                                <View style={styles.progressBarContainer}>
                                  <View style={styles.progressBarBg}>
                                    {/* Current progress */}
                                    <View style={[
                                      styles.progressBarFill,
                                      { 
                                        width: `${Math.min(suggestion.current, 100)}%`,
                                        backgroundColor: priorityColor
                                      }
                                    ]} />
                                    {/* Target indicator line */}
                                    <View style={[
                                      styles.targetIndicator,
                                      { left: `${Math.min(suggestion.target, 100)}%` }
                                    ]} />
                                  </View>
                                </View>
                                <View style={styles.progressRow}>
                                  <Text style={styles.progressLabel}>Target</Text>
                                  <Text style={[styles.progressValue, styles.targetValue]}>
                                    {suggestion.target.toFixed(1)}%
                                  </Text>
                                </View>
                              </View>

                              {/* Action Text */}
                              <View style={styles.actionSection}>
                                <Ionicons name="arrow-forward-circle" size={18} color="#0D9488" />
                                <Text style={styles.actionText}>{suggestion.action}</Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>

                      {/* Next Steps Section */}
                      {improvementData.nextSteps && improvementData.nextSteps.length > 0 && (
                        <View style={styles.nextStepsSection}>
                          <Text style={styles.nextStepsTitle}>Next Steps</Text>
                          {improvementData.nextSteps.map((step: string, index: number) => (
                            <View key={index} style={styles.nextStepItem}>
                              <View style={styles.nextStepNumber}>
                                <Text style={styles.nextStepNumberText}>{index + 1}</Text>
                              </View>
                              <Text style={styles.nextStepText}>{step}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </LinearGradient>
                  </View>
                )}
              </Animated.View>
            )}

            {/* Detailed Analysis Tab */}
            {activeTab === 'detailed' && (
              <Animated.View style={{ opacity: fadeAnim }}>
                {/* Circular Progress Visualization */}
                <View style={styles.circularProgressCard}>
                  <Text style={styles.cardTitle}>📊 Detailed Breakdown</Text>
                  <View style={styles.circularProgressRow}>
                    {/* Accuracy Circle */}
                    <View style={styles.circleWrapper}>
                      <View style={styles.progressCircle}>
                        <LinearGradient
                          colors={['#10B981', '#059669']}
                          style={styles.progressCircleFill}
                        >
                          <Text style={styles.circleValue}>{accuracy.toFixed(0)}%</Text>
                        </LinearGradient>
                      </View>
                      <Text style={styles.circleLabel}>Accuracy</Text>
                    </View>

                    {/* Completion Circle */}
                    <View style={styles.circleWrapper}>
                      <View style={styles.progressCircle}>
                        <LinearGradient
                          colors={['#3B82F6', '#2563EB']}
                          style={styles.progressCircleFill}
                        >
                          <Text style={styles.circleValue}>{completion.toFixed(0)}%</Text>
                        </LinearGradient>
                      </View>
                      <Text style={styles.circleLabel}>Completion</Text>
                    </View>

                    {/* Speed Circle */}
                    <View style={styles.circleWrapper}>
                      <View style={styles.progressCircle}>
                        <LinearGradient
                          colors={['#F59E0B', '#D97706']}
                          style={styles.progressCircleFill}
                        >
                          <Text style={styles.circleValue}>{((result.timeTakenMinutes / result.examDuration) * 100).toFixed(0)}%</Text>
                        </LinearGradient>
                      </View>
                      <Text style={styles.circleLabel}>Speed</Text>
                    </View>
                  </View>
                </View>

                {/* Time Analytics */}
                <View style={styles.timeAnalyticsCard}>
                  <LinearGradient
                    colors={['#FFF7ED', '#FFEDD5']}
                    style={styles.timeAnalyticsGradient}
                  >
                    <View style={styles.timeHeader}>
                      <Ionicons name="flash" size={24} color="#FB923C" />
                      <Text style={styles.timeTitle}>⚡ Time Analytics</Text>
                    </View>
                    
                    <View style={styles.timeStatsRow}>
                      <View style={styles.timeStatItem}>
                        <Text style={styles.timeStatValue}>{result.timeTakenFormatted}</Text>
                        <Text style={styles.timeStatLabel}>Time Used</Text>
                      </View>
                      <View style={styles.timeStatItem}>
                        <Text style={styles.timeStatValue}>{result.examDuration}m</Text>
                        <Text style={styles.timeStatLabel}>Total Time</Text>
                      </View>
                      <View style={styles.timeStatItem}>
                        <Text style={styles.timeStatValue}>
                          {(result.timeTakenMinutes / result.totalQuestions).toFixed(1)}m
                        </Text>
                        <Text style={styles.timeStatLabel}>Avg/Question</Text>
                      </View>
                    </View>

                    <View style={styles.efficiencyBar}>
                      <View style={styles.efficiencyBarBg}>
                        <LinearGradient
                          colors={['#FB923C', '#F97316']}
                          style={[
                            styles.efficiencyBarFill,
                            { width: `${(result.timeTakenMinutes / result.examDuration) * 100}%` }
                          ]}
                        />
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                {/* Answer Distribution */}
                <View style={styles.distributionCard}>
                  <Text style={styles.cardTitle}>📈 Answer Distribution</Text>
                  <View style={styles.distributionRow}>
                    <View style={styles.distributionItem}>
                      <View style={[styles.distributionCircle, { backgroundColor: '#10B981' }]}>
                        <Text style={styles.distributionNumber}>{result.correctAnswers}</Text>
                      </View>
                      <Text style={styles.distributionLabel}>Correct</Text>
                    </View>

                    <View style={styles.distributionItem}>
                      <View style={[styles.distributionCircle, { backgroundColor: '#EF4444' }]}>
                        <Text style={styles.distributionNumber}>{result.wrongAnswers}</Text>
                      </View>
                      <Text style={styles.distributionLabel}>Wrong</Text>
                    </View>

                    <View style={styles.distributionItem}>
                      <View style={[styles.distributionCircle, { backgroundColor: '#6B7280' }]}>
                        <Text style={styles.distributionNumber}>{result.unattempted}</Text>
                      </View>
                      <Text style={styles.distributionLabel}>Skipped</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}

          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  resultContainer: {
    paddingBottom: 40,
  },
  ultraHeaderSection: {
    marginTop: 12,
    marginBottom: 14,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ultraHeaderGradient: {
    padding: 16,
    paddingTop: 18,
    paddingBottom: 18,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    top: -30,
    right: -20,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -15,
    left: -15,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    top: 24,
    left: 16,
  },
  ultraHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  ultraHeaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: 12,
  },
  massiveScoreContainer: {
    marginVertical: 8,
    alignItems: 'center',
  },
  scoreRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  scoreInnerRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scoreValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  massiveScore: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1F2937',
    lineHeight: 36,
    letterSpacing: -1,
  },
  scorePercentage: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    marginLeft: 2,
    letterSpacing: -0.5,
  },
  performancePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  performancePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  percentileCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  percentileGradient: {
    padding: 24,
    alignItems: 'center',
  },
  percentileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  percentileTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  percentileValue: {
    fontSize: 64,
    fontWeight: '900',
    color: '#1E3A8A',
    lineHeight: 64,
  },
  percentileUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 12,
  },
  percentileSubtext: {
    fontSize: 15,
    color: '#1E40AF',
    fontWeight: '600',
    textAlign: 'center',
  },
  rankCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  rankGradient: {
    padding: 24,
    alignItems: 'center',
  },
  rankHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  rankIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 8,
  },
  rankValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#92400E',
    marginBottom: 8,
    lineHeight: 56,
  },
  rankSubtext: {
    fontSize: 16,
    color: '#B45309',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  rankCongrats: {
    fontSize: 16,
    color: '#D97706',
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  statsSection: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    width: (width - 48) / 2,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statGradient: {
    padding: 14,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  statPercentage: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  comparisonCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  comparisonGradient: {
    padding: 24,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 20,
  },
  comparisonBars: {
    gap: 20,
  },
  comparisonItem: {
    gap: 10,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  comparisonValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1F2937',
  },
  comparisonBarBg: {
    height: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 7,
    overflow: 'hidden',
  },
  comparisonBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  insightsBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  insightsText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  achievementsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  achievementsTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  badge: {
    width: (width - 64) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  badgeGradient: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  badgeSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  circularProgressCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 20,
  },
  circularProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  circleWrapper: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  progressCircleFill: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  circleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  timeAnalyticsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  timeAnalyticsGradient: {
    padding: 24,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  timeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#9A3412',
  },
  timeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  timeStatItem: {
    alignItems: 'center',
  },
  timeStatValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#9A3412',
    marginBottom: 4,
  },
  timeStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  efficiencyBar: {
    marginTop: 8,
  },
  efficiencyBarBg: {
    height: 10,
    backgroundColor: '#FED7AA',
    borderRadius: 5,
    overflow: 'hidden',
  },
  efficiencyBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  distributionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  distributionItem: {
    alignItems: 'center',
  },
  distributionCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  distributionNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  distributionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  rankPreviewCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  rankPreviewGradient: {
    padding: 24,
  },
  rankPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  rankPreviewTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankPreviewTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  examTypeBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  examTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  projectedScoreContainer: {
    marginBottom: 20,
  },
  projectedScoreBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  projectedScoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  projectedScoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  projectedScoreValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 52,
  },
  projectedScoreUnit: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 2,
  },
  rankPreviewMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  rankPreviewMetricItem: {
    flex: 1,
  },
  rankRangeBox: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    minHeight: 100,
    justifyContent: 'center',
  },
  rankRangeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankRangeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  rankRangeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 18,
  },
  performanceIndexBox: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    minHeight: 100,
    justifyContent: 'center',
  },
  performanceIndexLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  performanceIndexValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  breakdownSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(2, 132, 199, 0.2)',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  breakdownList: {
    gap: 12,
  },
  breakdownItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 12,
  },
  breakdownItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  breakdownProgressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownProgressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 4,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 16,
  },
  improvementCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  improvementGradient: {
    padding: 22,
  },
  improvementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  improvementIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  improvementTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  improvementSubtext: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 16,
    lineHeight: 20,
  },
  improvementContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 14,
    padding: 16,
  },
  improvementText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    lineHeight: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    lineHeight: 20,
  },
  improvementSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D9488',
    textAlign: 'center',
  },
  summaryValueSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  suggestionsList: {
    gap: 12,
    marginBottom: 16,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  suggestionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  suggestionArea: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  improvementBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D9488',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressBarContainer: {
    marginVertical: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  targetIndicator: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 12,
    backgroundColor: '#1F2937',
    borderRadius: 1,
  },
  targetValue: {
    color: '#0D9488',
    fontWeight: '800',
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0D9488',
  },
  actionText: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    lineHeight: 18,
  },
  nextStepsSection: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nextStepsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  nextStepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  nextStepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nextStepText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    lineHeight: 18,
  },
  marksCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  marksGradient: {
    padding: 24,
  },
  marksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  marksTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#92400E',
  },
  marksContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    paddingVertical: 16,
  },
  marksItem: {
    alignItems: 'center',
    flex: 1,
  },
  marksDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(146, 64, 14, 0.3)',
  },
  marksLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  marksValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#D97706',
  },
  marksPercentageBox: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
  },
  marksPercentageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 6,
  },
  marksPercentageValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#D97706',
  },
});


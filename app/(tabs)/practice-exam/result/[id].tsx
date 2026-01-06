import { useAuth } from '@/context/AuthContext';
import { apiFetchAuth } from '@/constants/api';
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
}

export default function PracticeExamResultScreen() {
  const { id, resultData } = useLocalSearchParams<{ id: string, resultData?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PracticeExamResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');
  
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
          console.log('📊 Result data from params:', resultData);
          try {
            const parsed = JSON.parse(resultData);
            // Handle nested response structure: { success, result: {...} } or direct result object
            parsedResult = parsed.result || parsed;
            console.log('✅ Parsed result data:', parsedResult);
          } catch (parseError) {
            console.error('❌ Error parsing result data from params:', parseError);
          }
        }
        
        // If no data from params, try to fetch from API
        if (!parsedResult && id && user?.token) {
          console.log('📡 Fetching result from API for exam ID:', id);
          const response = await apiFetchAuth(`/student/practice-exams/${id}/result`, user.token);
          
          if (response.ok && response.data) {
            // Handle nested response structure: { success, result: {...} } or direct result object
            parsedResult = response.data.result || response.data;
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
            examDuration: parsedResult.examDuration ?? parsedResult.duration ?? 0,
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
            rank: parsedResult.rank ?? parsedResult.currentRank,
          };
          
          console.log('📊 Final result data:', finalResult);
          setResult(finalResult);
          
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
                          <Ionicons name="checkmark-circle" size={32} color="#059669" />
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
                          <Ionicons name="close-circle" size={32} color="#DC2626" />
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
                          <Ionicons name="help-circle" size={32} color="#4F46E5" />
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
                          <Ionicons name="time" size={32} color="#D97706" />
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
    marginTop: 20,
    marginBottom: 24,
    marginHorizontal: 16,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ultraHeaderGradient: {
    padding: 28,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: -60,
    right: -40,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    bottom: -30,
    left: -30,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    top: 50,
    left: 30,
  },
  ultraHeaderTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    textAlign: 'center',
  },
  ultraHeaderSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    paddingHorizontal: 16,
  },
  massiveScoreContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  scoreRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 14,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  scoreInnerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 2,
    marginBottom: 12,
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
    fontSize: 52,
    fontWeight: '900',
    color: '#1F2937',
    lineHeight: 52,
    letterSpacing: -1.5,
  },
  scorePercentage: {
    fontSize: 20,
    fontWeight: '800',
    color: '#64748B',
    marginLeft: 2,
    letterSpacing: -0.5,
  },
  performancePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  performancePillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
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
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 64) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  statPercentage: {
    fontSize: 12,
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
});


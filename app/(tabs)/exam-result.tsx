import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface ExamResult {
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
}

export default function ExamResultScreen() {
  const router = useRouter();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Mock data - replace with actual API response
  const mockResult: ExamResult = {
    score: 0,
    totalQuestions: 2,
    correctAnswers: 0,
    wrongAnswers: 2,
    unattempted: 0,
    examDuration: 20,
    timeTakenSeconds: 18,
    timeTakenMinutes: 0,
    timeTakenFormatted: "18s",
    currentRank: 1,
    prizeAmount: 7200,
    examTitle: "Practise Exma UI",
    completedAt: "2025-08-21T08:58:19.825Z",
    accuracy: 0,
    timeEfficiency: 0,
    message: "Exam completed successfully! You scored 0% and secured rank #1"
  };

  useEffect(() => {
    setResult(mockResult);
    
    // Animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!result) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#EF4444';
    return '#6B7280';
  };

  const getScoreGradient = (score: number): [string, string] => {
    if (score >= 80) return ['#10B981', '#059669'];
    if (score >= 60) return ['#F59E0B', '#D97706'];
    if (score >= 40) return ['#EF4444', '#DC2626'];
    return ['#6B7280', '#4B5563'];
  };

  const accuracy = (result.correctAnswers / result.totalQuestions) * 100;
  const timeEfficiency = ((result.examDuration - result.timeTakenMinutes) / result.examDuration) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exam Results</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View 
            style={[
              styles.resultContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Main Score Card */}
            <View style={styles.mainScoreCard}>
              <LinearGradient
                colors={getScoreGradient(result.score)}
                style={styles.scoreGradient}
              >
                <View style={styles.scoreHeader}>
                  <Text style={styles.examTitle}>{result.examTitle}</Text>
                  <Text style={styles.completionTime}>
                    Completed at {new Date(result.completedAt).toLocaleTimeString()}
                  </Text>
                </View>
                
                <View style={styles.scoreCircle}>
                  <Text style={styles.scorePercentage}>{result.score}%</Text>
                  <Text style={styles.scoreLabel}>Your Score</Text>
                </View>

                <View style={styles.rankSection}>
                  <View style={styles.rankBadge}>
                    <Ionicons name="trophy" size={20} color="#FFD700" />
                    <Text style={styles.rankText}>Rank #{result.currentRank}</Text>
                  </View>
                  <Text style={styles.prizeText}>Prize: ₹{result.prizeAmount}</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Performance Metrics */}
            <View style={styles.metricsContainer}>
              <Text style={styles.sectionTitle}>Performance Analysis</Text>
              
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                  <Text style={styles.metricValue}>{result.correctAnswers}</Text>
                  <Text style={styles.metricLabel}>Correct</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </View>
                  <Text style={styles.metricValue}>{result.wrongAnswers}</Text>
                  <Text style={styles.metricLabel}>Wrong</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="help-circle" size={24} color="#6B7280" />
                  </View>
                  <Text style={styles.metricValue}>{result.unattempted}</Text>
                  <Text style={styles.metricLabel}>Unattempted</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricIcon}>
                    <Ionicons name="time" size={24} color="#8B5CF6" />
                  </View>
                  <Text style={styles.metricValue}>{result.timeTakenFormatted}</Text>
                  <Text style={styles.metricLabel}>Time Taken</Text>
                </View>
              </View>
            </View>

            {/* Progress Bars */}
            <View style={styles.progressContainer}>
              <Text style={styles.sectionTitle}>Detailed Breakdown</Text>
              
              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Accuracy</Text>
                  <Text style={styles.progressValue}>{accuracy.toFixed(1)}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${accuracy}%`,
                        backgroundColor: accuracy >= 80 ? '#10B981' : accuracy >= 60 ? '#F59E0B' : '#EF4444'
                      }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Time Efficiency</Text>
                  <Text style={styles.progressValue}>{timeEfficiency.toFixed(1)}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${timeEfficiency}%`,
                        backgroundColor: timeEfficiency >= 80 ? '#10B981' : timeEfficiency >= 60 ? '#F59E0B' : '#EF4444'
                      }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Question Completion</Text>
                  <Text style={styles.progressValue}>
                    {((result.correctAnswers + result.wrongAnswers) / result.totalQuestions * 100).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${((result.correctAnswers + result.wrongAnswers) / result.totalQuestions * 100)}%`,
                        backgroundColor: '#8B5CF6'
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>

            {/* Pie Chart Visualization */}
            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>Answer Distribution</Text>
              <View style={styles.pieChart}>
                <View style={styles.pieChartCenter}>
                  <Text style={styles.pieChartTotal}>{result.totalQuestions}</Text>
                  <Text style={styles.pieChartLabel}>Total</Text>
                </View>
                <View style={styles.pieChartSegments}>
                  <View 
                    style={[
                      styles.pieSegment, 
                      { 
                        backgroundColor: '#10B981',
                        transform: [{ rotate: '0deg' }],
                        width: `${(result.correctAnswers / result.totalQuestions) * 100}%`
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.pieSegment, 
                      { 
                        backgroundColor: '#EF4444',
                        transform: [{ rotate: `${(result.correctAnswers / result.totalQuestions) * 360}deg` }],
                        width: `${(result.wrongAnswers / result.totalQuestions) * 100}%`
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.pieSegment, 
                      { 
                        backgroundColor: '#6B7280',
                        transform: [{ rotate: `${((result.correctAnswers + result.wrongAnswers) / result.totalQuestions) * 360}deg` }],
                        width: `${(result.unattempted / result.totalQuestions) * 100}%`
                      }
                    ]} 
                  />
                </View>
              </View>
              
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Correct ({result.correctAnswers})</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Wrong ({result.wrongAnswers})</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
                  <Text style={styles.legendText}>Unattempted ({result.unattempted})</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.primaryButton}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.primaryButtonGradient}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Retake Exam</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton}>
                <Ionicons name="share" size={20} color="#8B5CF6" />
                <Text style={styles.secondaryButtonText}>Share Result</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  backgroundGradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
  },
  loadingText: {
    fontSize: 18,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultContainer: {
    paddingBottom: 40,
  },
  mainScoreCard: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  scoreGradient: {
    padding: 25,
    alignItems: 'center',
  },
  scoreHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  examTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  completionTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  rankSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  prizeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  metricsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  metricIcon: {
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  progressItem: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
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
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  pieChart: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  pieChartCenter: {
    alignItems: 'center',
    zIndex: 2,
  },
  pieChartTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  pieChartLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  pieChartSegments: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  pieSegment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  primaryButton: {
    flex: 1,
    marginRight: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginLeft: 8,
  },
}); 

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { fetchPYQResult, fetchPYQDetail } from '@/utils/pyqApi';

const { width } = Dimensions.get('window');

interface ResultData {
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
  totalMarks?: number;
  earnedMarks?: number;
}

export default function PYQResultScreen() {
  const params = useLocalSearchParams() as { examId?: string; attemptId?: string };
  const examId = params.examId!;
  const attemptId = params.attemptId!;
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scoreAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (!examId || !attemptId || !user?.token) return;
    loadResult();
  }, [examId, attemptId, user?.token]);

  async function loadResult() {
    setLoading(true);
    setError(null);
    try {
      const [resData, examData] = await Promise.all([
        fetchPYQResult(user!.token, examId, attemptId),
        fetchPYQDetail(user!.token, examId).catch(() => null),
      ]);
      const attempt = resData?.attempt ?? resData;
      const questions = Array.isArray(resData?.questions) ? resData.questions : [];
      const totalQ = questions.length || (attempt?.totalMarks ? 1 : 0);
      const correctCount = attempt?.correctCount ?? 0;
      const wrongCount = attempt?.wrongCount ?? 0;
      const unattemptedCount = attempt?.unattemptedCount ?? Math.max(0, totalQ - correctCount - wrongCount);
      const totalMarks = attempt?.totalMarks ?? 100;
      const earnedMarks = attempt?.score ?? 0;
      const scorePct = totalMarks > 0 ? (earnedMarks / totalMarks) * 100 : 0;
      const timeTakenSeconds = attempt?.timeTakenSeconds ?? 0;
      const timeTakenMinutes = Math.floor(timeTakenSeconds / 60);
      const examDuration = examData?.duration ?? 60;

      setResult({
        score: Math.round(scorePct * 10) / 10,
        totalQuestions: totalQ,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        unattempted: unattemptedCount,
        examDuration,
        timeTakenSeconds,
        timeTakenMinutes,
        timeTakenFormatted: `${timeTakenMinutes}m`,
        examTitle: examData?.title,
        totalMarks,
        earnedMarks,
      });

      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
        Animated.timing(scoreAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]).start(() => {
        if (scorePct >= 60) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          ])
        ).start();
      });
    } catch (e: any) {
      console.error('Failed to load PYQ result', e);
      setError(e?.message || 'Failed to load result');
    } finally {
      setLoading(false);
    }
  }

  const getScoreColor = (): [string, string] => {
    if (!result) return ['#667eea', '#764ba2'];
    if (result.score >= 80) return ['#10B981', '#059669'];
    if (result.score >= 60) return ['#F59E0B', '#D97706'];
    if (result.score >= 40) return ['#EF4444', '#DC2626'];
    return ['#6B7280', '#4B5563'];
  };

  const getBackgroundGradient = (): [string, string, string] => ['#FFFFFF', '#F8FAFF', '#F0F4FF'];

  const getPerformanceRating = () => {
    if (!result) return 'Keep Practicing';
    if (result.score >= 80) return 'Excellent! 🌟';
    if (result.score >= 60) return 'Good Job! 👍';
    if (result.score >= 40) return 'Keep Trying 💪';
    return 'Keep Practicing 📚';
  };

  if (loading || (!result && !error)) {
    return (
      <LinearGradient colors={getBackgroundGradient()} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </LinearGradient>
    );
  }

  if (error || !result) {
    return (
      <LinearGradient colors={getBackgroundGradient()} style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || 'No result data.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const accuracy = result.totalQuestions > 0 ? (result.correctAnswers / result.totalQuestions) * 100 : 0;
  const completion = result.totalQuestions > 0 ? ((result.correctAnswers + result.wrongAnswers) / result.totalQuestions) * 100 : 0;
  const speedPct = result.examDuration > 0 ? (result.timeTakenMinutes / result.examDuration) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient colors={getBackgroundGradient()} style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={[styles.resultContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Header - same as Practice */}
            <View style={styles.ultraHeaderSection}>
              <LinearGradient colors={getScoreColor()} style={styles.ultraHeaderGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.decorativeCircle1} />
                <View style={styles.decorativeCircle2} />
                <View style={styles.decorativeCircle3} />
                <Text style={styles.ultraHeaderTitle}>Exam Completed! 🎉</Text>
                {result.examTitle ? <Text style={styles.ultraHeaderSubtitle}>{result.examTitle}</Text> : null}
                <Animated.View style={[styles.massiveScoreContainer, { transform: [{ scale: scoreAnim }] }]}>
                  <Text style={styles.scoreLabel}>YOUR SCORE</Text>
                  <View style={styles.scoreRing}>
                    <LinearGradient colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,1)']} style={styles.scoreInnerRing}>
                      <View style={styles.scoreValueRow}>
                        <Text style={styles.massiveScore}>{result.score}</Text>
                        <Text style={styles.scorePercentage}>%</Text>
                      </View>
                    </LinearGradient>
                  </View>
                  <Animated.View style={[styles.performancePill, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={styles.performancePillText}>{getPerformanceRating()}</Text>
                  </Animated.View>
                </Animated.View>
              </LinearGradient>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              {(['overview', 'detailed'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 'overview' && (
              <>
                <View style={styles.statsSection}>
                  <Text style={styles.sectionTitle}>📊 Performance Metrics</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <LinearGradient colors={['#D1FAE5', '#A7F3D0']} style={styles.statGradient}>
                        <View style={styles.statIcon}><Ionicons name="checkmark-circle" size={24} color="#059669" /></View>
                        <Text style={styles.statValue}>{result.correctAnswers}</Text>
                        <Text style={styles.statLabel}>Correct</Text>
                        <Text style={styles.statPercentage}>{result.totalQuestions > 0 ? ((result.correctAnswers / result.totalQuestions) * 100).toFixed(0) : 0}%</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.statCard}>
                      <LinearGradient colors={['#FEE2E2', '#FECACA']} style={styles.statGradient}>
                        <View style={styles.statIcon}><Ionicons name="close-circle" size={24} color="#DC2626" /></View>
                        <Text style={styles.statValue}>{result.wrongAnswers}</Text>
                        <Text style={styles.statLabel}>Wrong</Text>
                        <Text style={styles.statPercentage}>{result.totalQuestions > 0 ? ((result.wrongAnswers / result.totalQuestions) * 100).toFixed(0) : 0}%</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.statCard}>
                      <LinearGradient colors={['#E0E7FF', '#C7D2FE']} style={styles.statGradient}>
                        <View style={styles.statIcon}><Ionicons name="help-circle" size={24} color="#4F46E5" /></View>
                        <Text style={styles.statValue}>{result.totalQuestions}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                        <Text style={styles.statPercentage}>Questions</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.statCard}>
                      <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.statGradient}>
                        <View style={styles.statIcon}><Ionicons name="time" size={24} color="#D97706" /></View>
                        <Text style={styles.statValue}>{result.timeTakenMinutes}</Text>
                        <Text style={styles.statLabel}>Minutes</Text>
                        <Text style={styles.statPercentage}>Time Used</Text>
                      </LinearGradient>
                    </View>
                  </View>
                </View>

                <View style={styles.achievementsCard}>
                  <Text style={styles.achievementsTitle}>🏅 Achievements Unlocked</Text>
                  <View style={styles.badgesGrid}>
                    {result.score >= 80 && (
                      <View style={styles.badge}>
                        <LinearGradient colors={['#FCD34D', '#F59E0B']} style={styles.badgeGradient}>
                          <Ionicons name="trophy" size={28} color="#fff" />
                          <Text style={styles.badgeText}>Top Scorer</Text>
                          <Text style={styles.badgeSubtext}>Score ≥ 80%</Text>
                        </LinearGradient>
                      </View>
                    )}
                    {result.examDuration > 0 && result.timeTakenMinutes < result.examDuration * 0.7 && (
                      <View style={styles.badge}>
                        <LinearGradient colors={['#60A5FA', '#3B82F6']} style={styles.badgeGradient}>
                          <Ionicons name="flash" size={28} color="#fff" />
                          <Text style={styles.badgeText}>Speed Demon</Text>
                          <Text style={styles.badgeSubtext}>Fast Solver</Text>
                        </LinearGradient>
                      </View>
                    )}
                    {result.correctAnswers === result.totalQuestions && result.totalQuestions > 0 && (
                      <View style={styles.badge}>
                        <LinearGradient colors={['#34D399', '#10B981']} style={styles.badgeGradient}>
                          <Ionicons name="star" size={28} color="#fff" />
                          <Text style={styles.badgeText}>Perfect!</Text>
                          <Text style={styles.badgeSubtext}>100% Score</Text>
                        </LinearGradient>
                      </View>
                    )}
                  </View>
                </View>

                {(result.totalMarks !== undefined || result.earnedMarks !== undefined) && (
                  <View style={styles.marksCard}>
                    <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.marksGradient}>
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
                            {(((result.earnedMarks ?? 0) / result.totalMarks) * 100).toFixed(1)}%
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </View>
                )}
              </>
            )}

            {activeTab === 'detailed' && (
              <>
                <View style={styles.circularProgressCard}>
                  <Text style={styles.cardTitle}>📊 Detailed Breakdown</Text>
                  <View style={styles.circularProgressRow}>
                    <View style={styles.circleWrapper}>
                      <View style={styles.progressCircle}>
                        <LinearGradient colors={['#10B981', '#059669']} style={styles.progressCircleFill}>
                          <Text style={styles.circleValue}>{accuracy.toFixed(0)}%</Text>
                        </LinearGradient>
                      </View>
                      <Text style={styles.circleLabel}>Accuracy</Text>
                    </View>
                    <View style={styles.circleWrapper}>
                      <View style={styles.progressCircle}>
                        <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.progressCircleFill}>
                          <Text style={styles.circleValue}>{completion.toFixed(0)}%</Text>
                        </LinearGradient>
                      </View>
                      <Text style={styles.circleLabel}>Completion</Text>
                    </View>
                    <View style={styles.circleWrapper}>
                      <View style={styles.progressCircle}>
                        <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.progressCircleFill}>
                          <Text style={styles.circleValue}>{speedPct.toFixed(0)}%</Text>
                        </LinearGradient>
                      </View>
                      <Text style={styles.circleLabel}>Speed</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.timeAnalyticsCard}>
                  <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.timeAnalyticsGradient}>
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
                          {result.totalQuestions > 0 ? (result.timeTakenMinutes / result.totalQuestions).toFixed(1) : 0}m
                        </Text>
                        <Text style={styles.timeStatLabel}>Avg/Question</Text>
                      </View>
                    </View>
                    <View style={styles.efficiencyBar}>
                      <View style={styles.efficiencyBarBg}>
                        <LinearGradient
                          colors={['#FB923C', '#F97316']}
                          style={[styles.efficiencyBarFill, { width: `${Math.min(speedPct, 100)}%` }]}
                        />
                      </View>
                    </View>
                  </LinearGradient>
                </View>
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
              </>
            )}

            <TouchableOpacity style={styles.doneBtn} onPress={() => router.push('/pyq')}>
              <Text style={styles.doneBtnText}>Back to PYQ</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#1F2937', fontWeight: '500', marginTop: 12 },
  errorText: { color: '#DC2626', textAlign: 'center', marginBottom: 12 },
  backBtn: { backgroundColor: '#667eea', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '800' },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 40, flexGrow: 1 },
  resultContainer: { paddingBottom: 40 },
  ultraHeaderSection: {
    marginTop: 12, marginBottom: 14, marginHorizontal: 16, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  ultraHeaderGradient: { padding: 16, paddingTop: 18, paddingBottom: 18, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  decorativeCircle1: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.12)', top: -30, right: -20 },
  decorativeCircle2: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.1)', bottom: -15, left: -15 },
  decorativeCircle3: { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.12)', top: 24, left: 16 },
  ultraHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 4, textAlign: 'center' },
  ultraHeaderSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.95)', fontWeight: '600', marginBottom: 10, textAlign: 'center', paddingHorizontal: 12 },
  massiveScoreContainer: { marginVertical: 8, alignItems: 'center' },
  scoreRing: {
    width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  scoreInnerRing: { width: 92, height: 92, borderRadius: 46, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  scoreLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.95)', letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' },
  scoreValueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  massiveScore: { fontSize: 36, fontWeight: '900', color: '#1F2937', lineHeight: 36 },
  scorePercentage: { fontSize: 14, fontWeight: '800', color: '#64748B', marginLeft: 2 },
  performancePill: {
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginTop: 8,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  performancePillText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 4, marginBottom: 16, marginHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  activeTab: { backgroundColor: '#4F46E5' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  activeTabText: { color: '#FFFFFF' },
  statsSection: { marginHorizontal: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { width: (width - 48) / 2, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  statGradient: { padding: 14, alignItems: 'center' },
  statIcon: { marginBottom: 6 },
  statValue: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 2 },
  statPercentage: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  achievementsCard: { marginHorizontal: 20, marginBottom: 20 },
  achievementsTitle: { fontSize: 22, fontWeight: '900', color: '#1F2937', marginBottom: 16, textAlign: 'center' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  badge: { width: (width - 64) / 2, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  badgeGradient: { paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  badgeText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  badgeSubtext: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  marksCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 20, overflow: 'hidden', shadowColor: '#D97706', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 10 },
  marksGradient: { padding: 24 },
  marksHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  marksTitle: { fontSize: 20, fontWeight: '900', color: '#92400E' },
  marksContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, paddingVertical: 16 },
  marksItem: { alignItems: 'center', flex: 1 },
  marksDivider: { width: 1, height: 40, backgroundColor: 'rgba(146,64,14,0.3)' },
  marksLabel: { fontSize: 13, fontWeight: '600', color: '#92400E', marginBottom: 8 },
  marksValue: { fontSize: 32, fontWeight: '900', color: '#D97706' },
  marksPercentageBox: { alignItems: 'center', paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12 },
  marksPercentageLabel: { fontSize: 13, fontWeight: '600', color: '#92400E', marginBottom: 6 },
  marksPercentageValue: { fontSize: 24, fontWeight: '800', color: '#D97706' },
  circularProgressCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  cardTitle: { fontSize: 20, fontWeight: '900', color: '#1F2937', marginBottom: 20 },
  circularProgressRow: { flexDirection: 'row', justifyContent: 'space-around' },
  circleWrapper: { alignItems: 'center' },
  progressCircle: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  progressCircleFill: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
  circleValue: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  circleLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  timeAnalyticsCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 20, overflow: 'hidden', shadowColor: '#FB923C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 10 },
  timeAnalyticsGradient: { padding: 24 },
  timeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  timeTitle: { fontSize: 20, fontWeight: '900', color: '#9A3412' },
  timeStatsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  timeStatItem: { alignItems: 'center' },
  timeStatValue: { fontSize: 24, fontWeight: '900', color: '#9A3412', marginBottom: 4 },
  timeStatLabel: { fontSize: 12, fontWeight: '600', color: '#B45309' },
  efficiencyBar: { marginTop: 8 },
  efficiencyBarBg: { height: 10, backgroundColor: '#FED7AA', borderRadius: 5, overflow: 'hidden' },
  efficiencyBarFill: { height: '100%', borderRadius: 5 },
  distributionCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  distributionRow: { flexDirection: 'row', justifyContent: 'space-around' },
  distributionItem: { alignItems: 'center' },
  distributionCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  distributionNumber: { fontSize: 32, fontWeight: '900', color: '#FFFFFF' },
  distributionLabel: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  doneBtn: { marginHorizontal: 20, marginTop: 8, marginBottom: 24, backgroundColor: '#7C3AED', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

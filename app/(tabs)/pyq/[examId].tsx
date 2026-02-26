import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Platform, Dimensions, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { fetchPYQDetail, startPYQAttempt } from '@/utils/pyqApi';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/constants/Colors';

const TAB_BAR_PADDING = 88;

export default function PYQDetailScreen() {
  const { examId } = useLocalSearchParams() as { examId?: string };
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<any>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!examId) return;
    loadDetail({ refresh: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  async function loadDetail({ refresh }: { refresh: boolean }) {
    if (!user?.token || !examId) return;
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchPYQDetail(user.token, examId);
      setExam(data);
    } catch (e: any) {
      console.error('Failed to load PYQ detail', e);
      setError(e?.message || 'Failed to load exam detail');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleStartAttempt() {
    if (!user?.token || !examId) return;
    setStarting(true);
      try {
      const res = await startPYQAttempt(user.token, examId);
      const attemptId = res?.attemptId || res?.attempt?.id;
      const duration = res?.duration ?? res?.attempt?.duration ?? null;
      if (!attemptId) throw new Error('No attemptId returned');
      router.push(`/pyq/${examId}/attempt?attemptId=${attemptId}${duration ? `&duration=${duration}` : ''}`);
    } catch (e: any) {
      console.error('Start attempt failed', e);
      setError(e?.message || 'Failed to start attempt');
    } finally {
      setStarting(false);
    }
  }

  function handleViewResult(attemptId: string) {
    router.push(`/pyq/${examId}/result/${attemptId}`);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: TAB_BAR_PADDING, flexGrow: exam ? 0 : 1 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDetail({ refresh: true })}
            tintColor={AppColors.primary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.error}>{error}</Text>
            <Text style={styles.helper}>Pull down to refresh</Text>
          </View>
        ) : !exam ? (
          <View style={styles.centered}>
            <Text style={styles.empty}>No exam data.</Text>
            <Text style={styles.helper}>Pull down to refresh</Text>
          </View>
        ) : (
          <>
            <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.headerInner}>
                <View style={styles.headerTopRow}>
                  <Text style={styles.title}>{exam.title}</Text>
                  <View style={styles.badge}>
                    <Ionicons name="school" size={14} color="#fff" />
                    <Text style={styles.badgeText}>{exam.examType}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>{exam.year} • {exam.subject ?? 'General'}</Text>
                <View style={styles.statsRow}>
                  <LinearGradient colors={['#EDE9FE', '#EEF2FF']} style={styles.statCard}>
                    <Text style={styles.statLabel}>Questions</Text>
                    <Text style={styles.statValue}>{exam._count?.questions ?? '-'}</Text>
                  </LinearGradient>
                  <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.statCard}>
                    <Text style={styles.statLabel}>Duration</Text>
                    <Text style={styles.statValue}>{exam.duration ?? '-'}m</Text>
                  </LinearGradient>
                  <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.statCard}>
                    <Text style={styles.statLabel}>Marks</Text>
                    <Text style={styles.statValue}>{exam.totalMarks ?? '-'}</Text>
                  </LinearGradient>
                </View>
              </View>
            </LinearGradient>

            <TouchableOpacity style={styles.startBtn} onPress={handleStartAttempt} disabled={starting} activeOpacity={0.9}>
              <LinearGradient colors={['#FF6B35', '#FF8E53']} style={styles.startBtnGradient}>
                <Text style={styles.startBtnText}>{starting ? 'Starting...' : 'Start Attempt'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Previous Attempts</Text>
            {Array.isArray(exam.myAttempts) && exam.myAttempts.length > 0 ? (
              exam.myAttempts.map((a: any) => (
                <View key={a.id} style={styles.attemptCardPremium}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attemptText}>Score: <Text style={styles.attemptScore}>{a.score}</Text>/{a.totalMarks}</Text>
                    <Text style={styles.attemptSubText}>Correct: {a.correctCount} • Wrong: {a.wrongCount}</Text>
                    <Text style={styles.attemptTime}>{new Date(a.completedAt).toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity style={styles.viewBtn} onPress={() => handleViewResult(a.id)}>
                    <Text style={styles.viewBtnText}>View result</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>You have no attempts yet.</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FC', paddingTop: 24 },
  container: { paddingBottom: 24, backgroundColor: 'transparent' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  helper: { marginTop: 10, color: '#94A3B8', fontWeight: '600' },
  headerGradient: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
  },
  headerInner: { padding: 18 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '900', color: '#fff', flex: 1, marginRight: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: 12 },
  meta: { color: 'rgba(255,255,255,0.9)', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', marginRight: 8 },
  statLabel: { color: '#475569', fontSize: 12, fontWeight: '700' },
  statValue: { fontSize: 18, fontWeight: '900', marginTop: 6, color: '#0F172A' },
  startBtn: { marginHorizontal: 16, marginTop: 18, borderRadius: 12, overflow: 'hidden', elevation: Platform.OS === 'android' ? 3 : 0 },
  startBtnGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  startBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 20, marginBottom: 12, marginLeft: 16, color: '#0F172A' },
  attemptCardPremium: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4, borderLeftWidth: 4, borderLeftColor: '#FF8E53' },
  attemptText: { fontWeight: '700', color: '#0F172A' },
  attemptScore: { color: '#FF6B35' },
  attemptSubText: { color: '#64748B', marginTop: 6, fontSize: 13 },
  attemptTime: { color: '#94a3b8', marginTop: 6, fontSize: 12 },
  viewBtn: { backgroundColor: '#7C3AED', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  viewBtnText: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#64748B', marginTop: 12 },
  error: { color: AppColors.error, textAlign: 'center', marginTop: 12 },
});


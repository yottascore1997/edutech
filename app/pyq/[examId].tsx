import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import CommonHeader from '@/components/CommonHeader';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { fetchPYQDetail, startPYQAttempt } from '@/utils/pyqApi';

export default function PYQDetailScreen() {
  const { examId } = useLocalSearchParams() as { examId?: string };
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<any>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!examId) return;
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  async function loadDetail() {
    if (!user?.token || !examId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPYQDetail(user.token, examId);
      setExam(data);
    } catch (e: any) {
      console.error('Failed to load PYQ detail', e);
      setError(e?.message || 'Failed to load exam detail');
    } finally {
      setLoading(false);
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
      // Navigate to attempt screen (query param) — include duration for timer
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
    <View style={{ flex: 1 }}>
      <CommonHeader showMainOptions={false} title={exam?.title || 'PYQ'} />
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : !exam ? (
          <Text style={styles.empty}>No exam data.</Text>
        ) : (
          <>
            <Text style={styles.title}>{exam.title}</Text>
            <Text style={styles.meta}>{exam.examType} • {exam.year} • {exam.subject ?? 'General'}</Text>
            <View style={styles.row}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Questions</Text>
                <Text style={styles.statValue}>{exam._count?.questions ?? '-'}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{exam.duration ?? '-'} min</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Total Marks</Text>
                <Text style={styles.statValue}>{exam.totalMarks ?? '-'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={handleStartAttempt} disabled={starting}>
              <Text style={styles.startBtnText}>{starting ? 'Starting...' : 'Start Attempt'}</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Previous Attempts</Text>
            {Array.isArray(exam.myAttempts) && exam.myAttempts.length > 0 ? (
              exam.myAttempts.map((a: any) => (
                <View key={a.id} style={styles.attemptCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attemptText}>Score: {a.score}/{a.totalMarks}</Text>
                    <Text style={styles.attemptSubText}>Correct: {a.correctCount} • Wrong: {a.wrongCount} • {new Date(a.completedAt).toLocaleString()}</Text>
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
  container: { padding: 16, backgroundColor: '#fff', paddingBottom: 80 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  meta: { color: '#6b7280', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  stat: { alignItems: 'center', flex: 1 },
  statLabel: { color: '#6b7280', fontSize: 12 },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 6 },
  startBtn: { backgroundColor: '#7C3AED', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  startBtnText: { color: '#fff', fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  attemptCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: '#f8fafc', marginBottom: 10 },
  attemptText: { fontWeight: '700' },
  attemptSubText: { color: '#6b7280', marginTop: 4, fontSize: 12 },
  viewBtn: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#7C3AED', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  viewBtnText: { color: '#7C3AED', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 12 },
  error: { color: 'red', textAlign: 'center', marginTop: 12 },
});


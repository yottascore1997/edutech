import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import CommonHeader from '@/components/CommonHeader';
import { useAuth } from '@/context/AuthContext';
import { fetchPYQList } from '@/utils/pyqApi';
import { PYQExam } from '@/types/pyq';
import { useRouter } from 'expo-router';

export default function PYQListScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<PYQExam[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string>('');
  const [examTypeFilter, setExamTypeFilter] = useState<string>('');

  async function loadList() {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (examTypeFilter) filters.examType = examTypeFilter;
      if (yearFilter) filters.year = Number(yearFilter);
      const data = await fetchPYQList(user.token, filters);
      setExams(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('Failed to load PYQ list', e);
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  function renderItem({ item }: { item: PYQExam }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/pyq/${item.id}`)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.examType} • {item.year} • {item.subject ?? 'General'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.count}>{item._count?.questions ?? '-' } Q</Text>
          <Text style={styles.attempts}>{item.myAttempts ?? 0} attempts</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CommonHeader showMainOptions={false} title="PYQ" />
      <View style={styles.container}>
        <Text style={styles.header}>Previous Year Papers</Text>

      <View style={styles.filters}>
        <TextInput
          placeholder="Year (e.g. 2023)"
          value={yearFilter}
          onChangeText={setYearFilter}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          placeholder="Exam type (optional)"
          value={examTypeFilter}
          onChangeText={setExamTypeFilter}
          style={[styles.input, { marginLeft: 8 }]}
        />
        <TouchableOpacity style={styles.filterBtn} onPress={loadList}>
          <Text style={{ color: 'white' }}>Apply</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 48 }}
          ListEmptyComponent={() => <Text style={styles.empty}>No exams found.</Text>}
        />
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  filters: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#f2f2f2' },
  filterBtn: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#5b21b6', borderRadius: 8, marginLeft: 8 },
  card: { flexDirection: 'row', padding: 14, borderRadius: 12, backgroundColor: '#fafafa', marginBottom: 10, alignItems: 'center', elevation: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  meta: { color: '#666', marginTop: 6 },
  count: { fontWeight: '700', color: '#111' },
  attempts: { color: '#666', fontSize: 12, marginTop: 4 },
  error: { color: 'red', marginTop: 12 },
  empty: { textAlign: 'center', marginTop: 24, color: '#666' },
});


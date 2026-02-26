import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Platform, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { fetchPYQList } from '@/utils/pyqApi';
import { PYQExam } from '@/types/pyq';
import { useRouter } from 'expo-router';

const TAB_BAR_PADDING = 88;

export default function PYQListScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exams, setExams] = useState<PYQExam[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string>('');
  const [examTypeFilter, setExamTypeFilter] = useState<string>('');

  async function loadList({ refresh }: { refresh: boolean }) {
    if (!user?.token) return;
    if (refresh) setRefreshing(true);
    else setLoading(true);
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
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!authLoading) loadList({ refresh: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const cardGradients = [
    ['#FDE68A', '#FECACA'],
    ['#EDE9FE', '#E0E7FF'],
    ['#E0F2FE', '#BAE6FD'],
    ['#FCE7F3', '#FBCFE8'],
  ];

  function renderItem({ item, index }: { item: PYQExam, index: number }) {
    const colors = cardGradients[index % cardGradients.length];
    const initials = (item.subject || item.examType || item.title || '').split(' ').map(s => s[0]).slice(0,2).join('');
    return (
      <TouchableOpacity onPress={() => router.push(`/pyq/${item.id}`)} activeOpacity={0.9} style={{ marginBottom: 12 }}>
        <LinearGradient colors={['#ffffff','#ffffff']} style={styles.card}>
          <LinearGradient colors={colors as [string,string]} style={styles.leftAccent} />
          <View style={styles.cardContent}>
            <View style={styles.avatar}>
              <LinearGradient colors={colors as [string,string]} style={styles.avatarInner}>
                <Text style={styles.avatarText}>{initials || 'PY'}</Text>
              </LinearGradient>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.pill}><Text style={styles.pillText}>{item.examType}</Text></View>
                <Text style={styles.meta}>• {item.year}</Text>
                {item.subject ? <Text style={[styles.meta, { marginLeft: 8 }]}>{item.subject}</Text> : null}
              </View>
            </View>
            <View style={styles.rightCol}>
              <View style={styles.countWrap}>
                <Text style={styles.count}>{item._count?.questions ?? '-'}</Text>
                <Text style={styles.countLabel}>Q</Text>
              </View>
              <Text style={styles.attempts}>{item.myAttempts ?? 0} attempts</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  function renderEmpty() {
    if (loading) {
      return <ActivityIndicator style={{ marginTop: 24 }} />;
    }
    if (error) {
      return (
        <View style={{ paddingTop: 16 }}>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.helper}>Pull down to refresh</Text>
        </View>
      );
    }
    return (
      <View style={{ paddingTop: 16 }}>
        <Text style={styles.empty}>No exams found.</Text>
        <Text style={styles.helper}>Pull down to refresh</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#F8FAFF', '#FFFFFF']} style={styles.screen}>
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
        <TouchableOpacity style={styles.filterBtn} onPress={() => loadList({ refresh: false })} activeOpacity={0.9}>
          <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.filterBtnGradient}>
            <Text style={styles.filterBtnText}>Apply</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={exams}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: TAB_BAR_PADDING, flexGrow: exams.length ? 0 : 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadList({ refresh: true })}
            tintColor={AppColors.primary}
          />
        }
      />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 24 },
  container: { flex: 1, padding: 16, backgroundColor: 'transparent' },
  header: { fontSize: 20, fontWeight: '800', marginBottom: 12, color: '#4F46E5' },
  filters: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#F7F9FF', borderWidth: 1, borderColor: '#E6E9FB' },
  filterBtn: { paddingVertical: 0, paddingHorizontal: 0, borderRadius: 8, marginLeft: 8, overflow: 'hidden' },
  filterBtnGradient: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  filterBtnText: { color: '#fff', fontWeight: '800' },
  card: { flexDirection: 'row', padding: 14, borderRadius: 12, backgroundColor: '#ffffff', marginBottom: 12, alignItems: 'center', borderLeftWidth: 6, borderLeftColor: '#7C3AED', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: Platform.OS === 'android' ? 2 : 0 },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  meta: { color: '#475569', marginTop: 6 },
  count: { fontWeight: '800', color: '#111', marginBottom: 4 },
  attempts: { color: '#64748B', fontSize: 12 },
  error: { color: AppColors.error, marginTop: 12 },
  helper: { textAlign: 'center', marginTop: 10, color: '#94A3B8', fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 24, color: '#64748B' },
  leftAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 12, overflow: 'hidden' },
  avatarInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  pill: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  pillText: { color: '#4F46E5', fontWeight: '800', fontSize: 12 },
  rightCol: { alignItems: 'flex-end', marginLeft: 12 },
  countWrap: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignItems: 'center' },
  countLabel: { fontSize: 12, color: '#475569' },
});


import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const TAB_BAR_PADDING = 88;

const CATEGORY_LABELS: Record<string, string> = {
  NATIONAL: 'National',
  INTERNATIONAL: 'International',
  ECONOMY: 'Economy',
  SPORTS: 'Sports',
  SCIENCE_TECH: 'Science & Tech',
  SCHEMES_REPORTS: 'Schemes & Reports',
  AWARDS: 'Awards',
  MISCELLANEOUS: 'Miscellaneous',
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMonthLabel(month: string) {
  try {
    const [y, m] = month.split('-').map(Number);
    return `${monthNames[m - 1] ?? month} ${y}`;
  } catch {
    return month;
  }
}

export default function CurrentAffairsMonthScreen() {
  const { month } = useLocalSearchParams() as { month?: string };
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!month || !user?.token) return;
    fetchData({ refresh: false });
  }, [month, user?.token]);

  async function fetchData({ refresh }: { refresh: boolean }) {
    if (!user?.token) return;
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [catsRes, entriesRes] = await Promise.all([
        apiFetchAuth(`/student/current-affairs/categories?month=${encodeURIComponent(month as string)}`, user.token),
        apiFetchAuth(`/student/current-affairs/entries?month=${encodeURIComponent(month as string)}`, user.token),
      ]);
      setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
      setEntries(Array.isArray(entriesRes.data) ? entriesRes.data : []);
      setSelectedCategory(null);
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error('Failed to load month data', e);
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filtered = selectedCategory ? entries.filter((r) => r.category === selectedCategory) : entries;

  function renderEntry({ item }: { item: any }) {
    const preview = String(item.content || '').slice(0, 120);
    const hasMore = (item.content || '').length > 120;
    return (
      <TouchableOpacity
        style={styles.entryCard}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/current-affairs/note', params: { entry: JSON.stringify(item) } })}
      >
        <View style={styles.entryHeader}>
          <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.entryIcon}>
            <Ionicons name="document-text" size={18} color="#4F46E5" />
          </LinearGradient>
          <Text style={styles.entryTitle} numberOfLines={2}>{item.title}</Text>
        </View>
        <Text style={styles.entryPreview}>{preview}{hasMore ? '…' : ''}</Text>
        <View style={styles.entryFooter}>
          <Text style={styles.entryCategory}>{CATEGORY_LABELS[item.category] ?? item.category}</Text>
          <Text style={styles.entryDate}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  function renderHeader() {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        <TouchableOpacity
          style={[styles.chip, selectedCategory === null && styles.chipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.chipText, selectedCategory === null && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, selectedCategory === c && styles.chipActive]}
            onPress={() => setSelectedCategory(selectedCategory === c ? null : c)}
          >
            <Text style={[styles.chipText, selectedCategory === c && styles.chipTextActive]}>
              {CATEGORY_LABELS[c] ?? c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  function renderEmpty() {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.helper}>Pull down to refresh</Text>
        </View>
      );
    }
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>No entries available.</Text>
        <Text style={styles.helper}>Pull down to refresh</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#FFFFFF','#F8FAFF']} style={styles.monthHeaderGradient}>
        <View style={styles.monthHeaderInner}>
          <Text style={styles.monthHeaderTitle}>{month ? formatMonthLabel(month) : 'Month'}</Text>
          <Text style={styles.monthHeaderSubtitle}>Filter by category to refine results</Text>
        </View>
      </LinearGradient>
      <View style={styles.container}>
        <FlatList
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderEntry}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: TAB_BAR_PADDING, flexGrow: filtered.length ? 0 : 1 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData({ refresh: true })}
              tintColor={AppColors.primary}
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 24 },
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: TAB_BAR_PADDING,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '600' },
  helper: { marginTop: 10, fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  // Increased height/padding so chip text isn't clipped on small screens / with larger fonts
  chipsScroll: { maxHeight: 80, minHeight: 56 },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', gap: 10 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: AppColors.primary },
  chipText: { color: '#475569', fontWeight: '700', fontSize: 14 },
  chipTextActive: { color: '#fff' },
  listContent: { padding: 16, paddingTop: 8 },
  entryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  entryIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  entryTitle: { fontWeight: '800', marginBottom: 8, fontSize: 16, color: '#1e293b' },
  entryPreview: { color: '#64748B', fontSize: 14, lineHeight: 20 },
  entryFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  entryCategory: { fontSize: 12, color: '#475569', fontWeight: '700' },
  entryDate: { fontSize: 12, color: '#94A3B8' },
  empty: { textAlign: 'center', color: '#64748B', fontSize: 15, fontWeight: '600' },
  error: { color: '#DC2626', textAlign: 'center', fontSize: 15, fontWeight: '600' },
  monthHeaderGradient: { paddingVertical: 14, paddingHorizontal: 16, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  monthHeaderInner: { paddingTop: 6 },
  monthHeaderTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  monthHeaderSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 6 },
});

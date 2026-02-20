import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import CommonHeader from '@/components/CommonHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { apiFetchAuth } from '@/constants/api';

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

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!month || !user?.token) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, user?.token]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [catsRes, entriesRes] = await Promise.all([
        apiFetchAuth(`/student/current-affairs/categories?month=${encodeURIComponent(month as string)}`, user!.token),
        apiFetchAuth(`/student/current-affairs/entries?month=${encodeURIComponent(month as string)}`, user!.token),
      ]);
      setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
      setEntries(Array.isArray(entriesRes.data) ? entriesRes.data : []);
      setSelectedCategory(null);
    } catch (e: any) {
      console.error('Failed to load month data', e);
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const filtered = selectedCategory ? entries.filter((r) => r.category === selectedCategory) : entries;

  function renderEntry({ item }: { item: any }) {
    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => router.push({ pathname: '/current-affairs/note', params: { entry: JSON.stringify(item) } })}
      >
        <Text style={styles.entryTitle}>{item.title}</Text>
        <Text style={styles.entryPreview}>{String(item.content || '').slice(0, 120)}{(item.content || '').length > 120 ? '…' : ''}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CommonHeader showMainOptions={false} title={month ? formatMonthLabel(month) : 'Month'} />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow} style={{ maxHeight: 56 }}>
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
                  <Text style={[styles.chipText, selectedCategory === c && styles.chipTextActive]}>{CATEGORY_LABELS[c] ?? c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filtered.length === 0 ? (
              <Text style={styles.empty}>No entries available.</Text>
            ) : (
              <FlatList data={filtered} keyExtractor={(it) => String(it.id)} renderItem={renderEntry} contentContainerStyle={{ padding: 16 }} />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  chipsRow: { paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
  chipActive: { backgroundColor: '#4F46E5' },
  chipText: { color: '#374151', fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  entryCard: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, marginBottom: 12 },
  entryTitle: { fontWeight: '800', marginBottom: 6 },
  entryPreview: { color: '#6b7280' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 24 },
  error: { color: 'red', textAlign: 'center', marginTop: 24 },
});


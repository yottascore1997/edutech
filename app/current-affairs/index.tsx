import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import CommonHeader from '@/components/CommonHeader';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { apiFetchAuth } from '@/constants/api';

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatMonthLabel(month: string) {
  try {
    const [y, m] = month.split('-').map(Number);
    return `${monthNames[m - 1] ?? month} ${y}`;
  } catch {
    return month;
  }
}

export default function CurrentAffairsMonthsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  async function fetchMonths() {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetchAuth('/student/current-affairs/months', user.token);
      setMonths(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      console.error('Failed to load months', e);
      setError(e?.message || 'Failed to load months');
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item }: { item: string }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/current-affairs/[month]', params: { month: item } })}>
        <Text style={styles.cardText}>{formatMonthLabel(item)}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CommonHeader showMainOptions={false} title="Current Affairs" />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : months.length === 0 ? (
          <Text style={styles.empty}>No current affairs available.</Text>
        ) : (
          <FlatList
            data={months}
            keyExtractor={(m) => m}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16 }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: { padding: 16, borderRadius: 10, backgroundColor: '#F8FAFC', marginBottom: 12 },
  cardText: { fontSize: 16, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 24 },
  error: { color: 'red', textAlign: 'center', marginTop: 24 },
});


import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';

const TAB_BAR_PADDING = 88;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING_H = 16;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING_H * 2 - CARD_GAP) / 2;

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

const CARD_GRADIENTS = [
  ['#EEF2FF', '#E0E7FF'],
  ['#FCE7F3', '#FBCFE8'],
  ['#ECFDF5', '#D1FAE5'],
  ['#FEF3C7', '#FDE68A'],
  ['#E0F2FE', '#BAE6FD'],
  ['#F3E8FF', '#E9D5FF'],
];

export default function CurrentAffairsMonthsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonths({ refresh: false });
  }, [user?.token]);

  async function fetchMonths({ refresh }: { refresh: boolean }) {
    if (!user?.token) return;
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await apiFetchAuth('/student/current-affairs/months', user.token);
      setMonths(Array.isArray(res.data) ? res.data : []);
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error('Failed to load months', e);
      setError(err?.message || 'Failed to load months');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function renderItem({ item, index }: { item: string; index: number }) {
    const colors = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={() => router.push({ pathname: '/current-affairs/[month]', params: { month: item } })}
        activeOpacity={0.85}
      >
        <LinearGradient colors={colors as [string, string]} style={styles.card}>
          <Text style={styles.cardText} numberOfLines={2}>{formatMonthLabel(item)}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  function renderEmpty() {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading months…</Text>
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
        <Text style={styles.empty}>No current affairs available.</Text>
        <Text style={styles.helper}>Pull down to refresh</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#FFFFFF', '#F8FAFF']} style={styles.headerGradient}>
        <View style={styles.headerInner}>
          <Text style={styles.headerTitle}>Current Affairs</Text>
          <Text style={styles.headerSubtitle}>Monthly digest — stay updated with latest events</Text>
        </View>
      </LinearGradient>
      <View style={styles.container}>
        <FlatList
          data={months}
          keyExtractor={(m) => m}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={months.length ? styles.row : undefined}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: TAB_BAR_PADDING, flexGrow: months.length ? 0 : 1 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchMonths({ refresh: true })}
              tintColor={AppColors.primary}
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 0 },
  headerGradient: { paddingVertical: 18, paddingHorizontal: 16, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, backgroundColor: '#fff' },
  headerInner: { paddingTop: 6 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  container: { flex: 1, marginTop: 12 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: TAB_BAR_PADDING,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '600' },
  helper: { marginTop: 10, fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  listContent: { padding: CARD_PADDING_H, paddingTop: 16 },
  row: { marginBottom: CARD_GAP, gap: CARD_GAP },
  cardWrapper: {
    flex: 1,
    maxWidth: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  card: {
    paddingVertical: 20,
    paddingHorizontal: 14,
    minHeight: 88,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cardText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  monthMeta: { marginTop: 8, fontSize: 12, color: '#475569' },
  empty: { textAlign: 'center', color: '#64748B', fontSize: 15, fontWeight: '600' },
  error: { color: '#DC2626', textAlign: 'center', fontSize: 15, fontWeight: '600' },
});

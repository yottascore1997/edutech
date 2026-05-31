import { apiFetchAuth } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = HomeTheme;

type Transaction = {
  id: string;
  userId: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
};

type FilterId = 'all' | 'deposit' | 'withdrawal' | 'winning' | 'deduction';

const FILTERS: { id: FilterId; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'all', label: 'All', icon: 'layers-outline', color: C.primary },
  { id: 'deposit', label: 'Deposits', icon: 'arrow-down-circle-outline', color: '#2563EB' },
  { id: 'withdrawal', label: 'Withdraw', icon: 'arrow-up-circle-outline', color: '#EF4444' },
  { id: 'winning', label: 'Winnings', icon: 'trophy-outline', color: C.success },
  { id: 'deduction', label: 'Spent', icon: 'game-controller-outline', color: '#D97706' },
];

function filterTransactions(list: Transaction[], filter: FilterId): Transaction[] {
  if (filter === 'all') return list;
  if (filter === 'deposit') return list.filter((t) => t.type === 'DEPOSIT');
  if (filter === 'withdrawal') return list.filter((t) => t.type === 'WITHDRAWAL');
  if (filter === 'winning') {
    return list.filter(
      (t) =>
        t.type === 'EXAM_WIN' ||
        t.type === 'WINNING' ||
        (t.type === 'BATTLE_QUIZ_ENTRY' && t.amount > 0),
    );
  }
  return list.filter(
    (t) =>
      t.type === 'DEDUCTION' ||
      t.type === 'EXAM_ENTRY' ||
      (t.type === 'BATTLE_QUIZ_ENTRY' && t.amount < 0),
  );
}

function formatType(type: string) {
  if (type === 'BATTLE_QUIZ_ENTRY') return 'Battle Quiz';
  if (type === 'DEPOSIT') return 'Deposit';
  if (type === 'WITHDRAWAL') return 'Withdrawal';
  if (type === 'EXAM_WIN' || type === 'WINNING') return 'Winnings';
  if (type === 'EXAM_ENTRY') return 'Exam Entry';
  return type.replace(/_/g, ' ');
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusStyle(status: string) {
  const s = String(status || '').toUpperCase();
  if (s === 'COMPLETED' || s === 'SUCCESS') return { bg: C.successLight, text: C.success };
  if (s === 'PENDING') return { bg: '#FEF3C7', text: '#D97706' };
  if (s === 'FAILED') return { bg: '#FEE2E2', text: '#EF4444' };
  return { bg: '#F3F4F6', text: C.inkMuted };
}

function txnIcon(type: string, amount: number): keyof typeof Ionicons.glyphMap {
  if (type === 'DEPOSIT') return 'arrow-down-circle';
  if (type === 'WITHDRAWAL') return 'arrow-up-circle';
  if (type === 'EXAM_WIN' || type === 'WINNING') return 'trophy';
  if (type === 'BATTLE_QUIZ_ENTRY') return 'game-controller';
  if (type === 'EXAM_ENTRY') return 'school';
  return amount >= 0 ? 'add-circle' : 'remove-circle';
}

export default function TransactionsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  const fetchTransactions = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      setError('Please log in again.');
      return;
    }

    try {
      setError(null);
      let response;
      try {
        response = await apiFetchAuth('/student/transactions', user.token);
      } catch {
        response = await apiFetchAuth('/student/wallet', user.token);
      }

      if (!response.ok || !response.data) {
        setError(response.data?.message || 'Failed to fetch transactions.');
        return;
      }

      let transactionsData: Transaction[] = [];
      const data = response.data;

      if (Array.isArray(data.transactions)) transactionsData = data.transactions;
      else if (Array.isArray(data)) transactionsData = data;
      else if (data.wallet?.transactions) transactionsData = data.wallet.transactions;
      else if (Array.isArray(data.data)) transactionsData = data.data;

      if (data.balance != null) setBalance(Number(data.balance));
      else if (data.wallet?.balance != null) setBalance(Number(data.wallet.balance));

      setTransactions(transactionsData);
    } catch (err: any) {
      if (err.status === 401) {
        setError('Session expired. Please log in again.');
        logout();
      } else {
        setError(err.data?.message || err.message || 'Failed to load transactions.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.token, logout]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const filtered = useMemo(
    () => filterTransactions(transactions, activeFilter),
    [transactions, activeFilter],
  );

  const filterTotal = useMemo(
    () => filtered.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0),
    [filtered],
  );

  const renderItem = ({ item }: { item: Transaction }) => {
    const positive = item.amount >= 0;
    const iconName = txnIcon(item.type, item.amount);
    const st = statusStyle(item.status);

    return (
      <View style={styles.txnCard}>
        <View style={[styles.txnIconWrap, { backgroundColor: positive ? C.successLight : '#FEE2E2' }]}>
          <Ionicons name={iconName} size={22} color={positive ? C.success : '#EF4444'} />
        </View>
        <View style={styles.txnBody}>
          <Text style={styles.txnTitle}>{formatType(item.type)}</Text>
          <Text style={styles.txnDate}>{formatDate(item.createdAt)}</Text>
          <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={[styles.txnAmount, { color: positive ? C.success : '#EF4444' }]}>
          {positive ? '+' : '-'}₹{Math.abs(item.amount).toFixed(2)}
        </Text>
      </View>
    );
  };

  if (!user && !loading) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-circle-outline" size={56} color={C.inkMuted} />
        <Text style={styles.msgText}>Please log in to view transactions</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/login')}>
          <Text style={styles.primaryBtnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.msgText}>Loading transactions…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingHorizontal: 24 }]}>
        <StatusBar barStyle="dark-content" />
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={[styles.msgText, { color: '#EF4444' }]}>{error}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={fetchTransactions}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={[C.bg, '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Transactions</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={20} color={C.inkSecondary} />
        </TouchableOpacity>
      </View>

      {/* Balance strip */}
      <View style={styles.balanceWrap}>
        <LinearGradient colors={[...C.btnGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.balanceStrip}>
          <View>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <Text style={styles.balanceValue}>₹{balance.toFixed(2)}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeNum}>{transactions.length}</Text>
            <Text style={styles.countBadgeLabel}>Total</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Filter chips */}
      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f.id;
            const count = filterTransactions(transactions, f.id).length;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, active && { borderColor: f.color, backgroundColor: `${f.color}14` }]}
                onPress={() => setActiveFilter(f.id)}
                activeOpacity={0.85}
              >
                <Ionicons name={f.icon} size={16} color={active ? f.color : C.inkMuted} style={styles.filterIcon} />
                <Text
                  style={[styles.filterChipText, active && { color: f.color }]}
                  numberOfLines={1}
                >
                  {f.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.filterCount, active && { backgroundColor: f.color }]}>
                    <Text style={[styles.filterCountText, active && { color: '#FFF' }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.summaryTotal}>₹{filterTotal.toFixed(2)}</Text>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={40} color={C.primary} />
            </View>
            <Text style={styles.emptyTitle}>No transactions</Text>
            <Text style={styles.emptySub}>
              {activeFilter === 'all'
                ? 'Your wallet activity will show up here.'
                : `No ${FILTERS.find((f) => f.id === activeFilter)?.label.toLowerCase()} yet.`}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  msgText: {
    marginTop: 12,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: C.inkSecondary,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: C.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { fontFamily: FontFamily.bold, fontSize: 15, color: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 6,
  },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: C.ink },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  balanceWrap: { paddingHorizontal: 16, marginBottom: 12 },
  balanceStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...C.shadowPurple,
  },
  balanceLabel: { fontFamily: FontFamily.medium, fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  balanceValue: { fontFamily: FontFamily.extraBold, fontSize: 22, color: '#FFF', marginTop: 2 },
  countBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countBadgeNum: { fontFamily: FontFamily.bold, fontSize: 18, color: '#FFF' },
  countBadgeLabel: { fontFamily: FontFamily.regular, fontSize: 10, color: 'rgba(255,255,255,0.85)' },
  filterWrap: {
    minHeight: 46,
    marginBottom: 4,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
    marginRight: 8,
  },
  filterIcon: { marginRight: 6 },
  filterChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    lineHeight: Platform.OS === 'android' ? 20 : 18,
    color: C.inkSecondary,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  filterCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 6,
  },
  filterCountText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    lineHeight: Platform.OS === 'android' ? 14 : 12,
    color: C.inkMuted,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  summaryText: { fontFamily: FontFamily.medium, fontSize: 13, color: C.inkMuted },
  summaryTotal: { fontFamily: FontFamily.bold, fontSize: 14, color: C.ink },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.borderLight,
    ...C.shadow,
  },
  txnIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txnBody: { flex: 1 },
  txnTitle: { fontFamily: FontFamily.semiBold, fontSize: 14, color: C.ink },
  txnDate: { fontFamily: FontFamily.regular, fontSize: 11, color: C.inkMuted, marginTop: 2 },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  statusText: { fontFamily: FontFamily.semiBold, fontSize: 10, textTransform: 'capitalize' },
  txnAmount: { fontFamily: FontFamily.bold, fontSize: 15 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: C.ink, marginBottom: 6 },
  emptySub: { fontFamily: FontFamily.regular, fontSize: 13, color: C.inkMuted, textAlign: 'center' },
});

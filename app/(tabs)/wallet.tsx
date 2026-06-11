import KYCDocumentForm from '@/components/KYCDocumentForm';
import RazorpayPaymentModal from '@/components/RazorpayPaymentModal';
import { useScreenLoadState } from '@/hooks/useScreenLoadState';
import { apiFetchAuth } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = HomeTheme;
const QUICK_AMOUNTS = [50, 100, 200, 500];
const ADD_MONEY_GRAD = ['#FBBF24', '#F59E0B', '#EA580C'] as const;

type Transaction = {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
};

function formatTxnType(type: string) {
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { refreshWalletAmount, walletAmount } = useWallet();
  const router = useRouter();
  const { beginFetch, endFetch, shouldBlockUI } = useScreenLoadState();

  const [walletData, setWalletData] = React.useState<{ balance: number; transactions: Transaction[] } | null>(() => ({
    balance: Number.parseFloat(walletAmount) || 0,
    transactions: [],
  }));
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [depositModalVisible, setDepositModalVisible] = React.useState(false);
  const [depositAmount, setDepositAmount] = React.useState('');
  const [depositLoading, setDepositLoading] = React.useState(false);
  const [kycModalVisible, setKycModalVisible] = React.useState(false);
  const [razorpayModalVisible, setRazorpayModalVisible] = React.useState(false);

  const fetchWalletData = React.useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    try {
      beginFetch(setLoading, setRefreshing);
      const response = await apiFetchAuth('/student/wallet', user.token);
      if (response.ok) {
        setWalletData({
          balance: Number(response.data?.balance ?? 0),
          transactions: Array.isArray(response.data?.transactions) ? response.data.transactions : [],
        });
        setError(null);
      } else {
        setError(response.data?.message || 'Failed to fetch wallet data.');
      }
    } catch (err: any) {
      if (err.status === 401) {
        setError('Session expired. Please log in again.');
        logout();
      } else {
        setError(err.data?.message || 'Failed to fetch wallet data.');
      }
    } finally {
      endFetch(setLoading, setRefreshing);
    }
  }, [user, logout, beginFetch, endFetch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchWalletData();
      await refreshWalletAmount();
    } finally {
      setRefreshing(false);
    }
  }, [fetchWalletData, refreshWalletAmount]);

  React.useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const balance = walletData?.balance ?? 0;
  const transactions = walletData?.transactions ?? [];
  const recentTxns = transactions.slice(0, 5);

  const openDeposit = (amount?: number) => {
    if (amount) setDepositAmount(String(amount));
    setDepositModalVisible(true);
  };

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!depositAmount || amt <= 0 || !user?.token) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }
    setDepositLoading(true);
    try {
      const response = await apiFetchAuth('/student/wallet/deposit', user.token, {
        method: 'POST',
        body: { amount: amt },
      });
      if (response.ok) {
        Alert.alert('Success', `₹${amt} added to your wallet`, [
          {
            text: 'OK',
            onPress: () => {
              setDepositModalVisible(false);
              setDepositAmount('');
              fetchWalletData();
              refreshWalletAmount();
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to deposit amount.');
      }
    } catch (err: any) {
      if (err.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.');
        logout();
      } else {
        Alert.alert('Error', err.data?.message || 'Failed to deposit amount.');
      }
    } finally {
      setDepositLoading(false);
    }
  };

  const handleRazorpaySuccess = () => {
    fetchWalletData();
    refreshWalletAmount();
    setRazorpayModalVisible(false);
  };

  if (shouldBlockUI(loading)) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadText}>Loading wallet…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingHorizontal: 24 }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorIconWrap}>
          <Ionicons name="alert-circle" size={40} color="#EF4444" />
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={fetchWalletData}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={[C.bg, '#FFFFFF']} style={StyleSheet.absoluteFill} />

      {/* Compact title — CommonHeader already handles safe area & back nav */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity style={styles.headerRefreshBtn} onPress={onRefresh} hitSlop={8}>
          <Ionicons name="refresh-outline" size={20} color={C.inkSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
        }
      >
        {/* Balance card — compact */}
        <View style={styles.heroWrap}>
          <LinearGradient colors={[...C.btnGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
            <View style={styles.heroOrb1} />
            <View style={styles.heroRow}>
              <View style={styles.heroLeft}>
                <View style={styles.heroBadge}>
                  <Ionicons name="wallet" size={12} color="#FFF" />
                  <Text style={styles.heroBadgeText}>Available Balance</Text>
                </View>
                <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
              </View>
              <TouchableOpacity onPress={() => openDeposit()} activeOpacity={0.9} style={styles.addMoneyWrap}>
                <LinearGradient
                  colors={[...ADD_MONEY_GRAD]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addMoneyBtn}
                >
                  <Ionicons name="add-circle" size={16} color="#FFF" />
                  <Text style={styles.addMoneyBtnText}>Add Money</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick amounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((amt) => (
              <TouchableOpacity key={amt} style={styles.quickChip} onPress={() => openDeposit(amt)} activeOpacity={0.85}>
                <Text style={styles.quickChipText}>₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage</Text>
          <View style={styles.actionCard}>
            <ActionRow
              icon="receipt-outline"
              iconBg="#EDE9FE"
              iconColor={C.primary}
              title="My Transactions"
              subtitle="View all deposits & winnings"
              onPress={() => router.push('/(tabs)/transactions')}
            />
            <View style={styles.divider} />
            <ActionRow
              icon="document-text-outline"
              iconBg="#FEF3C7"
              iconColor="#D97706"
              title="Upload KYC"
              subtitle="Complete verification to withdraw"
              onPress={() => setKycModalVisible(true)}
            />
            <View style={styles.divider} />
            <ActionRow
              icon="shield-checkmark-outline"
              iconBg={C.successLight}
              iconColor={C.success}
              title="KYC Status"
              subtitle="Check your verification status"
              onPress={() => router.push('/(tabs)/kyc-status')}
            />
            <View style={styles.divider} />
            <ActionRow
              icon="gift-outline"
              iconBg="#FCE7F3"
              iconColor="#DB2777"
              title="Refer & Earn"
              subtitle="Get ₹100 for each referral"
              onPress={() => router.push('/(tabs)/refer')}
            />
          </View>
        </View>

        {/* Recent transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {transactions.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.actionCard}>
            {recentTxns.length === 0 ? (
              <View style={styles.emptyTxn}>
                <Ionicons name="receipt-outline" size={36} color={C.inkMuted} />
                <Text style={styles.emptyTxnText}>No transactions yet</Text>
                <Text style={styles.emptyTxnSub}>Add money to get started</Text>
              </View>
            ) : (
              recentTxns.map((txn, i) => (
                <React.Fragment key={txn.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.txnRow}>
                    <View
                      style={[
                        styles.txnIcon,
                        { backgroundColor: txn.amount >= 0 ? C.successLight : '#FEE2E2' },
                      ]}
                    >
                      <Ionicons
                        name={txn.amount >= 0 ? 'arrow-down' : 'arrow-up'}
                        size={18}
                        color={txn.amount >= 0 ? C.success : '#EF4444'}
                      />
                    </View>
                    <View style={styles.txnInfo}>
                      <Text style={styles.txnTitle}>{formatTxnType(txn.type)}</Text>
                      <Text style={styles.txnDate}>{formatDate(txn.createdAt)}</Text>
                    </View>
                    <Text style={[styles.txnAmount, { color: txn.amount >= 0 ? C.success : '#EF4444' }]}>
                      {txn.amount >= 0 ? '+' : ''}₹{Math.abs(txn.amount).toFixed(2)}
                    </Text>
                  </View>
                </React.Fragment>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Deposit modal */}
      <Modal animationType="slide" transparent visible={depositModalVisible} onRequestClose={() => setDepositModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <LinearGradient colors={[...C.btnGradient]} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Money</Text>
              <TouchableOpacity onPress={() => setDepositModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </LinearGradient>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <View style={styles.amountInputWrap}>
                <Text style={styles.currencySym}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  placeholderTextColor={C.inkMuted}
                />
              </View>
              <View style={styles.quickRow}>
                {QUICK_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.quickChip, depositAmount === String(amt) && styles.quickChipActive]}
                    onPress={() => setDepositAmount(String(amt))}
                  >
                    <Text style={[styles.quickChipText, depositAmount === String(amt) && styles.quickChipTextActive]}>
                      ₹{amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Deposit Now — disabled; use Razorpay only
              <TouchableOpacity
                style={[styles.primaryBtn, depositLoading && styles.btnDisabled]}
                onPress={handleDeposit}
                disabled={depositLoading}
              >
                {depositLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Deposit Now</Text>
                )}
              </TouchableOpacity>
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>
              */}
              <TouchableOpacity
                style={styles.razorpayBtn}
                onPress={() => {
                  setDepositModalVisible(false);
                  setRazorpayModalVisible(true);
                }}
              >
                <Ionicons name="card-outline" size={20} color="#FFF" />
                <Text style={styles.razorpayBtnText}>Pay with Razorpay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KYCDocumentForm visible={kycModalVisible} onClose={() => setKycModalVisible(false)} onSuccess={() => {}} />

      <RazorpayPaymentModal
        visible={razorpayModalVisible}
        onClose={() => setRazorpayModalVisible(false)}
        onSuccess={handleRazorpaySuccess}
        userToken={user?.token || ''}
        userDetails={{
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phoneNumber || user?.phone || '',
        }}
      />
    </View>
  );
}

function ActionRow({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={C.inkMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  loadText: { marginTop: 12, fontFamily: FontFamily.medium, fontSize: 14, color: C.inkMuted },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: C.inkSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 6,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: C.ink,
  },
  headerRefreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  heroWrap: { paddingHorizontal: 16, marginTop: 0 },
  heroCard: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
    ...C.shadowPurple,
  },
  heroOrb1: {
    position: 'absolute',
    top: -24,
    right: -16,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroLeft: { flex: 1 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  heroBadgeText: { fontFamily: FontFamily.medium, fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  balanceAmount: {
    fontFamily: FontFamily.extraBold,
    fontSize: 26,
    color: '#FFF',
    letterSpacing: -0.5,
  },
  addMoneyWrap: { borderRadius: 10, overflow: 'hidden' },
  addMoneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addMoneyBtnText: { fontFamily: FontFamily.bold, fontSize: 12, color: '#FFF' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 15, color: C.ink, marginBottom: 10 },
  seeAll: { fontFamily: FontFamily.semiBold, fontSize: 13, color: C.primary, marginBottom: 12 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  quickChipActive: { borderColor: C.primary, backgroundColor: C.primarySoft },
  quickChipText: { fontFamily: FontFamily.semiBold, fontSize: 14, color: C.inkSecondary },
  quickChipTextActive: { color: C.primary },
  actionCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: C.borderLight,
    ...C.shadow,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12 },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionText: { flex: 1 },
  actionTitle: { fontFamily: FontFamily.semiBold, fontSize: 15, color: C.ink },
  actionSub: { fontFamily: FontFamily.regular, fontSize: 12, color: C.inkMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.borderLight, marginHorizontal: 12 },
  emptyTxn: { alignItems: 'center', paddingVertical: 28 },
  emptyTxnText: { fontFamily: FontFamily.semiBold, fontSize: 15, color: C.inkSecondary, marginTop: 10 },
  emptyTxnSub: { fontFamily: FontFamily.regular, fontSize: 13, color: C.inkMuted, marginTop: 4 },
  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12 },
  txnIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txnInfo: { flex: 1 },
  txnTitle: { fontFamily: FontFamily.semiBold, fontSize: 14, color: C.ink },
  txnDate: { fontFamily: FontFamily.regular, fontSize: 11, color: C.inkMuted, marginTop: 2 },
  txnAmount: { fontFamily: FontFamily.bold, fontSize: 14 },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    ...C.shadowPurple,
  },
  primaryBtnText: { fontFamily: FontFamily.bold, fontSize: 16, color: '#FFF' },
  btnDisabled: { opacity: 0.6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: '#FFF' },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { padding: 20 },
  inputLabel: { fontFamily: FontFamily.semiBold, fontSize: 14, color: C.inkSecondary, marginBottom: 10 },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    backgroundColor: C.bg,
    marginBottom: 14,
  },
  currencySym: { fontFamily: FontFamily.bold, fontSize: 20, color: C.inkMuted, marginRight: 8 },
  amountInput: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: 20, color: C.ink },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  orLine: { flex: 1, height: 1, backgroundColor: C.border },
  orText: { marginHorizontal: 12, fontFamily: FontFamily.medium, fontSize: 13, color: C.inkMuted },
  razorpayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.success,
    borderRadius: 14,
    paddingVertical: 15,
  },
  razorpayBtnText: { fontFamily: FontFamily.bold, fontSize: 16, color: '#FFF' },
});

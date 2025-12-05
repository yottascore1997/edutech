import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useFonts } from '@/hooks/useFonts';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

export default function TransactionsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const fonts = useFonts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState('deposit');
  const scrollY = React.useRef(new Animated.Value(0)).current;

  // Filter transactions based on active filter - moved before conditional returns
  const filteredTransactions = React.useMemo(() => {
    if (activeFilter === 'deposit') return transactions.filter(t => t.type === 'DEPOSIT');
    if (activeFilter === 'withdrawal') return transactions.filter(t => t.type === 'WITHDRAWAL');
    if (activeFilter === 'winning') return transactions.filter(t => t.type === 'WINNING');
    return transactions.filter(t => t.type === 'DEPOSIT');
  }, [transactions, activeFilter]);

  const fetchTransactions = async () => {
    if (!user?.token) {
      setLoading(false);
      setError('No authentication token found. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      

      
      // Try the transactions endpoint first, fallback to wallet endpoint
      let response;
      try {
        response = await apiFetchAuth('/student/transactions', user.token);

      } catch (err) {

        response = await apiFetchAuth('/student/wallet', user.token);

      }
      
      if (response.ok && response.data) {
        // Handle different possible response structures
        let transactionsData = [];
        let balanceData = 0;
        
        if (response.data.transactions) {
          transactionsData = response.data.transactions;
        } else if (Array.isArray(response.data)) {
          // If response.data is directly an array of transactions
          transactionsData = response.data;
        } else if (response.data.wallet && response.data.wallet.transactions) {
          // If transactions are nested under wallet object
          transactionsData = response.data.wallet.transactions;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // If transactions are nested under data object
          transactionsData = response.data.data;
        }
        
        if (response.data.balance !== undefined) {
          balanceData = response.data.balance;
        } else if (response.data.wallet && response.data.wallet.balance !== undefined) {
          balanceData = response.data.wallet.balance;
        }
        


        
        setTransactions(transactionsData);
        setError(null);
      } else {
        const errorMessage = response.data?.message || 'Failed to fetch transactions. Please try again.';
        console.error('API response not ok:', response);
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      
      if (err.status === 401) {
        setError('Session expired. Please log in again.');
        logout();
      } else if (err.status === 404) {
        setError('Transactions endpoint not found. Please contact support.');
      } else if (err.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.message) {
        setError(`Network error: ${err.message}`);
      } else if (err.data?.message) {
        setError(err.data.message);
      } else {
        setError('Failed to fetch transactions. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null); // Clear any previous errors
    try {
      await fetchTransactions();
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      // Don't set error here as fetchTransactions already handles it
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {


    fetchTransactions();
  }, []);

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'BATTLE_QUIZ_ENTRY':
        return 'Battle Quiz Entry';
      case 'DEPOSIT':
        return 'Deposit';
      case 'WITHDRAWAL':
        return 'Withdrawal';
      case 'WINNING':
        return 'Winning';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'BATTLE_QUIZ_ENTRY':
        return 'game-controller';
      case 'DEPOSIT':
        return 'add-circle';
      case 'WITHDRAWAL':
        return 'remove-circle';
      case 'WINNING':
        return 'trophy';
      default:
        return 'card';
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return '#10B981'; // Green for positive
    if (amount < 0) return '#EF4444'; // Red for negative
    return '#F59E0B'; // Orange for neutral
  };

  const getTransactionBackground = (type: string, amount: number) => {
    if (amount > 0) return 'rgba(16, 185, 129, 0.1)'; // Light green
    if (amount < 0) return 'rgba(239, 68, 68, 0.1)'; // Light red
    return 'rgba(245, 158, 11, 0.1)'; // Light orange
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SUCCESS':
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          text: '#10B981',
          border: 'rgba(16, 185, 129, 0.2)'
        };
      case 'PENDING':
        return {
          bg: 'rgba(245, 158, 11, 0.1)',
          text: '#F59E0B',
          border: 'rgba(245, 158, 11, 0.2)'
        };
      case 'FAILED':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          text: '#EF4444',
          border: 'rgba(239, 68, 68, 0.2)'
        };
      default:
        return {
          bg: 'rgba(107, 114, 128, 0.1)',
          text: '#6B7280',
          border: 'rgba(107, 114, 128, 0.2)'
        };
    }
  };

  const renderTransactionItem = ({ item, index }: { item: Transaction; index: number }) => {
    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionContent}>
          <View style={styles.transactionLeft}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: getTransactionBackground(item.type, item.amount) }
            ]}>
              {item.type === 'DEPOSIT' ? (
                <MaterialIcons 
                  name="add-circle" 
                  size={26} 
                  color={getTransactionColor(item.type, item.amount)} 
                />
              ) : item.type === 'WITHDRAWAL' ? (
                <MaterialIcons 
                  name="remove-circle" 
                  size={26} 
                  color={getTransactionColor(item.type, item.amount)} 
                />
              ) : item.type === 'WINNING' ? (
                <FontAwesome5 
                  name="trophy" 
                  size={22} 
                  color={getTransactionColor(item.type, item.amount)} 
                />
              ) : (
                <Ionicons 
                  name={getTransactionIcon(item.type) as any} 
                  size={24} 
                  color={getTransactionColor(item.type, item.amount)} 
                />
              )}
            </View>
            <View style={styles.transactionInfo}>
              <Text style={fonts.subheaderLarge}>{formatTransactionType(item.type)}</Text>
              <Text style={fonts.greyMedium}>{formatTransactionDate(item.createdAt)}</Text>
            </View>
          </View>
          
          <View style={styles.transactionRight}>
            <Text style={[
              fonts.amountSmall,
              { color: getTransactionColor(item.type, item.amount) }
            ]}>
              {item.amount > 0 ? '+' : ''}₹{Math.abs(item.amount).toFixed(2)}
            </Text>
            <View style={[
              styles.statusBadge,
              { 
                backgroundColor: getStatusColor(item.status).bg,
                borderColor: getStatusColor(item.status).border
              }
            ]}>
              <Text style={[
                fonts.captionSmall,
                { 
                  color: getStatusColor(item.status).text,
                  fontSize: 12,
                  fontWeight: '600',
                  letterSpacing: 0.2
                }
              ]}>{item.status}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    // Calculate header animation values
    const headerHeight = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [120, 80],
      extrapolate: 'clamp'
    });

    const headerTitleSize = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [28, 22],
      extrapolate: 'clamp'
    });

    const headerOpacity = scrollY.interpolate({
      inputRange: [0, 60, 90],
      outputRange: [1, 0.3, 0],
      extrapolate: 'clamp'
    });

    return (
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Background Pattern */}
          <View style={styles.headerPattern}>
            <View style={styles.patternCircle1} />
            <View style={styles.patternCircle2} />
            <View style={styles.patternCircle3} />
          </View>
          
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="receipt" size={28} color="#FFFFFF" />
              <Animated.Text style={[styles.headerTitle, { fontSize: headerTitleSize }]}>My Transactions</Animated.Text>
            </View>


          </View>
        </LinearGradient>

        {/* Filter tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              activeFilter === 'deposit' && styles.activeFilterTab,
              { backgroundColor: activeFilter === 'deposit' ? 'rgba(16, 185, 129, 0.1)' : 'transparent' }
            ]}
            onPress={() => setActiveFilter('deposit')}
          >
            <View style={styles.filterContent}>
              <MaterialIcons 
                name="add-circle" 
                size={18} 
                color={activeFilter === 'deposit' ? '#10B981' : '#6B7280'} 
                style={styles.filterIcon}
              />
              <Text style={[
                fonts.bodyMedium, 
                activeFilter === 'deposit' && { ...styles.activeFilterText, color: '#10B981' }
              ]}>Deposits</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              activeFilter === 'withdrawal' && styles.activeFilterTab,
              { backgroundColor: activeFilter === 'withdrawal' ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }
            ]}
            onPress={() => setActiveFilter('withdrawal')}
          >
            <View style={styles.filterContent}>
              <MaterialIcons 
                name="remove-circle" 
                size={18} 
                color={activeFilter === 'withdrawal' ? '#EF4444' : '#6B7280'} 
                style={styles.filterIcon}
              />
              <Text style={[
                fonts.bodyMedium, 
                activeFilter === 'withdrawal' && { ...styles.activeFilterText, color: '#EF4444' }
              ]}>Withdraw</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              activeFilter === 'winning' && styles.activeFilterTab,
              { backgroundColor: activeFilter === 'winning' ? 'rgba(245, 158, 11, 0.1)' : 'transparent' }
            ]}
            onPress={() => setActiveFilter('winning')}
          >
            <View style={styles.filterContent}>
              <FontAwesome5 
                name="trophy" 
                size={16} 
                color={activeFilter === 'winning' ? '#F59E0B' : '#6B7280'} 
                style={styles.filterIcon}
              />
              <Text style={[
                fonts.bodyMedium, 
                activeFilter === 'winning' && { ...styles.activeFilterText, color: '#F59E0B' }
              ]}>Winnings</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // Wait for user to be loaded
  if (!user && !loading) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContent}>
          <Ionicons name="person-circle" size={64} color="#6B7280" />
          <Text style={styles.errorText}>Please log in to view transactions</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.push('/login')}>
            <Text style={styles.retryButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading Transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.errorSubtext}>
            Please check your internet connection and try again.
          </Text>
          <View style={styles.errorButtonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTransactions}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.debugButton} 
              onPress={() => {


                fetchTransactions();
              }}
            >
              <Text style={styles.debugButtonText}>Debug & Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {renderHeader()}
      
      <Animated.FlatList
        data={filteredTransactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
            title="Pull to refresh"
            titleColor="#4F46E5"
            progressBackgroundColor="#f8fafc"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt" size={64} color="#8B5CF6" />
            </View>
            <Text style={[fonts.headerMedium, {
              fontSize: 22,
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: 8,
              letterSpacing: 0.3,
              textAlign: 'center'
            }]}>No Transactions Yet</Text>
            <Text style={[fonts.bodyMedium, {
              fontSize: 15,
              color: '#64748B',
              textAlign: 'center',
              lineHeight: 22,
              letterSpacing: 0.2,
              marginHorizontal: 10,
              marginBottom: 10
            }]}>
              {activeFilter === 'deposit' 
                ? 'Start your journey by adding funds to your wallet. Make a deposit to participate in quizzes and win exciting rewards!'
                : activeFilter === 'withdrawal'
                ? 'No withdraw transactions found. Win some quizzes and earn rewards to make withdrawals!'
                : 'No winnings yet. Participate in quizzes to win rewards and see your earnings here!'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    marginRight: 6,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    height: 120,
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  patternCircle1: {
    position: 'absolute',
    top: 15,
    right: 25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 30,
    left: 15,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  patternCircle3: {
    position: 'absolute',
    top: 45,
    left: 40,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: -25,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    padding: 4,
    zIndex: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 2,
  },
  activeFilterTab: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  activeFilterText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(79, 70, 229, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    overflow: 'hidden',
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    elevation: 0,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 8,
  },
  transactionRight: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    elevation: 0,
    borderWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    margin: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
});

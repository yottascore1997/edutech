import { apiFetchAuth } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    FlatList,
    Linking,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface ExamNotification {
  id: string;
  title: string;
  description: string;
  year: number;
  month: number;
  applyLastDate: string;
  applyLink: string;
  createdAt: string;
  updatedAt: string;
  logoUrl?: string;
}

export default function ExamNotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<ExamNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'deadline' | 'newest' | 'priority'>('priority');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const categories = ['All', 'SSC', 'UPSC', 'Railway', 'Banking', 'State Exams', 'Others'];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiFetchAuth('/student/exam-notifications', user.token);
      if (response.ok) {
        setNotifications(response.data);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to fetch notifications');
      }
    } catch (err: any) {
      setError('Failed to fetch exam notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  };

  const getDaysRemaining = (lastDate: string) => {
    const today = new Date();
    const lastDateObj = new Date(lastDate);
    const diffTime = lastDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusInfo = (daysLeft: number) => {
    if (daysLeft < 0) {
      return { text: 'Expired', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
    } else if (daysLeft <= 7) {
      return { text: 'Urgent', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' };
    } else {
      return { text: 'Active', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' };
    }
  };

  const handleApplyPress = (link: string) => {
    if (link) {
      Linking.openURL(link);
    }
  };

  const handleNotificationPress = (notification: ExamNotification) => {
    router.push(`/exam-notification/${notification.id}` as any);
  };

  // Priority-based sorting and filtering
  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(notif =>
        notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(notif =>
        notif.title.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Sort logic
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const daysA = getDaysRemaining(a.applyLastDate);
        const daysB = getDaysRemaining(b.applyLastDate);
        
        // Priority: Urgent first, then active, then expired
        const priorityA = daysA < 0 ? 3 : daysA <= 7 ? 1 : 2;
        const priorityB = daysB < 0 ? 3 : daysB <= 7 ? 1 : 2;
        
        if (priorityA !== priorityB) return priorityA - priorityB;
        return daysA - daysB;
      } else if (sortBy === 'deadline') {
        return new Date(a.applyLastDate).getTime() - new Date(b.applyLastDate).getTime();
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [notifications, searchQuery, selectedCategory, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = notifications.length;
    const urgent = notifications.filter(n => {
      const days = getDaysRemaining(n.applyLastDate);
      return days >= 0 && days <= 7;
    }).length;
    const active = notifications.filter(n => getDaysRemaining(n.applyLastDate) > 7).length;
    const expired = notifications.filter(n => getDaysRemaining(n.applyLastDate) < 0).length;
    
    return { total, urgent, active, expired };
  }, [notifications]);

  const renderNotificationItem = useCallback(({ item, index }: { item: ExamNotification; index: number }) => {
    const daysLeft = getDaysRemaining(item.applyLastDate);
    const statusInfo = getStatusInfo(daysLeft);
    const isExpired = daysLeft < 0;
    const isUrgent = daysLeft <= 7 && daysLeft >= 0;
    const isExpanded = expandedCard === item.id;

    // Flash Animation for card
    const flashAnim = new Animated.Value(1);
    
    const startFlash = () => {
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Pulsating animation for days left badge (without hooks)
    const pulseAnim = new Animated.Value(1);
    
    // Start pulsating animation if not expired
    if (!isExpired) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return (
      <Animated.View style={{ opacity: flashAnim }}>
        <TouchableOpacity
          style={[
            styles.notificationCard,
            {
              backgroundColor: isUrgent ? 'rgba(245, 158, 11, 0.05)' : 
                             isExpired ? 'rgba(239, 68, 68, 0.05)' : 
                             'rgba(16, 185, 129, 0.05)',
              borderLeftWidth: 4,
              borderLeftColor: isExpired ? '#EF4444' : isUrgent ? '#F59E0B' : '#10B981'
            }
          ]}
          onPress={() => setExpandedCard(isExpanded ? null : item.id)}
          activeOpacity={0.7}
        >
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {isUrgent && (
                  <View style={styles.urgentBadge}>
                    <Ionicons name="alert-circle" size={14} color="#FFF" />
                  </View>
                )}
                <Text style={styles.examTitle} numberOfLines={isExpanded ? undefined : 2}>
                  {item.title}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Text style={styles.statusText}>
                {statusInfo.text}
              </Text>
            </View>
          </View>

          <Text style={styles.examDescription} numberOfLines={isExpanded ? undefined : 2}>
            {item.description}
          </Text>

          {/* Countdown Timer for Urgent */}
          {isUrgent && !isExpanded && (
            <View style={styles.countdownContainer}>
              <Ionicons name="time-outline" size={16} color="#EF4444" />
              <Animated.Text 
                style={[
                  styles.countdownText, 
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                {daysLeft === 0 ? '⚠️ LAST DAY TO APPLY!' : `⏰ ${daysLeft} ${daysLeft === 1 ? 'DAY' : 'DAYS'} LEFT`}
              </Animated.Text>
            </View>
          )}

          <View style={styles.examInfoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color="#047857" />
              <Text style={styles.infoText}>
                Last Date: {formatDate(item.applyLastDate)}
              </Text>
            </View>
          </View>

          {/* Expanded Details */}
          {isExpanded && (
            <View style={styles.expandedSection}>
              <View style={styles.divider} />
              
              <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={18} color="#6366F1" />
                <Text style={styles.detailLabel}>Notification ID:</Text>
                <Text style={styles.detailValue}>{item.id.substring(0, 8)}...</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={18} color="#10B981" />
                <Text style={styles.detailLabel}>Posted On:</Text>
                <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
              </View>

              {!isExpired && (
                <View style={styles.detailRow}>
                  <Ionicons name="hourglass-outline" size={18} color="#F59E0B" />
                  <Text style={styles.detailLabel}>Days Remaining:</Text>
                  <Text style={[styles.detailValue, { color: isUrgent ? '#EF4444' : '#10B981', fontWeight: '700' }]}>
                    {daysLeft} {daysLeft === 1 ? 'Day' : 'Days'}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => {
                  startFlash();
                  setTimeout(() => handleNotificationPress(item), 300);
                }}
              >
                <Text style={styles.viewDetailsText}>View Full Details</Text>
                <Ionicons name="arrow-forward-circle" size={20} color="#6366F1" />
              </TouchableOpacity>
            </View>
          )}

          {item.applyLink && (
            <TouchableOpacity
              style={styles.applyNowButton}
              onPress={(e) => {
                e.stopPropagation();
                handleApplyPress(item.applyLink);
              }}
            >
              <LinearGradient
                colors={isUrgent ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.applyButtonGradient}
              >
                <Text style={styles.applyButtonText}>
                  {isUrgent ? '⚡ Apply Now (Urgent)' : 'Apply Online'}
                </Text>
                <Ionicons name="open-outline" size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6B7280" 
          style={styles.chevronIcon} 
        />
      </TouchableOpacity>
      </Animated.View>
    );
  }, [expandedCard]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="notifications-off-outline" size={64} color="#8B5CF6" />
      </View>
      <Text style={styles.emptyTitle}>No Exam Notifications</Text>
      <Text style={styles.emptyMessage}>
        You'll see exam notifications here when they're available.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading exam notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      
      {/* Professional Header */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="newspaper" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Exam Notifications</Text>
              <Text style={styles.headerSubtitle}>
                Official Recruitment Updates
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Statistics Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={[styles.statItem, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>⚡ {stats.urgent}</Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={[styles.statItem, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#6B7280' }]}>{stats.expired}</Text>
          <Text style={styles.statLabel}>Expired</Text>
        </View>
      </View>

      {/* Search & Sort Section */}
      <View style={styles.searchSortSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exams..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort:</Text>
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'priority' && styles.sortButtonActive]}
              onPress={() => setSortBy('priority')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'priority' && styles.sortButtonTextActive]}>
                Priority
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'deadline' && styles.sortButtonActive]}
              onPress={() => setSortBy('deadline')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'deadline' && styles.sortButtonTextActive]}>
                Deadline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'newest' && styles.sortButtonActive]}
              onPress={() => setSortBy('newest')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'newest' && styles.sortButtonTextActive]}>
                Newest
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  selectedCategory === category 
                    ? ['#8B5CF6', '#7C3AED'] 
                    : ['#FFFFFF', '#FFFFFF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryChipGradient}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>
                  {category}
                </Text>
                {selectedCategory === category && (
                  <View style={styles.categoryBadge}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredAndSortedNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DB2777',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 3,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Statistics Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },

  // Search & Sort Section
  searchSortSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryChip: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipActive: {
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  categoryBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  urgentBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  examDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 10,
  },
  examInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
  },
  daysLeftBadge: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  applyNowButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chevronIcon: {
    marginLeft: 8,
    marginTop: 4,
  },

  // Countdown Timer
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Expanded Section
  expandedSection: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
});

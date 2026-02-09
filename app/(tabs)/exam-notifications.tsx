import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const { selectedCategory: globalCategory } = useCategory();
  const [notifications, setNotifications] = useState<ExamNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const categories = ['All', 'SSC', 'UPSC', 'Railway', 'Banking', 'State Exams', 'Others'];

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch {
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
    if (link) Linking.openURL(link);
  };

  const handleNotificationPress = (notification: ExamNotification) => {
    router.push(`/exam-notification/${notification.id}` as any);
  };

  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((notif) => notif.title.toLowerCase().includes(q) || notif.description.toLowerCase().includes(q));
    }

    const categoryToFilter = globalCategory || (selectedCategory !== 'All' ? selectedCategory : null);
    if (categoryToFilter) {
      const c = categoryToFilter.toLowerCase();
      filtered = filtered.filter((notif) => notif.title.toLowerCase().includes(c) || notif.description?.toLowerCase().includes(c));
    }

    filtered.sort((a, b) => {
      const daysA = getDaysRemaining(a.applyLastDate);
      const daysB = getDaysRemaining(b.applyLastDate);
      const priorityA = daysA < 0 ? 3 : daysA <= 7 ? 1 : 2;
      const priorityB = daysB < 0 ? 3 : daysB <= 7 ? 1 : 2;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return daysA - daysB;
    });

    return filtered;
  }, [notifications, searchQuery, selectedCategory, globalCategory]);

  const renderNotificationItem = useCallback(
    ({ item }: { item: ExamNotification }) => {
      const daysLeft = getDaysRemaining(item.applyLastDate);
      const statusInfo = getStatusInfo(daysLeft);
      const isExpired = daysLeft < 0;
      const isUrgent = daysLeft <= 7 && daysLeft >= 0;
      const isExpanded = expandedCard === item.id;

      const flashAnim = new Animated.Value(1);
      const startFlash = () => {
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      };

      const pulseAnim = new Animated.Value(1);
      if (!isExpired) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, easing: Easing.ease, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
          ])
        ).start();
      }

      return (
        <Animated.View style={{ opacity: flashAnim }}>
          <TouchableOpacity
            style={[
              styles.notificationCard,
              {
                backgroundColor: isUrgent ? 'rgba(245, 158, 11, 0.05)' : isExpired ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                borderLeftWidth: 4,
                borderLeftColor: isExpired ? '#EF4444' : isUrgent ? '#F59E0B' : '#10B981',
              },
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
                  <Text style={styles.statusText}>{statusInfo.text}</Text>
                </View>
              </View>

              <Text style={styles.examDescription} numberOfLines={isExpanded ? undefined : 2}>
                {item.description}
              </Text>

              {isUrgent && !isExpanded && (
                <View style={styles.countdownContainer}>
                  <Ionicons name="time-outline" size={16} color="#EF4444" />
                  <Animated.Text style={[styles.countdownText, { transform: [{ scale: pulseAnim }] }]}>
                    {daysLeft === 0 ? '⚠️ LAST DAY TO APPLY!' : `⏰ ${daysLeft} ${daysLeft === 1 ? 'DAY' : 'DAYS'} LEFT`}
                  </Animated.Text>
                </View>
              )}

              <View style={styles.examInfoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={16} color="#047857" />
                  <Text style={styles.infoText}>Last Date: {formatDate(item.applyLastDate)}</Text>
                </View>
              </View>

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
                    <Text style={styles.applyButtonText}>{isUrgent ? '⚡ Apply Now (Urgent)' : 'Apply Online'}</Text>
                    <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7280" style={styles.chevronIcon} />
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [expandedCard]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="notifications-outline" size={48} color="#6366F1" />
      </View>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptyMessage}>When new exam dates or application deadlines are added, they’ll show up here.</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading exam notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <View style={styles.searchSortSection}>
        <View style={styles.searchContainer}>
          <Image source={require('@/assets/images/icons/search.png')} style={styles.searchBarIcon} resizeMode="contain" />
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
      </View>

      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={selectedCategory === category ? ['#8B5CF6', '#7C3AED'] : ['#FFFFFF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryChipGradient}
              >
                <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>{category}</Text>
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

      <FlatList
        data={filteredAndSortedNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} tintColor="#6366F1" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        removeClippedSubviews
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
    color: '#6366F1',
    fontWeight: '600',
  },
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
  searchBarIcon: {
    width: 20,
    height: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryChip: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryChipActive: {},
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        }
      : { elevation: 0 }),
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
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
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


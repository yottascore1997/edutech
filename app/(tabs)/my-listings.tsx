import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  rentPrice?: number;
  listingType: 'SELL' | 'DONATE' | 'RENT';
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  category: string;
  coverImage: string;
  status: string;
  views: number;
  likes: number;
  isAvailable: boolean;
  createdAt: string;
}

interface MyListingsResponse {
  success: boolean;
  data: {
    books: Book[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    summary: {
      total: number;
      active: number;
      sold: number;
      rented: number;
      inactive: number;
    };
  };
}

const MyListingsScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    sold: 0,
    rented: 0,
    inactive: 0
  });

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const response = await apiFetchAuth('/books/my-listings?page=1&limit=20', user?.token || '');
      
      if (response.ok && response.data.success) {
        setBooks(response.data.data.books);
        setSummary(response.data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching my listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyListings();
    setRefreshing(false);
  };

  const getListingTypeColor = (type: string) => {
    switch (type) {
      case 'SELL': return '#DC2626';
      case 'DONATE': return '#059669';
      case 'RENT': return '#2563EB';
      default: return '#64748B';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#059669';
      case 'SOLD': return '#475569';
      case 'RENTED': return '#2563EB';
      case 'INACTIVE': return '#DC2626';
      default: return '#64748B';
    }
  };

  const coverUri = (img: string) => (img?.startsWith('http') ? img : getImageUrl(img));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading your listings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero header - same gradient as app header */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heroHeader}
      >
        <View style={styles.heroRow}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="library" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>My Listings</Text>
        </View>
      </LinearGradient>

      {/* Summary Stats - refined palette */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.summaryCardTotal]}>
          <View style={styles.summaryIconWrap}>
            <Ionicons name="book" size={18} color="#6366F1" />
          </View>
          <Text style={[styles.summaryNumber, styles.summaryNumberTotal]}>{summary.total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardActive]}>
          <View style={[styles.summaryIconWrap, styles.summaryIconGreen]}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
          </View>
          <Text style={[styles.summaryNumber, styles.summaryNumberActive]}>{summary.active}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardSold]}>
          <View style={[styles.summaryIconWrap, styles.summaryIconSlate]}>
            <Ionicons name="checkmark-done" size={18} color="#475569" />
          </View>
          <Text style={[styles.summaryNumber, styles.summaryNumberSlate]}>{summary.sold}</Text>
          <Text style={styles.summaryLabel}>Sold</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardRented]}>
          <View style={[styles.summaryIconWrap, styles.summaryIconBlue]}>
            <Ionicons name="time" size={18} color="#2563EB" />
          </View>
          <Text style={[styles.summaryNumber, styles.summaryNumberBlue]}>{summary.rented}</Text>
          <Text style={styles.summaryLabel}>Rented</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6366F1']} tintColor="#6366F1" />
        }
      >
        {books.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="book-outline" size={56} color="#6366F1" />
            </View>
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptySubtitle}>Start listing your books to share with students</Text>
          </View>
        ) : (
          books.map((book) => (
            <TouchableOpacity
              key={book.id}
              style={styles.bookCard}
              onPress={() => router.push(`/(tabs)/book-details?bookId=${book.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.bookImageContainer}>
                <Image
                  source={{ uri: coverUri(book.coverImage) }}
                  style={styles.bookImage}
                  resizeMode="cover"
                />
                <View style={[styles.statusBadgeAbsolute, { backgroundColor: getStatusColor(book.status) }]}>
                  <Text style={styles.statusText}>{book.status}</Text>
                </View>
              </View>
              <View style={styles.bookInfo}>
                <View style={styles.bookHeader}>
                  <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                  <Text style={styles.bookAuthor}>{book.author}</Text>
                </View>
                <View style={styles.bookMeta}>
                  <View style={[styles.typeBadge, { backgroundColor: getListingTypeColor(book.listingType) + '18' }]}>
                    <Text style={[styles.typeText, { color: getListingTypeColor(book.listingType) }]}>{book.listingType}</Text>
                  </View>
                  <View style={styles.conditionBadge}>
                    <Ionicons name="star" size={12} color="#B45309" />
                    <Text style={styles.conditionText}>{book.condition}</Text>
                  </View>
                </View>
                <View style={styles.bookFooter}>
                  <View>
                    <Text style={styles.price}>
                      {book.listingType === 'DONATE' ? 'Free' : `₹${book.price}`}
                    </Text>
                    {book.listingType === 'RENT' && book.rentPrice != null && (
                      <Text style={styles.rentPrice}>₹{book.rentPrice}/mo</Text>
                    )}
                  </View>
                  <View style={styles.stats}>
                    <View style={styles.statItem}>
                      <Ionicons name="eye-outline" size={14} color="#64748B" />
                      <Text style={styles.statText}>{book.views}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="heart-outline" size={14} color="#64748B" />
                      <Text style={styles.statText}>{book.likes}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  heroHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 }
      : { elevation: 4 }),
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 }
      : { elevation: 0 }),
  },
  summaryCardTotal: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  summaryCardActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  summaryCardSold: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  summaryCardRented: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  summaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryIconGreen: { backgroundColor: 'rgba(5, 150, 105, 0.2)' },
  summaryIconSlate: { backgroundColor: '#E2E8F0' },
  summaryIconBlue: { backgroundColor: 'rgba(37, 99, 235, 0.2)' },
  summaryNumber: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  summaryNumberTotal: { color: '#4338CA' },
  summaryNumberActive: { color: '#047857' },
  summaryNumberSlate: { color: '#475569' },
  summaryNumberBlue: { color: '#1D4ED8' },
  summaryLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 }
      : { elevation: 0 }),
  },
  bookImageContainer: {
    position: 'relative',
  },
  bookImage: {
    width: 100,
    height: 140,
    backgroundColor: '#F1F5F9',
  },
  statusBadgeAbsolute: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  bookHeader: {
    marginBottom: 10,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 22,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  bookAuthor: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  bookMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFBEB',
    gap: 4,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
  },
  bookFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  rentPrice: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});

export default MyListingsScreen;


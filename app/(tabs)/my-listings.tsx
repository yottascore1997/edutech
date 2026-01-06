import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
      case 'SELL': return '#EF4444';
      case 'DONATE': return '#10B981';
      case 'RENT': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#10B981';
      case 'SOLD': return '#6B7280';
      case 'RENTED': return '#3B82F6';
      case 'INACTIVE': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading your listings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Simple Heading */}
      <View style={styles.simpleHeader}>
        <Text style={styles.simpleHeaderTitle}>My Listings</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryIconContainer}>
            <Ionicons name="book" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryNumber}>{summary.total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </LinearGradient>
        
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryIconContainer}>
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryNumber}>{summary.active}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </LinearGradient>
        
        <View style={styles.summaryCardPlain}>
          <View style={[styles.summaryIconContainerPlain, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name="checkmark-done" size={16} color="#6B7280" />
          </View>
          <Text style={[styles.summaryNumberPlain, { color: '#6B7280' }]}>{summary.sold}</Text>
          <Text style={styles.summaryLabelPlain}>Sold</Text>
        </View>
        
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryIconContainer}>
            <Ionicons name="time" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryNumber}>{summary.rented}</Text>
          <Text style={styles.summaryLabel}>Rented</Text>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {books.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="book-outline" size={64} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Listings Yet</Text>
            <Text style={styles.emptySubtitle}>Start listing your books to share with students</Text>
          </View>
        ) : (
          books.map((book) => (
            <TouchableOpacity
              key={book.id}
              style={styles.bookCard}
              onPress={() => router.push(`/(tabs)/book-details?bookId=${book.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.bookImageContainer}>
                <Image
                  source={{ uri: book.coverImage }}
                  style={styles.bookImage}
                  resizeMode="cover"
                />
                <View style={[styles.statusBadgeAbsolute, { backgroundColor: getStatusColor(book.status) }]}>
                  <Text style={styles.statusText}>{book.status}</Text>
                </View>
              </View>
              
              <View style={styles.bookInfo}>
                <View style={styles.bookHeader}>
                  <View style={styles.bookTitleContainer}>
                    <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                    <Text style={styles.bookAuthor}>{book.author}</Text>
                  </View>
                </View>
                
                <View style={styles.bookMeta}>
                  <View style={[styles.typeBadge, { backgroundColor: getListingTypeColor(book.listingType) }]}>
                    <Text style={styles.typeText}>{book.listingType}</Text>
                  </View>
                  <View style={styles.conditionBadge}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.conditionText}>{book.condition}</Text>
                  </View>
                </View>
                
                <View style={styles.bookFooter}>
                  <View>
                    <Text style={styles.price}>
                      {book.listingType === 'DONATE' ? 'Free' : `₹${book.price}`}
                    </Text>
                    {book.listingType === 'RENT' && book.rentPrice && (
                      <Text style={styles.rentPrice}>₹{book.rentPrice}/month</Text>
                    )}
                  </View>
                  <View style={styles.stats}>
                    <View style={styles.statItem}>
                      <Ionicons name="eye-outline" size={14} color="#6B7280" />
                      <Text style={styles.statText}>{book.views}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="heart-outline" size={14} color="#6B7280" />
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  simpleHeader: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  simpleHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryCardPlain: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryIconContainerPlain: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  summaryNumberPlain: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  summaryLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  summaryLabelPlain: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  bookImageContainer: {
    position: 'relative',
  },
  bookImage: {
    width: 110,
    height: 150,
  },
  statusBadgeAbsolute: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bookInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  bookHeader: {
    marginBottom: 12,
  },
  bookTitleContainer: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bookAuthor: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  bookMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    gap: 4,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  bookFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  rentPrice: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default MyListingsScreen;


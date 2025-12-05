import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CATEGORIES = [
  { name: 'Academic', emoji: '📖', label: 'Academic' },
  { name: 'Exam Preparation', emoji: '🎯', label: 'Exam Prep' },
  { name: 'Literature', emoji: '📕', label: 'Literature' },
  { name: 'Language Learning', emoji: '🗣️', label: 'Language' },
  { name: 'Technical', emoji: '💻', label: 'Technical' },
  { name: 'Business', emoji: '💼', label: 'Business' },
  { name: 'Arts & Design', emoji: '🎨', label: 'Arts' },
];

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  rentPrice?: number;
  listingType: 'SELL' | 'DONATE' | 'RENT';
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  category: string;
  location: string;
  coverImage: string;
  isAvailable: boolean;
  distance: number;
}

export default function CategoryBooksScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(params.category as string);

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory]);

  const fetchBooks = async () => {
    try {
      if (books.length === 0) {
        setLoading(true);
      }

      const queryParams = new URLSearchParams({
        page: '1',
        limit: '50',
        category: selectedCategory,
        radius: '10',
        language: 'English',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const response = await apiFetchAuth(`/books/search?${queryParams.toString()}`, user?.token || '');
      
      if (response.ok && response.data) {
        const fetchedBooks = response.data.data?.books || response.data.books || [];
        setBooks(fetchedBooks);
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error('Error fetching category books:', error);
      Alert.alert('Error', 'Failed to fetch books');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBooks();
    setRefreshing(false);
  };

  const handleAddToCart = async (book: Book) => {
    if (book.listingType === 'DONATE') {
      Alert.alert(
        'Get Free Book',
        `Would you like to request "${book.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Request',
            onPress: async () => {
              try {
                await apiFetchAuth('/books/cart', user?.token || '', {
                  method: 'POST',
                  body: { bookId: book.id },
                });
                Alert.alert('Success', 'Your request has been sent!');
              } catch (error) {
                Alert.alert('Error', 'Failed to send request');
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Add to Cart',
        `Add "${book.title}" for ₹${book.price}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add to Cart',
            onPress: async () => {
              try {
                await apiFetchAuth('/books/cart', user?.token || '', {
                  method: 'POST',
                  body: { bookId: book.id },
                });
                Alert.alert('Success', 'Book added to cart!');
              } catch (error) {
                Alert.alert('Error', 'Failed to add to cart');
              }
            }
          }
        ]
      );
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT': return '#10B981';
      case 'GOOD': return '#3B82F6';
      case 'FAIR': return '#F59E0B';
      case 'POOR': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getListingTypeColor = (type: string) => {
    switch (type) {
      case 'SELL': return '#EF4444';
      case 'DONATE': return '#10B981';
      case 'RENT': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading books...</Text>
      </View>
    );
  }

  const currentCategory = CATEGORIES.find(cat => cat.name === selectedCategory);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Category Filter */}
        <View style={styles.categoryFilterSection}>
          <View style={styles.categoryHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backIconButton}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.categoryFilterTitle}>
              {currentCategory?.emoji} {currentCategory?.label}
            </Text>
            <Text style={styles.booksCount}>({books.length})</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.name}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.name && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category.name)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.name && styles.categoryChipTextActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {books.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No books found</Text>
            <Text style={styles.emptySubtitle}>
              No books available in this category yet
            </Text>
          </View>
        ) : (
          <View style={styles.booksGrid}>
            {books.map((book) => (
              <View key={book.id} style={styles.bookCard}>
                <View style={styles.bookImageContainer}>
                  <Image
                    source={{ uri: `http://192.168.1.7:3000${book.coverImage}` }}
                    style={styles.bookImage}
                    defaultSource={require('@/assets/images/book.jpg')}
                  />
                  <View style={[styles.listingTypeBadge, { backgroundColor: getListingTypeColor(book.listingType) }]}>
                    <Text style={styles.listingTypeText}>{book.listingType}</Text>
                  </View>
                </View>

                 <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                  <Text style={styles.bookAuthor}>by {book.author}</Text>
                  <Text style={styles.bookCategory}>{book.category}</Text>

                  <View style={styles.bookDetails}>
                    <View style={styles.conditionContainer}>
                      <Text style={styles.conditionLabel}>Condition:</Text>
                      <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(book.condition) + '20' }]}>
                        <Text style={[styles.conditionText, { color: getConditionColor(book.condition) }]}>
                          {book.condition}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.bookPriceContainer}>
                      <View style={styles.priceInfo}>
                        {book.listingType === 'RENT' && book.rentPrice ? (
                          <Text style={styles.price}>₹{book.rentPrice}/mo</Text>
                        ) : book.listingType === 'DONATE' ? (
                          <Text style={styles.donatePrice}>FREE</Text>
                        ) : (
                          <Text style={styles.price}>₹{book.price}</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => handleAddToCart(book)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      style={styles.listingAddToCartGradient}
                    >
                      <Ionicons name="cart" size={14} color="#FFFFFF" />
                      <Text style={styles.listingAddToCartText}>
                        {book.listingType === 'DONATE' ? 'Get Free' : 'Add to Cart'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

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
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  // Category Filter Section
  categoryFilterSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  backIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryFilterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  booksCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryScrollContent: {
    paddingRight: 16,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  bookCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookImageContainer: {
    position: 'relative',
    height: 140,
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  listingTypeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  listingTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  bookCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  bookDetails: {
    marginBottom: 12,
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  donatePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  addToCartButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  listingAddToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  listingAddToCartText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});


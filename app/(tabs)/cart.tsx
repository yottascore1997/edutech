import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Seller {
  id: string;
  name: string;
  username: string;
  image: string | null;
  phoneNumber: string;
  bookProfile: {
    isVerified: boolean;
    averageRating: number;
    totalReviews: number;
  };
}

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  rentPrice: number | null;
  listingType: 'SELL' | 'RENT' | 'DONATE';
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  category: string;
  language: string;
  location: string;
  coverImage: string;
  sellerId: string;
  seller: Seller;
}

interface CartItem {
  id: string;
  userId: string;
  bookId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  book: Book;
}

interface SellerGroup {
  seller: Seller;
  books: Book[];
  totalAmount: number;
}

interface CartData {
  cartItems: CartItem[];
  groupedBySeller: SellerGroup[];
  totalItems: number;
}

export default function CartScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCartData = async () => {
    try {
      const response = await apiFetchAuth('/books/cart', user?.token || '');
      if (response.ok && response.data.success) {
        setCartData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cart data:', error);
      Alert.alert('Error', 'Failed to fetch cart data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCartData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCartData();
  };

  const handleMessageSeller = async (seller: Seller) => {
    try {
      // Fetch or create conversation with seller
      const response = await apiFetchAuth(`/student/messages/${seller.id}`, user?.token || '');
      if (response.ok) {
        // Navigate to chat screen with seller information
        router.push({
          pathname: '/(tabs)/chat',
          params: {
            userId: seller.id,
            userName: seller.name,
            userProfilePhoto: seller.image || '',
            messages: JSON.stringify(response.data || [])
          }
        });
      }
    } catch (error) {
      console.error('Error opening chat with seller:', error);
      Alert.alert('Error', 'Could not open chat. Please try again.');
    }
  };

  const handleRemoveItem = async (bookId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetchAuth(`/books/cart?bookId=${bookId}`, user?.token || '', {
                method: 'DELETE',
              });
              Alert.alert('Success', 'Item removed from cart');
              fetchCartData(); // Refresh cart
            } catch (error) {
              console.error('Error removing item:', error);
              Alert.alert('Error', 'Failed to remove item');
            }
          }
        }
      ]
    );
  };

  const handleUpdateQuantity = async (cartItemId: string, bookId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(bookId);
      return;
    }

    try {
      await apiFetchAuth(`/books/cart/${cartItemId}`, user?.token || '', {
        method: 'PUT',
        body: { quantity: newQuantity },
      });
      fetchCartData(); // Refresh cart
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };


  const renderBookItem = (book: Book, cartItem: CartItem) => (
    <View key={cartItem.id} style={styles.bookItem}>
      <Image 
        source={{ uri: `http://192.168.1.7:3000${book.coverImage}` }} 
        style={styles.bookImage}
        defaultSource={require('@/assets/images/book.jpg')}
      />
      
      <View style={styles.bookDetails}>
        <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.bookAuthor}>by {book.author}</Text>
        
        <View style={styles.bookMeta}>
          <View style={styles.priceContainer}>
            {book.listingType === 'RENT' && book.rentPrice ? (
              <Text style={styles.rentPrice}>₹{book.rentPrice}/month</Text>
            ) : book.listingType === 'DONATE' ? (
              <Text style={styles.donatePrice}>FREE</Text>
            ) : (
              <Text style={styles.price}>₹{book.price}</Text>
            )}
          </View>
          
          <View style={styles.conditionContainer}>
            <Text style={[styles.conditionText, { color: getConditionColor(book.condition) }]}>
              {book.condition}
            </Text>
          </View>
        </View>

        <View style={styles.quantityControls}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(cartItem.id, book.id, cartItem.quantity - 1)}
          >
            <Ionicons name="remove" size={16} color="#666" />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{cartItem.quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(cartItem.id, book.id, cartItem.quantity + 1)}
          >
            <Ionicons name="add" size={16} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => handleRemoveItem(book.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSellerGroup = (sellerGroup: SellerGroup) => (
    <View key={sellerGroup.seller.id} style={styles.sellerGroup}>
      <View style={styles.sellerHeader}>
        <View style={styles.sellerInfo}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerInitial}>
              {sellerGroup.seller.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.sellerName}>{sellerGroup.seller.name}</Text>
            <Text style={styles.sellerUsername}>@{sellerGroup.seller.username}</Text>
            {sellerGroup.seller.bookProfile.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.sellerStats}>
          <Text style={styles.totalAmount}>₹{sellerGroup.totalAmount}</Text>
          <Text style={styles.itemCount}>{sellerGroup.books.length} item(s)</Text>
        </View>
      </View>

      <View style={styles.booksContainer}>
        {sellerGroup.books.map((book) => {
          const cartItem = cartData?.cartItems.find(item => item.bookId === book.id);
          return cartItem ? renderBookItem(book, cartItem) : null;
        })}
      </View>

      {/* Message Seller Button - Below Books */}
      <TouchableOpacity 
        style={styles.messageSellerButton}
        onPress={() => handleMessageSeller(sellerGroup.seller)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#FF8C00', '#FF6B00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.messageSellerGradient}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
          <Text style={styles.messageSellerText}>Message {sellerGroup.seller.name}</Text>
        </LinearGradient>
      </TouchableOpacity>

    </View>
  );

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT': return '#10B981';
      case 'GOOD': return '#3B82F6';
      case 'FAIR': return '#F59E0B';
      case 'POOR': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const calculateTotalAmount = () => {
    if (!cartData) return 0;
    return cartData.groupedBySeller.reduce((total, seller) => total + seller.totalAmount, 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F9FAFB" barStyle="dark-content" />

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        {cartData && cartData.groupedBySeller.length > 0 ? (
          <View style={styles.cartContainer}>
            {cartData.groupedBySeller.map(renderSellerGroup)}
          </View>
        ) : (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
            <Text style={styles.emptyCartSubtitle}>
              Add some books to get started!
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => {/* Navigate to book store */}}
            >
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.browseGradient}
              >
                <Text style={styles.browseText}>Browse Books</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Cart Summary Footer */}
      {cartData && cartData.groupedBySeller.length > 0 && (
        <View style={styles.cartSummaryFooter}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="book-outline" size={20} color="#6B7280" />
              <Text style={styles.summaryLabel}>Total Books</Text>
              <Text style={styles.summaryValue}>{cartData.totalItems}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="cash-outline" size={20} color="#6B7280" />
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryValue}>₹{calculateTotalAmount()}</Text>
            </View>
          </View>
        </View>
      )}
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
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  cartContainer: {
    padding: 20,
  },
  sellerGroup: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sellerUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '500',
  },
  sellerStats: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  itemCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  messageSellerButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  messageSellerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  messageSellerText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  booksContainer: {
    padding: 16,
  },
  bookItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bookImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  bookDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  rentPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  donatePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  conditionContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: 12,
    padding: 6,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  browseGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  browseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Cart Summary Footer
  cartSummaryFooter: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
    marginTop: 2,
  },
});

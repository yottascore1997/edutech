import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface BookDetails {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  price: number;
  rentPrice?: number;
  listingType: 'SELL' | 'DONATE' | 'RENT';
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  category: string;
  subcategory?: string;
  class?: string;
  subject?: string;
  examType?: string;
  language: string;
  pages?: number;
  publisher?: string;
  publishedYear?: number;
  edition?: string;
  location: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  availableFrom?: string;
  availableUntil?: string;
  coverImage: string;
  additionalImages: string[];
  status: string;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    name: string;
    username: string;
    image?: string;
    phoneNumber: string;
    bookProfile: {
      isVerified: boolean;
      city: string;
      state: string;
      averageRating: number;
      totalReviews: number;
      totalListings: number;
      totalSales: number;
      totalRentals: number;
      totalDonations: number;
    };
  };
  bookLikes: any[];
  bookReviews: any[];
  _count: {
    bookLikes: number;
    bookReviews: number;
  };
  averageRating: number;
  totalReviews: number;
  totalLikes: number;
}

const BookDetailsScreen = () => {
  const { bookId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  const coverImageUri = book?.coverImage ? (book.coverImage.startsWith('http') ? book.coverImage : getImageUrl(book.coverImage)) : null;

  useEffect(() => {

    if (bookId) {
      fetchBookDetails();
    }
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      const response = await apiFetchAuth(`/books/${bookId}`, user?.token || '');
      if (response.ok && response.data.success) {
        setBook(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to fetch book details');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
      Alert.alert('Error', 'Failed to fetch book details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    // TODO: Implement like API call
  };

  const handleContactSeller = () => {
    if (book?.seller.phoneNumber) {
      Alert.alert(
        'Contact Seller',
        `Call ${book.seller.name} at ${book.seller.phoneNumber}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => console.log('Calling seller') }
        ]
      );
    }
  };

  const handleMessageSeller = async () => {
    if (!book?.seller) return;
    
    try {
      // Fetch or create conversation with seller
      const response = await apiFetchAuth(`/student/messages/${book.seller.id}`, user?.token || '');
      if (response.ok) {
        // Navigate to chat screen with seller information
        router.push({
          pathname: '/chat',
          params: {
            userId: book.seller.id,
            userName: book.seller.name,
            messages: JSON.stringify(response.data || [])
          }
        });
      }
    } catch (error) {
      console.error('Error opening chat with seller:', error);
      Alert.alert('Error', 'Could not open chat. Please try again.');
    }
  };

  const handleDeleteListing = () => {
    if (!book) return;

    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this book listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiFetchAuth(`/books/${book.id}`, user?.token || '', {
                method: 'DELETE'
              });

              if (response.ok) {
                Alert.alert('Success', 'Book listing deleted successfully');
                router.back();
              } else {
                Alert.alert('Error', 'Failed to delete listing');
              }
            } catch (error) {
              console.error('Error deleting book:', error);
              Alert.alert('Error', 'Failed to delete listing');
            }
          }
        }
      ]
    );
  };

  const getListingTypeColor = (type: string) => {
    switch (type) {
      case 'SELL': return '#EF4444';
      case 'DONATE': return '#10B981';
      case 'RENT': return '#3B82F6';
      default: return '#6B7280';
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <View style={styles.loadingCard}>
          <Ionicons name="book" size={48} color="#6366F1" />
          <Text style={styles.loadingText}>Loading book details...</Text>
        </View>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Ionicons name="book-outline" size={56} color="#94A3B8" />
        <Text style={styles.errorText}>Book not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover + Back */}
        <View style={styles.imageContainer}>
          {coverImageUri ? (
            <Image source={{ uri: coverImageUri }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.coverImagePlaceholder}>
              <Ionicons name="book" size={64} color="#94A3B8" />
            </View>
          )}
          <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent']} style={styles.imageGradient} />
          <TouchableOpacity style={[styles.backButtonOverlay, { top: insets.top + 8 }]} onPress={() => router.back()}>
            <View style={styles.backButtonCircle}>
              <Ionicons name="arrow-back" size={22} color="#1F2937" />
            </View>
          </TouchableOpacity>
          <View style={[styles.listingTypeBadge, { backgroundColor: getListingTypeColor(book.listingType) }]}>
            <Text style={styles.listingTypeText}>{book.listingType}</Text>
          </View>
        </View>

        {/* Content cards */}
        <View style={styles.content}>
          {/* Title + Price card */}
          <View style={styles.card}>
            <Text style={styles.title}>{book.title}</Text>
            {book.author ? <Text style={styles.author}>{book.author}</Text> : null}
            <View style={styles.priceRow}>
              {book.listingType === 'DONATE' ? (
                <Text style={styles.price}>Free</Text>
              ) : (
                <>
                  <Text style={styles.price}>₹{book.price}</Text>
                  {book.rentPrice ? <Text style={styles.rentPrice}>Rent ₹{book.rentPrice}/mo</Text> : null}
                </>
              )}
            </View>
          </View>

          {/* Details card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Ionicons name="folder-open-outline" size={18} color="#6366F1" />
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{book.category}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="ribbon-outline" size={18} color="#6366F1" />
                <Text style={styles.detailLabel}>Condition</Text>
                <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(book.condition) + '20' }]}>
                  <Text style={[styles.conditionText, { color: getConditionColor(book.condition) }]}>{book.condition}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="language-outline" size={18} color="#6366F1" />
                <Text style={styles.detailLabel}>Language</Text>
                <Text style={styles.detailValue}>{book.language}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color="#6366F1" />
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{book.location}</Text>
              </View>
            </View>
          </View>

          {book.description ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Description</Text>
              <Text style={styles.descriptionText}>{book.description}</Text>
            </View>
          ) : null}

          {book.additionalImages && book.additionalImages.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>More Images</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.additionalImagesScroll}>
                {book.additionalImages.map((img, index) => (
                  <Image
                    key={index}
                    source={{ uri: img.startsWith('http') ? img : getImageUrl(img) }}
                    style={styles.additionalImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Seller card - trust */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Seller</Text>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatarWrap}>
                {book.seller.image && getImageUrl(book.seller.image) ? (
                  <Image source={{ uri: getImageUrl(book.seller.image) }} style={styles.sellerAvatar} />
                ) : (
                  <View style={[styles.sellerAvatar, styles.sellerAvatarPlaceholder]}>
                    <Ionicons name="person" size={28} color="#94A3B8" />
                  </View>
                )}
                {book.seller.bookProfile.isVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{book.seller.name}</Text>
                <Text style={styles.sellerLocation}>{book.seller.bookProfile.city}</Text>
                <Text style={styles.sellerStat}>{book.seller.bookProfile.totalListings} listings</Text>
              </View>
            </View>
            <View style={styles.sellerActionsRow}>
              {String(book.seller.id) !== String(user?.id ?? '') ? (
                <>
                  <TouchableOpacity style={styles.sellerContactButtonWrap} onPress={handleContactSeller} activeOpacity={0.9}>
                    <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.sellerContactButton}>
                      <Ionicons name="call" size={18} color="#FFFFFF" />
                      <Text style={styles.sellerContactButtonText}>Contact Seller</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sellerMessageButton} onPress={handleMessageSeller} activeOpacity={0.8}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.sellerMessageButtonText}>Message</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteListing} activeOpacity={0.8}>
                  <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>Delete Listing</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={{ height: 24 + Math.max(insets.bottom, 16) }} />
        </View>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 40,
    borderRadius: 20,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.12)',
  },
  loadingText: {
    fontSize: 15,
    color: '#6366F1',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    height: 280,
    backgroundColor: '#E2E8F0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  backButtonOverlay: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
  },
  backButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'ios' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 } : {}),
    elevation: 3,
  },
  listingTypeBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  listingTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.08)',
    ...(Platform.OS === 'ios' ? { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 } : {}),
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 28,
  },
  author: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
  },
  rentPrice: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
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
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 23,
  },
  additionalImagesScroll: {
    marginHorizontal: -4,
  },
  additionalImage: {
    width: 88,
    height: 88,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#F1F5F9',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sellerAvatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  sellerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  sellerAvatarPlaceholder: {
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  sellerLocation: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  sellerStat: {
    fontSize: 12,
    color: '#94A3B8',
  },
  sellerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    minHeight: 48,
  },
  sellerContactButtonWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 0,
  },
  sellerContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  sellerContactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sellerMessageButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    backgroundColor: '#10B981',
  },
  sellerMessageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BookDetailsScreen;

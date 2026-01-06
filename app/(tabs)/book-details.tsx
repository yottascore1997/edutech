import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { ShadowUtils } from '@/utils/shadowUtils';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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
  const [book, setBook] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading book details...</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
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
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: book.coverImage.startsWith('http') ? book.coverImage : `http://192.168.1.5:3000${book.coverImage}` }} 
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
             <TouchableOpacity 
               style={styles.backButton}
               onPress={() => router.back()}
             >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={[styles.listingTypeBadge, { backgroundColor: getListingTypeColor(book.listingType) }]}>
            <Text style={styles.listingTypeText}>{book.listingType}</Text>
          </View>
        </View>

        {/* Book Info */}
        <View style={styles.content}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>by {book.author}</Text>
          
          <View style={styles.priceContainer}>
            <View style={styles.priceInfo}>
              {book.listingType === 'DONATE' ? (
                <Text style={styles.price}>Free</Text>
              ) : (
                <>
                  <Text style={styles.price}>₹{book.price}</Text>
                  {book.rentPrice && (
                    <Text style={styles.rentPrice}>Rent: ₹{book.rentPrice}/month</Text>
                  )}
                </>
              )}
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{book.category}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Condition</Text>
              <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(book.condition) + '20' }]}>
                <Text style={[styles.conditionText, { color: getConditionColor(book.condition) }]}>
                  {book.condition}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Language</Text>
              <Text style={styles.detailValue}>{book.language}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>📍 {book.location}</Text>
            </View>
          </View>

          {book.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{book.description}</Text>
            </View>
          )}

          {/* Additional Images */}
          {book.additionalImages && book.additionalImages.length > 0 && (
            <View style={styles.additionalImagesContainer}>
              <Text style={styles.additionalImagesTitle}>More Images</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {book.additionalImages.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image.startsWith('http') ? image : `http://192.168.1.5:3000${image}` }}
                    style={styles.additionalImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Seller Info */}
          <View style={styles.sellerContainer}>
            <Text style={styles.sellerTitle}>Seller Information</Text>
            <View style={styles.sellerInfo}>
              <Image 
                source={{ uri: book.seller.image || 'https://via.placeholder.com/50' }} 
                style={styles.sellerAvatar}
              />
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{book.seller.name}</Text>
                <Text style={styles.sellerLocation}>📍 {book.seller.bookProfile.city}</Text>
                <View style={styles.sellerStats}>
                  <Text style={styles.sellerStat}>📚 {book.seller.bookProfile.totalListings} listings</Text>
                </View>
              </View>
              {book.seller.bookProfile.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              )}
            </View>
            
            {/* Send Message Button - Only show if seller is not current user */}
            {book.seller.id !== user?.id ? (
              <TouchableOpacity 
                style={styles.sellerMessageButton}
                onPress={handleMessageSeller}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
                <Text style={styles.sellerMessageButtonText}>Send Message</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDeleteListing}
                activeOpacity={0.8}
              >
                <Ionicons name="trash" size={18} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>Delete Listing</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.contactButton} onPress={handleContactSeller}>
          <Ionicons name="call" size={20} color="#FFFFFF" />
          <Text style={styles.contactButtonText}>Contact Seller</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>
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
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  likeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingTypeBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  listingTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  author: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  priceContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  priceInfo: {
    flex: 1,
  },
  rentPrice: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  additionalImagesContainer: {
    marginBottom: 20,
  },
  additionalImagesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  additionalImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  sellerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 100,
    ...ShadowUtils.medium(),
  },
  sellerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  sellerLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  sellerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  sellerStat: {
    fontSize: 12,
    color: '#6B7280',
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 100,
    ...ShadowUtils.medium(),
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...ShadowUtils.large(),
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  sellerMessageButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  sellerMessageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#F3F4F6',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BookDetailsScreen;

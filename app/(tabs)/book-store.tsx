import BookListingForm from '@/components/BookListingForm';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { ShadowUtils } from '@/utils/shadowUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  latitude: number;
  longitude: number;
  coverImage: string;
  additionalImages?: string;
  isAvailable: boolean;
  views: number;
  likes: number;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    username: string;
    image?: string;
    bookProfile: {
      isVerified: boolean;
      city: string;
      averageRating: number;
      totalReviews: number;
    };
  };
  distance: number;
}


const CATEGORIES = [
  { name: 'ALL', emoji: '📚', label: 'All Books' },
  { name: 'Academic', emoji: '📖', label: 'Academic' },
  { name: 'Exam Preparation', emoji: '🎯', label: 'Exam Prep' },
  { name: 'Literature', emoji: '📕', label: 'Literature' },
  { name: 'Language Learning', emoji: '🗣️', label: 'Language' },
  { name: 'Technical', emoji: '💻', label: 'Technical' },
  { name: 'Business', emoji: '💼', label: 'Business' },
  { name: 'Arts & Design', emoji: '🎨', label: 'Arts' },
];

const BookStoreScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SELL' | 'DONATE' | 'RENT'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Location-related state
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(10); // Default 10km
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  
  // Cart count state
  const [cartCount, setCartCount] = useState(0);

  // Featured Reads marquee animation
  const marqueeAnim = useRef(new Animated.Value(0)).current;

  // Banner carousel state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerScrollX = useRef(new Animated.Value(0)).current;
  
  const bannerImages = [
    require('@/assets/images/banner11.jpg'),
    require('@/assets/images/banner12.jpg'),
    require('@/assets/images/banner13.jpg'),
  ];



  useEffect(() => {
    requestLocationPermission();
    fetchCartCount();
    fetchBooks();
  }, []);

  // Fetch books when location dependencies change (not category)
  useEffect(() => {
    if (locationEnabled || selectedRadius || userLocation) {
      fetchBooks();
    }
  }, [locationEnabled, selectedRadius, userLocation?.lat, userLocation?.lng]);

  // Start marquee animation
  useEffect(() => {
    const startMarquee = () => {
      marqueeAnim.setValue(0);
      Animated.timing(marqueeAnim, {
        toValue: -600, // Adjust based on content width
        duration: 15000, // 15 seconds for slow continuous movement
        useNativeDriver: true,
      }).start(() => {
        // Restart animation when it completes
        startMarquee();
      });
    };
    
    startMarquee();
  }, []);

  // Auto-scroll banner carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, 4000); // Change banner every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchBooks = async () => {
    try {
      // Only show full loading on initial load
      if (books.length === 0) {
        setLoading(true);
      }

      // Build query parameters
      let queryParams = new URLSearchParams({
        page: '1',
        limit: '20',
        radius: selectedRadius.toString(),
        language: 'English',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Add location parameters if location is enabled
      if (locationEnabled && userLocation) {
        queryParams.append('userLat', userLocation.lat.toString());
        queryParams.append('userLng', userLocation.lng.toString());
      }

      const response = await apiFetchAuth(`/books/search?${queryParams.toString()}`, user?.token || '');
      
      if (response.ok && response.data) {
        const fetchedBooks = response.data.data?.books || response.data.books || [];
        setBooks(fetchedBooks);
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error('❌ Error fetching books:', error);
      Alert.alert('Error', 'Failed to fetch books');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await apiFetchAuth('/cart', user?.token || '');
      if (response.ok && response.data.success) {
        const cartItems = response.data.data || [];
        setCartCount(cartItems.length);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  // Location functions
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationEnabled(true);
        getCurrentLocation();
      } else {
        setLocationEnabled(false);
        setLocationError('Location permission denied');
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationError('Error requesting location permission');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
      setLocationError('');
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Unable to get current location');
    } finally {
      setLocationLoading(false);
    }
  };

  const toggleLocation = () => {
    if (locationEnabled) {
      setLocationEnabled(false);
      setUserLocation(null);
      setLocationError('');
    } else {
      requestLocationPermission();
    }
  };

  // Format distance for display
  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBooks();
    await fetchCartCount();
    setRefreshing(false);
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'ALL' || book.listingType === filterType;
    return matchesSearch && matchesFilter;
  });

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

  const BookCard = ({ book }: { book: Book }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={() => {

        router.push(`/(tabs)/book-details?bookId=${book.id}`);
      }}
    >
      <View style={styles.bookImageContainer}>
        <Image 
          source={{ uri: book.coverImage.startsWith('http') ? book.coverImage : `http://192.168.1.7:3000${book.coverImage}` }} 
          style={styles.bookImage}
          resizeMode="cover"
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
          
          <View style={styles.priceContainer}>
            <View style={styles.priceInfo}>
              {book.listingType === 'DONATE' ? (
                <Text style={styles.priceLabel}>Free</Text>
              ) : (
                <>
                  <Text style={styles.priceLabel}>₹{book.price}</Text>
                  {book.rentPrice && (
                    <Text style={styles.rentPriceLabel}>Rent: ₹{book.rentPrice}/month</Text>
                  )}
                </>
              )}
            </View>
            <View style={styles.distanceLocationContainer}>
              {book.distance !== undefined && locationEnabled && (
                <Text style={styles.distanceText}>{formatDistance(book.distance)} away</Text>
              )}
              <Text style={styles.locationText}>📍 {book.location}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.sellerInfo}>
          <Image 
            source={{ uri: book.seller.image?.startsWith('http') ? book.seller.image : `http://192.168.1.7:3000${book.seller.image}` || 'https://via.placeholder.com/24' }} 
            style={styles.sellerAvatar}
          />
          <View style={styles.sellerDetails}>
            <Text style={styles.sellerName}>{book.seller.name}</Text>
            <Text style={styles.sellerLocation}>{book.seller.bookProfile.city}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.listingAddToCartButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent navigation to book details
            handleAddToCart(book);
          }}
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
    </TouchableOpacity>
  );

  const FilterButton = ({ type, label }: { type: string; label: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterType === type && styles.activeFilterButton
      ]}
      onPress={() => setFilterType(type as any)}
    >
      <Text style={[
        styles.filterButtonText,
        filterType === type && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const handleCreateBook = () => {
    setShowCreateModal(true);
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    fetchBooks(); // Refresh the list
    Alert.alert('Success', 'Book listed successfully!');
  };

  const handleAddToCart = async (book: Book) => {
    if (book.listingType === 'DONATE') {
      Alert.alert(
        'Get Free Book',
        `Would you like to request "${book.title}" by ${book.author}?`,
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
                Alert.alert('Success', 'Your request has been sent to the seller!');
                fetchCartCount(); // Update cart count
              } catch (error) {
                console.error('Error requesting free book:', error);
                Alert.alert('Error', 'Failed to send request. Please try again.');
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Add to Cart',
        `Add "${book.title}" by ${book.author} to your cart for ₹${book.price}?`,
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
                Alert.alert('Success', 'Book added to cart successfully!');
                fetchCartCount(); // Update cart count
              } catch (error) {
                console.error('Error adding to cart:', error);
                Alert.alert('Error', 'Failed to add book to cart. Please try again.');
              }
            }
          }
        ]
      );
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading books...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        {/* Header Top Row with Title and Cart */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Book Store</Text>
            <Text style={styles.headerSubtitle}>Find and share books with students</Text>
          </View>
          <TouchableOpacity 
            style={styles.cartIconButton}
            onPress={() => router.push('/(tabs)/cart')}
            activeOpacity={0.7}
          >
            <View style={styles.cartIconContainer}>
              <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Search Bar with Filter Icon */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search books..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity 
            style={styles.filterIconButton}
            onPress={() => setShowFilterPanel(true)}
            activeOpacity={0.7}
          >
            <View style={styles.filterIconGradient}>
              <Ionicons name="options" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >

        {/* Banner Carousel */}
        <View style={styles.bannerCarouselContainer}>
          <View style={styles.bannerWrapper}>
            {bannerImages.map((banner, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.bannerSlide,
                  {
                    opacity: currentBannerIndex === index ? 1 : 0,
                    transform: [{
                      translateX: currentBannerIndex === index ? 0 : 100
                    }]
                  }
                ]}
              >
                <Image 
                  source={banner} 
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              </Animated.View>
            ))}
          </View>
          
          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {bannerImages.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentBannerIndex(index)}
                style={[
                  styles.paginationDot,
                  currentBannerIndex === index && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        </View>

        {/* Explore Categories */}
        <View style={styles.categoriesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore Categories</Text>
            <View style={styles.trendingBadge}>
              <Text style={styles.trendingText}>🔥 Trending</Text>
            </View>
          </View>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.slice(0, 4).map((category, index) => {
              const isActive = selectedCategory === category.name;
              const gradients: [string, string][] = [
                ['#FF6B6B', '#FF8E53'],
                ['#4ECDC4', '#44A08D'],
                ['#FFD93D', '#6BCF7F'],
                ['#FF9A9E', '#FECFEF']
              ];
              return (
                <TouchableOpacity 
                  key={category.name}
                  style={[styles.categoryCard, isActive && styles.categoryCardActive]} 
                  activeOpacity={0.7}
                  onPress={() => {
                    if (category.name === 'ALL') {
                      setSelectedCategory('ALL');
                    } else {
                      router.push({
                        pathname: '/(tabs)/category-books',
                        params: {
                          category: category.name,
                          categoryLabel: category.label,
                          categoryEmoji: category.emoji
                        }
                      });
                    }
                  }}
                >
                  <LinearGradient
                    colors={isActive ? ['#4F46E5', '#7C3AED'] : (gradients[index] || ['#FF6B6B', '#FF8E53'])}
                    style={styles.categoryIconContainer}
                  >
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  </LinearGradient>
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>{category.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Additional Categories Row */}
          <View style={styles.additionalCategories}>
            {CATEGORIES.slice(4).map((category, index) => {
              const isActive = selectedCategory === category.name;
              const gradients: [string, string][] = [
                ['#96CEB4', '#FFEAA7'],
                ['#74B9FF', '#0984E3'],
                ['#FD79A8', '#E84393'],
                ['#A29BFE', '#6C5CE7'],
                ['#667EEA', '#764BA2']
              ];
              return (
                <TouchableOpacity 
                  key={category.name}
                  style={[styles.additionalCategoryCard, isActive && styles.additionalCategoryCardActive]} 
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/category-books',
                      params: {
                        category: category.name,
                        categoryLabel: category.label,
                        categoryEmoji: category.emoji
                      }
                    });
                  }}
                >
                  <LinearGradient
                    colors={isActive ? ['#4F46E5', '#7C3AED'] : (gradients[index] || ['#96CEB4', '#FFEAA7'])}
                    style={styles.additionalCategoryIconContainer}
                  >
                    <Text style={styles.additionalCategoryEmoji}>{category.emoji}</Text>
                  </LinearGradient>
                  <Text style={[styles.additionalCategoryText, isActive && styles.additionalCategoryTextActive]}>{category.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Top Books */}
        <View style={styles.categoriesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Books</Text>
            <View style={styles.trendingBadge}>
              <Text style={styles.trendingText}>⭐ Top Rated</Text>
            </View>
          </View>
          <View style={styles.categoriesGrid}>
            {[
              { name: 'Exam Prep Book', emoji: '🎯', label: 'Exam Prep' },
              { name: 'Academic', emoji: '📖', label: 'Academic' },
              { name: 'Business', emoji: '💼', label: 'Business' },
              { name: 'Fiction', emoji: '📚', label: 'Fiction' }
            ].map((category, index) => {
              const isActive = selectedCategory === category.name;
              const gradients: [string, string][] = [
                ['#FF6B6B', '#FF8E53'],
                ['#4ECDC4', '#44A08D'],
                ['#FFD93D', '#6BCF7F'],
                ['#FF9A9E', '#FECFEF']
              ];
              return (
                <TouchableOpacity 
                  key={category.name}
                  style={[styles.categoryCard, isActive && styles.categoryCardActive]} 
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/category-books',
                      params: {
                        category: category.name,
                        categoryLabel: category.label,
                        categoryEmoji: category.emoji
                      }
                    });
                  }}
                >
                  <LinearGradient
                    colors={isActive ? ['#4F46E5', '#7C3AED'] : (gradients[index] || ['#FF6B6B', '#FF8E53'])}
                    style={styles.categoryIconContainer}
                  >
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  </LinearGradient>
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>{category.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Creative Advertisement Banner */}
        <View style={styles.adBannerContainer}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.adBanner}
          >
            <View style={styles.adBannerContent}>
              <View style={styles.adBannerText}>
                <View style={styles.titleContainer}>
                  <Text style={styles.adBannerTitle}>📚 Unlock Your Next Adventure!</Text>
                  <View style={styles.sparkleContainer}>
                    <Text style={styles.sparkle}>✨</Text>
                  </View>
                </View>
                <View style={styles.offerBadge}>
                  <Text style={styles.offerText}>🔥 LIMITED TIME OFFER</Text>
                </View>
                <TouchableOpacity style={styles.shopNowButton} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8E53']}
                    style={styles.shopNowGradient}
                  >
                    <Text style={styles.shopNowText}>🚀 Shop Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <View style={styles.adBannerBooks}>
                <View style={[styles.bookStack, styles.bookStack1, { backgroundColor: '#FF6B6B' }]} />
                <View style={[styles.bookStack, styles.bookStack2, { backgroundColor: '#4ECDC4' }]} />
                <View style={[styles.bookStack, styles.bookStack3, { backgroundColor: '#45B7D1' }]} />
                <View style={[styles.bookStack, styles.bookStack4, { backgroundColor: '#96CEB4' }]} />
                <View style={[styles.bookStack, styles.bookStack5, { backgroundColor: '#FFEAA7' }]} />
                <View style={styles.floatingIcons}>
                  <Text style={styles.floatingIcon}>📖</Text>
                  <Text style={[styles.floatingIcon, { top: -10, left: 20 }]}>⭐</Text>
                  <Text style={[styles.floatingIcon, { top: 5, right: -5 }]}>💎</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Creative Featured Reads */}
        <View style={styles.featuredContainer}>
          <View style={styles.featuredHeader}>
            <Text style={styles.sectionTitle}>Featured Reads</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.featuredBooksScroll}>
            <Animated.View style={[styles.featuredBooksMarquee, { transform: [{ translateX: marqueeAnim }] }]}>
              {/* First set of books */}
              <View style={styles.featuredBookCard}>
                <View style={styles.bookBadge}>
                  <Text style={styles.bookBadgeText}>🏆 Bestseller</Text>
                </View>
                <View style={styles.featuredBookImage}>
                  <LinearGradient
                    colors={['#667EEA', '#764BA2']}
                    style={styles.bookImageGradient}
                  >
                    <Text style={styles.bookTitleText}>THE MIDNIGHT LIBRARY</Text>
                    <View style={styles.bookDecorations}>
                      <Text style={styles.bookDecor}>✨</Text>
                      <Text style={styles.bookDecor}>📖</Text>
                    </View>
                  </LinearGradient>
                </View>
                <Text style={styles.featuredBookTitle}>The Midnight Library</Text>
                <Text style={styles.featuredBookAuthor}>by Matt Haig</Text>
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {[1,2,3,4,5].map((star) => (
                      <Ionicons key={star} name="star" size={12} color="#FFD700" />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>4.5</Text>
                  <Text style={styles.reviewCount}>(2.3k reviews)</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>$19.99</Text>
                  <Text style={styles.featuredBookPrice}>$14.99</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>25% OFF</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.addToCartButton} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8E53']}
                    style={styles.addToCartGradient}
                  >
                    <Ionicons name="cart" size={14} color="#FFFFFF" />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              <View style={styles.featuredBookCard}>
                <View style={[styles.bookBadge, { backgroundColor: '#4ECDC4' }]}>
                  <Text style={styles.bookBadgeText}>🆕 New Release</Text>
                </View>
                <View style={styles.featuredBookImage}>
                  <LinearGradient
                    colors={['#4ECDC4', '#44A08D']}
                    style={styles.bookImageGradient}
                  >
                    <Text style={styles.bookTitleText}>ATOMIC HABITS</Text>
                    <View style={styles.bookDecorations}>
                      <Text style={styles.bookDecor}>⚡</Text>
                      <Text style={styles.bookDecor}>🎯</Text>
                    </View>
                  </LinearGradient>
                </View>
                <Text style={styles.featuredBookTitle}>Atomic Habits</Text>
                <Text style={styles.featuredBookAuthor}>by James Clear</Text>
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {[1,2,3,4,5].map((star) => (
                      <Ionicons key={star} name="star" size={12} color="#FFD700" />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>4.8</Text>
                  <Text style={styles.reviewCount}>(5.1k reviews)</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>$16.99</Text>
                  <Text style={styles.featuredBookPrice}>$12.50</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>26% OFF</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.addToCartButton} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#4ECDC4', '#44A08D']}
                    style={styles.addToCartGradient}
                  >
                    <Ionicons name="cart" size={14} color="#FFFFFF" />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.featuredBookCard}>
                <View style={[styles.bookBadge, { backgroundColor: '#FFD93D' }]}>
                  <Text style={styles.bookBadgeText}>🔥 Hot Pick</Text>
                </View>
                <View style={styles.featuredBookImage}>
                  <LinearGradient
                    colors={['#FFD93D', '#FF8E53']}
                    style={styles.bookImageGradient}
                  >
                    <Text style={styles.bookTitleText}>THE SEVEN HUSBANDS</Text>
                    <View style={styles.bookDecorations}>
                      <Text style={styles.bookDecor}>💫</Text>
                      <Text style={styles.bookDecor}>👑</Text>
                    </View>
                  </LinearGradient>
                </View>
                <Text style={styles.featuredBookTitle}>The Seven Husbands</Text>
                <Text style={styles.featuredBookAuthor}>by Taylor Jenkins Reid</Text>
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {[1,2,3,4,5].map((star) => (
                      <Ionicons key={star} name="star" size={12} color="#FFD700" />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>4.7</Text>
                  <Text style={styles.reviewCount}>(3.8k reviews)</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>$18.99</Text>
                  <Text style={styles.featuredBookPrice}>$13.99</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>26% OFF</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.addToCartButton} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#FFD93D', '#FF8E53']}
                    style={styles.addToCartGradient}
                  >
                    <Ionicons name="cart" size={14} color="#FFFFFF" />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Duplicate set for seamless loop */}
              <View style={styles.featuredBookCard}>
                <View style={styles.bookBadge}>
                  <Text style={styles.bookBadgeText}>🏆 Bestseller</Text>
                </View>
                <View style={styles.featuredBookImage}>
                  <LinearGradient
                    colors={['#667EEA', '#764BA2']}
                    style={styles.bookImageGradient}
                  >
                    <Text style={styles.bookTitleText}>THE MIDNIGHT LIBRARY</Text>
                    <View style={styles.bookDecorations}>
                      <Text style={styles.bookDecor}>✨</Text>
                      <Text style={styles.bookDecor}>📖</Text>
                    </View>
                  </LinearGradient>
                </View>
                <Text style={styles.featuredBookTitle}>The Midnight Library</Text>
                <Text style={styles.featuredBookAuthor}>by Matt Haig</Text>
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {[1,2,3,4,5].map((star) => (
                      <Ionicons key={star} name="star" size={12} color="#FFD700" />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>4.5</Text>
                  <Text style={styles.reviewCount}>(2.3k reviews)</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>$19.99</Text>
                  <Text style={styles.featuredBookPrice}>$14.99</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>25% OFF</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.addToCartButton} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8E53']}
                    style={styles.addToCartGradient}
                  >
                    <Ionicons name="cart" size={14} color="#FFFFFF" />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              <View style={styles.featuredBookCard}>
                <View style={[styles.bookBadge, { backgroundColor: '#4ECDC4' }]}>
                  <Text style={styles.bookBadgeText}>🆕 New Release</Text>
                </View>
                <View style={styles.featuredBookImage}>
                  <LinearGradient
                    colors={['#4ECDC4', '#44A08D']}
                    style={styles.bookImageGradient}
                  >
                    <Text style={styles.bookTitleText}>ATOMIC HABITS</Text>
                    <View style={styles.bookDecorations}>
                      <Text style={styles.bookDecor}>⚡</Text>
                      <Text style={styles.bookDecor}>🎯</Text>
                    </View>
                  </LinearGradient>
                </View>
                <Text style={styles.featuredBookTitle}>Atomic Habits</Text>
                <Text style={styles.featuredBookAuthor}>by James Clear</Text>
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {[1,2,3,4,5].map((star) => (
                      <Ionicons key={star} name="star" size={12} color="#FFD700" />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>4.8</Text>
                  <Text style={styles.reviewCount}>(5.1k reviews)</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>$16.99</Text>
                  <Text style={styles.featuredBookPrice}>$12.50</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>26% OFF</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.addToCartButton} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#4ECDC4', '#44A08D']}
                    style={styles.addToCartGradient}
                  >
                    <Ionicons name="cart" size={14} color="#FFFFFF" />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.featuredBookCard}>
                <View style={[styles.bookBadge, { backgroundColor: '#FFD93D' }]}>
                  <Text style={styles.bookBadgeText}>🔥 Hot Pick</Text>
                </View>
                <View style={styles.featuredBookImage}>
                  <LinearGradient
                    colors={['#FFD93D', '#FF8E53']}
                    style={styles.bookImageGradient}
                  >
                    <Text style={styles.bookTitleText}>THE SEVEN HUSBANDS</Text>
                    <View style={styles.bookDecorations}>
                      <Text style={styles.bookDecor}>💫</Text>
                      <Text style={styles.bookDecor}>👑</Text>
                    </View>
                  </LinearGradient>
                </View>
                <Text style={styles.featuredBookTitle}>The Seven Husbands</Text>
                <Text style={styles.featuredBookAuthor}>by Taylor Jenkins Reid</Text>
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {[1,2,3,4,5].map((star) => (
                      <Ionicons key={star} name="star" size={12} color="#FFD700" />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>4.7</Text>
                  <Text style={styles.reviewCount}>(3.8k reviews)</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>$18.99</Text>
                  <Text style={styles.featuredBookPrice}>$13.99</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>26% OFF</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.addToCartButton} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#FFD93D', '#FF8E53']}
                    style={styles.addToCartGradient}
                  >
                    <Ionicons name="cart" size={14} color="#FFFFFF" />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <FilterButton type="ALL" label="All" />
          <FilterButton type="SELL" label="Sell" />
          <FilterButton type="DONATE" label="Donate" />
          <FilterButton type="RENT" label="Rent" />
        </View>

        {/* Books List - 2 Column Grid */}
        <View style={styles.booksContainer}>
          {filteredBooks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No books found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search' : 'Be the first to list a book!'}
              </Text>
            </View>
          ) : (
            <View style={styles.booksGrid}>
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateBook}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Book Creation Form Modal */}
      <BookListingForm
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Filter Side Panel */}
      <Modal
        visible={showFilterPanel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterPanel(false)}
      >
        <TouchableOpacity 
          style={styles.filterOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterPanel(false)}
        >
          <TouchableOpacity 
            style={styles.filterPanel}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.filterHeader}
            >
              <Text style={styles.filterHeaderTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterPanel(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
              {/* Location Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Location</Text>
                <TouchableOpacity
                  style={[styles.locationToggleFilter, locationEnabled && styles.locationToggleFilterActive]}
                  onPress={toggleLocation}
                >
                  <Ionicons
                    name={locationEnabled ? "location" : "location-outline"}
                    size={18}
                    color={locationEnabled ? "#FFFFFF" : "#6B7280"}
                  />
                  <Text style={[
                    styles.locationToggleFilterText,
                    locationEnabled && styles.locationToggleFilterTextActive
                  ]}>
                    {locationLoading ? 'Getting location...' : 'Use my location'}
                  </Text>
                </TouchableOpacity>

                {locationEnabled && (
                  <View style={styles.radiusFilterContainer}>
                    <View style={styles.radiusHeaderRow}>
                      <Text style={styles.radiusFilterLabel}>Search within</Text>
                      <Text style={styles.radiusValueText}>{selectedRadius >= 150 ? '150+' : selectedRadius} km</Text>
                    </View>
                    
                    {/* Slider Track */}
                    <View style={styles.sliderTrack}>
                      <View 
                        style={[
                          styles.sliderFill, 
                          { width: `${(Math.min(selectedRadius, 150) / 150) * 100}%` }
                        ]} 
                      />
                    </View>
                    
                    {/* Radius Options Scrollable */}
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.radiusOptionsScroll}
                      contentContainerStyle={styles.radiusOptionsContent}
                    >
                      {[5, 10, 15, 30, 50, 70, 100, 120, 150].map((radius) => (
                        <TouchableOpacity
                          key={radius}
                          style={[
                            styles.radiusChip,
                            selectedRadius === radius && styles.radiusChipActive
                          ]}
                          onPress={() => setSelectedRadius(radius)}
                        >
                          <Text style={[
                            styles.radiusChipText,
                            selectedRadius === radius && styles.radiusChipTextActive
                          ]}>
                            {radius === 150 ? '150+' : radius}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {locationError && (
                  <Text style={styles.locationErrorFilter}>{locationError}</Text>
                )}
              </View>

              {/* Listing Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Listing Type</Text>
                <View style={styles.filterOptions}>
                  {['SELL', 'DONATE', 'RENT'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterOption,
                        filterType === type && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterType(type as any)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterType === type && styles.filterOptionTextActive
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Condition Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Condition</Text>
                <View style={styles.filterOptions}>
                  {['EXCELLENT', 'GOOD', 'FAIR', 'POOR'].map((condition) => (
                    <TouchableOpacity
                      key={condition}
                      style={[
                        styles.filterOption,
                        selectedCondition === condition && styles.filterOptionActive
                      ]}
                      onPress={() => setSelectedCondition(condition)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedCondition === condition && styles.filterOptionTextActive
                      ]}>
                        {condition}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Category</Text>
                <View style={styles.filterOptions}>
                  {['NCERT', 'Reference', 'Competitive', 'Novel', 'Other'].map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterOption,
                        selectedCategory === category && styles.filterOptionActive
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedCategory === category && styles.filterOptionTextActive
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Filter Actions */}
            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setFilterType('ALL');
                  setSelectedCondition('ALL');
                  setSelectedCategory('ALL');
                }}
              >
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => {
                  setShowFilterPanel(false);
                  fetchBooks();
                }}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.applyFiltersGradient}
                >
                  <Text style={styles.applyFiltersText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  cartIconButton: {
    marginLeft: 12,
  },
  cartIconContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Banner Carousel Styles
  bannerCarouselContainer: {
    height: 180,
    marginBottom: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bannerWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  bannerSlide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  
  searchContainer: {
    marginTop: 0,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  locationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...ShadowUtils.medium(),
  },
  locationToggleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  locationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  locationToggleActive: {
    backgroundColor: '#4F46E5',
  },
  locationToggleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  locationToggleTextActive: {
    color: '#FFFFFF',
  },
  radiusContainer: {
    alignItems: 'center',
  },
  radiusLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  radiusOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radiusOptionActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  radiusOptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  radiusOptionTextActive: {
    color: '#FFFFFF',
  },
  locationError: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterButton: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },

  // Creative Advertisement Banner Styles
  adBannerContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  adBanner: {
    borderRadius: 20,
    padding: 24,
    ...ShadowUtils.large(),
  },
  adBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adBannerText: {
    flex: 1,
    marginRight: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adBannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sparkleContainer: {
    marginLeft: 8,
  },
  sparkle: {
    fontSize: 20,
  },
  adBannerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 22,
    marginBottom: 12,
  },
  offerBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  offerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shopNowButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  shopNowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  shopNowText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adBannerBooks: {
    position: 'relative',
    width: 80,
    height: 100,
  },
  bookStack: {
    position: 'absolute',
    width: 45,
    height: 65,
    borderRadius: 6,
    left: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  bookStack1: { top: 0, transform: [{ rotate: '-5deg' }] },
  bookStack2: { top: 8, transform: [{ rotate: '-2deg' }] },
  bookStack3: { top: 16, transform: [{ rotate: '2deg' }] },
  bookStack4: { top: 24, transform: [{ rotate: '5deg' }] },
  bookStack5: { top: 32, transform: [{ rotate: '8deg' }] },
  floatingIcons: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 16,
    top: 10,
    left: 10,
  },

  // Creative Categories Styles
  categoriesContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  trendingBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryCard: {
    alignItems: 'center',
    width: '23%',
  },
  categoryCardActive: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...ShadowUtils.medium(),
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  categoryTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  categoryCount: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  additionalCategories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  additionalCategoryCard: {
    alignItems: 'center',
    width: '23%',
  },
  additionalCategoryCardActive: {
    transform: [{ scale: 1.05 }],
  },
  additionalCategoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...ShadowUtils.medium(),
  },
  additionalCategoryEmoji: {
    fontSize: 22,
  },
  additionalCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  additionalCategoryTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },

  // Creative Featured Reads Styles
  featuredContainer: {
    marginBottom: 24,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  featuredBooksScroll: {
    marginHorizontal: -16,
    overflow: 'hidden',
  },
  featuredBooksMarquee: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  featuredBookCard: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    ...ShadowUtils.large(),
    position: 'relative',
  },
  bookBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
    ...ShadowUtils.createShadow('#000', { width: 0, height: 2 }, 0.1, 4, 3),
  },
  bookBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  featuredBookImage: {
    height: 140,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bookImageGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bookTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bookDecorations: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
  },
  bookDecor: {
    fontSize: 16,
  },
  featuredBookTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  featuredBookAuthor: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  featuredBookPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  discountBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addToCartButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  addToCartText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  booksContainer: {
    paddingBottom: 100,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bookCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    width: '48%', // Take up 48% width for 2 columns with spacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookImageContainer: {
    position: 'relative',
    height: 140, // Smaller height for grid layout
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
    flexWrap: 'wrap',
  },
  priceLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  priceInfo: {
    flex: 1,
  },
  rentPriceLabel: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 2,
  },
  distanceLocationContainer: {
    alignItems: 'flex-end',
    gap: 2,
  },
  distanceText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sellerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  sellerLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  listingAddToCartButton: {
    marginTop: 12,
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
  bookStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  // Filter Icon and Panel Styles
  filterIconButton: {
  },
  filterIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterPanel: {
    backgroundColor: '#FFFFFF',
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  filterHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  filterActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clearFiltersText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyFiltersButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyFiltersGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Location Filter Styles
  locationToggleFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  locationToggleFilterActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  locationToggleFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  locationToggleFilterTextActive: {
    color: '#FFFFFF',
  },
  radiusFilterContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  radiusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  radiusFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  radiusValueText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
  radiusOptionsScroll: {
    marginTop: 4,
  },
  radiusOptionsContent: {
    gap: 8,
    paddingRight: 16,
  },
  radiusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    minWidth: 60,
    alignItems: 'center',
  },
  radiusChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  radiusChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  radiusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  locationErrorFilter: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
  },
});

export default BookStoreScreen;

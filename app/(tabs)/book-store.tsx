import BookListingForm from '@/components/BookListingForm';
import { apiFetchAuth, getImageUrl as getImageUrlFromApi } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { ShadowUtils } from '@/utils/shadowUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  { name: 'ALL', emoji: '📚', label: 'All Books', icon: 'library' as const },
  { name: 'Academic', emoji: '📚', label: 'Academic', icon: 'school' as const },
  { name: 'Exam Preparation', emoji: '📚', label: 'Exam Prep', icon: 'document-text' as const },
  { name: 'Literature', emoji: '📚', label: 'Literature', icon: 'book' as const },
  { name: 'Language Learning', emoji: '📚', label: 'Language', icon: 'language' as const },
  { name: 'Technical', emoji: '📚', label: 'Technical', icon: 'code-slash' as const },
  { name: 'Business', emoji: '📚', label: 'Business', icon: 'briefcase' as const },
  { name: 'Arts & Design', emoji: '📚', label: 'Arts', icon: 'color-palette' as const },
];

const BookStoreScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    if (!user?.token) {
      return;
    }
    try {
      const response = await apiFetchAuth('/books/cart', user.token);
      if (response.ok && response.data.success) {
        const cartItems = response.data.data?.items || [];
        setCartCount(cartItems.length || 0);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
      // Silently fail - don't show error to user
      setCartCount(0);
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

  // Helper: all image URLs go through getImageUrlFromApi (uses score.yottascore.com, replaces old domain)
  const getImageUrl = (imageUrl: string | undefined | null): string | null => {
    if (!imageUrl || imageUrl.trim() === '') return null;
    try {
      const finalUrl = getImageUrlFromApi(imageUrl);
      if (!finalUrl || !(finalUrl.startsWith('http://') || finalUrl.startsWith('https://'))) return null;
      new URL(finalUrl);
      return finalUrl;
    } catch {
      return null;
    }
  };

  const BookCard = ({ book }: { book: Book }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={() => router.push(`/(tabs)/book-details?bookId=${book.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.bookImageContainer}>
        {book.coverImage && getImageUrl(book.coverImage) ? (
          <Image 
            source={{ uri: getImageUrl(book.coverImage)! }} 
            style={styles.bookImage}
            resizeMode="cover"
            onError={() => {}}
          />
        ) : (
          <View style={[styles.bookImage, styles.bookImagePlaceholder]}>
            <Ionicons name="book" size={36} color="#94A3B8" />
          </View>
        )}
        <View style={[styles.listingTypeBadge, { backgroundColor: getListingTypeColor(book.listingType) }]}>
          <Text style={styles.listingTypeText}>{book.listingType}</Text>
        </View>
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
        <View style={styles.bookMetaRow}>
          <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(book.condition) + '18' }]}>
            <Text style={[styles.conditionText, { color: getConditionColor(book.condition) }]}>{book.condition}</Text>
          </View>
          {book.listingType === 'DONATE' ? (
            <Text style={styles.bookPrice}>Free</Text>
          ) : (
            <Text style={styles.bookPrice}>₹{book.price}{book.rentPrice ? ` · Rent ₹${book.rentPrice}` : ''}</Text>
          )}
        </View>
        {locationEnabled && book.distance !== undefined && (
          <View style={styles.bookDistanceRow}>
            <Ionicons name="location" size={12} color="#6366F1" />
            <Text style={styles.bookDistanceText}>{formatDistance(book.distance)} away</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.listingAddToCartButton}
          onPress={(e) => { e.stopPropagation(); handleAddToCart(book); }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.listingAddToCartGradient}
          >
            <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
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
        colors={['#F5F3FF', '#EDE9FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        {/* Header: icon + title block + cart */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeftBlock}>
            <Image source={require('@/assets/images/icons/book.png')} style={styles.headerBookIcon} resizeMode="contain" />
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Book Store</Text>
              <Text style={styles.headerSubtitle}>Buy, rent & share study materials</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.cartIconButton}
            onPress={() => router.push('/(tabs)/cart')}
            activeOpacity={0.7}
          >
            <View style={styles.cartIconContainer}>
              <Image source={require('@/assets/images/icons/trolley.png')} style={styles.cartTrolleyIcon} resizeMode="contain" />
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
            <Image source={require('@/assets/images/icons/search.png')} style={[styles.searchIcon, styles.searchBarIcon]} resizeMode="contain" />
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
              <Ionicons name="options" size={20} color="#6366F1" />
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

        {/* Explore Categories - Enhanced educative / exam feel */}
        <View style={styles.categoriesContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Image source={require('@/assets/images/icons/adventurer.png')} style={styles.exploreCategoriesIcon} resizeMode="contain" />
              <Text style={styles.sectionTitle}>Explore Categories</Text>
            </View>
          </View>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.slice(0, 4).map((category, index) => {
              const isActive = selectedCategory === category.name;
              const gradients: [string, string][] = [
                ['#818CF8', '#A78BFA'],
                ['#38BDF8', '#818CF8'],
                ['#34D399', '#6EE7B7'],
                ['#E879F9', '#C084FC']
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
                    colors={isActive ? ['#6366F1', '#8B5CF6'] : (gradients[index] || ['#818CF8', '#A78BFA'])}
                    style={styles.categoryIconContainer}
                  >
                    <Ionicons name={category.icon} size={28} color="#FFFFFF" />
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
                ['#38BDF8', '#22D3EE'],
                ['#A78BFA', '#C4B5FD'],
                ['#F472B6', '#FB7185'],
                ['#FBBF24', '#FCD34D'],
                ['#2DD4BF', '#5EEAD4']
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
                    colors={isActive ? ['#6366F1', '#8B5CF6'] : (gradients[index] || ['#38BDF8', '#22D3EE'])}
                    style={styles.additionalCategoryIconContainer}
                  >
                    <Ionicons name={category.icon} size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.additionalCategoryText, isActive && styles.additionalCategoryTextActive]}>{category.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Creative Advertisement Banner - light & attractive */}
        <View style={styles.adBannerContainer}>
          <View style={styles.adBanner}>
            <View style={styles.adBannerBgDecor}>
              <View style={[styles.adBannerCircle, styles.adBannerCircle1]} />
              <View style={[styles.adBannerCircle, styles.adBannerCircle2]} />
              <View style={[styles.adBannerCircle, styles.adBannerCircle3]} />
            </View>
            <LinearGradient
              colors={['#FFFBEB', '#FEF3C7', '#FDE68A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.adBannerGradient}
            >
              <View style={styles.adBannerContent}>
                <View style={styles.adBannerText}>
                  <View style={styles.titleContainer}>
                    <View style={styles.adBannerTitleIconWrap}>
                      <Ionicons name="book" size={22} color="#B45309" />
                    </View>
                    <Text style={styles.adBannerTitle}>Unlock Your Next Adventure!</Text>
                  </View>
                  <View style={styles.offerBadge}>
                    <Ionicons name="flash" size={14} color="#059669" />
                    <Text style={styles.offerText}>Limited time offer</Text>
                  </View>
                  <TouchableOpacity style={styles.shopNowButton} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#D97706', '#B45309']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.shopNowGradient}
                    >
                      <Text style={styles.shopNowText}>Shop Now</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <View style={styles.adBannerBooks}>
                  <View style={[styles.bookStack, styles.bookStack1, { backgroundColor: '#818CF8' }]} />
                  <View style={[styles.bookStack, styles.bookStack2, { backgroundColor: '#34D399' }]} />
                  <View style={[styles.bookStack, styles.bookStack3, { backgroundColor: '#38BDF8' }]} />
                  <View style={[styles.bookStack, styles.bookStack4, { backgroundColor: '#A78BFA' }]} />
                  <View style={[styles.bookStack, styles.bookStack5, { backgroundColor: '#FBBF24' }]} />
                  <View style={styles.floatingIcons}>
                    <View style={styles.floatingIconWrap}><Ionicons name="book-outline" size={18} color="#6366F1" /></View>
                    <View style={[styles.floatingIconWrap, { top: -8, left: 22 }]}><Ionicons name="star" size={14} color="#F59E0B" /></View>
                    <View style={[styles.floatingIconWrap, { top: 8, right: -2 }]}><Ionicons name="sparkles" size={14} color="#8B5CF6" /></View>
                  </View>
                </View>
              </View>
            </LinearGradient>
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
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.15)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeftBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBookIcon: {
    width: 48,
    height: 48,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'ios' ? { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 } : {}),
    elevation: 2,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 0,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
  },
  cartIconButton: {
    marginLeft: 8,
  },
  cartIconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  cartTrolleyIcon: {
    width: 40,
    height: 40,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    marginBottom: 14,
    marginTop: 12,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.18)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBarIcon: {
    width: 20,
    height: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
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

  // Creative Advertisement Banner Styles - light & attractive
  adBannerContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  adBanner: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'ios' ? { shadowColor: '#D97706', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16 } : {}),
    elevation: 4,
  },
  adBannerBgDecor: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: 'hidden',
  },
  adBannerCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  adBannerCircle1: { width: 140, height: 140, top: -40, right: -30 },
  adBannerCircle2: { width: 80, height: 80, bottom: -20, left: -20 },
  adBannerCircle3: { width: 60, height: 60, top: '40%', right: 20 },
  adBannerGradient: {
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
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
    marginBottom: 10,
    gap: 10,
  },
  adBannerTitleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(180, 83, 9, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adBannerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.2,
    lineHeight: 26,
  },
  adBannerSubtitle: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 12,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  offerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  shopNowButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  shopNowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 8,
  },
  shopNowText: {
    fontSize: 14,
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
    width: 42,
    height: 60,
    borderRadius: 8,
    left: 10,
    ...(Platform.OS === 'ios' ? { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 } : {}),
    elevation: 3,
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
  floatingIconWrap: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    top: 10,
    left: 8,
    ...(Platform.OS === 'ios' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 } : {}),
    elevation: 2,
  },

  // Creative Categories Styles
  categoriesContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exploreCategoriesIcon: {
    width: 48,
    height: 48,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.2,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  trendingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    width: '22%',
    minWidth: 72,
  },
  categoryCardActive: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...(Platform.OS === 'ios' ? { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 } : {}),
    elevation: 4,
  },
  categoryText: {
    fontSize: 12,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  additionalCategoryCard: {
    alignItems: 'center',
    width: '22%',
    minWidth: 72,
  },
  additionalCategoryCardActive: {
    transform: [{ scale: 1.05 }],
  },
  additionalCategoryIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...(Platform.OS === 'ios' ? { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6 } : {}),
    elevation: 3,
  },
  additionalCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
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
    gap: 12,
  },
  bookCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    width: '47%',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.08)',
    ...(Platform.OS === 'ios' ? { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 } : {}),
    elevation: 3,
  },
  bookImageContainer: {
    position: 'relative',
    height: 120,
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  bookImagePlaceholder: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  listingTypeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  bookInfo: {
    padding: 10,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
    lineHeight: 19,
  },
  bookMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  conditionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  bookPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  bookDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  bookDistanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  listingAddToCartButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  listingAddToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  listingAddToCartText: {
    fontSize: 12,
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
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
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

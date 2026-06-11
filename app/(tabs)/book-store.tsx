import BookListingForm from '@/components/BookListingForm';
import { apiFetchAuth, getImageUrl as getImageUrlFromApi } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { ShadowUtils } from '@/utils/shadowUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Filter,
  MapPin,
  Menu,
  Play,
  Plus,
  Search,
  ShoppingCart,
  Star,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 16;

const C = {
  bg: ['#EDE9FE', '#F5F3FF', '#FAFAFF'] as const,
  primary: HomeTheme.primary,
  primaryLight: HomeTheme.primaryLight,
  ink: HomeTheme.ink,
  muted: HomeTheme.inkMuted,
  card: HomeTheme.card,
  border: HomeTheme.border,
  ctaGrad: [...HomeTheme.heroCta] as const,
  filterGrad: [...HomeTheme.btnGradient] as const,
};

const CATEGORY_GRADS: [string, string][] = [
  ['#8E78E7', '#6344D4'],
  ['#A594F0', '#7C3AED'],
  ['#C4B5FD', '#8B5CF6'],
  ['#DDD6FE', '#6366F1'],
  ['#8E78E7', '#5546C9'],
  ['#A78BFA', '#6344D4'],
  ['#B794F6', '#7C3AED'],
  ['#C4B5FD', '#6D28D9'],
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

/** Mockup-style category chips (pastel bg + colored icon) */
const MOCKUP_CATEGORIES = [
  { name: 'Literature', label: 'Fiction', icon: 'book' as const, bg: '#F3EEFF', color: '#7C3AED' },
  { name: 'Academic', label: 'Academic', icon: 'school' as const, bg: '#FFF7ED', color: '#EA580C' },
  { name: 'Business', label: 'Business', icon: 'briefcase' as const, bg: '#ECFDF5', color: '#059669' },
  { name: 'Technical', label: 'Technology', icon: 'code-slash' as const, bg: '#EFF6FF', color: '#2563EB' },
  { name: 'Language Learning', label: 'Self Help', icon: 'heart' as const, bg: '#FDF2F8', color: '#DB2777' },
  { name: 'Exam Preparation', label: 'Competitive', icon: 'trophy' as const, bg: '#FEF9C3', color: '#CA8A04' },
];

const HERO_SLIDES = [
  {
    tag: 'Deal of the Day',
    title: 'Expand Your Mind,\nRead Daily',
    sub: 'Discover books that inspire and transform you.',
    image: require('@/assets/images/book.jpg'),
    badge: 'Best Seller',
  },
  {
    tag: 'Student Picks',
    title: 'Study Smarter,\nNot Harder',
    sub: 'Find academic books near you at great prices.',
    image: require('@/assets/images/icons/book-shop.png'),
    badge: 'Top Rated',
  },
  {
    tag: 'New Arrivals',
    title: 'Your Next\nGreat Read',
    sub: 'Browse rent, buy & free donate listings.',
    image: require('@/assets/images/icons/book.png'),
    badge: 'Fresh',
  },
];

function SectionHeader({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  return (
    <View style={mock.sectionHead}>
      <Text style={mock.sectionTitle}>{title}</Text>
      {onViewAll ? (
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.85} style={mock.viewAllBtn}>
          <Text style={mock.viewAllTxt}>View All</Text>
          <Ionicons name="chevron-forward" size={14} color="#6366F1" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function TrendingBookCard({
  book,
  imageUri,
  onPress,
}: {
  book: Book;
  imageUri: string | null;
  onPress: () => void;
}) {
  const rating = book.seller?.bookProfile?.averageRating
    ? book.seller.bookProfile.averageRating.toFixed(1)
    : '4.8';
  const priceLabel =
    book.listingType === 'DONATE' ? 'Free' : `₹${book.price}`;

  return (
    <TouchableOpacity style={mock.trendCard} onPress={onPress} activeOpacity={0.92}>
      <View style={mock.trendCoverWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={mock.trendCover} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#EDE9FE', '#C4B5FD']} style={mock.trendCover}>
            <BookOpen size={28} color={C.primary} strokeWidth={1.8} />
          </LinearGradient>
        )}
        {book.views > 50 ? (
          <View style={mock.trendBadge}>
            <Text style={mock.trendBadgeTxt}>Bestseller</Text>
          </View>
        ) : null}
      </View>
      <Text style={mock.trendTitle} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={mock.trendAuthor} numberOfLines={1}>
        {book.author}
      </Text>
      <View style={mock.trendFoot}>
        <View style={mock.trendRating}>
          <Star size={12} color="#FBBF24" fill="#FBBF24" />
          <Text style={mock.trendRatingTxt}>{rating}</Text>
        </View>
        <Text style={mock.trendPrice}>{priceLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

const BookStoreScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams() as { openCreate?: string };
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
  
  useEffect(() => {
    requestLocationPermission();
    fetchCartCount();
    fetchBooks();
    // If route param asks to open create modal, open it
    if (params?.openCreate === '1') {
      setShowCreateModal(true);
    }
  }, []);

  // Fetch books when location dependencies change (not category)
  useEffect(() => {
    if (locationEnabled || selectedRadius || userLocation) {
      fetchBooks();
    }
  }, [locationEnabled, selectedRadius, userLocation?.lat, userLocation?.lng]);

  // Auto-scroll hero carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4000);
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

  const trendingBooks = useMemo(
    () => [...filteredBooks].sort((a, b) => b.views + b.likes - (a.views + a.likes)).slice(0, 12),
    [filteredBooks],
  );
  const recommendedBooks = useMemo(() => filteredBooks.slice(0, 10), [filteredBooks]);
  const continueBook = trendingBooks[0] ?? filteredBooks[0] ?? null;

  const openBook = (id: string) => router.push(`/(tabs)/book-details?bookId=${id}` as const);
  const openCategory = (cat: typeof MOCKUP_CATEGORIES[0]) => {
    router.push({
      pathname: '/(tabs)/category-books',
      params: { category: cat.name, categoryLabel: cat.label, categoryEmoji: '📚' },
    });
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
    <View style={styles.bookCardOuter}>
      <TouchableOpacity
        style={styles.bookCard}
        onPress={() => router.push(`/(tabs)/book-details?bookId=${book.id}`)}
        activeOpacity={0.92}
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
            <LinearGradient colors={[...HomeTheme.heroBg]} style={[styles.bookImage, styles.bookImagePlaceholder]}>
              <BookOpen size={28} color={C.primary} strokeWidth={1.8} />
            </LinearGradient>
          )}
          <LinearGradient colors={['transparent', 'rgba(15,10,30,0.5)']} style={styles.bookImageFade} />
          <View style={[styles.listingTypeBadge, { backgroundColor: getListingTypeColor(book.listingType) }]}>
            <Text style={styles.listingTypeText}>{book.listingType}</Text>
          </View>
        </View>
        <LinearGradient colors={['#FFFBF7', '#FFFFFF']} style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>by {book.author}</Text>
          <View style={styles.bookMetaRow}>
            <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(book.condition) + '18' }]}>
              <Text style={[styles.conditionText, { color: getConditionColor(book.condition) }]}>{book.condition}</Text>
            </View>
            {book.listingType === 'DONATE' ? (
              <Text style={styles.bookPriceFree}>FREE</Text>
            ) : (
              <Text style={styles.bookPrice}>₹{book.price}</Text>
            )}
          </View>
          {locationEnabled && book.distance !== undefined ? (
            <View style={styles.bookDistanceRow}>
              <MapPin size={10} color={C.primary} strokeWidth={2} />
              <Text style={styles.bookDistanceText}>{formatDistance(book.distance)} away</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.listingAddToCartButton}
            onPress={(e) => { e.stopPropagation(); handleAddToCart(book); }}
            activeOpacity={0.88}
          >
            <LinearGradient colors={[...C.ctaGrad]} style={styles.listingAddToCartGradient}>
              <ShoppingCart size={13} color="#FFF" strokeWidth={2.2} />
              <Text style={styles.listingAddToCartText}>
                {book.listingType === 'DONATE' ? 'Get Free' : 'Add to Cart'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const FilterButton = ({ type, label }: { type: string; label: string }) => {
    const active = filterType === type;
    return (
      <TouchableOpacity
        style={styles.filterBtnWrap}
        onPress={() => setFilterType(type as typeof filterType)}
        activeOpacity={0.88}
      >
        {active ? (
          <LinearGradient colors={[...C.filterGrad]} style={styles.filterButtonActive}>
            <Text style={styles.filterButtonTextActive}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.filterButton}>
            <Text style={styles.filterButtonText}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
                                Alert.alert('Error', 'Failed to add book to cart. Please try again.');
              }
            }
          }
        ]
      );
    }
  };

  if (loading && books.length === 0 && !refreshing) {
    return (
      <LinearGradient colors={[...C.bg]} style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading book store…</Text>
      </LinearGradient>
    );
  }

  const heroSlide = HERO_SLIDES[currentBannerIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={mock.screenBg} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header — mockup */}
        <View style={mock.topBar}>
          <TouchableOpacity
            style={mock.iconBtn}
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            activeOpacity={0.8}
          >
            <Menu size={22} color="#1F2937" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={mock.logo}>
            <Text style={mock.logoDark}>Book </Text>
            <Text style={mock.logoPurple}>Store</Text>
          </Text>
          <TouchableOpacity style={mock.iconBtn} onPress={() => router.push('/(tabs)/cart')} activeOpacity={0.8}>
            <Bell size={22} color="#1F2937" strokeWidth={2} />
            {cartCount > 0 ? <View style={mock.notifDot} /> : null}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={mock.searchRow}>
          <View style={mock.searchBox}>
            <Search size={18} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              style={mock.searchInput}
              placeholder="Search books, authors, categories..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={mock.filterIconBtn} onPress={() => setShowFilterPanel(true)} activeOpacity={0.85}>
            <Filter size={20} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 110, paddingHorizontal: PAD }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
          }
        >
          {/* Deal of the Day hero */}
          <View style={mock.heroCard}>
            <LinearGradient
              colors={['#7C3AED', '#9333EA', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={mock.heroGrad}
            >
              <View style={mock.heroLeft}>
                <Text style={mock.heroTag}>📖 {heroSlide.tag}</Text>
                <Text style={mock.heroTitle}>{heroSlide.title}</Text>
                <Text style={mock.heroSub}>{heroSlide.sub}</Text>
                <TouchableOpacity style={mock.exploreBtn} activeOpacity={0.9} onPress={() => setCurrentBannerIndex((i) => (i + 1) % HERO_SLIDES.length)}>
                  <Text style={mock.exploreBtnTxt}>Explore Now</Text>
                  <View style={mock.exploreArrow}>
                    <ArrowRight size={16} color={C.primary} strokeWidth={2.5} />
                  </View>
                </TouchableOpacity>
                <View style={mock.heroDots}>
                  {HERO_SLIDES.map((_, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setCurrentBannerIndex(i)}
                      style={[mock.dot, currentBannerIndex === i && mock.dotActive]}
                    />
                  ))}
                </View>
              </View>
              <View style={mock.heroRight}>
                <Image source={heroSlide.image} style={mock.heroBookImg} resizeMode="contain" />
                <View style={mock.heroBestBadge}>
                  <Text style={mock.heroBestTxt}>{heroSlide.badge}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Categories */}
          <SectionHeader title="Categories" onViewAll={() => openCategory(MOCKUP_CATEGORIES[0])} />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={MOCKUP_CATEGORIES}
            keyExtractor={(item) => item.name}
            contentContainerStyle={mock.catList}
            renderItem={({ item }) => (
              <TouchableOpacity style={[mock.catCard, { backgroundColor: item.bg }]} onPress={() => openCategory(item)} activeOpacity={0.88}>
                <View style={[mock.catIconWrap, { backgroundColor: item.color + '22' }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={mock.catLabel}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />

          {/* Trending Now */}
          <SectionHeader title="Trending Now" onViewAll={() => trendingBooks[0] && openBook(trendingBooks[0].id)} />
          {trendingBooks.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={trendingBooks}
              keyExtractor={(item) => item.id}
              contentContainerStyle={mock.hListPad}
              renderItem={({ item }) => (
                <TrendingBookCard
                  book={item}
                  imageUri={getImageUrl(item.coverImage)}
                  onPress={() => openBook(item.id)}
                />
              )}
            />
          ) : (
            <Text style={mock.emptyHint}>No trending books yet — list yours!</Text>
          )}

          {/* Continue Reading */}
          {continueBook ? (
            <>
              <SectionHeader title="Continue Reading" />
              <View style={mock.continueCard}>
                <Image
                  source={getImageUrl(continueBook.coverImage) ? { uri: getImageUrl(continueBook.coverImage)! } : require('@/assets/images/book.jpg')}
                  style={mock.continueThumb}
                  resizeMode="cover"
                />
                <View style={mock.continueMid}>
                  <Text style={mock.continueLbl}>Continue Reading</Text>
                  <Text style={mock.continueTitle} numberOfLines={1}>{continueBook.title}</Text>
                  <Text style={mock.continueAuthor} numberOfLines={1}>{continueBook.author}</Text>
                  <Text style={mock.continuePct}>80% Completed</Text>
                  <View style={mock.progressTrack}>
                    <View style={[mock.progressFill, { width: '80%' }]} />
                  </View>
                </View>
                <TouchableOpacity style={mock.resumeBtn} onPress={() => openBook(continueBook.id)} activeOpacity={0.9}>
                  <Play size={14} color="#FFF" fill="#FFF" />
                  <Text style={mock.resumeTxt}>Resume Reading</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          {/* Recommended */}
          <SectionHeader title="Recommended For You" onViewAll={() => recommendedBooks[0] && openBook(recommendedBooks[0].id)} />
          {recommendedBooks.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={recommendedBooks}
              keyExtractor={(item) => `rec-${item.id}`}
              contentContainerStyle={mock.hListPad}
              renderItem={({ item }) => {
                const uri = getImageUrl(item.coverImage);
                return (
                  <TouchableOpacity style={mock.recCard} onPress={() => openBook(item.id)} activeOpacity={0.9}>
                    {uri ? (
                      <Image source={{ uri }} style={mock.recCover} resizeMode="cover" />
                    ) : (
                      <LinearGradient colors={['#EDE9FE', '#C4B5FD']} style={mock.recCover}>
                        <BookOpen size={32} color={C.primary} />
                      </LinearGradient>
                    )}
                    <Text style={mock.recTitle} numberOfLines={2}>{item.title}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          ) : null}

          {/* All books — filters + grid */}
          <View style={styles.filterContainer}>
            <FilterButton type="ALL" label="All" />
            <FilterButton type="SELL" label="Sell" />
            <FilterButton type="DONATE" label="Donate" />
            <FilterButton type="RENT" label="Rent" />
          </View>
          <SectionHeader title="All Books" />
          {filteredBooks.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={40} color={C.primary} strokeWidth={1.8} />
              <Text style={styles.emptyTitle}>No books found</Text>
              <TouchableOpacity onPress={handleCreateBook} activeOpacity={0.9}>
                <LinearGradient colors={[...C.ctaGrad]} style={styles.emptyCta}>
                  <Plus size={18} color="#FFF" strokeWidth={2.5} />
                  <Text style={styles.emptyCtaTxt}>List Your Book</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.booksGrid}>
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fabWrap} onPress={handleCreateBook} activeOpacity={0.92}>
          <LinearGradient colors={[...C.ctaGrad]} style={styles.fab}>
            <Plus size={26} color="#FFF" strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>

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
              colors={[...C.filterGrad]}
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
                  colors={[...C.ctaGrad]}
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
  container: { flex: 1 },
  safe: { flex: 1 },
  orb1: {
    position: 'absolute',
    width: SCREEN_W * 0.7,
    height: SCREEN_W * 0.7,
    borderRadius: SCREEN_W,
    backgroundColor: 'rgba(142, 120, 231, 0.1)',
    top: -SCREEN_W * 0.2,
    right: -SCREEN_W * 0.22,
  },
  orb2: {
    position: 'absolute',
    width: SCREEN_W * 0.5,
    height: SCREEN_W * 0.5,
    borderRadius: SCREEN_W,
    backgroundColor: 'rgba(236, 72, 153, 0.06)',
    bottom: 100,
    left: -SCREEN_W * 0.15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: C.primary,
  },
  header: {
    paddingHorizontal: PAD,
    paddingBottom: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  titleBorder: { flex: 1, borderRadius: 18, padding: 2 },
  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 12,
  },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBookIcon: { width: 36, height: 36 },
  headerTitleContainer: { flex: 1 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  headerBadgeTxt: { fontFamily: FontFamily.semiBold, fontSize: 9, color: '#713F12' },
  headerTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 17,
    color: C.ink,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: C.muted,
    marginTop: 2,
  },
  cartBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8 }
      : { elevation: 3 }),
  },
  cartBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cartBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#FFF',
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickStat: { flex: 1, alignItems: 'center', gap: 2 },
  quickStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: HomeTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quickStatIconActive: { backgroundColor: '#DCFCE7' },
  quickStatVal: { fontFamily: FontFamily.bold, fontSize: 12, color: C.ink },
  quickStatLbl: { fontFamily: FontFamily.medium, fontSize: 9, color: C.muted },
  quickStatDiv: { width: 1, height: 28, backgroundColor: C.border },
  searchBorder: { flex: 1, borderRadius: 15, padding: 1.5 },
  content: {
    flex: 1,
    paddingHorizontal: PAD,
  },
  
  bannerBorder: {
    borderRadius: 18,
    padding: 2,
    marginTop: 10,
    marginBottom: 14,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 }
      : { elevation: 4 }),
  },
  bannerCarouselContainer: {
    height: 188,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
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
  bannerSlideInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  bannerTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  heroTagTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 17,
  },
  bannerImageWrap: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerHeroImage: {
    width: 96,
    height: 96,
  },
  heroBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FBBF24',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350F',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 }
      : { elevation: 1 }),
  },
  searchIcon: { marginRight: 4 },
  searchBarIcon: { width: 18, height: 18 },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: C.ink,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconButton: {},
  filterIconGradient: {},
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
    marginTop: 14,
    marginBottom: 18,
    gap: 8,
  },
  filterBtnWrap: { flex: 1 },
  filterButton: {
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
  },
  filterButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: C.muted,
  },
  filterButtonTextActive: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: '#FFF',
  },
  activeFilterButton: {},
  activeFilterButtonText: {},

  adBannerContainer: { marginTop: 16, marginBottom: 20 },
  adBanner: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#4B32AF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12 }
      : { elevation: 5 }),
  },
  adBannerOrb: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -30,
    right: 20,
  },
  adBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adBannerText: { flex: 1, paddingRight: 8 },
  adBannerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 21,
    marginBottom: 4,
  },
  adBannerSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 16,
    marginBottom: 10,
  },
  shopNowButton: { alignSelf: 'flex-start' },
  shopNowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  shopNowTextDark: { fontFamily: FontFamily.bold, fontSize: 12, color: C.primary },
  adBannerImg: { width: 64, height: 64, opacity: 0.95 },

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
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: C.ink,
  },
  booksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  booksCountPill: {
    backgroundColor: 'rgba(99, 68, 212, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  booksCountTxt: { fontFamily: FontFamily.bold, fontSize: 12, color: C.primary },
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
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...(Platform.OS === 'ios' ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 } : {}),
    elevation: 4,
  },
  categoryText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: C.ink,
    textAlign: 'center',
  },
  categoryTextActive: {
    color: C.primary,
    fontFamily: FontFamily.bold,
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
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...(Platform.OS === 'ios' ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 } : {}),
    elevation: 3,
  },
  additionalCategoryText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: HomeTheme.inkSecondary,
    textAlign: 'center',
  },
  additionalCategoryTextActive: {
    color: C.primary,
    fontFamily: FontFamily.bold,
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
  bookCardOuter: {
    width: '47%',
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }
      : { elevation: 3 }),
  },
  bookCard: {
    backgroundColor: C.card,
    borderRadius: 15,
    overflow: 'hidden',
  },
  bookImageContainer: {
    position: 'relative',
    height: 128,
  },
  bookImageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
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
    paddingTop: 8,
  },
  bookTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: C.ink,
    marginBottom: 2,
    lineHeight: 18,
  },
  bookAuthor: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: C.muted,
    marginBottom: 6,
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
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: C.primary,
  },
  bookPriceFree: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#059669',
  },
  bookDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  bookDistanceText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: C.primary,
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
    fontFamily: FontFamily.bold,
    fontSize: 11,
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
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: C.ink,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
  },
  emptyCtaTxt: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFF' },
  fabWrap: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    borderRadius: 28,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 }
      : { elevation: 8 }),
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: C.primary,
    borderColor: C.primary,
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
    backgroundColor: C.primary,
    borderColor: C.primary,
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
    color: C.primary,
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
    backgroundColor: C.primary,
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
    backgroundColor: C.primary,
    borderColor: C.primary,
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

const TREND_W = 132;
const REC_W = 100;

const mock = StyleSheet.create({
  screenBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFBF7',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logo: { fontSize: 20, fontFamily: FontFamily.bold },
  logoDark: { color: '#111827', fontFamily: FontFamily.extraBold },
  logoPurple: { color: C.primary, fontFamily: FontFamily.extraBold },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    gap: 10,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#111827',
    paddingVertical: 0,
  },
  filterIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 22,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 }
      : { elevation: 8 }),
  },
  heroGrad: {
    flexDirection: 'row',
    minHeight: 200,
    padding: 18,
    alignItems: 'center',
  },
  heroLeft: { flex: 1, paddingRight: 8 },
  heroTag: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: FontFamily.extraBold,
    color: '#FFF',
    lineHeight: 26,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 17,
    marginBottom: 14,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 6,
    gap: 8,
    marginBottom: 12,
  },
  exploreBtnTxt: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: C.primary,
  },
  exploreArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDots: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { width: 18, backgroundColor: '#FFF' },
  heroRight: {
    width: 120,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBookImg: { width: 100, height: 130 },
  heroBestBadge: {
    position: 'absolute',
    bottom: 4,
    right: 0,
    backgroundColor: '#FBBF24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  heroBestTxt: { fontSize: 9, fontFamily: FontFamily.extraBold, color: '#78350F' },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllTxt: { fontSize: 13, fontFamily: FontFamily.semiBold, color: '#6366F1' },
  catList: { gap: 12, paddingBottom: 20 },
  catCard: {
    width: 88,
    height: 88,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  catIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: '#374151',
    textAlign: 'center',
  },
  hListPad: { gap: 12, paddingBottom: 22 },
  emptyHint: {
    fontSize: 13,
    color: C.muted,
    fontFamily: FontFamily.medium,
    marginBottom: 16,
  },
  trendCard: {
    width: TREND_W,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }
      : { elevation: 2 }),
  },
  trendCoverWrap: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  trendCover: { width: '100%', height: '100%' },
  trendBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FBBF24',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendBadgeTxt: { fontSize: 9, fontFamily: FontFamily.bold, color: '#78350F' },
  trendTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginBottom: 2,
    minHeight: 34,
  },
  trendAuthor: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280', marginBottom: 6 },
  trendFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trendRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendRatingTxt: { fontSize: 11, fontFamily: FontFamily.semiBold, color: '#374151' },
  trendPrice: { fontSize: 13, fontFamily: FontFamily.bold, color: C.primary },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    gap: 10,
  },
  continueThumb: { width: 56, height: 72, borderRadius: 10 },
  continueMid: { flex: 1 },
  continueLbl: { fontSize: 11, fontFamily: FontFamily.semiBold, color: C.primary, marginBottom: 2 },
  continueTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: '#111827' },
  continueAuthor: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B7280', marginBottom: 6 },
  continuePct: { fontSize: 10, fontFamily: FontFamily.medium, color: '#6B7280', marginBottom: 4 },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 3 },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resumeTxt: { fontSize: 10, fontFamily: FontFamily.bold, color: '#FFF' },
  recCard: { width: REC_W, marginRight: 4 },
  recCover: {
    width: REC_W,
    height: 140,
    borderRadius: 12,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recTitle: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: '#374151',
    textAlign: 'center',
  },
});

export default BookStoreScreen;

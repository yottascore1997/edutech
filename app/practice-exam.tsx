import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface PracticeExam {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  spots: number;
  spotsLeft: number;
  startTime: string;
  endTime: string;
  attempted: boolean;
}

interface CategoryStats {
  totalExams: number;
  attemptedExams: number;
  subcategories: string[];
}

const PracticeExamScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ [key: string]: CategoryStats }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const sparkleAnim1 = useRef(new Animated.Value(0)).current;
  const sparkleAnim2 = useRef(new Animated.Value(0)).current;
  const sparkleAnim3 = useRef(new Animated.Value(0)).current;
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;


  useEffect(() => {
    fetchPracticeExams();
    startAnimations();
  }, []);

  // Start header animations
  const startAnimations = () => {
    // Sparkle animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim1, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim1, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(sparkleAnim2, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim2, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(sparkleAnim3, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim3, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim1, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim1, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(floatingAnim2, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim2, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for image
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Practice Exam screen focused - refreshing data');
      fetchPracticeExams();
    }, [])
  );

  // Auto-refresh every 30 seconds when screen is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.token) {
        console.log('🔄 Auto-refreshing Practice Exam data');
        fetchPracticeExams();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user?.token]);

  // Calculate category stats when exams change
  useEffect(() => {
    if (exams.length > 0) {
      console.log('🔄 Calculating category stats...');
      calculateCategoryStats();
    }
  }, [exams]);

  const fetchPracticeExams = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Fetching practice exams...');
      const response = await apiFetchAuth('/student/practice-exams', user.token);
      if (response.ok) {
        console.log('✅ Practice exams fetched successfully:', response.data.length, 'exams');
        console.log('📊 Sample exam data:', response.data[0]);
        setExams(response.data);
      } else {
        console.error('❌ Failed to fetch practice exams:', response.data);
        showError('Failed to load practice exams. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error fetching practice exams:', error);
      showError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCategoryStats = () => {
    const stats: { [key: string]: CategoryStats } = {};
    
    exams.forEach(exam => {
      if (!stats[exam.category]) {
        stats[exam.category] = {
          totalExams: 0,
          attemptedExams: 0,
          subcategories: []
        };
      }
      
      stats[exam.category].totalExams++;
      if (exam.attempted) {
        stats[exam.category].attemptedExams++;
      }
      
      if (!stats[exam.category].subcategories.includes(exam.subcategory)) {
        stats[exam.category].subcategories.push(exam.subcategory);
      }
    });
    
    setCategoryStats(stats);
    console.log('📊 Category stats calculated:', stats);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPracticeExams();
    setRefreshing(false);
  };





  const getTotalStats = () => {
    const total = exams.length;
    const attempted = exams.filter(exam => exam.attempted).length;
    const available = exams.filter(exam => !exam.attempted && exam.spotsLeft > 0).length;
    const pending = total - attempted;
    return { total, attempted, available, pending };
  };

  const renderHeader = () => {
    const stats = getTotalStats();
    
    return (
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#8B5CF6', '#A855F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Enhanced Background Pattern */}
        <View style={styles.headerPattern}>
          <Animated.View 
            style={[
              styles.patternCircle1,
              {
                opacity: sparkleAnim1,
                transform: [{
                  scale: sparkleAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  })
                }]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.patternCircle2,
              {
                opacity: sparkleAnim2,
                transform: [{
                  scale: sparkleAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1.1],
                  })
                }]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.patternCircle3,
              {
                opacity: sparkleAnim3,
                transform: [{
                  scale: sparkleAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1.3],
                  })
                }]
              }
            ]} 
          />

          {/* Additional animated elements */}
          <Animated.View 
            style={[
              styles.floatingElement1,
              {
                opacity: floatingAnim1.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1, 0],
                }),
                transform: [
                  {
                    translateY: floatingAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    })
                  },
                  {
                    translateX: floatingAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 15],
                    })
                  }
                ]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingElement2,
              {
                opacity: floatingAnim2.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1, 0],
                }),
                transform: [
                  {
                    translateY: floatingAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -25],
                    })
                  },
                  {
                    translateX: floatingAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -10],
                    })
                  }
                ]
              }
            ]} 
          />

          {/* Rotating element */}
          <Animated.View 
            style={[
              styles.rotatingElement,
              {
                transform: [{
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }]
              }
            ]} 
          />
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Let's Ace Your</Text>
            <Text style={styles.headerTitle}>Practice Exams</Text>
            <Text style={styles.headerSubtitle}>
              Track, practice & achieve your goals
            </Text>
          </View>
          
          {/* Animated Header Image */}
          <View style={styles.decorationContainer}>
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }]
              }}
            >
              <Image 
                source={require('@/assets/images/icons/practise-girl.png')}
                style={styles.headerImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderStatsCards = () => {
    const stats = getTotalStats();
    
    return (
      <View style={styles.statsSection}>
        <Text style={styles.statsSectionTitle}>Quick Stats</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
              style={styles.statCardGradient}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.statIconContainer}
              >
                <Ionicons name="library" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Exams</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#10B981', '#059669', '#047857']}
              style={styles.statCardGradient}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.statIconContainer}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statValue}>{stats.attempted}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#F59E0B', '#D97706', '#B45309']}
              style={styles.statCardGradient}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.statIconContainer}
              >
                <Ionicons name="time" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statValue}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </LinearGradient>
          </View>
        </View>
      </View>
    );
  };

  const renderCategoriesSection = () => {
    const categoryColors = [
      ['#8B5CF6', '#A855F7'], // Purple
      ['#06B6D4', '#0891B2'], // Cyan  
      ['#10B981', '#059669'], // Green
      ['#F59E0B', '#D97706'], // Orange
      ['#EF4444', '#DC2626'], // Red
      ['#8B5CF6', '#A855F7'], // Purple again
    ];

    const categoryBackgroundColors = [
      '#F3F4F6', // Light gray
      '#E0F2FE', // Light cyan
      '#D1FAE5', // Light green
      '#FEF3C7', // Light yellow
      '#FEE2E2', // Light red
      '#F3F4F6', // Light gray again
    ];

    const categoryIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      'Hindi': 'language',
      'Marathi': 'book',
      'SSC': 'school',
      'SSC 1': 'medal',
      'Railway 1': 'train',
      'Bank': 'card',
    };

    return (
      <View style={styles.categoriesSection}>
        <Text style={styles.categoriesSectionTitle}>Categories</Text>
        <View style={styles.categoriesContainer}>
          {Object.keys(categoryStats).map((category, index) => {
            const stats = categoryStats[category];
            const progress = stats.totalExams > 0 ? (stats.attemptedExams / stats.totalExams) * 100 : 0;
            const colors = categoryColors[index % categoryColors.length];
            const backgroundColor = categoryBackgroundColors[index % categoryBackgroundColors.length];
            const iconName = categoryIcons[category] || 'library';
            
            return (
              <TouchableOpacity
                key={category}
                style={[styles.categoryCard, { backgroundColor }]}
                onPress={() => router.push(`/exam-category?category=${encodeURIComponent(category)}`)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                  style={styles.categoryCardGradient}
                >
                  <View style={styles.categoryCardContent}>
                    <LinearGradient
                      colors={colors as [string, string]}
                      style={styles.categoryIconContainer}
                    >
                      <Ionicons name={iconName} size={20} color="#FFFFFF" />
                    </LinearGradient>
                    
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{category}</Text>
                      <Text style={styles.categoryProgress}>
                        {stats.attemptedExams} of {stats.totalExams} completed
                      </Text>
                    </View>
                    
                    <View style={styles.progressCircleContainer}>
                      <LinearGradient
                        colors={colors as [string, string]}
                        style={styles.progressCircle}
                      >
                        <View style={[styles.progressFill, { 
                          transform: [{ rotate: `${(progress / 100) * 360}deg` }] 
                        }]} />
                        <View style={styles.progressInner}>
                          <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
                        </View>
                      </LinearGradient>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };



  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading Practice Exams...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        {renderHeader()}
        {renderStatsCards()}
        {renderCategoriesSection()}
        
        
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainScrollView: {
    flex: 1,
  },
  // Header Styles
  headerGradient: {
    height: 160,
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 16,
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  patternCircle1: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 6,
  },
  patternCircle3: {
    position: 'absolute',
    top: 60,
    left: 50,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingElement1: {
    position: 'absolute',
    top: 30,
    left: 80,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingElement2: {
    position: 'absolute',
    bottom: 30,
    right: 60,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    elevation: 4,
  },
  rotatingElement: {
    position: 'absolute',
    top: 40,
    left: 100,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderRightColor: 'rgba(255, 255, 255, 0.6)',
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
    paddingTop: 15,
    height: '100%',
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  decorationContainer: {
    position: 'absolute',
    right: -40,
    top: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  headerImage: {
    width: 160,
    height: 160,
  },
  // Stats Section
  statsSection: {
    padding: 20,
    paddingTop: 24,
  },
  statsSectionBackground: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statCardGradient: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Categories Section
  categoriesSection: {
    padding: 20,
    paddingTop: 0,
  },
  categoriesSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryCard: {
    borderRadius: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
    overflow: 'hidden',
  },
  categoryCardGradient: {
    borderRadius: 16,
    padding: 16,
  },
  categoryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryProgress: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressCircleContainer: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    transformOrigin: 'center',
  },
  progressInner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  progressPercentage: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  // Selected Category Section
  selectedCategorySection: {
    padding: 20,
  },
  selectedCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedCategoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  // Exam Cards and other remaining styles
  examsContainer: {
    gap: 16,
  },
  examCardWrapper: {
    marginBottom: 16,
  },
  examCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  examCardDisabled: {
    opacity: 0.6,
  },
  examCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  examCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeDisabled: {
    backgroundColor: '#9CA3AF',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryTextDisabled: {
    color: '#FFFFFF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  completedText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '600',
  },
  examStats: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  examTitleDisabled: {
    color: '#6B7280',
  },
  examSubcategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  examSubcategoryDisabled: {
    color: '#9CA3AF',
  },
  examActions: {
    alignItems: 'flex-end',
  },
  startButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  startButtonTextDisabled: {
    color: '#FFFFFF',
  },
  viewResultButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewResultText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default PracticeExamScreen; 
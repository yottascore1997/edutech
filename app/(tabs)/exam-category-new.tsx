import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const getGradientColors = (category: string) => {
  const categoryLower = category.toLowerCase();
  
  const colorSchemes = [
    ['#4F46E5', '#7C3AED'], // Purple
    ['#06B6D4', '#0891B2'], // Cyan  
    ['#10B981', '#059669'], // Green
    ['#F59E0B', '#D97706'], // Orange
    ['#EF4444', '#DC2626'], // Red
    ['#8B5CF6', '#A855F7'], // Purple again
  ];
  
  const hash = categoryLower.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colorIndex = Math.abs(hash) % colorSchemes.length;
  return colorSchemes[colorIndex] as [string, string];
};

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

const ExamCategoryPage = () => {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.9);
  
  // Get category colors early
  const categoryColors = getGradientColors(category || '');

  useEffect(() => {

    if (category) {
      fetchExamsByCategory();
    } else {

      setLoading(false);
    }
    // Start animations
    startAnimations();
  }, [category]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchExamsByCategory = async () => {
    try {
      if (!user?.token) return;
      
      setLoading(true);
      const response = await apiFetchAuth(`/student/practice-exams?category=${encodeURIComponent(category || '')}`, user.token);
      
      if (response.ok) {

        setExams(response.data || []);
      } else {
        console.error('❌ Failed to fetch exams:', response.data);
        setExams([]);
      }
    } catch (error) {
      console.error('❌ Error fetching exams:', error);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExamsByCategory();
    setRefreshing(false);
  };

  const handleStartExam = (exam: PracticeExam) => {

    router.push(`/practice-exam/${exam.id}`);
  };

  const handleReviewExam = (exam: PracticeExam) => {

    router.push(`/practice-exam/${exam.id}/result`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      'Mathematics': 'calculator',
      'Science': 'flask',
      'English': 'book',
      'History': 'library',
      'Geography': 'globe',
      'Physics': 'nuclear',
      'Chemistry': 'flask',
      'Biology': 'leaf',
      'Computer Science': 'laptop',
      'Economics': 'trending-up',
      'SSC 1': 'medal',
      'Railway 1': 'train',
      'Bank': 'card',
    };
    return iconMap[category] || 'library';
  };

  const attemptedExams = exams.filter(exam => exam.attempted).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading exams...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        style={styles.backgroundGradient}
      >
        {/* Modern Header */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modernHeader}
        >
          <View style={styles.modernHeaderContent}>
            <TouchableOpacity 
              style={styles.modernBackButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.modernHeaderInfo}>
              <View style={styles.modernCategoryIcon}>
                <Ionicons name={getCategoryIcon(category || '')} size={32} color="#FFFFFF" />
              </View>
              <View style={styles.modernTitleContainer}>
                <Text style={styles.modernCategoryTitle}>{category}</Text>
                <Text style={styles.modernCategorySubtitle}>Practice Exams</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Modern Stats Cards */}
        <View style={styles.modernStatsContainer}>
          <View style={styles.modernStatsRow}>
            <View style={styles.modernStatCard}>
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.modernStatGradient}
              >
                <Ionicons name="library" size={24} color="#FFFFFF" />
                <Text style={styles.modernStatValue}>{exams.length}</Text>
                <Text style={styles.modernStatLabel}>Total Exams</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.modernStatCard}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.modernStatGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.modernStatValue}>{attemptedExams}</Text>
                <Text style={styles.modernStatLabel}>Completed</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.modernStatCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.modernStatGradient}
              >
                <Ionicons name="time" size={24} color="#FFFFFF" />
                <Text style={styles.modernStatValue}>{exams.length - attemptedExams}</Text>
                <Text style={styles.modernStatLabel}>Pending</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Modern Exam List */}
        <ScrollView
          style={styles.modernContainer}
          contentContainerStyle={styles.modernContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4F46E5']}
              tintColor="#4F46E5"
            />
          }
        >
          {exams.length > 0 ? (
            <View style={styles.modernExamList}>
              <Text style={styles.modernListTitle}>Available Exams</Text>
              
              {exams.map((exam, index) => (
                <Animated.View 
                  key={exam.id} 
                  style={[
                    styles.modernExamCard,
                    {
                      opacity: fadeAnim,
                      transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim }
                      ]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.modernExamTouchable}
                    onPress={() => {

                      exam.attempted ? handleReviewExam(exam) : handleStartExam(exam);
                    }}
                    activeOpacity={0.9}
                  >
                    {/* Card Header */}
                    <View style={styles.modernCardHeader}>
                      <View style={styles.modernCardLeft}>
                        <LinearGradient
                          colors={exam.attempted ? ['#10B981', '#059669'] : ['#4F46E5', '#7C3AED']}
                          style={styles.modernExamIcon}
                        >
                          <Ionicons 
                            name={getCategoryIcon(exam.category)} 
                            size={24} 
                            color="#FFFFFF" 
                          />
                        </LinearGradient>
                        <View style={styles.modernExamInfo}>
                          <Text style={styles.modernExamTitle} numberOfLines={2}>
                            {exam.title}
                          </Text>
                          <Text style={styles.modernExamSubtitle}>
                            {exam.subcategory}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.modernStatusContainer}>
                        {exam.attempted ? (
                          <View style={styles.modernCompletedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text style={styles.modernCompletedText}>Completed</Text>
                          </View>
                        ) : (
                          <View style={styles.modernAvailableBadge}>
                            <Ionicons name="play-circle" size={16} color="#4F46E5" />
                            <Text style={styles.modernAvailableText}>Available</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Card Details */}
                    <View style={styles.modernCardDetails}>
                      <View style={styles.modernDetailItem}>
                        <Ionicons name="calendar" size={16} color="#6B7280" />
                        <Text style={styles.modernDetailText}>{formatDate(exam.startTime)}</Text>
                      </View>
                      <View style={styles.modernDetailItem}>
                        <Ionicons name="people" size={16} color="#6B7280" />
                        <Text style={styles.modernDetailText}>{exam.spotsLeft}/{exam.spots} spots</Text>
                      </View>
                      <View style={styles.modernDetailItem}>
                        <Ionicons name="time" size={16} color="#6B7280" />
                        <Text style={styles.modernDetailText}>Practice</Text>
                      </View>
                    </View>

                    {/* Action Button */}
                    <LinearGradient
                      colors={exam.attempted ? ['#10B981', '#059669'] : ['#4F46E5', '#7C3AED']}
                      style={styles.modernActionButton}
                    >
                      <View style={styles.modernActionContent}>
                        <Ionicons 
                          name={exam.attempted ? "eye" : "play"} 
                          size={20} 
                          color="#FFFFFF" 
                        />
                        <Text style={styles.modernActionText}>
                          {exam.attempted ? 'Review Results' : 'Start Exam'}
                        </Text>
                        <Ionicons 
                          name="arrow-forward" 
                          size={16} 
                          color="#FFFFFF" 
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.modernNoExamsContainer}>
              <Ionicons name="library-outline" size={64} color="#9CA3AF" />
              <Text style={styles.modernNoExamsTitle}>No Exams Found</Text>
              <Text style={styles.modernNoExamsText}>
                No exams available for {category} category.
              </Text>
              <TouchableOpacity style={styles.modernRefreshButton} onPress={onRefresh}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.modernRefreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backgroundGradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  modernHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modernHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modernHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernCategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modernTitleContainer: {
    flex: 1,
  },
  modernCategoryTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modernCategorySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  modernStatsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modernStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modernStatCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modernStatGradient: {
    padding: 16,
    alignItems: 'center',
  },
  modernStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  modernStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'center',
  },
  modernContainer: {
    flex: 1,
  },
  modernContentContainer: {
    paddingBottom: 20,
  },
  modernExamList: {
    paddingHorizontal: 20,
  },
  modernListTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  modernExamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  modernExamTouchable: {
    padding: 20,
  },
  modernCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modernCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  modernExamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modernExamInfo: {
    flex: 1,
  },
  modernExamTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 24,
  },
  modernExamSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  modernStatusContainer: {
    alignItems: 'flex-end',
  },
  modernCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modernCompletedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  modernAvailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modernAvailableText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    marginLeft: 4,
  },
  modernCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  modernDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  modernActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modernActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  modernActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
    marginRight: 8,
  },
  modernNoExamsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  modernNoExamsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  modernNoExamsText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modernRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modernRefreshText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default ExamCategoryPage;

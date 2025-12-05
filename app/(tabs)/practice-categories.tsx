import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface SubCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

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
  score?: number;
  attemptedAt?: string;
}

interface WeeklyProgress {
  day: string;
  count: number;
}

const defaultCategories: Category[] = [
  { id: 'jee', name: 'JEE Main', icon: 'school', color: '#7C3AED' },
  { id: 'neet', name: 'NEET', icon: 'medical', color: '#EC4899' },
  { id: 'gate', name: 'GATE', icon: 'construct', color: '#F59E0B' },
  { id: 'cat', name: 'CAT', icon: 'business', color: '#10B981' },
  { id: 'upsc', name: 'UPSC', icon: 'library', color: '#EF4444' },
  { id: 'ssc', name: 'SSC', icon: 'document-text', color: '#8B5CF6' },
  { id: 'banking', name: 'Banking', icon: 'card', color: '#06B6D4' },
  { id: 'railway', name: 'Railway', icon: 'train', color: '#84CC16' },
  { id: 'defense', name: 'Defense', icon: 'shield', color: '#F97316' },
];

const defaultSubCategories: { [key: string]: SubCategory[] } = {
  jee: [
    { id: '1', name: 'Physics', icon: 'nuclear', color: '#7C3AED', description: 'Physics practice tests' },
    { id: '2', name: 'Chemistry', icon: 'flask', color: '#8B5CF6', description: 'Chemistry practice tests' },
    { id: '3', name: 'Mathematics', icon: 'calculator', color: '#EC4899', description: 'Math practice tests' },
    { id: '4', name: 'Full Mock Tests', icon: 'document-text', color: '#F59E0B', description: 'Complete JEE mock tests' },
  ],
  neet: [
    { id: '1', name: 'Biology', icon: 'leaf', color: '#10B981', description: 'Biology practice tests' },
    { id: '2', name: 'Physics', icon: 'nuclear', color: '#7C3AED', description: 'Physics practice tests' },
    { id: '3', name: 'Chemistry', icon: 'flask', color: '#8B5CF6', description: 'Chemistry practice tests' },
    { id: '4', name: 'Full Mock Tests', icon: 'document-text', color: '#F59E0B', description: 'Complete NEET mock tests' },
  ],
  gate: [
    { id: '1', name: 'Computer Science', icon: 'laptop', color: '#06B6D4', description: 'CS practice tests' },
    { id: '2', name: 'Mechanical', icon: 'construct', color: '#8B5CF6', description: 'Mechanical practice tests' },
    { id: '3', name: 'Electrical', icon: 'flash', color: '#F59E0B', description: 'Electrical practice tests' },
    { id: '4', name: 'Civil', icon: 'home', color: '#10B981', description: 'Civil practice tests' },
  ],
};

export default function PracticeCategoriesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [examsLoading, setExamsLoading] = useState(false);

  // Fetch categories from API
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch exams when category changes
  useEffect(() => {
    // Exams are already loaded, we just need to filter them
    if (selectedCategory) {
      // No need to fetch again, just filter
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Use same API as home page PracticeExamSection
      const response = await apiFetchAuth('/student/practice-exams', user.token);
      
      if (response.ok && response.data) {
        // Extract unique categories from practice exams data
        const categoryMap = new Map();
        
        response.data.forEach((exam: any) => {
          if (!categoryMap.has(exam.category)) {
            categoryMap.set(exam.category, {
              id: exam.category.toLowerCase().replace(/\s+/g, '-'),
              name: exam.category,
              icon: getCategoryIcon(exam.category),
              color: getCategoryColor(exam.category),
              subcategories: new Set()
            });
          }
          // Add subcategories
          if (exam.subcategory) {
            categoryMap.get(exam.category).subcategories.add(exam.subcategory);
          }
        });
        
        // Convert Map to Array and add "All Exams" as first option
        const transformedCategories = Array.from(categoryMap.values()).map(category => ({
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
        }));
        
        const allCategories = transformedCategories;
        
        setCategories(allCategories);
        
        // Set first category as selected if none selected
        if (allCategories.length > 0 && selectedCategory === '') {
          setSelectedCategory(allCategories[0].id);
        }
        
        // Store all exams data
        setExams(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories if API fails
      setCategories(defaultCategories);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamsByCategory = async (categoryId: string) => {
    setExamsLoading(true);
    try {
      // Filter exams by selected category
      const categoryName = categories.find(c => c.id === categoryId)?.name;
      if (categoryName) {
        const filteredExams = exams.filter(exam => exam.category === categoryName);
        // Update exams state with filtered data
        // Note: We're using the already loaded exams data
      }
    } catch (error) {
      console.error('Error fetching exams by category:', error);
    } finally {
      setExamsLoading(false);
    }
  };

  // Helper functions to get icons and colors
  const getCategoryIcon = (name: string) => {
    const iconMap: { [key: string]: string } = {
      'JEE Main': 'school',
      'NEET': 'medical',
      'GATE': 'construct',
      'CAT': 'business',
      'UPSC': 'library',
      'SSC': 'document-text',
      'Banking': 'card',
      'Railway': 'train',
      'Defense': 'shield',
    };
    return iconMap[name] || 'book';
  };

  const getCategoryColor = (name: string) => {
    const colorMap: { [key: string]: string } = {
      'JEE Main': '#7C3AED',
      'NEET': '#EC4899',
      'GATE': '#F59E0B',
      'CAT': '#10B981',
      'UPSC': '#EF4444',
      'SSC': '#8B5CF6',
      'Banking': '#06B6D4',
      'Railway': '#84CC16',
      'Defense': '#F97316',
    };
    return colorMap[name] || '#7C3AED';
  };

  const getSubCategoryIcon = (name: string) => {
    const iconMap: { [key: string]: string } = {
      'Mock Tests': 'document-text',
      'Previous Year Papers': 'archive',
      'Chapter Wise Tests': 'book',
      'Quick Tests': 'flash',
      'Daily Tests': 'calendar',
      'Speed Tests': 'speedometer',
      'Physics': 'nuclear',
      'Chemistry': 'flask',
      'Mathematics': 'calculator',
      'Biology': 'leaf',
      'Computer Science': 'laptop',
      'Mechanical': 'construct',
      'Electrical': 'flash',
      'Civil': 'home',
    };
    return iconMap[name] || 'book';
  };

  const getSubCategoryColor = (name: string) => {
    const colorMap: { [key: string]: string } = {
      'Mock Tests': '#7C3AED',
      'Previous Year Papers': '#8B5CF6',
      'Chapter Wise Tests': '#EC4899',
      'Quick Tests': '#F59E0B',
      'Daily Tests': '#10B981',
      'Speed Tests': '#EF4444',
      'Physics': '#7C3AED',
      'Chemistry': '#8B5CF6',
      'Mathematics': '#EC4899',
      'Biology': '#10B981',
      'Computer Science': '#06B6D4',
      'Mechanical': '#8B5CF6',
      'Electrical': '#F59E0B',
      'Civil': '#10B981',
    };
    return colorMap[name] || '#7C3AED';
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleExamPress = (exam: PracticeExam) => {
    // Navigate to practice exam page with exam info
    router.push(`/(tabs)/practice-exam/${exam.id}`);
  };

  // Analysis Helper Functions
  const getWeeklyProgress = (): WeeklyProgress[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const weekProgress: WeeklyProgress[] = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
      
      // Count exams attempted on this day
      const count = exams.filter(exam => {
        if (!exam.attemptedAt) return false;
        const attemptDate = new Date(exam.attemptedAt);
        return attemptDate.toDateString() === date.toDateString();
      }).length;

      weekProgress.push({ day: dayName, count });
    }

    return weekProgress;
  };

  const getAverageScore = () => {
    const attemptedExams = exams.filter(exam => exam.attempted && exam.score !== undefined);
    if (attemptedExams.length === 0) return 0;
    const totalScore = attemptedExams.reduce((sum, exam) => sum + (exam.score || 0), 0);
    return Math.round(totalScore / attemptedExams.length);
  };

  const calculateStreak = () => {
    if (exams.length === 0) return { current: 0, longest: 0 };
    
    const attemptedExams = exams
      .filter(exam => exam.attemptedAt)
      .sort((a, b) => new Date(b.attemptedAt!).getTime() - new Date(a.attemptedAt!).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    attemptedExams.forEach(exam => {
      const examDate = new Date(exam.attemptedAt!);
      examDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        // First exam
        const diffDays = Math.floor((today.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0 || diffDays === 1) {
          currentStreak = 1;
          tempStreak = 1;
        }
      } else {
        const diffDays = Math.floor((lastDate.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
          if (currentStreak > 0) currentStreak++;
        } else {
          if (currentStreak > 0) currentStreak = 0;
          tempStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
      lastDate = examDate;
    });

    return { current: currentStreak, longest: longestStreak };
  };

  const renderAnalysisSection = () => {
    const avgScore = getAverageScore();
    const streakData = calculateStreak();
    const weeklyData = getWeeklyProgress();
    const maxCount = Math.max(...weeklyData.map(d => d.count), 1);
    
    // Exam Statistics
    const totalExams = exams.length;
    const completedExams = exams.filter(exam => exam.attempted).length;
    const completionPercentage = totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0;

    return (
      <View style={styles.analysisSection}>
        <View style={styles.sectionHeaderPremium}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="analytics" size={18} color="#6366F1" />
            </View>
            <Text style={styles.sectionTitlePremium}>Analysis</Text>
          </View>
        </View>

        {/* Exam Stats Row */}
        <View style={styles.scoreStreakRow}>
          {/* Total Exams Card */}
          <View style={styles.premiumMetricCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F0F9FF']}
              style={styles.metricCardGradient}
            >
              <View style={styles.metricIconWrapper}>
                <LinearGradient
                  colors={['#06B6D4', '#0891B2']}
                  style={styles.metricIconGradient}
                >
                  <Ionicons name="library" size={24} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.metricLabel}>Total Exams</Text>
              <Text style={styles.metricValueLarge}>{totalExams}</Text>
              <View style={[styles.metricCardBorder, { backgroundColor: '#06B6D4' }]} />
            </LinearGradient>
          </View>

          {/* Completed Exams Card */}
          <View style={styles.premiumMetricCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F0FDF4']}
              style={styles.metricCardGradient}
            >
              <View style={styles.metricIconWrapper}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.metricIconGradient}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.metricLabel}>Completed</Text>
              <Text style={styles.metricValueLarge}>{completedExams}</Text>
              <View style={[styles.metricCardBorder, { backgroundColor: '#10B981' }]} />
            </LinearGradient>
          </View>
        </View>

        {/* Progress & Score Row */}
        <View style={styles.scoreStreakRow}>
          {/* Completion Percentage Card */}
          <View style={styles.premiumMetricCard}>
            <LinearGradient
              colors={['#FFFFFF', '#FEFBFF']}
              style={styles.metricCardGradient}
            >
              <View style={styles.metricIconWrapper}>
                <LinearGradient
                  colors={['#7C3AED', '#8B5CF6']}
                  style={styles.metricIconGradient}
                >
                  <Ionicons name="stats-chart" size={24} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.metricLabel}>Completion</Text>
              <Text style={styles.metricValueLarge}>{completionPercentage}%</Text>
              <View style={[styles.metricCardBorder, { backgroundColor: '#7C3AED' }]} />
            </LinearGradient>
          </View>

          {/* Average Score Card */}
          <View style={styles.premiumMetricCard}>
            <LinearGradient
              colors={['#FFFFFF', '#FFFAF5']}
              style={styles.metricCardGradient}
            >
              <View style={styles.metricIconWrapper}>
                <LinearGradient
                  colors={['#F59E0B', '#FB923C']}
                  style={styles.metricIconGradient}
                >
                  <Ionicons name="trophy" size={24} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.metricLabel}>Average Score</Text>
              <Text style={styles.metricValueLarge}>{avgScore}%</Text>
              <View style={[styles.metricCardBorder, { backgroundColor: '#F59E0B' }]} />
            </LinearGradient>
          </View>
        </View>

        {/* Weekly Activity Graph */}
        <View style={styles.weeklyGraphCard}>
          <Text style={styles.weeklyGraphTitle}>This Week's Activity</Text>
          <View style={styles.graphContainer}>
            {weeklyData.map((day, index) => {
              const barHeight = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              const isToday = index === 6;
              
              return (
                <View key={day.day} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View style={[styles.barBackground, { height: 100 }]}>
                      <LinearGradient
                        colors={isToday ? ['#4F46E5', '#7C3AED'] : ['#E0E7FF', '#C7D2FE']}
                        style={[styles.barFill, { height: `${barHeight}%` }]}
                      >
                        {day.count > 0 && (
                          <Text style={[styles.barCount, isToday && styles.barCountActive]}>
                            {day.count}
                          </Text>
                        )}
                      </LinearGradient>
                    </View>
                  </View>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>
                    {day.day}
                  </Text>
                  {isToday && <View style={styles.todayIndicator} />}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      
      {/* Premium Header */}
      <LinearGradient
        colors={['#7C3AED', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Practice Exams</Text>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} activeOpacity={0.8}>
              <Ionicons name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} activeOpacity={0.8}>
              <Ionicons name="cart" size={24} color="#FFFFFF" />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>1</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>All Categories</Text>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            {categories.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === item.id && styles.categoryCardSelected
                ]}
                onPress={() => handleCategorySelect(item.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={16} color="#FFFFFF" />
                </View>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === item.id && styles.categoryTextSelected
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Right Main Content */}
        <ScrollView 
          style={styles.rightContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.rightContentContainer}
        >
          {/* Analysis Section */}
          {renderAnalysisSection()}

          {/* Premium Exams Section */}
          <View style={styles.examsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="library" size={24} color="#7C3AED" />
                </View>
                <View>
            <Text style={styles.sectionTitle}>
              {categories.find(c => c.id === selectedCategory)?.name} Exams
            </Text>
                  <Text style={styles.sectionSubtitle}>
                    {exams.filter(exam => {
                      const categoryName = categories.find(c => c.id === selectedCategory)?.name;
                      return exam.category === categoryName;
                    }).length} {exams.filter(exam => {
                      const categoryName = categories.find(c => c.id === selectedCategory)?.name;
                      return exam.category === categoryName;
                    }).length === 1 ? 'exam' : 'exams'} available
                  </Text>
                </View>
              </View>
            </View>
            
            {examsLoading ? (
              <View style={styles.examsLoadingContainer}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={styles.examsLoadingText}>Loading exams...</Text>
              </View>
            ) : (
              <View style={styles.examsList}>
                {Array.from({ length: Math.ceil(exams.filter(exam => {
                  const categoryName = categories.find(c => c.id === selectedCategory)?.name;
                  return exam.category === categoryName;
                }).length / 3) }, (_, rowIndex) => (
                  <View key={rowIndex} style={styles.examRow}>
                    {exams
                      .filter(exam => {
                        const categoryName = categories.find(c => c.id === selectedCategory)?.name;
                        return exam.category === categoryName;
                      })
                      .slice(rowIndex * 3, rowIndex * 3 + 3)
                      .map((exam) => {
                        const category = categories.find(c => c.id === selectedCategory);
                        
                        return (
                          <TouchableOpacity
                            key={exam.id}
                            style={styles.examCardHorizontal}
                            onPress={() => handleExamPress(exam)}
                            activeOpacity={0.9}
                          >
                            <View style={styles.examCardContentHorizontal}>
                              <View style={[styles.examIconContainerHorizontal, { backgroundColor: category?.color || '#7C3AED' }]}>
                                <Ionicons name={category?.icon as any || 'library'} size={24} color="#FFFFFF" />
                              </View>
                              <View style={styles.examTitleContainerHorizontal}>
                                <Text style={styles.examTitleHorizontal} numberOfLines={2}>
                                  {exam.title}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

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
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: screenWidth * 0.28,
    backgroundColor: '#F8FAFC',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 15,
    textAlign: 'center',
  },
  categoriesList: {
    paddingBottom: 20,
  },
  categoryCard: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryCardSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7C3AED',
    borderWidth: 2,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  rightContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  rightContentContainer: {
    padding: 20,
  },
  banner: {
    marginBottom: 25,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  bannerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#F3E8FF',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  examsSection: {
    marginBottom: 20,
  },
  examsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  examsLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  examsList: {
    gap: 12,
  },
  examRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  examCardHorizontal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: '33%',
  },
  examCardContentHorizontal: {
    alignItems: 'center',
    gap: 12,
  },
  examIconContainerHorizontal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  examTitleContainerHorizontal: {
    width: '100%',
    alignItems: 'center',
  },
  examTitleHorizontal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 20,
  },
  examCardSimple: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  examCardContentSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  examTitleContainer: {
    flex: 1,
  },
  examTitleSimple: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 22,
  },
  examActionContainer: {
    marginLeft: 'auto',
  },
  examCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  examCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  examIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 12,
  },
  examNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  examTitlePremium: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  examSubcategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3E8FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  examSubcategoryPremium: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  completedBadgePremium: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  completedBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  completedTextPremium: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  startButtonPremium: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  startButtonTextPremium: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  startButtonFixed: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonGradientFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
    minWidth: 80,
  },
  startButtonTextFixed: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  completedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  examDetailsContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  examDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  examDetailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  examDetailIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  examDetailTextContainer: {
    flex: 1,
  },
  examDetailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  examDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  examProgressContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  examProgressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  examProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  examProgressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
    textAlign: 'right',
  },
  
  // Analysis Section Styles
  analysisSection: {
    marginBottom: 24,
  },
  sectionHeaderPremium: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitlePremium: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  scoreStreakRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  premiumMetricCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricCardGradient: {
    padding: 20,
    borderRadius: 20,
    minHeight: 140,
  },
  metricIconWrapper: {
    marginBottom: 12,
  },
  metricIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValueLarge: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  metricCardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#6366F1',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  streakFlameIconNew: {
    fontSize: 26,
  },
  streakValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  streakDaysNew: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
  },
  streakBestNew: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '600',
  },
  weeklyGraphCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  weeklyGraphTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  graphContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 4,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  barBackground: {
    width: 32,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  barCountActive: {
    color: '#FFFFFF',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  dayLabelActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6366F1',
    marginTop: 2,
  },
});
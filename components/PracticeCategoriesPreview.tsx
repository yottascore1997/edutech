import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
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

export default function PracticeCategoriesPreview() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetchAuth('/student/practice-exams', user.token);
      
      if (response.ok && response.data) {
        const categoryMap = new Map();
        
        response.data.forEach((exam: any) => {
          if (!categoryMap.has(exam.category)) {
            categoryMap.set(exam.category, {
              id: exam.category.toLowerCase().replace(/\s+/g, '-'),
              name: exam.category,
              icon: getCategoryIcon(exam.category),
              color: getCategoryColor(exam.category),
            });
          }
        });
        
        const transformedCategories = Array.from(categoryMap.values());
        setCategories(transformedCategories);
        
        if (transformedCategories.length > 0 && selectedCategory === '') {
          setSelectedCategory(transformedCategories[0].id);
        }
        
        setExams(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(defaultCategories);
    } finally {
      setLoading(false);
    }
  };

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

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleViewAll = () => {
    router.push('/(tabs)/practice-categories');
  };

  const getWeeklyProgress = (): WeeklyProgress[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const weekProgress: WeeklyProgress[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
      
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

  const renderAnalysisSection = () => {
    const avgScore = getAverageScore();
    const weeklyData = getWeeklyProgress();
    const maxCount = Math.max(...weeklyData.map(d => d.count), 1);
    
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

        <View style={styles.scoreStreakRow}>
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
                  <Ionicons name="library" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.metricLabel}>Total Exams</Text>
              <Text style={styles.metricValueLarge}>{totalExams}</Text>
              <View style={[styles.metricCardBorder, { backgroundColor: '#06B6D4' }]} />
            </LinearGradient>
          </View>

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
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.metricLabel}>Completed</Text>
              <Text style={styles.metricValueLarge}>{completedExams}</Text>
              <View style={[styles.metricCardBorder, { backgroundColor: '#10B981' }]} />
            </LinearGradient>
          </View>
        </View>

        <View style={styles.scoreStreakRow}>
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
                  <Ionicons name="stats-chart" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.metricLabel}>Completion</Text>
              <Text style={styles.metricValueLarge}>{completionPercentage}%</Text>
              <View style={[styles.metricCardBorder, { backgroundColor: '#7C3AED' }]} />
            </LinearGradient>
          </View>

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
                  <Ionicons name="trophy" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.metricLabel}>Average Score</Text>
              <Text style={styles.metricValueLarge}>{avgScore}%</Text>
              <View style={[styles.metricCardBorder, { backgroundColor: '#F59E0B' }]} />
            </LinearGradient>
          </View>
        </View>

        <View style={styles.weeklyGraphCard}>
          <Text style={styles.weeklyGraphTitle}>This Week's Activity</Text>
          <View style={styles.graphContainer}>
            {weeklyData.map((day, index) => {
              const barHeight = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              const isToday = index === 6;
              
              return (
                <View key={day.day} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View style={[styles.barBackground, { height: 80 }]}>
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || '';
  const filteredExams = selectedCategoryName 
    ? exams.filter(exam => exam.category === selectedCategoryName).slice(0, 6)
    : exams.slice(0, 6);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="school" size={24} color="#7C3AED" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Practice Categories</Text>
            <Text style={styles.headerSubtitle}>Improve your skills</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={16} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Analysis Section */}
      {renderAnalysisSection()}

      {/* Two Column Layout */}
      <View style={styles.twoColumnLayout}>
        {/* Categories Left */}
        <View style={styles.categoriesLeftSide}>
          <ScrollView 
            style={styles.categoriesListScroll}
            showsVerticalScrollIndicator={false}
          >
            {categories.slice(0, 4).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryListItem,
                  selectedCategory === category.id && styles.categoryListItemSelected
                ]}
                onPress={() => handleCategorySelect(category.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.categoryListIconContainer,
                  { backgroundColor: category.color }
                ]}>
                  <Ionicons 
                    name={category.icon as any} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </View>
                <View style={styles.categoryListInfo}>
                  <Text style={[
                    styles.categoryListTitle,
                    selectedCategory === category.id && styles.categoryListTitleSelected
                  ]}>
                    {category.name}
                  </Text>
                </View>
                {selectedCategory === category.id && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Exams Right */}
        <View style={styles.examsRightSide}>
          <ScrollView 
            style={styles.examsListScroll}
            showsVerticalScrollIndicator={false}
          >
            {filteredExams.length === 0 ? (
              <View style={styles.noExamsContainer}>
                <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
                <Text style={styles.noExamsTitle}>No Exams Available</Text>
                <Text style={styles.noExamsSubtitle}>Check back later</Text>
              </View>
            ) : (
              <View style={styles.examRow}>
                {filteredExams.map((exam, index) => (
                  <TouchableOpacity
                    key={exam.id}
                    style={styles.examCardHorizontal}
                    onPress={() => router.push(`/(tabs)/practice-exam/${exam.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.examCardContentHorizontal}>
                      <View style={[
                        styles.examIconContainerHorizontal,
                        { backgroundColor: getCategoryColor(exam.category) + '20' }
                      ]}>
                        <Ionicons 
                          name={getCategoryIcon(exam.category) as any} 
                          size={24} 
                          color={getCategoryColor(exam.category)} 
                        />
                      </View>
                      <View style={styles.examTitleContainerHorizontal}>
                        <Text style={styles.examTitleHorizontal} numberOfLines={2}>
                          {exam.title}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
    marginRight: 4,
  },
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  scoreStreakRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  premiumMetricCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  metricCardGradient: {
    padding: 16,
    borderRadius: 16,
    minHeight: 120,
  },
  metricIconWrapper: {
    marginBottom: 10,
  },
  metricIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValueLarge: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  metricCardBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  weeklyGraphCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  weeklyGraphTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  graphContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barBackground: {
    width: '80%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  barCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  barCountActive: {
    color: '#FFFFFF',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 6,
  },
  dayLabelActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7C3AED',
    marginTop: 2,
  },
  twoColumnLayout: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  categoriesLeftSide: {
    width: 120,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingRight: 12,
  },
  examsRightSide: {
    flex: 1,
  },
  categoriesListScroll: {
    maxHeight: 300,
  },
  examsListScroll: {
    maxHeight: 300,
  },
  categoryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 8,
    position: 'relative',
  },
  categoryListItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  categoryListIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryListInfo: {
    flex: 1,
  },
  categoryListTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryListTitleSelected: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  selectedIndicator: {
    position: 'absolute',
    right: 0,
    width: 4,
    height: '100%',
    backgroundColor: '#7C3AED',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  examRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  examCardHorizontal: {
    width: '47%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  examCardContentHorizontal: {
    alignItems: 'center',
  },
  examIconContainerHorizontal: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  examTitleContainerHorizontal: {
    width: '100%',
  },
  examTitleHorizontal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 16,
  },
  noExamsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noExamsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 12,
  },
  noExamsSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
});

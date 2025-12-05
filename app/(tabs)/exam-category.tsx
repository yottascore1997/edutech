import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [subcategories, setSubcategories] = useState<string[]>([]);

  useEffect(() => {
    if (category) {
      fetchExamsByCategory();
    } else {
      setLoading(false);
    }
  }, [category]);

  const fetchExamsByCategory = async () => {
    try {
      if (!user?.token) return;
      
      setLoading(true);
      const apiUrl = `/student/practice-exams?category=${encodeURIComponent(category || '')}`;

      const response = await apiFetchAuth(apiUrl, user.token);
      
      if (response.ok) {
        const examData = response.data || [];
        setExams(examData);
        
        // Extract unique subcategories
        const uniqueSubcategories = [...new Set(examData.map((exam: PracticeExam) => exam.subcategory))] as string[];
        setSubcategories(uniqueSubcategories);
        
      } else {
        console.error('❌ Failed to fetch exams:', response.data);
        setExams([]);
        setSubcategories([]);
      }
    } catch (error) {
      console.error('❌ Error fetching exams:', error);
      setExams([]);
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubcategoryFilter = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
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

  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('railway')) return 'train';
    if (categoryLower.includes('ssc')) return 'school';
    if (categoryLower.includes('math')) return 'calculator';
    if (categoryLower.includes('science')) return 'flask';
    if (categoryLower.includes('english')) return 'book';
    if (categoryLower.includes('computer')) return 'laptop';
    if (categoryLower.includes('general')) return 'bulb';
    if (categoryLower.includes('reasoning')) return 'brain';
    if (categoryLower.includes('banking')) return 'card';
    if (categoryLower.includes('upsc')) return 'library';
    return 'library';
  };

  const getCategoryColor = (category: string) => {
    const colors = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
    const hash = category.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const filteredExams = selectedSubcategory === 'all' 
    ? exams 
    : exams.filter(exam => exam.subcategory === selectedSubcategory);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading exams...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{category}</Text>
            <Text style={styles.headerSubtitle}>Practice Exams</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton}>
              <Ionicons name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton}>
              <Ionicons name="cart" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>All Categories</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.categoryItem}>
              <View style={[styles.categoryIconContainer, { backgroundColor: getCategoryColor(category || '') }]}>
                <Ionicons name={getCategoryIcon(category || '')} size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.categoryText}>{category}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Banner */}
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.banner}
          >
            <Text style={styles.bannerTitle}>{category} Store</Text>
            <Text style={styles.bannerSubtitle}>Practice Exams Available</Text>
          </LinearGradient>

          {/* Subcategory Filter */}
          {subcategories.length > 1 && (
            <View style={styles.subcategorySection}>
              <Text style={styles.sectionTitle}>Filter by Subcategory</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subcategoryScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.subcategoryChip,
                    selectedSubcategory === 'all' && styles.subcategoryChipActive
                  ]}
                  onPress={() => handleSubcategoryFilter('all')}
                >
                  <Text style={[
                    styles.subcategoryChipText,
                    selectedSubcategory === 'all' && styles.subcategoryChipTextActive
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                
                {subcategories.map((subcategory) => (
                  <TouchableOpacity
                    key={subcategory}
                    style={[
                      styles.subcategoryChip,
                      selectedSubcategory === subcategory && styles.subcategoryChipActive
                    ]}
                    onPress={() => handleSubcategoryFilter(subcategory)}
                  >
                    <Text style={[
                      styles.subcategoryChipText,
                      selectedSubcategory === subcategory && styles.subcategoryChipTextActive
                    ]}>
                      {subcategory}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Exams Grid */}
          <ScrollView
            style={styles.examsContainer}
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
            <Text style={styles.sectionTitle}>
              {selectedSubcategory !== 'all' ? `${selectedSubcategory} Exams` : 'Available Exams'}
            </Text>
            
            <View style={styles.examsGrid}>
              {filteredExams.map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  style={styles.examCard}
                  onPress={() => {
                    exam.attempted ? handleReviewExam(exam) : handleStartExam(exam);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.examCardContent}>
                    <View style={styles.examIconContainer}>
                      <Ionicons 
                        name={getCategoryIcon(exam.category)} 
                        size={24} 
                        color="#FFFFFF" 
                      />
                    </View>
                    <Text style={styles.examTitle}>{exam.title}</Text>
                    <Text style={styles.examSubcategory}>{exam.subcategory}</Text>
                    {exam.attempted && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                        <Text style={styles.completedText}>Completed</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
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
  },
  loadingText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  // Header Styles
  header: {
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Content Layout
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  // Sidebar Styles
  sidebar: {
    width: screenWidth * 0.28,
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryItem: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  categoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  // Main Content Styles
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  // Banner Styles
  banner: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  // Section Styles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  subcategorySection: {
    marginBottom: 20,
  },
  subcategoryScroll: {
    paddingRight: 20,
  },
  subcategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subcategoryChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  subcategoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  subcategoryChipTextActive: {
    color: '#FFFFFF',
  },
  // Exams Grid Styles
  examsContainer: {
    flex: 1,
  },
  examsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  examCard: {
    width: (screenWidth * 0.72 - 40 - 12) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  examCardContent: {
    alignItems: 'center',
  },
  examIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  examTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  examSubcategory: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  completedText: {
    color: '#065F46',
    fontSize: 8,
    fontWeight: '600',
  },
});

export default ExamCategoryPage;

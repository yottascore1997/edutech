import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import { useWallet } from '@/context/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CommonHeaderProps {
  showMainOptions?: boolean;
  title?: string;
}

interface Category {
  name: string;
  icon: string;
  color: string;
}

const CommonHeader: React.FC<CommonHeaderProps> = ({ 
  showMainOptions = false,
  title = ""
}) => {
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuth();
  const { walletAmount, refreshWalletAmount } = useWallet();
  const { selectedCategory, setSelectedCategory, clearCategory } = useCategory();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Refresh wallet on mount
  React.useEffect(() => {
    refreshWalletAmount();
  }, []);

  // Fetch practice exam categories
  const fetchCategories = async () => {
    if (!user?.token) return;
    
    try {
      setLoadingCategories(true);
      const response = await apiFetchAuth('/student/practice-exams', user.token);
      
      if (response.ok && response.data) {
        const categoryMap = new Map<string, Category>();
        
        response.data.forEach((exam: any) => {
          if (!categoryMap.has(exam.category)) {
            categoryMap.set(exam.category, {
              name: exam.category,
              icon: getCategoryIcon(exam.category),
              color: getCategoryColor(exam.category),
            });
          }
        });
        
        setCategories(Array.from(categoryMap.values()));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const getCategoryIcon = (name: string): string => {
    const iconMap: { [key: string]: string } = {
      'Hindi': 'language',
      'Marathi': 'book',
      'SSC': 'school',
      'SSC 1': 'medal',
      'Railway 1': 'train',
      'Bank': 'card',
      'JEE Main': 'school',
      'NEET': 'medical',
      'GATE': 'construct',
      'CAT': 'business',
      'UPSC': 'library',
    };
    return iconMap[name] || 'book';
  };

  const getCategoryColor = (name: string): string => {
    const colorMap: { [key: string]: string } = {
      'Hindi': '#7C3AED',
      'Marathi': '#8B5CF6',
      'SSC': '#10B981',
      'SSC 1': '#F59E0B',
      'Railway 1': '#06B6D4',
      'Bank': '#EF4444',
      'JEE Main': '#7C3AED',
      'NEET': '#EC4899',
      'GATE': '#F59E0B',
      'CAT': '#10B981',
      'UPSC': '#EF4444',
    };
    return colorMap[name] || '#7C3AED';
  };

  const handleSelectExamPress = () => {
    if (categories.length === 0) {
      fetchCategories();
    }
    setShowCategoryModal(true);
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowCategoryModal(false);
    // Category set ho jayegi, sab screens automatically filter ho jayengi
    // Navigation nahi karenge, user same page par hi rahega
  };

  const handleClearCategory = () => {
    clearCategory();
  };

  return (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#9333EA', '#A855F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Premium Glass Effect Overlay */}
        <View style={styles.glassOverlay} />
        
        {/* Top Header */}
        <View style={styles.topHeader}>
          {/* Menu Button - Premium Style */}
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => navigation.toggleDrawer()}
            activeOpacity={0.8}
          >
            <View style={styles.menuButtonContainer}>
              <Ionicons name="menu" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          {/* Center - Select Exam Button */}
          <TouchableOpacity 
            style={styles.selectExamButton}
            onPress={handleSelectExamPress}
            activeOpacity={0.8}
          >
            <View style={styles.selectExamContainer}>
              <Ionicons name="school-outline" size={18} color="#FFFFFF" />
              <Text style={styles.selectExamText} numberOfLines={1}>
                {selectedCategory || 'Select Exam'}
              </Text>
              {selectedCategory ? (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleClearCategory();
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
          
          {/* Right Actions - Premium Style */}
          <View style={styles.rightActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('(tabs)', { screen: 'notifications' })}
              activeOpacity={0.7}
            >
              <View style={styles.actionButtonContainer}>
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                <View style={styles.notificationDot} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('(tabs)', { screen: 'messages' })}
              activeOpacity={0.7}
            >
              <View style={styles.actionButtonContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.walletButton}
              onPress={() => navigation.navigate('(tabs)', { screen: 'wallet' })}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#F59E0B', '#EF4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.walletButtonGradient}
              >
                <View style={styles.walletIconContainer}>
                  <Ionicons name="wallet" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.walletText}>₹{walletAmount || '0.00'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Main Options (Only for Home Page) */}
      {showMainOptions && (
        <View style={styles.mainOptionsContainer}>
          <TouchableOpacity 
            style={styles.mainOption}
            onPress={() => navigation.navigate('(tabs)', { screen: 'exam' })}
            activeOpacity={0.8}
          >
            <View style={styles.mainOptionIcon}>
              <Ionicons name="flash" size={28} color="#FF6B35" />
            </View>
            <Text style={styles.mainOptionText}>Live Exam</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mainOption}
            onPress={() => navigation.navigate('(tabs)', { screen: 'practice-categories' })}
            activeOpacity={0.8}
          >
            <View style={styles.mainOptionIcon}>
              <Ionicons name="help-circle" size={28} color="#FF6B35" />
            </View>
            <Text style={styles.mainOptionText}>Practice</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mainOption}
            onPress={() => navigation.navigate('(tabs)', { screen: 'book-store' })}
            activeOpacity={0.8}
          >
            <View style={styles.mainOptionIcon}>
              <Ionicons name="book" size={28} color="#FF6B35" />
            </View>
            <Text style={styles.mainOptionText}>Book Store</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mainOption}
            onPress={() => navigation.navigate('(tabs)', { screen: 'quiz' })}
            activeOpacity={0.8}
          >
            <View style={styles.mainOptionIcon}>
              <Ionicons name="help" size={28} color="#FF6B35" />
            </View>
            <Text style={styles.mainOptionText}>Quiz</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Practice Exam Category</Text>
              <TouchableOpacity 
                onPress={() => setShowCategoryModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.categoriesList}
              showsVerticalScrollIndicator={false}
            >
              {loadingCategories ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading categories...</Text>
                </View>
              ) : categories.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="book-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No categories available</Text>
                </View>
              ) : (
                categories.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.categoryItem}
                    onPress={() => handleCategorySelect(category.name)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.categoryIconContainer,
                      { backgroundColor: category.color + '20' }
                    ]}>
                      <Ionicons 
                        name={category.icon as any} 
                        size={24} 
                        color={category.color} 
                      />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  
  gradientBackground: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 12,
  },
  
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingTop: 48,
    paddingBottom: 14,
    zIndex: 1,
    minHeight: 56,
  },
  
  menuButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  menuButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  
  selectExamButton: {
    flex: 1,
    marginHorizontal: 8,
    maxWidth: '50%',
  },
  
  selectExamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  
  selectExamText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    flexShrink: 1,
    flex: 1,
  },
  clearButton: {
    marginLeft: 4,
    padding: 2,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
  },
  
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  categoriesList: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
    fontWeight: '500',
  },
  
  userName: {
    fontSize: 19,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    textAlign: 'center',
  },
  
  pageTitle: {
    fontSize: 19,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    textAlign: 'center',
  },
  
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  actionButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  
  walletButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  
  walletButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    minWidth: 75,
  },
  
  walletIconContainer: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  walletText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  mainOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  
  mainOption: {
    alignItems: 'center',
    flex: 1,
  },
  
  mainOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  
  mainOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default CommonHeader;

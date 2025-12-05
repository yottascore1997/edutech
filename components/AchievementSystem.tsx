import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'exam' | 'streak' | 'score' | 'social' | 'special';
  points: number;
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Helper function to generate achievements based on user's existing data
export const generateAchievementsFromUserData = (userData: any): Achievement[] => {
  const achievements: Achievement[] = [];
  
  // Score-based achievements
  if (userData.score >= 90) {
    achievements.push({
      id: 'perfect_score',
      title: 'Perfect Score',
      description: 'Achieved 90+ marks in an exam',
      icon: 'star',
      color: '#FFD700',
      category: 'score',
      points: 100,
      isUnlocked: true,
      progress: 1,
      maxProgress: 1,
      rarity: 'legendary'
    });
  }
  
  if (userData.score >= 80) {
    achievements.push({
      id: 'excellent_performance',
      title: 'Excellent Performance',
      description: 'Achieved 80+ marks in an exam',
      icon: 'checkmark-circle',
      color: '#4CAF50',
      category: 'score',
      points: 50,
      isUnlocked: true,
      progress: 1,
      maxProgress: 1,
      rarity: 'epic'
    });
  }
  
  // Rank-based achievements
  if (userData.rank === 1) {
    achievements.push({
      id: 'first_place',
      title: 'First Place',
      description: 'Secured 1st position in leaderboard',
      icon: 'trophy',
      color: '#FFD700',
      category: 'exam',
      points: 200,
      isUnlocked: true,
      progress: 1,
      maxProgress: 1,
      rarity: 'legendary'
    });
  }
  
  if (userData.rank <= 3) {
    achievements.push({
      id: 'top_three',
      title: 'Top Three',
      description: 'Secured position in top 3',
      icon: 'medal',
      color: '#C0C0C0',
      category: 'exam',
      points: 100,
      isUnlocked: true,
      progress: 1,
      maxProgress: 1,
      rarity: 'epic'
    });
  }
  
  // Winnings-based achievements
  if (userData.winnings >= 500) {
    achievements.push({
      id: 'high_earner',
      title: 'High Earner',
      description: 'Earned ₹500+ in winnings',
      icon: 'diamond',
      color: '#9C27B0',
      category: 'special',
      points: 150,
      isUnlocked: true,
      progress: 1,
      maxProgress: 1,
      rarity: 'legendary'
    });
  }
  
  return achievements;
};

interface AchievementSystemProps {
  achievements: Achievement[];
  onAchievementPress?: (achievement: Achievement) => void;
  showModal?: boolean;
  onCloseModal?: () => void;
}

export default function AchievementSystem({ 
  achievements, 
  onAchievementPress,
  showModal = false,
  onCloseModal
}: AchievementSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const unlocked = achievements.filter(a => a.isUnlocked);
    setUnlockedCount(unlocked.length);
    setTotalPoints(unlocked.reduce((sum, a) => sum + a.points, 0));
  }, [achievements]);

  const getRarityColor = (rarity: string) => {
    // Dynamic rarity colors based on achievement data
    const rarityColors: { [key: string]: string } = {
      'common': '#9E9E9E',
      'rare': '#4CAF50',
      'epic': '#2196F3',
      'legendary': '#FFD700',
      'mythic': '#9C27B0',
      'divine': '#FF6B35'
    };
    return rarityColors[rarity] || '#9E9E9E';
  };

  const getCategoryIcon = (category: string) => {
    // Dynamic category icons based on achievement data
    const categoryIcons: { [key: string]: string } = {
      'exam': 'school',
      'streak': 'flame',
      'score': 'star',
      'social': 'people',
      'special': 'diamond',
      'time': 'time',
      'accuracy': 'target',
      'speed': 'flash',
      'consistency': 'checkmark-circle'
    };
    return categoryIcons[category] || 'medal';
  };

  // Dynamic categories based on available achievements
  const getDynamicCategories = () => {
    const allCategories = achievements.map(a => a.category);
    const uniqueCategories = [...new Set(allCategories)];
    
    const baseCategories = [
      { id: 'all', name: 'All', icon: 'grid' }
    ];
    
    const dynamicCategories = uniqueCategories.map(category => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      icon: getCategoryIcon(category)
    }));
    
    return [...baseCategories, ...dynamicCategories];
  };

  const categories = getDynamicCategories();

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => (
    <TouchableOpacity
      style={[
        styles.achievementCard,
        achievement.isUnlocked && styles.unlockedCard,
        { borderColor: getRarityColor(achievement.rarity) }
      ]}
      onPress={() => onAchievementPress?.(achievement)}
    >
      <LinearGradient
        colors={achievement.isUnlocked 
          ? ['#FFFFFF', '#F8FAFC'] 
          : ['#F3F4F6', '#E5E7EB']
        }
        style={styles.achievementGradient}
      >
        <View style={styles.achievementHeader}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: achievement.isUnlocked ? achievement.color : '#D1D5DB' }
          ]}>
            <Ionicons 
              name={achievement.icon as any} 
              size={24} 
              color={achievement.isUnlocked ? '#FFFFFF' : '#9CA3AF'} 
            />
          </View>
          
          <View style={styles.achievementInfo}>
            <Text style={[
              styles.achievementTitle,
              !achievement.isUnlocked && styles.lockedText
            ]}>
              {achievement.title}
            </Text>
            <Text style={[
              styles.achievementDescription,
              !achievement.isUnlocked && styles.lockedText
            ]}>
              {achievement.description}
            </Text>
          </View>

          <View style={styles.achievementRight}>
            <View style={[
              styles.rarityBadge,
              { backgroundColor: getRarityColor(achievement.rarity) }
            ]}>
              <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
            </View>
            <Text style={[
              styles.pointsText,
              !achievement.isUnlocked && styles.lockedText
            ]}>
              {achievement.points} pts
            </Text>
          </View>
        </View>

        {!achievement.isUnlocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                    backgroundColor: achievement.color
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {achievement.progress}/{achievement.maxProgress}
            </Text>
          </View>
        )}

        {achievement.isUnlocked && (
          <View style={styles.unlockedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.unlockedText}>Unlocked!</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const content = (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#9C27B0', '#673AB7', '#3F51B5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="medal" size={28} color="#FFFFFF" />
            <View>
              <Text style={styles.headerTitle}>Achievements</Text>
              <Text style={styles.headerSubtitle}>Unlock rewards & badges</Text>
            </View>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{unlockedCount}</Text>
              <Text style={styles.statLabel}>Unlocked</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalPoints}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </View>

        {/* Category Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.id && styles.activeCategoryTab
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons 
                name={category.icon as any} 
                size={16} 
                color={selectedCategory === category.id ? '#9C27B0' : 'rgba(255,255,255,0.8)'} 
              />
              <Text style={[
                styles.categoryTabText,
                selectedCategory === category.id && styles.activeCategoryTabText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Achievements List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.achievementsContainer}>
          {filteredAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </View>
      </ScrollView>
    </View>
  );

  if (showModal) {
    return (
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={onCloseModal}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {content}
        </View>
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryContainer: {
    paddingHorizontal: 4,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    gap: 6,
  },
  activeCategoryTab: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  activeCategoryTabText: {
    color: '#9C27B0',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  achievementsContainer: {
    padding: 16,
  },
  achievementCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  unlockedCard: {
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
  },
  achievementGradient: {
    padding: 20,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  lockedText: {
    color: '#9CA3AF',
  },
  achievementRight: {
    alignItems: 'flex-end',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 40,
    textAlign: 'right',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

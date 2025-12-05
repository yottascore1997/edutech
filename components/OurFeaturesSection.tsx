import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface FeatureItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  gradientColors: [string, string];
  shadowColor: string;
  description: string;
}

// Modern educational color combinations
const primaryBlue = ['#2563EB', '#1E40AF']; // Royal blue gradient
const successGreen = ['#059669', '#047857']; // Success green gradient
const energyOrange = ['#EA580C', '#C2410C']; // Energy orange gradient
const focusPurple = ['#7C3AED', '#5B21B6']; // Focus purple gradient
const trustTeal = ['#0D9488', '#0F766E']; // Trust teal gradient
const growthRed = ['#DC2626', '#B91C1C']; // Growth red gradient
const wisdomIndigo = ['#4F46E5', '#3730A3']; // Wisdom indigo gradient
const innovationPink = ['#DB2777', '#BE185D']; // Innovation pink gradient

const features: FeatureItem[] = [
  {
    id: '1',
    title: 'Live Exams',
    subtitle: 'Real-time Testing',
    icon: 'play-circle',
    route: '/(tabs)/exam',
    gradientColors: primaryBlue,
    shadowColor: primaryBlue[0],
    description: 'Join live competitive exams with real-time scoring and instant results'
  },
  {
    id: '2',
    title: 'Practice Tests',
    subtitle: 'Skill Building',
    icon: 'library',
    route: '/(tabs)/practice-exam',
    gradientColors: successGreen,
    shadowColor: successGreen[0],
    description: 'Practice with unlimited mock tests to improve your performance'
  },
  {
    id: '3',
    title: 'Study Materials',
    subtitle: 'Premium Books',
    icon: 'book',
    route: '/(tabs)/book-store',
    gradientColors: energyOrange,
    shadowColor: energyOrange[0],
    description: 'Access comprehensive study materials and premium books'
  },
  {
    id: '4',
    title: 'Quiz Battles',
    subtitle: 'Compete & Win',
    icon: 'trophy',
    route: '/(tabs)/quiz',
    gradientColors: focusPurple,
    shadowColor: focusPurple[0],
    description: 'Challenge friends in exciting quiz battles and win rewards'
  },
  {
    id: '5',
    title: 'Study Groups',
    subtitle: 'Connect & Learn',
    icon: 'people',
    route: '/(tabs)/social',
    gradientColors: trustTeal,
    shadowColor: trustTeal[0],
    description: 'Join study groups and connect with fellow aspirants'
  },
  {
    id: '6',
    title: 'Exam Alerts',
    subtitle: 'Stay Updated',
    icon: 'notifications',
    route: '/exam-notifications',
    gradientColors: growthRed,
    shadowColor: growthRed[0],
    description: 'Get instant notifications about upcoming exams and results'
  }
];

const OurFeaturesSection: React.FC = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleFeaturePress = (feature: FeatureItem) => {
    console.log(`Navigate to ${feature.title}`);
    router.push(feature.route as any);
  };

  const renderFeatureItem = (feature: FeatureItem, index: number, type: 'main' | 'secondary' | 'additional') => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    const getExamStyle = () => {
      switch (type) {
        case 'main':
          return styles.mainFeature;
        case 'secondary':
          return styles.secondaryFeature;
        case 'additional':
          return styles.additionalFeature;
        default:
          return styles.mainFeature;
      }
    };

    return (
      <Animated.View
        key={feature.id}
        style={[
          getExamStyle(),
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleFeaturePress(feature)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
          style={styles.touchableContent}
        >
          {/* Exam-Style Feature Card */}
          <View style={styles.examCard}>
            {/* Feature Icon */}
            <LinearGradient
              colors={feature.gradientColors}
              style={styles.examIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={feature.icon as any} size={type === 'main' ? 24 : 20} color="#FFFFFF" />
            </LinearGradient>
            
            {/* Feature Content */}
            <View style={styles.examContent}>
              <Text style={[styles.examTitle, type === 'main' && styles.mainTitle]}>
                {feature.title}
              </Text>
              <Text style={styles.examSubtitle}>
                {feature.subtitle}
              </Text>
            </View>
            
            {/* Exam Arrow */}
            <View style={styles.examArrow}>
              <Ionicons name="arrow-forward" size={16} color="#6366F1" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
        },
      ]}
    >
      {/* Exam-Style Header */}
      <View style={styles.examHeader}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerIcon}>
            <Ionicons name="school" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.sectionTitle}>Exam Preparation Hub</Text>
            <Text style={styles.sectionSubtitle}>Your Gateway to Success</Text>
          </View>
        </LinearGradient>
      </View>
      
      {/* Unique Exam-Style Layout */}
      <View style={styles.examContainer}>
        {/* Top Row - Main Features */}
        <View style={styles.topRow}>
          {features.slice(0, 2).map((feature, index) => renderFeatureItem(feature, index, 'main'))}
        </View>
        
        {/* Middle Row - Secondary Features */}
        <View style={styles.middleRow}>
          {features.slice(2, 4).map((feature, index) => renderFeatureItem(feature, index, 'secondary'))}
        </View>
        
        {/* Bottom Row - Additional Features */}
        <View style={styles.bottomRow}>
          {features.slice(4, 6).map((feature, index) => renderFeatureItem(feature, index, 'additional'))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  examHeader: {
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
  },
  examContainer: {
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  middleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mainFeature: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  secondaryFeature: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#059669',
  },
  additionalFeature: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  touchableContent: {
    flex: 1,
  },
  examCard: {
    padding: 16,
    alignItems: 'center',
  },
  examIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  examContent: {
    alignItems: 'center',
    marginBottom: 8,
  },
  examTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  examSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  examArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
});

export default OurFeaturesSection;

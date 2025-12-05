import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import QuestionOfTheDay from './QuestionOfTheDay';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const QuestionOfTheDayPreview = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [timerElement, setTimerElement] = useState<React.ReactNode>(null);
  
  // Animated values for background elements
  const animatedValue1 = useRef(new Animated.Value(0)).current;
  const animatedValue2 = useRef(new Animated.Value(0)).current;
  const animatedValue3 = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const progressRing = useRef(new Animated.Value(0)).current;
  const dailyIndicator = useRef(new Animated.Value(0)).current;
  const sparkleAnim1 = useRef(new Animated.Value(0)).current;
  const sparkleAnim2 = useRef(new Animated.Value(0)).current;
  const sparkleAnim3 = useRef(new Animated.Value(0)).current;
  const sparkleAnim4 = useRef(new Animated.Value(0)).current;
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const floatingAnim3 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  // Start background animations
  useEffect(() => {
    const startAnimations = () => {
      // Floating animation for pattern circles
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue1, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue1, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue2, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue2, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue3, {
            toValue: 1,
            duration: 5000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue3, {
            toValue: 0,
            duration: 5000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse animation for main icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Progress ring animation (daily progress)
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressRing, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(progressRing, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Daily indicator blinking
      Animated.loop(
        Animated.sequence([
          Animated.timing(dailyIndicator, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(dailyIndicator, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Enhanced Sparkle animations
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim1, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim1, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(sparkleAnim2, {
            toValue: 1,
            duration: 1300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim2, {
            toValue: 0,
            duration: 1300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(sparkleAnim3, {
            toValue: 1,
            duration: 1700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim3, {
            toValue: 0,
            duration: 1700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(1200),
          Animated.timing(sparkleAnim4, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim4, {
            toValue: 0,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Enhanced Floating particles
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnim1, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnim1, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(floatingAnim2, {
            toValue: 1,
            duration: 3500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnim2, {
            toValue: 0,
            duration: 3500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(2000),
          Animated.timing(floatingAnim3, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnim3, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Continuous rotation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Glow pulse effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Shimmer sweep effect
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    startAnimations();
  }, []);

  return (
    <>
      {/* Compact Enhanced Preview Section */}
      <View style={styles.previewContainer}>
                        <LinearGradient
                          colors={['#EA580C', '#F97316', '#FB923C']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.previewGradient}
                        >
          {/* Enhanced Animated Background Pattern */}
          <View style={styles.backgroundPattern}>
            <Animated.View 
              style={[
                styles.patternCircle1,
                {
                  transform: [{
                    translateY: animatedValue1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -15],
                    })
                  }]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.patternCircle2,
                {
                  transform: [{
                    translateY: animatedValue2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    })
                  }]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.patternCircle3,
                {
                  transform: [{
                    translateY: animatedValue3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -25],
                    })
                  }]
                }
              ]} 
            />

            {/* Enhanced Sparkle Elements */}
            <Animated.View 
              style={[
                styles.sparkleElement1,
                {
                  opacity: sparkleAnim1,
                  transform: [{
                    scale: sparkleAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.5],
                    })
                  }]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.sparkleElement2,
                {
                  opacity: sparkleAnim2,
                  transform: [{
                    scale: sparkleAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1.2],
                    })
                  }]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.sparkleElement3,
                {
                  opacity: sparkleAnim3,
                  transform: [{
                    scale: sparkleAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1.4],
                    })
                  }]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.sparkleElement4,
                {
                  opacity: sparkleAnim4,
                  transform: [{
                    scale: sparkleAnim4.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 1.3],
                    })
                  }]
                }
              ]} 
            />

            {/* Enhanced Floating Particles */}
            <Animated.View 
              style={[
                styles.floatingParticle1,
                {
                  opacity: floatingAnim1.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1, 0],
                  }),
                  transform: [
                    {
                      translateY: floatingAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -40],
                      })
                    },
                    {
                      translateX: floatingAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 20],
                      })
                    }
                  ]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.floatingParticle2,
                {
                  opacity: floatingAnim2.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1, 0],
                  }),
                  transform: [
                    {
                      translateY: floatingAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -35],
                      })
                    },
                    {
                      translateX: floatingAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -15],
                      })
                    }
                  ]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.floatingParticle3,
                {
                  opacity: floatingAnim3.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1, 0],
                  }),
                  transform: [
                    {
                      translateY: floatingAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -30],
                      })
                    },
                    {
                      translateX: floatingAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 25],
                      })
                    }
                  ]
                }
              ]} 
            />

            {/* Rotating Ring */}
            <Animated.View 
              style={[
                styles.rotatingRing,
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

            {/* Glowing Orbs */}
            <Animated.View 
              style={[
                styles.glowOrb1,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3],
                  }),
                  transform: [{
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    })
                  }]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.glowOrb2,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.2, 0.8, 0.2],
                  }),
                  transform: [{
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.2, 0.8],
                    })
                  }]
                }
              ]} 
            />

            {/* Shimmer Effect */}
            <Animated.View 
              style={[
                styles.shimmerBar,
                {
                  transform: [{
                    translateX: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-150, 500],
                    })
                  }]
                }
              ]} 
            />

            <View style={styles.patternDots} />
          </View>

          <View style={styles.previewContent}>
            <View style={styles.largeImageContainer}>
              <Image 
                source={require('../assets/images/icons/question-girl.png')}
                style={styles.largeQuestionGirlIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.previewLeft}>
              <View style={styles.previewTextContainer}>
                <View style={styles.titleWithButtonRow}>
                  <Text style={styles.previewTitle}>Question of the Day</Text>
                  <TouchableOpacity style={styles.rightViewButton} onPress={openModal}>
                    <LinearGradient
                      colors={['#DB2777', '#BE185D']}
                      style={styles.rightViewButtonGradient}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <Text style={styles.previewSubtitle}>Test your knowledge daily!</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Enhanced Modal */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.centeredOverlay}>
          <View style={styles.centeredCard}>
                            <LinearGradient
                              colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.cardGradient}
                            >
              {/* Enhanced Header with Close Button and Timer */}
              <View style={styles.modalHeader}>
                <View style={styles.headerContent}>
                  {timerElement}
                  <View style={styles.headerText}>
                    <Text style={styles.modalTitle}>Question</Text>
                    <Text style={styles.modalSubtitle}>Test your knowledge!</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#FF4444" />
                </TouchableOpacity>
              </View>

              {/* Content Container */}
              <View style={styles.contentContainer}>
                <QuestionOfTheDay onTimerRender={setTimerElement} />
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
    previewContainer: {
        margin: 12,
        borderRadius: 24,
        shadowColor: '#EA580C',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
        overflow: 'visible',
        position: 'relative',
        borderWidth: 2,
        borderColor: 'rgba(234, 88, 12, 0.15)',
    },
  previewGradient: {
    borderRadius: 18,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  patternCircle1: {
    position: 'absolute',
    top: 15,
    right: 25,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  patternCircle2: {
    position: 'absolute',
    top: 45,
    left: 15,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  patternCircle3: {
    position: 'absolute',
    bottom: 20,
    right: 45,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternDots: {
    position: 'absolute',
    top: 30,
    right: 65,
    width: 15,
    height: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 7.5,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  progressRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderTopColor: '#FFFFFF',
    top: -6,
    left: -6,
  },
  iconContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  iconGradient: {
    padding: 10,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  largeImageContainer: {
    position: 'absolute',
    left: -60,
    top: -30,
    zIndex: 10,
  },
  largeQuestionGirlIcon: {
    width: 180,
    height: 180,
  },
  previewTextContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 10,
    marginLeft: 70,
  },
  titleWithButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  rightViewButton: {
    marginLeft: 8,
    flexShrink: 0,
  },
  rightViewButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DB2777',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(219, 39, 119, 0.3)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dailyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dailyBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
    fontWeight: '500',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    letterSpacing: 0.4,
    fontFamily: 'System',
    lineHeight: 22,
  },
  previewSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
    fontFamily: 'System',
    lineHeight: 18,
  },
  viewButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  viewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.4,
    fontFamily: 'System',
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(10px)',
  },
  closeButton: {
    backgroundColor: '#FFFFFF', // White background
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)', // Light red border
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
    fontFamily: 'System',
    lineHeight: 28,
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 0,
    minHeight: 450,
    maxHeight: 650,
  },
  centeredOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
    centeredCard: {
        width: '90%',
        minHeight: 550,
        maxHeight: 750,
        paddingVertical: 12,
        paddingHorizontal: 0,
        backgroundColor: 'transparent',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
        elevation: 16,
        borderWidth: 2,
        borderColor: 'rgba(234, 88, 12, 0.15)',
    },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 550,
    maxHeight: 750,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    marginLeft: 18,
  },
  modalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
    fontFamily: 'System',
    lineHeight: 20,
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  // Enhanced Animation Elements
  sparkleElement1: {
    position: 'absolute',
    top: 25,
    left: 40,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  sparkleElement2: {
    position: 'absolute',
    top: 60,
    right: 50,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  sparkleElement3: {
    position: 'absolute',
    bottom: 40,
    left: 60,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 9,
    elevation: 9,
  },
  sparkleElement4: {
    position: 'absolute',
    bottom: 25,
    right: 80,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 7,
    elevation: 7,
  },
  floatingParticle1: {
    position: 'absolute',
    top: 35,
    left: 80,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  floatingParticle2: {
    position: 'absolute',
    bottom: 50,
    right: 40,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  floatingParticle3: {
    position: 'absolute',
    top: 50,
    right: 100,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 5,
    elevation: 5,
  },
  rotatingRing: {
    position: 'absolute',
    top: 40,
    left: 120,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderTopColor: '#FFFFFF',
    borderRightColor: 'rgba(255, 255, 255, 0.9)',
  },
  glowOrb1: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 12,
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 35,
    left: 30,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  shimmerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
});

export default QuestionOfTheDayPreview; 
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface AdvertisementBannerProps {
  onPress?: () => void;
}

const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({ onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sparkle animation
    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Float animation
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    sparkleAnimation.start();
    floatAnimation.start();

    return () => {
      sparkleAnimation.stop();
      floatAnimation.stop();
    };
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    // You can customize this action
    if (onPress) {
      onPress();
    } else {
      // Default action - could be opening a link or navigating

      // Example: Linking.openURL('https://your-advertisement-link.com');
    }
  };

  const sparkleTranslateY = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const floatTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.bannerWrapper,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={styles.touchable}
        >
                     <LinearGradient
             colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
             style={styles.gradient}
           >
            {/* Animated Background Pattern */}
            <View style={styles.patternContainer}>
              {[...Array(8)].map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.sparkle,
                    {
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      transform: [
                        {
                          translateY: sparkleTranslateY,
                        },
                        {
                          scale: sparkleAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.5, 1, 0.5],
                          }),
                        },
                      ],
                      opacity: sparkleAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 1, 0.3],
                      }),
                    },
                  ]}
                />
              ))}
            </View>

                         {/* Main Content */}
             <View style={styles.content}>
               <View style={styles.leftSection}>
                 <Animated.View
                   style={[
                     styles.iconContainer,
                     {
                       transform: [{ translateY: floatTranslateY }],
                     },
                   ]}
                 >
                   <LinearGradient
                     colors={['#FFD700', '#FF6B6B']}
                     style={styles.iconGradient}
                   >
                     <Ionicons name="gift" size={24} color="#fff" />
                   </LinearGradient>
                 </Animated.View>

                 <View style={styles.textContainer}>
                   <Text style={styles.mainText}>🎁 Offer Soon!</Text>
                   <Text style={styles.subText}>Get Premium Access & Boost Your Score</Text>
                   <View style={styles.offerBadge}>
                     <Text style={styles.offerText}>✨ 50% OFF Today</Text>
                   </View>
                 </View>
               </View>

               <View style={styles.rightSection}>
                 <TouchableOpacity style={styles.ctaButtonContainer}>
                   <LinearGradient
                     colors={['#FF6B6B', '#FF8E53']}
                     style={styles.ctaButton}
                   >
                     <Text style={styles.ctaText}>Claim Now</Text>
                     <Ionicons name="arrow-forward" size={16} color="#fff" />
                   </LinearGradient>
                 </TouchableOpacity>
               </View>
             </View>

            {/* Shimmer Effect */}
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [
                    {
                      translateX: sparkleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-screenWidth, screenWidth],
                      }),
                    },
                  ],
                },
              ]}
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
     container: {
     marginHorizontal: 20,
     marginTop: 15,
     marginBottom: 8,
   },
     bannerWrapper: {
     borderRadius: 16,
     overflow: 'hidden',
     shadowColor: '#4F46E5',
     shadowOffset: { width: 0, height: 6 },
     shadowOpacity: 0.25,
     shadowRadius: 12,
     elevation: 10,
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.2)',
   },
  touchable: {
    overflow: 'hidden',
  },
     gradient: {
     height: 110,
     position: 'relative',
     overflow: 'hidden',
   },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 3,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
     content: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: 16,
     paddingVertical: 16,
     height: '100%',
     zIndex: 2,
   },
   leftSection: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,
     minHeight: 70,
   },
     iconContainer: {
     marginRight: 12,
   },
   iconGradient: {
     width: 48,
     height: 48,
     borderRadius: 24,
     justifyContent: 'center',
     alignItems: 'center',
     shadowColor: '#FFD700',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 4,
   },
     textContainer: {
     flex: 1,
     justifyContent: 'center',
     paddingVertical: 4,
     minHeight: 60,
   },
     mainText: {
     fontSize: 17,
     fontWeight: '700',
     color: '#FFFFFF',
     marginBottom: 3,
     textShadowColor: 'rgba(0, 0, 0, 0.3)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
     letterSpacing: 0.2,
     lineHeight: 22,
     includeFontPadding: false,
     textAlignVertical: 'center',
   },
   subText: {
     fontSize: 12,
     color: 'rgba(255, 255, 255, 0.9)',
     fontWeight: '500',
     marginBottom: 5,
     textShadowColor: 'rgba(0, 0, 0, 0.2)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 1,
     lineHeight: 16,
     includeFontPadding: false,
   },
   offerBadge: {
     alignSelf: 'flex-start',
   },
   offerText: {
     fontSize: 11,
     color: '#FFFFFF',
     fontWeight: '700',
     backgroundColor: 'rgba(255, 255, 255, 0.25)',
     paddingHorizontal: 8,
     paddingVertical: 3,
     borderRadius: 10,
     textShadowColor: 'rgba(0, 0, 0, 0.2)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 1,
     letterSpacing: 0.3,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.3)',
   },
   rightSection: {
     alignItems: 'center',
     justifyContent: 'center',
   },
   ctaButtonContainer: {
     alignItems: 'center',
   },
     ctaButton: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 16,
     shadowColor: '#FFD700',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 4,
   },
   ctaText: {
     fontSize: 14,
     fontWeight: '700',
     color: '#FFFFFF',
     marginRight: 6,
     textShadowColor: 'rgba(0, 0, 0, 0.2)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 1,
     letterSpacing: 0.3,
   },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 100,
    transform: [{ skewX: '-20deg' }],
    zIndex: 3,
  },
});

export default AdvertisementBanner;

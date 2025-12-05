import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const floatingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    const startAnimations = () => {
      // Background fade in
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // Floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Logo container animation
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();

      // Text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 1000,
        delay: 1500,
        useNativeDriver: true,
      }).start();

      // Button animation
      Animated.sequence([
        Animated.delay(2000),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    };

    startAnimations();

    // Auto navigate after 5 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const floatingTranslateY = floatingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      
      {/* Educational Background with Rich Design */}
      <Animated.View style={[styles.backgroundContainer, { opacity: backgroundOpacity }]}>
        <LinearGradient
          colors={['#4c1d95', '#7c3aed']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Educational Pattern Overlay */}
        <View style={styles.educationalPattern}>
          <View style={styles.patternGrid}>
            <View style={styles.gridLine} />
            <View style={[styles.gridLine, styles.gridLineVertical]} />
            <View style={[styles.gridLine, styles.gridLineHorizontal]} />
          </View>
        </View>
        
        {/* Simple Educational Elements */}
        <Animated.View 
          style={[
            styles.floatingElement,
            styles.floatingElement1,
            { transform: [{ translateY: floatingTranslateY }] }
          ]}
        >
          <Ionicons name="book" size={24} color="rgba(255, 255, 255, 0.3)" />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.floatingElement,
            styles.floatingElement2,
            { transform: [{ translateY: floatingTranslateY }] }
          ]}
        >
          <Ionicons name="school" size={20} color="rgba(255, 255, 255, 0.3)" />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.floatingElement,
            styles.floatingElement3,
            { transform: [{ translateY: floatingTranslateY }] }
          ]}
        >
          <Ionicons name="trophy" size={22} color="rgba(255, 255, 255, 0.3)" />
        </Animated.View>
        
        {/* Decorative Circles */}
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        <View style={[styles.decorativeCircle, styles.circle3]} />
        <View style={[styles.decorativeCircle, styles.circle4]} />
      </Animated.View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Animated Educational Logo */}
        <Animated.View 
          style={[
            styles.titleContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Animated.View style={[styles.logoContainer, { transform: [{ rotate: floatingAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg']
          }) }] }]}>
            <Ionicons name="school" size={60} color="#FFFFFF" />
            <Animated.View style={[styles.logoGlow, { 
              opacity: floatingAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 1, 0.3]
              })
            }]}>
              <Ionicons name="star" size={20} color="#FFD700" />
            </Animated.View>
          </Animated.View>
          
          <Text style={styles.titleText}>YOTTA</Text>
          <Text style={styles.titleText}>SCORE</Text>
          
          <Animated.View style={[styles.educationalBadge, { 
            opacity: textOpacity,
            transform: [{ scale: textOpacity }]
          }]}>
            <Ionicons name="book" size={16} color="#FFFFFF" />
            <Text style={styles.badgeText}>Education</Text>
          </Animated.View>
        </Animated.View>
        
        {/* Simple Educational Subtitle */}
        <Animated.View style={[styles.subtitleContainer, { opacity: textOpacity }]}>
          <Text style={styles.subtitleText}>Smart Learning Platform</Text>
          <Text style={styles.subtitleDescription}>
            Master your skills with interactive learning
          </Text>
        </Animated.View>
      </View>

        {/* Educational Action Button */}
        <Animated.View 
          style={[
            styles.buttonContainer,
            {
              opacity: textOpacity,
              transform: [{ scale: buttonScale }],
            },
          ]}
        >
          <TouchableOpacity onPress={onFinish} activeOpacity={0.8}>
            <LinearGradient
              colors={["#4c1d95", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.educationalButton}
            >
              <Ionicons name="play-circle" size={24} color="#FFFFFF" />
              <Text style={styles.educationalButtonText}>Start Learning</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4c1d95',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  educationalPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  patternGrid: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 1,
    height: '100%',
    left: '20%',
  },
  gridLineVertical: {
    left: '40%',
  },
  gridLineHorizontal: {
    width: '100%',
    height: 1,
    top: '30%',
    left: 0,
  },
  floatingElement: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  educationalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  floatingElement1: {
    top: height * 0.15,
    left: width * 0.1,
  },
  floatingElement2: {
    top: height * 0.25,
    right: width * 0.1,
  },
  floatingElement3: {
    bottom: height * 0.2,
    left: width * 0.15,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },
  circle1: {
    width: width * 0.4,
    height: width * 0.4,
    backgroundColor: '#FFFFFF',
    top: -width * 0.2,
    right: -width * 0.1,
  },
  circle2: {
    width: width * 0.3,
    height: width * 0.3,
    backgroundColor: '#FFFFFF',
    bottom: -width * 0.15,
    left: -width * 0.1,
  },
  circle3: {
    width: width * 0.25,
    height: width * 0.25,
    backgroundColor: '#FFFFFF',
    top: height * 0.1,
    left: width * 0.1,
  },
  circle4: {
    width: width * 0.2,
    height: width * 0.2,
    backgroundColor: '#FFFFFF',
    bottom: height * 0.1,
    right: width * 0.1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFD700',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  titleText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 3,
    marginVertical: 3,
  },
  educationalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitleText: {
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 1,
  },
  subtitleDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 30,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  educationalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  educationalButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
});

export default SplashScreen; 
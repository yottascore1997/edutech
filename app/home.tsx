import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />

      {/* Upper part – primary header, enhanced */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafe}>
          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.logoCircle}>
              <Ionicons name="school" size={44} color={AppColors.primary} />
            </View>
            <Text style={styles.brandName}>Yottascore</Text>
            <Text style={styles.tagline}>Smart Learning Platform</Text>
            <Text style={styles.taglineSub}>
              Prepare for exams with practice tests, quizzes & study material
            </Text>
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* Bottom – white card, enhanced */}
      <View style={styles.bottomSection}>
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <Text style={styles.welcomeText}>Welcome</Text>
          <Text style={styles.subtitle}>
            Sign in or create an account to continue your learning journey.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Login</Text>
          </TouchableOpacity>

          <View style={styles.dividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => router.push('/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.ghostBtnText}>Create an account</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.primary,
  },
  header: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  headerSafe: {
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 24,
  },
  logoCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  brandName: {
    fontSize: 34,
    fontWeight: '900',
    color: AppColors.accent,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.98)',
    marginTop: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  taglineSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: AppColors.darkGrey,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: AppColors.grey,
    marginBottom: 28,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: AppColors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AppColors.lightGrey,
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 13,
    color: AppColors.grey,
    fontWeight: '600',
  },
  ghostBtn: {
    backgroundColor: AppColors.white,
    borderWidth: 2,
    borderColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  ghostBtnText: {
    color: AppColors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
});

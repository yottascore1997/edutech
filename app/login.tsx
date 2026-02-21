import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { AppColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const Login = () => {
  const auth = useAuth();
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

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

  const handleLogin = async () => {
    if (isSubmitting) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const trimmedEmail = (email || '').trim();
    const trimmedPassword = (password || '').trim();
    if (!trimmedEmail || !trimmedPassword) {
      showError('Please enter both email and password.');
      return;
    }
    if (trimmedPassword.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      await auth.login(trimmedEmail, trimmedPassword);
      showSuccess('Login successful! Welcome back.');
    } catch (error: any) {
      const isNotVerified =
        error?.status === 403 ||
        (error?.data?.message &&
          String(error.data.message).toLowerCase().includes('verify')) ||
        (error?.message && String(error.message).toLowerCase().includes('verify'));
      if (isNotVerified) {
        showError('Please verify your email before signing in.');
        router.push({
          pathname: '/resend-verification',
          params: { email: trimmedEmail },
        } as any);
      } else {
        showError(
          error?.data?.message || error?.message || 'Login failed.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />

      {/* Top section – primary background, logo + brand */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={AppColors.white} />
        </TouchableOpacity>

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
            <Ionicons name="school" size={40} color={AppColors.primary} />
          </View>
          <Text style={styles.brandName}>Yottascore</Text>
          <Text style={styles.tagline}>SMART LEARNING PLATFORM</Text>
        </Animated.View>
      </View>

      {/* Bottom section – white card with form */}
      <View style={styles.bottomSection}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setEmailFocused(false);
              setPasswordFocused(false);
              Keyboard.dismiss();
            }}
          >
            <Animated.View
              style={[styles.card, { opacity: fadeAnim }]}
            >
              {/* Email or Phone */}
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    emailFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={
                      emailFocused ? AppColors.primary : AppColors.grey
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email or Phone"
                    placeholderTextColor={AppColors.grey}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    passwordFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={
                      passwordFocused ? AppColors.primary : AppColors.grey
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={AppColors.grey}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={secureTextEntry}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={
                        secureTextEntry ? 'eye-outline' : 'eye-off-outline'
                      }
                      size={20}
                      color={
                        passwordFocused ? AppColors.primary : AppColors.grey
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/forgot-password',
                    params: { email },
                  } as any)
                }
                style={styles.forgotWrap}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={isSubmitting || !email.trim() || !password.trim()}
                style={styles.primaryBtn}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={AppColors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Login</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerWrap}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={() => router.push('/register')}
                style={styles.ghostBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.ghostBtnText}>Create an account</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.primary,
  },
  header: {
    backgroundColor: AppColors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: AppColors.accent,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 6,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  card: {
    paddingBottom: 8,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: AppColors.lightGrey,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.white,
  },
  input: {
    flex: 1,
    color: AppColors.darkGrey,
    fontSize: 15,
    fontWeight: '600',
  },
  inputIcon: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 6,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotText: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
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

export default Login;

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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

const LOGIN = {
  dark: '#030047',
  darkSoft: '#0d0d5c',
  accent: '#FFCC3E',
  bg: '#E1E5F4',
  card: '#F8FBFF',
  inputBg: '#F0F3F9',
  textMuted: '#5c5c7a',
  white: '#FFFFFF',
};

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
      <StatusBar barStyle="light-content" backgroundColor={LOGIN.dark} />

      <LinearGradient colors={[LOGIN.dark, LOGIN.darkSoft]} style={styles.cover}>
        {/* Decorative shapes */}
        <View style={styles.shape1} />
        <View style={styles.shape2} />
        <View style={styles.shape3} />

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={22} color={LOGIN.dark} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.coverContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.coverIconWrap}>
            <Ionicons name="document-text" size={42} color={LOGIN.dark} />
          </View>
          <View style={styles.badge}>
            <Ionicons name="school" size={14} color={LOGIN.white} style={styles.badgeIcon} />
            <Text style={styles.badgeText}>Exam Platform</Text>
          </View>
          <Text style={styles.coverTitle}>WELCOME BACK</Text>
          <Text style={styles.coverSubtitle}>SIGN IN</Text>
        </Animated.View>
      </LinearGradient>

      <View style={styles.main}>
        <ScrollView
          style={styles.scroll}
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
            <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
              <View style={styles.inputRow}>
                <View
                  style={[
                    styles.inputWrap,
                    emailFocused && styles.inputWrapFocused,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={emailFocused ? LOGIN.dark : LOGIN.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email or Username"
                    placeholderTextColor={LOGIN.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View
                  style={[
                    styles.inputWrap,
                    passwordFocused && styles.inputWrapFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={passwordFocused ? LOGIN.dark : LOGIN.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={LOGIN.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={secureTextEntry}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={passwordFocused ? LOGIN.dark : LOGIN.textMuted}
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
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleLogin}
                activeOpacity={0.88}
                disabled={isSubmitting || !email.trim() || !password.trim()}
                style={styles.ctaPrimary}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={LOGIN.dark} />
                ) : (
                  <Text style={styles.ctaPrimaryText}>SIGN IN</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signUpRow}>
                <Text style={styles.signUpLabel}>Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/register')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.signUpLink}>Create one Now!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: LOGIN.bg,
  },
  cover: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  shape1: {
    position: 'absolute',
    top: 50,
    right: -24,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,204,62,0.18)',
  },
  shape2: {
    position: 'absolute',
    top: 100,
    right: 60,
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255,204,62,0.35)',
    transform: [{ rotate: '15deg' }],
  },
  shape3: {
    position: 'absolute',
    bottom: 20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LOGIN.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  coverContent: {
    alignItems: 'center',
  },
  coverIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: LOGIN.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeText: {
    color: LOGIN.white,
    fontWeight: '700',
    fontSize: 12,
  },
  coverTitle: {
    color: LOGIN.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  coverSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  main: {
    flex: 1,
    backgroundColor: LOGIN.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: LOGIN.card,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    marginBottom: 20,
    shadowColor: LOGIN.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  inputRow: {
    marginBottom: 14,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LOGIN.inputBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputWrapFocused: {
    borderColor: LOGIN.dark,
    backgroundColor: LOGIN.white,
  },
  input: {
    flex: 1,
    color: LOGIN.dark,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  inputIcon: {},
  eyeBtn: {
    padding: 8,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotText: {
    color: LOGIN.dark,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: LOGIN.dark,
    marginHorizontal: -24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    alignItems: 'center',
  },
  ctaPrimary: {
    backgroundColor: LOGIN.accent,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  ctaPrimaryText: {
    color: LOGIN.dark,
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    flexWrap: 'wrap',
  },
  signUpLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '500',
  },
  signUpLink: {
    color: LOGIN.accent,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default Login;

import { AppColors } from '@/constants/Colors';
import { useToast } from '@/context/ToastContext';
import { apiFetch } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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

const Register = () => {
  const { showError } = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const handleRegister = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    if (!name || !username || !email || !password || !phoneNumber) {
      showError('Please fill all the required fields.');
      return;
    }
    if (password.length < 8) {
      showError('Password must be at least 8 characters and contain one letter and one number.');
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (!hasLetter || !hasNumber) {
      showError('Password must be at least 8 characters and contain one letter and one number.');
      return;
    }
    if (!email.includes('@')) {
      showError('Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      const userData = {
        name,
        username,
        email,
        password,
        phoneNumber,
        referralCode,
        role: 'STUDENT',
      };
      const res = await apiFetch('/auth/register', { method: 'POST', body: userData });
      if (res?.ok) {
        router.replace({ pathname: '/check-email', params: { email } } as any);
        return;
      }
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error?.response?.data?.message) errorMessage = error.response.data.message;
      else if (error?.data?.message) errorMessage = error.data.message;
      else if (error?.message) errorMessage = error.message;
      if (error?.status === 429 || error?.data?.statusCode === 429) {
        showError('Too many attempts. Please try again later.');
        return;
      }
      if (errorMessage.toLowerCase().includes('email already exists')) {
        showError('This email is already registered. Please use a different email or try logging in.');
      } else if (errorMessage.toLowerCase().includes('phone')) {
        showError('Please enter a valid phone number.');
      } else {
        showError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputWrap = (key: string) => [
    styles.inputWrapper,
    focusedField === key && styles.inputWrapperFocused,
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />

      {/* Top – same as login: primary header */}
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
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.headerTitle}>Let's Create Your Account</Text>
        </Animated.View>
      </View>

      {/* Bottom – white card with form */}
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
              setFocusedField(null);
              Keyboard.dismiss();
            }}
          >
            <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
              <View style={styles.inputContainer}>
                <View style={inputWrap('name')}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={focusedField === 'name' ? AppColors.primary : AppColors.grey}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={AppColors.grey}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={inputWrap('username')}>
                  <Ionicons
                    name="at-outline"
                    size={20}
                    color={focusedField === 'username' ? AppColors.primary : AppColors.grey}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor={AppColors.grey}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={inputWrap('email')}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={focusedField === 'email' ? AppColors.primary : AppColors.grey}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={AppColors.grey}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={inputWrap('password')}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={focusedField === 'password' ? AppColors.primary : AppColors.grey}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={AppColors.grey}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={secureTextEntry}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={focusedField === 'password' ? AppColors.primary : AppColors.grey}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.helper}>At least 8 characters, one letter & one number</Text>
              </View>

              <View style={styles.inputContainer}>
                <View style={inputWrap('phone')}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={focusedField === 'phone' ? AppColors.primary : AppColors.grey}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor={AppColors.grey}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={inputWrap('referral')}>
                  <Ionicons
                    name="pricetag-outline"
                    size={20}
                    color={focusedField === 'referral' ? AppColors.primary : AppColors.grey}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Referral code (optional)"
                    placeholderTextColor={AppColors.grey}
                    value={referralCode}
                    onChangeText={setReferralCode}
                    autoCapitalize="characters"
                    onFocus={() => setFocusedField('referral')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <Text style={styles.termsText}>I agree to the Terms & Privacy</Text>

              <TouchableOpacity
                onPress={handleRegister}
                activeOpacity={0.85}
                disabled={isSubmitting}
                style={styles.primaryBtn}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={AppColors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signInRow}>
                <Text style={styles.accountText}>Have an account? </Text>
                <TouchableOpacity onPress={() => router.replace('/login')}>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
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
    paddingBottom: 20,
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
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.white,
    textAlign: 'center',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  card: { paddingBottom: 8 },
  inputContainer: { marginBottom: 14 },
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
  },
  input: {
    flex: 1,
    color: AppColors.darkGrey,
    fontSize: 15,
    fontWeight: '600',
  },
  inputIcon: { marginRight: 12 },
  eyeIcon: { padding: 6 },
  helper: {
    fontSize: 11,
    color: AppColors.grey,
    marginTop: 4,
    marginLeft: 4,
  },
  termsText: {
    fontSize: 13,
    color: AppColors.grey,
    marginBottom: 18,
  },
  primaryBtn: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryBtnText: {
    color: AppColors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountText: {
    fontSize: 14,
    color: AppColors.darkGrey,
    fontWeight: '500',
  },
  signInLink: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '700',
  },
});

export default Register;

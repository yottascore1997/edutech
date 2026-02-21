import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/context/ToastContext';
import { API_BASE_URL } from '@/constants/api';
import { AppColors } from '@/constants/Colors';

const FORGOT_PASSWORD_TIMEOUT_MS = 15000;

export default function ForgotPassword() {
  const router = useRouter();
  const route = useRoute();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState(((route?.params as any)?.email as string) || '');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const sendingRef = useRef(false);

  const trimmedEmail = useMemo(() => (email || '').trim(), [email]);
  const validateEmail = (e: string) => !!e && e.includes('@');

  const handleSend = async () => {
    if (!validateEmail(trimmedEmail)) {
      showError('Please enter a valid email address.');
      return;
    }
    if (sendingRef.current) return;
    sendingRef.current = true;
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FORGOT_PASSWORD_TIMEOUT_MS);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const contentType = res.headers.get('content-type');
      let data: any;
      if (contentType && contentType.indexOf('application/json') !== -1) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      if (!res.ok) {
        const msg = typeof data === 'object' ? data?.message : data;
        showError(msg || 'Something went wrong. Please try again.');
        return;
      }
      showSuccess("If that email exists, we've sent a reset link. Check your inbox (and spam).");
      router.push({ pathname: '/check-email', params: { email: trimmedEmail } } as any);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        showError('Request timed out. Please check your connection and try again.');
      } else {
        const msg = err?.data?.message ?? err?.message;
        showError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />

      {/* Top – same as Login/Register: primary header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={AppColors.white} />
        </TouchableOpacity>
      </View>

      {/* Bottom – white card */}
      <View style={styles.bottomSection}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formBlock}>
            <View style={styles.lockIconWrap}>
              <Ionicons name="lock-closed" size={36} color={AppColors.darkGrey} />
            </View>
            <Text style={styles.cardTitle}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              No worries, we'll send you reset instructions.
            </Text>

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={emailFocused ? AppColors.primary : AppColors.grey}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email Address"
                  placeholderTextColor={AppColors.grey}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  editable={!loading}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSend}
              disabled={loading || !trimmedEmail}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color={AppColors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={styles.backToLogin}
              activeOpacity={0.85}
            >
              <Ionicons name="person-outline" size={18} color={AppColors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 24,
    paddingBottom: 32,
    minHeight: 200,
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
  bottomSection: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 28 : 24,
  },
  keyboardView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
  },
  formBlock: {
    flex: 0,
  },
  lockIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 14,
    opacity: 0.9,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: AppColors.darkGrey,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.grey,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: { marginBottom: 20 },
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
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backToLoginText: {
    color: AppColors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});

import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/context/ToastContext';
import { API_BASE_URL } from '@/constants/api';

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
    <LinearGradient
      colors={['#2A0756', '#4C1D95', '#7C3AED']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.bgDecor} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,221,230,0.22)', 'rgba(124,58,237,0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bgBlob, { top: -60, left: -90, width: 260, height: 260 }]}
        />
        <LinearGradient
          colors={['rgba(124,58,237,0.22)', 'rgba(255,221,230,0.05)']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.bgBlob, { top: 170, right: -110, width: 300, height: 300 }]}
        />
        <LinearGradient
          colors={['rgba(245,158,11,0.12)', 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={[styles.bgBlob, { bottom: 80, left: 30, width: 200, height: 200 }]}
        />
      </View>

      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <LinearGradient colors={['rgba(255,255,255,0.24)', 'rgba(255,255,255,0.12)']} style={styles.backPill}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        <View style={styles.card}>
          <View style={styles.hero}>
            <LinearGradient colors={['rgba(245,158,11,0.22)', 'rgba(255,255,255,0.06)']} style={styles.heroIcon}>
              <Ionicons name="key-outline" size={22} color="#FFE8B5" />
            </LinearGradient>
            <Text style={styles.title}>Forgot password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we’ll send a secure reset link.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={emailFocused ? '#7C3AED' : '#9CA3AF'}
                style={styles.inputIcon}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
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
            <Text style={styles.helper}>We’ll never share your email.</Text>
          </View>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={loading || !trimmedEmail}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={loading ? ['#C8CBD2', '#B9BCC4'] : ['#F59E0B', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              <Text style={styles.sendText}>{loading ? 'Sending…' : 'Send reset link'}</Text>
              {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/login')} style={styles.backToLogin} activeOpacity={0.8}>
            <Text style={styles.backText}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  back: { position: 'absolute', left: 16, top: Platform.OS === 'ios' ? 64 : 42, zIndex: 10 },
  backPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 92 : 74,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    ...(Platform.OS === 'android'
      ? { elevation: 0 }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 18,
        }),
  },
  hero: { alignItems: 'center', marginBottom: 14 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  title: { fontSize: 22, fontWeight: '900', color: '#0b1220', letterSpacing: 0.2, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13.5, color: 'rgba(11,18,32,0.72)', textAlign: 'center', lineHeight: 19 },
  field: { marginTop: 10 },
  label: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 8 },
  helper: { fontSize: 11.5, color: '#6b7280', marginTop: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 14,
    borderWidth: 1.25,
    borderColor: 'rgba(17,24,39,0.10)',
    paddingHorizontal: 12,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: 'rgba(124,58,237,0.55)',
    backgroundColor: '#FAF8FF',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#0b1220', fontSize: 15, fontWeight: '700' },
  sendButton: { marginTop: 14 },
  sendGradient: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sendText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 0.3 },
  backToLogin: { marginTop: 12, alignItems: 'center', paddingVertical: 6 },
  backText: { color: '#5B21B6', fontWeight: '900' },
});


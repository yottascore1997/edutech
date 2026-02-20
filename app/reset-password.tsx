import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/context/ToastContext';
import { apiFetch } from '@/constants/api';
import { Stack } from 'expo-router';

export default function ResetPassword() {
  const router = useRouter();
  const route = useRoute();
  const { showSuccess, showError } = useToast();
  const params = (route?.params as any) || {};
  const [token, setToken] = useState(params?.token || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const trimmedPassword = useMemo(() => (password || '').trim(), [password]);
  const trimmedConfirm = useMemo(() => (confirm || '').trim(), [confirm]);

  useEffect(() => {
    // If token is provided in params (deep link), capture it
    if (params?.token) setToken(params.token);
  }, [params]);

  const validate = () => {
    if (!token) {
      showError('Missing reset token.');
      return false;
    }
    if (!trimmedPassword || trimmedPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return false;
    }
    if (trimmedPassword !== trimmedConfirm) {
      showError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await apiFetch('/auth/reset-password', { method: 'POST', body: { token, newPassword: trimmedPassword } });
      if (res?.ok) {
        showSuccess('Password reset successfully. You can now sign in.');
        router.replace('/login');
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message;
      if (msg && String(msg).toLowerCase().includes('token')) {
        showError('This reset link is invalid or expired. Please request a new one.');
      } else if (msg && String(msg).toLowerCase().includes('password')) {
        showError('Password must be at least 6 characters');
      } else {
        showError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
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
              <Ionicons name="shield-checkmark-outline" size={22} color="#FFE8B5" />
            </LinearGradient>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>Create a strong new password for your account.</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>New password</Text>
            <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={passwordFocused ? '#7C3AED' : '#9CA3AF'}
                style={styles.inputIcon}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="New password"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.helper}>Minimum 6 characters.</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={[styles.inputWrapper, confirmFocused && styles.inputWrapperFocused]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={confirmFocused ? '#7C3AED' : '#9CA3AF'}
                style={styles.inputIcon}
              />
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Confirm password"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                secureTextEntry={!showConfirm}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeButton}>
                <Ionicons name={showConfirm ? 'eye' : 'eye-off'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleReset}
            disabled={loading || !trimmedPassword || !trimmedConfirm}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={loading ? ['#C8CBD2', '#B9BCC4'] : ['#F59E0B', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              <Text style={styles.sendText}>{loading ? 'Resetting…' : 'Reset password'}</Text>
              {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />}
            </LinearGradient>
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
  eyeButton: { padding: 6, marginLeft: 6 },
  sendButton: { marginTop: 14 },
  sendGradient: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sendText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 0.3 },
});


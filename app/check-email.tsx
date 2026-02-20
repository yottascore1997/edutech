import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/context/ToastContext';
import { apiFetch } from '@/constants/api';

export default function CheckEmail() {
  const router = useRouter();
  const route = useRoute();
  // support both route.params.email and router params fallback
  const email = (route?.params as any)?.email || '';
  const { showSuccess, showError } = useToast();

  const handleResend = async () => {
    try {
      const res = await apiFetch('/auth/resend-verification', { method: 'POST', body: { email } });
      if (res?.ok) {
        showSuccess('If that email exists, we sent a verification link. Check your inbox.');
      }
    } catch (err: any) {
      showError(err?.data?.message || err?.message || 'Failed to resend verification email.');
    }
  };

  return (
    <LinearGradient colors={['#4c1d95', '#7c3aed']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.message}>We sent a verification link to</Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.note}>Please verify your email before signing in.</Text>

        <TouchableOpacity style={styles.resendButton} onPress={handleResend}>
          <LinearGradient colors={['#f59e0b', '#f97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.resendGradient}>
            <Text style={styles.resendText}>Didn't receive? Resend</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login')} style={styles.signInLink}>
          <Text style={styles.signInText}>Already verified? Sign in</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 70 : 40 },
  back: { position: 'absolute', left: 16, top: Platform.OS === 'ios' ? 70 : 40, zIndex: 10 },
  card: {
    marginTop: 140,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 6 },
  message: { fontSize: 14, color: '#444' },
  email: { fontSize: 16, fontWeight: '700', color: '#111', marginTop: 8 },
  note: { fontSize: 13, color: '#6b7280', marginTop: 8, textAlign: 'center' },
  resendButton: { marginTop: 18, width: '100%' },
  resendGradient: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  resendText: { color: '#fff', fontWeight: '700' },
  signInLink: { marginTop: 12 },
  signInText: { color: '#7c3aed', fontWeight: '700' },
});


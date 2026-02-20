import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/context/ToastContext';
import { apiFetch } from '@/constants/api';

export default function ResendVerification() {
  const router = useRouter();
  const route = useRoute();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState(((route?.params as any)?.email as string) || '');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.includes('@')) {
      showError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/auth/resend-verification', { method: 'POST', body: { email } });
      if (res?.ok) {
        showSuccess('If that email exists, we sent a verification link.');
        router.replace({ pathname: '/check-email', params: { email } } as any);
      }
    } catch (err: any) {
      showError(err?.data?.message || err?.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#4c1d95', '#7c3aed']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.title}>Resend verification</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send a verification link.</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          <LinearGradient colors={['#f59e0b', '#f97316']} style={styles.sendGradient}>
            <Text style={styles.sendText}>{loading ? 'Sending...' : 'Send verification link'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 70 : 40 },
  back: { position: 'absolute', left: 16, top: Platform.OS === 'ios' ? 70 : 40, zIndex: 10 },
  card: {
    marginTop: 120,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    color: '#111',
  },
  sendButton: { marginTop: 6 },
  sendGradient: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  sendText: { color: '#fff', fontWeight: '700' },
});


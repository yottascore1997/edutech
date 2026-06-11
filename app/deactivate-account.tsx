import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SUPPORT_EMAIL = 'yottascore@gmail.com';

export default function DeactivateAccountScreen() {
  const { user, logout } = useAuth();
  const { showError, showSuccess } = useToast();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeactivate = () => {
    if (!user?.token) {
      router.push('/phone-login');
      return;
    }
    if (!confirmed) {
      showError('Please confirm that you understand this action.');
      return;
    }
    if (!password.trim()) {
      showError('Enter your password to confirm.');
      return;
    }

    Alert.alert(
      'Deactivate account?',
      'Your account will be deactivated and you will be logged out. You will not be able to sign in again unless support reactivates your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const loginRes = await fetch(`${require('@/constants/api').API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  identifier: user.email || user.id,
                  password: password.trim(),
                }),
              });
              const loginData = await loginRes.json();
              if (!loginRes.ok) {
                showError(loginData.error || loginData.message || 'Incorrect password.');
                return;
              }

              const res = await apiFetchAuth('/auth/deactivate', user.token, {
                method: 'POST',
                body: {},
              });

              if (res.ok) {
                showSuccess('Account deactivated successfully.');
                await logout();
              } else {
                showError(res.data?.error || res.data?.message || 'Could not deactivate account.');
              }
            } catch {
              showError('Network error. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient colors={['#FFF7ED', '#FFFAF5', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#9A3412" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <LinearGradient colors={['#FDBA74', '#F97316', '#EA580C']} style={styles.iconGrad}>
            <Ionicons name="person-remove-outline" size={32} color="#FFF" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Deactivate your account</Text>
        <Text style={styles.subtitle}>
          Google Play requires apps to let users request account deletion or deactivation. You can deactivate
          your Yottascore account here.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What happens when you deactivate?</Text>
          <Text style={styles.bullet}>• You will be signed out immediately</Text>
          <Text style={styles.bullet}>• You cannot log in with this account again</Text>
          <Text style={styles.bullet}>• Your exam history and wallet data may be retained for legal/audit purposes</Text>
          <Text style={styles.bullet}>• To reactivate, contact {SUPPORT_EMAIL}</Text>
        </View>

        {!user ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in required</Text>
            <Text style={styles.body}>
              To deactivate your account, please sign in first so we can verify it is you.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/phone-login')}>
              <LinearGradient colors={['#FDBA74', '#F97316', '#EA580C']} style={styles.primaryGrad}>
                <Text style={styles.primaryTxt}>Go to Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Confirm deactivation</Text>
            <Text style={styles.body}>Signed in as: {user.email || user.name || user.id}</Text>

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.checkRow} onPress={() => setConfirmed((v) => !v)} activeOpacity={0.8}>
              <Ionicons
                name={confirmed ? 'checkbox' : 'square-outline'}
                size={22}
                color={confirmed ? '#EA580C' : '#A8A29E'}
              />
              <Text style={styles.checkTxt}>
                I understand that my account will be deactivated and I will lose access.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dangerBtn, loading && { opacity: 0.7 }]}
              onPress={handleDeactivate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.dangerTxt}>Deactivate my account</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.footer}>
          Need help? Email us at {SUPPORT_EMAIL}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFAF5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1917' },
  content: { padding: 20, paddingBottom: 40 },
  iconWrap: { alignSelf: 'center', marginBottom: 16 },
  iconGrad: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1C1917', textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#9A3412', marginBottom: 10 },
  bullet: { fontSize: 13, color: '#57534E', lineHeight: 20, marginBottom: 4 },
  body: { fontSize: 14, color: '#57534E', lineHeight: 20, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#44403C', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#FFF7ED',
    marginBottom: 14,
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  checkTxt: { flex: 1, fontSize: 13, color: '#44403C', lineHeight: 19 },
  primaryBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  primaryGrad: { paddingVertical: 14, alignItems: 'center' },
  primaryTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  dangerBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  footer: { fontSize: 12, color: '#A8A29E', textAlign: 'center', marginTop: 8 },
});

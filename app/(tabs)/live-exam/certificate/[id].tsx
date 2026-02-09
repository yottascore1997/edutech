import { apiFetchAuth, SITE_BASE_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface CertificateData {
  userName: string;
  examTitle: string;
  category: string;
  completedAt: string;
  score: number;
  rank: number;
  totalParticipants: number;
  verificationId: string;
  verificationUrl: string;
}

const YOTTASCORE_PURPLE = '#aa35ce';
const YOTTASCORE_PURPLE_DARK = '#8b2aa8';

export default function LiveExamCertificateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CertificateData | null>(null);

  const fetchCertificate = useCallback(async () => {
    if (!id || !user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetchAuth(
        `/student/live-exams/${id}/certificate`,
        user.token,
        { method: 'GET' }
      );
      if (res.ok && res.data) {
        setData(res.data);
      } else {
        setError(res.data?.message || 'Failed to load certificate');
      }
    } catch (e: any) {
      setError(e?.data?.message || e?.message || 'Failed to load certificate');
    } finally {
      setLoading(false);
    }
  }, [id, user?.token]);

  useEffect(() => {
    fetchCertificate();
  }, [fetchCertificate]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const downloadCertificate = async () => {
    try {
      if (!id || !user?.token) return;
      const urlPath = `/student/live-exams/${id}/certificate`;
      const fullUrl = `${SITE_BASE_URL}${urlPath}`;
      const filename = `certificate_${id}.pdf`;
      const dest = FileSystem.documentDirectory + filename;
      const downloadRes = await FileSystem.downloadAsync(fullUrl, dest, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        Alert.alert('Downloaded', `Saved to ${downloadRes.uri}`);
      }
    } catch (e) {
      console.error('Download error', e);
      Alert.alert('Download failed', 'Could not download certificate.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={YOTTASCORE_PURPLE} />
        <Text style={styles.loadingText}>Loading certificate...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={48} color="#94a3b8" />
        <Text style={styles.errorText}>{error || 'Certificate not found'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <LinearGradient
          colors={['#faf5ff', '#f3e8ff', '#ede9fe']}
          style={styles.cardGradient}
        >
          <Text style={styles.title}>CERTIFICATE OF COMPLETION</Text>
          <View style={styles.divider} />
          <Text style={styles.paragraph}>
            This certifies that
          </Text>
          <Text style={styles.userName}>{data.userName}</Text>
          <Text style={styles.paragraph}>
            has successfully completed the Yottascore Live Exam{' '}
            <Text style={styles.examTitleInline}>{data.examTitle}</Text>
            {' '}and is hereby declared a
          </Text>
          <View style={styles.badgeWrap}>
            <Text style={styles.badge}>Participant</Text>
          </View>
          <Text style={styles.badgeSubtext}>Live Exam Completer</Text>

          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Score</Text>
              <Text style={styles.detailValue}>{data.score}%</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rank</Text>
              <Text style={styles.detailValue}>#{data.rank} of {data.totalParticipants}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{data.category || '—'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Issued on</Text>
              <Text style={styles.detailValue}>{formatDate(data.completedAt)}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <TouchableOpacity style={styles.downloadBtnBottom} onPress={downloadCertificate}>
        <Ionicons name="download" size={20} color="#fff" />
        <Text style={styles.downloadBtnBottomText}>Download Certificate</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtnBottom} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backBtnBottomText}>Back to result</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: YOTTASCORE_PURPLE,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  cardGradient: {
    padding: 28,
    borderWidth: 2,
    borderColor: 'rgba(170, 53, 206, 0.2)',
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: YOTTASCORE_PURPLE_DARK,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 2,
    backgroundColor: YOTTASCORE_PURPLE,
    marginBottom: 20,
    opacity: 0.6,
  },
  paragraph: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 6,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: YOTTASCORE_PURPLE_DARK,
    textAlign: 'center',
    marginVertical: 10,
  },
  examTitleInline: {
    fontWeight: '700',
    color: '#374151',
  },
  badgeWrap: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: YOTTASCORE_PURPLE,
    borderRadius: 20,
  },
  badge: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  badgeSubtext: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
  },
  detailsBox: {
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(170, 53, 206, 0.15)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  backBtnBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: YOTTASCORE_PURPLE,
    borderRadius: 14,
  },
  downloadBtnBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: YOTTASCORE_PURPLE_DARK,
    borderRadius: 14,
  },
  downloadBtnBottomText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  backBtnBottomText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});

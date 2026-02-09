import { apiFetchAuth, SITE_BASE_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CertificateItem {
  participantId: string;
  examId: string;
  examTitle: string;
  category?: string;
  duration?: number;
  score: number;
  completedAt: string;
  certificateUrl?: string;
}

export default function MyCertificatesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificates = useCallback(async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetchAuth('/student/certificates', user.token, { method: 'GET' });
      if (res.ok && res.data) {
        const list = res.data.certificates ?? res.data ?? [];
        setCertificates(Array.isArray(list) ? list : []);
      } else {
        setCertificates([]);
        setError(res.data?.message || 'Failed to load certificates');
      }
    } catch (e: any) {
      setCertificates([]);
      setError(e?.data?.message || e?.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useFocusEffect(
    useCallback(() => {
      fetchCertificates();
    }, [fetchCertificates])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCertificates();
    setRefreshing(false);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const openCertificate = (examId: string) => {
    router.push({
      pathname: '/(tabs)/live-exam/certificate/[id]' as any,
      params: { id: examId },
    });
  };

  const downloadCertificate = async (item: CertificateItem) => {
    try {
      if (!user?.token) {
        Alert.alert('Login required', 'You must be logged in to download certificates.');
        return;
      }
      const urlPath = item.certificateUrl || `/student/live-exams/${item.examId}/certificate`;
      const fullUrl = urlPath.startsWith('http') ? urlPath : `${SITE_BASE_URL}${urlPath}`;
      const filename = `certificate_${item.examId}.pdf`;
      const dest = FileSystem.documentDirectory + filename;
      const downloadRes = await FileSystem.downloadAsync(fullUrl, dest, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        Alert.alert('Downloaded', `Saved to ${downloadRes.uri}`);
      }
    } catch (e: any) {
      console.error('Download error', e);
      Alert.alert('Download failed', e?.message || 'Could not download certificate.');
    }
  };

  const browseLiveExams = () => {
    router.push('/(tabs)/exam' as any);
    return;
  };

  if (loading && certificates.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#aa35ce" />
          <Text style={styles.loadingText}>Loading certificates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#aa35ce']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {certificates.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="ribbon-outline" size={64} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No certificates yet</Text>
            <Text style={styles.emptySubtext}>
              Complete a live exam to get your first certificate.
            </Text>
            <TouchableOpacity style={styles.browseBtn} onPress={browseLiveExams} activeOpacity={0.8}>
              <Ionicons name="school-outline" size={20} color="#fff" />
              <Text style={styles.browseBtnText}>Browse Live Exams</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>My Certificates</Text>
            {certificates.map((item) => (
            <View key={item.participantId || item.examId} style={styles.cardWrap}>
              <LinearGradient colors={['#ffffff', 'rgba(170,53,206,0.03)']} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.ribbonIcon}>
                    <Ionicons name="ribbon" size={26} color="#aa35ce" />
                  </View>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.examTitle}
                    </Text>
                    {item.category ? (
                      <Text style={styles.cardCategory}>{item.category}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardDate}>{formatDate(item.completedAt)}</Text>
                  <Text style={styles.cardScore}>Score: {item.score}%</Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.viewButton} onPress={() => openCertificate(item.examId)} activeOpacity={0.85}>
                    <Text style={styles.viewButtonText}>View Certificate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.downloadButton} onPress={() => downloadCertificate(item)} activeOpacity={0.85}>
                    <Ionicons name="download" size={16} color="#fff" />
                    <Text style={styles.downloadButtonText}>Download</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
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
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#aa35ce',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  browseBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardWrap: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ribbonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(170, 53, 206, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cardDate: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  cardScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#aa35ce',
  },
  viewCertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 4,
  },
  viewCertText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#aa35ce',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  viewButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#aa35ce',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  viewButtonText: {
    color: '#aa35ce',
    fontWeight: '800',
    fontSize: 14,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#aa35ce',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontWeight: '800',
    marginLeft: 6,
  },
});

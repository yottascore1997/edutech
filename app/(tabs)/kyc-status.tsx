import KYCDocumentForm from '@/components/KYCDocumentForm';
import { apiFetchAuth } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = HomeTheme;

type KYCDocument = {
  id: string;
  userId: string;
  documentType: string;
  documentNumber: string;
  kycStatus: string;
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

type KYCStatus = {
  kycStatus?: string;
  kycVerifiedAt?: string | null;
  kycRejectedAt?: string | null;
  kycRejectionReason?: string | null;
  documents: KYCDocument[];
};

function parseKycResponse(data: any): KYCStatus {
  if (data?.documents && Array.isArray(data.documents)) {
    const documents = data.documents.map((doc: any) => ({
      ...doc,
      kycStatus: doc.kycStatus || data.kycStatus || 'PENDING',
    }));
    return { ...data, documents };
  }
  if (Array.isArray(data)) return { documents: data, kycStatus: 'PENDING' };
  if (Array.isArray(data?.data)) return { documents: data.data };
  if (data?.data?.documents) return { documents: data.data.documents };
  if (data?.id) return { documents: [data], kycStatus: data.kycStatus || 'PENDING' };
  return { documents: [] };
}

function getOverallStatus(data: KYCStatus | null): string {
  if (!data) return 'NOT_STARTED';
  const top = String(data.kycStatus || '').toUpperCase();
  if (top === 'VERIFIED') return 'VERIFIED';
  const docs = data.documents || [];
  if (docs.some((d) => String(d.kycStatus || '').toUpperCase() === 'VERIFIED')) return 'VERIFIED';
  if (docs.some((d) => String(d.kycStatus || '').toUpperCase() === 'REJECTED')) return 'REJECTED';
  if (docs.length > 0) return 'PENDING';
  return 'NOT_STARTED';
}

function statusMeta(status: string) {
  const s = status.toUpperCase();
  if (s === 'VERIFIED') {
    return {
      color: C.success,
      bg: C.successLight,
      icon: 'checkmark-circle' as const,
      label: 'Verified',
      message: 'Your KYC is verified. You can withdraw winnings.',
    };
  }
  if (s === 'PENDING') {
    return {
      color: '#D97706',
      bg: '#FEF3C7',
      icon: 'time' as const,
      label: 'Under Review',
      message: 'Documents submitted. Verification usually takes 24–48 hours.',
    };
  }
  if (s === 'REJECTED') {
    return {
      color: '#EF4444',
      bg: '#FEE2E2',
      icon: 'close-circle' as const,
      label: 'Rejected',
      message: 'Please re-upload correct documents.',
    };
  }
  return {
    color: C.primary,
    bg: C.primarySoft,
    icon: 'shield-outline' as const,
    label: 'Not Started',
    message: 'Upload Aadhaar, PAN or other ID to complete KYC.',
  };
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDocType(type: string) {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function KYCStatusScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [kycData, setKycData] = useState<KYCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycModalVisible, setKycModalVisible] = useState(false);

  const fetchKYCStatus = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      let response;
      try {
        response = await apiFetchAuth('/user/kyc/status', user.token);
      } catch {
        response = await apiFetchAuth('/user/kyc/upload', user.token);
      }
      if (response.ok) {
        setKycData(parseKycResponse(response.data));
      } else {
        setError(response.data?.message || 'Failed to fetch KYC status.');
      }
    } catch (err: any) {
      if (err.status === 401) {
        setError('Session expired. Please log in again.');
        logout();
      } else {
        setError(err.data?.message || 'Failed to fetch KYC status.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.token, logout]);

  useEffect(() => {
    fetchKYCStatus();
  }, [fetchKYCStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchKYCStatus();
    setRefreshing(false);
  };

  const overallStatus = useMemo(() => getOverallStatus(kycData), [kycData]);
  const overall = statusMeta(overallStatus);
  const documents = kycData?.documents || [];

  const renderDocument = ({ item }: { item: KYCDocument }) => {
    const docStatus = String(item.kycStatus || 'PENDING').toUpperCase();
    const meta = statusMeta(docStatus);

    return (
      <View style={styles.docCard}>
        <View style={styles.docRow}>
          <View style={[styles.docIcon, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon} size={22} color={meta.color} />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docType}>{formatDocType(item.documentType)}</Text>
            <Text style={styles.docNum}>No. {item.documentNumber}</Text>
            <Text style={styles.docDate}>Uploaded {formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.docBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.docBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        {item.rejectionReason && docStatus === 'REJECTED' && (
          <View style={styles.rejectBox}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.rejectText}>{item.rejectionReason}</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.msgText}>Loading KYC status…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingHorizontal: 24 }]}>
        <StatusBar barStyle="dark-content" />
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={[styles.msgText, { color: '#EF4444' }]}>{error}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={fetchKYCStatus}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={[C.bg, '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>KYC Status</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={20} color={C.inkSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={documents}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
        }
        ListHeaderComponent={
          <>
            {/* Status card */}
            <View style={[styles.statusCard, { borderColor: `${overall.color}30` }]}>
              <View style={[styles.statusIconWrap, { backgroundColor: overall.bg }]}>
                <Ionicons name={overall.icon} size={32} color={overall.color} />
              </View>
              <Text style={[styles.statusLabel, { color: overall.color }]}>{overall.label}</Text>
              <Text style={styles.statusMsg}>{overall.message}</Text>
              {kycData?.kycVerifiedAt && overallStatus === 'VERIFIED' && (
                <Text style={styles.statusDate}>Verified on {formatDate(kycData.kycVerifiedAt)}</Text>
              )}
            </View>

            {/* Upload CTA */}
            <TouchableOpacity activeOpacity={0.9} onPress={() => setKycModalVisible(true)} style={styles.uploadWrap}>
              <LinearGradient colors={[...C.btnGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.uploadBtn}>
                <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                <Text style={styles.uploadBtnText}>Upload Document</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Steps */}
            <View style={styles.stepsCard}>
              <Text style={styles.stepsTitle}>How it works</Text>
              {[
                { n: '1', t: 'Upload ID proof (Aadhaar / PAN)' },
                { n: '2', t: 'Wait for admin verification' },
                { n: '3', t: 'Withdraw winnings after approval' },
              ].map((step) => (
                <View key={step.n} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{step.n}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.t}</Text>
                </View>
              ))}
            </View>

            {documents.length > 0 && (
              <Text style={styles.listHeading}>Your Documents ({documents.length})</Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={40} color={C.primary} />
            </View>
            <Text style={styles.emptyTitle}>No documents yet</Text>
            <Text style={styles.emptySub}>Upload your identity proof to start KYC verification.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setKycModalVisible(true)}>
              <Text style={styles.primaryBtnText}>Upload Now</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <KYCDocumentForm
        visible={kycModalVisible}
        onClose={() => setKycModalVisible(false)}
        onSuccess={() => fetchKYCStatus()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  msgText: {
    marginTop: 12,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: C.inkSecondary,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: C.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    ...C.shadowPurple,
  },
  primaryBtnText: { fontFamily: FontFamily.bold, fontSize: 15, color: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 6,
  },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: C.ink },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  statusCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    ...C.shadow,
  },
  statusIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusLabel: { fontFamily: FontFamily.extraBold, fontSize: 20, marginBottom: 6 },
  statusMsg: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: C.inkSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusDate: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: C.inkMuted,
    marginTop: 8,
  },
  uploadWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 14, ...C.shadowPurple },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  uploadBtnText: { fontFamily: FontFamily.bold, fontSize: 15, color: '#FFF', marginLeft: 8 },
  stepsCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.borderLight,
    ...C.shadow,
  },
  stepsTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: C.ink, marginBottom: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNumText: { fontFamily: FontFamily.bold, fontSize: 12, color: C.primary },
  stepText: { fontFamily: FontFamily.regular, fontSize: 13, color: C.inkSecondary, flex: 1 },
  listHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: C.ink,
    marginBottom: 10,
  },
  docCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.borderLight,
    overflow: 'hidden',
    ...C.shadow,
  },
  docRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docInfo: { flex: 1 },
  docType: { fontFamily: FontFamily.semiBold, fontSize: 14, color: C.ink },
  docNum: { fontFamily: FontFamily.regular, fontSize: 12, color: C.inkMuted, marginTop: 2 },
  docDate: { fontFamily: FontFamily.regular, fontSize: 11, color: C.inkMuted, marginTop: 2 },
  docBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  docBadgeText: { fontFamily: FontFamily.bold, fontSize: 10 },
  rejectBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEE2E2',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
  },
  rejectText: { flex: 1, fontFamily: FontFamily.medium, fontSize: 12, color: '#EF4444', lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: C.ink, marginBottom: 6 },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: C.inkMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
});

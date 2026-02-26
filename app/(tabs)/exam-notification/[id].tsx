import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TAB_BAR_PADDING = 88;

const statusColors = {
  active: {
    border: '#7C3AED',
    badge: '#10B981',
    gradient: ['#a18cd1', '#fbc2eb'],
  },
  urgent: {
    border: '#F59E0B',
    badge: '#F59E0B',
    gradient: ['#f7971e', '#ffd200'],
  },
  expired: {
    border: '#EF4444',
    badge: '#EF4444',
    gradient: ['#f85032', '#e73827'],
  },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
};

const getDaysRemaining = (lastDate: string) => {
  const today = new Date();
  const lastDateObj = new Date(lastDate);
  const diffTime = lastDateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function ExamNotificationDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [notification, setNotification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotification = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetchAuth(`/student/exam-notifications`, user?.token);
        if (response.ok) {
          const found = response.data.find((n: any) => n.id === id);
          setNotification(found || null);
          if (!found) setError('Notification not found.');
        } else {
          setError(response?.data?.message || 'Failed to load notification.');
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load notification.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotification();
  }, [id, user?.token]);

  if (loading) {
    return <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 40 }} />;
  }

  if (!notification) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ color: '#DC2626', fontWeight: '700', textAlign: 'center' }}>{error || 'No notification data.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { marginTop: 16 }]}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  const daysRemaining = getDaysRemaining(notification.applyLastDate);
  const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;
  const isExpired = daysRemaining < 0;
  const status = isExpired ? 'expired' : isUrgent ? 'urgent' : 'active';

  const openApplyLink = () => {
    if (notification?.applyLink) Linking.openURL(notification.applyLink);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#a18cd1', '#fbc2eb'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          {daysRemaining >= 0 && notification.applyLink ? (
            <TouchableOpacity onPress={openApplyLink} activeOpacity={0.85} style={styles.headerApplyWrap}>
              <LinearGradient colors={['#7C3AED', '#a18cd1'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerApplyBtn}>
                <Ionicons name="open-outline" size={18} color={AppColors.white} />
                <Text style={styles.applyButtonText}>Apply Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32 }} />
          )}
        </View>
      </LinearGradient>

      <BlurView intensity={70} tint="light" style={styles.contentGlass}>
        <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_PADDING }}>
          <Text style={styles.examTitle}>{notification.title}</Text>
          <View style={styles.statusRow}>
            <LinearGradient colors={statusColors[status].gradient as [string, string]} style={styles.statusBadge}>
              <Text style={styles.statusText}>{status === 'active' ? 'Active' : status === 'urgent' ? 'Urgent' : 'Expired'}</Text>
            </LinearGradient>
            <Text style={styles.dateText}>Last Date: {formatDate(notification.applyLastDate)}</Text>
          </View>

          <View style={styles.sectionBox}>
            <Text style={styles.sectionLabel}>Quick Info</Text>
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={18} color="#6366F1" />
              <Text style={styles.detailLabel}>Notification ID</Text>
              <Text style={styles.detailValue}>{String(notification.id).substring(0, 10)}…</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color="#10B981" />
              <Text style={styles.detailLabel}>Posted On</Text>
              <Text style={styles.detailValue}>{notification.createdAt ? formatDate(notification.createdAt) : '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="hourglass-outline" size={18} color="#F59E0B" />
              <Text style={styles.detailLabel}>Days Remaining</Text>
              <Text style={[styles.detailValue, { color: isExpired ? '#EF4444' : isUrgent ? '#F59E0B' : '#10B981', fontWeight: '800' }]}>
                {isExpired ? 'Expired' : `${daysRemaining} ${daysRemaining === 1 ? 'Day' : 'Days'}`}
              </Text>
            </View>
          </View>

          <View style={styles.sectionBox}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{notification.description}</Text>
          </View>

          {daysRemaining >= 0 && (
            <TouchableOpacity onPress={openApplyLink} activeOpacity={0.85} style={styles.applyButtonTouch}>
              <LinearGradient colors={['#7C3AED', '#a18cd1'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.applyButton}>
                <Ionicons name="open-outline" size={18} color={AppColors.white} />
                <Text style={styles.applyButtonText}>{daysRemaining <= 7 ? 'Apply Now!' : 'Apply'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 18,
    marginHorizontal: 0,
    paddingBottom: 10,
  },
  headerGradient: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    padding: 6,
    marginRight: 8,
  },
  headerApplyWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#a18cd1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  headerApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  contentGlass: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#a18cd1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    flex: 1,
  },
  examTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3b0764',
    marginBottom: 15,
    letterSpacing: 0.2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 15,
    color: '#7C3AED',
    fontWeight: '600',
  },
  sectionBox: {
    marginBottom: 24,
    backgroundColor: 'rgba(243,244,246,0.7)',
    padding: 16,
    borderRadius: 12,
  },
  sectionLabel: {
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 6,
    fontSize: 15,
  },
  description: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '700',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#a18cd1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  applyButtonTouch: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
});


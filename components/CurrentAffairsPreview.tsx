import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 56) / 2;
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatMonthLabel(month: string) {
  try {
    const [y, m] = month.split('-').map(Number);
    return `${monthNames[(m || 1) - 1] ?? ''} ${y}`;
  } catch {
    return month;
  }
}

export default function CurrentAffairsPreview() {
  const router = useRouter();
  const { user } = useAuth();
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await apiFetchAuth('/student/current-affairs/months', user.token);
        const list = Array.isArray(res.data) ? res.data : [];
        if (mounted) setMonths(list.slice(0, 4));
      } catch (e) {
        if (mounted) setMonths([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user?.token]);

  const colors = [
    ['#EEF2FF', '#E0E7FF'],
    ['#FCE7F3', '#FBCFE8'],
    ['#ECFDF5', '#D1FAE5'],
    ['#FEF3C7', '#FDE68A'],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Current Affairs</Text>
        <TouchableOpacity onPress={() => router.push('/current-affairs')}>
          <Text style={styles.seeAll}>See All ›</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={AppColors.primary} />
        </View>
      ) : months.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyCard}
          activeOpacity={0.85}
          onPress={() => router.push('/current-affairs')}
        >
          <Text style={styles.emptyText}>View Current Affairs</Text>
          <Text style={styles.emptySub}>Tap to open</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.grid}>
          {months.map((month, idx) => (
            <TouchableOpacity
              key={month}
              style={[styles.cardWrapper, { width: CARD_WIDTH }]}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/current-affairs/[month]', params: { month } })}
            >
              <LinearGradient
                colors={colors[idx % colors.length]}
                style={styles.card}
              >
                <Text style={styles.cardText}>{formatMonthLabel(month)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  seeAll: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  card: {
    paddingVertical: 18,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 72,
  },
  cardText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  emptyCard: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});

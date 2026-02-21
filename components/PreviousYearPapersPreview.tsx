import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '@/constants/Colors';
import { fetchPYQList } from '@/utils/pyqApi';
import { useAuth } from '@/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 56) / 3;

export default function PreviousYearPapersPreview() {
  const router = useRouter();
  const { user } = useAuth();
  const [years, setYears] = useState<Array<{ year: number; tests: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        if (user?.token) {
          const list = await fetchPYQList(user.token);
          // Group by year
          const map = new Map<number, number>();
          (list || []).forEach((e: any) => {
            const y = Number(e.year) || new Date(e.createdAt || Date.now()).getFullYear();
            map.set(y, (map.get(y) || 0) + 1);
          });
          const arr = Array.from(map.entries())
            .map(([year, tests]) => ({ year, tests }))
            .sort((a, b) => b.year - a.year)
            .slice(0, 6);
          if (mounted) setYears(arr);
        } else {
          // fallback static
          setYears([
            { year: 2022, tests: 3 },
            { year: 2020, tests: 1 },
            { year: 2018, tests: 3 },
            { year: 2017, tests: 2 },
            { year: 2016, tests: 2 },
            { year: 2015, tests: 1 },
          ]);
        }
      } catch (e) {
        console.warn('Failed to load PYQ list', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user?.token]);

  const colors = [
    ['#DCFCE7', '#BBF7D0'],
    ['#EDE9FE', '#E9D5FF'],
    ['#FCE7F3', '#F3E8FF'],
    ['#DBEAFE', '#E0F2FE'],
    ['#FEF3C7', '#FFF7ED'],
    ['#E0F2FE', '#BBF7F8'],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Previous Year Papers</Text>
        <TouchableOpacity onPress={() => router.push('/pyq')}>
          <Text style={styles.seeAll}>See All ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {(years.length ? years : []).slice(0, 6).map((item, idx) => (
          <TouchableOpacity
            key={String(item.year)}
            style={[styles.cardWrapper, { width: CARD_WIDTH }]}
            activeOpacity={0.85}
            onPress={() => router.push('/pyq')}
          >
            <LinearGradient colors={colors[idx % colors.length]} style={styles.cardTop}>
              <Text style={styles.cardYear}>{item.year}</Text>
            </LinearGradient>
            <View style={styles.cardBottom}>
              <Text style={styles.cardTests}>{item.tests} Tests</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 18,
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
  cardTop: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardYear: {
    fontSize: 20,
    fontWeight: '900',
    color: '#065f46',
  },
  cardBottom: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cardTests: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
});


import { apiFetchAuth } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const QUICK_STATS = [
  { label: "Today's News", valueKey: 'today' as const, icon: 'today' as const, color: '#6344D4', bg: '#F3EFFF' },
  { label: 'This Month', valueKey: 'month' as const, icon: 'calendar' as const, color: '#059669', bg: '#ECFDF5' },
  { label: 'Monthly Streak', valueKey: 'streak' as const, icon: 'flame' as const, color: '#EA580C', bg: '#FFF7ED' },
];

const SNAPSHOT = [
  { label: 'News Read', value: '1.2K', icon: 'newspaper-outline' as const },
  { label: 'Accuracy', value: '85%', icon: 'checkmark-circle-outline' as const },
  { label: 'Quizzes', value: '45', icon: 'help-circle-outline' as const },
  { label: 'Minutes', value: '320', icon: 'time-outline' as const },
];

export default function HomeCurrentAffairsSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [monthCount, setMonthCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiFetchAuth('/student/current-affairs/months', user.token);
        const list = Array.isArray(res.data) ? res.data : [];
        if (mounted) setMonthCount(list.length);
      } catch {
        if (mounted) setMonthCount(0);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.token]);

  const statValues = {
    today: '12',
    month: String(monthCount || 0),
    streak: '7',
  };

  const openCA = () => router.push('/(tabs)/current-affairs' as any);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Current Affairs</Text>
        <TouchableOpacity onPress={openCA} activeOpacity={0.85}>
          <Text style={styles.seeAll}>See All ›</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={HomeTheme.primary} style={{ paddingVertical: 16 }} />
      ) : (
        <>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.viewCardWrap} onPress={openCA} activeOpacity={0.9}>
              <LinearGradient colors={['#F5F0FF', '#EDE9FE']} style={styles.viewCard}>
                <View style={styles.globeWrap}>
                  <Ionicons name="globe-outline" size={22} color={HomeTheme.primary} />
                </View>
                <Text style={styles.viewCardTitle}>View Current Affairs</Text>
                <View style={styles.arrowBtn}>
                  <ArrowRight size={14} color="#FFF" strokeWidth={2.5} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.quickStats}>
              {QUICK_STATS.map((s) => (
                <View key={s.label} style={styles.quickStatItem}>
                  <View style={[styles.quickStatIcon, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon} size={14} color={s.color} />
                  </View>
                  <Text style={[styles.quickStatVal, { color: s.color }]}>
                    {statValues[s.valueKey]}
                  </Text>
                  <Text style={styles.quickStatLabel} numberOfLines={2}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.snapshot}>
            <Text style={styles.snapshotTitle}>Your Learning Snapshot</Text>
            <View style={styles.snapshotRow}>
              {SNAPSHOT.map((item, i) => (
                <View
                  key={item.label}
                  style={[styles.snapshotItem, i < SNAPSHOT.length - 1 && styles.snapshotItemBorder]}
                >
                  <Ionicons name={item.icon} size={14} color={HomeTheme.primary} />
                  <Text style={styles.snapshotValue}>{item.value}</Text>
                  <Text style={styles.snapshotLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: HomeTheme.border,
    ...HomeTheme.shadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontFamily: FontFamily.bold, fontSize: 16, color: HomeTheme.ink },
  seeAll: { fontFamily: FontFamily.semiBold, fontSize: 13, color: HomeTheme.primary },
  topRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  viewCardWrap: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  viewCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    minHeight: 100,
    justifyContent: 'space-between',
  },
  globeWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewCardTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: HomeTheme.ink,
    lineHeight: 16,
    marginBottom: 8,
  },
  arrowBtn: {
    alignSelf: 'flex-start',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: HomeTheme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  quickStatItem: { flex: 1, alignItems: 'center' },
  quickStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickStatVal: { fontFamily: FontFamily.bold, fontSize: 14, marginBottom: 2 },
  quickStatLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 8,
    color: HomeTheme.inkMuted,
    textAlign: 'center',
    lineHeight: 11,
  },
  snapshot: {
    backgroundColor: '#F8F7FC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: HomeTheme.border,
  },
  snapshotTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: HomeTheme.inkMuted,
    marginBottom: 10,
  },
  snapshotRow: { flexDirection: 'row', alignItems: 'center' },
  snapshotItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  snapshotItemBorder: {
    borderRightWidth: 1,
    borderRightColor: HomeTheme.border,
  },
  snapshotValue: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: HomeTheme.ink,
    marginTop: 4,
    marginBottom: 2,
  },
  snapshotLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 8,
    color: HomeTheme.inkMuted,
    textAlign: 'center',
  },
});

import { apiFetchAuth } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Globe, Newspaper } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const QUICK_STATS = [
  { label: "Today's News", valueKey: 'today' as const, icon: 'today' as const, color: '#6344D4', bg: '#F3EFFF' },
  { label: 'This Month', valueKey: 'month' as const, icon: 'calendar' as const, color: '#059669', bg: '#ECFDF5' },
  { label: 'Streak', valueKey: 'streak' as const, icon: 'flame' as const, color: '#EA580C', bg: '#FFF7ED' },
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
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#064E3B', '#047857', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.orb1} />
        <View style={styles.orb2} />

        <View style={styles.heroTop}>
          <LinearGradient colors={['#FBBF24', '#F59E0B']} style={styles.badge}>
            <Globe size={12} color="#78350F" strokeWidth={2.4} />
            <Text style={styles.badgeText}>Daily Updates</Text>
          </LinearGradient>

          <TouchableOpacity onPress={openCA} style={styles.seeAllBtn} activeOpacity={0.85}>
            <Text style={styles.seeAllText}>See All</Text>
            <ArrowRight size={13} color="#064E3B" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroCount}>{statValues.today}</Text>
        <Text style={styles.heroLabel}>articles available today</Text>
      </LinearGradient>

      <LinearGradient colors={['#FFFBF7', '#FFFFFF']} style={styles.body}>
        {loading ? (
          <ActivityIndicator color="#059669" style={{ paddingVertical: 20 }} />
        ) : (
          <>
            <TouchableOpacity onPress={openCA} activeOpacity={0.9} style={styles.ctaWrap}>
              <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.ctaCard}>
                <View style={styles.ctaLeft}>
                  <LinearGradient colors={['#059669', '#10B981']} style={styles.ctaIcon}>
                    <Newspaper size={20} color="#FFFFFF" strokeWidth={2} />
                  </LinearGradient>
                  <View style={styles.ctaTextCol}>
                    <Text style={styles.ctaTitle}>View Current Affairs</Text>
                    <Text style={styles.ctaSub}>
                      {monthCount > 0 ? `${monthCount} months archived` : 'Stay exam-ready daily'}
                    </Text>
                  </View>
                </View>
                <LinearGradient colors={['#059669', '#10B981']} style={styles.ctaArrow}>
                  <ArrowRight size={16} color="#FFF" strokeWidth={2.5} />
                </LinearGradient>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.statsRow}>
              {QUICK_STATS.map((s) => (
                <View key={s.label} style={styles.statPill}>
                  <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon} size={14} color={s.color} />
                  </View>
                  <Text style={[styles.statVal, { color: s.color }]}>{statValues[s.valueKey]}</Text>
                  <Text style={styles.statLabel} numberOfLines={2}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.snapshot}>
              <Text style={styles.snapshotTitle}>Your Learning Snapshot</Text>
              <View style={styles.snapshotRow}>
                {SNAPSHOT.map((item) => (
                  <View key={item.label} style={styles.snapshotItem}>
                    <View style={styles.snapshotIconWrap}>
                      <Ionicons name={item.icon} size={13} color="#059669" />
                    </View>
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
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    ...Platform.select({
      ios: {
        shadowColor: '#047857',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
      },
      android: { elevation: 7 },
    }),
  },
  hero: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -30,
    right: -10,
  },
  orb2: {
    position: 'absolute',
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -15,
    left: 24,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    zIndex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: '#78350F',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  seeAllText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: '#064E3B',
  },
  heroCount: {
    fontFamily: FontFamily.extraBold,
    fontSize: 32,
    color: '#FDE68A',
    letterSpacing: -0.5,
    zIndex: 1,
  },
  heroLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    zIndex: 1,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
  },
  ctaWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ctaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaTextCol: { flex: 1 },
  ctaTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: HomeTheme.ink,
    marginBottom: 2,
  },
  ctaSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: HomeTheme.inkMuted,
  },
  ctaArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: HomeTheme.border,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  statVal: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: HomeTheme.inkMuted,
    textAlign: 'center',
    lineHeight: 12,
  },
  snapshot: {
    backgroundColor: '#FFFFFF',
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
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  snapshotRow: { flexDirection: 'row' },
  snapshotItem: { flex: 1, alignItems: 'center' },
  snapshotIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  snapshotValue: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: HomeTheme.ink,
    marginBottom: 2,
  },
  snapshotLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 8,
    color: HomeTheme.inkMuted,
    textAlign: 'center',
  },
});

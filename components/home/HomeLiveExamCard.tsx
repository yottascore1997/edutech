import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { getImageUrl } from '@/constants/api';
import { formatDateTime, formatTimeUntilStart, hasExamStarted } from '@/utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Clock, Radio, Trophy, Users, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Exam = {
  id: string;
  title?: string;
  category?: string;
  imageUrl?: string;
  startTime?: string;
  spots?: number;
  spotsLeft?: number;
  prizePool?: number;
};

export default function HomeLiveExamCard({ exam }: { exam: Exam }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState('');
  const [status, setStatus] = useState<'UPCOMING' | 'LIVE'>('UPCOMING');

  useEffect(() => {
    const tick = () => {
      if (!exam.startTime) return;
      const started = hasExamStarted(exam.startTime);
      setStatus(started ? 'LIVE' : 'UPCOMING');
      if (!started) {
        setCountdown(formatTimeUntilStart(exam.startTime).replace(/:/g, ' : '));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [exam.startTime]);

  const spots = exam.spots ?? 0;
  const left = exam.spotsLeft ?? 0;
  const filled = spots > 0 ? ((spots - left) / spots) * 100 : 0;
  const imageUri = exam.imageUrl ? getImageUrl(exam.imageUrl) : null;
  const isLive = status === 'LIVE';

  return (
    <TouchableOpacity
      activeOpacity={0.94}
      onPress={() => router.push(`/(tabs)/exam/${exam.id}` as any)}
      style={styles.cardOuter}
    >
      <LinearGradient
        colors={[...HomeTheme.creamGrad]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={[styles.statusPill, isLive ? styles.statusPillLive : styles.statusPillSoon]}>
            {isLive ? (
              <>
                <View style={styles.livePulse} />
                <Radio size={10} color="#FFF" strokeWidth={2.5} />
                <Text style={[styles.statusText, styles.statusTextOnDark]}>LIVE</Text>
              </>
            ) : (
              <>
                <Zap size={10} color="#854D0E" strokeWidth={2.5} fill="#854D0E" />
                <Text style={[styles.statusText, styles.statusTextOnYellow]}>SOON</Text>
              </>
            )}
          </View>
          <View style={styles.catChip}>
            <Text style={styles.catText} numberOfLines={1}>
              {exam.category || 'General'}
            </Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.logoWrap}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.logo} resizeMode="cover" />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="school" size={22} color={HomeTheme.primary} />
              </View>
            )}
          </View>
          <Text style={styles.examTitle} numberOfLines={2}>
            {exam.title || 'Live Exam'}
          </Text>
        </View>

        <View style={styles.timerBlock}>
          <Clock size={14} color={isLive ? '#16A34A' : '#DC2626'} strokeWidth={2} />
          <View style={styles.timerTextCol}>
            <Text style={[styles.timerLabel, isLive ? styles.timerTextLive : styles.timerTextRed]}>
              {isLive ? 'Live now' : 'Starts in'}
            </Text>
            <Text
              style={[styles.timerValue, isLive ? styles.timerTextLive : styles.timerTextRed]}
              numberOfLines={1}
            >
              {isLive ? 'Join before seats fill' : countdown || '00 : 00 : 00'}
            </Text>
          </View>
          {exam.startTime && !isLive && (
            <Text style={[styles.startDate, styles.timerTextRed]} numberOfLines={1}>
              {formatDateTime(exam.startTime)}
            </Text>
          )}
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Users size={13} color={HomeTheme.primary} strokeWidth={2} />
            <View style={styles.metricTextCol}>
              <Text style={styles.metricLabel}>Spots</Text>
              <Text style={styles.metricValue}>
                {left}
                <Text style={styles.metricMuted}> / {spots || '—'}</Text>
              </Text>
            </View>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBox}>
            <Trophy size={13} color="#16A34A" strokeWidth={2} />
            <View style={styles.metricTextCol}>
              <Text style={styles.metricLabel}>Prize</Text>
              <Text style={styles.prizeValue}>₹{exam.prizePool?.toLocaleString('en-IN') ?? '0'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressBg}>
          <LinearGradient
            colors={['#4ADE80', '#16A34A', '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${Math.min(100, Math.max(6, filled))}%` }]}
          />
        </View>

        <View style={styles.ctaWrap}>
          <LinearGradient
            colors={['#4ADE80', '#16A34A', '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>{isLive ? 'Enter Exam' : 'Join Now'}</Text>
            <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
          </LinearGradient>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#6344D4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  card: {
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: HomeTheme.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  statusPillSoon: {
    backgroundColor: '#FACC15',
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  statusPillLive: {
    backgroundColor: '#16A34A',
    borderWidth: 1,
    borderColor: '#15803D',
  },
  livePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FCA5A5' },
  statusText: { fontFamily: FontFamily.bold, fontSize: 9, letterSpacing: 0.5 },
  statusTextOnYellow: { color: '#854D0E' },
  statusTextOnDark: { color: '#FFFFFF' },
  catChip: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '50%',
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  catText: { fontFamily: FontFamily.semiBold, fontSize: 9, color: '#854D0E' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: HomeTheme.primarySoft,
    backgroundColor: '#FFFFFF',
  },
  logo: { width: '100%', height: '100%' },
  logoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HomeTheme.primarySoft,
  },
  examTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: HomeTheme.ink,
    lineHeight: 21,
  },
  timerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: HomeTheme.border,
  },
  timerTextCol: { flex: 1, minWidth: 0 },
  timerLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    marginBottom: 1,
  },
  timerValue: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    letterSpacing: 0.4,
  },
  timerTextRed: { color: '#DC2626' },
  timerTextLive: { color: '#16A34A' },
  startDate: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    maxWidth: '36%',
    textAlign: 'right',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: HomeTheme.border,
  },
  metricBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: HomeTheme.border,
    marginHorizontal: 4,
  },
  metricTextCol: { flex: 1 },
  metricLabel: { fontFamily: FontFamily.regular, fontSize: 9, color: HomeTheme.inkMuted },
  metricValue: { fontFamily: FontFamily.bold, fontSize: 14, color: HomeTheme.ink },
  metricMuted: { fontFamily: FontFamily.regular, fontSize: 10, color: HomeTheme.inkMuted },
  prizeValue: { fontFamily: FontFamily.bold, fontSize: 14, color: '#16A34A' },
  progressBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E8E8F0',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  ctaWrap: { borderRadius: 10, overflow: 'hidden' },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 5,
    borderRadius: 10,
  },
  ctaText: { fontFamily: FontFamily.bold, fontSize: 13, color: '#FFFFFF' },
});

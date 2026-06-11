import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { getImageUrl } from '@/constants/api';
import { formatTimeUntilStart, hasExamStarted } from '@/utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
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

function formatScheduleParts(startTime: string) {
  const date = new Date(startTime);
  return {
    date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={11} color={HomeTheme.primary} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function HomeLiveExamCard({ exam }: { exam: Exam }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState('');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const tick = () => {
      if (!exam.startTime) return;
      const started = hasExamStarted(exam.startTime);
      setIsLive(started);
      if (!started) setCountdown(formatTimeUntilStart(exam.startTime));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [exam.startTime]);

  const spots = exam.spots ?? 0;
  const left = exam.spotsLeft ?? 0;
  const filled = spots > 0 ? ((spots - left) / spots) * 100 : 0;
  const imageUri = exam.imageUrl ? getImageUrl(exam.imageUrl) : null;
  const prize = exam.prizePool?.toLocaleString('en-IN') ?? '0';
  const schedule = exam.startTime ? formatScheduleParts(exam.startTime) : null;

  const openExam = () => router.push(`/(tabs)/exam/${exam.id}` as any);

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={openExam} style={styles.outer}>
      <LinearGradient colors={[...HomeTheme.creamGrad]} style={styles.card}>
        <LinearGradient
          colors={[HomeTheme.primaryLight, HomeTheme.primary, HomeTheme.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topAccent}
        />

        {!isLive ? (
          <LinearGradient colors={['#FDE047', '#FACC15', '#EAB308']} style={styles.upcomingBadge}>
            <Text style={styles.upcomingText}>Upcoming</Text>
          </LinearGradient>
        ) : (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Live</Text>
          </View>
        )}

        <View style={styles.top}>
          <View style={styles.thumbRing}>
            <View style={styles.thumb}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.thumbImg} resizeMode="cover" />
              ) : (
                <LinearGradient colors={[...HomeTheme.heroBg]} style={styles.thumbFallback}>
                  <Ionicons name="school-outline" size={17} color={HomeTheme.primary} />
                </LinearGradient>
              )}
            </View>
          </View>

          <View style={styles.info}>
            <View style={styles.categoryRow}>
              <View style={styles.categoryDot} />
              <Text style={styles.category} numberOfLines={1}>
                {exam.category || 'General'}
              </Text>
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {exam.title || 'Live Exam'}
            </Text>
          </View>
        </View>

        {isLive ? (
          <View style={styles.liveStrip}>
            <Ionicons name="radio-outline" size={12} color={HomeTheme.success} />
            <Text style={styles.liveStripText}>Exam is live — join now</Text>
          </View>
        ) : (
          <View style={styles.timePanel}>
            <View style={styles.timeLeft}>
              <Text style={styles.timeLeftLabel}>STARTS IN</Text>
              <Text style={styles.countdown}>{countdown || '—'}</Text>
            </View>
            {schedule ? (
              <>
                <View style={styles.timeDivider} />
                <View style={styles.timeRight}>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={11} color={HomeTheme.primary} />
                    <Text style={styles.dateText} numberOfLines={1}>
                      {schedule.date}
                    </Text>
                  </View>
                  <Text style={styles.timeText} numberOfLines={1}>
                    {schedule.time}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        )}

        <View style={styles.statsPanel}>
          <StatBox icon="trophy-outline" label="Prize" value={`₹${prize}`} />
          <View style={styles.statSep} />
          <StatBox icon="people-outline" label="Spots" value={`${left}/${spots || '—'}`} />
          <View style={styles.statSep} />
          <StatBox icon="pie-chart-outline" label="Filled" value={`${Math.round(filled)}%`} />
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={
                isLive
                  ? ([...HomeTheme.liveGradient] as [string, string])
                  : ([...HomeTheme.progressGradient] as [string, string])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.min(100, Math.max(4, filled))}%` }]}
            />
          </View>
        </View>

        <TouchableOpacity onPress={openExam} activeOpacity={0.9} style={styles.ctaWrap}>
          <LinearGradient colors={['#22C55E', '#16A34A', '#15803D']} style={styles.cta}>
            <Text style={styles.ctaText}>{isLive ? 'Enter Exam' : 'Join Exam'}</Text>
            <View style={styles.ctaIcon}>
              <ChevronRight size={12} color="#15803D" strokeWidth={2.5} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#6344D4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 9,
    paddingTop: 11,
    overflow: 'hidden',
    position: 'relative',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  upcomingBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 13,
    zIndex: 2,
  },
  upcomingText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#713F12',
    letterSpacing: 0.3,
  },
  liveBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: HomeTheme.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 13,
    borderWidth: 1,
    borderColor: '#86EFAC',
    zIndex: 2,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: HomeTheme.success,
  },
  liveBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: HomeTheme.success,
  },
  top: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 7,
    paddingRight: 56,
  },
  thumbRing: {
    padding: 1.5,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 2 },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  categoryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: HomeTheme.primary,
  },
  category: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: HomeTheme.primary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: HomeTheme.ink,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  timePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 7,
  },
  timeLeft: {
    flex: 1,
    minWidth: 0,
  },
  timeLeftLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: '#DC2626',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  countdown: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#DC2626',
    letterSpacing: 0.4,
  },
  timeDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E8E8F0',
    marginHorizontal: 8,
  },
  timeRight: {
    flex: 1.1,
    minWidth: 0,
    gap: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: HomeTheme.inkSecondary,
  },
  timeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: HomeTheme.ink,
    paddingLeft: 16,
  },
  liveStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: HomeTheme.successLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 7,
  },
  liveStripText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: HomeTheme.success,
  },
  statsPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  statLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: HomeTheme.inkMuted,
    letterSpacing: 0.2,
  },
  statValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: HomeTheme.ink,
  },
  statSep: {
    width: 1,
    height: 24,
    backgroundColor: '#EDE9FE',
  },
  progressWrap: { marginBottom: 7 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EDE9FE',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  ctaWrap: { borderRadius: 8, overflow: 'hidden' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
  },
  ctaText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  ctaIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

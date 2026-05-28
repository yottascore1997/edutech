import { FontFamily } from '@/constants/Typography';
import { R, scoreAccent, scoreAccentSoft, scoreMessage } from '@/constants/LiveExamResultTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Home,
  Share2,
  Sparkles,
  Target,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react-native';
import React from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const PAD = 16;

export type LiveExamResultData = {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  examDuration: number;
  timeTakenSeconds: number;
  timeTakenMinutes: number;
  timeTakenFormatted: string;
  currentRank: number;
  prizeAmount: number;
  examTitle: string;
  completedAt?: string;
  accuracy?: number;
  averageScore?: number;
  topScore?: number;
  totalParticipants?: number;
  percentile?: number;
};

type Props = {
  result: LiveExamResultData;
  activeTab: 'overview' | 'detailed';
  onTabChange: (tab: 'overview' | 'detailed') => void;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  scoreAnim: Animated.Value;
  pulseAnim: Animated.Value;
  showConfetti: boolean;
  confettiNodes: React.ReactNode;
  performanceLabel: string;
  congratsMessage: string;
  percentile: number | null;
  accuracy: number;
  completion: number;
  onShare: () => void;
  onHome: () => void;
  onCertificate: () => void;
  children?: React.ReactNode;
};

function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[s.glassCard, style]}>
      <LinearGradient
        colors={['#FFFFFF', '#FAFCFF']}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

function HighlightPill({
  icon,
  label,
  value,
  tint,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: string;
  bg: string;
}) {
  return (
    <View style={s.pill}>
      <View style={[s.pillIcon, { backgroundColor: bg }]}>{icon}</View>
      <Text style={s.pillVal} numberOfLines={1}>{value}</Text>
      <Text style={s.pillLbl}>{label}</Text>
    </View>
  );
}

function AnswerBar({
  correct,
  wrong,
  skipped,
  total,
}: {
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
}) {
  const safe = Math.max(total, 1);
  const cW = (correct / safe) * 100;
  const wW = (wrong / safe) * 100;
  const sW = (skipped / safe) * 100;
  return (
    <View style={s.barWrap}>
      <View style={s.barTrack}>
        {cW > 0 && (
          <View style={[s.barSeg, { width: `${cW}%`, backgroundColor: R.success }]} />
        )}
        {wW > 0 && (
          <View style={[s.barSeg, { width: `${wW}%`, backgroundColor: R.error }]} />
        )}
        {sW > 0 && (
          <View style={[s.barSeg, { width: `${sW}%`, backgroundColor: '#94A3B8' }]} />
        )}
      </View>
      <View style={s.barLegend}>
        <LegendDot color={R.success} label={`${correct} Correct`} />
        <LegendDot color={R.error} label={`${wrong} Wrong`} />
        <LegendDot color="#94A3B8" label={`${skipped} Skip`} />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={s.legendTxt}>{label}</Text>
    </View>
  );
}

export default function LiveExamResultView({
  result,
  activeTab,
  onTabChange,
  fadeAnim,
  slideAnim,
  scoreAnim,
  pulseAnim,
  showConfetti,
  confettiNodes,
  performanceLabel,
  congratsMessage,
  percentile,
  accuracy,
  completion,
  onShare,
  onHome,
  onCertificate,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const accent = scoreAccent(result.score);
  const accentSoft = scoreAccentSoft(result.score);
  const msg = congratsMessage || scoreMessage(result.score);

  const completedLabel = result.completedAt
    ? new Date(result.completedAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const achievements = [
    result.score >= 80 && { emoji: '🏆', label: 'Top Scorer', grad: R.goldGrad },
    result.correctAnswers === result.totalQuestions && { emoji: '⭐', label: 'Perfect Score', grad: ['#C4B5FD', '#8B5CF6'] as const },
    result.timeTakenMinutes < result.examDuration * 0.7 && { emoji: '⚡', label: 'Speed Pro', grad: ['#93C5FD', '#3B82F6'] as const },
    percentile != null && percentile >= 90 && { emoji: '🎖️', label: 'Top 10%', grad: ['#F9A8D4', '#EC4899'] as const },
  ].filter(Boolean) as { emoji: string; label: string; grad: readonly string[] }[];

  return (
    <View style={s.root}>
      <LinearGradient colors={[...R.bgGrad]} style={StyleSheet.absoluteFill} />
      {showConfetti ? confettiNodes : null}

      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 88 }]}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* ── Hero header ── */}
            <LinearGradient
              colors={[...R.heroDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.hero}
            >
              <View style={s.heroGlow1} />
              <View style={s.heroGlow2} />
              <View style={s.heroTag}>
                <Sparkles size={13} color="#A5B4FC" strokeWidth={2.5} />
                <Text style={s.heroTagTxt}>LIVE EXAM COMPLETE</Text>
              </View>
              <Text style={s.heroExam} numberOfLines={2}>
                {result.examTitle}
              </Text>
              {completedLabel ? <Text style={s.heroWhen}>{completedLabel}</Text> : null}
            </LinearGradient>

            {/* ── Floating score card ── */}
            <Animated.View
              style={[
                s.scoreCard,
                { transform: [{ scale: scoreAnim }], borderColor: accent },
              ]}
            >
              <View style={[s.scoreAccentBar, { backgroundColor: accent }]} />
              <View style={s.scoreCardBody}>
                <Text style={s.scoreCardLabel}>Your Score</Text>
                <View style={s.scoreMain}>
                  <Text style={[s.scoreBig, { color: accent }]}>{Math.round(result.score)}</Text>
                  <Text style={s.scoreUnit}>%</Text>
                </View>
                <Animated.View style={[s.perfBadge, { backgroundColor: accentSoft, transform: [{ scale: pulseAnim }] }]}>
                  <Text style={[s.perfBadgeTxt, { color: accent }]}>{performanceLabel}</Text>
                </Animated.View>
                <Text style={s.scoreMsg}>{msg}</Text>
              </View>
            </Animated.View>

            {/* ── Quick stats ── */}
            <View style={s.pillRow}>
              <HighlightPill
                icon={<Trophy size={18} color={R.gold} strokeWidth={2.2} />}
                label="Rank"
                value={`#${result.currentRank}`}
                tint={R.gold}
                bg={R.goldSoft}
              />
              <HighlightPill
                icon={<Award size={18} color={R.successDark} strokeWidth={2.2} />}
                label="Prize"
                value={`₹${result.prizeAmount?.toLocaleString('en-IN')}`}
                tint={R.successDark}
                bg={R.successSoft}
              />
              <HighlightPill
                icon={<Target size={18} color={R.primary} strokeWidth={2.2} />}
                label="Accuracy"
                value={`${accuracy.toFixed(0)}%`}
                tint={R.primary}
                bg={R.primarySoft}
              />
            </View>

            {/* ── Tabs ── */}
            <View style={s.segments}>
              {(['overview', 'detailed'] as const).map((tab) => {
                const on = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[s.segment, on && s.segmentOn]}
                    onPress={() => onTabChange(tab)}
                    activeOpacity={0.85}
                  >
                    {on ? (
                      <LinearGradient colors={[...R.ctaGrad]} style={s.segmentGrad}>
                        <Text style={s.segmentTxtOn}>
                          {tab === 'overview' ? 'Summary' : 'Deep Dive'}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <Text style={s.segmentTxt}>
                        {tab === 'overview' ? 'Summary' : 'Deep Dive'}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {activeTab === 'overview' && (
              <>
                {/* Rank & prize banner */}
                <LinearGradient colors={[...R.goldGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.rankBanner}>
                  <View style={s.rankBannerLeft}>
                    <Text style={s.rankBannerLbl}>Leaderboard Rank</Text>
                    <Text style={s.rankBannerNum}>#{result.currentRank}</Text>
                    <Text style={s.rankBannerSub}>
                      out of {result.totalParticipants ?? '—'} participants
                    </Text>
                  </View>
                  <View style={s.rankBannerDiv} />
                  <View style={s.rankBannerRight}>
                    <Text style={[s.rankBannerLbl, { color: '#065F46' }]}>Prize Earned</Text>
                    <Text style={[s.rankBannerNum, { color: '#047857', fontSize: 24 }]}>
                      ₹{result.prizeAmount?.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[s.rankBannerSub, { color: '#059669' }]}>Credited to wallet</Text>
                  </View>
                </LinearGradient>

                {percentile != null && (
                  <GlassCard style={s.mb}>
                    <View style={s.percentileInner}>
                      <View style={s.percentileLeft}>
                        <BarChart3 size={22} color={R.primary} strokeWidth={2.2} />
                        <View>
                          <Text style={s.percentileLbl}>Percentile Rank</Text>
                          <Text style={s.percentileHint}>
                            Better than {percentile.toFixed(0)}% students
                          </Text>
                        </View>
                      </View>
                      <View style={s.percentileBadge}>
                        <Text style={s.percentileNum}>{percentile.toFixed(0)}</Text>
                        <Text style={s.percentileTh}>th</Text>
                      </View>
                    </View>
                  </GlassCard>
                )}

                {/* Answer breakdown */}
                <GlassCard style={s.mb}>
                  <Text style={s.blockTitle}>Answer Breakdown</Text>
                  <Text style={s.blockSub}>
                    {result.correctAnswers + result.wrongAnswers} of {result.totalQuestions} questions attempted
                  </Text>
                  <AnswerBar
                    correct={result.correctAnswers}
                    wrong={result.wrongAnswers}
                    skipped={result.unattempted}
                    total={result.totalQuestions}
                  />
                  <View style={s.miniGrid}>
                    <MiniStat icon={<CheckCircle2 size={16} color={R.success} />} val={result.correctAnswers} lbl="Correct" color={R.successSoft} />
                    <MiniStat icon={<XCircle size={16} color={R.error} />} val={result.wrongAnswers} lbl="Wrong" color={R.errorSoft} />
                    <MiniStat icon={<Clock size={16} color={R.warn} />} val={`${result.timeTakenMinutes}m`} lbl="Time" color={R.warnSoft} />
                  </View>
                </GlassCard>

                {(result.averageScore !== undefined || result.topScore !== undefined) && (
                  <GlassCard style={s.mb}>
                    <Text style={s.blockTitle}>Class Comparison</Text>
                    <CompareRow label="Your score" value={result.score} color={R.primary} />
                    {result.averageScore !== undefined && (
                      <CompareRow label="Class average" value={result.averageScore} color={R.warn} />
                    )}
                    {result.topScore !== undefined && (
                      <CompareRow label="Top score" value={result.topScore} color={R.success} />
                    )}
                  </GlassCard>
                )}

                {achievements.length > 0 && (
                  <View style={s.mb}>
                    <Text style={s.blockTitle}>Achievements Unlocked</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.achScroll}>
                      {achievements.map((a) => (
                        <LinearGradient key={a.label} colors={[...a.grad]} style={s.achCard}>
                          <Text style={s.achEmoji}>{a.emoji}</Text>
                          <Text style={s.achLbl}>{a.label}</Text>
                        </LinearGradient>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {children}
              </>
            )}

            {activeTab === 'detailed' && (
              <>
                <GlassCard style={s.mb}>
                  <Text style={s.blockTitle}>Performance Metrics</Text>
                  <View style={s.metricsRow}>
                    <MetricDonut label="Accuracy" pct={accuracy} colors={['#34D399', '#059669']} />
                    <MetricDonut label="Completion" pct={completion} colors={['#60A5FA', '#2563EB']} />
                    <MetricDonut
                      label="Time used"
                      pct={result.examDuration ? (result.timeTakenMinutes / result.examDuration) * 100 : 0}
                      colors={['#FBBF24', '#D97706']}
                    />
                  </View>
                </GlassCard>

                <GlassCard style={s.mb}>
                  <View style={s.timeHead}>
                    <Clock size={20} color={R.warn} strokeWidth={2.2} />
                    <Text style={s.blockTitle}>Time Analytics</Text>
                  </View>
                  <View style={s.timeGrid}>
                    <TimeBox label="Time used" value={result.timeTakenFormatted} />
                    <TimeBox label="Total allowed" value={`${result.examDuration} min`} />
                    <TimeBox
                      label="Per question"
                      value={`${(result.timeTakenMinutes / Math.max(result.totalQuestions, 1)).toFixed(1)} min`}
                    />
                  </View>
                  <View style={s.timeTrack}>
                    <LinearGradient
                      colors={['#FBBF24', '#EA580C']}
                      style={[
                        s.timeFill,
                        {
                          width: `${Math.min(100, (result.timeTakenMinutes / Math.max(result.examDuration, 1)) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </GlassCard>

                <GlassCard>
                  <Text style={s.blockTitle}>Question Distribution</Text>
                  <View style={s.distRow}>
                    <DistStat count={result.correctAnswers} label="Correct" grad={['#6EE7B7', '#059669']} />
                    <DistStat count={result.wrongAnswers} label="Wrong" grad={['#FCA5A5', '#DC2626']} />
                    <DistStat count={result.unattempted} label="Skipped" grad={['#CBD5E1', '#64748B']} />
                  </View>
                </GlassCard>
              </>
            )}
          </Animated.View>
        </ScrollView>

        {/* Bottom dock */}
        <View style={[s.dock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <LinearGradient colors={['rgba(255,255,255,0)', '#F8FAFC', '#F4F7FC']} style={s.dockFade} pointerEvents="none" />
          <View style={s.dockRow}>
            <TouchableOpacity style={s.dockSide} onPress={onHome} activeOpacity={0.8}>
              <Home size={20} color={R.inkSoft} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={s.dockMain} onPress={onCertificate} activeOpacity={0.9}>
              <LinearGradient colors={[...R.certGrad]} style={s.dockMainGrad}>
                <Ionicons name="ribbon" size={20} color="#FFF" />
                <Text style={s.dockMainTxt}>View Certificate</Text>
                <ChevronRight size={18} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={s.dockSide} onPress={onShare} activeOpacity={0.8}>
              <Share2 size={20} color={R.primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function MiniStat({
  icon,
  val,
  lbl,
  color,
}: {
  icon: React.ReactNode;
  val: string | number;
  lbl: string;
  color: string;
}) {
  return (
    <View style={[s.miniStat, { backgroundColor: color }]}>
      {icon}
      <Text style={s.miniVal}>{val}</Text>
      <Text style={s.miniLbl}>{lbl}</Text>
    </View>
  );
}

function CompareRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={s.compareRow}>
      <Text style={s.compareLbl}>{label}</Text>
      <View style={s.compareTrack}>
        <View style={[s.compareFill, { width: `${Math.min(100, value)}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.comparePct}>{value}%</Text>
    </View>
  );
}

function MetricDonut({
  label,
  pct,
  colors,
}: {
  label: string;
  pct: number;
  colors: [string, string];
}) {
  return (
    <View style={s.metricItem}>
      <LinearGradient colors={colors} style={s.metricCircle}>
        <Text style={s.metricPct}>{Math.round(pct)}%</Text>
      </LinearGradient>
      <Text style={s.metricLbl}>{label}</Text>
    </View>
  );
}

function TimeBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.timeBox}>
      <Text style={s.timeBoxVal}>{value}</Text>
      <Text style={s.timeBoxLbl}>{label}</Text>
    </View>
  );
}

function DistStat({
  count,
  label,
  grad,
}: {
  count: number;
  label: string;
  grad: [string, string];
}) {
  return (
    <View style={s.distItem}>
      <LinearGradient colors={grad} style={s.distCircle}>
        <Text style={s.distCount}>{count}</Text>
      </LinearGradient>
      <Text style={s.distLbl}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: PAD },

  hero: {
    marginHorizontal: -PAD,
    paddingHorizontal: PAD + 4,
    paddingTop: 8,
    paddingBottom: 56,
    overflow: 'hidden',
  },
  heroGlow1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99,102,241,0.25)',
    top: -80,
    right: -60,
  },
  heroGlow2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59,130,246,0.2)',
    bottom: -30,
    left: -40,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  heroTagTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: '#A5B4FC',
    letterSpacing: 1.2,
  },
  heroExam: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 6,
  },
  heroWhen: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },

  scoreCard: {
    marginTop: -44,
    marginBottom: 14,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 2,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  scoreAccentBar: { height: 4, width: '100%' },
  scoreCardBody: { padding: 18, alignItems: 'center' },
  scoreCardLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: R.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreMain: { flexDirection: 'row', alignItems: 'flex-end' },
  scoreBig: {
    fontFamily: FontFamily.extraBold,
    fontSize: 56,
    lineHeight: 58,
  },
  scoreUnit: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: R.muted,
    marginBottom: 10,
    marginLeft: 2,
  },
  perfBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  perfBadgeTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
  },
  scoreMsg: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: R.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
  },

  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    flex: 1,
    backgroundColor: R.card,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: R.border,
  },
  pillIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pillVal: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: R.ink,
  },
  pillLbl: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: R.muted,
    marginTop: 2,
  },

  segments: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  segment: { flex: 1, borderRadius: 11, overflow: 'hidden' },
  segmentOn: {},
  segmentGrad: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  segmentTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: R.muted,
    textAlign: 'center',
    paddingVertical: 10,
  },
  segmentTxtOn: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: '#FFF',
  },

  mb: { marginBottom: 12 },

  glassCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: R.border,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },

  blockTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: R.ink,
    marginBottom: 4,
  },
  blockSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: R.muted,
    marginBottom: 14,
  },

  rankBanner: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  rankBannerLeft: { flex: 1 },
  rankBannerRight: { flex: 1, alignItems: 'flex-end' },
  rankBannerDiv: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 12,
  },
  rankBannerLbl: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#92400E',
    marginBottom: 4,
  },
  rankBannerNum: {
    fontFamily: FontFamily.extraBold,
    fontSize: 30,
    color: '#78350F',
  },
  rankBannerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },

  percentileInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  percentileLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  percentileLbl: { fontFamily: FontFamily.semiBold, fontSize: 14, color: R.ink },
  percentileHint: { fontFamily: FontFamily.regular, fontSize: 11, color: R.muted, marginTop: 2 },
  percentileBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: R.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  percentileNum: {
    fontFamily: FontFamily.extraBold,
    fontSize: 28,
    color: R.primaryDark,
    lineHeight: 30,
  },
  percentileTh: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: R.primary,
    marginBottom: 4,
    marginLeft: 2,
  },

  barWrap: { marginBottom: 14 },
  barTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  barSeg: { height: '100%' },
  barLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontFamily: FontFamily.medium, fontSize: 11, color: R.muted },

  miniGrid: { flexDirection: 'row', gap: 8 },
  miniStat: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  miniVal: { fontFamily: FontFamily.bold, fontSize: 16, color: R.ink },
  miniLbl: { fontFamily: FontFamily.medium, fontSize: 10, color: R.muted },

  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  compareLbl: { fontFamily: FontFamily.medium, fontSize: 12, color: R.inkSoft, width: 90 },
  compareTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  compareFill: { height: '100%', borderRadius: 4 },
  comparePct: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: R.ink,
    width: 36,
    textAlign: 'right',
  },

  achScroll: { gap: 10, paddingVertical: 4 },
  achCard: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    minWidth: 110,
  },
  achEmoji: { fontSize: 28, marginBottom: 6 },
  achLbl: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#FFF',
    textAlign: 'center',
  },

  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  metricItem: { alignItems: 'center' },
  metricCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricPct: { fontFamily: FontFamily.extraBold, fontSize: 17, color: '#FFF' },
  metricLbl: { fontFamily: FontFamily.medium, fontSize: 11, color: R.muted },

  timeHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timeGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  timeBox: {
    flex: 1,
    backgroundColor: R.warnSoft,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  timeBoxVal: { fontFamily: FontFamily.bold, fontSize: 14, color: '#9A3412' },
  timeBoxLbl: { fontFamily: FontFamily.medium, fontSize: 10, color: '#C2410C', marginTop: 2 },
  timeTrack: {
    height: 8,
    backgroundColor: '#FED7AA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  timeFill: { height: '100%', borderRadius: 4 },

  distRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 },
  distItem: { alignItems: 'center' },
  distCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  distCount: { fontFamily: FontFamily.extraBold, fontSize: 22, color: '#FFF' },
  distLbl: { fontFamily: FontFamily.semiBold, fontSize: 12, color: R.muted },

  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: PAD,
    paddingTop: 8,
  },
  dockFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -28,
    height: 28,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: R.card,
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: R.border,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  dockSide: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: R.border,
  },
  dockMain: { flex: 1 },
  dockMainGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dockMainTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: '#FFF',
  },
});

import { apiFetchAuth } from '@/constants/api';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  Clock,
  ExternalLink,
  FileText,
  Hourglass,
  Sparkles,
} from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 16;
const TAB_BAR_PADDING = 88;

const C = {
  bg: ['#EDE9FE', '#F5F3FF', '#FAFAFF'] as const,
  primary: '#6344D4',
  primaryLight: '#8E78E7',
  violet: '#7C3AED',
  ink: '#0F0A1E',
  muted: '#64748B',
  card: '#FFFFFF',
  border: '#E8E8F0',
  heroGrad: ['#7C3AED', '#6366F1', '#60A5FA', '#38BDF8'] as const,
  ctaGrad: ['#8E78E7', '#6344D4', '#5546C9'] as const,
};

type ExamNotification = {
  id: string;
  title: string;
  description: string;
  year: number;
  month: number;
  applyLastDate: string;
  applyLink: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_THEME = {
  active: { label: 'Active', colors: ['#34D399', '#10B981'] as const, bg: '#ECFDF5', text: '#059669' },
  urgent: { label: 'Urgent', colors: ['#FBBF24', '#F59E0B'] as const, bg: '#FFFBEB', text: '#D97706' },
  expired: { label: 'Expired', colors: ['#F87171', '#EF4444'] as const, bg: '#FEF2F2', text: '#DC2626' },
};

function formatDate(dateString: string) {
  const d = new Date(dateString);
  const day = d.toLocaleString('default', { weekday: 'short' });
  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}, ${day}`;
}

function formatDateShort(dateString: string) {
  const d = new Date(dateString);
  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
}

function getDaysRemaining(lastDate: string) {
  const diff = new Date(lastDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function useCountdown(targetIso: string | null) {
  const [parts, setParts] = useState({ days: 0, hrs: 0, mins: 0, secs: 0 });
  useEffect(() => {
    if (!targetIso) return;
    const tick = () => {
      const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
      setParts({
        days: Math.floor(diff / 86400000),
        hrs: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return parts;
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={st.countBox}>
      <Text style={st.countVal}>{String(value).padStart(2, '0')}</Text>
      <Text style={st.countLbl}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
  isFirst,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  isFirst?: boolean;
}) {
  return (
    <View style={[st.infoRow, !isFirst && st.infoRowBorder]}>
      <View style={st.infoIconWrap}>{icon}</View>
      <Text style={st.infoLabel}>{label}</Text>
      <Text style={[st.infoValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function ExamNotificationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [notification, setNotification] = useState<ExamNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotification = async () => {
      if (!id || !user?.token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetchAuth('/student/exam-notifications', user.token);
        if (response.ok) {
          const list = Array.isArray(response.data) ? response.data : [];
          const found = list.find((n: ExamNotification) => String(n.id) === String(id));
          setNotification(found || null);
          if (!found) setError('Notification not found.');
        } else {
          setError(response?.data?.message || 'Failed to load notification.');
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load notification.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotification();
  }, [id, user?.token]);

  const countdown = useCountdown(notification?.applyLastDate ?? null);

  if (loading) {
    return (
      <LinearGradient colors={[...C.bg]} style={[st.centered, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={st.loadTxt}>Loading details…</Text>
      </LinearGradient>
    );
  }

  if (!notification) {
    return (
      <LinearGradient colors={[...C.bg]} style={[st.centered, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={st.errIcon}>
          <AlertCircle size={36} color="#EF4444" strokeWidth={2} />
        </View>
        <Text style={st.errTitle}>{error || 'No notification data.'}</Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.9}>
          <LinearGradient colors={[...C.ctaGrad]} style={st.backCta}>
            <ChevronLeft size={18} color="#FFF" strokeWidth={2.5} />
            <Text style={st.backCtaTxt}>Go Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const daysRemaining = getDaysRemaining(notification.applyLastDate);
  const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;
  const isExpired = daysRemaining < 0;
  const statusKey = isExpired ? 'expired' : isUrgent ? 'urgent' : 'active';
  const status = STATUS_THEME[statusKey];
  const canApply = daysRemaining >= 0 && !!notification.applyLink;

  const openApplyLink = () => {
    if (notification.applyLink) Linking.openURL(notification.applyLink);
  };

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={[...C.bg]} style={StyleSheet.absoluteFill} />
      <View style={st.orb1} />
      <View style={st.orb2} />

      <SafeAreaView style={st.safe} edges={['top']}>
        {/* Top bar */}
        <View style={st.topBar}>
          <TouchableOpacity style={st.iconBtn} onPress={() => router.back()} activeOpacity={0.88}>
            <ChevronLeft size={22} color={C.inkSoft} strokeWidth={2.5} />
          </TouchableOpacity>
          <LinearGradient colors={['#8E78E7', C.primary]} style={st.hubPill}>
            <FileText size={11} color="#FFF" strokeWidth={2.5} />
            <Text style={st.hubPillTxt}>EXAM DETAIL</Text>
          </LinearGradient>
          {canApply ? (
            <TouchableOpacity style={st.iconBtnApply} onPress={openApplyLink} activeOpacity={0.88}>
              <ExternalLink size={18} color="#FFF" strokeWidth={2.2} />
            </TouchableOpacity>
          ) : (
            <View style={st.iconBtnPlaceholder} />
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: TAB_BAR_PADDING + insets.bottom + 24 }}
        >
          {/* Hero */}
          <LinearGradient colors={['#C4B5FD', '#DDD6FE', '#E9D5FF']} style={st.heroBorder}>
            <LinearGradient colors={[...C.heroGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.9 }} style={st.heroCard}>
              <View style={st.heroShine} pointerEvents="none" />
              <View style={st.heroTopRow}>
                <View style={st.heroBadge}>
                  <Sparkles size={10} color={C.primary} strokeWidth={2.5} />
                  <Text style={st.heroBadgeTxt}>EXAM ALERT</Text>
                </View>
                <LinearGradient colors={[...status.colors]} style={st.statusPill}>
                  <Text style={st.statusPillTxt}>{status.label}</Text>
                </LinearGradient>
              </View>
              <Text style={st.heroTitle} numberOfLines={2}>{notification.title}</Text>
              <View style={st.heroMeta}>
                <Calendar size={12} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                <Text style={st.heroMetaTxt}>Apply by {formatDate(notification.applyLastDate)}</Text>
              </View>
              {!isExpired ? (
                <View style={st.countdownRow}>
                  <CountdownBox value={countdown.days} label="DAYS" />
                  <CountdownBox value={countdown.hrs} label="HRS" />
                  <CountdownBox value={countdown.mins} label="MIN" />
                  <CountdownBox value={countdown.secs} label="SEC" />
                </View>
              ) : (
                <View style={st.expiredBanner}>
                  <AlertCircle size={14} color="#FECACA" strokeWidth={2} />
                  <Text style={st.expiredTxt}>Application deadline has passed</Text>
                </View>
              )}
              <Image
                source={require('@/assets/images/icons/calendar.png')}
                style={st.heroArt}
                resizeMode="contain"
              />
            </LinearGradient>
          </LinearGradient>

          {/* Quick stats */}
          <LinearGradient colors={['#C4B5FD', '#DDD6FE', '#E9D5FF']} style={st.statsBorder}>
            <View style={st.statsCard}>
              <View style={st.statItem}>
                <Text style={[st.statVal, { color: status.text }]}>{isExpired ? '—' : daysRemaining}</Text>
                <Text style={st.statLbl}>Days Left</Text>
              </View>
              <View style={st.statDiv} />
              <View style={st.statItem}>
                <Text style={st.statVal}>{notification.month || '—'}</Text>
                <Text style={st.statLbl}>Month</Text>
              </View>
              <View style={st.statDiv} />
              <View style={st.statItem}>
                <Text style={st.statVal}>{notification.year || '—'}</Text>
                <Text style={st.statLbl}>Year</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Quick info */}
          <LinearGradient colors={['#E9E5FF', '#F3EEFF', '#FAF8FF']} style={st.sectionBorder}>
            <View style={st.sectionCard}>
              <Text style={st.sectionTitle}>Quick Info</Text>
              <InfoRow
                isFirst
                icon={<Calendar size={16} color={C.primary} strokeWidth={2} />}
                label="Last Date"
                value={formatDateShort(notification.applyLastDate)}
              />
              <InfoRow
                icon={<Clock size={16} color="#3B82F6" strokeWidth={2} />}
                label="Posted On"
                value={notification.createdAt ? formatDateShort(notification.createdAt) : '—'}
              />
              <InfoRow
                icon={<Hourglass size={16} color="#F59E0B" strokeWidth={2} />}
                label="Time Remaining"
                value={isExpired ? 'Expired' : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`}
                valueColor={status.text}
              />
            </View>
          </LinearGradient>

          {/* Description */}
          <LinearGradient colors={['#E9E5FF', '#F3EEFF', '#FAF8FF']} style={st.sectionBorder}>
            <View style={st.sectionCard}>
              <Text style={st.sectionTitle}>About This Exam</Text>
              <Text style={st.descText}>{notification.description || 'No additional details provided.'}</Text>
            </View>
          </LinearGradient>

          {/* Apply CTA */}
          {canApply ? (
            <TouchableOpacity onPress={openApplyLink} activeOpacity={0.92} style={st.applyWrap}>
              <LinearGradient colors={[...C.ctaGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.applyBtn}>
                <ExternalLink size={20} color="#FFF" strokeWidth={2.2} />
                <Text style={st.applyTxt}>{isUrgent ? 'Apply Now — Deadline Soon' : 'Apply Online'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={st.closedBox}>
              <AlertCircle size={18} color={C.muted} strokeWidth={2} />
              <Text style={st.closedTxt}>Online application is no longer available for this exam.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadTxt: { marginTop: 14, fontFamily: FontFamily.medium, fontSize: 15, color: C.primary },
  errIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errTitle: { fontFamily: FontFamily.semiBold, fontSize: 15, color: '#DC2626', textAlign: 'center', marginBottom: 20 },
  backCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
  },
  backCtaTxt: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFF' },
  orb1: {
    position: 'absolute',
    width: SCREEN_W * 0.65,
    height: SCREEN_W * 0.65,
    borderRadius: SCREEN_W,
    backgroundColor: 'rgba(142, 120, 231, 0.1)',
    top: -SCREEN_W * 0.15,
    right: -SCREEN_W * 0.2,
  },
  orb2: {
    position: 'absolute',
    width: SCREEN_W * 0.45,
    height: SCREEN_W * 0.45,
    borderRadius: SCREEN_W,
    backgroundColor: 'rgba(236, 72, 153, 0.06)',
    bottom: 80,
    left: -SCREEN_W * 0.12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    paddingTop: 6,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 }
      : { elevation: 2 }),
  },
  iconBtnApply: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPlaceholder: { width: 42 },
  hubPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  hubPillTxt: { fontFamily: FontFamily.bold, fontSize: 10, color: '#FFF', letterSpacing: 0.8 },
  heroBorder: { borderRadius: 20, padding: 1.5, marginBottom: 12 },
  heroCard: { borderRadius: 18.5, padding: 14, overflow: 'hidden', minHeight: 148 },
  heroShine: {
    position: 'absolute',
    top: -24,
    right: -16,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroBadgeTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: C.primary, letterSpacing: 0.6 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPillTxt: { fontFamily: FontFamily.bold, fontSize: 11, color: '#FFF' },
  heroTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 20,
    color: '#FFF',
    lineHeight: 26,
    marginBottom: 6,
    paddingRight: 72,
  },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  heroMetaTxt: { fontFamily: FontFamily.medium, fontSize: 11, color: 'rgba(255,255,255,0.9)' },
  countdownRow: { flexDirection: 'row', gap: 5 },
  countBox: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  countVal: { fontFamily: FontFamily.extraBold, fontSize: 13, color: C.ink },
  countLbl: { fontFamily: FontFamily.medium, fontSize: 7, color: C.muted, marginTop: 1 },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  expiredTxt: { fontFamily: FontFamily.semiBold, fontSize: 11, color: '#FECACA' },
  heroArt: { position: 'absolute', right: 10, bottom: 10, width: 58, height: 58, opacity: 0.9 },
  statsBorder: { borderRadius: 16, padding: 1.5, marginBottom: 12 },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14.5,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontFamily: FontFamily.extraBold, fontSize: 20, color: C.ink },
  statLbl: { fontFamily: FontFamily.medium, fontSize: 11, color: C.muted, marginTop: 2 },
  statDiv: { width: 1, backgroundColor: C.border, marginVertical: 4 },
  sectionBorder: { borderRadius: 16, padding: 1, marginBottom: 12 },
  sectionCard: {
    backgroundColor: C.card,
    borderRadius: 15,
    padding: 14,
  },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 15, color: C.ink, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontFamily: FontFamily.medium, fontSize: 13, color: C.muted, flex: 1 },
  infoValue: { fontFamily: FontFamily.bold, fontSize: 13, color: C.ink, maxWidth: SCREEN_W * 0.38 },
  descText: { fontFamily: FontFamily.regular, fontSize: 14, color: '#334155', lineHeight: 22 },
  applyWrap: { marginTop: 4, borderRadius: 18, overflow: 'hidden' },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#6344D4', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 12 }
      : { elevation: 6 }),
  },
  applyTxt: { fontFamily: FontFamily.bold, fontSize: 16, color: '#FFF' },
  closedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 4,
  },
  closedTxt: { fontFamily: FontFamily.medium, fontSize: 13, color: C.muted, flex: 1, lineHeight: 19 },
});

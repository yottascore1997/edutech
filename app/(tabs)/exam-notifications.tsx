import { apiFetchAuth } from '@/constants/api';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Bell,
  Bookmark,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  Grid3x3,
  Megaphone,
  Sparkles,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
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
  bg: '#FFFBF7',
  bgGrad: ['#FFFCF8', '#FFFBF7', '#FAF8F5'] as const,
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  ink: '#0F172A',
  inkSoft: '#1E3A8A',
  muted: '#64748B',
  card: '#FFFFFF',
  border: '#EDE8E3',
  sectionBg: '#EFF4FB',
  heroGrad: ['#1E40AF', '#2563EB', '#3B82F6', '#60A5FA'] as const,
  heroCta: ['#60A5FA', '#2563EB', '#1D4ED8'] as const,
  cardBorderGrad: ['#EEF2F8', '#F7F9FC', '#FFFCF8'] as const,
};

type FilterKey = 'all' | 'exam' | 'update' | 'reminder';

const FILTER_TABS: { key: FilterKey; label: string; icon: typeof Grid3x3; colors: readonly [string, string] }[] = [
  { key: 'all', label: 'All', icon: Grid3x3, colors: ['#60A5FA', '#2563EB'] },
  { key: 'exam', label: 'Exams', icon: FileText, colors: ['#60A5FA', '#3B82F6'] },
  { key: 'update', label: 'Updates', icon: Megaphone, colors: ['#34D399', '#10B981'] },
  { key: 'reminder', label: 'Reminders', icon: Bookmark, colors: ['#FBBF24', '#F59E0B'] },
];

const CARD_THEMES = [
  { dot: '#2563EB', iconBg: ['#DBEAFE', '#EFF6FF'] as const, iconColor: '#2563EB', Icon: Calendar },
  { dot: '#F59E0B', iconBg: ['#FEF3C7', '#FFFBEB'] as const, iconColor: '#D97706', Icon: Bookmark },
  { dot: '#3B82F6', iconBg: ['#DBEAFE', '#EFF6FF'] as const, iconColor: '#2563EB', Icon: FileText },
  { dot: '#10B981', iconBg: ['#D1FAE5', '#ECFDF5'] as const, iconColor: '#059669', Icon: Megaphone },
];

interface ExamNotification {
  id: string;
  title: string;
  description: string;
  year: number;
  month: number;
  applyLastDate: string;
  applyLink: string;
  createdAt: string;
  updatedAt: string;
  logoUrl?: string;
}

function getDaysRemaining(lastDate: string) {
  const diff = new Date(lastDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDateShort(dateString: string) {
  const d = new Date(dateString);
  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
}

function formatDateHero(dateString: string) {
  const d = new Date(dateString);
  const day = d.toLocaleString('default', { weekday: 'short' });
  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}, ${day}`;
}

function notifKind(n: ExamNotification): FilterKey {
  const t = `${n.title} ${n.description}`.toLowerCase();
  if (t.includes('update') || t.includes('syllabus') || t.includes('uploaded') || t.includes('important')) {
    return 'update';
  }
  const days = getDaysRemaining(n.applyLastDate);
  if (
    t.includes('deadline') ||
    t.includes('reminder') ||
    t.includes('last date') ||
    t.includes('form') ||
    (days >= 0 && days <= 14)
  ) {
    return 'reminder';
  }
  return 'exam';
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
  const v = String(value).padStart(2, '0');
  return (
    <View style={st.countBox}>
      <Text style={st.countVal}>{v}</Text>
      <Text style={st.countLbl}>{label}</Text>
    </View>
  );
}

function HeroUpcomingCard({
  item,
  onViewDetails,
}: {
  item: ExamNotification | null;
  onViewDetails: () => void;
}) {
  const countdown = useCountdown(item?.applyLastDate ?? null);
  const title = item?.title ?? 'Upcoming Exam';
  const dateLine = item ? formatDateHero(item.applyLastDate) : 'New alerts coming soon';
  const daysLeft = item ? getDaysRemaining(item.applyLastDate) : null;

  return (
    <LinearGradient colors={['#93C5FD', '#BFDBFE', '#DBEAFE']} style={st.heroBorder}>
      <LinearGradient colors={[...C.heroGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.85 }} style={st.heroCard}>
        <View style={st.heroShine} pointerEvents="none" />
        <View style={st.heroTopRow}>
          <View style={st.heroBadge}>
            <Sparkles size={10} color={C.primary} strokeWidth={2.5} />
            <Text style={st.heroBadgeTxt}>UPCOMING</Text>
          </View>
          {daysLeft !== null && daysLeft >= 0 ? (
            <View style={st.heroUrgentPill}>
              <Text style={st.heroUrgentTxt}>{daysLeft === 0 ? 'Today' : `${daysLeft}d left`}</Text>
            </View>
          ) : null}
        </View>

        <View style={st.heroBody}>
          <View style={st.heroCopy}>
            <Text style={st.heroExamTitle} numberOfLines={1}>{title}</Text>
            <View style={st.heroMetaRow}>
              <Calendar size={11} color="rgba(255,255,255,0.85)" strokeWidth={2} />
              <Text style={st.heroMetaTxt} numberOfLines={1}>{dateLine}</Text>
              <Text style={st.heroMetaDot}>·</Text>
              <Clock size={11} color="rgba(255,255,255,0.85)" strokeWidth={2} />
              <Text style={st.heroMetaTxt}>Apply by deadline</Text>
            </View>
            <View style={st.countdownRow}>
              <CountdownBox value={countdown.days} label="DAYS" />
              <CountdownBox value={countdown.hrs} label="HRS" />
              <CountdownBox value={countdown.mins} label="MIN" />
              <CountdownBox value={countdown.secs} label="SEC" />
            </View>
          </View>
          <Image
            source={require('@/assets/images/icons/calendar.png')}
            style={st.heroCardArt}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity style={st.heroCtaWrap} onPress={onViewDetails} activeOpacity={0.92}>
          <LinearGradient colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.88)']} style={st.heroCtaBtn}>
            <Text style={st.heroCtaTxt}>View Details</Text>
            <ChevronRight size={14} color={C.primary} strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </LinearGradient>
  );
}

function FilterTabs({ active, onChange }: { active: FilterKey; onChange: (k: FilterKey) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filterRow}>
      {FILTER_TABS.map((tab) => {
        const isActive = active === tab.key;
        const Icon = tab.icon;
        return (
          <TouchableOpacity key={tab.key} onPress={() => onChange(tab.key)} activeOpacity={0.88}>
            {isActive ? (
              <LinearGradient colors={[...tab.colors]} style={st.filterChipActive}>
                <Icon size={15} color="#FFF" strokeWidth={2.2} />
                <Text style={st.filterTxtActive}>{tab.label}</Text>
              </LinearGradient>
            ) : (
              <View style={st.filterChip}>
                <View style={[st.filterIconWrap, { backgroundColor: `${tab.colors[1]}18` }]}>
                  <Icon size={15} color={tab.colors[1]} strokeWidth={2.2} />
                </View>
                <Text style={st.filterTxt}>{tab.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function NotificationRow({
  item,
  index,
  onPress,
}: {
  item: ExamNotification;
  index: number;
  onPress: () => void;
}) {
  const theme = CARD_THEMES[index % CARD_THEMES.length];
  const IconComp = theme.Icon;
  const days = getDaysRemaining(item.applyLastDate);
  const kind = notifKind(item);
  const footer =
    kind === 'reminder'
      ? `Last date · ${formatDateShort(item.applyLastDate)}`
      : `${formatDateShort(item.applyLastDate)} · ${days >= 0 ? `${days} days left` : 'Expired'}`;
  const urgent = days >= 0 && days <= 7;

  return (
    <LinearGradient colors={[...C.cardBorderGrad]} style={st.listCardBorder}>
      <TouchableOpacity style={st.listCard} onPress={onPress} activeOpacity={0.88}>
        <View style={[st.statusDot, { backgroundColor: theme.dot }]} />
        <LinearGradient colors={[...theme.iconBg]} style={st.listIcon}>
          <IconComp size={18} color={theme.iconColor} strokeWidth={2.2} />
        </LinearGradient>
        <View style={st.listBody}>
          <View style={st.listTitleRow}>
            <Text style={st.listTitle} numberOfLines={1}>{item.title}</Text>
            {urgent ? (
              <View style={st.listUrgent}>
                <Text style={st.listUrgentTxt}>Urgent</Text>
              </View>
            ) : null}
          </View>
          <Text style={st.listDesc} numberOfLines={2}>{item.description}</Text>
          <View style={st.listFooter}>
            <Calendar size={11} color={C.primaryLight} strokeWidth={2} />
            <Text style={st.listFooterTxt}>{footer}</Text>
          </View>
        </View>
        <View style={st.listChev}>
          <ChevronRight size={16} color={C.primary} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );
}

export default function ExamNotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedCategory: globalCategory } = useCategory();
  const [notifications, setNotifications] = useState<ExamNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const fetchNotifications = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await apiFetchAuth('/student/exam-notifications', user.token);
      if (response.ok) {
        setNotifications(Array.isArray(response.data) ? response.data : []);
        setError(null);
      } else {
        setError(response.data?.message || 'Failed to fetch notifications');
      }
    } catch {
      setError('Failed to fetch exam notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const sorted = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const dA = getDaysRemaining(a.applyLastDate);
      const dB = getDaysRemaining(b.applyLastDate);
      const pA = dA < 0 ? 3 : dA <= 7 ? 1 : 2;
      const pB = dB < 0 ? 3 : dB <= 7 ? 1 : 2;
      if (pA !== pB) return pA - pB;
      return dA - dB;
    });
  }, [notifications]);

  const filtered = useMemo(() => {
    let list = sorted;
    if (activeFilter !== 'all') {
      list = list.filter((n) => notifKind(n) === activeFilter);
    }
    if (globalCategory) {
      const c = globalCategory.toLowerCase();
      list = list.filter(
        (n) => n.title.toLowerCase().includes(c) || n.description?.toLowerCase().includes(c)
      );
    }
    return list;
  }, [sorted, activeFilter, globalCategory]);

  const heroItem = useMemo(() => {
    const active = sorted.filter((n) => getDaysRemaining(n.applyLastDate) >= 0);
    return active[0] ?? sorted[0] ?? null;
  }, [sorted]);

  const handleNotificationPress = (notification: ExamNotification) => {
    router.push(`/exam-notification/${notification.id}` as any);
  };

  const renderHeader = () => (
    <>
      <View style={st.sectionPanel}>
        <View style={st.titleCard}>
          <View style={st.titleCopy}>
            <Text style={st.titleMain}>
              Exam <Text style={st.titleAccent}>Notifications</Text>
            </Text>
            <Text style={st.titleSub} numberOfLines={2}>
              Stay updated with exams, deadlines & alerts
            </Text>
          </View>
          <Image
            source={require('@/assets/images/exam-notifications-hero.jpg')}
            style={st.titleHeroImg}
            resizeMode="contain"
          />
        </View>
      </View>

      <HeroUpcomingCard
        item={heroItem}
        onViewDetails={() => {
          if (heroItem) handleNotificationPress(heroItem);
        }}
      />

      <FilterTabs active={activeFilter} onChange={setActiveFilter} />

      {error ? (
        <TouchableOpacity style={st.errBox} onPress={fetchNotifications} activeOpacity={0.9}>
          <Text style={st.errTxt}>{error} — Tap to retry</Text>
        </TouchableOpacity>
      ) : null}

      <View style={st.sectionRow}>
        <Text style={st.sectionLbl}>Recent Alerts</Text>
        <View style={st.sectionCount}>
          <Text style={st.sectionCountTxt}>{filtered.length}</Text>
        </View>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={st.empty}>
      <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={st.emptyIcon}>
        <Bell size={32} color={C.primary} strokeWidth={2} />
      </LinearGradient>
      <Text style={st.emptyTitle}>No notifications yet</Text>
      <Text style={st.emptyMsg}>
        When new exam dates or application deadlines are added, they&apos;ll show up here.
      </Text>
    </View>
  );

  if (loading && !notifications.length) {
    return (
      <View style={[st.centered, { backgroundColor: C.bg, paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={st.loadTxt}>Loading exam notifications…</Text>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={[...C.bgGrad]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={st.safe} edges={[]}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <NotificationRow item={item} index={index} onPress={() => handleNotificationPress(item)} />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 2, paddingHorizontal: PAD, paddingBottom: TAB_BAR_PADDING + insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
          }
        />
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadTxt: { marginTop: 14, fontFamily: FontFamily.medium, fontSize: 15, color: C.primary },
  sectionPanel: {
    marginBottom: 12,
    backgroundColor: C.sectionBg,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCE4F0',
  },
  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  titleCopy: { flex: 1 },
  titleMain: { fontFamily: FontFamily.extraBold, fontSize: 22, color: C.ink, lineHeight: 28 },
  titleAccent: { color: C.primary },
  titleSub: { fontFamily: FontFamily.regular, fontSize: 12, color: C.muted, lineHeight: 17, marginTop: 4 },
  titleHeroImg: { width: 80, height: 72 },
  heroBorder: { borderRadius: 20, padding: 1.5, marginBottom: 14 },
  heroCard: {
    borderRadius: 18.5,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 }
      : { elevation: 6 }),
  },
  heroShine: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  heroBadgeTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: C.primary, letterSpacing: 0.8 },
  heroUrgentPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  heroUrgentTxt: { fontFamily: FontFamily.semiBold, fontSize: 10, color: '#FFF' },
  heroBody: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  heroCopy: { flex: 1, paddingRight: 4 },
  heroCardArt: { width: 56, height: 56, opacity: 0.92, marginBottom: 2 },
  heroExamTitle: { fontFamily: FontFamily.extraBold, fontSize: 17, color: '#FFF', marginBottom: 4 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, flexWrap: 'nowrap' },
  heroMetaTxt: { fontFamily: FontFamily.medium, fontSize: 10, color: 'rgba(255,255,255,0.88)', maxWidth: SCREEN_W * 0.32 },
  heroMetaDot: { fontFamily: FontFamily.bold, fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  countdownRow: { flexDirection: 'row', gap: 5 },
  countBox: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 4,
    minWidth: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  countVal: { fontFamily: FontFamily.extraBold, fontSize: 13, color: C.ink },
  countLbl: { fontFamily: FontFamily.medium, fontSize: 7, color: C.muted, marginTop: 1, letterSpacing: 0.4 },
  heroCtaWrap: { alignSelf: 'flex-end', marginTop: 8 },
  heroCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 2,
  },
  heroCtaTxt: { fontFamily: FontFamily.bold, fontSize: 12, color: C.primary },
  filterRow: { gap: 8, paddingBottom: 14, paddingRight: 8 },
  filterChipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }
      : { elevation: 4 }),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterIconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterTxt: { fontFamily: FontFamily.semiBold, fontSize: 13, color: C.ink },
  filterTxtActive: { fontFamily: FontFamily.semiBold, fontSize: 13, color: '#FFF' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionLbl: { fontFamily: FontFamily.bold, fontSize: 15, color: C.ink },
  sectionCount: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionCountTxt: { fontFamily: FontFamily.bold, fontSize: 12, color: C.primary },
  listCardBorder: { borderRadius: 16, padding: 1, marginBottom: 10 },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 15,
    padding: 12,
    gap: 8,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  listIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listBody: { flex: 1 },
  listTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  listTitle: { fontFamily: FontFamily.bold, fontSize: 14, color: C.ink, flex: 1 },
  listUrgent: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  listUrgentTxt: { fontFamily: FontFamily.bold, fontSize: 9, color: '#D97706' },
  listChev: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listDesc: { fontFamily: FontFamily.regular, fontSize: 12, color: C.muted, lineHeight: 17, marginBottom: 6 },
  listFooter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  listFooterTxt: { fontFamily: FontFamily.medium, fontSize: 11, color: C.muted },
  errBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errTxt: { fontFamily: FontFamily.medium, fontSize: 13, color: '#DC2626' },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: C.ink, marginBottom: 8 },
  emptyMsg: { fontFamily: FontFamily.regular, fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21 },
});

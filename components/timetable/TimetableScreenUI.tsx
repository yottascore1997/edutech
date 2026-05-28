import { TimetableTheme, SUBJECT_ICON_COLORS } from '@/constants/TimetableTheme';
import { FontFamily } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, ChevronLeft, ChevronRight, Clock, MoreVertical, Plus, Trophy } from 'lucide-react-native';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 16;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_COLORS = ['#EF4444', '#64748B', '#64748B', '#64748B', '#64748B', '#64748B', '#3B82F6'];

export type TimetableSlot = {
  id?: string;
  _id?: string;
  subject?: string;
  startTime: string;
  endTime: string;
};

type Props = {
  fadeAnim: Animated.Value;
  scrollRef: React.RefObject<ScrollView | null>;
  scheduleSectionY: React.MutableRefObject<number>;
  currentMonth: Date;
  calendarDays: Date[];
  selectedDateSlots: TimetableSlot[];
  scheduleTitle: string;
  completedTodayCount: number;
  studyHoursToday: number;
  refreshing: boolean;
  isToday: (d: Date) => boolean;
  isSelectedDate: (d: Date) => boolean;
  hasEvents: (d: Date) => boolean;
  formatTime: (s: string) => string;
  getSlotProgress: (start: string, end: string) => number;
  getSlotStatus: (start: string, end: string) => 'upcoming' | 'in_progress' | 'completed';
  onRefresh: () => void;
  onAddStudy: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (d: Date) => void;
  onScrollToSchedule: () => void;
  onSlotMenu: (slot: TimetableSlot) => void;
};

function subjectIcon(subject: string): keyof typeof Ionicons.glyphMap {
  const s = subject.toLowerCase();
  if (s.includes('math')) return 'calculator';
  if (s.includes('physics')) return 'nuclear';
  if (s.includes('chemistry')) return 'flask';
  if (s.includes('biology')) return 'leaf';
  if (s.includes('english')) return 'book';
  if (s.includes('code')) return 'code-slash';
  return 'school';
}

function StatusPill({ status }: { status: 'upcoming' | 'in_progress' | 'completed' }) {
  const cfg = {
    in_progress: { bg: TimetableTheme.inProgressBg, color: TimetableTheme.inProgressText, label: 'In Progress' },
    completed: { bg: TimetableTheme.completedBg, color: TimetableTheme.completedText, label: 'Completed' },
    upcoming: { bg: TimetableTheme.upcomingBg, color: TimetableTheme.upcomingText, label: 'Upcoming' },
  }[status];
  return (
    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

export default function TimetableScreenUI({
  fadeAnim,
  scrollRef,
  scheduleSectionY,
  currentMonth,
  calendarDays,
  selectedDateSlots,
  scheduleTitle,
  completedTodayCount,
  studyHoursToday,
  refreshing,
  isToday,
  isSelectedDate,
  hasEvents,
  formatTime,
  getSlotProgress,
  getSlotStatus,
  onRefresh,
  onAddStudy,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onScrollToSchedule,
  onSlotMenu,
}: Props) {
  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TimetableTheme.primary} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ── Hero (light purple-blue, mockup) ── */}
          <View style={styles.heroWrap}>
            <LinearGradient
              colors={['#0F172A', '#1E3A8A', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.heroCard}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroLeft}>
                  <View style={styles.heroTopRow}>
                    <View style={styles.heroTitleCol}>
                      <View style={styles.heroBadge}>
                        <View style={styles.heroBadgeDot} />
                        <Text style={styles.heroBadgeTxt}>STUDY PLAN</Text>
                      </View>
                      <Text style={styles.heroTitle} numberOfLines={1}>
                        Timetable <Text style={styles.heroTitleAccent}>Pro</Text>
                      </Text>
                      <Text style={styles.heroTagline} numberOfLines={1}>
                        Plan daily blocks · Stay consistent
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.heroAddBtn} onPress={onAddStudy} activeOpacity={0.9}>
                      <LinearGradient colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.12)']} style={styles.heroAddBtnGrad}>
                        <Plus size={16} color="#FFFFFF" strokeWidth={2.8} />
                        {Platform.OS === 'ios' && <Text style={styles.heroAddBtnText}>Add</Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.heroStatsRow}>
                    <View style={styles.heroStatPill}>
                      <View style={[styles.heroStatDot, { backgroundColor: '#34D399' }]} />
                      <Text style={styles.heroStatText} numberOfLines={1}>
                        <Text style={styles.heroStatNum}>{completedTodayCount}</Text> done today
                      </Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStatPill}>
                      <View style={[styles.heroStatDot, { backgroundColor: '#93C5FD' }]} />
                      <Text style={styles.heroStatText} numberOfLines={1}>
                        <Text style={styles.heroStatNum}>{studyHoursToday}</Text> hrs today
                      </Text>
                    </View>
                  </View>
                </View>
                <Image
                  source={require('../../assets/images/timetable-hero.jpg')}
                  style={styles.heroArt}
                  resizeMode="contain"
                />
              </View>
            </LinearGradient>
          </View>

          {/* ── Calendar (white card) ── */}
          <View style={styles.calendarCard}>
            <View style={styles.calHeader}>
              <TouchableOpacity style={styles.calNavBtn} onPress={onPrevMonth} activeOpacity={0.8}>
                <ChevronLeft size={20} color="#9CA3AF" strokeWidth={2.2} />
              </TouchableOpacity>
              <Text style={styles.calMonth}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity style={styles.calNavBtn} onPress={onNextMonth} activeOpacity={0.8}>
                <ChevronRight size={20} color="#9CA3AF" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            <View style={styles.calDayRow}>
              {DAY_LABELS.map((d, i) => (
                <Text key={d} style={[styles.calDayLabel, { color: DAY_COLORS[i] }]}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {calendarDays.map((date, idx) => {
                const inMonth = date.getMonth() === currentMonth.getMonth();
                const today = isToday(date);
                const selected = isSelectedDate(date) && !today;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.calCell}
                    onPress={() => onSelectDate(date)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.calDayBubble,
                        today && styles.calDayToday,
                        selected && styles.calDaySelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calDayNum,
                          !inMonth && styles.calDayNumFaded,
                          (today || selected) && styles.calDayNumActive,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                    {hasEvents(date) && !today && !selected && <View style={styles.calEventDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calFooter}>
              <View style={styles.calLegend}>
                <View style={styles.legendPair}>
                  <View style={[styles.legendDot, { backgroundColor: TimetableTheme.today }]} />
                  <Text style={styles.legendTxt}>Today</Text>
                </View>
                <View style={styles.legendPair}>
                  <View style={[styles.legendDot, { backgroundColor: TimetableTheme.selected }]} />
                  <Text style={styles.legendTxt}>Selected</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.viewFullBtn} onPress={onScrollToSchedule} activeOpacity={0.85}>
                <Calendar size={14} color={TimetableTheme.primary} strokeWidth={2} />
                <Text style={styles.viewFullTxt}>View Full Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Today's Schedule ── */}
          <View
            style={styles.scheduleBlock}
            onLayout={(e) => { scheduleSectionY.current = e.nativeEvent.layout.y; }}
          >
            <View style={styles.scheduleHeader}>
              <Image
                source={require('../../assets/images/icons/calendar.png')}
                style={styles.clipboardIcon}
                resizeMode="contain"
              />
              <View style={styles.scheduleHeadText}>
                <Text style={styles.scheduleTitle}>{scheduleTitle}</Text>
                <Text style={styles.scheduleSub}>Stay consistent, keep going! 🚀</Text>
              </View>
              <TouchableOpacity onPress={onAddStudy} activeOpacity={0.9}>
                <LinearGradient colors={[...TimetableTheme.addBtn]} style={styles.addStudyPill}>
                  <Plus size={14} color="#FFF" strokeWidth={2.5} />
                  <Text style={styles.addStudyLabel}>Add Study</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {selectedDateSlots.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="calendar-outline" size={44} color={TimetableTheme.primarySoft} />
                <Text style={styles.emptyTitle}>No study sessions yet</Text>
                <Text style={styles.emptyHint}>Tap Add Study to plan your day</Text>
              </View>
            ) : (
              selectedDateSlots.map((slot, index) => {
                const status = getSlotStatus(slot.startTime, slot.endTime);
                const pct = status === 'completed' ? 100 : Math.max(getSlotProgress(slot.startTime, slot.endTime), 4);
                const iconColors = SUBJECT_ICON_COLORS[index % SUBJECT_ICON_COLORS.length];
                const isMath = (slot.subject || '').toLowerCase().includes('math');

                return (
                  <View key={slot.id || slot._id || index} style={styles.subjectCard}>
                    <LinearGradient
                      colors={isMath ? [...TimetableTheme.mathIcon] : iconColors}
                      style={styles.subjectIconBox}
                    >
                      <Ionicons name={subjectIcon(slot.subject || '')} size={24} color="#FFF" />
                    </LinearGradient>

                    <View style={styles.subjectMid}>
                      <View style={styles.subjectTopRow}>
                        <View style={styles.subjectTextCol}>
                          <Text style={styles.subjectName} numberOfLines={1}>
                            {slot.subject || 'Study Session'}
                          </Text>
                          <View style={styles.timeRow}>
                            <Clock size={12} color="#94A3B8" strokeWidth={2} />
                            <Text style={styles.timeText}>
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </Text>
                          </View>
                        </View>
                        <StatusPill status={status} />
                        <TouchableOpacity onPress={() => onSlotMenu(slot)} hitSlop={10} style={styles.menuBtn}>
                          <MoreVertical size={18} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.progressTrack}>
                        <LinearGradient
                          colors={[...TimetableTheme.progress]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressBar, { width: `${pct}%` }]}
                        />
                      </View>
                      <Text style={styles.progressLabel}>{pct}% Complete</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* ── Motivation (pink-orange gradient) ── */}
          <LinearGradient
            colors={[...TimetableTheme.motivationGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.motivationCard}
          >
            <View style={styles.motivationLeft}>
              <Text style={styles.motivationHead}>Keep it up! 💪</Text>
              <Text style={styles.motivationLine}>Consistently today, success tomorrow.</Text>
              <View style={styles.motivationStats}>
                <Text style={styles.motivationStat}>
                  <Text style={styles.motivationStatNum}>{completedTodayCount}</Text> Tasks Done
                </Text>
                <View style={styles.motivationDivider} />
                <Text style={styles.motivationStat}>
                  <Text style={styles.motivationStatNum}>{studyHoursToday.toFixed(1)}</Text> Study Hours
                </Text>
              </View>
            </View>
            <View style={styles.motivationTrophy}>
              <LinearGradient colors={['#FDE68A', '#F59E0B']} style={styles.motivationTrophyBadge}>
                <Trophy size={34} color="#1C1917" strokeWidth={2.4} />
              </LinearGradient>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const softShadow = Platform.select({
  ios: {
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  android: { elevation: 4 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: TimetableTheme.screenBg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 2 : 8,
    paddingBottom: Platform.OS === 'ios' ? 120 : 116,
  },

  heroWrap: { marginHorizontal: PAD, marginBottom: Platform.OS === 'android' ? 10 : 14 },
  heroCard: {
    borderRadius: 20,
    padding: Platform.OS === 'android' ? 10 : 14,
    paddingRight: 8,
    minHeight: Platform.OS === 'android' ? 108 : 130,
    overflow: 'hidden',
    ...softShadow,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 6,
  },
  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FCA5A5',
  },
  heroBadgeTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: '#FCA5A5',
    letterSpacing: 1,
  },
  heroContent: { flexDirection: 'row', alignItems: 'flex-end' },
  heroLeft: { flex: 1, paddingRight: 4, zIndex: 2 },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: Platform.OS === 'android' ? 6 : 8,
  },
  heroTitleCol: { flex: 1, minWidth: 0 },
  heroTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: Platform.OS === 'android' ? 20 : 23,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroTitleAccent: {
    color: '#93C5FD',
  },
  heroTagline: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  heroAddBtn: { borderRadius: 14, overflow: 'hidden', alignSelf: 'flex-start' },
  heroAddBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Platform.OS === 'android' ? 10 : 12,
    paddingVertical: Platform.OS === 'android' ? 7 : 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    ...Platform.select({
      ios: { shadowColor: '#6D28D9', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  heroAddBtnText: { fontFamily: FontFamily.bold, fontSize: 12, color: '#FFF' },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'android' ? 7 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: Platform.OS === 'android' ? 6 : 8,
  },
  heroStatPill: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
  heroStatDot: { width: 7, height: 7, borderRadius: 4 },
  heroStatText: { fontFamily: FontFamily.medium, fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  heroStatNum: { fontFamily: FontFamily.bold, color: '#FFFFFF' },
  heroStatDivider: { width: 1, height: 18, backgroundColor: 'rgba(15, 23, 42, 0.12)' },
  // heroHint removed to keep banner compact
  heroArt: {
    width: SCREEN_W * 0.36,
    height: Platform.OS === 'android' ? 72 : 90,
    marginRight: -4,
    marginBottom: -6,
  },

  calendarCard: {
    marginHorizontal: PAD,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: Platform.OS === 'android' ? 12 : 16,
    paddingHorizontal: Platform.OS === 'android' ? 12 : 14,
    marginBottom: Platform.OS === 'android' ? 12 : 18,
    ...softShadow,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Platform.OS === 'android' ? 10 : 14,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  calMonth: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: TimetableTheme.inkBlue,
  },
  calDayRow: { flexDirection: 'row', marginBottom: 8 },
  calDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'android' ? 3 : 5,
    minHeight: Platform.OS === 'android' ? 34 : 42,
  },
  calDayBubble: {
    width: Platform.OS === 'android' ? 30 : 34,
    height: Platform.OS === 'android' ? 30 : 34,
    borderRadius: Platform.OS === 'android' ? 15 : 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayToday: { backgroundColor: TimetableTheme.today },
  calDaySelected: { backgroundColor: TimetableTheme.selected },
  calDayNum: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: TimetableTheme.ink,
  },
  calDayNumFaded: { color: '#D1D5DB' },
  calDayNumActive: { fontFamily: FontFamily.bold, color: '#FFFFFF' },
  calEventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: TimetableTheme.primarySoft,
    marginTop: 2,
  },
  calFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'android' ? 8 : 12,
    paddingTop: Platform.OS === 'android' ? 8 : 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  calLegend: { flexDirection: 'row', gap: 14 },
  legendPair: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontFamily: FontFamily.medium, fontSize: 11, color: TimetableTheme.inkMuted },
  viewFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: TimetableTheme.primary,
    backgroundColor: 'transparent',
  },
  viewFullTxt: { fontFamily: FontFamily.semiBold, fontSize: 11, color: TimetableTheme.primary },

  scheduleBlock: { paddingHorizontal: PAD, marginBottom: Platform.OS === 'android' ? 10 : 16 },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Platform.OS === 'android' ? 10 : 14,
  },
  clipboardIcon: { width: Platform.OS === 'android' ? 34 : 42, height: Platform.OS === 'android' ? 34 : 42 },
  scheduleHeadText: { flex: 1 },
  scheduleTitle: {
    fontFamily: FontFamily.bold,
    fontSize: Platform.OS === 'android' ? 16 : 18,
    color: TimetableTheme.inkBlue,
  },
  scheduleSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: TimetableTheme.inkMuted,
    marginTop: 2,
  },
  addStudyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 6 : 8,
    borderRadius: 20,
  },
  addStudyLabel: { fontFamily: FontFamily.bold, fontSize: 11, color: '#FFF' },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Platform.OS === 'android' ? 22 : 32,
    alignItems: 'center',
    ...softShadow,
  },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: TimetableTheme.ink, marginTop: 12 },
  emptyHint: { fontFamily: FontFamily.regular, fontSize: 13, color: TimetableTheme.inkMuted, marginTop: 4 },

  subjectCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Platform.OS === 'android' ? 10 : 14,
    marginBottom: Platform.OS === 'android' ? 8 : 12,
    gap: 12,
    ...softShadow,
  },
  subjectIconBox: {
    width: Platform.OS === 'android' ? 42 : 52,
    height: Platform.OS === 'android' ? 42 : 52,
    borderRadius: Platform.OS === 'android' ? 12 : 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectMid: { flex: 1, minWidth: 0 },
  subjectTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  subjectTextCol: { flex: 1, minWidth: 0 },
  subjectName: {
    fontFamily: FontFamily.bold,
    fontSize: Platform.OS === 'android' ? 14 : 16,
    color: TimetableTheme.ink,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  timeText: { fontFamily: FontFamily.medium, fontSize: 12, color: TimetableTheme.inkMuted },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 2,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontFamily: FontFamily.semiBold, fontSize: 10 },
  menuBtn: { padding: 2, marginTop: 2 },
  progressTrack: {
    height: Platform.OS === 'android' ? 5 : 6,
    backgroundColor: '#EDE9FE',
    borderRadius: 6,
    marginTop: Platform.OS === 'android' ? 8 : 12,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', borderRadius: 6 },
  progressLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: TimetableTheme.inkMuted,
    textAlign: 'right',
    marginTop: 5,
  },

  motivationCard: {
    marginHorizontal: PAD,
    borderRadius: 18,
    padding: Platform.OS === 'android' ? 12 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    ...softShadow,
  },
  motivationLeft: { flex: 1 },
  motivationHead: { fontFamily: FontFamily.bold, fontSize: 15, color: TimetableTheme.ink },
  motivationLine: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: TimetableTheme.inkMuted,
    marginTop: 4,
    lineHeight: 17,
  },
  motivationStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 8 : 12,
    gap: 12,
  },
  motivationStat: { fontFamily: FontFamily.regular, fontSize: 12, color: TimetableTheme.inkMuted },
  motivationStatNum: { fontFamily: FontFamily.bold, color: TimetableTheme.ink },
  motivationDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  motivationTrophy: {
    width: Platform.OS === 'android' ? 62 : 76,
    height: Platform.OS === 'android' ? 62 : 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivationTrophyBadge: {
    width: Platform.OS === 'android' ? 56 : 68,
    height: Platform.OS === 'android' ? 56 : 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
});

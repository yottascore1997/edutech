import { FontFamily } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Radio, Search, Trophy, Users, X, Zap } from 'lucide-react-native';
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Keep theme local to avoid growing file count.
const T = {
  bg: '#FFFBF7',
  bgGrad: ['#FFFCF8', '#FFFBF7', '#EFF6FF'] as const,
  ink: '#0F172A',
  inkSoft: '#1E293B',
  muted: '#64748B',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primarySoft: '#DBEAFE',
  live: '#DC2626',
  liveSoft: '#FEE2E2',
  success: '#059669',
  successSoft: '#D1FAE5',
  gold: '#D97706',
  goldSoft: '#FEF3C7',
  card: '#FFFFFF',
  border: '#E8EEF8',
  heroGrad: ['#0F172A', '#1E3A8A', '#2563EB'] as const,
  ctaGrad: ['#60A5FA', '#2563EB', '#1D4ED8'] as const,
  accentGrad: ['#FBBF24', '#F59E0B', '#EA580C'] as const,
  chipGrad: ['#EFF6FF', '#DBEAFE'] as const,
  statBlue: ['#60A5FA', '#2563EB'] as const,
  statRed: ['#F87171', '#DC2626'] as const,
  statGreen: ['#34D399', '#059669'] as const,
} as const;

type Props = {
  filteredExams: any[];
  joinedCount: number;
  remainingTime: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (cat: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  renderExamCard: ({ item }: { item: any }) => React.ReactElement;
};

function StatChip({
  icon,
  value,
  label,
  colors,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  colors: readonly [string, string, ...string[]];
}) {
  return (
    <View style={s.statChip}>
      <LinearGradient colors={colors} style={s.statChipIcon}>
        {icon}
      </LinearGradient>
      <Text style={s.statChipVal}>{value}</Text>
      <Text style={s.statChipLbl}>{label}</Text>
    </View>
  );
}

export default function ExamScreenUI({
  filteredExams,
  joinedCount,
  remainingTime,
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategorySelect,
  refreshing,
  onRefresh,
  renderExamCard,
}: Props) {
  const insets = useSafeAreaInsets();
  const liveCount = filteredExams.length;

  const emptyTitle = searchQuery.trim()
    ? 'No matching exams'
    : selectedCategory === 'all'
      ? 'No live exams right now'
      : selectedCategory === 'Uncategorized'
        ? 'No uncategorized exams'
        : `No ${selectedCategory} exams`;

  const emptySub = searchQuery.trim()
    ? `Nothing found for "${searchQuery}". Try another keyword.`
    : 'New live battles drop soon — pull down to refresh.';

  const listHeader = (
    <>
      {/* Hero */}
      <View style={s.heroWrap}>
        <LinearGradient colors={[...T.heroGrad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroGrad}>
          <View style={s.heroGlow} />
          <View style={s.heroContent}>
            <View style={s.heroBadge}>
              <Radio size={12} color="#FCA5A5" strokeWidth={2.5} />
              <Text style={s.heroBadgeTxt}>LIVE EXAMS</Text>
            </View>
            <Text style={s.heroTitle}>
              Compete.{'\n'}
              <Text style={s.heroAccent}>Win. Rank.</Text>
            </Text>
            <Text style={s.heroSub}>Join live battles · Earn prizes · Climb the leaderboard</Text>
          </View>
          <Image
            source={require('../../assets/images/exam-notifications-hero.jpg')}
            style={s.heroImg}
            resizeMode="contain"
          />
        </LinearGradient>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <StatChip
          icon={<Zap size={16} color="#FFF" strokeWidth={2.2} />}
          value={liveCount}
          label="Live Now"
          colors={T.statBlue}
        />
        <StatChip
          icon={<Users size={16} color="#FFF" strokeWidth={2.2} />}
          value={joinedCount}
          label="Joined"
          colors={T.statGreen}
        />
        <StatChip
          icon={<Clock size={16} color="#FFF" strokeWidth={2.2} />}
          value={remainingTime || '—'}
          label="Ends In"
          colors={T.statRed}
        />
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Search size={18} color={T.muted} strokeWidth={2} />
        <TextInput
          style={s.searchInput}
          placeholder="Search live exams..."
          placeholderTextColor={T.muted}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={8}>
            <X size={18} color={T.primary} strokeWidth={2.2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catScroll}
          style={s.catBar}
        >
          {['all', ...categories].map((cat) => {
            const on = selectedCategory === cat;
            const label = cat === 'all' ? 'All' : cat === 'Uncategorized' ? 'Other' : cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => onCategorySelect(cat)}
                activeOpacity={0.85}
                style={[s.catPill, on && s.catPillOn]}
              >
                {on ? (
                  <LinearGradient colors={[...T.ctaGrad]} style={s.catPillGrad}>
                    <Text style={s.catTxtOn}>{label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={s.catPillInner}>
                    <Text style={s.catTxt}>{label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Section label */}
      <View style={s.sectionHead}>
        <View style={s.sectionLeft}>
          <LinearGradient colors={[...T.accentGrad]} style={s.sectionIcon}>
            <Trophy size={16} color="#FFF" strokeWidth={2.2} />
          </LinearGradient>
          <View>
            <Text style={s.sectionTitle}>Live Battles</Text>
            <Text style={s.sectionSub}>{liveCount} exam{liveCount !== 1 ? 's' : ''} available</Text>
          </View>
        </View>
        {liveCount > 0 && (
          <View style={s.liveDotWrap}>
            <View style={s.liveDot} />
            <Text style={s.liveDotTxt}>LIVE</Text>
          </View>
        )}
      </View>
    </>
  );

  return (
    <View style={s.root}>
      <LinearGradient colors={[...T.bgGrad]} style={StyleSheet.absoluteFill} />

      {filteredExams.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={s.empty}>
              <LinearGradient colors={[...T.chipGrad]} style={s.emptyIcon}>
                <Ionicons name="flash-outline" size={40} color={T.primary} />
              </LinearGradient>
              <Text style={s.emptyTitle}>{emptyTitle}</Text>
              <Text style={s.emptySub}>{emptySub}</Text>
            </View>
          }
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredExams}
          renderItem={renderExamCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 4 },

  heroWrap: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  heroGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 126,
    paddingLeft: 18,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(96,165,250,0.2)',
    top: -50,
    right: 40,
  },
  heroContent: { flex: 1, zIndex: 1 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  heroBadgeTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: '#FCA5A5',
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#FFF',
    lineHeight: 24,
  },
  heroAccent: { color: '#93C5FD' },
  heroSub: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    lineHeight: 16,
    paddingRight: 8,
  },
  heroImg: {
    width: 88,
    height: 88,
    marginRight: 4,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statChip: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  statChipIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statChipVal: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: T.ink,
  },
  statChipLbl: {
    fontFamily: FontFamily.medium,
    fontSize: 8,
    color: T.muted,
    marginTop: 2,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: T.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: T.ink,
    padding: 0,
  },

  catBar: { marginBottom: 14, marginHorizontal: -16 },
  catScroll: { paddingHorizontal: 16, gap: 8 },
  catPill: { borderRadius: 20, overflow: 'hidden' },
  catPillOn: {},
  catPillGrad: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  catPillInner: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  catTxt: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: T.inkSoft,
  },
  catTxtOn: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: '#FFF',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: T.ink,
  },
  sectionSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: T.muted,
    marginTop: 1,
  },
  liveDotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: T.liveSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: T.live,
  },
  liveDotTxt: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: T.live,
    letterSpacing: 0.8,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: T.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: T.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
});

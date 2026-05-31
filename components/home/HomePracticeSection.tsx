import { apiFetchAuth, getImageUrl as getImageUrlFromApi } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, BookOpen, Target, Trophy } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const P = {
  grad: ['#059669', '#10B981', '#34D399'] as const,
  gradSoft: ['#ECFDF5', '#D1FAE5', '#FFFFFF'] as const,
  gradHeader: ['#064E3B', '#047857', '#10B981'] as const,
  primary: '#059669',
  primaryLight: '#10B981',
  soft: '#ECFDF5',
  softBorder: '#A7F3D0',
  ink: '#064E3B',
  muted: '#6B7280',
};

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  categoryLogoUrl?: string;
}

interface PracticeExam {
  id: string;
  title: string;
  category: string;
  attempted: boolean;
  score?: number;
  logoUrl?: string;
}

const STAT_ITEMS = [
  { key: 'attempted', icon: Target, color: '#059669', bg: '#D1FAE5' },
  { key: 'completed', icon: BookOpen, color: '#0284C7', bg: '#E0F2FE' },
  { key: 'progress', icon: ArrowRight, color: '#6344D4', bg: '#EDE9FE' },
  { key: 'score', icon: Trophy, color: '#EA580C', bg: '#FFEDD5' },
] as const;

export default function HomePracticeSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await apiFetchAuth('/student/practice-exams', user.token);
      if (response.ok && response.data) {
        const categoryMap = new Map<string, Category>();
        response.data.forEach((exam: any) => {
          if (!categoryMap.has(exam.category)) {
            categoryMap.set(exam.category, {
              id: exam.category.toLowerCase().replace(/\s+/g, '-'),
              name: exam.category,
              icon: 'book',
              color: P.primary,
              categoryLogoUrl: exam.categoryLogoUrl,
            });
          }
        });
        const cats = Array.from(categoryMap.values());
        setCategories(cats);
        if (cats.length > 0 && !selectedCategory) setSelectedCategory(cats[0].id);
        setExams(response.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    try {
      return getImageUrlFromApi(url);
    } catch {
      return null;
    }
  };

  const attempted = exams.filter((e) => e.attempted).length;
  const total = exams.length;
  const completion = total > 0 ? Math.round((attempted / total) * 100) : 0;
  const avgScore =
    exams.filter((e) => e.attempted && e.score != null).length > 0
      ? Math.round(
          exams.filter((e) => e.attempted && e.score != null).reduce((s, e) => s + (e.score || 0), 0) /
            exams.filter((e) => e.attempted && e.score != null).length
        )
      : 0;

  const statValues: Record<string, string> = {
    attempted: String(attempted),
    completed: String(attempted),
    progress: `${completion}%`,
    score: `${avgScore}%`,
  };
  const statLabels: Record<string, string> = {
    attempted: 'Attempted',
    completed: 'Completed',
    progress: 'Progress',
    score: 'Avg Score',
  };

  const selectedName = categories.find((c) => c.id === selectedCategory)?.name || '';
  const filtered = selectedName
    ? exams.filter((e) => e.category === selectedName).slice(0, 10)
    : exams.slice(0, 10);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={P.primary} size="small" />
        <Text style={styles.loadingText}>Loading practice exams…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[...P.gradHeader]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGrad}>
        <View style={styles.headerOrb} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <BookOpen size={20} color="#FFF" strokeWidth={2.2} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Practice Exams</Text>
              <Text style={styles.headerSub}>Sharpen skills & track progress</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/practice-categories' as any)}
            activeOpacity={0.88}
          >
            <View style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All</Text>
              <ArrowRight size={13} color={P.primary} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressMeta}>
            <Text style={styles.progressLabel}>Overall completion</Text>
            <Text style={styles.progressValue}>{completion}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[...HomeTheme.heroCta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.max(completion, 4)}%` }]}
            />
          </View>
        </View>
      </LinearGradient>

      <LinearGradient colors={['#F0FDF9', '#FFFFFF']} style={styles.statsBand}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          {STAT_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <View key={item.key} style={styles.statPill}>
                <View style={[styles.statIcon, { backgroundColor: item.bg }]}>
                  <Icon size={14} color={item.color} strokeWidth={2.2} />
                </View>
                <Text style={[styles.statValue, { color: item.color }]}>{statValues[item.key]}</Text>
                <Text style={styles.statLabel}>{statLabels[item.key]}</Text>
              </View>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {categories.length > 0 && (
        <>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Categories</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.85}
                >
                  {active ? (
                    <LinearGradient colors={[...HomeTheme.heroCta]} style={styles.catChipActive}>
                      <Text style={styles.catChipTextActive}>{cat.name}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.catChip}>
                      <Text style={styles.catChipText}>{cat.name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examScroll}>
            {filtered.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="document-text-outline" size={28} color={P.primaryLight} />
                <Text style={styles.emptyExams}>No exams in this category</Text>
              </View>
            ) : (
              filtered.map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  activeOpacity={0.88}
                  onPress={() => router.push(`/(tabs)/practice-exam/${exam.id}` as any)}
                  style={styles.examCardWrap}
                >
                  <LinearGradient
                    colors={exam.attempted ? ['#F0FDF9', '#FFFFFF'] : ['#FFFBEB', '#FFFFFF']}
                    style={[styles.examCard, exam.attempted ? styles.examCardDone : styles.examCardNew]}
                  >
                    <View style={styles.examCardTop}>
                      <LinearGradient
                        colors={exam.attempted ? ['#D1FAE5', '#ECFDF5'] : ['#EDE9FE', '#F3EFFF']}
                        style={styles.examIconWrap}
                      >
                        {exam.logoUrl && getImageUrl(exam.logoUrl) ? (
                          <Image source={{ uri: getImageUrl(exam.logoUrl)! }} style={styles.examLogo} />
                        ) : (
                          <Ionicons name="document-text" size={22} color={exam.attempted ? P.primary : HomeTheme.primary} />
                        )}
                      </LinearGradient>
                      {exam.attempted ? (
                        <View style={styles.doneBadge}>
                          <Ionicons name="checkmark" size={10} color="#FFF" />
                        </View>
                      ) : (
                        <LinearGradient colors={['#F59E0B', '#EA580C']} style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </LinearGradient>
                      )}
                    </View>
                    <Text style={styles.examTitle} numberOfLines={2}>
                      {exam.title}
                    </Text>
                    {exam.attempted && exam.score != null ? (
                      <View style={styles.scoreRow}>
                        <Ionicons name="trophy" size={11} color="#059669" />
                        <Text style={styles.examScore}>{exam.score}% score</Text>
                      </View>
                    ) : (
                      <View style={styles.startRow}>
                        <Text style={styles.examCta}>Start practice</Text>
                        <ArrowRight size={11} color={P.primary} strokeWidth={2.5} />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 14,
    backgroundColor: HomeTheme.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: P.softBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: { elevation: 5 },
    }),
  },
  loadingWrap: {
    paddingVertical: 32,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  loadingText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: HomeTheme.inkMuted,
    marginTop: 8,
  },
  headerGrad: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  headerOrb: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -20,
    right: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerText: { flex: 1 },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: '#FFF' },
  headerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  viewAllText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: P.primary,
    marginRight: 3,
  },
  progressCard: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFFBF7',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: { fontFamily: FontFamily.medium, fontSize: 11, color: HomeTheme.inkSecondary },
  progressValue: { fontFamily: FontFamily.bold, fontSize: 15, color: HomeTheme.primary },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EDE9FE',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  statsBand: {
    borderBottomWidth: 1,
    borderBottomColor: P.softBorder,
  },
  statsScroll: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statPill: {
    width: 88,
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginRight: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    marginBottom: 1,
  },
  statLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: P.muted,
    textAlign: 'center',
  },
  sectionLabelRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: HomeTheme.ink,
  },
  catScroll: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: HomeTheme.primarySoft,
    marginRight: 8,
  },
  catChipActive: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  catChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: HomeTheme.primary,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  catChipTextActive: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#FFF',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  examScroll: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  examCardWrap: {
    marginRight: 10,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  examCard: {
    width: 132,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  examCardNew: {
    borderColor: '#FDE68A',
  },
  examCardDone: {
    borderColor: P.softBorder,
  },
  examCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  examIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  examLogo: { width: 44, height: 44, borderRadius: 12 },
  doneBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 8,
    color: '#FFF',
    letterSpacing: 0.3,
  },
  examTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: HomeTheme.ink,
    lineHeight: Platform.OS === 'android' ? 18 : 16,
    minHeight: 32,
    marginBottom: 6,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  examScore: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#059669',
    marginLeft: 4,
  },
  startRow: { flexDirection: 'row', alignItems: 'center' },
  examCta: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: P.primary,
    marginRight: 3,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  emptyExams: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: HomeTheme.inkMuted,
    marginTop: 6,
  },
});

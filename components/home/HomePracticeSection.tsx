import { apiFetchAuth, getImageUrl as getImageUrlFromApi } from '@/constants/api';
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
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

const STAT_CARDS = [
  { key: 'attempted', icon: 'bar-chart' as const, bg: '#F3EFFF', color: '#6344D4', border: '#6344D4' },
  { key: 'completed', icon: 'checkmark-circle' as const, bg: '#ECFDF5', color: '#059669', border: '#10B981' },
  { key: 'progress', icon: 'pulse' as const, bg: '#EFF6FF', color: '#2563EB', border: '#3B82F6' },
  { key: 'score', icon: 'trophy' as const, bg: '#FFF7ED', color: '#EA580C', border: '#F97316' },
];

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
              color: '#6344D4',
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
  const completed = attempted;
  const total = exams.length;
  const completion = total > 0 ? Math.round((completed / total) * 100) : 0;
  const avgScore =
    exams.filter((e) => e.attempted && e.score != null).length > 0
      ? Math.round(
          exams.filter((e) => e.attempted && e.score != null).reduce((s, e) => s + (e.score || 0), 0) /
            exams.filter((e) => e.attempted && e.score != null).length
        )
      : 0;

  const statValues: Record<string, string> = {
    attempted: `${attempted} Attempted`,
    completed: `${completed} Exams`,
    progress: `${completion}% Progress`,
    score: `${avgScore}% Score`,
  };
  const statLabels: Record<string, string> = {
    attempted: 'Total Exams',
    completed: 'Completed',
    progress: 'Completion',
    score: 'Average Score',
  };

  const selectedName = categories.find((c) => c.id === selectedCategory)?.name || '';
  const filtered = selectedName ? exams.filter((e) => e.category === selectedName).slice(0, 8) : exams.slice(0, 8);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={HomeTheme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('@/assets/images/icons/exam2.png')}
            style={styles.headerIcon}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>Practise</Text>
            <Text style={styles.headerSub}>Improve your skills and track your progress.</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/practice-categories' as any)} activeOpacity={0.88}>
          <LinearGradient colors={['#2DD4BF', '#00C096']} style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>View All</Text>
            <ArrowRight size={13} color="#FFF" strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        {STAT_CARDS.map((card) => (
          <View key={card.key} style={[styles.statCard, { borderTopColor: card.border }]}>
            <View style={[styles.statIconWrap, { backgroundColor: card.bg }]}>
              <Ionicons name={card.icon} size={18} color={card.color} />
            </View>
            <Text style={styles.statValue} numberOfLines={1}>
              {statValues[card.key]}
            </Text>
            <Text style={styles.statLabel}>{statLabels[card.key]}</Text>
          </View>
        ))}
      </View>

      {categories.length > 0 && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={[styles.catChip, active && styles.catChipActive]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examScroll}>
            {filtered.length === 0 ? (
              <Text style={styles.emptyExams}>No exams in this category</Text>
            ) : (
              filtered.map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  style={styles.examCard}
                  onPress={() => router.push(`/(tabs)/practice-exam/${exam.id}` as any)}
                  activeOpacity={0.88}
                >
                  <View style={styles.examIconWrap}>
                    {exam.logoUrl && getImageUrl(exam.logoUrl) ? (
                      <Image source={{ uri: getImageUrl(exam.logoUrl)! }} style={styles.examLogo} />
                    ) : (
                      <Ionicons name="document-text" size={22} color={HomeTheme.primary} />
                    )}
                  </View>
                  <Text style={styles.examTitle} numberOfLines={2}>
                    {exam.title}
                  </Text>
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
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: HomeTheme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  loading: { padding: 24, alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  headerLeft: { flexDirection: 'row', flex: 1, gap: 10 },
  headerIcon: { width: 40, height: 40 },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 17, color: HomeTheme.ink },
  headerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: HomeTheme.inkMuted,
    marginTop: 2,
    lineHeight: 15,
    maxWidth: 200,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 3,
  },
  viewAllText: { fontFamily: FontFamily.semiBold, fontSize: 11, color: '#FFF' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: '#FAFAFE',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: HomeTheme.border,
    borderTopWidth: 3,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: HomeTheme.ink,
    textAlign: 'center',
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: HomeTheme.inkMuted,
    textAlign: 'center',
  },
  catScroll: { marginBottom: 10, maxHeight: 36 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: HomeTheme.border,
  },
  catChipActive: {
    backgroundColor: HomeTheme.primarySoft,
    borderColor: HomeTheme.primary,
  },
  catChipText: { fontFamily: FontFamily.medium, fontSize: 11, color: HomeTheme.inkMuted },
  catChipTextActive: { fontFamily: FontFamily.semiBold, color: HomeTheme.primary },
  examScroll: { gap: 8, paddingBottom: 2 },
  examCard: {
    width: 100,
    backgroundColor: '#FAFAFE',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: HomeTheme.border,
    marginRight: 8,
  },
  examIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: HomeTheme.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  examLogo: { width: 40, height: 40, borderRadius: 12 },
  examTitle: { fontFamily: FontFamily.semiBold, fontSize: 10, color: HomeTheme.ink, textAlign: 'center', lineHeight: 14 },
  emptyExams: { fontFamily: FontFamily.regular, fontSize: 12, color: HomeTheme.inkMuted, paddingVertical: 8 },
});

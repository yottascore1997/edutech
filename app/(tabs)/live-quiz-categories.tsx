import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LiveQuizCategory = {
  id: string;
  name: string;
  questionCount: number;
};

const CARD_GRADIENTS: [string, string][] = [
  ['#F97316', '#FBBF24'],
  ['#0EA5E9', '#14B8A6'],
  ['#EC4899', '#FB923C'],
  ['#8B5CF6', '#A78BFA'],
  ['#10B981', '#34D399'],
];

function getCardGradient(index: number): [string, string] {
  return CARD_GRADIENTS[index % CARD_GRADIENTS.length];
}

function getCategoryIcon(name: string, index: number): keyof typeof Ionicons.glyphMap {
  const n = name.toUpperCase();
  if (n.includes('MATH') || n.includes('गणित')) return 'calculator';
  if (n.includes('ENG') || n.includes('हिंदी') || n.includes('ENGLISH')) return 'book';
  if (n.includes('CHEM') || n.includes('रसायन')) return 'flask';
  if (n.includes('PHY') || n.includes('भौतिक')) return 'nuclear';
  if (n.includes('BIO') || n.includes('जीव')) return 'leaf';
  const icons: (keyof typeof Ionicons.glyphMap)[] = ['school', 'library', 'bulb', 'reader', 'trophy'];
  return icons[index % icons.length];
}

export default function LiveQuizCategoriesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<LiveQuizCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      if (!user?.token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await apiFetchAuth('/student/question-categories', user.token);
        if (!isMounted) return;

        if (res.ok && Array.isArray(res.data)) {
          const mapped: LiveQuizCategory[] = res.data.map((c: any) => ({
            id: String(c.id ?? c._id ?? ''),
            name: String(c.name ?? c.title ?? 'Category'),
            questionCount: Number(c.questionCount ?? c.totalQuestions ?? 0),
          }));
          setCategories(mapped);
        } else {
          setError('Failed to load categories.');
        }
      } catch (e) {
        if (!isMounted) return;
        setError('Unable to load categories. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [user?.token]);

  const handleJoinCategory = async (categoryId: string) => {
    if (!user?.token || joiningId) return;
    setJoiningId(categoryId);
    setError(null);

    try {
      const res = await apiFetchAuth('/student/live-quiz/join', user.token, {
        method: 'POST',
        body: { categoryId },
      });

      if (!res.ok || !res.data?.session) {
        setError('Unable to join live quiz. Please try again.');
        return;
      }

      const sessionId = String(res.data.session.id);
      router.push({
        pathname: '/(tabs)/live-quiz-play',
        params: { sessionId },
      } as any);
    } catch (e) {
      setError('Unable to join live quiz. Please try again.');
    } finally {
      setJoiningId(null);
    }
  };

  const renderItem = ({ item, index }: { item: LiveQuizCategory; index: number }) => {
    const isJoining = joiningId === item.id;
    const colors = getCardGradient(index);
    const iconName = getCategoryIcon(item.name, index);
    const chapterNum = String((index % 12) + 1).padStart(2, '0');

    return (
      <View style={styles.cardWrap}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardInner}>
            <View style={styles.illustrationBox}>
              <View style={styles.illustrationIconWrap}>
                <Ionicons name={iconName} size={36} color="rgba(255,255,255,0.95)" />
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name.toUpperCase()}</Text>
              <Text style={styles.cardChapter}>Chapter {chapterNum}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.questionCount} questions • Join Live
              </Text>
              <TouchableOpacity
                style={[styles.playButton, isJoining && styles.playButtonDisabled]}
                onPress={() => handleJoinCategory(item.id)}
                disabled={isJoining}
                activeOpacity={0.85}
              >
                {isJoining ? (
                  <ActivityIndicator color="#1E3A5F" size="small" />
                ) : (
                  <Text style={styles.playButtonText}>PLAY NOW</Text>
                )}
              </TouchableOpacity>
              <View style={styles.coinsRow}>
                <Ionicons name="ellipse" size={8} color="rgba(255,255,255,0.9)" />
                <Text style={styles.coinsText}>win upto 400 coins</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#2D5070', '#243B58']}
        style={[styles.header, { paddingTop: insets.top, paddingBottom: 2 }]}
      >
        <View style={styles.headerCenter}>
          <View style={styles.logoIcon}>
            <View style={styles.logoSquare} />
            <View style={[styles.logoSquare, styles.logoSquareRight]}>
              <Ionicons name="checkmark" size={5} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.headerTitle}>KHELO QUIZ</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E3A5F" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 2,
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 0,
  },
  logoSquare: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 1,
  },
  logoSquareRight: {
    marginLeft: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: -2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 28,
  },
  cardWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }
      : { elevation: 6 }),
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  illustrationBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  illustrationIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardChapter: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
  },
  playButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  playButtonDisabled: {
    opacity: 0.8,
  },
  playButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A5F',
    letterSpacing: 0.5,
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  coinsText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
});

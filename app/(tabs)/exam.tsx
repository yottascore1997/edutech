import ExamScreenUI from '@/components/exam/ExamScreenUI';
import { apiFetchAuth } from '@/constants/api';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import { applyExamFilters } from '@/utils/examFilter';
import {
    mergeJoinedLiveExamsIntoExamList,
    syncJoinedLiveExamIds,
} from '@/utils/joinedLiveExams';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useScreenLoadState } from '@/hooks/useScreenLoadState';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExamCard from '../../components/ExamCard';

const T = {
    bg: '#FFFBF7',
    bgGrad: ['#FFFCF8', '#FFFBF7', '#EFF6FF'] as const,
    card: '#FFFFFF',
    border: '#E8EEF8',
    primary: '#2563EB',
    live: '#DC2626',
    ctaGrad: ['#60A5FA', '#2563EB', '#1D4ED8'] as const,
    ink: '#0F172A',
    muted: '#64748B',
} as const;

export default function ExamScreen() {
    const { user } = useAuth();
    const { selectedCategory: globalCategory } = useCategory();
    const [exams, setExams] = useState<any[]>([]);
    const [joinedLiveExamIds, setJoinedLiveExamIds] = useState<string[]>([]);
    const [filteredExams, setFilteredExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [categories, setCategories] = useState<string[]>([]);
    const [remainingTime, setRemainingTime] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const { beginFetch, endFetch, shouldBlockUI } = useScreenLoadState();

    const fetchExams = async (refresh = false) => {
        if (!user?.token) {
            setLoading(false);
            return;
        }
        try {
            beginFetch(setLoading, setRefreshing, { refresh });
            const response = await apiFetchAuth('/student/exams', user.token);
            const joinedIds =
                user.id ? await syncJoinedLiveExamIds(user.token, String(user.id)) : [];
            setJoinedLiveExamIds(joinedIds);

            if (response.ok) {
                const list = Array.isArray(response.data) ? response.data : [];
                const merged = user.token
                    ? await mergeJoinedLiveExamsIntoExamList(list, joinedIds, user.token)
                    : list;
                setExams(merged);

                const uniqueCategories = [...new Set(
                    merged
                        .map((exam: any) => exam.category)
                        .filter((category: any) => category && typeof category === 'string')
                )] as string[];

                const hasUncategorized = merged.some((exam: any) => !exam.category || exam.category === null);
                const finalCategories = hasUncategorized ? [...uniqueCategories, 'Uncategorized'] : uniqueCategories;

                setCategories(finalCategories);
                setError(null);
            } else {
                setError(response.data?.message || 'Failed to fetch exams');
            }
        } catch (err: any) {
            setError(err.data?.message || 'An unknown error occurred');
        } finally {
            endFetch(setLoading, setRefreshing);
        }
    };

    const onRefresh = async () => {
        try {
            await fetchExams(true);
        } catch (e) {
                    }
    };

    useEffect(() => {
        fetchExams();
    }, [user]);

    useEffect(() => {
        const calculateRemainingTime = () => {
            if (filteredExams.length === 0) {
                setRemainingTime('');
                return;
            }

            const now = new Date();
            let earliestEndTime: Date | null = null;

            filteredExams.forEach((exam: any) => {
                if (exam.endTime) {
                    const endTime = new Date(exam.endTime);
                    if (!earliestEndTime || endTime < earliestEndTime) {
                        earliestEndTime = endTime;
                    }
                }
            });

            if (!earliestEndTime) {
                setRemainingTime('');
                return;
            }

            const diff = (earliestEndTime as Date).getTime() - now.getTime();

            if (diff <= 0) {
                setRemainingTime('00:00:00');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setRemainingTime(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        };

        const timer = setInterval(calculateRemainingTime, 1000);
        calculateRemainingTime();
        return () => clearInterval(timer);
    }, [filteredExams]);

    useEffect(() => {
        const categoryToFilter = globalCategory || (selectedCategory !== 'all' ? selectedCategory : undefined);

        const filtered = applyExamFilters(exams, {
            category: categoryToFilter,
            searchQuery: searchQuery,
            includeExpired: false,
            userId: user?.id,
            joinedExamIds: joinedLiveExamIds,
        });

        setFilteredExams(filtered);
    }, [globalCategory, selectedCategory, exams, searchQuery, joinedLiveExamIds, user?.id]);

    if (shouldBlockUI(loading)) {
        return (
            <View style={styles.centered}>
                <StatusBar barStyle="dark-content" />
                <LinearGradient colors={[...T.bgGrad]} style={StyleSheet.absoluteFill} />
                <View style={styles.loadCard}>
                    <ActivityIndicator size="large" color={T.primary} />
                    <Text style={styles.loadTitle}>Loading live exams</Text>
                    <Text style={styles.loadSub}>Fetching battles for you…</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <StatusBar barStyle="dark-content" />
                <LinearGradient colors={[...T.bgGrad]} style={StyleSheet.absoluteFill} />
                <View style={styles.errCard}>
                    <Ionicons name="cloud-offline-outline" size={48} color={T.live} />
                    <Text style={styles.errTitle}>Could not load exams</Text>
                    <Text style={styles.errSub}>{error}</Text>
                    <TouchableOpacity onPress={fetchExams} activeOpacity={0.9}>
                        <LinearGradient colors={[...T.ctaGrad]} style={styles.retryBtn}>
                            <Text style={styles.retryTxt}>Try Again</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.root} edges={[]}>
            <StatusBar barStyle="dark-content" />
            <ExamScreenUI
                filteredExams={filteredExams}
                joinedCount={joinedLiveExamIds.length}
                remainingTime={remainingTime}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
                refreshing={refreshing}
                onRefresh={onRefresh}
                renderExamCard={({ item }) => <ExamCard exam={item} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    loadCard: {
        backgroundColor: T.card,
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 300,
        borderWidth: 1,
        borderColor: T.border,
    },
    loadTitle: {
        fontFamily: FontFamily.bold,
        fontSize: 17,
        color: T.ink,
        marginTop: 16,
    },
    loadSub: {
        fontFamily: FontFamily.regular,
        fontSize: 13,
        color: T.muted,
        marginTop: 6,
    },
    errCard: {
        backgroundColor: T.card,
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
        borderWidth: 1,
        borderColor: T.border,
    },
    errTitle: {
        fontFamily: FontFamily.bold,
        fontSize: 18,
        color: T.ink,
        marginTop: 14,
    },
    errSub: {
        fontFamily: FontFamily.regular,
        fontSize: 14,
        color: T.muted,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    retryBtn: {
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryTxt: {
        fontFamily: FontFamily.semiBold,
        fontSize: 15,
        color: '#FFF',
    },
});

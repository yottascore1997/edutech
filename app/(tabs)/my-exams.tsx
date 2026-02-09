import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface MyExam {
    id: string;
    examId: string;
    examName: string;
    examType: 'LIVE' | 'PRACTICE';
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number;
    status: string;
    completedAt?: string;
}

const MyExamsScreen = () => {
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [exams, setExams] = useState<MyExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<'LIVE' | 'PRACTICE'>('LIVE');
    const [fadeAnim] = useState(new Animated.Value(0));
    const [showDetails, setShowDetails] = useState(false);
    const [selectedExam, setSelectedExam] = useState<MyExam | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMyExams = async () => {
        if (!user?.token) return;

        try {
            setLoading(true);
            setError(null);
            const response = await apiFetchAuth('/student/my-exams', user.token);
            if (response.ok) {
                setExams(response.data || []);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }).start();
            } else {
                setError('Failed to load exams');
            }
        } catch (error) {
            console.error('Error fetching my exams:', error);
            setError('Failed to load exams');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMyExams();
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchMyExams();
        }, [user?.token])
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    const getAccuracy = (correctAnswers: number, totalQuestions: number) => {
        if (totalQuestions === 0) return 0;
        const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
        return Math.min(accuracy, 100);
    };

    // Optimized filtering with useMemo
    const filteredExams = useMemo(() => {
        let filtered = exams;
        
        if (searchQuery.trim()) {
            filtered = filtered.filter(exam =>
                exam.examName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        filtered = filtered.filter(exam => exam.examType === selectedFilter);
        
        filtered = filtered.sort((a, b) => {
            const dateA = new Date(a.completedAt || 0);
            const dateB = new Date(b.completedAt || 0);
            return dateB.getTime() - dateA.getTime();
        });
        
        return filtered;
    }, [exams, searchQuery, selectedFilter]);

    // Analytics calculations - Optimized with useMemo
    const analytics = useMemo(() => {
        const completedExams = exams.filter(e => e.status === 'COMPLETED');
        const totalExams = completedExams.length;
        const avgScore = totalExams > 0
            ? Math.round(completedExams.reduce((sum, e) => sum + getAccuracy(e.correctAnswers, e.totalQuestions), 0) / totalExams)
            : 0;
        const bestScore = totalExams > 0
            ? Math.max(...completedExams.map(e => getAccuracy(e.correctAnswers, e.totalQuestions)))
            : 0;

        return { totalExams, avgScore, bestScore };
    }, [exams]);

    const { totalExams, avgScore, bestScore } = analytics;

    const getScorePercentage = (score: number, total: number) => {
        return total > 0 ? Math.round((score / total) * 100) : 0;
    };

    const renderFilterButton = (filter: 'LIVE' | 'PRACTICE', label: string, icon: string) => (
        <TouchableOpacity
            style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter(filter)}
            activeOpacity={0.7}
        >
            <Ionicons 
                name={icon as any} 
                size={16} 
                color={selectedFilter === filter ? '#7C3AED' : '#64748B'} 
            />
            <Text style={[
                styles.filterChipText,
                selectedFilter === filter && styles.filterChipTextActive
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderExamCard = useCallback(({ item }: { item: MyExam }) => {
        const percentage = getAccuracy(item.correctAnswers, item.totalQuestions);
        const isLive = item.examType === 'LIVE';

        return (
            <TouchableOpacity
                style={styles.examCard}
                activeOpacity={0.78}
                onPress={() => handleViewDetails(item)}
            >
                <View style={[styles.examCardAccent, isLive ? styles.examCardAccentLive : styles.examCardAccentPractice]} />
                <View style={styles.examCardInner}>
                    {/* Header */}
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <LinearGradient
                                colors={isLive ? ['#EF4444', '#DC2626'] : ['#6366F1', '#5B21B6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.examTypeBadge}
                            >
                                <Ionicons name={isLive ? 'radio' : 'book-outline'} size={12} color="#FFF" />
                                <Text style={styles.examTypeBadgeText}>{item.examType}</Text>
                            </LinearGradient>
                            <Text style={styles.examTitle} numberOfLines={2}>{item.examName}</Text>
                        </View>
                        <LinearGradient
                            colors={
                                percentage >= 80 ? ['#10B981', '#059669'] :
                                percentage >= 60 ? ['#F59E0B', '#D97706'] :
                                percentage === 0 ? ['#6366F1', '#7C3AED'] :
                                ['#EF4444', '#DC2626']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.scoreContainer}
                        >
                            <Text style={styles.scorePercentage}>{percentage}%</Text>
                            <Text style={styles.scoreLabel}>Score</Text>
                        </LinearGradient>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <View style={[styles.statIconWrapper, styles.statIconGreen]}>
                                <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                            </View>
                            <View style={styles.statContent}>
                                <Text style={styles.statValue} numberOfLines={1}>{item.correctAnswers}/{item.totalQuestions}</Text>
                                <Text style={styles.statLabel} numberOfLines={1}>Correct</Text>
                            </View>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statIconWrapper, styles.statIconPurple]}>
                                <Ionicons name="time" size={16} color="#FFF" />
                            </View>
                            <View style={styles.statContent}>
                                <Text style={styles.statValue} numberOfLines={1}>{formatTime(item.timeTaken)}</Text>
                                <Text style={styles.statLabel} numberOfLines={1}>Duration</Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.cardFooter}>
                        <View style={styles.cardFooterLeft}>
                            {item.completedAt ? (
                                <>
                                    <Ionicons name="calendar" size={14} color="#7C3AED" />
                                    <Text style={styles.footerText}>{formatDate(item.completedAt)}</Text>
                                </>
                            ) : <View />}
                        </View>
                        <View style={styles.viewDetailsWrap}>
                            <Text style={styles.viewDetailsText}>View details</Text>
                            <Ionicons name="chevron-forward" size={16} color="#7C3AED" />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, []);

    const handleViewDetails = (exam: MyExam) => {
        try {
            const targetId = exam.examId || exam.id;
            const normalizedStatus = String(exam.status || '').toUpperCase();
            const isCompleted = normalizedStatus === 'COMPLETED' || normalizedStatus === 'FINISHED';
            const accuracy = getAccuracy(exam.correctAnswers, exam.totalQuestions);
            const totalQuestions = exam.totalQuestions || 0;
            const correctAnswers = exam.correctAnswers || 0;
            const wrongAnswers = Math.max(0, totalQuestions - correctAnswers);
            const timeTakenSeconds = exam.timeTaken || 0;
            const timeTakenMinutes = Math.max(1, Math.round(timeTakenSeconds / 60));
            const resultData =
                exam.examType === 'LIVE' && isCompleted
                    ? {
                        score: exam.score || 0,
                        totalQuestions,
                        correctAnswers,
                        wrongAnswers,
                        unattempted: 0,
                        examDuration: 0,
                        timeTakenSeconds,
                        timeTakenMinutes,
                        timeTakenFormatted: formatTime(timeTakenSeconds),
                        currentRank: null,
                        prizeAmount: 0,
                        examTitle: exam.examName,
                        completedAt: exam.completedAt,
                        accuracy,
                        timeEfficiency: 0,
                        message: 'Result summary',
                    }
                    : undefined;
            
            if (exam.examType === 'LIVE') {
                router.push({ pathname: '/(tabs)/exam/[id]' as any, params: { id: String(targetId), from: 'my-exams', status: normalizedStatus || exam.status, resultData: resultData ? JSON.stringify(resultData) : undefined } });
            } else if (exam.examType === 'PRACTICE') {
                router.push({ pathname: '/(tabs)/practice-exam/[id]' as any, params: { id: String(targetId), from: 'my-exams', status: exam.status } });
            }
        } catch (error) {
            console.error('Navigation error:', error);
            setSelectedExam(exam);
            setShowDetails(true);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={[]}>
                <LinearGradient colors={['#EDE9FE', '#F5F3FF', '#FFFFFF']} style={[styles.loadingContainer, { paddingTop: insets.top + 40 }]}>
                    <View style={styles.loadingIconWrap}>
                        <Ionicons name="document-text" size={48} color="#7C3AED" />
                    </View>
                    <ActivityIndicator size="large" color="#7C3AED" />
                    <Text style={styles.loadingText}>Loading your exams...</Text>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <View style={styles.errorIconWrap}>
                        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    </View>
                    <Text style={styles.errorTitle}>Something went wrong</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchMyExams} activeOpacity={0.85}>
                        <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.retryButtonGradient}>
                            <Ionicons name="refresh" size={20} color="#FFF" />
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            {/* Premium Header */}
            <LinearGradient colors={['#EDE9FE', '#F5F3FF']} style={[styles.screenHeader, { paddingTop: insets.top }]}>
                <View style={styles.screenHeaderInner}>
                    <View style={styles.screenHeaderIconWrap}>
                        <Ionicons name="document-text" size={24} color="#7C3AED" />
                    </View>
                    <View style={styles.screenHeaderTextWrap}>
                        <Text style={styles.screenHeaderTitle}>My Exams</Text>
                        <Text style={styles.screenHeaderSubtitle}>Track performance & results</Text>
                    </View>
                </View>
            </LinearGradient>
            <ScrollView
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#7C3AED']}
                        tintColor="#7C3AED"
                    />
                }
            >
                {/* Overview Stats */}
                {totalExams > 0 && (
                    <View style={styles.analyticsWrapper}>
                        <Text style={styles.analyticsSectionLabel}>Overview</Text>
                        <View style={styles.analyticsContainer}>
                            <LinearGradient
                                colors={['#6366F1', '#7C3AED']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.analyticsCard}
                            >
                                <View style={styles.analyticsIconBox}>
                                    <Ionicons name="document-text" size={20} color="#FFF" />
                                </View>
                                <Text style={styles.analyticsValueWhite}>{totalExams}</Text>
                                <Text style={styles.analyticsLabelWhite}>Total</Text>
                            </LinearGradient>

                            <LinearGradient
                                colors={['#10B981', '#059669']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.analyticsCard}
                            >
                                <View style={styles.analyticsIconBox}>
                                    <Ionicons name="trending-up" size={20} color="#FFF" />
                                </View>
                                <Text style={styles.analyticsValueWhite}>{avgScore}%</Text>
                                <Text style={styles.analyticsLabelWhite}>Average</Text>
                            </LinearGradient>

                            <LinearGradient
                                colors={['#F59E0B', '#D97706']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.analyticsCard}
                            >
                                <View style={styles.analyticsIconBox}>
                                    <Ionicons name="trophy" size={20} color="#FFF" />
                                </View>
                                <Text style={styles.analyticsValueWhite}>{bestScore}%</Text>
                                <Text style={styles.analyticsLabelWhite}>Best</Text>
                            </LinearGradient>
                        </View>
                    </View>
                )}

                {/* Search & Filter */}
                <View style={styles.searchFilterSection}>
                    <View style={styles.searchContainer}>
                        <Image source={require('@/assets/images/icons/search.png')} style={styles.searchBarIcon} resizeMode="contain" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by exam name..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                                <Ionicons name="close-circle" size={20} color="#64748B" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.filterRow}>
                        <View style={styles.filterContainer}>
                            {renderFilterButton('LIVE', 'Live Exam', 'radio-outline')}
                            {renderFilterButton('PRACTICE', 'Practise Exam', 'book-outline')}
                        </View>
                    </View>
                </View>

                {/* Exams List */}
                <View style={styles.examsSection}>
                    {filteredExams.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyStateCard}>
                                <View style={styles.emptyStateIconWrap}>
                                    <Ionicons name="document-text-outline" size={52} color="#7C3AED" />
                                </View>
                                <Text style={styles.emptyTitle}>
                                    {searchQuery.trim() ? 'No matches found' : 'No exams yet'}
                                </Text>
                                <Text style={styles.emptySubtitle}>
                                    {searchQuery.trim()
                                        ? 'Try a different search or filter'
                                        : 'Complete an exam to see it here'}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.sectionTitle}>{filteredExams.length} {filteredExams.length === 1 ? 'exam' : 'exams'}</Text>
                            {filteredExams.map((item) => (
                                <View key={item.id}>
                                    {renderExamCard({ item })}
                                </View>
                            ))}
                        </>
                    )}
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Details Modal */}
            {showDetails && selectedExam && (
                <Modal
                    visible={showDetails}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowDetails(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.modalHeader}>
                                <Text style={styles.modalTitleWhite} numberOfLines={2}>{selectedExam.examName}</Text>
                                <TouchableOpacity onPress={() => setShowDetails(false)} style={styles.modalCloseBtn}>
                                    <Ionicons name="close" size={22} color="#FFF" />
                                </TouchableOpacity>
                            </LinearGradient>

                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Performance</Text>
                                    <View style={styles.modalStatsGrid}>
                                        <View style={styles.modalStatItem}>
                                            <View style={styles.modalStatIconWrap}>
                                                <Ionicons name="star" size={18} color="#FFF" />
                                            </View>
                                            <Text style={styles.modalStatValue}>{selectedExam.score}</Text>
                                            <Text style={styles.modalStatLabel}>Score</Text>
                                        </View>
                                        <View style={styles.modalStatItem}>
                                            <View style={[styles.modalStatIconWrap, styles.modalStatIconGreen]}>
                                                <Ionicons name="checkmark-done" size={18} color="#FFF" />
                                            </View>
                                            <Text style={styles.modalStatValue}>
                                                {getScorePercentage(selectedExam.correctAnswers, selectedExam.totalQuestions)}%
                                            </Text>
                                            <Text style={styles.modalStatLabel}>Accuracy</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Details</Text>
                                    <View style={styles.modalDetailCard}>
                                        <View style={styles.modalDetailRow}>
                                            <View style={styles.modalDetailLabelRow}>
                                                <Ionicons name="layers-outline" size={18} color="#7C3AED" />
                                                <Text style={styles.modalDetailLabel}>Type</Text>
                                            </View>
                                            <Text style={styles.modalDetailValue}>{selectedExam.examType}</Text>
                                        </View>
                                        <View style={[styles.modalDetailRow, styles.modalDetailRowBorder]}>
                                            <View style={styles.modalDetailLabelRow}>
                                                <Ionicons name="checkmark-circle-outline" size={18} color="#7C3AED" />
                                                <Text style={styles.modalDetailLabel}>Correct</Text>
                                            </View>
                                            <Text style={styles.modalDetailValue}>{selectedExam.correctAnswers}/{selectedExam.totalQuestions}</Text>
                                        </View>
                                        <View style={[styles.modalDetailRow, styles.modalDetailRowBorder]}>
                                            <View style={styles.modalDetailLabelRow}>
                                                <Ionicons name="time-outline" size={18} color="#7C3AED" />
                                                <Text style={styles.modalDetailLabel}>Time taken</Text>
                                            </View>
                                            <Text style={styles.modalDetailValue}>{formatTime(selectedExam.timeTaken)}</Text>
                                        </View>
                                        {selectedExam.completedAt && (
                                            <View style={[styles.modalDetailRow, styles.modalDetailRowBorder]}>
                                                <View style={styles.modalDetailLabelRow}>
                                                    <Ionicons name="calendar-outline" size={18} color="#7C3AED" />
                                                    <Text style={styles.modalDetailLabel}>Completed</Text>
                                                </View>
                                                <Text style={styles.modalDetailValue}>{formatDate(selectedExam.completedAt)}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F3FF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingIconWrap: {
        width: 88,
        height: 88,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        ...(Platform.OS === 'ios' ? { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 } : {}),
        elevation: 6,
    },
    loadingText: {
        fontSize: 15,
        color: '#6D28D9',
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        gap: 12,
    },
    errorIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    errorText: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        fontWeight: '500',
    },
    retryButton: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 8,
    },
    retryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        gap: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    screenHeader: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(139, 92, 246, 0.15)',
    },
    screenHeaderInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    screenHeaderIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'ios' ? { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 } : {}),
        elevation: 4,
    },
    screenHeaderTextWrap: {
        flex: 1,
    },
    screenHeaderTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: 0.2,
    },
    screenHeaderSubtitle: {
        fontSize: 13,
        color: '#6D28D9',
        fontWeight: '600',
        marginTop: 2,
    },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
        letterSpacing: 0.3,
    },

    analyticsWrapper: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 4,
    },
    analyticsSectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6D28D9',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    analyticsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    analyticsCard: {
        flex: 1,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        ...(Platform.OS === 'ios' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 } : {}),
        elevation: 5,
    },
    analyticsIconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    analyticsValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    analyticsValueWhite: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    analyticsLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    analyticsLabelWhite: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.95)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    searchFilterSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.12)',
        ...(Platform.OS === 'ios' ? { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 } : {}),
        elevation: 2,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F3FF',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 46,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        gap: 10,
    },
    searchBarIcon: {
        width: 20,
        height: 20,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '500',
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 6,
    },
    filterChipActive: {
        backgroundColor: '#EDE9FE',
        borderColor: '#7C3AED',
    },
    filterChipText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#6D28D9',
    },
    // Exams Section
    examsSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#6D28D9',
        marginBottom: 14,
    },
    examCard: {
        backgroundColor: '#FFF',
        borderRadius: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        overflow: 'hidden',
        position: 'relative',
        ...(Platform.OS === 'ios' ? { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 } : {}),
        elevation: 4,
    },
    examCardAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: 18,
        borderBottomLeftRadius: 18,
    },
    examCardAccentLive: {
        backgroundColor: '#EF4444',
    },
    examCardAccentPractice: {
        backgroundColor: '#6366F1',
    },
    examCardInner: {
        padding: 18,
        paddingLeft: 22,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 12,
    },
    cardHeaderLeft: {
        flex: 1,
        gap: 8,
    },
    examTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    liveBadge: {
        backgroundColor: '#EF4444',
    },
    practiceBadge: {
        backgroundColor: '#4F46E5',
    },
    examTypeBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    examTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        lineHeight: 22,
    },
    scoreContainer: {
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    scorePercentage: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    scoreLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.95)',
        fontWeight: '600',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FAFAF9',
        padding: 10,
        borderRadius: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    statIconWrapper: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statIconGreen: {
        backgroundColor: '#10B981',
    },
    statIconPurple: {
        backgroundColor: '#6366F1',
    },
    statIconAmber: {
        backgroundColor: '#F59E0B',
    },
    statContent: {
        flex: 1,
        justifyContent: 'center',
        minWidth: 0,
    },
    statValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
    },
    statLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
    },

    // Card Footer
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 14,
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    cardFooterLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    viewDetailsWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewDetailsText: {
        fontSize: 13,
        color: '#7C3AED',
        fontWeight: '600',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 56,
        paddingHorizontal: 24,
    },
    emptyStateCard: {
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 20,
        paddingVertical: 40,
        paddingHorizontal: 32,
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.15)',
        ...(Platform.OS === 'ios' ? { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 } : {}),
        elevation: 3,
    },
    emptyStateIconWrap: {
        width: 96,
        height: 96,
        borderRadius: 28,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 21,
        fontWeight: '500',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.2)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
        marginRight: 12,
    },
    modalTitleWhite: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFF',
        flex: 1,
        marginRight: 12,
    },
    modalCloseBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        padding: 24,
        paddingBottom: 32,
    },
    modalSection: {
        marginBottom: 28,
    },
    modalSectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6D28D9',
        marginBottom: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    modalStatsGrid: {
        flexDirection: 'row',
        gap: 14,
    },
    modalStatItem: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 18,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.12)',
    },
    modalStatIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#7C3AED',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalStatIconGreen: {
        backgroundColor: '#10B981',
    },
    modalStatValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    modalStatLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    modalDetailCard: {
        backgroundColor: '#FAFAF9',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
    },
    modalDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    modalDetailRowBorder: {
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    modalDetailLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    modalDetailLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    modalDetailValue: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '700',
    },
});

export default MyExamsScreen;

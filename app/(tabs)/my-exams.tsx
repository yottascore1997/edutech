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
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

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
    const [exams, setExams] = useState<MyExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'LIVE' | 'PRACTICE'>('ALL');
    const [showOnlyCompleted, setShowOnlyCompleted] = useState(true);
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
        
        if (selectedFilter !== 'ALL') {
            filtered = filtered.filter(exam => exam.examType === selectedFilter);
        }

        if (showOnlyCompleted) {
            filtered = filtered.filter(exam => exam.status === 'COMPLETED');
        }
        
        filtered = filtered.sort((a, b) => {
            const dateA = new Date(a.completedAt || 0);
            const dateB = new Date(b.completedAt || 0);
            return dateB.getTime() - dateA.getTime();
        });
        
        return filtered;
    }, [exams, searchQuery, selectedFilter, showOnlyCompleted]);

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
        const totalTimeTaken = completedExams.reduce((sum, e) => sum + e.timeTaken, 0);

        return { totalExams, avgScore, bestScore, totalTimeTaken };
    }, [exams]);

    const { totalExams, avgScore, bestScore, totalTimeTaken } = analytics;

    const getScorePercentage = (score: number, total: number) => {
        return total > 0 ? Math.round((score / total) * 100) : 0;
    };

    const renderFilterButton = (filter: 'ALL' | 'LIVE' | 'PRACTICE', label: string, icon: string) => (
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
                color={selectedFilter === filter ? '#4F46E5' : '#64748B'} 
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
                activeOpacity={0.7}
                onPress={() => handleViewDetails(item)}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <LinearGradient
                            colors={isLive ? ['#EF4444', '#DC2626'] : ['#6366F1', '#4F46E5']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.examTypeBadge}
                        >
                            <Ionicons 
                                name={isLive ? 'radio' : 'book-outline'} 
                                size={12} 
                                color="#FFF" 
                            />
                            <Text style={styles.examTypeBadgeText}>{item.examType}</Text>
                        </LinearGradient>
                        <Text style={styles.examTitle} numberOfLines={2}>{item.examName}</Text>
                    </View>
                    <LinearGradient
                        colors={
                            percentage >= 80 ? ['#10B981', '#059669'] :
                            percentage >= 60 ? ['#F59E0B', '#D97706'] :
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
                        <View style={styles.statIconWrapper}>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                        </View>
                        <View style={styles.statContent}>
                            <Text style={styles.statValue}>{item.correctAnswers}/{item.totalQuestions}</Text>
                            <Text style={styles.statLabel}>Correct</Text>
                        </View>
                    </View>

                    <View style={styles.statItem}>
                        <View style={styles.statIconWrapper}>
                            <Ionicons name="time-outline" size={18} color="#6366F1" />
                        </View>
                        <View style={styles.statContent}>
                            <Text style={styles.statValue}>{formatTime(item.timeTaken)}</Text>
                            <Text style={styles.statLabel}>Duration</Text>
                        </View>
                    </View>

                    <View style={styles.statItem}>
                        <View style={styles.statIconWrapper}>
                            <Ionicons name="analytics-outline" size={18} color="#F59E0B" />
                        </View>
                        <View style={styles.statContent}>
                            <Text style={styles.statValue}>{item.score}</Text>
                            <Text style={styles.statLabel}>Points</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                {item.completedAt && (
                    <View style={styles.cardFooter}>
                        <Ionicons name="calendar-outline" size={14} color="#64748B" />
                        <Text style={styles.footerText}>{formatDate(item.completedAt)}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    }, []);

    const handleViewDetails = (exam: MyExam) => {
        try {
            const targetId = exam.examId || exam.id;
            
            if (exam.examType === 'LIVE') {
                router.push({ pathname: '/(tabs)/exam/[id]' as any, params: { id: String(targetId), from: 'my-exams', status: exam.status } });
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
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Loading exams...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchMyExams}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4F46E5']}
                        tintColor="#4F46E5"
                    />
                }
            >
                {/* Header */}
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6', '#A855F7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>My Exams</Text>
                    <Text style={styles.headerSubtitle}>Track your exam performance</Text>
                </LinearGradient>

                {/* Analytics Cards */}
                {totalExams > 0 && (
                    <View style={styles.analyticsContainer}>
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
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

                        <LinearGradient
                            colors={['#EC4899', '#DB2777']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.analyticsCard}
                        >
                            <View style={styles.analyticsIconBox}>
                                <Ionicons name="time" size={20} color="#FFF" />
                            </View>
                            <Text style={styles.analyticsValueWhite}>{Math.floor(totalTimeTaken / 60)}m</Text>
                            <Text style={styles.analyticsLabelWhite}>Total Time</Text>
                        </LinearGradient>
                    </View>
                )}

                {/* Search & Filter */}
                <View style={styles.searchFilterSection}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={20} color="#64748B" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search exams..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color="#64748B" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.filterContainer}>
                        {renderFilterButton('ALL', 'All', 'apps-outline')}
                        {renderFilterButton('LIVE', 'Live', 'radio-outline')}
                        {renderFilterButton('PRACTICE', 'Practice', 'book-outline')}
                    </View>
                </View>

                {/* Exams List */}
                <View style={styles.examsSection}>
                    {filteredExams.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyTitle}>
                                {searchQuery.trim() ? 'No matches found' : 'No exams yet'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery.trim()
                                    ? 'Try adjusting your search'
                                    : 'Your completed exams will appear here'}
                            </Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.sectionTitle}>{filteredExams.length} {filteredExams.length === 1 ? 'Exam' : 'Exams'}</Text>
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
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{selectedExam.examName}</Text>
                                <TouchableOpacity onPress={() => setShowDetails(false)}>
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody}>
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Performance</Text>
                                    <View style={styles.modalStatsGrid}>
                                        <View style={styles.modalStatItem}>
                                            <Text style={styles.modalStatValue}>{selectedExam.score}</Text>
                                            <Text style={styles.modalStatLabel}>Score</Text>
                                        </View>
                                        <View style={styles.modalStatItem}>
                                            <Text style={styles.modalStatValue}>
                                                {getScorePercentage(selectedExam.correctAnswers, selectedExam.totalQuestions)}%
                                            </Text>
                                            <Text style={styles.modalStatLabel}>Accuracy</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Details</Text>
                                    <View style={styles.modalDetailRow}>
                                        <Text style={styles.modalDetailLabel}>Type:</Text>
                                        <Text style={styles.modalDetailValue}>{selectedExam.examType}</Text>
                                    </View>
                                    <View style={styles.modalDetailRow}>
                                        <Text style={styles.modalDetailLabel}>Correct Answers:</Text>
                                        <Text style={styles.modalDetailValue}>{selectedExam.correctAnswers}/{selectedExam.totalQuestions}</Text>
                                    </View>
                                    <View style={styles.modalDetailRow}>
                                        <Text style={styles.modalDetailLabel}>Time Taken:</Text>
                                        <Text style={styles.modalDetailValue}>{formatTime(selectedExam.timeTaken)}</Text>
                                    </View>
                                    {selectedExam.completedAt && (
                                        <View style={styles.modalDetailRow}>
                                            <Text style={styles.modalDetailLabel}>Completed:</Text>
                                            <Text style={styles.modalDetailValue}>{formatDate(selectedExam.completedAt)}</Text>
                                        </View>
                                    )}
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
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        fontWeight: '500',
    },
    retryButton: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
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

    // Analytics
    analyticsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
        backgroundColor: '#FFF',
    },
    analyticsCard: {
        flex: 1,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
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

    // Search & Filter
    searchFilterSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
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
        backgroundColor: '#EEF2FF',
        borderColor: '#4F46E5',
    },
    filterChipText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#4F46E5',
    },

    // Exams Section
    examsSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
    },
    examCard: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
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
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 8,
        gap: 8,
    },
    statIconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    statLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
    },

    // Card Footer
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0F172A',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
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
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
        marginRight: 12,
    },
    modalBody: {
        padding: 20,
    },
    modalSection: {
        marginBottom: 24,
    },
    modalSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modalStatsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    modalStatItem: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    modalStatValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    modalStatLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    modalDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalDetailLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    modalDetailValue: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '600',
    },
});

export default MyExamsScreen;

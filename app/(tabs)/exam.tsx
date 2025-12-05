import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { applyExamFilters } from '@/utils/examFilter';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import ExamCard from '../../components/ExamCard';

export default function ExamScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [exams, setExams] = useState<any[]>([]);
    const [filteredExams, setFilteredExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [categories, setCategories] = useState<string[]>([]);
    const [remainingTime, setRemainingTime] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Animation refs
    const floatAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const fetchExams = async () => {
        if (!user?.token) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await apiFetchAuth('/student/exams', user.token);
            if (response.ok) {
                setExams(response.data);
                setFilteredExams(response.data);
                
                // Extract unique categories from actual exam data only
                const uniqueCategories = [...new Set(
                    response.data
                        .map((exam: any) => exam.category)
                        .filter((category: any) => category && typeof category === 'string')
                )] as string[];
                
                // Debug: Log available categories from exam data
                
                // Check if there are any uncategorized exams
                const hasUncategorized = response.data.some((exam: any) => !exam.category || exam.category === null);
                const finalCategories = hasUncategorized ? [...uniqueCategories, 'Uncategorized'] : uniqueCategories;
                
                setCategories(finalCategories);
            } else {
                setError(response.data?.message || 'Failed to fetch exams');
            }
        } catch (err: any) {
            setError(err.data?.message || 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchExams();
        } catch (error) {
            console.error('Error refreshing:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, [user]);

    // Start header animations
    useEffect(() => {
        // Float animation
        const floatAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        );

        // Pulse animation
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );

        floatAnimation.start();
        pulseAnimation.start();
    }, []);

    // Calculate remaining time for the earliest ending exam
    useEffect(() => {
        const calculateRemainingTime = () => {
            if (filteredExams.length === 0) {
                setRemainingTime('');
                return;
            }

            const now = new Date();
            let earliestEndTime: Date | null = null;

            // Find the exam that ends earliest
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
        calculateRemainingTime(); // Initial call
        return () => clearInterval(timer);
    }, [filteredExams]);

    // Filter exams based on selected category and search query
    useEffect(() => {
        const filtered = applyExamFilters(exams, {
            category: selectedCategory,
            searchQuery: searchQuery,
            includeExpired: false // Filter out expired exams
        });
        
        setFilteredExams(filtered);
    }, [selectedCategory, exams, searchQuery]);

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
    };

    const renderExamCard = ({ item }: { item: any }) => (
        <ExamCard exam={item} navigation={router} />
    );

    const renderCategoryButton = (category: string) => {
        const isSelected = selectedCategory === category;
        const displayName = category === 'Uncategorized' ? 'Uncategorized' : category;
        return (
            <TouchableOpacity
                key={category}
                style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
                onPress={() => handleCategorySelect(category)}
            >
                <LinearGradient
                    colors={isSelected ? ['#8B5CF6', '#7C3AED'] : ['#FFFFFF', '#F8FAFC']}
                    style={styles.categoryButtonGradient}
                >
                    <Text style={[styles.categoryButtonText, isSelected && styles.categoryButtonTextSelected]}>
                        {displayName}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AppColors.primary} />
                    <Text style={styles.loadingText}>Loading Exams...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={AppColors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => {
                            setError(null);
                            setLoading(true);
                            // Re-fetch exams
                            fetchExams();
                        }}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Enhanced Search Bar */}
            <View style={styles.searchContainer}>
                <LinearGradient
                    colors={['rgba(139, 92, 246, 0.05)', 'rgba(124, 58, 237, 0.03)']}
                    style={styles.searchGradient}
                >
                    <View style={styles.searchInputContainer}>
                        <View style={styles.searchIconContainer}>
                            <Ionicons name="search" size={22} color="#8B5CF6" />
                        </View>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for exams..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={() => setSearchQuery('')}
                            >
                                <Ionicons name="close-circle" size={24} color="#8B5CF6" />
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>
            </View>

            {/* Enhanced Category Filter */}
            {categories.length > 0 && (
                <View style={styles.categoryContainer}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryScrollContainer}
                    >
                        <TouchableOpacity
                            style={[styles.categoryButton, selectedCategory === 'all' && styles.categoryButtonSelected]}
                            onPress={() => handleCategorySelect('all')}
                        >
                            <LinearGradient
                                colors={selectedCategory === 'all' ? ['#8B5CF6', '#7C3AED'] : ['#FFFFFF', '#F8FAFC']}
                                style={styles.categoryButtonGradient}
                            >
                                <Text style={[styles.categoryButtonText, selectedCategory === 'all' && styles.categoryButtonTextSelected]}>
                                    All
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        {categories.map(renderCategoryButton)}
                    </ScrollView>
                </View>
            )}

            {/* Enhanced Exams List */}
            {filteredExams.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <LinearGradient
                        colors={['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.05)']}
                        style={styles.emptyIconContainer}
                    >
                        <Animated.View
                            style={{
                                transform: [{ scale: pulseAnim }]
                            }}
                        >
                            <Ionicons name="library-outline" size={64} color="#8B5CF6" />
                        </Animated.View>
                    </LinearGradient>
                    <Text style={styles.emptyTitle}>
                        {searchQuery.trim() 
                            ? 'No Matching Exams' 
                            : selectedCategory === 'all' 
                                ? 'No Exams Available' 
                                : selectedCategory === 'uncategorized' 
                                    ? 'No Uncategorized Exams' 
                                    : `No ${selectedCategory} Exams`
                        }
                    </Text>
                    <Text style={styles.emptySubtext}>
                        {searchQuery.trim()
                            ? `No exams found matching "${searchQuery}". Try a different search term.`
                            : selectedCategory === 'all' 
                                ? 'Check back later for new live exams.'
                                : selectedCategory === 'uncategorized'
                                ? 'No exams without categories available.'
                                : `No exams available in ${selectedCategory} category.`
                        }
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredExams}
                    renderItem={renderExamCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.examListContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.lightGrey,
    },
    examListContainer: {
        paddingBottom: 32,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '600',
        color: AppColors.darkGrey,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: AppColors.error,
        marginTop: 16,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: AppColors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },

    statsBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    statsNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.white,
    },
    statsLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    searchContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    searchGradient: {
        borderRadius: 10,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    searchIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#374151',
        paddingVertical: 0,
        fontWeight: '400',
    },
    clearButton: {
        padding: 6,
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        backgroundColor: '#FAFBFF',
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        // Shadow removed for better Android appearance
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        marginTop: 16,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    emptySubtext: {
        fontSize: 16,
        color: '#64748B',
        marginTop: 12,
        textAlign: 'center',
        lineHeight: 24,
        letterSpacing: 0.3,
    },
    listContainer: {
        padding: 15,
    },
    categoryContainer: {
        paddingVertical: 15,
        paddingHorizontal: 15,
        backgroundColor: '#FFFFFF',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    categoryScrollContainer: {
        paddingHorizontal: 10,
    },
    categoryButton: {
        marginRight: 10,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryButtonSelected: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    categoryButtonGradient: {
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minWidth: 80,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    categoryButtonText: {
        fontSize: 14,
        color: AppColors.darkGrey,
        fontWeight: '500',
    },
    categoryButtonTextSelected: {
        fontWeight: 'bold',
        color: AppColors.white,
    },
}); 

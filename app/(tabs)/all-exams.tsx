import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { applyExamFilters } from '@/utils/examFilter';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ExamCard from '../../components/ExamCard';

export default function AllExamsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [exams, setExams] = useState<any[]>([]);
    const [filteredExams, setFilteredExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [categories, setCategories] = useState<string[]>([]);
    const [remainingTime, setRemainingTime] = useState('');

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
                
                // Extract unique categories from exams
                const uniqueCategories = [...new Set(
                    response.data
                        .map((exam: any) => exam.category)
                        .filter((category: any) => category && typeof category === 'string')
                )] as string[];
                
                // Check if there are any uncategorized exams
                const hasUncategorized = response.data.some((exam: any) => !exam.category || exam.category === null);
                const allCategories = hasUncategorized ? [...uniqueCategories, 'uncategorized'] : uniqueCategories;
                
                setCategories(allCategories);
            } else {
                setError(response.data?.message || 'Failed to fetch exams');
            }
        } catch (err: any) {
            setError(err.data?.message || 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, [user]);

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
                const endTime = new Date(exam.endTime);
                if (!earliestEndTime || endTime < earliestEndTime) {
                    earliestEndTime = endTime;
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

    // Filter exams based on selected category
    useEffect(() => {
        const filtered = applyExamFilters(exams, {
            category: selectedCategory,
            includeExpired: false // Filter out expired exams
        });
        
        setFilteredExams(filtered);
    }, [selectedCategory, exams]);

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
    };

    const renderExamCard = ({ item }: { item: any }) => (
        <View style={styles.examCardContainer}>
            <ExamCard exam={item} navigation={router} />
        </View>
    );

    const renderCategoryButton = (category: string) => {
        const isSelected = selectedCategory === category;
        const displayName = category === 'uncategorized' ? 'Uncategorized' : category;
        return (
            <TouchableOpacity
                key={category}
                style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
                onPress={() => handleCategorySelect(category)}
            >
                <Text style={[styles.categoryButtonText, isSelected && styles.categoryButtonTextSelected]}>
                    {displayName}
                </Text>
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
            <Stack.Screen options={{ 
                title: 'All Exams',
                headerStyle: { backgroundColor: AppColors.primary },
                headerTintColor: AppColors.white,
                headerTitleStyle: { fontWeight: 'bold' },
             }} />
            
            {/* Header */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerIconContainer}>
                            <Ionicons name="library-outline" size={28} color={AppColors.white} />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>All Exams</Text>
                            <Text style={styles.headerSubtitle}>
                                {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''} available
                                {remainingTime && ` • Ends in ${remainingTime}`}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={styles.refreshButton}
                        onPress={() => {
                            setLoading(true);
                            fetchExams();
                        }}
                    >
                        <Ionicons name="refresh" size={24} color={AppColors.white} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Category Filter */}
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
                            <Text style={[styles.categoryButtonText, selectedCategory === 'all' && styles.categoryButtonTextSelected]}>
                                All
                            </Text>
                        </TouchableOpacity>
                        {categories.map(renderCategoryButton)}
                    </ScrollView>
                </View>
            )}

            {/* Exams List */}
            {filteredExams.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="library-outline" size={64} color={AppColors.grey} />
                    <Text style={styles.emptyTitle}>
                        {selectedCategory === 'all' ? 'No Exams Available' : 
                         selectedCategory === 'uncategorized' ? 'No Uncategorized Exams' :
                         `No ${selectedCategory} Exams`}
                    </Text>
                    <Text style={styles.emptySubtext}>
                        {selectedCategory === 'all' 
                            ? 'Check back later for new exams.'
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
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
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
    header: {
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppColors.white,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    refreshButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: AppColors.grey,
        marginTop: 8,
        textAlign: 'center',
    },
    listContainer: {
        padding: 15,
    },
    examCardContainer: {
        marginBottom: 15,
    },
    categoryContainer: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    categoryScrollContainer: {
        paddingHorizontal: 10,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: AppColors.grey,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: AppColors.white,
        minWidth: 80,
        alignItems: 'center',
    },
    categoryButtonSelected: {
        borderColor: AppColors.primary,
        backgroundColor: AppColors.primary,
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

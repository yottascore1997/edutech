import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface PracticeExamDetails {
    id: string;
    title: string;
    description: string;
    category: string;
    subcategory: string;
    startTime: string;
    endTime: string;
    duration: number;
    spots: number;
    spotsLeft: number;
    attempted: boolean;
}

interface LeaderboardEntry {
    rank: number;
    name: string;
    userId: string;
    score: number;
    timeTaken?: number;
    completedAt?: string;
}

interface LeaderboardResponse {
    currentUser: LeaderboardEntry | null;
    leaderboard: LeaderboardEntry[];
}

const PracticeExamDetailsScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [exam, setExam] = useState<PracticeExamDetails | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Info');
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);
    const [declarationChecked, setDeclarationChecked] = useState(false);
    const [instructions, setInstructions] = useState<string[]>([]);
    const [examMeta, setExamMeta] = useState<{ duration?: string; maxMarks?: string } | null>(null);
    const [instructionsLoading, setInstructionsLoading] = useState(false);
    const [joiningExam, setJoiningExam] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [resultLoading, setResultLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    // Advanced Animation States
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const cardAnimations = useRef(Array(3).fill(0).map(() => new Animated.Value(0))).current;
    const tabAnimations = useRef(Array(3).fill(0).map(() => new Animated.Value(0))).current;

    useEffect(() => {
        if (id) {
            fetchExamDetails();
            fetchLeaderboard();
        }
    }, [id]);

    // Fetch leaderboard when tab is clicked
    useEffect(() => {
        if (activeTab === 'Leaderboard' && id && user?.token) {
            console.log('Leaderboard tab clicked, fetching data...');
            fetchLeaderboard();
        }
    }, [activeTab, id, user?.token]);

    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (id && user?.token) {
                fetchExamDetails();
                fetchLeaderboard();
            }
        }, [id, user?.token])
    );


    const fetchExamDetails = async () => {
        if (!user?.token || !id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await apiFetchAuth(`/student/practice-exams/${id}`, user.token);
            if (response.ok) {
                setExam(response.data);
                if (response.data.instructions) {
                    setInstructions(response.data.instructions.list || []);
                    setExamMeta({
                        duration: response.data.instructions.duration,
                        maxMarks: response.data.instructions.maxMarks,
                    });
                } else {
                    setInstructions([]);
                    setExamMeta(null);
                }
            } else {
                Alert.alert('Error', 'Failed to load exam details.');
            }
        } catch (error) {
            console.error('Error fetching exam details:', error);
            Alert.alert('Error', 'Failed to load exam details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        if (!user?.token || !id) return;

        try {
            setLeaderboardLoading(true);
            console.log('Fetching practice exam leaderboard for ID:', id);
            const response = await apiFetchAuth(`/student/practice-exams/${id}/leaderboard`, user.token);
            console.log('Practice exam leaderboard response:', response);
            
            if (response.ok) {
                const data: LeaderboardResponse = response.data;
                setCurrentUser(data.currentUser);
                
                // Sort leaderboard by rank to ensure proper order
                const sortedLeaderboard = (data.leaderboard || []).sort((a, b) => {
                    const rankA = typeof a.rank === 'string' ? parseInt(a.rank, 10) : a.rank;
                    const rankB = typeof b.rank === 'string' ? parseInt(b.rank, 10) : b.rank;
                    return rankA - rankB;
                });
                
                setLeaderboard(sortedLeaderboard);
            } else {
                console.error('Failed to fetch practice exam leaderboard:', response.data);
                setCurrentUser(null);
                setLeaderboard([]);
            }
        } catch (error) {
            console.error('Error fetching practice exam leaderboard:', error);
            setCurrentUser(null);
            setLeaderboard([]);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([fetchExamDetails(), fetchLeaderboard()]);
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setRefreshing(false);
        }
    };

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

    const getSpotsPercentage = (spots: number, spotsLeft: number) => {
        return ((spots - spotsLeft) / spots) * 100;
    };

    const handleStartExam = async () => {
        if (!id || !user?.token || !exam) return;
        console.log('Starting exam with user ID:', user.id, 'Exam ID:', id);
        setJoiningExam(true);
        try {
            const joinRes = await apiFetchAuth('/student/practice-exams/join', user.token, {
                method: 'POST',
                body: { examId: id },
                headers: { 'Content-Type': 'application/json' },
            });
            if (joinRes.ok) {
                console.log('Successfully joined exam');
                setJoiningExam(false);
                router.push({ pathname: '/(tabs)/practice-exam/questions', params: { id, duration: String(exam.duration) } });
            } else {
                setJoiningExam(false);
                Alert.alert('Error', 'Could not join the exam.');
            }
        } catch (e) {
            console.error('Error joining exam:', e);
            setJoiningExam(false);
            Alert.alert('Error', 'Could not join the exam.');
        }
    };

    const handleBeginExam = async () => {
        if (!id || !user?.token || !exam) return;
        console.log('Starting exam with user ID:', user.id, 'Exam ID:', id);
        setJoiningExam(true);
        try {
            const joinRes = await apiFetchAuth('/student/practice-exams/join', user.token, {
                method: 'POST',
                body: { examId: id },
                headers: { 'Content-Type': 'application/json' },
            });
            if (joinRes.ok) {
                console.log('Successfully joined exam');
                setShowInstructionsModal(false);
                setJoiningExam(false);
                router.push({ pathname: '/(tabs)/practice-exam/questions', params: { id, duration: String(exam.duration) } });
            } else {
                setJoiningExam(false);
                Alert.alert('Error', 'Could not join the exam.');
            }
        } catch (e) {
            console.error('Error joining exam:', e);
            setJoiningExam(false);
            Alert.alert('Error', 'Could not join the exam.');
        }
    };

    const handleReviewExam = () => {
        Alert.alert(
            'Review Practice Exam',
            `Would you like to review your attempt for "${exam?.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Review', 
                    onPress: () => {
                        console.log('Reviewing practice exam:', exam?.id);
                        Alert.alert('Success', 'Opening review...');
                    }
                }
            ]
        );
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return '1🏆';
            case 2:
                return '2🥈';
            case 3:
                return '3🥉';
            default:
                return `${rank}`;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return '#FFD700';
            case 2:
                return '#C0C0C0';
            case 3:
                return '#CD7F32';
            default:
                return AppColors.grey;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AppColors.primary} />
                    <Text style={styles.loadingText}>Loading Exam Details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!exam) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={AppColors.error} />
                    <Text style={styles.errorText}>Exam not found</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const progress = getSpotsPercentage(exam.spots, exam.spotsLeft);

    return (
        <SafeAreaView style={styles.container}>
            {/* Instructions Modal */}
            <Modal
                visible={showInstructionsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowInstructionsModal(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowInstructionsModal(false)}
                >
                    <TouchableOpacity 
                        style={styles.enhancedModalContent}
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Enhanced Header with Purple Theme */}
                        <LinearGradient
                            colors={['#4F46E5', '#7C3AED', '#8B5CF6', '#A855F7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.modalHeaderGradient}
                        >
                            <View style={styles.enhancedModalHeader}>
                                <View style={styles.modalTitleContainer}>
                                    <View style={styles.modalIconContainer}>
                                        <Ionicons name="book" size={28} color="#fff" />
                                    </View>
                                    <View style={styles.modalTitleWrapper}>
                                        <Text style={styles.enhancedModalTitle}>Practice Exam Instructions</Text>
                                        <Text style={styles.modalSubtitle}>Get ready to start your exam</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={styles.enhancedCloseButton}
                                    onPress={() => setShowInstructionsModal(false)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="close-circle" size={28} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        <View style={styles.modalBodyContainer}>
                            <ScrollView 
                                style={styles.enhancedInstructionsScroll} 
                                showsVerticalScrollIndicator={true}
                                contentContainerStyle={styles.scrollContentContainer}
                                scrollEnabled={true}
                                nestedScrollEnabled={true}
                                bounces={true}
                            >
                                {/* Instructions Section */}
                                <View style={styles.instructionsSection}>
                                    
                                    <View style={styles.instructionsCard}>
                                        <View style={styles.instructionItem}>
                                            <View style={styles.instructionNumber}>
                                                <Text style={styles.instructionNumberText}>1</Text>
                                            </View>
                                            <Text style={styles.instructionText}>Read each question carefully and understand the requirements before selecting your answer</Text>
                                        </View>
                                        
                                        <View style={styles.instructionItem}>
                                            <View style={styles.instructionNumber}>
                                                <Text style={styles.instructionNumberText}>2</Text>
                                            </View>
                                            <Text style={styles.instructionText}>Use the navigation buttons to move between questions and review your answers</Text>
                                        </View>
                                        
                                        <View style={styles.instructionItem}>
                                            <View style={styles.instructionNumber}>
                                                <Text style={styles.instructionNumberText}>3</Text>
                                            </View>
                                            <Text style={styles.instructionText}>Ensure you have a stable internet connection throughout the exam</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Quick Tips Section */}
                                <View style={styles.tipsSection}>
                                    <View style={styles.tipsHeader}>
                                        <Ionicons name="bulb" size={24} color="#F59E0B" />
                                        <Text style={styles.tipsTitle}>Quick Tips</Text>
                                    </View>
                                    
                                    <View style={styles.tipsCard}>
                                        <View style={styles.tipItem}>
                                            <View style={styles.tipIcon}>
                                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                            </View>
                                            <Text style={styles.tipText}>Read each question carefully before answering</Text>
                                        </View>
                                        
                                        <View style={styles.tipItem}>
                                            <View style={styles.tipIcon}>
                                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                            </View>
                                            <Text style={styles.tipText}>Use navigation buttons to review your answers</Text>
                                        </View>
                                        
                                        <View style={styles.tipItem}>
                                            <View style={styles.tipIcon}>
                                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                            </View>
                                            <Text style={styles.tipText}>Ensure stable internet connection throughout</Text>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>

                        {/* Enhanced Action Buttons */}
                        <View style={styles.enhancedModalActions}>
                            <TouchableOpacity 
                                style={[
                                    styles.enhancedBeginButton,
                                    joiningExam && styles.enhancedBeginButtonDisabled
                                ]}
                                onPress={handleBeginExam}
                                disabled={joiningExam}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={joiningExam ? ['#9CA3AF', '#6B7280'] : ['#4F46E5', '#7C3AED', '#8B5CF6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.beginButtonGradient}
                                >
                                    {joiningExam ? (
                                        <View style={styles.loadingContent}>
                                            <ActivityIndicator size="small" color="#fff" />
                                            <Text style={styles.enhancedBeginButtonText}>Starting...</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.beginButtonContent}>
                                            <Ionicons name="play" size={20} color="#fff" />
                                            <Text style={styles.enhancedBeginButtonText}>Start</Text>
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.enhancedCancelButton}
                                onPress={() => setShowInstructionsModal(false)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cancelButtonContent}>
                                    <Ionicons name="close" size={20} color="#6B7280" />
                                    <Text style={styles.enhancedCancelButtonText}>Cancel</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Enhanced Header Section - Like Live Exam */}
            <LinearGradient
                colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.enhancedMainHeader}
            >
                {/* Background Pattern */}
                <View style={styles.headerPattern}>
                    <View style={styles.patternCircle1} />
                    <View style={styles.patternCircle2} />
                    <View style={styles.patternCircle3} />
                </View>
                
                <View style={styles.enhancedHeaderContent}>
                    <View style={styles.headerTitleSection}>
                        <View style={styles.headerIconWrapper}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                                style={styles.headerIconGradient}
                            >
                                <Ionicons name="document-text" size={28} color="#FFFFFF" />
                            </LinearGradient>
                        </View>
                        <View style={styles.headerTextWrapper}>
                            <Text style={styles.enhancedHeaderTitle}>{exam?.title || 'Practice Exam'}</Text>
                            <Text style={styles.enhancedHeaderSubtitle}>
                                {exam?.category} • {exam?.duration} minutes • {exam?.spotsLeft} spots left
                            </Text>
                        </View>
                    </View>

                    {/* Info Section - Like Live Exam */}
                    <View style={styles.headerInfoSection}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.12)']}
                            style={styles.headerInfoGradient}
                        >
                            <View style={styles.headerInfoContent}>
                                <View style={styles.infoItem}>
                                    <View style={styles.infoIconContainer}>
                                        <LinearGradient
                                            colors={["#FF6CAB", "#7366FF"]}
                                            style={styles.infoIconGradient}
                                        >
                                            <Ionicons name="person" size={18} color="#fff" />
                                        </LinearGradient>
                                    </View>
                                    <Text style={styles.infoLabel}>Status</Text>
                                    <Text style={styles.infoValue}>{exam?.attempted ? 'Completed' : 'Available'}</Text>
                                </View>
                                
                                <View style={styles.vsContainer}>
                                    <LinearGradient
                                        colors={["#FFD452", "#FF6CAB"]}
                                        style={styles.vsGradient}
                                    >
                                        <Text style={styles.vsText}>VS</Text>
                                    </LinearGradient>
                                </View>
                                
                                <View style={styles.infoItem}>
                                    <View style={styles.infoIconContainer}>
                                        <LinearGradient
                                            colors={["#6C63FF", "#FF6CAB"]}
                                            style={styles.infoIconGradient}
                                        >
                                            <Ionicons name="trophy" size={18} color="#fff" />
                                        </LinearGradient>
                                    </View>
                                    <Text style={styles.infoLabel}>Best Score</Text>
                                    <Text style={styles.infoValue}>{result?.score || '0'}</Text>
                                </View>
                                
                                <View style={styles.timerContainer}>
                                    <LinearGradient
                                        colors={["#6C63FF", "#7366FF"]}
                                        style={styles.timerGradient}
                                    >
                                        <Ionicons name="time" size={16} color="#fff" />
                                        <Text style={styles.timerText}>
                                            {exam?.duration}m
                                        </Text>
                                    </LinearGradient>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                </View>
            </LinearGradient>

            <View style={styles.tabContainer}>
                {['Info', 'Leaderboard'].map(tabName => (
                    <TouchableOpacity 
                        key={tabName} 
                        style={[styles.tab, activeTab === tabName && styles.activeTab]}
                        onPress={() => setActiveTab(tabName)}
                    >
                        <Text style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>
                            {tabName}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList 
              style={styles.content} 
              data={[{ key: 'content' }]}
              renderItem={() => (
                <View style={styles.contentContainer}>
                  {activeTab === 'Info' && (
                    <View style={styles.infoContainer}>

                      {/* Exam Details */}
                      <View style={styles.enhancedOverviewCard}>
                        <View style={styles.cardHeader}>
                          <View style={styles.iconContainer}>
                            <Ionicons name="information-circle" size={24} color="#667eea" />
                          </View>
                          <Text style={styles.enhancedOverviewTitle}>Exam Details</Text>
                        </View>
                        <View style={styles.enhancedDetailsGrid}>
                          {exam.description && (
                            <View style={styles.descriptionItem}>
                              <Ionicons name="document-text" size={20} color="#667eea" />
                              <View style={styles.descriptionContainer}>
                                <Text style={styles.detailLabel}>Description</Text>
                                <Text style={styles.detailValue}>{exam.description}</Text>
                              </View>
                            </View>
                          )}
                          <View style={styles.detailItem}>
                            <Ionicons name="folder-outline" size={20} color="#667eea" />
                            <View>
                              <Text style={styles.detailLabel}>Category</Text>
                              <Text style={styles.detailValue}>{exam.category}</Text>
                            </View>
                          </View>
                          {exam.subcategory && (
                            <View style={styles.detailItem}>
                              <Ionicons name="folder-open-outline" size={20} color="#667eea" />
                              <View>
                                <Text style={styles.detailLabel}>Subcategory</Text>
                                <Text style={styles.detailValue}>{exam.subcategory}</Text>
                              </View>
                            </View>
                          )}
                          <View style={styles.detailItem}>
                            <Ionicons name="time-outline" size={20} color="#667eea" />
                            <View>
                              <Text style={styles.detailLabel}>Duration</Text>
                              <Text style={styles.detailValue}>{exam.duration} minutes</Text>
                            </View>
                          </View>
                          <View style={styles.detailItem}>
                            <Ionicons name="help-circle-outline" size={20} color="#667eea" />
                            <View>
                              <Text style={styles.detailLabel}>Questions</Text>
                              <Text style={styles.detailValue}>{examMeta?.maxMarks || 'Not specified'}</Text>
                            </View>
                          </View>
                          <View style={styles.detailItem}>
                            <Ionicons name="trophy-outline" size={20} color="#667eea" />
                            <View>
                              <Text style={styles.detailLabel}>Max Marks</Text>
                              <Text style={styles.detailValue}>{examMeta?.maxMarks || 'Not specified'}</Text>
                            </View>
                          </View>
                          <View style={styles.detailItem}>
                            <Ionicons name="people-outline" size={20} color="#667eea" />
                            <View>
                              <Text style={styles.detailLabel}>Available Spots</Text>
                              <Text style={styles.detailValue}>{exam.spotsLeft} / {exam.spots}</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Action Button */}
                      <TouchableOpacity 
                        style={[
                          styles.enhancedActionButton,
                          exam.attempted ? styles.enhancedReviewButton : styles.enhancedStartButton,
                          joiningExam && styles.enhancedActionButtonDisabled
                        ]}
                        onPress={exam.attempted ? handleReviewExam : handleStartExam}
                        disabled={joiningExam}
                      >
                        <LinearGradient
                          colors={exam.attempted ? ['#ff6b6b', '#ee5a52'] : ['#8B5CF6', '#7C3AED']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.actionButtonGradient}
                        >
                          {joiningExam ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons 
                                name={exam.attempted ? "eye" : "play"} 
                                size={24} 
                                color="#fff" 
                              />
                              <Text style={styles.enhancedActionButtonText}>
                                {exam.attempted ? 'Review Results' : 'Start Practice Exam'}
                              </Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}

                  {activeTab === 'Leaderboard' && (
                    <View style={styles.leaderboardContainer}>
                      {leaderboardLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color="#667eea" />
                          <Text style={styles.loadingText}>Loading Leaderboard...</Text>
                        </View>
                      ) : leaderboard.length > 0 ? (
                        <ScrollView 
                          style={styles.leaderboardScrollView}
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={styles.leaderboardScrollContent}
                        >


                          {/* Current User Section */}
                          {currentUser && (
                            <View style={styles.currentUserSection}>
                              <Text style={styles.currentUserTitle}>Your Performance</Text>
                              <View style={[styles.currentUserCard, currentUser.rank <= 3 && styles.currentUserTopThree]}>
                                  <View style={styles.currentUserLeft}>
                                  <View style={styles.currentUserRank}>
                                    <Text style={styles.currentUserRankText}>#{currentUser.rank} / {leaderboard.length}</Text>
                                    </View>
                                  <Ionicons name="person-circle" size={40} color={AppColors.primary} />
                                    <View style={styles.currentUserInfo}>
                                      <Text style={styles.currentUserName}>{currentUser.name}</Text>
                                    <Text style={styles.currentUserScoreLabel}>Your Score</Text>
                                    </View>
                                  </View>
                                  <View style={styles.currentUserRight}>
                                  <Text style={styles.currentUserScore}>{currentUser.score} pts</Text>
                                      <Text style={styles.currentUserTime}>{currentUser.timeTaken || 0}s</Text>
                                    </View>
                                  </View>
                            </View>
                          )}


                          {/* All Participants */}
                          {leaderboard.length > 0 && (
                            <View style={styles.otherUsersSection}>
                              <Text style={styles.otherUsersTitle}>All Participants</Text>
                            {leaderboard.map((item, index) => (
                                <LeaderboardRow
                                  key={item.userId || `user-${index}`}
                                  rank={item.rank || (index + 1)}
                                  name={item.name}
                                  score={item.score}
                                  timeTaken={item.timeTaken}
                                  isCurrentUser={currentUser?.userId === item.userId}
                                  isTopThree={index < 3}
                                />
                            ))}
                          </View>
                          )}
                        </ScrollView>
                      ) : (
                        <View style={styles.emptyContainer}>
                          <View style={styles.emptyIconContainer}>
                            <Ionicons name="trophy-outline" size={64} color="#667eea" />
                          </View>
                          <Text style={styles.emptyTitle}>No Leaderboard Data</Text>
                          <Text style={styles.emptySubtext}>
                            Be the first to attempt this exam and see your ranking!
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                </View>
              )}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.lightGrey,
    },
    // Enhanced Header Styles - Like Live Exam
    enhancedMainHeader: {
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    headerPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.15,
    },
    patternCircle1: {
        position: 'absolute',
        top: 15,
        right: 25,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    patternCircle2: {
        position: 'absolute',
        bottom: 30,
        left: 15,
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    patternCircle3: {
        position: 'absolute',
        top: 45,
        left: 40,
        width: 25,
        height: 25,
        borderRadius: 12.5,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    enhancedHeaderContent: {
        position: 'relative',
        zIndex: 1,
    },
    headerTitleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerIconWrapper: {
        marginRight: 12,
    },
    headerIconGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    headerTextWrapper: {
        flex: 1,
    },
    enhancedHeaderTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    enhancedHeaderSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    headerInfoSection: {
        marginBottom: 16,
    },
    headerInfoGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    headerInfoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    infoItem: {
        alignItems: 'center',
        flex: 1,
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    infoIconGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 10,
        color: '#fff',
        marginBottom: 2,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    vsContainer: {
        alignItems: 'center',
        marginHorizontal: 8,
    },
    vsGradient: {
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    vsText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    timerContainer: {
        alignItems: 'center',
        marginLeft: 8,
    },
    timerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    timerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 4,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    headerProgressSection: {
        marginTop: 8,
    },
    progressSectionGradient: {
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    progressDotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDot: {
        marginHorizontal: 6,
    },
    progressDotGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    progressText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.error,
        marginTop: 16,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        marginRight: 15,
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppColors.white,
        flex: 1,
    },
    placeholder: {
        flex: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: AppColors.white,
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: AppColors.primary,
    },
    tabText: {
        fontSize: 16,
        color: AppColors.grey,
        fontWeight: '500',
    },
    activeTabText: {
        color: AppColors.primary,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    infoContainer: {
        gap: 20,
    },
    overviewCard: {
        backgroundColor: AppColors.white,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    overviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    overviewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginLeft: 10,
    },
    overviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    overviewText: {
        fontSize: 16,
        color: AppColors.darkGrey,
        flex: 1,
    },
    spotsCard: {
        backgroundColor: AppColors.white,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    spotsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 15,
    },
    spotsInfo: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    spotsLeft: {
        alignItems: 'center',
    },
    spotsTotal: {
        alignItems: 'center',
    },
    spotsNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    spotsLabel: {
        fontSize: 14,
        color: AppColors.grey,
        marginTop: 4,
    },
    progressBar: {
        height: 8,
        backgroundColor: AppColors.lightGrey,
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: AppColors.primary,
        borderRadius: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 12,
        gap: 10,
    },
    startButton: {
        backgroundColor: '#10B981',
    },
    reviewButton: {
        backgroundColor: AppColors.success,
    },
    actionButtonText: {
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    leaderboardContainer: {
        flex: 1,
        gap: 20,
    },
    leaderboardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 8,
        textAlign: 'center',
    },
    leaderboardSubtitle: {
        fontSize: 16,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 15,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },

    resultsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    resultCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        width: '100%',
        maxWidth: 400,
    },
    resultHeader: {
        alignItems: 'center',
        marginBottom: 18,
    },
    resultTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
    },
    resultScore: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
        marginBottom: 10,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
        width: '100%',
    },
    summaryCard: {
        flex: 1,
        marginHorizontal: 4,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryCardValue: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
    },
    summaryCardLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    analysisButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 18,
        backgroundColor: '#f6f8fb',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },
    analysisButtonText: {
        color: '#6C63FF',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 8,
    },
    backButtonText: {
        color: AppColors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 100,
    },
    modalContainer: {
        width: '92%',
        maxHeight: '90%',
        backgroundColor: AppColors.white,
        borderRadius: 18,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    modalContent: {
        marginBottom: 16,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    metaText: {
        fontSize: 15,
        color: AppColors.darkGrey,
    },
    metaValue: {
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    instructionsHeading: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 8,
    },
    instructionsList: {
        marginBottom: 16,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    instructionIndex: {
        fontWeight: 'bold',
        color: AppColors.primary,
        marginRight: 6,
    },
    instructionText: {
        flex: 1,
        color: AppColors.darkGrey,
        fontSize: 15,
    },
    declarationHeading: {
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 6,
        fontSize: 16,
    },
    declarationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: AppColors.primary,
        backgroundColor: AppColors.white,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
    },
    declarationText: {
        flex: 1,
        color: AppColors.darkGrey,
        fontSize: 14,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    modalButtonPrimary: {
        backgroundColor: AppColors.primary,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
        minWidth: 140,
        alignItems: 'center',
    },
    modalButtonPrimaryText: {
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 15,
    },
    modalButtonSecondary: {
        backgroundColor: AppColors.lightGrey,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    modalButtonSecondaryText: {
        color: AppColors.primary,
        fontWeight: 'bold',
        fontSize: 15,
    },
    modalButtonDisabled: {
        backgroundColor: AppColors.grey,
    },
    modalLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 120,
    },
    descriptionText: {
        color: AppColors.darkGrey,
        fontSize: 15,
    },
    currentUserCard: {
        backgroundColor: '#fffbe6',
        borderRadius: 16,
        padding: 18,
        marginBottom: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    currentUserHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    currentUserLabel: {
        color: '#bfa100',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 8,
    },
    currentUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currentUserRankContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    currentUserRank: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#bfa100',
    },
    currentUserRankLabel: {
        fontSize: 14,
        color: '#bfa100',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    currentUserAvatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentUserDetails: {
        flexDirection: 'column',
        marginLeft: 10,
    },
    currentUserName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#222',
    },
    currentUserScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a73e8',
    },
    currentUserBadge: {
        backgroundColor: '#1a73e8',
        borderRadius: 12,
        paddingHorizontal: 4,
        paddingVertical: 2,
        marginLeft: 8,
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 12,
    },
    currentUserNameText: {
        color: '#222',
    },
    currentUserScoreText: {
        color: '#1a73e8',
    },
    podiumSection: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingVertical: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    podiumItem: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 8,
        borderRadius: 20,
        overflow: 'hidden',
    },
    podiumMedal: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    podiumName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 4,
    },
    podiumScore: {
        fontSize: 14,
        color: AppColors.grey,
    },
    podiumRank: {
        fontSize: 14,
        color: AppColors.grey,
        fontWeight: 'bold',
    },
    leaderboardCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    leaderboardListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 10,
    },
    leaderboardList: {
        padding: 10,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        marginBottom: 6,
        marginHorizontal: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        minHeight: 50,
    },
    currentUserRow: {
        backgroundColor: '#FFE4E6',
        borderColor: '#FF6B6B',
        borderWidth: 2,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    avatar: {
        marginHorizontal: 8,
        color: '#667eea',
    },
    rankContainer: {
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    userInfo: {
        flex: 1,
        marginRight: 10,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 2,
    },
    userHandle: {
        fontSize: 12,
        color: '#718096',
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    scoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#667eea',
        marginLeft: 4,
    },
  
    timeText: {
        fontSize: 12,
        color: '#718096',
        textAlign: 'right',
    },
    leaderboardNameText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#2D3748',
        marginRight: 8,
    },
    leaderboardScoreText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#667eea',
    },
    prizeAmountText: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '600',
        marginTop: 2,
    },
   
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6c757d',
    },
    nameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
   
    currentUserBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    scoreSection: {
        alignItems: 'flex-end',
    },
   
    scoreLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    emptyLeaderboard: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyLeaderboardText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
        fontWeight: '600',
    },
    emptyLeaderboardSubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
    podiumFirst: {
        transform: [{ translateY: -25 }],
        zIndex: 2,
    },
    podiumGradient: {
        width: '100%',
        padding: 16,
        alignItems: 'center',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    crownContainer: {
        marginBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    podiumAvatar: {
        marginBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 35,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    
 
    podiumRankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    leaderboardListSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
  

    rankNumberContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
 
    userAvatar: {
        marginRight: 12,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderRadius: 20,
        padding: 4,
    },
 
    scoreContainer: {
        alignItems: 'flex-end',
    },
    userScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#667eea',
    },

    podiumTime: {
        fontSize: 12,
        color: '#fff',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 16,
        textAlign: 'center',
    },
    currentUserSection: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    currentUserGradient: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    currentUserContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    currentUserLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    currentUserRankBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    currentUserRankNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 4,
    },
    
    userTime: {
        fontSize: 12,
        color: '#666',
    },
    currentUserIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    currentUserIndicatorText: {
        fontSize: 10,
        color: '#667eea',
        fontWeight: 'bold',
        marginLeft: 2,
    },
    // Enhanced Leaderboard Styles
    leaderboardScrollView: {
        flex: 1,
    },
    leaderboardScrollContent: {
        paddingBottom: 20,
    },
    enhancedLeaderboardHeader: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    superEnhancedLeaderboardHeader: {
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    superHeaderGradient: {
        padding: 24,
    },
    superHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    superHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    trophyIconContainer: {
        marginRight: 16,
    },
    trophyGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    superHeaderTextContainer: {
        flex: 1,
    },
    superEnhancedLeaderboardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    superEnhancedLeaderboardSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 8,
    },
    headerStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    headerStatText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginLeft: 4,
        fontWeight: '500',
    },
    headerStatDivider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginRight: 16,
    },
    superEnhancedCurrentUserCard: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    superCurrentUserGradient: {
        padding: 20,
    },
    superCurrentUserContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    superCurrentUserLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    superCurrentUserRankBadge: {
        marginRight: 16,
    },
    rankBadgeGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    superCurrentUserRankNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981',
        marginLeft: 4,
    },
    superCurrentUserInfo: {
        flex: 1,
    },
    superCurrentUserName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    superCurrentUserScoreLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 8,
    },
    currentUserBadges: {
        flexDirection: 'row',
    },
    performanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    badgeText: {
        fontSize: 10,
        color: '#FFFFFF',
        marginLeft: 4,
        fontWeight: '500',
    },
    superCurrentUserRight: {
        alignItems: 'flex-end',
    },
  
    superCurrentUserScore: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
   
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    superCurrentUserTime: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginLeft: 4,
        fontWeight: '500',
    },
    superEnhancedParticipantsList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    superParticipantsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    superParticipantsTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    titleIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleTextContainer: {
        flex: 1,
    },
    superParticipantsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 2,
    },
    superParticipantsSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    superParticipantsFilter: {
        marginLeft: 16,
    },
    filterGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    superFilterText: {
        fontSize: 12,
        color: '#8B5CF6',
        marginLeft: 6,
        fontWeight: '500',
    },
    superEnhancedResultCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginHorizontal: 18,
        marginBottom: 20,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        overflow: 'hidden',
    },
    superResultHeaderGradient: {
        padding: 24,
    },
    superResultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resultTrophyGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    superResultTitleContainer: {
        flex: 1,
        marginLeft: 16,
    },
    superResultTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    superResultSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 12,
    },
    resultStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resultStatItem: {
        alignItems: 'center',
        marginRight: 16,
    },
    resultStatValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    resultStatLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    resultStatDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginRight: 16,
    },
    superEnhancedSummaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        gap: 12,
    },
    superSummaryCard: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    summaryCardGradient: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    superSummaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    superSummaryLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    resultDetailsSection: {
        backgroundColor: '#F8FAFC',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        padding: 20,
    },
    resultDetailsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    resultDetailsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 8,
    },
    resultDetailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    resultDetailItem: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    resultDetailLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    resultDetailValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    superEnhancedAnalysisButton: {
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    superAnalysisButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 12,
    },
    superEnhancedAnalysisButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
        textAlign: 'center',
    },
    headerGradient: {
        padding: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTextContainer: {
        marginLeft: 12,
    },
    enhancedLeaderboardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    enhancedLeaderboardSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    headerRight: {
        alignItems: 'center',
    },
    statsBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
    },
    statsNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    statsLabel: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    enhancedCurrentUserCard: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },

  
 
 
   
  
    enhancedParticipantsList: {
        flex: 1,
    },
    participantsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    participantsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    participantsFilter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    filterText: {
        fontSize: 12,
        color: '#667eea',
        fontWeight: '500',
        marginLeft: 4,
    },
    enhancedParticipantCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.1)',
    },
    firstPlaceCard: {
        backgroundColor: '#fff8e1',
        borderColor: '#FFD700',
        borderWidth: 2,
    },
    secondPlaceCard: {
        backgroundColor: '#f5f5f5',
        borderColor: '#C0C0C0',
        borderWidth: 2,
    },
    thirdPlaceCard: {
        backgroundColor: '#fff3e0',
        borderColor: '#CD7F32',
        borderWidth: 2,
    },
    currentUserParticipantCard: {
        backgroundColor: '#f0f4ff',
        borderColor: '#667eea',
        borderWidth: 2,
    },
    participantLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    enhancedRankBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    firstPlaceBadge: {
        backgroundColor: '#fff8e1',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    secondPlaceBadge: {
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#C0C0C0',
    },
    thirdPlaceBadge: {
        backgroundColor: '#fff3e0',
        borderWidth: 2,
        borderColor: '#CD7F32',
    },
  
    enhancedParticipantAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
   
    participantInfo: {
        flex: 1,
    },
    participantName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    participantDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    participantTime: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    participantRight: {
        alignItems: 'flex-end',
    },
    participantScore: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a73e8',
        marginBottom: 4,
    },
  
 
    enhancedAnalysisButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 18,
        backgroundColor: '#f6f8fb',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },
    enhancedAnalysisButtonText: {
        color: '#6C63FF',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 8,
    },
    enhancedNoResultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    startExamButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    startExamButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    enhancedResultCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        width: '100%',
        maxWidth: 400,
    },
    resultHeaderGradient: {
        width: '100%',
        borderRadius: 18,
        padding: 20,
        alignItems: 'center',
        marginBottom: 18,
    },
    enhancedSummaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
        width: '100%',
    },
    enhancedSummaryCard: {
        flex: 1,
        marginHorizontal: 4,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    enhancedSummaryValue: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
    },
    enhancedSummaryLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    noResultTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    noResultText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    // Modal Styles (for Instructions Modal)
  
    enhancedModalContent: {
        width: '92%',
        maxHeight: '80%',
        backgroundColor: AppColors.white,
        borderRadius: 28,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
        elevation: 20,
        flexDirection: 'column',
        paddingBottom: 0,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.1)',
    },
    modalHeaderGradient: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    enhancedModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        minHeight: 40,
    },
    modalTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    enhancedModalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        marginLeft: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    modalSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginLeft: 12,
        marginTop: 2,
        fontWeight: '500',
    },
    enhancedCloseButton: {
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 22,
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    modalBodyContainer: {
        flex: 1,
        paddingHorizontal: 16,
        minHeight: 300,
        maxHeight: 450,
        backgroundColor: AppColors.white,
    },
    instructionsSection: {
        marginBottom: 20,
    },
    instructionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    instructionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 8,
    },
    instructionsCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 20,
        borderLeftWidth: 5,
        borderLeftColor: '#4F46E5',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.1)',
    },
   
    instructionNumber: {
        backgroundColor: '#4F46E5',
        borderRadius: 14,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        flexShrink: 0,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    instructionNumberText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
   
    tipsSection: {
        marginBottom: 20,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    tipsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 8,
    },
    tipsCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    tipIcon: {
        marginRight: 8,
    },
    tipText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
        lineHeight: 20,
    },
    enhancedInstructionsScroll: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingVertical: 16,
        paddingBottom: 30,
        flexGrow: 1,
    },
    enhancedInstructionsSection: {
        marginBottom: 10,
        backgroundColor: AppColors.white,
        paddingBottom: 30,
        paddingTop: 20,
        minHeight: 300,
    },
    enhancedInstructionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    enhancedInstructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
        backgroundColor: 'transparent',
        borderRadius: 8,
        padding: 8,
        borderLeftWidth: 2,
        borderLeftColor: '#667eea',
    },
    instructionNumberBadge: {
        backgroundColor: '#667eea',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        flexShrink: 0,
    },
   
    enhancedInstructionText: {
        flex: 1,
        fontSize: 13,
        color: '#2c3e50',
        lineHeight: 18,
        fontWeight: '400',
    },
    defaultInstructionsContainer: {
        gap: 8,
    },
    enhancedDeclarationSection: {
        marginBottom: 10,
        backgroundColor: AppColors.white,
        paddingBottom: 5,
    },
    enhancedDeclarationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    declarationCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 18,
        borderLeftWidth: 4,
        borderLeftColor: '#667eea',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    enhancedDeclarationText: {
        fontSize: 14,
        color: '#34495e',
        lineHeight: 21,
        marginBottom: 14,
        fontWeight: '400',
    },
    enhancedCheckboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    enhancedCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#667eea',
        backgroundColor: '#fff',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    enhancedCheckboxChecked: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    enhancedCheckboxText: {
        fontSize: 14,
        color: '#2c3e50',
        flex: 1,
        fontWeight: '500',
    },
    enhancedModalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: AppColors.white,
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    enhancedCancelButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#6B7280',
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        minWidth: 100,
    },
    enhancedCancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginLeft: 4,
    },
    enhancedBeginButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: 'transparent',
        marginRight: 8,
        minWidth: 100,
    },
    enhancedBeginButtonDisabled: {
        backgroundColor: '#bdc3c7',
        opacity: 0.6,
    },
    enhancedBeginButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    beginButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    loadingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    beginButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    cancelButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    // Info Tab Styles (keeping original)
    enhancedOverviewCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(102, 126, 234, 0.1)',
    },
    iconContainer: {
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderRadius: 12,
        padding: 10,
        marginRight: 12,
    },
    enhancedOverviewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginLeft: 12,
    },
    enhancedDescriptionText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#34495e',
        textAlign: 'justify',
    },
    enhancedDetailsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(102, 126, 234, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flex: 1,
        marginHorizontal: 4,
        minWidth: '45%',
    },
    descriptionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(102, 126, 234, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flex: 1,
        marginHorizontal: 4,
        minWidth: '100%',
    },
    descriptionContainer: {
        flex: 1,
        marginLeft: 12,
    },
    detailLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        fontWeight: '600',
        marginLeft: 8,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        color: '#2c3e50',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    enhancedActionButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        marginTop: 8,
        marginBottom: 20,
    },
    enhancedActionButtonDisabled: {
        opacity: 0.6,
    },
    enhancedStartButton: {
        backgroundColor: 'transparent',
    },
    enhancedReviewButton: {
        backgroundColor: 'transparent',
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
    },
    enhancedActionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    analysisButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    enhancedStartExamButton: {
        backgroundColor: 'transparent',
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 20,
    },
    modalIconContainer: {
        marginRight: 10,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderRadius: 12,
        padding: 10,
    },
    modalTitleWrapper: {
        flexDirection: 'column',
    },
  
    declarationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
  
    // Enhanced Leaderboard Styles
  
  
    participantsTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
  
    participantsSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
  

   
    // Statistics Section
    statisticsSection: {
        marginBottom: 20,
    },
    statisticsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    statContent: {
        marginLeft: 15,
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '500',
    },
    
    // Other Users Section
    otherUsersSection: {
        marginBottom: 20,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 10,
        marginHorizontal: 5,
    },
    otherUsersTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
});

// LeaderboardRow component (updated to match image style)
const LeaderboardRow = ({ rank, name, score, timeTaken, isCurrentUser, isTopThree }: any) => {
    // Convert rank to number and ensure it's displayed properly
    const numericRank = typeof rank === 'string' ? parseInt(rank, 10) : rank;
    const displayRank = numericRank !== undefined && numericRank !== null && !isNaN(numericRank) ? numericRank : 'N/A';
    
    return (
        <View style={[styles.leaderboardRow, isCurrentUser && styles.currentUserRow]}>
            <View style={styles.rankContainer}>
                <Text style={styles.rankNumber}>{displayRank}</Text>
            </View>
            <Ionicons name="person-circle" size={32} color="#667eea" style={styles.avatar} />
            <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>{name || 'Unknown User'}</Text>
                <Text style={styles.userHandle} numberOfLines={1}>@{name?.toLowerCase().replace(/\s+/g, '') || 'user'}</Text>
            </View>
            <View style={styles.scoreContainer}>
                <View style={styles.scoreRow}>
                    <Text style={[styles.scoreText, isCurrentUser && styles.currentUserScoreText]}>{score || 0} marks</Text>
                </View>
                {timeTaken && (
                    <Text style={styles.timeText}>{timeTaken}s</Text>
                )}
            </View>
        </View>
    );
};

export default PracticeExamDetailsScreen; 
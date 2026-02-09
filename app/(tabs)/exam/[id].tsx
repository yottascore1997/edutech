import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { formatTimeUntilStart, formatDateTime, hasExamStarted } from '@/utils/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ExamCard from '../../../components/ExamCard';

const ExamDetailScreen = () => {
    const { id, from, status, joined, resultData: resultDataParam } = useLocalSearchParams<{ id?: string; from?: string; status?: string; joined?: string; resultData?: string }>();
    const router = useRouter();
    const { user } = useAuth();
    
    
    const [exam, setExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);
    const normalizedStatus = String(status || '').toUpperCase();
    const initialTab = from === 'my-exams' && (normalizedStatus === 'COMPLETED' || normalizedStatus === 'FINISHED') ? 'Result' : 'Info';
    const [activeTab, setActiveTab] = useState(initialTab);

    const [winnings, setWinnings] = useState<any[]>([]);
    const [winningsLoading, setWinningsLoading] = useState(false);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [attempts, setAttempts] = useState<any>(null);
    const [attemptsLoading, setAttemptsLoading] = useState(false);
    const [resultData, setResultData] = useState<any>(null);
    const [resultLoading, setResultLoading] = useState(false);
    const [resultError, setResultError] = useState<string | null>(null);
    const [resultFetched, setResultFetched] = useState(false);
    const [isParticipant, setIsParticipant] = useState(joined === '1' || joined === 'true');
    const [participantLoading, setParticipantLoading] = useState(false);
    const [examHasStarted, setExamHasStarted] = useState(false);
    const [examHasEnded, setExamHasEnded] = useState(false);
    const [timeUntilStart, setTimeUntilStart] = useState<string>('');
    const isCompleted = normalizedStatus === 'COMPLETED' || normalizedStatus === 'FINISHED';

    useEffect(() => {
        if (!resultDataParam) return;
        try {
            const parsed = JSON.parse(String(resultDataParam));
            setResultData(parsed);
            setResultError(null);
            setResultFetched(true);
        } catch (e) {
            console.error('Failed to parse resultData param:', e);
        }
    }, [resultDataParam]);

    // Check if user is a participant in this exam
    const checkParticipantStatus = async () => {
        if (!user?.token || !id) return;
        
        try {
            setParticipantLoading(true);
            const response = await apiFetchAuth(`/student/live-exams/${id}/participant`, user.token);
            if (response.ok) {
                setIsParticipant(true);
            } else {
                // Don't overwrite to false if user just came from join flow (joined param)
                const justJoined = joined === '1' || joined === 'true';
                if (!justJoined) {
                    setIsParticipant(false);
                }
            }
        } catch (error) {
            console.error('Error checking participant status:', error);
            const justJoined = joined === '1' || joined === 'true';
            if (!justJoined) {
                setIsParticipant(false);
            }
        } finally {
            setParticipantLoading(false);
        }
    };

    // Handle start exam for participants
    const handleStartExam = async () => {
        if (!user?.token || !id || !exam) return;
        
        const now = new Date();
        
        // Check if exam has ended
        if (exam.endTime) {
            const endTime = new Date(exam.endTime);
            if (now.getTime() > endTime.getTime()) {
                Alert.alert(
                    'Exam Ended',
                    'The exam time has ended. You cannot start the exam now.',
                    [{ text: 'OK' }]
                );
                setExamHasEnded(true);
                return;
            }
        }
        
        // Strict check: verify exam has actually started
        const startTime = exam.startTime ? new Date(exam.startTime) : null;
        const hasStarted = startTime ? now.getTime() >= startTime.getTime() : false;
        
        if (!hasStarted) {
            Alert.alert('Wait', 'Exam has not started yet. Please wait for the start time.');
            return;
        }
        
        try {
            // Fetch questions
            const questionsRes = await apiFetchAuth(`/student/live-exams/${id}/questions`, user.token);
            if (!questionsRes.ok) {
                if (questionsRes.data?.message?.includes('not started') || questionsRes.data?.message?.includes('start time')) {
                    Alert.alert('Wait', 'Exam has not started yet. Please wait for the start time.');
                    setExamHasStarted(false);
                    return;
                }
                if (questionsRes.data?.message?.includes('ended') || questionsRes.data?.message?.includes('end time')) {
                    Alert.alert('Exam Ended', 'The exam time has ended. You cannot start the exam now.');
                    setExamHasEnded(true);
                    return;
                }
                throw new Error(questionsRes.data?.message || 'Failed to fetch questions');
            }
            
            // Navigate to questions page
            router.push({ 
                pathname: '/(tabs)/live-exam/questions', 
                params: { 
                    id: exam.id, 
                    duration: exam.duration, 
                    questions: JSON.stringify(questionsRes.data) 
                } 
            });
        } catch (error: any) {
            if (error.message?.includes('not started') || error.message?.includes('start time')) {
                Alert.alert('Wait', 'Exam has not started yet. Please wait for the start time.');
                setExamHasStarted(false);
            } else if (error.message?.includes('ended') || error.message?.includes('end time')) {
                Alert.alert('Exam Ended', 'The exam time has ended. You cannot start the exam now.');
                setExamHasEnded(true);
            } else {
                Alert.alert('Error', error.message || 'Failed to start exam.');
            }
        }
    };

    const getResultAccuracy = (data: any) => {
        if (!data) return 0;
        if (typeof data.accuracy === 'number') return Math.round(data.accuracy);
        if (data.totalQuestions) {
            return Math.round((Number(data.correctAnswers || 0) / Number(data.totalQuestions)) * 100);
        }
        return 0;
    };

    const formatResultDuration = (data: any) => {
        if (!data) return 'N/A';
        if (data.timeTakenFormatted) return String(data.timeTakenFormatted);
        if (data.timeTakenMinutes != null) return `${data.timeTakenMinutes} min`;
        if (data.timeTakenSeconds != null) return `${Math.max(1, Math.round(data.timeTakenSeconds / 60))} min`;
        return 'N/A';
    };

    const openFullResult = () => {
        if (!resultData) return;
        router.push({
            pathname: '/(tabs)/live-exam/result/[id]' as any,
            params: { id: String(id), resultData: JSON.stringify(resultData) }
        });
    };

    useEffect(() => {
        checkParticipantStatus();
    }, [user?.token, id]);

    // Check exam start time and update countdown
    useEffect(() => {
        if (!exam?.startTime) return;

        const checkStartTime = () => {
            const now = new Date();
            let startTime: Date;
            
            try {
                startTime = new Date(exam.startTime);
                if (isNaN(startTime.getTime())) {
                    console.error('Invalid start time:', exam.startTime);
                    return;
                }
            } catch (error) {
                console.error('Error parsing start time:', error);
                return;
            }
            
            // Strict check: exam has started only if current time is >= start time
            const timeDiff = startTime.getTime() - now.getTime();
            const started = timeDiff <= 0;
            
            setExamHasStarted(started);
            
            if (!started) {
                const timeUntil = formatTimeUntilStart(exam.startTime);
                setTimeUntilStart(timeUntil);
            } else {
                setTimeUntilStart('');
            }
        };

        // Initial check
        checkStartTime();
        
        // Update every second
        const interval = setInterval(checkStartTime, 1000);
        
        return () => clearInterval(interval);
    }, [exam?.startTime]);

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            if (!user?.token || !id) return;
            try {
                setLeaderboardLoading(true);
                const response = await apiFetchAuth(`/student/live-exams/${id}/leaderboard`, user.token);
                if (response.ok) {
                    // Process and rank the leaderboard data
                    const leaderboardData = response.data.leaderboard || [];
                    const currentUserData = response.data.currentUser;
                    
                    // Sort leaderboard by score (highest first), then by time taken (lowest first)
                    const sortedLeaderboard = leaderboardData.sort((a: any, b: any) => {
                        if (b.score !== a.score) {
                            return b.score - a.score; // Higher score first
                        }
                        return (a.timeTaken || 0) - (b.timeTaken || 0); // Lower time first for same score
                    });
                    
                    // Assign ranks dynamically
                    const rankedLeaderboard = sortedLeaderboard.map((item: any, index: number) => ({
                        ...item,
                        rank: index + 1
                    }));
                    
                    // Update current user rank if they exist in leaderboard
                    let updatedCurrentUser = currentUserData;
                    if (currentUserData) {
                        const userInLeaderboard = rankedLeaderboard.find((item: any) => 
                            item.userId === currentUserData.userId || item.name === currentUserData.name
                        );
                        if (userInLeaderboard) {
                            updatedCurrentUser = {
                                ...currentUserData,
                                rank: userInLeaderboard.rank
                            };
                        }
                    }
                    
                    setCurrentUser(updatedCurrentUser);
                    setLeaderboard(rankedLeaderboard);
                    
                } else {
                    console.error("Failed to load leaderboard:", response.data);
                    setLeaderboard([]);
                }
            } catch (e: any) {
                console.error("An error occurred while fetching leaderboard", e);
            } finally {
                setLeaderboardLoading(false);
            }
        };

        if (activeTab === 'Leaderboard') {
            fetchLeaderboardData();
        }
    }, [activeTab, id, user]);

    useEffect(() => {
        const fetchWinningsData = async () => {
            if (!user?.token || !id || winnings.length > 0) return; 
            try {
                setWinningsLoading(true);
                const response = await apiFetchAuth(`/student/live-exams/${id}/winnings`, user.token);
                if (response.ok) {
                    setWinnings(response.data || []);
                } else {
                    console.error("Failed to load winnings: ", response.data);
                    setWinnings([]);
                }
            } catch (e: any) {
                console.error("An error occurred while fetching winnings", e);
            } finally {
                setWinningsLoading(false);
            }
        };

        if (activeTab === 'Winnings') {
            fetchWinningsData();
        }
    }, [activeTab, id, user]);

    useEffect(() => {
        const fetchAttemptsData = async () => {
            if (!user?.token || !id) return;
            try {
                setAttemptsLoading(true);
                const response = await apiFetchAuth(`/student/live-exams/${id}/attempts`, user.token);
                if (response.ok) {
                    setAttempts(response.data || null);
                } else {
                    console.error("Failed to load attempts: ", response.data);
                    setAttempts(null);
                }
            } catch (e: any) {
                console.error("An error occurred while fetching attempts", e);
                setAttempts(null);
            } finally {
                setAttemptsLoading(false);
            }
        };

        if (activeTab === 'Result') {
            fetchAttemptsData();
        }
    }, [activeTab, id, user]);

    const fetchResultData = async () => {
        if (!user?.token || !id || !isCompleted) return;
        if (resultLoading) return;
        try {
            setResultLoading(true);
            setResultError(null);
            const response = await apiFetchAuth(`/student/live-exams/${id}/result`, user.token);
            if (response.ok) {
                setResultData(response.data || null);
            } else {
                setResultData(null);
                setResultError(response.data?.message || 'Result not available');
            }
        } catch (e: any) {
            setResultData(null);
            setResultError(e?.message || 'Result not available');
        } finally {
            setResultLoading(false);
            setResultFetched(true);
        }
    };

    useEffect(() => {
        const fetchIfNeeded = async () => {
            if (!user?.token || !id || !isCompleted) return;
            if (resultFetched || resultData) return;
            try {
                await fetchResultData();
            } catch {
                // handled in fetchResultData
            }
        };

        if (activeTab === 'Result') {
            fetchIfNeeded();
        }
    }, [activeTab, id, user?.token, isCompleted, resultData, resultFetched]);

    // Fetch exam details function
    const fetchExamDetails = async () => {
        if (!user?.token || !id) return;

        const idStr = String(id);
        try {
            // Try generic exams list first
            const response = await apiFetchAuth('/student/exams', user.token);
            let examData: any | null = null;
            if (response.ok && Array.isArray(response.data)) {
                examData = response.data.find((e: any) => String(e?.id) === idStr);
            }

            // Fallback to live exam details if not found
            if (!examData) {
                // Prefer a direct exam endpoint; if it fails, try list fallback
                let liveRes = await apiFetchAuth(`/student/live-exams/${idStr}`, user.token);
                if (liveRes.ok && liveRes.data) {
                    examData = liveRes.data;
                } else {
                    liveRes = await apiFetchAuth('/student/live-exams', user.token);
                    if (liveRes.ok && Array.isArray(liveRes.data)) {
                        examData = liveRes.data.find((e: any) => String(e?.id) === idStr || String(e?.examId) === idStr);
                    }
                }
            }

            if (examData) {
                // Normalize minimal fields used by this screen
                const normalized = {
                    ...examData,
                    id: examData.id ?? examData.examId ?? idStr,
                    duration: examData.duration ?? examData.timeLimit ?? 0,
                    questions: examData.questions ?? [],
                    entryFee: examData.entryFee ?? examData.fee ?? 0,
                    createdBy: examData.createdBy ?? examData.author ?? { name: 'Admin' },
                    startTime: examData.startTime ?? examData.start_date ?? new Date().toISOString(),
                    spots: examData.spots ?? examData.totalSpots ?? 0,
                    spotsLeft: examData.spotsLeft ?? examData.remainingSpots ?? 0,
                };
                setExam(normalized);
                checkParticipantStatus();
            } else {
                setError('Exam not found.');
            }
        } catch (e: any) {
            setError(e?.data?.message || 'An error occurred.');
        }
    };

    // Initial fetch
    useEffect(() => {
        setExam(null);
        setWinnings([]);
        setLeaderboard([]);
        if (!resultDataParam) {
            setResultData(null);
            setResultError(null);
            setResultLoading(false);
            setResultFetched(false);
        }
        setActiveTab(initialTab);
        setError(null);
        setIsParticipant(false);
        setLoading(true);
        
        fetchExamDetails().finally(() => {
            setLoading(false);
        });
    }, [id, user]);

    // Refresh spots periodically (every 30 seconds) if exam hasn't started
    useEffect(() => {
        if (!exam || examHasStarted || !user?.token) return;

        const refreshSpots = async () => {
            try {
                const idStr = String(id);
                const liveRes = await apiFetchAuth(`/student/live-exams/${idStr}`, user.token);
                if (liveRes.ok && liveRes.data) {
                    setExam((prev: any) => ({
                        ...prev,
                        spots: liveRes.data.spots ?? liveRes.data.totalSpots ?? prev.spots,
                        spotsLeft: liveRes.data.spotsLeft ?? liveRes.data.remainingSpots ?? prev.spotsLeft,
                    }));
                }
            } catch (error) {
                console.error('Error refreshing spots:', error);
            }
        };

        const interval = setInterval(refreshSpots, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [exam, examHasStarted, id, user?.token]);

    if (loading) {
        return <ActivityIndicator size="large" color={AppColors.primary} style={styles.centered} />;
    }

    if (error || !exam) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error || 'Exam not found.'}</Text>
            </View>
        );
    }
    
    const progress = exam.spots > 0 ? ((exam.spots - exam.spotsLeft) / exam.spots) * 100 : 0;
    
    return (
        <View style={styles.container}>
            <FlatList
                data={[{ key: 'content' }]}
                renderItem={() => (
                    <>
                        <View style={styles.examCardWrapper}>
                            <ExamCard exam={exam} hideAttemptButton={String(from) === 'my-exams'} isDetailsPage={true} onJoinSuccess={() => setIsParticipant(true)} attemptStatus={from === 'my-exams' ? status : undefined} hideSpotsSection={from === 'my-exams'} />
                            {isParticipant && status !== 'COMPLETED' && !examHasStarted && exam?.startTime && (
                                <View style={styles.joinedCompactCard}>
                                    <View style={styles.joinedCompactIconWrap}>
                                        <Ionicons name="checkmark" size={16} color="#059669" />
                                    </View>
                                    <View style={styles.joinedCompactContent}>
                                        <Text style={styles.joinedCompactLabel}>You're in</Text>
                                        <Text style={styles.joinedCompactTime}>
                                            Starts in {timeUntilStart || formatTimeUntilStart(exam.startTime)}
                                        </Text>
                                        <Text style={styles.joinedCompactSubtext}>
                                            Your spot is confirmed. Be ready when the exam starts.
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={styles.tabContainer}>
                            {[
                                { key: 'Info', label: 'Info' },
                                { key: 'Result', label: 'Result' },
                                { key: 'Leaderboard', label: 'Ranking' },
                                { key: 'Winnings', label: 'Winnings' },
                            ].map(({ key, label }) => (
                                <TouchableOpacity 
                                    key={key} 
                                    style={[styles.tab, activeTab === key && styles.activeTab]}
                                    onPress={() => setActiveTab(key)}
                                >
                                    <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.tabContent}>
                            {activeTab === 'Info' && (
                                <>
                                    <View style={styles.infoTable}>
                                        <InfoRow label="Exam Name" value={exam.title || 'N/A'} />
                                        <InfoRow label="Category" value={exam.category || 'General'} />
                                        <InfoRow label="No. of questions" value={exam.questions?.length || 5} />
                                        <InfoRow label="Required Time" value={`${exam.duration} Min`} />
                                        <InfoRow label="Start Date" value={new Date(exam.startTime).toLocaleDateString()} />
                                        <InfoRow label="End Date" value={new Date(new Date(exam.startTime).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()} />
                                        <InfoRow label="Author" value={exam.createdBy?.name || 'Admin'} />
                                        <InfoRow label="Test Cost" value={`₹ ${exam.entryFee.toFixed(2)}`} isCost />
                                    </View>
                                    
                                    {/* Start Exam Button for Participants - Only show if not completed */}
                                    {isParticipant && status !== 'COMPLETED' && (
                                        <View style={styles.startExamContainer}>
                                            {(() => {
                                                if (!exam?.startTime) {
                                                    return null;
                                                }
                                                
                                                // Double check: Use state variable AND direct calculation for accuracy
                                                const now = new Date();
                                                let startTime: Date;
                                                let endTime: Date | null = null;
                                                
                                                try {
                                                    startTime = new Date(exam.startTime);
                                                    if (isNaN(startTime.getTime())) {
                                                        return null;
                                                    }
                                                    
                                                    // Check end time if available
                                                    if (exam.endTime) {
                                                        endTime = new Date(exam.endTime);
                                                        if (isNaN(endTime.getTime())) {
                                                            endTime = null;
                                                        }
                                                    }
                                                } catch (error) {
                                                    return null;
                                                }
                                                
                                                // Check if exam has ended
                                                if (endTime) {
                                                    const endTimeDiff = endTime.getTime() - now.getTime();
                                                    const hasEnded = endTimeDiff <= 0;
                                                    
                                                    if (hasEnded) {
                                                        // Exam has ended - show ended message
                                                        return (
                                                            <View style={styles.countdownContainer}>
                                                                <View style={[styles.joinedBadge, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
                                                                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                                                                    <Text style={[styles.joinedText, { color: '#EF4444' }]}>Exam Ended</Text>
                                                                </View>
                                                                <Text style={[styles.countdownLabel, { color: '#DC2626' }]}>Exam time has ended</Text>
                                                                <Text style={styles.startTimeText}>
                                                                    End Time: {formatDateTime(exam.endTime)}
                                                                </Text>
                                                                <Text style={styles.examEndedMessage}>
                                                                    You joined this exam but did not attempt it. The exam time has now ended.
                                                                </Text>
                                                                <TouchableOpacity 
                                                                    style={[styles.startExamButton, styles.disabledButton]}
                                                                    disabled={true}
                                                                >
                                                                    <Ionicons name="lock-closed" size={20} color={AppColors.white} />
                                                                    <Text style={styles.startExamButtonText}>
                                                                        Exam Ended
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        );
                                                    }
                                                }
                                                
                                                // Calculate time difference in milliseconds
                                                const timeDiff = startTime.getTime() - now.getTime();
                                                // Exam has started only if time difference is <= 0
                                                const hasStarted = timeDiff <= 0;
                                                
                                                // Use the more accurate check (direct calculation)
                                                // This ensures we don't rely on stale state
                                                if (!hasStarted) {
                                                    // Countdown/Joined message is shown above (in card area) - nothing extra here
                                                    return null;
                                                } else {
                                                    // Exam has started - Start Attempt button is on the card (upper), no duplicate here
                                                    return null;
                                                }
                                            })()}
                                        </View>
                                    )}
                                </>
                            )}
                            {activeTab === 'Leaderboard' && (
                                leaderboardLoading ? (
                                     <ActivityIndicator color={AppColors.primary} style={{ marginVertical: 20 }}/>
                                ) : (
                                    <View style={styles.leaderboardContainer}>
                                        {/* Top 3 Performers */}
                                        {leaderboard.length > 0 && (
                                            <View style={styles.topPerformersSection}>
                                                <View style={styles.topPerformersGradient}>
                                                    <Text style={styles.topPerformersTitle}>Top Performers</Text>
                                                    <View style={styles.topPerformersRow}>
                                                        {leaderboard.slice(0, 3).map((winner, index) => (
                                                            <View key={winner.userId} style={styles.topPerformerCard}>
                                                                <View style={styles.topPerformerAvatar}>
                                                                    <Ionicons name="person-circle" size={56} color="#8B5CF6" />
                                                                </View>
                                                                <Text style={styles.topPerformerName}>{winner.name}</Text>
                                                                <Text style={styles.topPerformerScore}>{winner.score} Marks</Text>
                                                                <Text style={styles.topPerformerTime}>{winner.timeTaken || 0} min</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                </View>
                                            </View>
                                        )}

                                        {/* Your Rank Section */}
                                        {currentUser && (
                                            <View style={styles.yourRankSection}>
                                                <Text style={styles.yourRankTitle}>Your Rank</Text>
                                                <View style={styles.yourRankCard}>
                                                    <View style={styles.yourRankContainer}>
                                                        <Text style={styles.yourRankText}>RANK: {currentUser.rank}</Text>
                                                    </View>
                                                    <View style={styles.yourRankProfileContainer}>
                                                        <Ionicons name="person-circle-outline" size={40} color="#4F46E5" />
                                                    </View>
                                                    <View style={styles.yourRankInfoContainer}>
                                                        <Text style={styles.yourRankNameText}>{currentUser.name} (You) • {currentUser.timeTaken || 0} min</Text>
                                                        <Text style={styles.yourRankScoreText}>{currentUser.score} Marks</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )}

                                        {/* Leaderboard List */}
                                        <View style={styles.leaderboardCard}>
                                            <View style={styles.leaderboardHeader}>
                                                <Text style={styles.leaderboardTitle}>Ranking</Text>
                                            </View>
                                            
                                            {leaderboard.length > 0 ? (
                                                <ScrollView 
                                                    style={styles.leaderboardScrollView}
                                                    showsVerticalScrollIndicator={true}
                                                    nestedScrollEnabled={true}
                                                    scrollEnabled={true}
                                                >
                                                    <View style={styles.leaderboardList}>
                                                        {leaderboard.slice(0, 50).map((item, index) => (
                                                            <View key={item.userId || `user-${index}`} style={styles.leaderboardRow}>
                                                                <View style={styles.leaderboardRankContainer}>
                                                                    <Text style={styles.leaderboardRankText}>{item.rank}</Text>
                                                                </View>
                                                                <View style={styles.leaderboardProfileContainer}>
                                                                    <Ionicons name="person-circle-outline" size={28} color="#9CA3AF" />
                                                                </View>
                                                                <View style={styles.leaderboardInfoContainer}>
                                                                    <Text style={styles.leaderboardNameText} numberOfLines={1}>{item.name}</Text>
                                                                    <Text style={styles.leaderboardScoreText}>{item.score} Marks • {item.timeTaken ?? 0} min</Text>
                                                                </View>
                                                            </View>
                                                        ))}
                                                    </View>
                                                </ScrollView>
                                            ) : (
                                                <View style={styles.noWinnersSection}>
                                                    <Ionicons name="trophy-outline" size={32} color="#CBD5E1" />
                                                    <Text style={styles.noWinnersText}>No participants yet</Text>
                                                    <Text style={styles.noWinnersSubtext}>
                                                        Complete the exam to see your rank!
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )
                            )}
                            {activeTab === 'Winnings' && (
                                winningsLoading ? (
                                    <ActivityIndicator color={AppColors.primary} style={{ marginVertical: 20 }}/>
                                ) : (
                                    <View style={styles.winningsContainer}>
                                        <View style={styles.winningsHeader}>
                                            <Text style={styles.winningsHeaderText}>Rank</Text>
                                            <Text style={styles.winningsHeaderText}>Prize</Text>
                                        </View>
                                        
                                        <FlatList
                                            data={(() => {
                                                // Group consecutive ranks with same prize
                                                const groupedWinnings = [];
                                                let currentGroup = null;
                                                
                                                for (let i = 0; i < winnings.length; i++) {
                                                    const item = winnings[i];
                                                    
                                                    if (!currentGroup) {
                                                        currentGroup = {
                                                            startRank: item.rank,
                                                            endRank: item.rank,
                                                            prize: item.prize
                                                        };
                                                    } else if (item.prize === currentGroup.prize) {
                                                        // Same prize, extend the range
                                                        currentGroup.endRank = item.rank;
                                                    } else {
                                                        // Different prize, save current group and start new
                                                        groupedWinnings.push(currentGroup);
                                                        currentGroup = {
                                                            startRank: item.rank,
                                                            endRank: item.rank,
                                                            prize: item.prize
                                                        };
                                                    }
                                                }
                                                
                                                // Add the last group
                                                if (currentGroup) {
                                                    groupedWinnings.push(currentGroup);
                                                }
                                                
                                                return groupedWinnings;
                                            })()}
                                            keyExtractor={(item, index) => `${item.startRank}-${item.endRank}-${index}`}
                                            renderItem={({ item }) => (
                                                <View style={styles.winningRow}>
                                                    <Text style={styles.rankText}>
                                                        {item.startRank === item.endRank ? `#${item.startRank}` : `${item.startRank}-${item.endRank}`}
                                                    </Text>
                                                    <View style={styles.prizeContainer}>
                                                        <Text style={styles.rupeeSymbol}>₹</Text>
                                                        <Text style={styles.prizeText}>{item.prize}</Text>
                                                    </View>
                                                </View>
                                            )}
                                            ListEmptyComponent={() => (
                                                <View style={styles.emptyState}>
                                                    <Text style={styles.emptyText}>No prize distribution information available.</Text>
                                                </View>
                                            )}
                                        />
                                    </View>
                                )
                            )}
                            {activeTab === 'Result' && (
                                resultLoading || attemptsLoading ? (
                                    <ActivityIndicator color={AppColors.primary} style={{ marginVertical: 20 }}/>
                                ) : (
                                    <View style={styles.resultContainer}>
                                        {!isCompleted ? (
                                            <View style={styles.emptyState}>
                                                <Ionicons name="information-circle-outline" size={48} color="#9CA3AF" />
                                                <Text style={styles.emptyText}>Result will be available after completion.</Text>
                                                <Text style={styles.emptySubtext}>
                                                    Complete the exam to see full performance details.
                                                </Text>
                                            </View>
                                        ) : resultData ? (
                                            <>
                                                <View style={styles.resultSummaryCard}>
                                                    <View style={styles.resultHeaderRow}>
                                                        <Text style={styles.resultTitle}>Your Result</Text>
                                                        {resultData.currentRank != null && (
                                                            <View style={styles.resultBadge}>
                                                                <Ionicons name="podium" size={14} color="#7C3AED" />
                                                                <Text style={styles.resultBadgeText}>Rank #{resultData.currentRank}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <View style={styles.resultGrid}>
                                                        <View style={styles.resultItem}>
                                                            <View style={styles.resultItemRow}>
                                                                <Text style={styles.resultLabel}>Score</Text>
                                                                <Text style={styles.resultValue}>
                                                                    {resultData.score ?? 0} / {resultData.totalQuestions ?? (exam.questions?.length || 0)}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <View style={styles.resultItem}>
                                                            <View style={styles.resultItemRow}>
                                                                <Text style={styles.resultLabel}>Accuracy</Text>
                                                                <Text style={styles.resultValue}>{getResultAccuracy(resultData)}%</Text>
                                                            </View>
                                                        </View>
                                                        <View style={styles.resultItem}>
                                                            <View style={styles.resultItemRow}>
                                                                <Text style={styles.resultLabel}>Correct</Text>
                                                                <Text style={styles.resultValue}>{resultData.correctAnswers ?? 0}</Text>
                                                            </View>
                                                        </View>
                                                        <View style={styles.resultItem}>
                                                            <View style={styles.resultItemRow}>
                                                                <Text style={styles.resultLabel}>Wrong</Text>
                                                                <Text style={styles.resultValue}>{resultData.wrongAnswers ?? 0}</Text>
                                                            </View>
                                                        </View>
                                                        <View style={styles.resultItem}>
                                                            <View style={styles.resultItemRow}>
                                                                <Text style={styles.resultLabel}>Unattempted</Text>
                                                                <Text style={styles.resultValue}>{resultData.unattempted ?? 0}</Text>
                                                            </View>
                                                        </View>
                                                        <View style={styles.resultItem}>
                                                            <View style={styles.resultItemRow}>
                                                                <Text style={styles.resultLabel}>Time Taken</Text>
                                                                <Text style={styles.resultValue}>{formatResultDuration(resultData)}</Text>
                                                            </View>
                                                        </View>
                                                        {resultData.completedAt && (
                                                            <View style={styles.resultItemFull}>
                                                                <View style={styles.resultItemRow}>
                                                                    <Text style={styles.resultLabel}>Completed</Text>
                                                                    <Text style={styles.resultValue}>
                                                                        {new Date(resultData.completedAt).toLocaleString()}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        )}
                                                        {resultData.prizeAmount != null && (
                                                            <View style={styles.resultItemFull}>
                                                                <View style={styles.resultItemRow}>
                                                                    <Text style={styles.resultLabel}>Prize</Text>
                                                                    <Text style={styles.resultValue}>₹ {resultData.prizeAmount}</Text>
                                                                </View>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                                <TouchableOpacity style={styles.resultActionButton} onPress={openFullResult} activeOpacity={0.85}>
                                                    <Ionicons name="analytics" size={18} color="#FFF" />
                                                    <Text style={styles.resultActionText}>View Full Result</Text>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <View style={styles.emptyState}>
                                                <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
                                                <Text style={styles.emptyText}>{resultError || 'Result not available yet.'}</Text>
                                                <Text style={styles.emptySubtext}>Please try again in a moment.</Text>
                                                <TouchableOpacity style={styles.retryResultButton} onPress={fetchResultData}>
                                                    <Ionicons name="refresh" size={18} color="#7C3AED" />
                                                    <Text style={styles.retryResultText}>Retry</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                )
                            )}
                        </View>
                    </>
                )}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const LeaderboardRow = ({ rank, name, score, prizeAmount, isCurrentUser, isTopThree }: any) => {
    // Convert rank to number and ensure it's displayed properly
    const numericRank = typeof rank === 'string' ? parseInt(rank, 10) : rank;
    const displayRank = numericRank !== undefined && numericRank !== null && !isNaN(numericRank) ? numericRank : 'N/A';
    const rankColor = isTopThree && numericRank && numericRank <= 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][numericRank - 1] : '#6c757d';
    
    
    return (
        <View style={[styles.leaderboardRow, isCurrentUser && styles.currentUserRow]}>
            <View style={styles.rankContainer}>
                {isTopThree && numericRank && numericRank <= 3 ? (
                    <Ionicons name="trophy" size={24} color={rankColor} />
                ) : (
                    <Text style={styles.leaderboardRankText}>RANK: {displayRank}</Text>
                )}
            </View>
            <Ionicons name="person-circle-outline" size={40} color={AppColors.grey} style={styles.avatar} />
            <Text style={styles.leaderboardNameText} numberOfLines={1}>{name || 'Unknown User'}</Text>
            <View style={styles.scoreContainer}>
                <Text style={styles.leaderboardScoreText}>{score || 0} PTS</Text>
                {prizeAmount > 0 && (
                    <Text style={styles.prizeAmountText}>₹{prizeAmount}</Text>
                )}
            </View>
        </View>
    );
};

const WinningRow = ({ rank, prize }: { rank: number, prize: number }) => (
    <View style={styles.winningRow}>
        <Text style={styles.rankText}>#{rank}</Text>
        <View style={styles.prizeContainer}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <Text style={styles.prizeText}>{prize}</Text>
        </View>
    </View>
);

const InfoRow = ({ label, value, isCost = false }: any) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, isCost && styles.infoValueCost]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: 'red', fontSize: 16 },
    container: {
        flex: 1,
        backgroundColor: AppColors.lightGrey,
    },
    examCardWrapper: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: AppColors.white,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.lightGrey,
    },
    backButton: {
       marginRight: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
    },
    prizePoolSection: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: AppColors.primary,
        margin: 15,
        borderRadius: 15,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    prizePoolLabel: {
        color: AppColors.white,
        fontSize: 14,
        opacity: 0.9,
    },
    prizePoolAmountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    prizePoolAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: AppColors.white,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    spotsContainer: {
        paddingHorizontal: 20,
        marginTop: 10,
        backgroundColor: AppColors.white,
        marginHorizontal: 15,
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    progressBar: {
        height: 10,
        backgroundColor: AppColors.lightGrey,
        borderRadius: 5,
        overflow: 'hidden',
        marginTop: 8,
    },
    progress: {
        height: '100%',
        backgroundColor: '#5DADE2',
        borderRadius: 5,
    },
    spotsTextContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    spotsLeft: {
        color: '#E67E22',
        fontSize: 12,
        fontWeight: '600',
    },
    totalSpots: {
        color: AppColors.grey,
        fontSize: 12,
        fontWeight: '500',
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 15,
        backgroundColor: AppColors.white,
        marginHorizontal: 15,
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
        backgroundColor: AppColors.lightGrey,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        marginLeft: 4,
        color: AppColors.darkGrey,
        fontSize: 11,
        fontWeight: '500',
    },
    remainingTime: {
        color: '#E74C3C',
        fontSize: 12,
        marginLeft: 'auto',
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: AppColors.white,
        marginHorizontal: 16,
        marginTop: 4,
        marginBottom: 4,
        borderRadius: 10,
        padding: 3,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.1)',
    },
    tab: {
        paddingVertical: 5,
        paddingHorizontal: 6,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 2,
    },
    activeTab: {
        backgroundColor: AppColors.primary,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 4,
    },
    tabText: {
        color: AppColors.grey,
        fontWeight: '600',
        fontSize: 11,
        letterSpacing: 0.2,
    },
    activeTabText: {
        color: AppColors.white,
        fontWeight: '700',
        fontSize: 11,
        letterSpacing: 0.2,
    },
    tabContent: {
        backgroundColor: AppColors.white,
        marginHorizontal: 15,
        borderRadius: 16,
        padding: 18,
        marginBottom: 100,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.1)',
    },
    infoTable: {
        backgroundColor: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.1)',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(99, 102, 241, 0.08)',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 8,
        marginBottom: 6,
    },
    infoLabel: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    infoValue: {
        fontWeight: '700',
        color: '#1F2937',
        fontSize: 14,
        textAlign: 'right',
        letterSpacing: 0.2,
    },
    infoValueCost: {
        color: '#059669',
        fontWeight: '800',
        fontSize: 15,
        textAlign: 'right',
        letterSpacing: 0.3,
    },
    winningsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    winningsHeaderText: {
        color: '#374151',
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: 0.3,
    },
    winningRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 0,
    },
    rankText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        letterSpacing: 0.2,
    },
    prizeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    rupeeSymbol: {
        color: '#059669',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 2,
    },
    prizeText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#047857',
        letterSpacing: 0.2,
    },
    currentUserRow: {
        backgroundColor: '#E9E7FD',
        borderColor: AppColors.primary,
        borderWidth: 1.5,
    },
    rankContainer: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0', // Temporary background to see the container
    },
    avatar: {
        marginHorizontal: 10,
    },
    placeholderText: {
        color: AppColors.grey,
        fontSize: 14,
        textAlign: 'center',
    },
    currentUserSection: {
        padding: 20,
        backgroundColor: AppColors.white,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    currentUserTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 10,
    },
    leaderboardSection: {
        padding: 20,
        backgroundColor: AppColors.white,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prizeAmountText: {
        color: AppColors.primary,
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    startExamContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    startExamButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppColors.primary,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    startExamButtonText: {
        color: AppColors.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    countdownContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#10B981',
    },
    countdownContainerInCard: {
        marginHorizontal: 12,
        marginBottom: 12,
    },
    joinedCompactCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 14,
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
        ...(Platform.OS === 'android' ? {} : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
        }),
        elevation: Platform.OS === 'android' ? 0 : 2,
    },
    joinedCompactIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    joinedCompactContent: {
        flex: 1,
    },
    joinedCompactLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    joinedCompactTime: {
        fontSize: 15,
        fontWeight: '700',
        color: '#047857',
        marginBottom: 4,
    },
    joinedCompactSubtext: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
    },
    joinedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    joinedText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10B981',
        marginLeft: 8,
    },
    spotsInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 12,
        marginBottom: 16,
    },
    spotsInfoText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 6,
    },
    countdownLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
        marginBottom: 8,
    },
    countdownTime: {
        fontSize: 32,
        fontWeight: '900',
        color: '#10B981',
        marginBottom: 12,
        letterSpacing: 2,
    },
    startTimeText: {
        fontSize: 12,
        color: '#059669',
        marginBottom: 8,
        fontWeight: '500',
    },
    disabledButton: {
        backgroundColor: '#9CA3AF',
        opacity: 0.7,
    },
    joinedButton: {
        backgroundColor: '#10B981',
        opacity: 0.9,
    },
    leaderboardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    leaderboardHeaderTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 10,
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    yourRankLabel: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    yourRankContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    yourRankAvatar: {
        position: 'relative',
        marginRight: 14,
    },
    avatarImage: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#667eea',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
    avatarText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#667eea',
    },
    rankBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#667eea',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    rankBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    yourRankInfo: {
        flex: 1,
    },
    yourRankName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 5,
    },
    yourRankScore: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    yourRankScoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F59E0B',
    },
    weeklyChange: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weeklyChangeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#059669',
        marginLeft: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        marginTop: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    topPerformersGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    firstPlaceCard: {
        width: '42%',
        backgroundColor: 'linear-gradient(135deg, #FFFFFF 0%, #FEF3C7 100%)',
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        position: 'relative',
        marginBottom: 0,
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    firstPlaceAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        position: 'relative',
        borderWidth: 3,
        borderColor: '#F59E0B',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    firstPlaceAvatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#92400E',
    },
    firstPlaceName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
        textAlign: 'center',
    },
    firstPlaceScoreText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#D97706',
        marginLeft: 5,
    },
    secondPlaceCard: {
        width: '27%',
        backgroundColor: 'linear-gradient(135deg, #FFFFFF 0%, #FEF3C7 100%)',
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        position: 'relative',
        marginBottom: 0,
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    thirdPlaceCard: {
        width: '27%',
        backgroundColor: 'linear-gradient(135deg, #FFFFFF 0%, #FCE7F3 100%)',
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        position: 'relative',
        marginBottom: 0,
        borderWidth: 2,
        borderColor: '#EC4899',
    },
    topPerformerBadge: {
        position: 'absolute',
        top: -8,
        left: -8,
        backgroundColor: '#6B7280',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    topPerformerBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    topPerformerAvatarText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
    },
    topPerformerScoreText: {
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 3,
        color: '#D97706',
    },
    allPlayersSection: {
        padding: 20,
        backgroundColor: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    allPlayersHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF',
        marginRight: 5,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    currentUserRowHighlight: {
        backgroundColor: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
        borderColor: '#667eea',
        borderWidth: 2,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    playerRankBadge: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        shadowColor: '#5B21B6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    currentUserRankBadge: {
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #5B21B6 100%)',
        borderColor: '#FFFFFF',
        borderWidth: 3,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    playerRankText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 0.5,
    },
    playerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#9CA3AF',
    },
    playerAvatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
    },
    playerInfo: {
        flex: 1,
        marginRight: 12,
    },
    playerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 3,
    },
    playerLevel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    playerScore: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerScoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#7C3AED',
        marginLeft: 5,
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '500',
    },
    emptySubtext: {
        color: '#6B7280',
        fontSize: 13,
        marginTop: 6,
        textAlign: 'center',
    },
    resultContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    resultSummaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#EEF2F7',
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
        elevation: 4,
    },
    resultHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    resultTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    resultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDE9FE',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    resultBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#7C3AED',
        marginLeft: 6,
    },
    resultGrid: {
        flexDirection: 'column',
    },
    resultItem: {
        width: '100%',
    },
    resultItemFull: {
        width: '100%',
    },
    resultItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    resultLabel: {
        fontSize: 12,
        color: '#6B7280',
        flex: 1,
    },
    resultValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        textAlign: 'right',
    },
    resultActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#22C55E',
        borderRadius: 12,
        paddingVertical: 10,
        marginTop: 10,
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 3,
    },
    resultActionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    retryResultButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#C4B5FD',
        backgroundColor: '#F5F3FF',
        marginTop: 12,
    },
    retryResultText: {
        marginLeft: 6,
        color: '#7C3AED',
        fontSize: 13,
        fontWeight: '600',
    },
    crownIcon: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#FFD700',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    topPerformersBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: -1,
    },
    bgCircle1: {
        position: 'absolute',
        top: -20,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    bgCircle2: {
        position: 'absolute',
        bottom: -40,
        left: -20,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(245, 158, 11, 0.06)',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    bgCircle3: {
        position: 'absolute',
        top: 50,
        left: 50,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(34, 197, 94, 0.07)',
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 2,
    },
    bgDots: {
        position: 'absolute',
        top: 120,
        right: 60,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(236, 72, 153, 0.05)',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 1,
    },
    bgWave: {
        position: 'absolute',
        bottom: -10,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: 'rgba(99, 102, 241, 0.04)',
        borderRadius: 30,
        transform: [{ scaleX: 1.2 }],
    },
    winningsContainer: {
        backgroundColor: AppColors.white,
        borderRadius: 12,
        marginBottom: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    // Top Performers Section
    topPerformersSection: {
        padding: 0,
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
        marginTop: 12,
    },
    topPerformersGradient: {
        padding: 0,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    topPerformersTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        paddingHorizontal: 4,
        textAlign: 'center',
    },
    topPerformersRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    topPerformerCard: {
        alignItems: 'center',
        flex: 1,
        backgroundColor: 'transparent',
        padding: 8,
        marginHorizontal: 4,
    },
    topPerformerRankBadge: {
        position: 'absolute',
        top: -8,
        right: 8,
        backgroundColor: '#FB923C',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    topPerformerRankText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    topPerformerAvatar: {
        marginBottom: 10,
    },
    topPerformerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 6,
    },
    topPerformerScore: {
        fontSize: 13,
        color: '#F97316',
        fontWeight: '600',
    },
    topPerformerTime: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 4,
    },
    // Your Rank Section
    yourRankSection: {
        marginBottom: 16,
    },
    yourRankTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    yourRankCard: {
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#C7D2FE',
    },
    yourRankContainer: {
        backgroundColor: '#4F46E5',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginRight: 12,
    },
    yourRankText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    yourRankProfileContainer: {
        marginRight: 12,
    },
    yourRankInfoContainer: {
        flex: 1,
    },
    yourRankNameText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    // Leaderboard Card
    leaderboardCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    leaderboardHeader: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#F97316',
    },
    leaderboardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    leaderboardList: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexGrow: 1,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 6,
        marginBottom: 4,
        backgroundColor: '#FAFAFA',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    leaderboardRankContainer: {
        backgroundColor: '#F97316',
        borderRadius: 6,
        paddingVertical: 2,
        paddingHorizontal: 6,
        marginRight: 8,
        minWidth: 28,
        alignItems: 'center',
    },
    leaderboardRankText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    leaderboardProfileContainer: {
        marginRight: 8,
    },
    leaderboardInfoContainer: {
        flex: 1,
        minWidth: 0,
    },
    leaderboardNameText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F2937',
    },
    leaderboardScoreText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 1,
    },
    noWinnersSection: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: 'rgba(139, 92, 246, 0.02)',
        borderRadius: 16,
    },
    noWinnersText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#64748B',
        marginTop: 16,
        marginBottom: 8,
    },
    noWinnersSubtext: {
        fontSize: 15,
        color: '#94A3B8',
        textAlign: 'center',
        fontWeight: '500',
    },
    // Leaderboard Scroll
    leaderboardScrollView: {
        maxHeight: 420,
        flexGrow: 0,
    },
    examEndedMessage: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 16,
        lineHeight: 18,
        paddingHorizontal: 8,
    },
    // Attempts Tab Styles
    attemptsContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
    },
    attemptInfoCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    attemptInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    attemptStatusText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: 12,
    },
    attemptDetailText: {
        fontSize: 14,
        color: '#374151',
        marginLeft: 12,
        fontWeight: '500',
    },
});

export default ExamDetailScreen;
import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useFonts } from '@/hooks/useFonts';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ExamCard = ({ exam, navigation, hideAttemptButton = false, isDetailsPage = false }: any) => {
    const router = useRouter();
    const { user } = useAuth();
    const fonts = useFonts();
    const [remainingTime, setRemainingTime] = useState('');
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    // Flash animation
    const flashAnim = useRef(new Animated.Value(0.4)).current;
    
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(flashAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(flashAnim, {
                    toValue: 0.4,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);
    const [instructions, setInstructions] = useState<string[] | null>(null);
    const [instructionsLoading, setInstructionsLoading] = useState(false);
    const [liveExamTitle, setLiveExamTitle] = useState('');
    const [declarationChecked, setDeclarationChecked] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [walletLoading, setWalletLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    
    // Animation refs
    const modalScale = useRef(new Animated.Value(0)).current;
    const modalOpacity = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-50)).current;
    const contentSlide = useRef(new Animated.Value(50)).current;

    // Fetch wallet balance
    const fetchWalletBalance = async () => {
        if (!user?.token) return;
        
        try {
            setWalletLoading(true);
            const response = await apiFetchAuth('/student/wallet', user.token);
            if (response.ok) {
                setWalletBalance(response.data.balance || 0);
            }
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
        } finally {
            setWalletLoading(false);
        }
    };

    // Check if user has sufficient balance
    const hasSufficientBalance = () => {
        return walletBalance >= exam.entryFee;
    };

    // Handle payment and join exam
    const handlePaymentAndJoin = async () => {
        if (!user?.token) {
            Alert.alert('Error', 'You must be logged in to attempt this exam.');
            return;
        }

        if (walletBalance < exam.entryFee) {
            Alert.alert(
                'Insufficient Balance',
                `You need ₹${exam.entryFee} to join this exam. Your current balance is ₹${walletBalance.toFixed(2)}.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add Money', onPress: () => router.push('/(tabs)/wallet') }
                ]
            );
            return;
        }

        setPaymentLoading(true);
        try {
            // 1. Deduct amount from wallet
            const paymentResponse = await apiFetchAuth('/student/wallet/deduct', user.token, {
                method: 'POST',
                body: { 
                    amount: exam.entryFee,
                    examId: exam.id,
                    description: `Payment for ${exam.title}`
                }
            });

            if (!paymentResponse.ok) {
                throw new Error(paymentResponse.data?.message || 'Payment failed');
            }

            // 2. Join the exam
            const joinRes = await apiFetchAuth('/student/live-exams/join', user.token, {
                method: 'POST',
                body: { examId: exam.id },
            });
            
            if (!joinRes.ok) {
                throw new Error(joinRes.data?.message || 'Failed to join exam');
            }

            // 3. Get participant info
            const participantRes = await apiFetchAuth(`/student/live-exams/${exam.id}/participant`, user.token);
            if (!participantRes.ok) {
                throw new Error('Failed to get participant info');
            }

            // 4. Fetch questions
            const questionsRes = await apiFetchAuth(`/student/live-exams/${exam.id}/questions`, user.token);
            if (!questionsRes.ok) {
                throw new Error('Failed to fetch questions');
            }

            // 5. Update wallet balance locally
            setWalletBalance(prev => prev - exam.entryFee);
            
            // 6. Close modals and start exam directly
            setShowPaymentModal(false);
            setShowInstructionsModal(false);
            
            // Navigate directly to questions page to start the exam
            router.push({ 
                pathname: '/(tabs)/live-exam/questions', 
                params: { 
                    id: exam.id, 
                    duration: exam.duration, 
                    questions: JSON.stringify(questionsRes.data) 
                } 
            });

        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to process payment and join exam.');
        } finally {
            setPaymentLoading(false);
        }
    };

    useEffect(() => {
        const calculateRemainingTime = () => {
            const now = new Date();
            const endTime = new Date(exam.endTime);
            const diff = endTime.getTime() - now.getTime();

            if (diff <= 0) {
                setRemainingTime('0d : 0h : 0m');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            // If more than or equal to 1 day: show days:hours:minutes
            if (days >= 1) {
                setRemainingTime(`${days}d : ${hours}h : ${minutes}m`);
            } else {
                // If less than 1 day: show hours:minutes:seconds
                setRemainingTime(`${hours}h : ${minutes}m : ${seconds}s`);
            }
        };

        const timer = setInterval(calculateRemainingTime, 1000);
        calculateRemainingTime(); // Initial call
        return () => clearInterval(timer);
    }, [exam.endTime]);

    const progress = exam.spots > 0 ? ((exam.spots - exam.spotsLeft) / exam.spots) * 100 : 0;

    const handleCardPress = () => {
        router.push({
            pathname: "/exam/[id]",
            params: { id: exam.id }
        });
    };

    // Animation functions
    const animateModalIn = () => {
        Animated.parallel([
            Animated.spring(modalScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }),
            Animated.timing(modalOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(headerSlide, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }),
            Animated.spring(contentSlide, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }),
        ]).start();
    };

    const animateModalOut = () => {
        Animated.parallel([
            Animated.spring(modalScale, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }),
            Animated.timing(modalOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(headerSlide, {
                toValue: -50,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }),
            Animated.spring(contentSlide, {
                toValue: 50,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }),
        ]).start(() => {
            setShowPaymentModal(false);
        });
    };

    // Handle View Details or Attempt Now based on page
    const handleAttemptLiveExam = async () => {
        // If on home page, just navigate to details
        if (!isDetailsPage) {
            router.push(`/(tabs)/exam/${exam.id}`);
            return;
        }

        // If on details page, show payment flow
        if (!user?.token) {
            Alert.alert('Error', 'You must be logged in to attempt this exam.');
            return;
        }

        try {
            setWalletLoading(true);
            const response = await apiFetchAuth('/student/wallet', user.token);
            if (response.ok) {
                const currentBalance = response.data.balance || 0;
                setWalletBalance(currentBalance);
                
                if (currentBalance < exam.entryFee) {
                    Alert.alert(
                        'Insufficient Balance',
                        `You need ₹${exam.entryFee} to join this exam. Your current balance is ₹${currentBalance.toFixed(2)}.`,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Add Money', onPress: () => router.push('/(tabs)/wallet') }
                        ]
                    );
                    return;
                }

                setShowPaymentModal(true);
                setTimeout(() => animateModalIn(), 100);
            } else {
                Alert.alert('Error', 'Failed to fetch wallet balance.');
            }
        } catch (error) {
            console.error('Error fetching wallet:', error);
            Alert.alert('Error', 'Failed to fetch wallet balance.');
        } finally {
            setWalletLoading(false);
        }
    };

    return (
        <>
        <TouchableOpacity style={styles.card} onPress={handleCardPress} activeOpacity={0.8}>
            {/* Enhanced Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.titleContainer}>
                        <Text style={fonts.subheaderLarge} numberOfLines={2}>{exam.title}</Text>
                        <View style={styles.categoryContainer}>
                            <View style={styles.categoryBadge}>
                                <Text style={fonts.captionSmall}>{exam.category || 'General Knowledge'}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.endTimeContainer}>
                        <LinearGradient
                            colors={['#FF4444', '#FF6B6B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.liveIndicator}>
                            <View style={styles.liveContent}>
                                <Animated.View style={[styles.flashDot, { opacity: flashAnim }]} />
                                <Text style={styles.liveText}>LIVE</Text>
                            </View>
                        </LinearGradient>
                    </View>
                </View>
            </View>

            {/* Enhanced Spots Section */}
            <View style={styles.spotsContainer}>
                <View style={styles.spotsHeader}>
                    <View style={styles.spotsLeftSection}>
                        <Text style={fonts.bodySmall}>Available Spots</Text>
                    </View>
                    <View style={styles.timerSection}>
                        <View style={styles.endTimeContent}>
                            <View style={styles.clockIconContainer}>
                                <Ionicons name="time-outline" size={15} color="#DC2626" />
                            </View>
                            <Text style={styles.endsInText}>Ends in</Text>
                            <Text style={styles.timeText}>{remainingTime}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.spotsProgressContainer}>
                    <View style={styles.spotsTextContainer}>
                        <Text style={fonts.bodyMedium}>
                            <Text style={fonts.subheaderMedium}>{exam.spotsLeft}</Text> spots left
                        </Text>
                        <Text style={fonts.greySmall}>out of {exam.spots}</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progress, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.progressPercentage}>{Math.round(progress)}% filled</Text>
                    </View>
                </View>
            </View>

            {/* Enhanced Details Section */}
            {/* Removed tags section as requested */}

            {/* Enhanced Footer */}
            <View style={styles.footer}>
                <View style={styles.prizePoolContainer}>
                    <Text style={styles.prizePoolLabel}>Prize Pool</Text>
                    <Text style={styles.prizePoolAmount}>₹{exam.prizePool?.toFixed(2) || '0.00'}</Text>
                    <Text style={styles.prizePoolSubtext}>*Up to this amount</Text>
                </View>
                
                {!hideAttemptButton && (
                    <TouchableOpacity style={styles.attemptButton} onPress={handleAttemptLiveExam}>
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.attemptButtonGradient}
                        >
                            <View style={styles.attemptButtonContent}>
                                <Text style={styles.attemptButtonText}>
                                    {isDetailsPage ? 'Attempt Now' : 'View Details'}
                                </Text>
                                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
        
        {/* Payment Confirmation Modal */}
        <Modal
          visible={showPaymentModal}
          animationType="none"
          transparent={true}
          onRequestClose={animateModalOut}
        >
          <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  transform: [
                    { scale: modalScale },
                    { translateY: contentSlide }
                  ]
                }
              ]}
            >
                             {/* Enhanced Header with App Header Colors */}
                <View style={styles.modalHeaderGradient}>
                  <Animated.View 
                    style={[
                      styles.modalHeader,
                      { transform: [{ translateY: headerSlide }] }
                    ]}
                  >
                    <View style={styles.modalHeaderContent}>
                      <View style={styles.modalIconContainer}>
                        <Ionicons name="card" size={28} color="#fff" />
                      </View>
                      <View style={styles.modalTitleContainer}>
                        <Text style={styles.modalTitleEnhanced}>Payment Confirmation</Text>
                        <Text style={styles.modalSubtitleEnhanced}>Complete your exam registration</Text>
                      </View>
                    </View>
                  </Animated.View>
                </View>
              
              <View style={styles.paymentDetails}>
                
                {/* Enhanced Payment Breakdown */}
                <View style={styles.paymentBreakdownEnhanced}>
                  <View style={styles.paymentBreakdownHeader}>
                                         <Ionicons name="calculator" size={20} color="#4F46E5" />
                    <Text style={styles.paymentBreakdownTitle}>Payment Summary</Text>
                  </View>
                  
                  <View style={styles.paymentRowEnhanced}>
                    <View style={styles.paymentLabelContainer}>
                      <Ionicons name="pricetag" size={16} color="#666" />
                      <Text style={styles.paymentLabelEnhanced}>Entry Fee</Text>
                    </View>
                    <Text style={styles.paymentAmountEnhanced}>₹{exam.entryFee}</Text>
                  </View>
                  
                  <View style={styles.paymentRowEnhanced}>
                    <View style={styles.paymentLabelContainer}>
                      <Ionicons name="wallet" size={16} color="#666" />
                      <Text style={styles.paymentLabelEnhanced}>Your Balance</Text>
                    </View>
                    <Text style={[styles.paymentAmountEnhanced, { color: walletBalance >= exam.entryFee ? '#28a745' : '#dc3545' }]}>
                      ₹{walletBalance.toFixed(2)}
                    </Text>
                  </View>
                  
                </View>
                
                {/* Enhanced Warning for Insufficient Balance */}
                {walletBalance < exam.entryFee && (
                  <View style={styles.insufficientWarningEnhanced}>
                    <View style={styles.warningIconContainer}>
                      <Ionicons name="warning" size={24} color="#dc3545" />
                    </View>
                    <View style={styles.warningContent}>
                      <Text style={styles.warningTitle}>Insufficient Balance</Text>
                      <Text style={styles.warningText}>
                        You need ₹{(exam.entryFee - walletBalance).toFixed(2)} more to join this exam. Please add money to your wallet.
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* Enhanced Success Message for Sufficient Balance */}
                {walletBalance >= exam.entryFee && (
                  <View style={styles.sufficientBalanceMessage}>
                    <View style={styles.successIconContainer}>
                      <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                    </View>
                    <View style={styles.successContent}>
                      <Text style={styles.successTitle}>Ready to Join!</Text>
                      <Text style={styles.successText}>
                        You have sufficient balance to join this exam. Click "Join Exam" to proceed.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              
                                                           {/* Enhanced Modal Actions */}
                <View style={styles.modalActionsEnhanced}>
                  <TouchableOpacity
                    style={[
                      styles.confirmButtonEnhanced,
                      (walletBalance < exam.entryFee || paymentLoading) && styles.confirmButtonDisabledEnhanced
                    ]}
                    disabled={walletBalance < exam.entryFee || paymentLoading}
                    onPress={handlePaymentAndJoin}
                  >
                    <View style={[
                      styles.confirmButtonGradient,
                      walletBalance >= exam.entryFee ? {} : { backgroundColor: '#E5E7EB', borderColor: 'rgba(107, 114, 128, 0.2)' }
                    ]}>
                      {paymentLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="play-circle" size={20} color="#fff" />
                          <Text style={styles.confirmButtonTextEnhanced}>
                            Join Exam
                          </Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.cancelButtonEnhanced}
                    onPress={() => setShowPaymentModal(false)}
                  >
                    <Ionicons name="close-circle" size={20} color="#DC2626" />
                    <Text style={styles.cancelButtonTextEnhanced}>Cancel</Text>
                  </TouchableOpacity>
                </View>
            </Animated.View>
          </Animated.View>
        </Modal>

        {/* Instructions Modal for Live Exam */}
        <Modal
          visible={showInstructionsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowInstructionsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitleEnhanced}>{liveExamTitle}</Text>
                <TouchableOpacity 
                  style={styles.closeButtonEnhanced}
                  onPress={() => setShowInstructionsModal(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.instructionsTitle}>Instructions</Text>
              {instructionsLoading ? (
                <ActivityIndicator size="large" color={AppColors.primary} />
              ) : instructions && instructions.length > 0 ? (
                <ScrollView style={styles.instructionsScroll}>
                  {instructions.map((inst, idx) => (
                    <Text key={idx} style={styles.instructionText}>• {inst}</Text>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noInstructionsText}>No instructions found.</Text>
              )}
              
              {/* Declaration Section */}
              <Text style={styles.declarationTitle}>Declaration:</Text>
              <View style={styles.declarationContainer}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    declarationChecked && styles.checkboxChecked
                  ]}
                  onPress={() => setDeclarationChecked(!declarationChecked)}
                >
                  {declarationChecked && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </TouchableOpacity>
                <Text style={styles.declarationText}>
                  I have read all the instructions carefully and have understood them. I agree not to cheat or use unfair means in this examination. I understand that using unfair means of any sort for my own or someone else's advantage will lead to my immediate disqualification.
                </Text>
              </View>
              
              <View style={styles.modalActionsEnhanced}>
                <TouchableOpacity
                  style={styles.cancelButtonEnhanced}
                  onPress={() => setShowInstructionsModal(false)}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                  <Text style={styles.cancelButtonTextEnhanced}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.confirmButtonEnhanced,
                    (!declarationChecked || instructionsLoading) && styles.confirmButtonDisabledEnhanced
                  ]}
                  disabled={!declarationChecked || instructionsLoading}
                  onPress={handlePaymentAndJoin}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.confirmButtonGradient}
                  >
                    {instructionsLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="play-circle" size={20} color="#fff" />
                        <Text style={styles.confirmButtonTextEnhanced}>Start Exam</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: AppColors.white,
        borderRadius: 12,
        padding: 12,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        width: '100%', // Full width within parent container
        alignSelf: 'center', // Center the card
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 6,
    },
    headerGradient: {
        padding: 12,
        borderRadius: 12,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleContainer: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 6,
        borderRadius: 6,
        marginRight: 8,
    },
    categoryContainer: {
        flexDirection: 'row',
    },
    categoryBadge: {
        marginRight: 4,
        backgroundColor: 'rgba(230, 81, 0, 0.1)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    endTimeContainer: {
        position: 'relative',
        minWidth: 80,
        alignItems: 'flex-end',
    },
    endTimeContent: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.15)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    clockIconContainer: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 2,
    },
    endsInText: {
        fontSize: 11,
        color: '#DC2626',
        fontWeight: '500',
    },
    timeText: {
        fontSize: 11,
        color: '#DC2626',
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    liveIndicator: {
        position: 'absolute',
        top: 2,
        right: 2,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    liveContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    flashDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
        opacity: 0.9,
    },
    liveText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '600',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    liveIndicatorGradient: {
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    spotsContainer: {
        marginTop: 8,
    },
    spotsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    spotsLeftSection: {
        flex: 1,
    },
    spotsSubtitle: {
        fontSize: 10,
        color: AppColors.grey,
    },
    timerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10, // Added margin to separate from spotsLeftSection
    },
    timerIconContainer: {
        width: 20, // Reduced from 24
        height: 20, // Reduced from 24
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6, // Reduced from 8
        flexShrink: 0, // Added to prevent icon shrinking
    },
    timerTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    spotsProgressContainer: {
        marginTop: 8, // Reduced from 10
    },
    spotsTextContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4, // Reduced from 5
    },
    progressBarContainer: {
        alignItems: 'center',
    },
    progressBar: {
        height: 6, // Reduced from 8
        backgroundColor: '#EAEAEA',
        borderRadius: 3, // Reduced from 4
        overflow: 'hidden',
        width: '100%',
    },
    progress: {
        height: '100%',
        backgroundColor: '#5DADE2',
    },
    progressPercentage: {
        fontSize: 11, // Reduced from 12
        color: AppColors.grey,
        marginTop: 4, // Reduced from 5
    },
    detailsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12, // Reduced from 15
        paddingBottom: 12, // Reduced from 15
        borderBottomWidth: 1,
        borderBottomColor: AppColors.lightGrey,
    },
    tagsContainer: {
        flexDirection: 'row',
        marginBottom: 8, // Reduced from 10
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16, // Reduced from 20
    },
    tagIconContainer: {
        width: 20, // Reduced from 24
        height: 20, // Reduced from 24
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6, // Reduced from 8
    },
    tagText: {
        fontSize: 13, // Reduced from 14
        color: AppColors.darkGrey,
        fontWeight: '500',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8, // Reduced from 10
        flexWrap: 'wrap', // Added to prevent text cutting
    },
    timerText: { // Added this style to fix linter error
        flex: 1,
        fontSize: 13, // Reduced from 14
        color: AppColors.darkGrey,
        fontWeight: '500',
        flexWrap: 'wrap', // Added to prevent text cutting
    },
    remainingTime: {
        fontSize: 14,
        color: AppColors.darkGrey,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12, // Reduced from 15
    },
    prizePoolContainer: {
        marginRight: 16,
    },
    prizePoolLabel: {
        fontSize: 11,
        color: AppColors.grey,
        marginBottom: 2,
    },
    prizePoolAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: AppColors.primary,
        letterSpacing: 0.3,
    },
    prizePoolSubtext: {
        fontSize: 10,
        color: AppColors.grey,
        marginTop: 2,
        opacity: 0.8,
    },
    attemptButton: {
        borderRadius: 8,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
        overflow: 'hidden',
    },
    attemptButtonGradient: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    attemptButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    attemptButtonText: {
        color: '#FFFFFF', // White text on green background
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: AppColors.white,
        borderRadius: 20,
        margin: 20,
        maxHeight: '85%',
        width: '90%',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
        elevation: 0,
    },
    modalHeaderGradient: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: '#4F46E5',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        elevation: 0,
    },
    modalTitleContainer: {
        flex: 1,
    },
    modalTitleEnhanced: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppColors.white,
        marginBottom: 4,
    },
    modalSubtitleEnhanced: {
        fontSize: 13,
        color: AppColors.white,
    },
         closeButtonEnhanced: {
         position: 'absolute',
         top: 10,
         right: 10,
         zIndex: 10,
     },
         closeButtonBackground: {
         width: 36,
         height: 36,
         borderRadius: 18,
         backgroundColor: 'rgba(255, 255, 255, 0.15)',
         justifyContent: 'center',
         alignItems: 'center',
         borderWidth: 1,
         borderColor: 'rgba(255, 255, 255, 0.25)',
     },
    paymentDetails: {
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    examInfoEnhanced: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
    },
    examIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.2)',
        elevation: 0,
    },
    examInfoContent: {
        flex: 1,
    },
    examTitleEnhanced: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 4,
    },
    examBadgeContainer: {
        flexDirection: 'row',
    },
    liveExamBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF4444',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 68, 68, 0.2)',
        elevation: 0,
    },
    liveExamText: {
        color: AppColors.white,
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    paymentBreakdownEnhanced: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.15)',
        elevation: 0,
    },
    paymentBreakdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.15)',
        elevation: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    paymentBreakdownTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginLeft: 8,
    },
    paymentRowEnhanced: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#FFFFFF',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
        elevation: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    paymentLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    paymentLabelEnhanced: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    paymentAmountEnhanced: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4F46E5',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(79, 70, 229, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    insufficientWarningEnhanced: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8d7da',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(220, 53, 69, 0.15)',
        elevation: 0,
    },
    warningIconContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f5c6cb',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(220, 53, 69, 0.2)',
        elevation: 0,
    },
    warningContent: {
        flex: 1,
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#721c24',
        marginBottom: 4,
    },
    warningText: {
        fontSize: 13,
        color: '#721c24',
        lineHeight: 18,
    },
    sufficientBalanceMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d4edda',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(40, 167, 69, 0.15)',
        elevation: 0,
    },
    successIconContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#a5d6a7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(40, 167, 69, 0.2)',
        elevation: 0,
    },
    successContent: {
        flex: 1,
    },
    successTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#28a745',
        marginBottom: 4,
    },
    successText: {
        fontSize: 13,
        color: '#28a745',
        lineHeight: 18,
    },
    modalActionsEnhanced: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(226, 232, 240, 0.8)',
        gap: 12,
        backgroundColor: '#FFFFFF',
        position: 'relative',
        zIndex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 0,
    },
    cancelButtonEnhanced: {
        flex: 0.38,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.15)',
        elevation: 0,
        minHeight: 52,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        transform: [{ scale: 0.98 }],
    },
    cancelButtonTextEnhanced: {
        fontSize: 15,
        fontWeight: '600',
        color: '#DC2626',
        marginLeft: 8,
        letterSpacing: 0.3,
        textShadowColor: 'rgba(220, 38, 38, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    confirmButtonEnhanced: {
        flex: 0.6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 8,
        minHeight: 52,
        backgroundColor: '#4F46E5',
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.2)',
        elevation: 0,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    confirmButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
     confirmButtonDisabledEnhanced: {
         backgroundColor: '#e9ecef',
         shadowOpacity: 0,
         elevation: 0,
     },
    confirmButtonTextEnhanced: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    // Instructions Modal Styles
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: AppColors.darkGrey,
        paddingHorizontal: 20,
    },
    instructionsScroll: {
        maxHeight: 120,
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    instructionText: {
        fontSize: 15,
        color: '#333',
        marginBottom: 8,
    },
    noInstructionsText: {
        color: '#888',
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    declarationTitle: {
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 4,
        color: AppColors.darkGrey,
        paddingHorizontal: 20,
    },
    declarationContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#ccc',
        borderRadius: 4,
        backgroundColor: 'transparent',
        marginRight: 8,
        marginTop: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
    },
    declarationText: {
        flex: 1,
        color: '#333',
        fontSize: 14,
        lineHeight: 20,
    },

});

export default ExamCard; 
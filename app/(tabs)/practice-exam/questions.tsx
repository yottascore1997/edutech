import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useLiveExam } from '@/context/LiveExamContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, AppStateStatus, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Question {
  id: string;
  text: string;
  options: string[];
  marks: number;
}

interface QuestionStatus {
  answered: boolean;
  marked: boolean;
  visited: boolean;
  selectedOption?: number;
}

interface SavedPracticeExamState {
  examId: string;
  questions: Question[];
  statuses: QuestionStatus[];
  currentIndex: number;
  remainingSeconds: number;
  savedAt: number;
}

const PRACTICE_EXAM_STATE_KEY = (examId: string) => `practice_exam_state_${examId}`;
const SAVED_STATE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const PracticeExamQuestionsScreen = () => {
  const { id, duration } = useLocalSearchParams<{ id: string, duration?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { setLiveExamInProgress } = useLiveExam();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [statuses, setStatuses] = useState<QuestionStatus[]>([]);
  const [timer, setTimer] = useState(() => duration ? parseInt(duration) * 60 : 12 * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resumePayload, setResumePayload] = useState<SavedPracticeExamState | null>(null);

  const allowLeaveRef = useRef(false);
  const questionsRef = useRef<Question[]>([]);
  const statusesRef = useRef<QuestionStatus[]>([]);
  const currentRef = useRef(0);
  const timerStateRef = useRef(0);
  questionsRef.current = questions;
  statusesRef.current = statuses;
  currentRef.current = current;
  timerStateRef.current = timer;

  const saveExamState = useCallback(async () => {
    if (!id || questionsRef.current.length === 0) return;
    try {
      const payload: SavedPracticeExamState = {
        examId: id,
        questions: questionsRef.current,
        statuses: statusesRef.current,
        currentIndex: currentRef.current,
        remainingSeconds: timerStateRef.current,
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem(PRACTICE_EXAM_STATE_KEY(id), JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save practice exam state', e);
    }
  }, [id]);

  const clearExamState = useCallback(async () => {
    if (!id) return;
    try {
      await AsyncStorage.removeItem(PRACTICE_EXAM_STATE_KEY(id));
    } catch (e) {
      console.warn('Failed to clear practice exam state', e);
    }
  }, [id]);

  // Initialize: check for saved state (resume) or fetch fresh
  useEffect(() => {
    if (!id || !user?.token) return;
    const initializeExam = async () => {
      try {
        const raw = await AsyncStorage.getItem(PRACTICE_EXAM_STATE_KEY(id));
        if (raw) {
          const parsed: SavedPracticeExamState = JSON.parse(raw);
          if (parsed.examId !== id || !parsed.questions?.length) {
            await AsyncStorage.removeItem(PRACTICE_EXAM_STATE_KEY(id));
          } else {
            const age = Date.now() - parsed.savedAt;
            if (age <= SAVED_STATE_MAX_AGE_MS) {
              const elapsedSec = Math.floor(age / 1000);
              const remaining = Math.max(0, parsed.remainingSeconds - elapsedSec);
              if (remaining > 0) {
                setResumePayload(parsed);
                setLoading(false);
                return;
              }
            }
            await AsyncStorage.removeItem(PRACTICE_EXAM_STATE_KEY(id));
          }
        }
      } catch (_) {
        try { await AsyncStorage.removeItem(PRACTICE_EXAM_STATE_KEY(id)); } catch (_2) {}
      }
      fetchQuestions();
    };
    initializeExam();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, user?.token]);

  useEffect(() => {
    if (duration) {
      setTimer(parseInt(duration) * 60);
    }
  }, [duration]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' && questionsRef.current.length > 0) {
        saveExamState();
      }
    });
    return () => sub.remove();
  }, [saveExamState]);

  const fetchQuestions = async () => {
    if (!user?.token) return;
    console.log('Fetching questions with user ID:', user.id, 'Exam ID:', id);
    setLoading(true);
    try {
      const res = await apiFetchAuth(`/student/practice-exams/${id}/questions`, user.token);
      if (res.ok) {
        console.log('Successfully fetched questions');
        setQuestions(res.data);
        setStatuses(res.data.map(() => ({ answered: false, marked: false, visited: false })));
        setLoading(false);
        startTimer();
      } else {
        Alert.alert('Error', 'Could not fetch questions.');
        setLoading(false);
      }
    } catch (e) {
      console.error('Error fetching questions:', e);
      Alert.alert('Error', 'Could not fetch questions.');
      setLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto-submit when timer reaches 0
          autoSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResumeAttempt = () => {
    if (!resumePayload) return;
    const elapsedSec = Math.floor((Date.now() - resumePayload.savedAt) / 1000);
    const remaining = Math.max(0, resumePayload.remainingSeconds - elapsedSec);
    setQuestions(resumePayload.questions);
    setStatuses(resumePayload.statuses);
    setCurrent(resumePayload.currentIndex);
    setTimer(remaining);
    setResumePayload(null);
    if (remaining <= 0) {
      setTimeout(() => autoSubmitExam(), 150);
      return;
    }
    startTimer();
  };

  const handleStartFresh = async () => {
    await clearExamState();
    setResumePayload(null);
    setLoading(true);
    fetchQuestions();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `00 : ${m} : ${s}`;
  };

  const handleOptionSelect = (optionIdx: number) => {
    setStatuses((prev) => {
      const updated = [...prev];
      updated[current] = {
        ...updated[current],
        answered: true,
        selectedOption: optionIdx,
        visited: true,
      };
      return updated;
    });
  };

  const handleMark = () => {
    setStatuses((prev) => {
      const updated = [...prev];
      updated[current] = {
        ...updated[current],
        marked: !updated[current].marked,
        visited: true,
      };
      return updated;
    });
  };

  const handleNav = (idx: number) => {
    setCurrent(idx);
    setStatuses((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], visited: true };
      return updated;
    });
    setShowSidePanel(false); // Close side panel when navigating
  };

  const handleNext = () => {
    if (current < questions.length - 1) handleNav(current + 1);
  };

  const handleSkip = () => {
    // Mark current question as visited but not answered
    setStatuses((prev) => {
      const updated = [...prev];
      updated[current] = {
        ...updated[current],
        visited: true,
        answered: false,
        selectedOption: undefined,
      };
      return updated;
    });
    
    // Move to next question
    if (current < questions.length - 1) {
      handleNav(current + 1);
    }
  };

  const isLastQuestion = current === questions.length - 1;

  const handleSubmit = async () => {
    setShowSubmitModal(true);
  };

  const autoSubmitExam = async () => {
    // Auto-submit without showing modal when timer expires
    setSubmitting(true);
    try {
      // Prepare answers payload
      const answers: { [key: string]: number } = {};
      statuses.forEach((status, index) => {
        if (status.answered && status.selectedOption !== undefined) {
          answers[questions[index].id] = status.selectedOption;
        }
      });

      console.log('Auto-submitting exam (timer expired):', answers);

      // Make API call to submit the test
      const response = await apiFetchAuth(`/student/practice-exams/${id}/submit`, user?.token || '', {
        method: 'POST',
        body: { answers }
      });

      if (response.ok) {
        console.log('Exam auto-submitted successfully');
        console.log('Submit response:', response.data);
        setSubmitting(false);
        await clearExamState();
        
        // Pass full response data (includes result and rankPreview)
        const resultData = response.data;
        console.log('📦 Full response.data structure (auto-submit):', {
          hasSuccess: !!resultData.success,
          hasRedirectTo: !!resultData.redirectTo,
          hasResult: !!resultData.result,
          hasRankPreview: !!resultData.rankPreview,
          rankPreviewData: resultData.rankPreview
        });
        
        // Ensure we're passing the full response structure
        const dataToPass = {
          success: resultData.success,
          redirectTo: resultData.redirectTo,
          result: resultData.result,
          rankPreview: resultData.rankPreview
        };
        
        console.log('📦 Data to pass (full structure - auto-submit):', JSON.stringify(dataToPass, null, 2));
        
        // Store result data and redirect to result page
        router.push({
          pathname: '/(tabs)/practice-exam/result/[id]' as any,
          params: { 
            id: id,
            resultData: JSON.stringify(dataToPass) 
          }
        });
      } else {
        console.error('Failed to auto-submit test:', response);
        setSubmitting(false);
        Alert.alert('Time Up!', 'Your exam has been automatically submitted. Redirecting to results...');
        // Even if API fails, try to navigate to result page
        router.push({
          pathname: '/(tabs)/practice-exam/result/[id]' as any,
          params: { id: id }
        });
      }
    } catch (error) {
      console.error('Error auto-submitting exam:', error);
      setSubmitting(false);
      Alert.alert('Time Up!', 'Your exam has been automatically submitted. Redirecting to results...');
      // Even if error occurs, try to navigate to result page
      router.push({
        pathname: '/(tabs)/practice-exam/result/[id]' as any,
        params: { id: id }
      });
    }
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    try {
      // Prepare answers payload
      const answers: { [key: string]: number } = {};
      statuses.forEach((status, index) => {
        if (status.answered && status.selectedOption !== undefined) {
          answers[questions[index].id] = status.selectedOption;
        }
      });

      console.log('Submitting answers:', answers);

      // Make API call to submit the test
      const response = await apiFetchAuth(`/student/practice-exams/${id}/submit`, user?.token || '', {
        method: 'POST',
        body: { answers }
      });

      if (response.ok) {
        console.log('Test submitted successfully');
        console.log('Submit response:', response.data);
        setShowSubmitModal(false);
        setSubmitting(false);
        await clearExamState();
        
        // Pass full response data (includes result and rankPreview)
        const resultData = response.data;
        console.log('📦 Full response.data structure:', {
          hasSuccess: !!resultData.success,
          hasRedirectTo: !!resultData.redirectTo,
          hasResult: !!resultData.result,
          hasRankPreview: !!resultData.rankPreview,
          rankPreviewData: resultData.rankPreview
        });
        
        // Ensure we're passing the full response structure
        const dataToPass = {
          success: resultData.success,
          redirectTo: resultData.redirectTo,
          result: resultData.result,
          rankPreview: resultData.rankPreview
        };
        
        console.log('📦 Data to pass (full structure):', JSON.stringify(dataToPass, null, 2));
        
        // Store result data and redirect to result page
        router.push({
          pathname: '/(tabs)/practice-exam/result/[id]' as any,
          params: { 
            id: id,
            resultData: JSON.stringify(dataToPass) 
          }
        });
      } else {
        console.error('Failed to submit test:', response);
        setSubmitting(false);
        Alert.alert('Error', 'Failed to submit the test. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      setSubmitting(false);
      Alert.alert('Error', 'An error occurred while submitting the test. Please try again.');
    }
  };

  // Leave warning (back button): on Leave = save progress and go back
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (allowLeaveRef.current || questions.length === 0) return;
      e.preventDefault();
      Alert.alert(
        'Leave exam?',
        'Leaving will save your progress. You can resume when you return. Time will keep counting down.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              saveExamState();
              setLiveExamInProgress(false);
              allowLeaveRef.current = true;
              router.back();
            },
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, questions.length, saveExamState, setLiveExamInProgress]);

  // On focus: mark in progress so tab bar shows alert. On blur: save + clear.
  useFocusEffect(
    useCallback(() => {
      if (questionsRef.current.length > 0) {
        setLiveExamInProgress(true);
      }
      return () => {
        if (questionsRef.current.length > 0) {
          saveExamState();
        }
        setLiveExamInProgress(false);
      };
    }, [saveExamState, setLiveExamInProgress])
  );

  // Summary counts
  const answered = statuses.filter(s => s.answered).length;
  const marked = statuses.filter(s => s.marked).length;
  const notVisited = statuses.filter(s => !s.visited).length;
  const markedAndAnswered = statuses.filter(s => s.answered && s.marked).length;
  const notAnswered = statuses.filter(s => s.visited && !s.answered).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Loading Exam...</Text>
      </View>
    );
  }

  if (resumePayload) {
    const elapsedSec = Math.floor((Date.now() - resumePayload.savedAt) / 1000);
    const remaining = Math.max(0, resumePayload.remainingSeconds - elapsedSec);
    const minLeft = Math.floor(remaining / 60);
    const secLeft = remaining % 60;
    const timeStr = minLeft > 0 ? `${minLeft} min ${secLeft} sec` : `${secLeft} sec`;
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.resumeDialogBox}>
          <Ionicons name="time" size={40} color={AppColors.primary} style={{ marginBottom: 10 }} />
          <Text style={styles.resumeDialogTitle}>Resume your attempt?</Text>
          <Text style={styles.resumeDialogSubtext}>
            You have a saved attempt with {timeStr} remaining.
          </Text>
          <View style={styles.resumeDialogButtons}>
            <TouchableOpacity style={styles.resumeDialogButtonPrimary} onPress={handleResumeAttempt} activeOpacity={0.85}>
              <Text style={styles.resumeDialogButtonPrimaryText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resumeDialogButtonSecondary} onPress={handleStartFresh} activeOpacity={0.85}>
              <Text style={styles.resumeDialogButtonSecondaryText}>Start fresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Timer and Side Panel Toggle */}
      <View style={styles.timerRow}>
        <TouchableOpacity 
          style={styles.sidePanelToggle} 
          onPress={() => setShowSidePanel(!showSidePanel)}
        >
          <Ionicons name={showSidePanel ? "close" : "menu"} size={24} color={AppColors.primary} />
        </TouchableOpacity>
        <Text style={styles.timerText}>{formatTime(timer)}</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Current Question */}
        <View style={styles.questionCard}>
          <Text style={styles.qNumber}>Q{current + 1}.</Text>
          <Text style={styles.qText}>{questions[current]?.text}</Text>
          <View style={styles.optionsList}>
            {questions[current]?.options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.optionBtn, statuses[current]?.selectedOption === idx && styles.optionBtnSelected]}
                onPress={() => handleOptionSelect(idx)}
              >
                <View style={[styles.radioOuter, statuses[current]?.selectedOption === idx && styles.radioOuterSelected]}>
                  {statuses[current]?.selectedOption === idx && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.qActionsRow}>
            <TouchableOpacity style={styles.markBtn} onPress={handleMark}>
              <Ionicons name={statuses[current]?.marked ? 'bookmark' : 'bookmark-outline'} size={18} color={AppColors.primary} />
              <Text style={styles.markBtnText}>{statuses[current]?.marked ? 'Unmark' : 'Mark for Review'}</Text>
            </TouchableOpacity>
            <View style={styles.navigationButtons}>
              {!isLastQuestion && (
                <>
                  <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                    <Text style={styles.skipBtnText}>Next</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                    <Text style={styles.nextBtnText}>Save & Next →</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          
          {/* Submit Test Button - Moved to bottom center */}
          <View style={styles.submitButtonContainer}>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Test</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>



      {/* Side Panel */}
      {showSidePanel && (
        <View style={styles.sidePanel}>
          <ScrollView style={styles.sidePanelScroll} showsVerticalScrollIndicator={false}>
            {/* User Profile */}
            <View style={styles.sidePanelSection}>
              <View style={styles.userRow}>
                <Ionicons name="person-circle" size={32} color={AppColors.primary} />
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
              </View>
            </View>

            {/* Summary Stats */}
            <View style={styles.sidePanelSection}>
              <Text style={styles.sidePanelTitle}>Summary</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusBox, { backgroundColor: '#4CAF50' }]}>
                  <Text style={styles.statusCount}>{answered}</Text>
                  <Text style={styles.statusLabel}>Answered</Text>
                </View>
                <View style={[styles.statusBox, { backgroundColor: '#FFC107' }]}>
                  <Text style={styles.statusCount}>{marked}</Text>
                  <Text style={styles.statusLabel}>Marked</Text>
                </View>
                <View style={[styles.statusBox, { backgroundColor: '#BDBDBD' }]}>
                  <Text style={styles.statusCount}>{notVisited}</Text>
                  <Text style={styles.statusLabel}>Not Visited</Text>
                </View>
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.legendText}>Marked and answered</Text>
                </View>
                <View style={styles.legendItem}>
                  <Ionicons name="close-circle" size={16} color="#F44336" />
                  <Text style={styles.legendText}>Not Answered</Text>
                </View>
              </View>
            </View>

            {/* Question Navigation */}
            <View style={styles.sidePanelSection}>
              <Text style={styles.sidePanelTitle}>Question Navigation</Text>
              <View style={styles.questionGrid}>
                {questions.map((q, idx) => {
                  let bg = '#fff', border = '#BDBDBD', color = AppColors.darkGrey;
                  if (statuses[idx]?.answered && statuses[idx]?.marked) { bg = '#4CAF50'; color = '#fff'; }
                  else if (statuses[idx]?.answered) { bg = '#4CAF50'; color = '#fff'; }
                  else if (statuses[idx]?.marked) { bg = '#FFC107'; color = '#000'; }
                  else if (!statuses[idx]?.visited) { bg = '#fff'; border = '#BDBDBD'; color = AppColors.darkGrey; }
                  else if (statuses[idx]?.visited && !statuses[idx]?.answered) { bg = '#F44336'; color = '#fff'; }
                  
                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={[
                        styles.qNavBtn, 
                        { backgroundColor: bg, borderColor: border },
                        current === idx && styles.currentQuestion
                      ]}
                      onPress={() => handleNav(idx)}
                    >
                      <Text style={[styles.qNavText, { color }]}>{idx + 1}</Text>
                      {statuses[idx]?.answered && statuses[idx]?.marked && (
                        <Ionicons name="checkmark" size={14} color="#fff" style={styles.checkmarkIcon} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Compact Submit Confirmation Modal */}
      <Modal
        visible={showSubmitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubmitModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContainerCompact}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.submitModalHeaderCompact}>
              <View style={styles.submitModalIconSmall}>
                <Ionicons name="checkmark-done-circle" size={20} color="#0D9488" />
              </View>
              <Text style={styles.submitModalTitleCompact}>Submit exam?</Text>
              <TouchableOpacity 
                style={styles.submitModalCloseBtnSmall}
                onPress={() => setShowSubmitModal(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.submitModalBodyCompact}>
              <View style={styles.submitModalGrid}>
                <View style={styles.submitModalGridItem}>
                  <Text style={styles.submitModalGridValueGreen}>{answered}</Text>
                  <Text style={styles.submitModalGridLabel}>Answered</Text>
                </View>
                <View style={styles.submitModalGridItem}>
                  <Text style={styles.submitModalGridValueRed}>{questions.length - answered}</Text>
                  <Text style={styles.submitModalGridLabel}>Unanswered</Text>
                </View>
              </View>
              <View style={styles.submitModalWarning}>
                <Ionicons name="warning" size={18} color="#DC2626" />
                <Text style={styles.submitModalWarningText}>Answers cannot be changed after submission.</Text>
              </View>
            </View>

            <View style={styles.modalActionsCompact}>
              <TouchableOpacity
                style={styles.cancelButtonCompact}
                onPress={() => setShowSubmitModal(false)}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonTextCompact}>Review</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitConfirmButton}
                onPress={confirmSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={submitting ? ['#94A3B8', '#64748B'] : ['#0D9488', '#059669']}
                  style={styles.submitButtonGradientCompact}
                >
                  {submitting ? (
                    <View style={styles.submitButtonContent}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.submitConfirmButtonText}>Submitting…</Text>
                    </View>
                  ) : (
                    <View style={styles.submitButtonContent}>
                      <Ionicons name="send" size={16} color="#fff" />
                      <Text style={styles.submitConfirmButtonText}>Submit</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F6F8FB',
    paddingTop: 10 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 10, 
    fontSize: 16, 
    color: AppColors.primary 
  },
  resumeDialogBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    marginHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resumeDialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  resumeDialogSubtext: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 18,
    textAlign: 'center',
  },
  resumeDialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resumeDialogButtonPrimary: {
    backgroundColor: AppColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  resumeDialogButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  resumeDialogButtonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minWidth: 110,
    alignItems: 'center',
  },
  resumeDialogButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  timerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    marginBottom: 6 
  },
  sidePanelToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: AppColors.primary
  },
  timerText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: AppColors.primary 
  },
  pauseBtn: { 
    backgroundColor: '#fff', 
    borderRadius: 6, 
    paddingHorizontal: 14, 
    paddingVertical: 4, 
    borderWidth: 1, 
    borderColor: AppColors.primary 
  },
  pauseText: { 
    color: AppColors.primary, 
    fontWeight: 'bold' 
  },
  mainContent: {
    flex: 1,
    marginRight: 0
  },
  questionCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    margin: 10, 
    padding: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    elevation: 2 
  },
  qNumber: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    color: AppColors.primary, 
    marginBottom: 6 
  },
  qText: { 
    fontSize: 16, 
    color: AppColors.darkGrey, 
    marginBottom: 16 
  },
  optionsList: { 
    marginBottom: 12 
  },
  optionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F6F8FB', 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 8 
  },
  optionBtnSelected: { 
    backgroundColor: '#E0F7FA', 
    borderColor: AppColors.primary, 
    borderWidth: 1 
  },
  radioOuter: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: AppColors.primary, 
    marginRight: 10, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#fff' 
  },
  radioOuterSelected: { 
    backgroundColor: AppColors.primary 
  },
  radioInner: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: '#fff' 
  },
  optionText: { 
    fontSize: 15, 
    color: AppColors.darkGrey 
  },
  qActionsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 5
  },
  markBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F3F4F6', 
    borderRadius: 10, 
    paddingVertical: 10, 
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    marginRight: 8
  },
  markBtnText: { 
    color: AppColors.primary, 
    fontWeight: 'bold', 
    marginLeft: 6,
    fontSize: 13
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 2
  },
  skipBtn: {
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1
  },
  skipBtnText: {
    color: AppColors.primary,
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center'
  },
  nextBtn: { 
    backgroundColor: AppColors.primary, 
    borderRadius: 10, 
    paddingVertical: 10, 
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    flex: 1
  },
  nextBtnText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 13,
    textAlign: 'center'
  },
  submitButtonContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
    paddingHorizontal: 10
  },
  submitBtn: { 
    backgroundColor: '#FF6B6B', 
    borderRadius: 16, 
    paddingVertical: 16, 
    paddingHorizontal: 40, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
    maxWidth: 300
  },
  submitBtnText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginLeft: 8 
  },
  bottomRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 10, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderColor: '#E0E0E0' 
  },
  bottomBtn: { 
    backgroundColor: '#E0F7FA', 
    borderRadius: 8, 
    paddingVertical: 10, 
    paddingHorizontal: 14, 
    marginHorizontal: 2 
  },
  bottomBtnText: { 
    color: AppColors.primary, 
    fontWeight: 'bold' 
  },
  // Side Panel Styles
  sidePanel: {
    position: 'absolute',
    right: 0,
    top: 60,
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000
  },
  sidePanelScroll: {
    flex: 1,
    padding: 16
  },
  sidePanelSection: {
    marginBottom: 20
  },
  sidePanelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginBottom: 12
  },
  userRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  userName: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginLeft: 8, 
    color: AppColors.primary 
  },
  statusRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  statusBox: { 
    flex: 1, 
    marginHorizontal: 4, 
    borderRadius: 8, 
    padding: 6, 
    alignItems: 'center' 
  },
  statusCount: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  statusLabel: { 
    color: '#fff', 
    fontSize: 12 
  },
  legendRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 4 
  },
  legendItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginRight: 10 
  },
  legendText: { 
    fontSize: 12, 
    color: AppColors.darkGrey, 
    marginLeft: 4 
  },
  questionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start'
  },
  qNavBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    borderWidth: 2, 
    margin: 4, 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'relative' 
  },
  currentQuestion: {
    borderWidth: 3,
    borderColor: AppColors.primary,
    transform: [{ scale: 1.1 }]
  },
  qNavText: { 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  checkmarkIcon: {
    position: 'absolute', 
    top: -6, 
    right: -6 
  },
  // Rough Work Styles
  roughWorkContainer: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 0
  },
  roughWorkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F9FA'
  },
  roughWorkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginLeft: 8
  },
  roughWorkArea: {
    minHeight: 120,
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12
  },
  roughWorkPlaceholder: {
    fontSize: 14,
    color: '#9E9E9E',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20
  },
  // Modal Styles - Enhanced Submit Popup
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalContainerCompact: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    } : {}),
    elevation: 8,
  },
  submitModalHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  submitModalIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitModalTitleCompact: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  submitModalCloseBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitModalBodyCompact: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  submitModalGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  submitModalGridItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  submitModalGridValueGreen: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
  },
  submitModalGridValueRed: {
    fontSize: 22,
    fontWeight: '800',
    color: '#DC2626',
  },
  submitModalGridLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  submitModalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  submitModalWarningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  modalActionsCompact: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButtonCompact: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonTextCompact: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  submitButtonGradientCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitConfirmButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    flex: 1,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#0D9488',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    } : {}),
    elevation: 4,
  },
  submitConfirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default PracticeExamQuestionsScreen; 
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useLiveExam } from '@/context/LiveExamContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, AppStateStatus, Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const LIVE_EXAM_STATE_KEY = (examId: string) => `live_exam_state_${examId}`;
const SAVED_STATE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// interface Question {
//   id: string;
//   text: string;
//   options: string[];
//   marks: number;
// }
interface Question {
  id: string;
  text: string;
  type: "MCQ" | "TRUE_FALSE";  // ✅ Add this line
  options: string[];
  marks: number;
}
interface QuestionStatus {
  answered: boolean;
  marked: boolean;
  visited: boolean;
  selectedOption?: number;
  timeSpent: number;
  eliminated: number[]; // Track eliminated options
}

interface SavedLiveExamState {
  examId: string;
  questions: Question[];
  statuses: QuestionStatus[];
  currentIndex: number;
  remainingSeconds: number;
  savedAt: number;
}

const LiveExamQuestionsScreen = () => {
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
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<number | undefined>(undefined);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Resume flow: show dialog if we have saved state for this exam
  const [resumePayload, setResumePayload] = useState<SavedLiveExamState | null>(null);
  const allowLeaveRef = useRef(false);
  const lastSaveRef = useRef(0);
  const saveThrottleMs = 15000;

  // Refs to read latest state when saving (e.g. on leave or background)
  const questionsRef = useRef<Question[]>([]);
  const statusesRef = useRef<QuestionStatus[]>([]);
  const currentRef = useRef(0);
  const timerStateRef = useRef(0);
  const currentSelectionRef = useRef<number | undefined>(undefined);
  questionsRef.current = questions;
  statusesRef.current = statuses;
  currentRef.current = current;
  timerStateRef.current = timer;
  currentSelectionRef.current = currentSelection;
  
  // NEW FEATURES STATE
  const [liveRank, setLiveRank] = useState<number | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [showLiveRank, setShowLiveRank] = useState(true);

  // Animation refs - removed to fix clickable issues
  // const fadeAnim = useRef(new Animated.Value(0)).current;
  // const slideAnim = useRef(new Animated.Value(50)).current;
  // const timerPulseAnim = useRef(new Animated.Value(1)).current;
  // const scaleAnim = useRef(new Animated.Value(0.8)).current;
  // const rotateAnim = useRef(new Animated.Value(0)).current;
  // const progressAnim = useRef(new Animated.Value(0)).current;

  const saveExamState = useCallback(async () => {
    if (!id || questionsRef.current.length === 0) return;
    try {
      const payload: SavedLiveExamState = {
        examId: id,
        questions: questionsRef.current,
        statuses: statusesRef.current,
        currentIndex: currentRef.current,
        remainingSeconds: timerStateRef.current,
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem(LIVE_EXAM_STATE_KEY(id), JSON.stringify(payload));
      lastSaveRef.current = Date.now();
    } catch (e) {
      console.warn('Failed to save exam state', e);
    }
  }, [id]);

  const clearExamState = useCallback(async () => {
    if (!id) return;
    try {
      await AsyncStorage.removeItem(LIVE_EXAM_STATE_KEY(id));
    } catch (e) {
      console.warn('Failed to clear exam state', e);
    }
  }, [id]);

  // Verify exam has started before showing questions
  const verifyStartTime = async () => {
    if (!id || !user?.token) return false;
    
    try {
      // Fetch exam details to check start time
      const examRes = await apiFetchAuth(`/student/live-exams/${id}`, user.token);
      if (examRes.ok && examRes.data) {
        const exam = examRes.data;
        const now = new Date();
        const startTime = new Date(exam.startTime);
        
        if (now < startTime) {
          Alert.alert(
            'Exam Not Started',
            'Please wait for the exam start time.',
            [
              {
                text: 'Go Back',
                onPress: () => router.back()
              }
            ]
          );
          return false;
        }
        return true;
      }
      return true; // If exam fetch fails, allow to proceed (backend will handle)
    } catch (error) {
      console.error('Error verifying start time:', error);
      return true; // Allow to proceed if verification fails
    }
  };

  // Initialize: check for saved state (resume) or fetch fresh
  useEffect(() => {
    if (!id || !user?.token) return;
    
    const initializeExam = async () => {
      try {
        const raw = await AsyncStorage.getItem(LIVE_EXAM_STATE_KEY(id));
        if (raw) {
          const parsed: SavedLiveExamState = JSON.parse(raw);
          if (parsed.examId !== id || !parsed.questions?.length) {
            await AsyncStorage.removeItem(LIVE_EXAM_STATE_KEY(id));
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
            await AsyncStorage.removeItem(LIVE_EXAM_STATE_KEY(id));
          }
        }
      } catch (_) {
        try { await AsyncStorage.removeItem(LIVE_EXAM_STATE_KEY(id)); } catch (_2) {}
      }
      const canProceed = await verifyStartTime();
      if (canProceed) {
        fetchQuestions();
      }
    };
    
    initializeExam();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [id, user?.token]);

  // Question timer effect
  useEffect(() => {
    questionTimerRef.current = setInterval(() => {
      setStatuses((prev) => {
        const updated = [...prev];
        if (updated[current]) {
          updated[current] = {
            ...updated[current],
            timeSpent: (updated[current].timeSpent || 0) + 1,
          };
        }
        return updated;
      });
    }, 1000);

    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [current]);

  useEffect(() => {
    if (duration) {
      setTimer(parseInt(duration) * 60);
    }
  }, [duration]);

  // Question change animation
  useEffect(() => {
    // Reset current selection when question changes
    setCurrentSelection(statuses[current]?.selectedOption);
  }, [current, questions.length, statuses]);

  // Timer pulse animation when time is low
  useEffect(() => {
    // Removed animation to fix clickable issues
  }, [timer]);

  // Rotating animation for loading
  useEffect(() => {
    // Removed animation to fix clickable issues
  }, [loading]);

  const fetchQuestions = async () => {
    if (!user?.token) return;

    setLoading(true);
    try {
      const res = await apiFetchAuth(`/student/live-exams/${id}/questions`, user.token);
      if (res.ok) {
        // Check if response indicates exam hasn't started
        if (res.data?.message?.includes('not started') || res.data?.message?.includes('start time')) {
          Alert.alert(
            'Exam Not Started',
            'Please wait for the exam start time.',
            [
              {
                text: 'Go Back',
                onPress: () => router.back()
              }
            ]
          );
          setLoading(false);
          return;
        }

        setQuestions(res.data);
        setStatuses(res.data.map(() => ({ 
          answered: false, 
          marked: false, 
          visited: false,
          timeSpent: 0,
          eliminated: []
        })));
        setLoading(false);
        startTimer();
      } else {
        // Check if error is about start time
        if (res.data?.message?.includes('not started') || res.data?.message?.includes('start time')) {
          Alert.alert(
            'Exam Not Started',
            'Please wait for the exam start time.',
            [
              {
                text: 'Go Back',
                onPress: () => router.back()
              }
            ]
          );
        } else {
          Alert.alert('Error', res.data?.message || 'Could not fetch questions.');
        }
        setLoading(false);
      }
    } catch (e: any) {
      console.error('Error fetching questions:', e);
      // Check if error is about start time
      if (e?.data?.message?.includes('not started') || e?.data?.message?.includes('start time')) {
        Alert.alert(
          'Exam Not Started',
          'Please wait for the exam start time.',
          [
            {
              text: 'Go Back',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Could not fetch questions.');
      }
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
    setCurrentSelection(resumePayload.statuses[resumePayload.currentIndex]?.selectedOption);
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
    const canProceed = await verifyStartTime();
    if (canProceed) {
      fetchQuestions();
    } else {
      setLoading(false);
    }
  };

  // Periodic save and save on app background
  useEffect(() => {
    if (questions.length === 0 || submitting) return;
    const interval = setInterval(() => {
      if (Date.now() - lastSaveRef.current >= saveThrottleMs) {
        saveExamState();
      }
    }, saveThrottleMs);
    return () => clearInterval(interval);
  }, [questions.length, submitting, saveExamState]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' && questionsRef.current.length > 0) {
        saveExamState();
      }
    });
    return () => sub.remove();
  }, [saveExamState]);

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

  // On focus: mark in progress so tab bar shows alert every time. On blur: save + clear.
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

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h} : ${m} : ${s}`;
  };

  const formatQuestionTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const handleEliminateOption = (optionIdx: number) => {
    setStatuses((prev) => {
      const updated = [...prev];
      const currentEliminated = updated[current].eliminated || [];
      
      if (currentEliminated.includes(optionIdx)) {
        // Remove from eliminated
        updated[current] = {
          ...updated[current],
          eliminated: currentEliminated.filter(i => i !== optionIdx),
        };
      } else {
        // Add to eliminated
        updated[current] = {
          ...updated[current],
          eliminated: [...currentEliminated, optionIdx],
        };
      }
      return updated;
    });
  };

  const handleOptionSelect = (optionIdx: number) => {

    setCurrentSelection(optionIdx);
    
    // Immediately save to statuses as well
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

  const handleNext = () => {
    // Mark current question as visited even if not saving answer
    setStatuses((prev) => {
      const updated = [...prev];
      updated[current] = {
        ...updated[current],
        visited: true,
      };
      return updated;
    });

    // Move to next question
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setShowSidePanel(false);
    }
  };

  const handleSaveAndNext = () => {

    // Save the current selection
    setStatuses((prev) => {
      const updated = [...prev];
      updated[current] = {
        ...updated[current],
        answered: currentSelection !== undefined,
        selectedOption: currentSelection,
        visited: true,
      };
      return updated;
    });

    // Move to next question
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setShowSidePanel(false);
    }
  };

  const handleNav = (idx: number) => {
    // Save current selection before navigating
    if (currentSelection !== undefined) {
      setStatuses((prev) => {
        const updated = [...prev];
        updated[current] = {
          ...updated[current],
          answered: true,
          selectedOption: currentSelection,
          visited: true,
        };
        return updated;
      });
    }

    setCurrent(idx);
    setStatuses((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], visited: true };
      return updated;
    });
    setShowSidePanel(false);
  };

  const isLastQuestion = current === questions.length - 1;

  const handleSubmit = async () => {
    // Save current selection before submitting
    if (currentSelection !== undefined) {
      setStatuses((prev) => {
        const updated = [...prev];
        updated[current] = {
          ...updated[current],
          answered: true,
          selectedOption: currentSelection,
          visited: true,
        };
        return updated;
      });
    }

    // Show enhanced submit modal
    setShowSubmitModal(true);
  };

  const autoSubmitExam = async () => {
    // Auto-submit without showing modal when timer expires
    setSubmitting(true);
    try {
      // Wait a bit to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Save current selection before submitting
      if (currentSelection !== undefined) {
        setStatuses((prev) => {
          const updated = [...prev];
          updated[current] = {
            ...updated[current],
            answered: true,
            selectedOption: currentSelection,
            visited: true,
          };
          return updated;
        });
      }
      
      // Prepare answers payload - include current selection if it exists
      const answers: { [key: string]: number } = {};
      
      // Add all previously answered questions
      statuses.forEach((status, index) => {
        if (status.answered && status.selectedOption !== undefined) {
          answers[questions[index].id] = status.selectedOption;
        }
      });
      
      // Add current question if it has a selection
      if (currentSelection !== undefined) {
        answers[questions[current].id] = currentSelection;
      }

      console.log('Auto-submitting live exam (timer expired):', answers);

      const response = await apiFetchAuth(`/student/live-exams/${id}/submit`, user!.token, {
        method: 'POST',
        body: { answers }
      });

      if (response.ok) {
        console.log('Live exam auto-submitted successfully');
        await clearExamState();
        const resultData = response.data;
        router.push({
          pathname: '/(tabs)/live-exam/result/[id]' as any,
          params: { 
            id: id,
            resultData: JSON.stringify(resultData)
          }
        });
      } else {
        throw new Error(response.data?.message || 'Failed to submit exam');
      }
    } catch (error: any) {
      console.error('❌ Error auto-submitting live exam:', error);
      setSubmitting(false);
      Alert.alert('Time Up!', 'Your exam has been automatically submitted. Redirecting to results...');
      await clearExamState();
      router.push({
        pathname: '/(tabs)/live-exam/result/[id]' as any,
        params: { id: id }
      });
    }
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    try {
      // Wait a bit to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Prepare answers payload - include current selection if it exists
      const answers: { [key: string]: number } = {};
      
      // Add all previously answered questions
      statuses.forEach((status, index) => {
        if (status.answered && status.selectedOption !== undefined) {
          answers[questions[index].id] = status.selectedOption;
        }
      });
      
      // Add current question if it has a selection
      if (currentSelection !== undefined) {
        answers[questions[current].id] = currentSelection;
      }



      const response = await apiFetchAuth(`/student/live-exams/${id}/submit`, user!.token, {
        method: 'POST',
        body: { answers }
      });

      if (response.ok) {
        await clearExamState();
        const resultData = response.data;
        router.push({
          pathname: '/(tabs)/live-exam/result/[id]' as any,
          params: { 
            id: id,
            resultData: JSON.stringify(resultData)
          }
        });
      } else {
        throw new Error(response.data?.message || 'Failed to submit exam');
      }
    } catch (error: any) {
      console.error('❌ Error submitting exam:', error);
      Alert.alert('Error', error.message || 'Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };


  // Summary counts
  const answered = statuses.filter(s => s.answered).length;
  const marked = statuses.filter(s => s.marked).length;
  const notVisited = statuses.filter(s => !s.visited).length;
  const markedAndAnswered = statuses.filter(s => s.answered && s.marked).length;
  const notAnswered = statuses.filter(s => s.visited && !s.answered).length;

  // Removed spin variable

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingIconContainer}>
            <Ionicons name="school" size={48} color="#fff" />
          </View>
          <Text style={styles.loadingText}>Loading Exam...</Text>
          <Text style={styles.loadingSubtext}>Preparing your questions</Text>
        </LinearGradient>
      </View>
    );
  }

  // Resume dialog when we have saved state
  if (resumePayload) {
    const elapsedSec = Math.floor((Date.now() - resumePayload.savedAt) / 1000);
    const remaining = Math.max(0, resumePayload.remainingSeconds - elapsedSec);
    const minLeft = Math.floor(remaining / 60);
    const secLeft = remaining % 60;
    const timeStr = minLeft > 0 ? `${minLeft} min ${secLeft} sec` : `${secLeft} sec`;

    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
          style={styles.loadingGradient}
        >
          <View style={styles.resumeDialogBox}>
            <Ionicons name="time" size={40} color="#fff" style={{ marginBottom: 12 }} />
            <Text style={styles.resumeDialogTitle}>Resume your attempt?</Text>
            <Text style={styles.resumeDialogSubtext}>
              You have a saved attempt with {timeStr} remaining.
            </Text>
            <View style={styles.resumeDialogButtons}>
              <TouchableOpacity style={styles.resumeDialogButtonPrimary} onPress={handleResumeAttempt} activeOpacity={0.8}>
                <Text style={styles.resumeDialogButtonPrimaryText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resumeDialogButtonSecondary} onPress={handleStartFresh} activeOpacity={0.8}>
                <Text style={styles.resumeDialogButtonSecondaryText}>Start fresh</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Timer - improved */}
      <LinearGradient
        colors={['#4F46E5', '#5B21B6', '#6D28D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Pressable
            style={({ pressed }) => [styles.sidePanelToggle, pressed && styles.sidePanelTogglePressed]}
            onPress={() => setShowSidePanel(!showSidePanel)}
            hitSlop={{ top: 28, bottom: 28, left: 28, right: 28 }}
          >
            <Ionicons name={showSidePanel ? "close" : "menu"} size={26} color="#fff" />
            <Text style={styles.sidePanelToggleLabel}>{showSidePanel ? "Close" : "Menu"}</Text>
          </Pressable>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerLiveLabel}>Live Exam</Text>
            <Text style={styles.questionProgress}>Question {current + 1} of {questions.length}</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${((current + 1) / questions.length) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(((current + 1) / questions.length) * 100)}%</Text>
            </View>
            {showLiveRank && liveRank ? (
              <View style={styles.liveRankBadge}>
                <Ionicons name="trophy" size={12} color="#FBBF24" />
                <Text style={styles.liveRankText}>#{liveRank}</Text>
              </View>
            ) : null}
          </View>
          
          <View style={[styles.timerContainer, timer <= 300 && styles.timerContainerWarning]}>
            <Ionicons name="time-outline" size={20} color="#fff" style={styles.timerIcon} />
            <Text style={[styles.timerText, timer <= 300 && styles.timerTextWarning]}>
              {formatTime(timer)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content Area */}
      <ScrollView style={styles.mainContent} contentContainerStyle={styles.mainContentContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCenter}>
        <View 
          style={[
            styles.questionCard,
            {
              opacity: 1, // Removed fadeAnim
              transform: [
                { translateY: 0 }, // Removed slideAnim
                { scale: 1 } // Removed scaleAnim
              ]
            }
          ]}
        >
          {/* Question Header - improved */}
          <View style={styles.questionHeader}>
            <View style={styles.questionHeaderTop}>
              <View style={styles.questionNumberBadge}>
                <Text style={styles.questionNumber}>Q{current + 1}</Text>
              </View>
              <View style={styles.questionMetaRow}>
                <View style={styles.timeSpentBadge}>
                  <Ionicons name="time-outline" size={12} color="#6366F1" />
                  <Text style={styles.timeSpentText}>{formatQuestionTime(statuses[current]?.timeSpent || 0)}</Text>
                </View>
                <View style={styles.questionMarks}>
                  <Text style={styles.marksText}>{questions[current]?.marks || 1} mark{questions[current]?.marks !== 1 ? 's' : ''}</Text>
                </View>
              </View>
            </View>
            <ScrollView 
              style={styles.questionScrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.questionTitleInline}>
                {questions[current]?.text}
              </Text>
            </ScrollView>
          </View>


          {/* Options */}
          <View style={styles.optionsContainer}>
            {questions[current]?.type === "TRUE_FALSE" ? (
              // True/False Options - 2 buttons side by side
              <View style={styles.trueFalseContainer}>
                {questions[current]?.options.map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.trueFalseButton,
                      (currentSelection === idx || statuses[current]?.selectedOption === idx) && styles.trueFalseButtonSelected
                    ]}
                    onPress={() => handleOptionSelect(idx)}
                  >
                    <View style={styles.trueFalseContent}>
                      <View style={[
                        styles.radioButton,
                        (currentSelection === idx || statuses[current]?.selectedOption === idx) && styles.radioButtonSelected
                      ]}>
                        {(currentSelection === idx || statuses[current]?.selectedOption === idx) && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                      <Text style={[
                        styles.trueFalseText,
                        (currentSelection === idx || statuses[current]?.selectedOption === idx) && styles.trueFalseTextSelected
                      ]}>
                        {opt}
                      </Text>
                    </View>
                    {(currentSelection === idx || statuses[current]?.selectedOption === idx) && (
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              // MCQ Options with Elimination Feature
              questions[current]?.options.map((opt, idx) => {
                const isEliminated = statuses[current]?.eliminated?.includes(idx);
                const isSelected = currentSelection === idx || statuses[current]?.selectedOption === idx;
                
                return (
                  <View key={idx} style={styles.optionRow}>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                        isEliminated && styles.optionEliminated
                      ]}
                      onPress={() => !isEliminated && handleOptionSelect(idx)}
                      disabled={isEliminated}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.radioButton,
                          isSelected && styles.radioButtonSelected
                        ]}>
                          {isSelected && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                        <Text style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                          isEliminated && styles.optionTextEliminated
                        ]}>
                          {opt}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      )}
                    </TouchableOpacity>
                    
                    {/* Elimination Button */}
                    <TouchableOpacity
                      style={[
                        styles.eliminateBtn,
                        isEliminated && styles.eliminateBtnActive
                      ]}
                      onPress={() => handleEliminateOption(idx)}
                    >
                      <Ionicons 
                        name={isEliminated ? "close-circle" : "close-circle-outline"} 
                        size={20} 
                        color={isEliminated ? "#EF4444" : "#9CA3AF"} 
                      />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <View style={styles.leftActions}>
              <TouchableOpacity 
                style={[
                  styles.markButton,
                  statuses[current]?.marked && styles.markButtonActive
                ]} 
                onPress={handleMark}
              >
                <Ionicons 
                  name={statuses[current]?.marked ? 'bookmark' : 'bookmark-outline'} 
                  size={16} 
                  color={statuses[current]?.marked ? '#fff' : '#4F46E5'} 
                />
                <Text style={[
                  styles.markButtonText,
                  statuses[current]?.marked && styles.markButtonTextActive
                ]}>
                  {statuses[current]?.marked ? 'Marked' : 'Mark'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.navigationActions}>
              {!isLastQuestion ? (
                <>
                  <TouchableOpacity 
                    style={[
                      styles.saveNextButton,
                      currentSelection === undefined && styles.saveNextButtonDisabled
                    ]} 
                    onPress={handleSaveAndNext}
                    disabled={currentSelection === undefined}
                  >
                    <LinearGradient
                      colors={currentSelection !== undefined ? ['#4F46E5', '#7C3AED'] : ['#CBD5E1', '#9CA3AF']}
                      style={styles.saveNextButtonGradient}
                    >
                      <Text style={styles.saveNextButtonText}>Save & Next</Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      style={styles.nextButtonGradient}
                    >
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        </View>

        {/* Bottom Submit Button for all questions */}
        <View style={styles.submitContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <LinearGradient
              colors={['#FF6B6B', '#FF5252', '#FF1744']}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>Submit Test</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>

      {/* Side Panel */}
      {showSidePanel && (
        <View style={[styles.sidePanel, { width: Math.min(width * 0.82, 280) }]}>
          <ScrollView style={styles.sidePanelScroll} showsVerticalScrollIndicator={false}>
            {/* Progress Summary - Total Time + Close in one row */}
            <View style={styles.sidePanelSection}>
              <View style={styles.totalTimeCard}>
                <View style={styles.totalTimeRow}>
                  <Ionicons name="time" size={16} color="#667eea" />
                  <Text style={styles.totalTimeText}>
                    Total Time: {formatQuestionTime(statuses.reduce((acc, s) => acc + (s.timeSpent || 0), 0))}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.sidePanelCloseButton}
                  onPress={() => setShowSidePanel(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={22} color="#374151" />
                </TouchableOpacity>
              </View>

              <View style={styles.progressGrid}>
                <View style={[styles.progressCard, styles.progressCardGreen]}>
                  <Ionicons name="checkmark-circle" size={14} color="#059669" style={styles.progressCardIcon} />
                  <Text style={[styles.progressNumber, styles.progressNumberGreen]}>{answered}</Text>
                  <Text style={[styles.progressLabel, styles.progressLabelGreen]}>Answered</Text>
                </View>
                <View style={[styles.progressCard, styles.progressCardAmber]}>
                  <Ionicons name="bookmark" size={14} color="#B45309" style={styles.progressCardIcon} />
                  <Text style={[styles.progressNumber, styles.progressNumberAmber]}>{marked}</Text>
                  <Text style={[styles.progressLabel, styles.progressLabelAmber]}>Marked</Text>
                </View>
                <View style={[styles.progressCard, styles.progressCardGray]}>
                  <Ionicons name="eye-off" size={14} color="#4B5563" style={styles.progressCardIcon} />
                  <Text style={[styles.progressNumber, styles.progressNumberGray]}>{notVisited}</Text>
                  <Text style={[styles.progressLabel, styles.progressLabelGray]}>Not Visited</Text>
                </View>
                <View style={[styles.progressCard, styles.progressCardRed]}>
                  <Ionicons name="close-circle" size={14} color="#B91C1C" style={styles.progressCardIcon} />
                  <Text style={[styles.progressNumber, styles.progressNumberRed]}>{notAnswered}</Text>
                  <Text style={[styles.progressLabel, styles.progressLabelRed]}>Not Answered</Text>
                </View>
              </View>
            </View>

            {/* Question Navigation */}
            <View style={styles.sidePanelSection}>
              <View style={styles.sidePanelTitleRow}>
                <Ionicons name="grid" size={18} color="#374151" style={styles.sidePanelTitleIcon} />
                <Text style={styles.sidePanelTitle}>Question Navigation</Text>
              </View>
              <View style={styles.questionNavigationGrid}>
                {questions.map((q, idx) => {
                  let statusColor = '#E0E0E0';
                  let textColor = '#666';
                  let borderColor = '#E0E0E0';
                  
                  // Check marked first - marked questions should always show yellow
                  if (statuses[idx]?.marked && statuses[idx]?.answered) {
                    // Marked and answered - yellow with checkmark
                    statusColor = '#FFD700';
                    textColor = '#000';
                    borderColor = '#FFD700';
                  } else if (statuses[idx]?.marked) {
                    // Marked but not answered - yellow
                    statusColor = '#FFD700';
                    textColor = '#000';
                    borderColor = '#FFD700';
                  } else if (statuses[idx]?.answered) {
                    // Answered but not marked - green
                    statusColor = '#4CAF50';
                    textColor = '#fff';
                    borderColor = '#4CAF50';
                  } else if (statuses[idx]?.visited && !statuses[idx]?.answered) {
                    // Visited but not answered and not marked - red
                    statusColor = '#F44336';
                    textColor = '#fff';
                    borderColor = '#F44336';
                  } else if (!statuses[idx]?.visited) {
                    // Not visited - gray
                    statusColor = '#E0E0E0';
                    textColor = '#666';
                    borderColor = '#E0E0E0';
                  }
                  
                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={[
                        styles.questionNavButton,
                        { 
                          backgroundColor: statusColor,
                          borderColor: current === idx ? '#4F46E5' : borderColor
                        },
                        current === idx && styles.currentQuestionNav
                      ]}
                      onPress={() => handleNav(idx)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.questionNavText, { color: textColor }]}>
                        {idx + 1}
                      </Text>
                      {statuses[idx]?.answered && statuses[idx]?.marked && (
                        <View style={styles.checkmarkBadge}>
                          <Ionicons name="checkmark" size={12} color="#000" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Final Submit Modal - App theme (indigo/purple) */}
      <Modal
        visible={showSubmitModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubmitModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderGlass} />
              <View style={styles.modalIconContainer}>
                <Ionicons name="checkmark-circle" size={28} color="#fff" />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Final Submit</Text>
                <Text style={styles.modalSubtitle}>Review answers before submission</Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowSubmitModal(false)}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={22} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, styles.statCardAnswered]}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="checkmark-done" size={14} color="#059669" />
                  </View>
                  <Text style={styles.statNumber}>{answered}</Text>
                  <Text style={styles.statLabel}>Answered</Text>
                </View>

                <View style={[styles.statCard, styles.statCardMarked]}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="bookmark" size={14} color="#B45309" />
                  </View>
                  <Text style={styles.statNumber}>{marked}</Text>
                  <Text style={styles.statLabel}>Marked</Text>
                </View>

                <View style={[styles.statCard, styles.statCardNotVisited]}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="close-circle" size={14} color="#DC2626" />
                  </View>
                  <Text style={styles.statNumber}>{notVisited}</Text>
                  <Text style={styles.statLabel}>Not Visited</Text>
                </View>
              </View>

              <View style={styles.warningBox}>
                <View style={styles.warningIconWrap}>
                  <Ionicons name="information-circle" size={20} color="#7C3AED" />
                </View>
                <View style={styles.warningTextContainer}>
                  <Text style={styles.warningTitle}>Important</Text>
                  <Text style={styles.warningText}>
                    • Cannot be undone • Answers submitted • Result shown immediately
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSubmitModal(false)}
                activeOpacity={0.8}
              >
                <View style={styles.cancelButtonContent}>
                  <Ionicons name="arrow-back" size={16} color="#5B21B6" />
                  <Text style={styles.cancelButtonText}>Review Again</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitConfirmButton}
                onPress={confirmSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={submitting ? ['#9CA3AF', '#6B7280'] : ['#4F46E5', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  {submitting ? (
                    <View style={styles.submitButtonContent}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.submitConfirmButtonText}>Submitting...</Text>
                    </View>
                  ) : (
                    <View style={styles.submitButtonContent}>
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.submitConfirmButtonText}>Submit Exam</Text>
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
    backgroundColor: '#F1F5F9'
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30
  },
  loadingText: { 
    marginTop: 20, 
    fontSize: 20, 
    fontWeight: 'bold',
    color: '#fff'
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  resumeDialogBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  resumeDialogTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  resumeDialogSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 20,
    textAlign: 'center',
  },
  resumeDialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resumeDialogButtonPrimary: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  resumeDialogButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4F46E5',
  },
  resumeDialogButtonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    minWidth: 120,
    alignItems: 'center',
  },
  resumeDialogButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: 12,
    paddingHorizontal: 14,
    ...(Platform.OS === 'android' ? {} : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    }),
    elevation: Platform.OS === 'android' ? 0 : 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sidePanelToggle: {
    minWidth: 56,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...(Platform.OS === 'android' ? { elevation: 0 } : {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    }),
  },
  sidePanelTogglePressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  sidePanelToggleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerLiveLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2
  },
  securityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4
  },
  securityText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#fff',
    fontWeight: '600'
  },
  liveRankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 6,
    gap: 4,
  },
  liveRankText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  questionProgress: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 160,
    gap: 8,
    marginTop: 6,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '700',
    minWidth: 28,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerContainerWarning: {
    backgroundColor: 'rgba(220, 38, 38, 1)',
  },
  timerIcon: {
    marginRight: 6,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  timerTextWarning: {
    color: '#fff',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16
  },
  mainContentContent: {
    paddingBottom: 100,
  },
  contentCenter: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  questionCard: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    marginTop: 0,
    marginBottom: 8,
    padding: 20, 
    paddingBottom: 14,
    shadowColor: '#4F46E5', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 24, 
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
    transform: [{ scale: 1.02 }],
    minHeight: 280
  },
  questionHeader: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  questionHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 10,
  },
  questionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionNumberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.25)',
    elevation: 0,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  questionScrollContainer: {
    maxHeight: 140,
  },
  questionTitleInline: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    fontWeight: '500',
  },
  timeSpentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  timeSpentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  questionMarks: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  marksText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    letterSpacing: 0.2,
  },
  questionScrollContainer: {
    flex: 1,
    maxHeight: 140,
  },
  questionTitleInline: { 
    fontSize: 15, 
    lineHeight: 22,
    color: '#1F2937', 
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'left',
    paddingRight: 8,
  },
  optionsContainer: { 
    marginBottom: 4
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  eliminateBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eliminateBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  optionEliminated: {
    opacity: 0.4,
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  optionTextEliminated: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  optionButton: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC', 
    borderRadius: 12, 
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 0,
    transform: [{ scale: 0.98 }]
  },
  optionButtonSelected: { 
    backgroundColor: '#EEF2FF', 
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 0,
    transform: [{ scale: 1 }]
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  radioButton: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    borderWidth: 1.5, 
    borderColor: '#CBD5E1', 
    marginRight: 10, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#fff',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 0
  },
  radioButtonSelected: { 
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 0
  },
  radioButtonInner: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#fff',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 0
  },
  optionText: { 
    fontSize: 14, 
    color: '#1F2937',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  optionTextSelected: {
    color: '#4F46E5',
    fontWeight: '700',
    textShadowColor: 'rgba(79, 70, 229, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionButtonsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 2,
    borderTopColor: '#E0E7FF'
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  markButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F3F4F6', 
    borderRadius: 12, 
    paddingVertical: 8, 
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2
  },
  markButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6
  },
  markButtonText: { 
    color: '#4F46E5', 
    fontWeight: '700', 
    marginLeft: 8,
    fontSize: 14
  },
  markButtonTextActive: {
    color: '#fff'
  },
  navigationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  saveNextButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8
  },
  saveNextButtonDisabled: {
    shadowColor: '#CBD5E1',
    shadowOpacity: 0.1,
    elevation: 2
  },
  saveNextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 10
  },
  saveNextButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14
  },
  nextButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6
  },
  submitContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    marginTop: 0
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 23, 68, 0.2)',
    alignSelf: 'center',
    minWidth: '70%'
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 8
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  // ✅ Question Type Badge Styles
questionTypeContainer: {
  flexDirection: 'row',
  alignItems: 'center',
},
questionTypeBadge: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
  marginRight: 12,
},
trueFalseBadge: {
  backgroundColor: '#DC2626', // Red for True/False
},
mcqBadge: {
  backgroundColor: '#2563EB', // Blue for MCQ
},
questionTypeText: {
  fontSize: 12,
  fontWeight: '600',
},

mcqText: {
  color: '#fff',
},

// ✅ True/False Specific Styles
trueFalseContainer: {
  flexDirection: 'row',
  gap: 12,
},
trueFalseButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#F8FAFC',
  borderRadius: 14,
  padding: 14,
  borderWidth: 2,
  borderColor: 'transparent',
  shadowColor: '#4F46E5',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 4,
},
trueFalseButtonSelected: {
  backgroundColor: '#FEF2F2',
  borderColor: '#DC2626',
  shadowColor: '#DC2626',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 8,
  transform: [{ scale: 1.03 }]
},
trueFalseContent: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},
trueFalseText: {
  fontSize: 18,
  color: '#374151',
  fontWeight: '700',
  marginLeft: 16,
  letterSpacing: 0.4
},
trueFalseTextSelected: {
  color: '#DC2626',
  fontWeight: '800',
},
  // Side Panel Styles
  sidePanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 0,
    zIndex: 1000
  },
  sidePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    zIndex: 10,
    elevation: 2,
  },
  sidePanelCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidePanelScroll: {
    flex: 1,
    padding: 20
  },
  sidePanelSection: {
    marginBottom: 24
  },
  sidePanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  sidePanelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 0,
    letterSpacing: 0.2,
  },
  sidePanelTitleIcon: {
    marginRight: 8,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.15)',
  },
  userProfileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 8
  },
  userProfileContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  userInfo: {
    flex: 1
  },
  userName: { 
    fontWeight: 'bold', 
    fontSize: 18, 
    color: '#fff',
    marginBottom: 4
  },
  userStatus: { 
    fontSize: 14, 
    color: 'rgba(255, 255, 255, 0.8)'
  },
  totalTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  totalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  totalTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667eea',
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  progressBarWrap: {
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  progressBarOuter: {
    height: 6,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 0,
  },
  progressBarText: {
    marginTop: 8,
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  progressCard: { 
    flex: 1,
    minWidth: '45%',
    borderRadius: 10, 
    padding: 10, 
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 0,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  progressSub: {
    marginTop: 2,
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600'
  },
  progressCardIcon: {
    marginBottom: 6,
  },
  progressCardGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  progressCardAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  progressCardGray: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  progressCardRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  progressNumber: { 
    color: '#111827', 
    fontWeight: '600', 
    fontSize: 16,
    marginBottom: 2,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.04)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  progressNumberGreen: { color: '#065F46' },
  progressNumberAmber: { color: '#92400E' },
  progressNumberGray: { color: '#374151' },
  progressNumberRed: { color: '#991B1B' },
  progressLabel: { 
    color: '#374151', 
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  progressLabelGreen: { color: '#047857' },
  progressLabelAmber: { color: '#B45309' },
  progressLabelGray: { color: '#4B5563' },
  progressLabelRed: { color: '#B91C1C' },
  questionNavigationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  questionNavButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    borderWidth: 2, 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  currentQuestionNav: {
    borderWidth: 3,
    transform: [{ scale: 1.1 }]
  },
  questionNavText: { 
    fontWeight: 'bold', 
    fontSize: 14
  },
  checkmarkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  // Submit Modal Styles - App theme (indigo/purple)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '72%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    } : {}),
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    position: 'relative',
  },
  modalHeaderGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '500',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    maxHeight: 240,
    backgroundColor: '#FAFBFC',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statCardAnswered: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statCardMarked: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statCardNotVisited: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 0,
  },
  statLabel: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  warningIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B21B6',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#4C1D95',
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E0E7FF',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    flex: 0.8,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  cancelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B21B6',
  },
  submitConfirmButton: {
    flex: 1.2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submitConfirmButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default LiveExamQuestionsScreen; 

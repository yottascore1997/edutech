import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLiveExam } from '@/context/LiveExamContext';
import { fetchPYQQuestions, submitPYQAttempt } from '@/utils/pyqApi';
import { PYQQuestion } from '@/types/pyq';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';

interface QuestionStatus {
  answered: boolean;
  marked: boolean;
  visited: boolean;
  selectedOption?: number;
}

export default function PYQAttemptScreen() {
  const params = useLocalSearchParams() as { examId?: string; attemptId?: string; duration?: string };
  const examId = params.examId!;
  const attemptId = params.attemptId!;
  const durationMin = Number(params.duration || '0');
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { setLiveExamInProgress } = useLiveExam();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [statuses, setStatuses] = useState<QuestionStatus[]>([]);
  const [timer, setTimer] = useState(() => (durationMin > 0 ? durationMin * 60 : 60 * 60));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowLeaveRef = useRef(false);
  const questionsRef = useRef<PYQQuestion[]>([]);
  const statusesRef = useRef<QuestionStatus[]>([]);
  const currentRef = useRef(0);
  const timerStateRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  questionsRef.current = questions;
  statusesRef.current = statuses;
  currentRef.current = current;
  timerStateRef.current = timer;

  useEffect(() => {
    if (!examId || !attemptId || !user?.token) return;
    loadQuestions();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId, attemptId, user?.token]);

  useEffect(() => {
    if (durationMin > 0) setTimer(durationMin * 60);
  }, [durationMin]);

  async function loadQuestions() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPYQQuestions(user!.token, examId, attemptId);
      const list = Array.isArray(data) ? data : [];
      setQuestions(list);
      setStatuses(list.map(() => ({ answered: false, marked: false, visited: false })));
      if (durationMin > 0) {
        setTimer(durationMin * 60);
        startTimer();
      }
    } catch (e: any) {
      console.error('Failed to load questions', e);
      setError(e?.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }

  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          autoSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
    setShowSidePanel(false);
  };

  const handleNext = () => {
    if (current < questions.length - 1) handleNav(current + 1);
  };

  const handleSkip = () => {
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
    if (current < questions.length - 1) handleNav(current + 1);
  };

  const isLastQuestion = current === questions.length - 1;

  const handleSubmit = () => setShowSubmitModal(true);

  const autoSubmitExam = async () => {
    setSubmitting(true);
    try {
      const answers: Record<string, number> = {};
      statusesRef.current.forEach((status, index) => {
        if (status.answered && status.selectedOption !== undefined && questionsRef.current[index])
          answers[questionsRef.current[index].id] = status.selectedOption;
      });
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      const totalSec = durationMin > 0 ? durationMin * 60 : 3600;
      const timeTakenSeconds = Math.min(elapsed, totalSec);
      await submitPYQAttempt(user!.token, examId, attemptId, answers, timeTakenSeconds);
      setShowSubmitModal(false);
      router.replace(`/pyq/${examId}/result/${attemptId}`);
    } catch (e: any) {
      console.error('Auto-submit failed', e);
      setSubmitting(false);
      Alert.alert('Time Up!', 'Your exam has been submitted. Redirecting to results...');
      router.replace(`/pyq/${examId}/result/${attemptId}`);
    }
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    try {
      const answers: Record<string, number> = {};
      statuses.forEach((status, index) => {
        if (status.answered && status.selectedOption !== undefined && questions[index])
          answers[questions[index].id] = status.selectedOption;
      });
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      const totalSec = durationMin > 0 ? durationMin * 60 : 3600;
      const timeTakenSeconds = Math.min(elapsed, totalSec);
      await submitPYQAttempt(user!.token, examId, attemptId, answers, timeTakenSeconds);
      setShowSubmitModal(false);
      setSubmitting(false);
      router.replace(`/pyq/${examId}/result/${attemptId}`);
    } catch (e: any) {
      console.error('Submit failed', e);
      setSubmitting(false);
      Alert.alert('Error', e?.message || 'Failed to submit. Please try again.');
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (allowLeaveRef.current || questions.length === 0) return;
      e.preventDefault();
      Alert.alert(
        'Leave exam?',
        'Your progress will be lost. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              setLiveExamInProgress(false);
              allowLeaveRef.current = true;
              router.back();
            },
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, questions.length, setLiveExamInProgress]);

  const answered = statuses.filter((s) => s.answered).length;
  const marked = statuses.filter((s) => s.marked).length;
  const notVisited = statuses.filter((s) => !s.visited).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Loading Exam...</Text>
      </View>
    );
  }

  if (error || questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>{error || 'No questions available.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const q = questions[current];
  const displayNum = q.orderIndex != null ? q.orderIndex + 1 : current + 1;

  return (
    <View style={styles.container}>
      <View style={styles.timerRow}>
        <TouchableOpacity style={styles.sidePanelToggle} onPress={() => setShowSidePanel(!showSidePanel)}>
          <Ionicons name={showSidePanel ? 'close' : 'menu'} size={24} color={AppColors.primary} />
        </TouchableOpacity>
        <Text style={styles.timerText}>{formatTime(timer)}</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.questionCard}>
          <Text style={styles.qNumber}>Q{displayNum}.</Text>
          <Text style={styles.qText}>{q.text}</Text>
          <View style={styles.optionsList}>
            {q.options.map((opt, idx) => (
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
          <View style={styles.submitButtonContainer}>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Test</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showSidePanel && (
        <View style={styles.sidePanel}>
          <ScrollView style={styles.sidePanelScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.sidePanelSection}>
              <View style={styles.userRow}>
                <Ionicons name="person-circle" size={32} color={AppColors.primary} />
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
              </View>
            </View>
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
            </View>
            <View style={styles.sidePanelSection}>
              <Text style={styles.sidePanelTitle}>Question Navigation</Text>
              <View style={styles.questionGrid}>
                {questions.map((question, idx) => {
                  let bg = '#fff', border = '#BDBDBD', color = AppColors.darkGrey;
                  if (statuses[idx]?.answered && statuses[idx]?.marked) {
                    bg = '#4CAF50'; color = '#fff';
                  } else if (statuses[idx]?.answered) {
                    bg = '#4CAF50'; color = '#fff';
                  } else if (statuses[idx]?.marked) {
                    bg = '#FFC107'; color = '#000';
                  } else if (!statuses[idx]?.visited) {
                    bg = '#fff'; border = '#BDBDBD'; color = AppColors.darkGrey;
                  } else {
                    bg = '#F44336'; color = '#fff';
                  }
                  return (
                    <TouchableOpacity
                      key={question.id}
                      style={[styles.qNavBtn, { backgroundColor: bg, borderColor: border }, current === idx && styles.currentQuestion]}
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

      <Modal visible={showSubmitModal} transparent animationType="fade" onRequestClose={() => setShowSubmitModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSubmitModal(false)}>
          <TouchableOpacity style={styles.modalContainerCompact} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.submitModalHeaderCompact}>
              <View style={styles.submitModalIconSmall}>
                <Ionicons name="checkmark-done-circle" size={20} color="#0D9488" />
              </View>
              <Text style={styles.submitModalTitleCompact}>Submit exam?</Text>
              <TouchableOpacity style={styles.submitModalCloseBtnSmall} onPress={() => setShowSubmitModal(false)} activeOpacity={0.8}>
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
              <TouchableOpacity style={styles.cancelButtonCompact} onPress={() => setShowSubmitModal(false)} disabled={submitting} activeOpacity={0.8}>
                <Text style={styles.cancelButtonTextCompact}>Review</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitConfirmButton} onPress={confirmSubmit} disabled={submitting} activeOpacity={0.8}>
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FB', paddingTop: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: AppColors.primary },
  error: { color: '#DC2626', textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: AppColors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: '800' },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 6 },
  sidePanelToggle: { padding: 8, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: AppColors.primary },
  timerText: { fontSize: 18, fontWeight: 'bold', color: AppColors.primary },
  mainContent: { flex: 1, marginRight: 0 },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  qNumber: { fontWeight: 'bold', fontSize: 16, color: AppColors.primary, marginBottom: 6 },
  qText: { fontSize: 16, color: AppColors.darkGrey, marginBottom: 16 },
  optionsList: { marginBottom: 12 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  optionBtnSelected: { backgroundColor: '#E0F7FA', borderColor: AppColors.primary, borderWidth: 1 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: AppColors.primary,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  radioOuterSelected: { backgroundColor: AppColors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  optionText: { fontSize: 15, color: AppColors.darkGrey },
  qActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    marginRight: 8,
  },
  markBtnText: { color: AppColors.primary, fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
  navigationButtons: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 2 },
  skipBtn: { backgroundColor: '#E0F7FA', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, flex: 1 },
  skipBtnText: { color: AppColors.primary, fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  nextBtn: { backgroundColor: AppColors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, flex: 1 },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  submitButtonContainer: { alignItems: 'center', marginTop: 15, marginBottom: 15, paddingHorizontal: 10 },
  submitBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
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
    zIndex: 1000,
  },
  sidePanelScroll: { flex: 1, padding: 16 },
  sidePanelSection: { marginBottom: 20 },
  sidePanelTitle: { fontSize: 16, fontWeight: 'bold', color: AppColors.primary, marginBottom: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  userName: { fontWeight: 'bold', fontSize: 16, marginLeft: 8, color: AppColors.primary },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statusBox: { flex: 1, marginHorizontal: 4, borderRadius: 8, padding: 6, alignItems: 'center' },
  statusCount: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  statusLabel: { color: '#fff', fontSize: 12 },
  questionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  qNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  currentQuestion: { borderWidth: 3, borderColor: AppColors.primary, transform: [{ scale: 1.1 }] },
  qNavText: { fontWeight: 'bold', fontSize: 16 },
  checkmarkIcon: { position: 'absolute', top: -6, right: -6 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 20 },
  modalContainerCompact: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'ios' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16 } : {}),
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
  submitModalIconSmall: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  submitModalTitleCompact: { flex: 1, fontSize: 17, fontWeight: '700', color: '#0F172A' },
  submitModalCloseBtnSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  submitModalBodyCompact: { paddingVertical: 14, paddingHorizontal: 16 },
  submitModalGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  submitModalGridItem: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  submitModalGridValueGreen: { fontSize: 22, fontWeight: '800', color: '#059669' },
  submitModalGridValueRed: { fontSize: 22, fontWeight: '800', color: '#DC2626' },
  submitModalGridLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 4 },
  submitModalWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: '#FECACA' },
  submitModalWarningText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#DC2626' },
  modalActionsCompact: { flexDirection: 'row', padding: 14, gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelButtonCompact: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  cancelButtonTextCompact: { color: '#64748B', fontWeight: '600', fontSize: 14 },
  submitButtonGradientCompact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, gap: 6 },
  submitButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  submitConfirmButton: { backgroundColor: 'transparent', borderRadius: 12, flex: 1, overflow: 'hidden', elevation: 4 },
  submitConfirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

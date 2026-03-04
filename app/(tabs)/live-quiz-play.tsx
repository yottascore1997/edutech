import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LiveQuizSession = {
  id: string;
  categoryId: string;
  categoryName?: string;
  timePerQuestion?: number;
  currentQuestionIndex?: number;
  totalQuestions?: number;
};

type LiveQuizQuestion = {
  questionIndex: number;
  text: string;
  options: string[];
  /** 0-based index of correct option (from question data, not submit response) */
  correctIndex?: number;
  correctAnswerIndex?: number;
  correct?: number;
};

type LiveQuizLeaderboardEntry = {
  userId: string;
  name?: string;
  score: number;
  rank?: number;
  correctCount?: number;
  wrongCount?: number;
  timeSpentMs?: number;
};

type AnsweredMap = Record<number, number | undefined>;

const DARK_BG = '#1a1a2e';
const CARD_BG = '#16213e';
const GREEN = '#22c55e';
const GREEN_DARK = '#16a34a';
const YELLOW = '#eab308';
const RED = '#ef4444';
const ORANGE_HIGHLIGHT = '#ea580c';
const WHITE = '#ffffff';
const TEXT_MUTED = 'rgba(255,255,255,0.7)';

/** Minimum delay (ms) before showing next question after answering (e.g. to see correct/wrong feedback) */
const NEXT_QUESTION_DELAY_MS = 10000;

export default function LiveQuizPlayScreen() {
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { socket, isConnected } = useSocket({ token: user?.token, userId: user?.id });

  const [session, setSession] = useState<LiveQuizSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<LiveQuizQuestion | null>(null);
  const [leaderboard, setLeaderboard] = useState<LiveQuizLeaderboardEntry[]>([]);
  const [playingCount, setPlayingCount] = useState<number>(0);
  const [questionEndsAt, setQuestionEndsAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [answeredMap, setAnsweredMap] = useState<AnsweredMap>({});
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submitLockRef = useRef(false);
  const lastAnsweredQuestionIndexRef = useRef<number | null>(null);
  const currentQuestionRef = useRef<LiveQuizQuestion | null>(null);
  const nextQuestionDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionEndsAtRef = useRef<number | null>(null);
  const answeredMapRef = useRef<AnsweredMap>({});

  const myUserId = useMemo(() => user?.id ?? null, [user?.id]);

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);
  useEffect(() => {
    questionEndsAtRef.current = questionEndsAt;
  }, [questionEndsAt]);
  useEffect(() => {
    answeredMapRef.current = answeredMap;
  }, [answeredMap]);

  const refetchSessionState = async () => {
    if (!session?.id || !user?.token) return;
    try {
      const res = await apiFetchAuth(`/student/live-quiz/session/${session.id}`, user.token);
      if (!res.ok) return;
      const data = res.data || {};
      if (data.session) {
        setSession({
          id: String(data.session.id ?? session.id),
          categoryId: String(data.session.categoryId ?? session.categoryId),
          categoryName: data.session.categoryName ?? session.categoryName,
          timePerQuestion: Number(data.session.timePerQuestion ?? session.timePerQuestion ?? 10),
          currentQuestionIndex: data.session.currentQuestionIndex,
          totalQuestions: data.session.totalQuestions ?? session.totalQuestions,
        });
      }
      if (data.currentQuestion) {
        const q = data.currentQuestion;
        const newIndex = q.questionIndex;
        const prevIndex = currentQuestionRef.current?.questionIndex;
        const justAnswered = lastAnsweredQuestionIndexRef.current;
        const hasAnsweredCurrent = prevIndex !== undefined && answeredMapRef.current[prevIndex] !== undefined;
        const endsAt = questionEndsAtRef.current;
        const timeLeftMs = endsAt != null ? Math.max(0, endsAt - Date.now()) : 0;

        const shouldDelayForFeedback =
          justAnswered !== null && prevIndex !== undefined && justAnswered === prevIndex && newIndex !== prevIndex;
        const shouldWaitForTimer =
          !shouldDelayForFeedback &&
          prevIndex !== undefined &&
          !hasAnsweredCurrent &&
          newIndex !== prevIndex &&
          timeLeftMs > 0;

        const applyNextQuestion = () => {
          setCurrentQuestion({
            questionIndex: q.questionIndex,
            text: q.text,
            options: q.options || [],
            correctIndex: q.correctIndex ?? q.correctAnswerIndex ?? q.correct,
            correctAnswerIndex: q.correctAnswerIndex ?? q.correctIndex ?? q.correct,
            correct: q.correct ?? q.correctIndex ?? q.correctAnswerIndex,
          });
          setAnswerFeedback(null);
          setCorrectAnswerIndex(null);
          lastAnsweredQuestionIndexRef.current = null;
          if (data.questionEndsAt != null) setQuestionEndsAt(Number(data.questionEndsAt));
        };

        if (shouldDelayForFeedback) {
          if (nextQuestionDelayTimerRef.current) clearTimeout(nextQuestionDelayTimerRef.current);
          nextQuestionDelayTimerRef.current = setTimeout(applyNextQuestion, NEXT_QUESTION_DELAY_MS);
        } else if (shouldWaitForTimer) {
          if (nextQuestionDelayTimerRef.current) clearTimeout(nextQuestionDelayTimerRef.current);
          nextQuestionDelayTimerRef.current = setTimeout(applyNextQuestion, timeLeftMs);
        } else {
          applyNextQuestion();
        }
      }
      if (Array.isArray(data.leaderboard)) {
        setLeaderboard(
          data.leaderboard.map((e: any) => ({
            userId: String(e.userId ?? ''),
            name: e.name,
            score: Number(e.score ?? 0),
            rank: e.rank,
            correctCount: e.correctCount ?? 0,
            wrongCount: e.wrongCount ?? 0,
            timeSpentMs: e.totalTimeMs ?? e.timeSpentMs,
          })),
        );
      }
      if (typeof data.playingCount === 'number') setPlayingCount(data.playingCount);
      if (data.questionEndsAt != null && !data.currentQuestion) setQuestionEndsAt(Number(data.questionEndsAt));
    } catch (_) {}
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialState = async () => {
      if (!sessionId || !user?.token) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetchAuth(`/student/live-quiz/session/${sessionId}`, user.token);
        if (!isMounted) return;

        if (res.ok) {
          const data = res.data || {};
          setSession({
            id: String(data.session?.id ?? sessionId),
            categoryId: String(data.session?.categoryId ?? data.categoryId ?? ''),
            categoryName: data.session?.categoryName ?? data.categoryName ?? 'Live Quiz',
            timePerQuestion: Number(data.session?.timePerQuestion ?? data.timePerQuestion ?? 10),
            currentQuestionIndex: data.session?.currentQuestionIndex,
            totalQuestions: data.session?.totalQuestions ?? data.totalQuestions,
          });

          if (data.currentQuestion) {
            const q = data.currentQuestion;
            setCurrentQuestion({
              questionIndex: q.questionIndex,
              text: q.text,
              options: q.options || [],
              correctIndex: q.correctIndex ?? q.correctAnswerIndex ?? q.correct,
              correctAnswerIndex: q.correctAnswerIndex ?? q.correctIndex ?? q.correct,
              correct: q.correct ?? q.correctIndex ?? q.correctAnswerIndex,
            });
          }

          if (Array.isArray(data.leaderboard)) {
            setLeaderboard(
              data.leaderboard.map((e: any) => ({
                userId: String(e.userId ?? ''),
                name: e.name,
                score: Number(e.score ?? 0),
                rank: e.rank,
                correctCount: e.correctCount ?? 0,
                wrongCount: e.wrongCount ?? 0,
                timeSpentMs: e.timeSpentMs,
              })),
            );
          }

          if (typeof data.playingCount === 'number') {
            setPlayingCount(data.playingCount);
          }

          if (data.questionEndsAt) {
            setQuestionEndsAt(Number(data.questionEndsAt));
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialState();

    return () => {
      isMounted = false;
    };
  }, [sessionId, user?.token]);

  useEffect(() => {
    if (!socket || !isConnected || !session?.categoryId) return;

    const s: any = socket;

    s.emit('live_quiz_join_category', { categoryId: session.categoryId });

    const handleState = (payload: any) => {
      if (!payload) return;
      if (payload.session) {
        setSession((prev) => ({
          id: String(payload.session.id ?? prev?.id ?? ''),
          categoryId: String(payload.session.categoryId ?? prev?.categoryId ?? ''),
          categoryName: payload.session.categoryName ?? prev?.categoryName ?? 'Live Quiz',
          timePerQuestion: Number(
            payload.session.timePerQuestion ?? prev?.timePerQuestion ?? 10,
          ),
          currentQuestionIndex: payload.session.currentQuestionIndex ?? prev?.currentQuestionIndex,
          totalQuestions: payload.session.totalQuestions ?? prev?.totalQuestions,
        }));
      }
      if (payload.currentQuestion) {
        const q = payload.currentQuestion;
        const newIndex = q.questionIndex;
        const prevIndex = currentQuestionRef.current?.questionIndex;
        const justAnswered = lastAnsweredQuestionIndexRef.current;
        const hasAnsweredCurrent = prevIndex !== undefined && answeredMapRef.current[prevIndex] !== undefined;
        const endsAt = questionEndsAtRef.current;
        const timeLeftMs = endsAt != null ? Math.max(0, endsAt - Date.now()) : 0;

        const shouldDelayForFeedback =
          justAnswered !== null && prevIndex !== undefined && justAnswered === prevIndex && newIndex !== prevIndex;
        const shouldWaitForTimer =
          !shouldDelayForFeedback &&
          prevIndex !== undefined &&
          !hasAnsweredCurrent &&
          newIndex !== prevIndex &&
          timeLeftMs > 0;

        const applyNextQuestion = () => {
          setCurrentQuestion({
            questionIndex: q.questionIndex,
            text: q.text,
            options: q.options || [],
          });
          if (payload.questionEndsAt) setQuestionEndsAt(Number(payload.questionEndsAt));
          lastAnsweredQuestionIndexRef.current = null;
        };

        if (shouldDelayForFeedback) {
          if (nextQuestionDelayTimerRef.current) clearTimeout(nextQuestionDelayTimerRef.current);
          nextQuestionDelayTimerRef.current = setTimeout(applyNextQuestion, NEXT_QUESTION_DELAY_MS);
        } else if (shouldWaitForTimer) {
          if (nextQuestionDelayTimerRef.current) clearTimeout(nextQuestionDelayTimerRef.current);
          nextQuestionDelayTimerRef.current = setTimeout(applyNextQuestion, timeLeftMs);
        } else {
          applyNextQuestion();
        }
      }
      if (payload.questionEndsAt && !payload.currentQuestion) {
        setQuestionEndsAt(Number(payload.questionEndsAt));
      }
      if (Array.isArray(payload.leaderboard)) {
        setLeaderboard(
          payload.leaderboard.map((e: any) => ({
            userId: String(e.userId ?? ''),
            name: e.name,
            score: Number(e.score ?? 0),
            rank: e.rank,
            correctCount: e.correctCount ?? 0,
            wrongCount: e.wrongCount ?? 0,
            timeSpentMs: e.timeSpentMs,
          })),
        );
      }
      if (typeof payload.playingCount === 'number') {
        setPlayingCount(payload.playingCount);
      }
    };

    const handleRoundStarted = (payload: any) => {
      if (nextQuestionDelayTimerRef.current) {
        clearTimeout(nextQuestionDelayTimerRef.current);
        nextQuestionDelayTimerRef.current = null;
      }
      lastAnsweredQuestionIndexRef.current = null;
      setAnsweredMap({});
      setAnswerFeedback(null);
      setCorrectAnswerIndex(null);
      handleState(payload);
    };

    const handleNextQuestion = (payload: any) => {
      const q = payload.currentQuestion;
      const newIndex = q?.questionIndex;
      const prevIndex = currentQuestionRef.current?.questionIndex;
      const justAnswered = lastAnsweredQuestionIndexRef.current;
      const hasAnsweredCurrent = prevIndex !== undefined && answeredMapRef.current[prevIndex] !== undefined;
      const endsAt = questionEndsAtRef.current;
      const timeLeftMs = endsAt != null ? Math.max(0, endsAt - Date.now()) : 0;

      const shouldDelayForFeedback =
        q && justAnswered !== null && prevIndex !== undefined && justAnswered === prevIndex && newIndex !== prevIndex;
      const shouldWaitForTimer =
        q &&
        !shouldDelayForFeedback &&
        prevIndex !== undefined &&
        !hasAnsweredCurrent &&
        newIndex !== prevIndex &&
        timeLeftMs > 0;

      const applyNextQuestion = () => {
        setAnswerFeedback(null);
        setCorrectAnswerIndex(null);
        if (payload.currentQuestion) {
          const qq = payload.currentQuestion;
          setCurrentQuestion({
            questionIndex: qq.questionIndex,
            text: qq.text,
            options: qq.options || [],
            correctIndex: qq.correctIndex ?? qq.correctAnswerIndex ?? qq.correct,
            correctAnswerIndex: qq.correctAnswerIndex ?? qq.correctIndex ?? qq.correct,
            correct: qq.correct ?? qq.correctIndex ?? qq.correctAnswerIndex,
          });
        }
        if (payload.session?.currentQuestionIndex != null) {
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  currentQuestionIndex: payload.session.currentQuestionIndex,
                }
              : prev,
          );
        }
        if (payload.questionEndsAt) {
          setQuestionEndsAt(Number(payload.questionEndsAt));
        }
        lastAnsweredQuestionIndexRef.current = null;
      };

      if (shouldDelayForFeedback) {
        if (nextQuestionDelayTimerRef.current) clearTimeout(nextQuestionDelayTimerRef.current);
        nextQuestionDelayTimerRef.current = setTimeout(applyNextQuestion, NEXT_QUESTION_DELAY_MS);
      } else if (shouldWaitForTimer) {
        if (nextQuestionDelayTimerRef.current) clearTimeout(nextQuestionDelayTimerRef.current);
        nextQuestionDelayTimerRef.current = setTimeout(applyNextQuestion, timeLeftMs);
      } else {
        applyNextQuestion();
      }
    };

    const handleLeaderboard = (payload: any) => {
      if (Array.isArray(payload.leaderboard)) {
        setLeaderboard(
          payload.leaderboard.map((e: any) => ({
            userId: String(e.userId ?? ''),
            name: e.name,
            score: Number(e.score ?? 0),
            rank: e.rank,
            correctCount: e.correctCount ?? 0,
            wrongCount: e.wrongCount ?? 0,
            timeSpentMs: e.timeSpentMs,
          })),
        );
      }
      if (typeof payload.playingCount === 'number') {
        setPlayingCount(payload.playingCount);
      }
    };

    const handlePlayingCount = (payload: any) => {
      if (typeof payload.playingCount === 'number') {
        setPlayingCount(payload.playingCount);
      }
    };

    s.on('live_quiz_state', handleState);
    s.on('live_quiz_round_started', handleRoundStarted);
    s.on('live_quiz_next_question', handleNextQuestion);
    s.on('live_quiz_leaderboard', handleLeaderboard);
    s.on('live_quiz_playing_count', handlePlayingCount);

    return () => {
      if (nextQuestionDelayTimerRef.current) {
        clearTimeout(nextQuestionDelayTimerRef.current);
        nextQuestionDelayTimerRef.current = null;
      }
      s.emit('live_quiz_leave_category', { categoryId: session.categoryId });
      s.off('live_quiz_state', handleState);
      s.off('live_quiz_round_started', handleRoundStarted);
      s.off('live_quiz_next_question', handleNextQuestion);
      s.off('live_quiz_leaderboard', handleLeaderboard);
      s.off('live_quiz_playing_count', handlePlayingCount);
    };
  }, [socket, isConnected, session?.categoryId]);

  useEffect(() => {
    if (!questionEndsAt) {
      setTimeLeft(0);
      return;
    }

    const update = () => {
      const remainingMs = Math.max(0, questionEndsAt - Date.now());
      const seconds = Math.ceil(remainingMs / 1000);
      setTimeLeft(seconds);
    };

    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [questionEndsAt]);

  const handleSelectOption = async (optionIndex: number) => {
    if (!session || !currentQuestion || !user?.token) return;
    if (submitting || submitLockRef.current) return;

    // prevent double submit for same question
    if (answeredMap[currentQuestion.questionIndex] !== undefined) return;

    // lock immediately so double-tap can't send second request
    submitLockRef.current = true;
    setSubmitting(true);

    // 1) Time calculate as per spec
    const timePerMs = (session.timePerQuestion ?? 10) * 1000;
    const now = Date.now();
    const remainingMs = questionEndsAt ? Math.max(0, questionEndsAt - now) : 0;
    const timeSpentMs = Math.max(0, timePerMs - remainingMs);

    // 2) Mark locally as answered so UI disables double tap
    setAnsweredMap((prev) => ({
      ...prev,
      [currentQuestion.questionIndex]: optionIndex,
    }));

    try {
      // 3) API call to submit answer
      const res = await apiFetchAuth(
        `/student/live-quiz/session/${session.id}/submit`,
        user.token,
        {
          method: 'POST',
          body: {
            questionIndex: currentQuestion.questionIndex,
            answerIndex: optionIndex,
            timeSpentMs,
          },
        },
      );

      if (res.ok) {
        const data = res.data || {};

        // 4) Leaderboard + playingCount update from response
        if (Array.isArray(data.leaderboard)) {
          setLeaderboard(
            data.leaderboard.map((e: any) => ({
              userId: String(e.userId ?? ''),
              name: e.name,
              score: Number(e.score ?? 0),
              rank: e.rank,
              correctCount: e.correctCount ?? 0,
              wrongCount: e.wrongCount ?? 0,
              timeSpentMs: e.totalTimeMs ?? e.timeSpentMs,
            })),
          );
        }
        if (typeof data.playingCount === 'number') {
          setPlayingCount(data.playingCount);
        }

        // 5) Feedback (correct / wrong) – isCorrect from response; correct option from question (like web)
        const isCorrect = data.isCorrect ?? data.is_correct;
        if (typeof isCorrect === 'boolean') {
          setAnswerFeedback(isCorrect ? 'correct' : 'wrong');
        }
        const correctIdx =
          currentQuestion.correctIndex ??
          currentQuestion.correctAnswerIndex ??
          currentQuestion.correct;
        if (typeof correctIdx === 'number' && correctIdx >= 0) {
          setCorrectAnswerIndex(correctIdx);
        } else if (isCorrect) {
          setCorrectAnswerIndex(optionIndex);
        }

        // Mark that user just answered so next question shows after 2s delay
        lastAnsweredQuestionIndexRef.current = currentQuestion.questionIndex;

        // Fallback: refetch after delay so next question UI updates if socket didn't push
        setTimeout(() => refetchSessionState(), NEXT_QUESTION_DELAY_MS);
      }

      // 7) Ask server to refresh global leaderboard via socket
      if (socket && session.categoryId) {
        (socket as any).emit('live_quiz_refresh_leaderboard', {
          categoryId: session.categoryId,
          sessionId: session.id,
        });
      }
    } catch (err: any) {
      const isAlreadyAnswered =
        err?.status === 400 &&
        (String(err?.data?.error || err?.data?.message || '').toLowerCase().includes('already answered'));

      if (isAlreadyAnswered) {
        // Server already has this answer – sync state so next question appears
        refetchSessionState();
        // Delayed refetch again so UI gets next question when server has moved on
        setTimeout(() => refetchSessionState(), NEXT_QUESTION_DELAY_MS);
        if (socket && session.categoryId) {
          (socket as any).emit('live_quiz_refresh_leaderboard', {
            categoryId: session.categoryId,
            sessionId: session.id,
          });
        }
      } else {
        // Keep selection visible; show error so user knows submit failed
        const msg = err?.data?.message || err?.data?.error || err?.message || 'Answer submit failed. Check connection.';
        Alert.alert('Submit failed', String(msg));
        // Optionally show as wrong so user sees red (optional: setAnswerFeedback('wrong'))
      }
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  };

  const myEntry = useMemo(() => {
    if (!myUserId) return null;
    return leaderboard.find((e) => e.userId === myUserId);
  }, [leaderboard, myUserId]);

  const myRank = myEntry?.rank ?? null;

  const formatTime = (ms?: number) => {
    if (ms == null) return '0M';
    const sec = Math.round(ms / 1000);
    if (sec < 60) return `${sec}M`;
    return `${Math.floor(sec / 60)}M`;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: DARK_BG }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: DARK_BG }]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.errorText}>Quiz session not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const quizTitle = session.categoryName || 'Live Quiz';
  const displayTitle = quizTitle.length > 18 ? quizTitle.slice(0, 16) + '...' : quizTitle;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Top bar: back | title + Change quiz | timer */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topBarIcon}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle} numberOfLines={1}>{displayTitle}</Text>
          <TouchableOpacity
            style={styles.changeQuizButton}
            onPress={() => router.replace('/(tabs)/live-quiz-categories')}
          >
            <Text style={styles.changeQuizText}>Change quiz</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.topBarTimerWrap}>
          <View style={styles.topBarTimerCircle}>
            <Text style={styles.topBarTimerNumber}>{timeLeft}</Text>
          </View>
        </View>
      </View>

      {/* Status row: Your Rank | +correct | -wrong | X Playing */}
      <View style={styles.statusRow}>
          <View style={styles.rankPill}>
          <Text style={styles.rankPillText}>Your Rank: {myRank ?? '-'}</Text>
        </View>
        <View style={styles.scorePills}>
          <View style={[styles.miniPill, styles.miniPillGreen]}>
            <Text style={styles.miniPillText}>+{myEntry?.correctCount ?? 0}</Text>
          </View>
          <View style={[styles.miniPill, styles.miniPillWhite]}>
            <Text style={[styles.miniPillText, { color: RED }]}>
              -{myEntry?.wrongCount ?? 0}
            </Text>
          </View>
          <View style={[styles.miniPill, styles.miniPillWhite]}>
            <Text style={styles.miniPillText}>{playingCount} Playing</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        <View style={styles.leaderboardCard}>
          {leaderboard.length === 0 ? (
            <Text style={styles.emptyLeaderboard}>No entries yet</Text>
          ) : (
            leaderboard.slice(0, 5).map((entry) => {
              const isMe = entry.userId === myUserId;
              return (
                <View
                  key={entry.userId}
                  style={[styles.leaderboardRow, isMe && styles.leaderboardRowHighlight]}
                >
                  <Text style={styles.lbRank}>{entry.rank ?? '-'}</Text>
                  <Text style={styles.lbName} numberOfLines={1}>
                    {entry.name || 'Player'}
                  </Text>
                  <View style={styles.lbCorrect}>
                    <Ionicons name="checkmark-circle" size={12} color={GREEN} />
                    <Text style={styles.lbScoreText}>{entry.correctCount ?? 0}</Text>
                  </View>
                  <View style={styles.lbWrong}>
                    <Ionicons name="close-circle" size={12} color={RED} />
                    <Text style={styles.lbScoreText}>{entry.wrongCount ?? 0}</Text>
                  </View>
                  <Text style={styles.lbPoints}>{Number(entry.score).toFixed(1)}B</Text>
                  <Text style={styles.lbTime}>{formatTime(entry.timeSpentMs)}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.text}</Text>
        </View>

        {/* Options 1-4 */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((opt, index) => {
            const hasAnswered = answeredMap[currentQuestion.questionIndex] !== undefined;
            const selectedIndex = answeredMap[currentQuestion.questionIndex];
            const isSelectedOption = selectedIndex === index;
            const isCorrectAnswer = correctAnswerIndex !== null && index === correctAnswerIndex;
            const isDisabled = submitting || hasAnswered;

            let optBg = WHITE;
            let optBorder = undefined;
            if (hasAnswered && isCorrectAnswer) {
              optBg = '#dcfce7';
              optBorder = { borderWidth: 2, borderColor: GREEN };
            }
            if (hasAnswered && isSelectedOption) {
              if (answerFeedback === 'correct') {
                optBg = '#dcfce7';
                optBorder = { borderWidth: 2, borderColor: GREEN };
              } else if (answerFeedback === 'wrong') {
                optBg = '#fee2e2';
                optBorder = { borderWidth: 2, borderColor: RED };
              } else {
                optBg = '#e0e7ff';
                optBorder = { borderWidth: 2, borderColor: YELLOW };
              }
            } else if (hasAnswered && !isCorrectAnswer) {
              optBg = 'rgba(255,255,255,0.7)';
            }

            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionButton, { backgroundColor: optBg }, optBorder]}
                disabled={isDisabled}
                onPress={() => handleSelectOption(index)}
                activeOpacity={0.9}
              >
                <Text style={styles.optionNum}>{index + 1}</Text>
                <Text style={styles.optionText} numberOfLines={2}>
                  {opt}
                </Text>
                {hasAnswered && isCorrectAnswer && (
                  <Ionicons name="checkmark-circle" size={22} color={GREEN} style={{ marginLeft: 6 }} />
                )}
                {hasAnswered && isSelectedOption && !isCorrectAnswer && answerFeedback === 'wrong' && (
                  <Ionicons name="close-circle" size={22} color={RED} style={{ marginLeft: 6 }} />
                )}
                {hasAnswered && isSelectedOption && answerFeedback === 'correct' && (
                  <Ionicons name="checkmark-circle" size={22} color={GREEN} style={{ marginLeft: 6 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 15,
    color: RED,
    marginBottom: 12,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: CARD_BG,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  topBarIcon: {
    padding: 4,
    width: 36,
    alignItems: 'center',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  topBarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 2,
  },
  changeQuizButton: {
    backgroundColor: YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeQuizText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  topBarTimerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
  },
  topBarTimerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  topBarTimerNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: WHITE,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  rankPill: {
    backgroundColor: GREEN_DARK,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  rankPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: WHITE,
  },
  scorePills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  miniPillGreen: {
    backgroundColor: GREEN,
  },
  miniPillWhite: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  miniPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: WHITE,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 6,
  },
  leaderboardCard: {
    backgroundColor: CARD_BG,
    borderRadius: 10,
    padding: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyLeaderboard: {
    color: TEXT_MUTED,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  leaderboardRowHighlight: {
    backgroundColor: ORANGE_HIGHLIGHT,
    borderRadius: 6,
    marginHorizontal: -2,
    paddingHorizontal: 6,
  },
  lbRank: {
    width: 24,
    fontSize: 11,
    fontWeight: '700',
    color: WHITE,
  },
  lbName: {
    flex: 1,
    fontSize: 11,
    color: WHITE,
    marginRight: 4,
  },
  lbCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 28,
  },
  lbWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 28,
  },
  lbScoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: WHITE,
  },
  lbPoints: {
    width: 32,
    fontSize: 10,
    fontWeight: '600',
    color: WHITE,
    textAlign: 'right',
  },
  lbTime: {
    width: 24,
    fontSize: 10,
    fontWeight: '600',
    color: WHITE,
    textAlign: 'right',
  },
  questionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 14,
    gap: 4,
  },
  progressDotWrap: {
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotCurrent: {
    backgroundColor: YELLOW,
  },
  progressDotDone: {
    backgroundColor: GREEN,
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: WHITE,
  },
  bonusLabel: {
    fontSize: 9,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  questionCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: WHITE,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionNum: {
    width: 26,
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    marginRight: 10,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
});
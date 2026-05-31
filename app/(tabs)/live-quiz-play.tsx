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
  status?: string;
  timePerQuestion?: number;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  startedAt?: string | null;
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

/** Delay (ms) to show correct/wrong feedback before next question. Kept short so multiplayer stays in sync. */
const NEXT_QUESTION_DELAY_MS = 4000;

function toQuestionEndsAtMs(value: number | null | undefined): number | null {
  if (value == null || value <= 0) return null;
  return value < 1e12 ? value * 1000 : value;
}

/** Match web client: use server endsAt, or derive from session.startedAt + question index */
function getQuestionEndsAtMs(
  serverEndsAt: number | null | undefined,
  session: Pick<LiveQuizSession, 'startedAt' | 'currentQuestionIndex' | 'timePerQuestion'>,
): number | null {
  const fromServer = toQuestionEndsAtMs(serverEndsAt);
  if (fromServer != null) return fromServer;
  if (session.startedAt) {
    const startedAtMs = new Date(session.startedAt).getTime();
    const t = (session.timePerQuestion ?? 10) * 1000;
    return startedAtMs + ((session.currentQuestionIndex ?? 0) + 1) * t;
  }
  if (session.timePerQuestion) {
    return Date.now() + session.timePerQuestion * 1000;
  }
  return null;
}

function parseSession(raw: any, fallback?: LiveQuizSession | null): LiveQuizSession | null {
  if (!raw && !fallback) return null;
  const id = String(raw?.id ?? fallback?.id ?? '');
  if (!id) return fallback ?? null;
  return {
    id,
    categoryId: String(raw?.categoryId ?? fallback?.categoryId ?? ''),
    categoryName: raw?.title ?? raw?.categoryName ?? fallback?.categoryName ?? 'Live Quiz',
    status: raw?.status ?? fallback?.status,
    timePerQuestion: Number(raw?.timePerQuestion ?? fallback?.timePerQuestion ?? 10),
    currentQuestionIndex:
      typeof raw?.currentQuestionIndex === 'number'
        ? raw.currentQuestionIndex
        : fallback?.currentQuestionIndex,
    totalQuestions: raw?.totalQuestions ?? fallback?.totalQuestions,
    startedAt: raw?.startedAt ?? fallback?.startedAt ?? null,
  };
}

function parseQuestion(raw: any, session?: LiveQuizSession | null): LiveQuizQuestion | null {
  if (!raw?.text) return null;
  const questionIndex =
    typeof raw.questionIndex === 'number'
      ? raw.questionIndex
      : typeof session?.currentQuestionIndex === 'number'
        ? session.currentQuestionIndex
        : 0;
  return {
    questionIndex,
    text: raw.text,
    options: raw.options || [],
    correctIndex: raw.correctIndex ?? raw.correctAnswerIndex ?? raw.correct,
    correctAnswerIndex: raw.correctAnswerIndex ?? raw.correctIndex ?? raw.correct,
    correct: raw.correct ?? raw.correctIndex ?? raw.correctAnswerIndex,
  };
}

function isSessionFinished(status?: string) {
  return String(status || '').toUpperCase() === 'FINISHED';
}

export default function LiveQuizPlayScreen() {
  const insets = useSafeAreaInsets();
  const { sessionId, categoryId: categoryIdParam } = useLocalSearchParams<{
    sessionId?: string;
    categoryId?: string;
  }>();
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
  /** True after first socket state / round_started — avoids flashing stale REST questions */
  const [socketSynced, setSocketSynced] = useState(false);
  /** Between rounds: old session ended, waiting for live_quiz_round_started */
  const [betweenRounds, setBetweenRounds] = useState(false);

  const submitLockRef = useRef(false);
  const lastAnsweredQuestionIndexRef = useRef<number | null>(null);
  const currentQuestionRef = useRef<LiveQuizQuestion | null>(null);
  const sessionRef = useRef<LiveQuizSession | null>(null);
  const socketSyncedRef = useRef(false);
  const nextQuestionDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catchUpDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionEndsAtRef = useRef<number | null>(null);
  const answeredMapRef = useRef<AnsweredMap>({});
  const refetchedAtZeroForQuestionRef = useRef<number | null>(null);

  const myUserId = useMemo(() => user?.id ?? null, [user?.id]);

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  useEffect(() => {
    questionEndsAtRef.current = questionEndsAt;
  }, [questionEndsAt]);
  useEffect(() => {
    answeredMapRef.current = answeredMap;
  }, [answeredMap]);

  const markSocketSynced = () => {
    if (!socketSyncedRef.current) {
      socketSyncedRef.current = true;
      setSocketSynced(true);
    }
  };

  const refetchSessionState = async () => {
    const activeSession = sessionRef.current;
    if (!activeSession?.id || !user?.token) return;
    try {
      const res = await apiFetchAuth(`/student/live-quiz/session/${activeSession.id}`, user.token);
      if (!res.ok) return;
      const data = res.data || {};
      const nextSession = parseSession(data.session, activeSession);
      if (nextSession) setSession(nextSession);

      if (isSessionFinished(nextSession?.status)) {
        setBetweenRounds(true);
        setCurrentQuestion(null);
        return;
      }

      if (data.currentQuestion) {
        const q = parseQuestion(data.currentQuestion, nextSession ?? activeSession);
        if (!q) return;
        const endsAtMs = getQuestionEndsAtMs(
          data.questionEndsAt != null ? Number(data.questionEndsAt) : null,
          nextSession ?? activeSession,
        );
        setBetweenRounds(false);
        const prevIndex = currentQuestionRef.current?.questionIndex;
        if (prevIndex != null && q.questionIndex > prevIndex + 1) {
          return;
        }
        setCurrentQuestion(q);
        setQuestionEndsAt(endsAtMs);
        refetchedAtZeroForQuestionRef.current = null;
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
      if (data.questionEndsAt != null && !data.currentQuestion) {
        const endsAtMs = getQuestionEndsAtMs(Number(data.questionEndsAt), nextSession ?? activeSession);
        setQuestionEndsAt(endsAtMs);
      }
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
          const loadedSession = parseSession(data.session, {
            id: String(data.session?.id ?? sessionId),
            categoryId: String(
              data.session?.categoryId ?? data.categoryId ?? categoryIdParam ?? '',
            ),
            categoryName: data.session?.title ?? data.session?.categoryName ?? data.categoryName ?? 'Live Quiz',
          });
          if (loadedSession) setSession(loadedSession);

          if (isSessionFinished(loadedSession?.status)) {
            setBetweenRounds(true);
          }
          // Question + timer come from socket (live_quiz_state) to avoid flashing mid-round catch-up

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
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialState();

    return () => {
      isMounted = false;
    };
  }, [sessionId, categoryIdParam, user?.token]);

  // Seed category early so socket can join before REST finishes
  useEffect(() => {
    if (!categoryIdParam || session?.categoryId) return;
    setSession((prev) =>
      prev ?? {
        id: String(sessionId ?? ''),
        categoryId: String(categoryIdParam),
        categoryName: 'Live Quiz',
        timePerQuestion: 10,
      },
    );
  }, [categoryIdParam, sessionId, session?.categoryId]);

  // If socket never connects, fall back to REST after a short wait
  useEffect(() => {
    if (socketSynced || !session?.categoryId) return;
    const t = setTimeout(() => {
      if (!socketSyncedRef.current) {
        markSocketSynced();
        refetchSessionState();
      }
    }, 8000);
    return () => clearTimeout(t);
  }, [session?.categoryId, socketSynced]);

  useEffect(() => {
    if (!socket || !isConnected || !session?.categoryId) return;

    const s: any = socket;

    s.emit('live_quiz_join_category', { categoryId: session.categoryId });

    const applyQuestionUpdate = (
      q: LiveQuizQuestion,
      endsAtMs: number | null,
      opts: { fromRoundStart?: boolean; delayFeedback?: boolean },
    ) => {
      const prevIndex = currentQuestionRef.current?.questionIndex;
      const newIndex = q.questionIndex;
      const justAnswered = lastAnsweredQuestionIndexRef.current;

      setBetweenRounds(false);

      const shouldDelayForFeedback =
        !!opts.delayFeedback &&
        justAnswered !== null &&
        prevIndex !== undefined &&
        justAnswered === prevIndex &&
        newIndex !== prevIndex;

      const apply = () => {
        setCurrentQuestion(q);
        setAnswerFeedback(null);
        setCorrectAnswerIndex(null);
        setQuestionEndsAt(endsAtMs);
        lastAnsweredQuestionIndexRef.current = null;
        refetchedAtZeroForQuestionRef.current = null;
      };

      // Server catch-up: skip intermediate questions (only show latest)
      if (
        !opts.fromRoundStart &&
        prevIndex != null &&
        newIndex > prevIndex + 1 &&
        justAnswered !== prevIndex
      ) {
        if (catchUpDebounceRef.current) clearTimeout(catchUpDebounceRef.current);
        catchUpDebounceRef.current = setTimeout(apply, 350);
        return;
      }

      if (shouldDelayForFeedback) {
        if (nextQuestionDelayTimerRef.current) clearTimeout(nextQuestionDelayTimerRef.current);
        nextQuestionDelayTimerRef.current = setTimeout(apply, NEXT_QUESTION_DELAY_MS);
      } else {
        if (catchUpDebounceRef.current) {
          clearTimeout(catchUpDebounceRef.current);
          catchUpDebounceRef.current = null;
        }
        apply();
      }
    };

    const applySocketSession = (payloadSession: any, resetAnswers = false) => {
      const prev = sessionRef.current;
      const next = parseSession(payloadSession, prev);
      if (!next) return;
      const sessionChanged = !!(prev && next.id !== prev.id);
      if (resetAnswers || sessionChanged) {
        setAnsweredMap({});
        setAnswerFeedback(null);
        setCorrectAnswerIndex(null);
        lastAnsweredQuestionIndexRef.current = null;
        refetchedAtZeroForQuestionRef.current = null;
      }
      // Only show "naya round" when session actually changed (round ended → new session)
      if (sessionChanged && !resetAnswers) {
        setBetweenRounds(true);
        setCurrentQuestion(null);
      }
      setSession(next);
    };

    const handleState = (payload: any) => {
      if (!payload) return;
      markSocketSynced();
      if (payload.session) {
        applySocketSession(payload.session);
      }
      if (isSessionFinished(payload.session?.status)) {
        setBetweenRounds(true);
        setCurrentQuestion(null);
        return;
      }
      if (payload.currentQuestion) {
        const q = parseQuestion(payload.currentQuestion, payload.session);
        if (!q) return;
        const endsAtMs = getQuestionEndsAtMs(
          payload.questionEndsAt != null ? Number(payload.questionEndsAt) : null,
          payload.session ?? sessionRef.current ?? { timePerQuestion: 10 },
        );
        applyQuestionUpdate(q, endsAtMs, { fromRoundStart: q.questionIndex === 0 });
      }
      if (payload.questionEndsAt != null && !payload.currentQuestion) {
        const endsAtMs = getQuestionEndsAtMs(
          Number(payload.questionEndsAt),
          payload.session ?? sessionRef.current ?? { timePerQuestion: 10 },
        );
        setQuestionEndsAt(endsAtMs);
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
      markSocketSynced();
      setBetweenRounds(false);
      if (nextQuestionDelayTimerRef.current) {
        clearTimeout(nextQuestionDelayTimerRef.current);
        nextQuestionDelayTimerRef.current = null;
      }
      if (catchUpDebounceRef.current) {
        clearTimeout(catchUpDebounceRef.current);
        catchUpDebounceRef.current = null;
      }
      if (payload?.session) {
        applySocketSession(payload.session, true);
      } else {
        setAnsweredMap({});
        setAnswerFeedback(null);
        setCorrectAnswerIndex(null);
        lastAnsweredQuestionIndexRef.current = null;
      }
      handleState(payload);
    };

    const handleNextQuestion = (payload: any) => {
      markSocketSynced();
      if (payload?.session) {
        applySocketSession(payload.session);
      }
      const q = payload.currentQuestion ? parseQuestion(payload.currentQuestion, payload.session) : null;
      if (!q) return;
      const prevIndex = currentQuestionRef.current?.questionIndex;
      const justAnswered = lastAnsweredQuestionIndexRef.current;
      const endsAtMs = getQuestionEndsAtMs(
        payload.questionEndsAt != null ? Number(payload.questionEndsAt) : null,
        payload.session ?? sessionRef.current ?? { timePerQuestion: 10 },
      );
      applyQuestionUpdate(q, endsAtMs, {
        delayFeedback:
          justAnswered !== null && prevIndex !== undefined && justAnswered === prevIndex && q.questionIndex !== prevIndex,
      });
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
      if (catchUpDebounceRef.current) {
        clearTimeout(catchUpDebounceRef.current);
        catchUpDebounceRef.current = null;
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

  // When timer hits 0, sync with server (only if clock was valid — not stale catch-up)
  useEffect(() => {
    if (timeLeft !== 0 || !currentQuestion || !session?.id || !user?.token) return;
    if (!socketSyncedRef.current || betweenRounds) return;
    const endsAt = questionEndsAtRef.current;
    if (endsAt != null && endsAt <= Date.now()) return;
    if (refetchedAtZeroForQuestionRef.current === currentQuestion.questionIndex) return;
    refetchedAtZeroForQuestionRef.current = currentQuestion.questionIndex;
    refetchSessionState();
  }, [timeLeft, currentQuestion?.questionIndex, session?.id, user?.token, betweenRounds]);

  // Periodic sync — only after socket is ready and user is in an active question
  useEffect(() => {
    if (!socketSynced || !session?.id || !currentQuestion || !user?.token || betweenRounds) return;
    const interval = setInterval(() => refetchSessionState(), 6000);
    return () => clearInterval(interval);
  }, [socketSynced, session?.id, currentQuestion?.questionIndex, user?.token, betweenRounds]);

  const handleSelectOption = async (optionIndex: number) => {
    const activeSession = sessionRef.current;
    if (!activeSession || !currentQuestion || !user?.token) return;
    if (isSessionFinished(activeSession.status)) {
      Alert.alert('Quiz ended', 'Naya round shuru ho raha hai, thoda wait karein.');
      refetchSessionState();
      return;
    }
    if (submitting || submitLockRef.current) return;

    const questionIndex =
      typeof currentQuestion.questionIndex === 'number'
        ? currentQuestion.questionIndex
        : activeSession.currentQuestionIndex ?? 0;

    // prevent double submit for same question
    if (answeredMap[questionIndex] !== undefined) return;

    // lock immediately so double-tap can't send second request
    submitLockRef.current = true;
    setSubmitting(true);

    // 1) Time calculate as per spec
    const timePerMs = (activeSession.timePerQuestion ?? 10) * 1000;
    const now = Date.now();
    const remainingMs = questionEndsAt ? Math.max(0, questionEndsAt - now) : 0;
    const timeSpentMs = Math.max(0, timePerMs - remainingMs);

    // 2) Mark locally as answered so UI disables double tap
    setAnsweredMap((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));

    try {
      // 3) API call to submit answer — always use latest session id from socket sync
      const res = await apiFetchAuth(
        `/student/live-quiz/session/${activeSession.id}/submit`,
        user.token,
        {
          method: 'POST',
          body: {
            questionIndex,
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
        lastAnsweredQuestionIndexRef.current = questionIndex;

        // Fallback: refetch after delay so next question UI updates if socket didn't push
        setTimeout(() => refetchSessionState(), NEXT_QUESTION_DELAY_MS);
      }

      // 7) Ask server to refresh global leaderboard via socket
      const latestSession = sessionRef.current;
      if (socket && latestSession?.categoryId) {
        (socket as any).emit('live_quiz_refresh_leaderboard', {
          categoryId: latestSession.categoryId,
          sessionId: latestSession.id,
        });
      }
    } catch (err: any) {
      const errText = String(err?.data?.error || err?.data?.message || '').toLowerCase();
      const isAlreadyAnswered =
        err?.status === 400 && errText.includes('already');

      if (isAlreadyAnswered) {
        refetchSessionState();
        setTimeout(() => refetchSessionState(), NEXT_QUESTION_DELAY_MS);
        const latestSession = sessionRef.current;
        if (socket && latestSession?.categoryId) {
          (socket as any).emit('live_quiz_refresh_leaderboard', {
            categoryId: latestSession.categoryId,
            sessionId: latestSession.id,
          });
        }
      } else if (errText.includes('ended')) {
        // Stale session — sync with server; new round may have started via socket
        refetchSessionState();
        Alert.alert('Quiz ended', 'Naya round load ho raha hai. Dubara try karein.');
      } else {
        const msg = err?.data?.error || err?.data?.message || err?.message || 'Answer submit failed. Check connection.';
        Alert.alert('Submit failed', String(msg));
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

  const waitingForSocket = !!session?.categoryId && !socketSynced && !betweenRounds;

  if (loading || waitingForSocket) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: DARK_BG }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={{ color: TEXT_MUTED, marginTop: 12, fontSize: 14 }}>
          {waitingForSocket ? 'Live quiz join ho raha hai...' : 'Quiz load ho raha hai...'}
        </Text>
      </View>
    );
  }

  if (!session) {
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

  // Only between full rounds — not after every question
  if (betweenRounds && !currentQuestion) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: DARK_BG, paddingHorizontal: 24 }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={YELLOW} />
        <Text style={[styles.errorText, { color: WHITE, fontSize: 20, fontWeight: '800', marginTop: 16 }]}>
          Naya round shuru ho raha hai...
        </Text>
        <Text style={{ color: TEXT_MUTED, textAlign: 'center', marginTop: 8, fontSize: 13 }}>
          Purana round khatam ho gaya. Thodi der mein naya quiz shuru hoga.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { marginTop: 24 }]}
          onPress={() => router.replace('/(tabs)/live-quiz-categories')}
        >
          <Text style={styles.backButtonText}>Category change karein</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: DARK_BG }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={{ color: TEXT_MUTED, marginTop: 12 }}>Agla question load ho raha hai...</Text>
      </View>
    );
  }

  const quizTitle = session.categoryName || 'Live Quiz';
  const displayTitle = quizTitle.length > 18 ? quizTitle.slice(0, 16) + '...' : quizTitle;
  const activeQuestionIndex =
    typeof currentQuestion.questionIndex === 'number'
      ? currentQuestion.questionIndex
      : session.currentQuestionIndex ?? 0;

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
            const hasAnswered = answeredMap[activeQuestionIndex] !== undefined;
            const selectedIndex = answeredMap[activeQuestionIndex];
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
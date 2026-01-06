import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SoundManager } from '@/utils/sounds';
import * as Haptics from 'expo-haptics';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { io, Socket } from 'socket.io-client';

const { width, height } = Dimensions.get('window');

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
}

interface BattleState {
  status: 'preparing' | 'playing' | 'finished';
  currentQuestion: number;
  totalQuestions: number;
  timeLeft: number;
  question?: Question;
  player1Score: number;
  player2Score: number;
  opponent?: {
    id: string;
    name: string;
  };
  answers: { [key: number]: number };
  opponentAnswers: { [key: number]: number };
}

export default function BattleRoomScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const matchId = params.matchId as string;
  const roomCode = params.roomCode as string;
  
  const [battleState, setBattleState] = useState<BattleState>({
    status: 'preparing',
    currentQuestion: 0,
    totalQuestions: 5,
    timeLeft: 10,
    player1Score: 0,
    player2Score: 0,
    answers: {},
    opponentAnswers: {}
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Socket connection
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Refs
  const timerRef = useRef<number | null>(null);
  const questionTimerRef = useRef<number | null>(null);
  const socketListenersRef = useRef<Set<string>>(new Set());
  const lastQuestionIndexRef = useRef<number>(-1);

  // Animation values for victory screen
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const trophyScaleAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  
  // Animation values for firecrackers
  const firecrackerAnim1 = useRef(new Animated.Value(0)).current;
  const firecrackerAnim2 = useRef(new Animated.Value(0)).current;
  const firecrackerAnim3 = useRef(new Animated.Value(0)).current;
  
  // Animation values for defeat screen
  const defeatAnim = useRef(new Animated.Value(0)).current;
  const tearAnim = useRef(new Animated.Value(0)).current;

  // Monitor battle state changes
  useEffect(() => {
    console.log('🔄 Battle state changed:', {
      status: battleState.status,
      currentQuestion: battleState.currentQuestion,
      questionText: battleState.question?.text?.substring(0, 50) + '...',
      questionOptions: battleState.question?.options,
      optionsCount: battleState.question?.options?.length,
      timeLeft: battleState.timeLeft
    });
  }, [battleState]);

  // Trigger victory animation when battle ends
  useEffect(() => {
    if (battleState.status === 'finished') {
      const isWinner = battleState.player1Score > battleState.player2Score;
      if (isWinner) {
        // Start victory animation after a short delay
        setTimeout(() => {
          startVictoryAnimation();
        }, 500);
      } else {
        // Start defeat animation if not a draw
        startDefeatAnimation();
      }
    }
  }, [battleState.status, battleState.player1Score, battleState.player2Score]);

  // Victory animation function
  const startVictoryAnimation = () => {
    // Reset animations
    confettiAnim.setValue(0);
    trophyScaleAnim.setValue(0);
    scoreAnim.setValue(0);
    celebrationAnim.setValue(0);
    firecrackerAnim1.setValue(0);
    firecrackerAnim2.setValue(0);
    firecrackerAnim3.setValue(0);

    // Start celebration sequence
    Animated.sequence([
      // Trophy scale animation
      Animated.spring(trophyScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Score count animation
      Animated.timing(scoreAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Celebration pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(celebrationAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Firecrackers animation - Continuous loop
    // Firecracker 1 - Continuous
    Animated.loop(
      Animated.sequence([
        Animated.timing(firecrackerAnim1, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(firecrackerAnim1, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Firecracker 2 - Continuous with delay
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(firecrackerAnim2, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(firecrackerAnim2, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1000);

    // Firecracker 3 - Continuous with different delay
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(firecrackerAnim3, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(firecrackerAnim3, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 2000);
  };

  // Defeat animation function
  const startDefeatAnimation = () => {
    // Reset animations
    defeatAnim.setValue(0);
    tearAnim.setValue(0);

    // Defeat shake animation
    Animated.sequence([
      Animated.timing(defeatAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(defeatAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Tear drop animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(tearAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(tearAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Initialize socket connection
  useEffect(() => {



    
    if (user?.token) {





      
      const newSocket = io('http://192.168.1.5:3001', {
        auth: {
          token: user.token
        },
        transports: ['polling', 'websocket'], // Prefer polling for React Native
        path: '/api/socket',
        timeout: 20000, // Longer timeout for React Native
        forceNew: true
      });

      newSocket.on('connect', () => {








        setIsConnected(true);
        setError(null);
        
        // Register user immediately after connection (like matchmaking.tsx)
        if (user?.id) {

          newSocket.emit('register_user', user.id);
        }
        // Join the match room

        newSocket.emit('join_match', { matchId, userId: user?.id });

      });

      newSocket.on('disconnect', () => {

        setIsConnected(false);
      });

      newSocket.on('error', (error) => {
        // Silently handle socket errors - no console logging
        // console.error('🔥 Battle Room Socket error:', error);
        setError('Socket error occurred.');
      });
      
      newSocket.on('connect_error', (error) => {
        // Silently handle socket errors - no console logging
        // console.error('🔥 Battle Room Socket connection error:', error);
        setError('Connection failed. Please check your internet connection and try again.');
        setIsConnected(false);
      });

      newSocket.on('pong', () => {

      });

      setSocket(newSocket);

      return () => {

        newSocket.disconnect();
      };
    } else {

      setError('Authentication required.');
    }
  }, [user?.token, matchId]);

  // Cleanup function for socket listeners
  const cleanupSocketListeners = useCallback(() => {
    if (!socket) return;
    

    const events = ['match_started', 'next_question', 'match_ended', 'opponent_answered', 'match_not_found', 'pong', 'session_cleanup_complete'];
    
    events.forEach(event => {
      if (socketListenersRef.current.has(event)) {
        socket.off(event);
        socketListenersRef.current.delete(event);

      }
    });
  }, [socket]);

  // Setup socket listeners
  const setupSocketListeners = useCallback(() => {
    if (!socket || !isConnected) {

      return;
    }




    // Clean up existing listeners first
    cleanupSocketListeners();

    // Listen for battle events

    
    // Match started event
    const handleMatchStarted = (data: { 
      matchId: string; 
      questionIndex: number; 
      question: Question; 
      timeLimit: number 
    }) => {





      
      setBattleState(prev => ({
        ...prev,
        status: 'playing',
        currentQuestion: data.questionIndex,
        question: data.question,
        timeLeft: data.timeLimit
      }));
      
      // Start timer (sound will play inside startQuestionTimer)
      startQuestionTimer(data.timeLimit);
      

    };

    // Next question event
    const handleNextQuestion = (data: { 
      questionIndex: number; 
      question: Question 
    }) => {





      
      // Prevent duplicate processing
      if (data.questionIndex === lastQuestionIndexRef.current) {

        return;
      }
      
      lastQuestionIndexRef.current = data.questionIndex;
      
      // Force state update with setTimeout for React Native compatibility
      setTimeout(() => {

        setBattleState(prev => {
          const newState = {
            ...prev,
            currentQuestion: data.questionIndex,
            question: data.question,
            timeLeft: 10 // Default time limit
          };

          return newState;
        });
        
        // Start timer after state update
        setTimeout(() => {

          startQuestionTimer(10);

        }, 100);
      }, 100); // Longer delay for React Native
      

    };

    // Match ended event
    // const handleMatchEnded = (data: { 
    //   matchId: string; 
    //   myScore: number; 
    //   opponentScore: number; 
    //   winner: string; 
    //   isDraw: boolean 
    // }) => {
    //   console.log('🏁 Match ended event received:', data);
    //   console.log('   - My score:', data.myScore);
    //   console.log('   - Opponent score:', data.opponentScore);
    //   console.log('   - Winner:', data.winner);
    //   console.log('   - Is draw:', data.isDraw);
      
    //   if (timerRef.current) {
    //     clearInterval(timerRef.current);
    //     timerRef.current = null;
    //   }
    //   if (questionTimerRef.current) {
    //     clearInterval(questionTimerRef.current);
    //     questionTimerRef.current = null;
    //   }
      
    //   setBattleState(prev => ({
    //     ...prev,
    //     status: 'finished',
    //     player1Score: data.myScore,
    //     player2Score: data.opponentScore
    //   }));
    // };
// Match ended event
const handleMatchEnded = (data: { 
  matchId: string; 
  myScore: number; 
  opponentScore: number; 
  winner: string; 
  isDraw: boolean 
}) => {





  
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
  if (questionTimerRef.current) {
    clearInterval(questionTimerRef.current);
    questionTimerRef.current = null;
  }
  
  // Stop all playing sounds when battle ends
  SoundManager.cleanup();
  
  setBattleState(prev => ({
    ...prev,
    status: 'finished',
    player1Score: data.myScore,
    player2Score: data.opponentScore
  }));

  // 🧹 FRONTEND SESSION CLEANUP - यहाँ add करें



  
  // Send cleanup request to server
  if (socket && socket.connected) {
    socket.emit('cleanup_match_session', {
      matchId: data.matchId,
      userId: user?.id
    });

  }
  
  // Local state cleanup
  setTimeout(() => {


  }, 3000);
};
    // Opponent answered event
    // const handleOpponentAnswered = (data: { questionIndex: number }) => {
    //   console.log('👥 Opponent answered event received:', data);
    //   console.log('   - Question index:', data.questionIndex);
    //   console.log('   - Current question:', battleState.currentQuestion);
      
    //   setBattleState(prev => ({
    //     ...prev,
    //     opponentAnswers: {
    //       ...prev.opponentAnswers,
    //       [data.questionIndex]: 1 // Just mark as answered
    //     }
    //   }));
      
    //   console.log('✅ Opponent answered state updated');
    // };
    const handleOpponentAnswered = (data: { questionIndex: number; answer: number }) => {




      
      setBattleState(prev => ({
        ...prev,
        opponentAnswers: {
          ...prev.opponentAnswers,
          [data.questionIndex]: data.answer // Store the specific answer
        }
      }));
      

    };

    // Match not found event
    const handleMatchNotFound = (data: { matchId: string }) => {

      setError('Match not found or has already ended. Please start a new match.');
    };

    // Pong event for connection testing
    const handlePong = () => {

    };
    const handleSessionCleanupComplete = (data: { 
      matchId: string; 
      userId: string; 
      success: boolean; 
      error?: string 
    }) => {

      if (data.success) {

      } else {

      }
    };
    // Attach listeners
    socket.on('match_started', handleMatchStarted);
    socket.on('next_question', handleNextQuestion);
    socket.on('match_ended', handleMatchEnded);
    socket.on('opponent_answered', handleOpponentAnswered);
    socket.on('match_not_found', handleMatchNotFound);
    socket.on('pong', handlePong);
    socket.on('session_cleanup_complete', handleSessionCleanupComplete);
    // Track attached listeners
    socketListenersRef.current.add('match_started');
    socketListenersRef.current.add('next_question');
    socketListenersRef.current.add('match_ended');
    socketListenersRef.current.add('opponent_answered');
    socketListenersRef.current.add('match_not_found');
    socketListenersRef.current.add('pong');
    socketListenersRef.current.add('session_cleanup_complete');
    // Request match status from server



    socket.emit('get_match_status', { matchId });

    
    // Test socket connection by sending a ping
    setTimeout(() => {

      socket.emit('ping');
    }, 1000);






  }, [socket, isConnected, matchId, cleanupSocketListeners]);

  // Battle useEffect
  useEffect(() => {





    
    if (!socket || !isConnected) {

      return;
    }

    setupSocketListeners();

    return () => {



      cleanupSocketListeners();
      
      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
    };
  }, [socket, isConnected, matchId, setupSocketListeners, cleanupSocketListeners]);

  // Victory animations effect - Must be at top level to avoid hook order issues
  useEffect(() => {
    if (battleState.status === 'finished') {
      const isWinner = battleState.player1Score > battleState.player2Score;
      
      if (isWinner) {
        // Sequential entrance animations
        Animated.sequence([
          // Trophy scale up
          Animated.spring(trophyScaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 6,
            useNativeDriver: true,
          }),
          // Celebration pulse
          Animated.timing(celebrationAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();

        // Continuous pulse animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();

        // Floating animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ).start();

        // Sparkle animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [battleState.status, battleState.player1Score, battleState.player2Score]);



  const startQuestionTimer = (timeLimit: number) => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    
    setBattleState(prev => ({ ...prev, timeLeft: timeLimit }));
    
    // Play question start sound when timer actually starts
    SoundManager.playQuestionStartSound();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    questionTimerRef.current = setInterval(() => {
      setBattleState(prev => {
        if (prev.timeLeft <= 1) {
          // Time's up, auto-submit if not answered
          if (!prev.answers[prev.currentQuestion]) {
            handleAnswer(-1); // -1 means no answer
          }
          return prev;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  };

  const handleAnswer = (answerIndex: number) => {
    if (!socket || !isConnected) {

      return;
    }
    
    const questionIndex = battleState.currentQuestion;
    const timeSpent = 10 - battleState.timeLeft;
    




    
    // Play answer sound
    SoundManager.playAnswerSound();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Record answer locally
    setBattleState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionIndex]: answerIndex
      }
    }));
    
    // Send answer to server - FIXED: Use correct parameter names
    const answerData = {
      matchId,
      questionIndex,
      userId: user?.id,
      answer: answerIndex, // FIXED: Changed from 'answer' to 'answerIndex'
      timeSpent
    };
    

    socket.emit('answer_question', answerData);

    
    // Clear timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
  };

  const getAnswerStatus = (questionIndex: number) => {
    if (battleState.answers[questionIndex] !== undefined) {
      return 'answered';
    }
    // Don't show opponent-answered status until user has also answered
    return 'pending';
  };

  const getAnswerStyle = (questionIndex: number) => {
    const status = getAnswerStatus(questionIndex);
    switch (status) {
      case 'answered':
        return { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981' };
      case 'opponent-answered':
        return { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b' };
      default:
        return { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)' };
    }
  };

  if (error) {
    return (
      <LinearGradient 
        colors={["#6C63FF", "#FF6CAB", "#FFD452"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Ionicons name="close-circle" size={80} color="#fff" style={styles.errorIcon} />
          <Text style={styles.errorTitle}>Battle Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <LinearGradient
              colors={["#6C63FF", "#7366FF"]}
              style={styles.errorButtonGradient}
            >
              <Text style={styles.errorButtonText}>Back to Battle Quiz</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (battleState.status === 'preparing') {
    return (
      <LinearGradient 
        colors={["#6C63FF", "#FF6CAB", "#FFD452"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.preparingContainer}>
          <View style={styles.loadingSpinner}>
            <Animated.View
              style={[
                styles.spinner,
                {
                  transform: [{
                    rotate: new Animated.Value(0).interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }
              ]}
            />
          </View>
          <Text style={styles.preparingTitle}>Preparing Battle</Text>
          <Text style={styles.preparingSubtitle}>Setting up your match...</Text>
          <Text style={styles.reactNativeIndicator}>React Native Mode</Text>
        </View>
      </LinearGradient>
    );
  }

  if (battleState.status === 'finished') {
    const isWinner = battleState.player1Score > battleState.player2Score;
    const isDraw = battleState.player1Score === battleState.player2Score;
    


    if (isWinner) {

      return (
        <LinearGradient 
          colors={["#FFD700", "#FF6B35", "#FF1744", "#9C27B0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          {/* Confetti Background */}
          <View style={styles.confettiContainer}>
            {[...Array(20)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.confetti,
                  {
                    left: `${Math.random() * 100}%`,
                    backgroundColor: ['#FFD452', '#FF6CAB', '#6C63FF', '#7366FF', '#EA4335'][Math.floor(Math.random() * 5)],
                    transform: [{
                      translateY: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -300 - Math.random() * 200],
                      })
                    }, {
                      rotate: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', `${360 + Math.random() * 360}deg`],
                      })
                    }],
                    opacity: confettiAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1, 0],
                    })
                  }
                ]}
              />
            ))}
          </View>

          {/* Enhanced Sparkle Background */}
          <View style={styles.sparkleBackground}>
            {[...Array(15)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.sparkle,
                  {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    transform: [{
                      scale: sparkleAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 1.2, 0.3],
                      })
                    }, {
                      rotate: sparkleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }],
                    opacity: sparkleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.4, 1, 0.4],
                    })
                  }
                ]}
              >
                <Text style={styles.sparkleText}>✨</Text>
              </Animated.View>
            ))}
          </View>

          <View style={styles.victoryContainer}>
            {/* Enhanced Trophy Animation */}
            <Animated.View
              style={[
                styles.trophyContainer,
                {
                  transform: [
                    { scale: trophyScaleAnim },
                    { scale: pulseAnim },
                    { 
                      translateY: floatAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      })
                    }
                  ]
                }
              ]}
            >
              <LinearGradient
                colors={["#FFD700", "#FF8C00", "#FF6B35"]}
                style={styles.trophyGradient}
              >
                <Ionicons name="trophy" size={80} color="#fff" />
                {/* Trophy glow effect */}
                <View style={styles.trophyGlow} />
              </LinearGradient>
              
              {/* Crown above trophy */}
              <Animated.View 
                style={[
                  styles.crownContainer,
                  {
                    transform: [{
                      rotate: celebrationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-10deg', '10deg'],
                      })
                    }]
                  }
                ]}
              >
                <Text style={styles.crownEmoji}>👑</Text>
              </Animated.View>
            </Animated.View>

            {/* Enhanced Victory Text */}
            <Animated.View
              style={[
                styles.victoryTextContainer,
                {
                  transform: [
                    { scale: celebrationAnim },
                    { 
                      translateY: floatAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5],
                      })
                    }
                  ]
                }
              ]}
            >
              <Animated.Text 
                style={[
                  styles.victoryTitle,
                  {
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              >
                🏆 CHAMPION! 🏆
              </Animated.Text>
              <Text style={styles.victorySubtitle}>🎊 SPECTACULAR VICTORY! 🎊</Text>
              <Text style={styles.victoryMotivation}>You're on fire! 🔥 Keep dominating!</Text>
            </Animated.View>

            {/* Score Display */}
            <View style={styles.victoryScoreContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.12)']}
                style={styles.victoryScoreGradient}
              >
                <Text style={styles.victoryScoreLabel}>Your Score</Text>
                <Animated.Text
                  style={[
                    styles.victoryScoreValue,
                    {
                      opacity: scoreAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      })
                    }
                  ]}
                >
                  {battleState.player1Score}
                </Animated.Text>
                <Text style={styles.victoryScoreLabel}>Opponent Score</Text>
                <Text style={styles.victoryScoreValue}>{battleState.player2Score}</Text>
              </LinearGradient>
            </View>

            {/* Enhanced Action Buttons */}
            <View style={styles.victoryButtonsContainer}>
              <TouchableOpacity 
                style={styles.victoryButton}
                onPress={() => router.back()}
              >
                <LinearGradient
                  colors={["#4CAF50", "#45A049", "#2E7D32"]}
                  style={styles.victoryButtonGradient}
                >
                  <Ionicons name="refresh" size={22} color="#fff" />
                  <Text style={styles.victoryButtonText}>Play Again</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.victoryButton}
                onPress={() => {

                }}
              >
                <LinearGradient
                  colors={["#FF9800", "#FF6F00", "#E65100"]}
                  style={styles.victoryButtonGradient}
                >
                  <Ionicons name="share-social" size={22} color="#fff" />
                  <Text style={styles.victoryButtonText}>Share Victory</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Firecrackers - Now on top of everything */}
          <View style={styles.firecrackersContainer}>
            {/* Firecracker 1 - Shooting up from bottom */}
            <Animated.View
              style={[
                styles.firecracker,
                {
                  left: '20%',
                  transform: [{
                    translateY: firecrackerAnim1.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [height, height * 0.3, height * 0.2],
                    })
                  }, {
                    scale: firecrackerAnim1.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [0.5, 1, 1.5],
                    })
                  }],
                  opacity: firecrackerAnim1.interpolate({
                    inputRange: [0, 0.5, 0.7, 1],
                    outputRange: [0, 1, 1, 0],
                  })
                }
              ]}
            >
              {/* Firecracker trail */}
              <View style={styles.firecrackerTrail} />
              
              {/* Explosion at top */}
              <View style={styles.firecrackerExplosion}>
                {[...Array(12)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.firecrackerSpark,
                      {
                        backgroundColor: ['#FFD452', '#FF6CAB', '#6C63FF', '#EA4335'][i % 4],
                        transform: [{
                          translateX: firecrackerAnim1.interpolate({
                            inputRange: [0.7, 1],
                            outputRange: [0, 30 + Math.random() * 40],
                          })
                        }, {
                          translateY: firecrackerAnim1.interpolate({
                            inputRange: [0.7, 1],
                            outputRange: [0, -20 - Math.random() * 30],
                          })
                        }, {
                          rotate: firecrackerAnim1.interpolate({
                            inputRange: [0.7, 1],
                            outputRange: ['0deg', `${360 + Math.random() * 360}deg`],
                          })
                        }],
                        opacity: firecrackerAnim1.interpolate({
                          inputRange: [0.7, 1],
                          outputRange: [0, 1],
                        })
                      }
                    ]}
                  />
                ))}
              </View>
            </Animated.View>

            {/* Firecracker 2 - Shooting up from bottom */}
            <Animated.View
              style={[
                styles.firecracker,
                {
                  left: '60%',
                  transform: [{
                    translateY: firecrackerAnim2.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [height, height * 0.4, height * 0.3],
                    })
                  }, {
                    scale: firecrackerAnim2.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [0.5, 1, 1.5],
                    })
                  }],
                  opacity: firecrackerAnim2.interpolate({
                    inputRange: [0, 0.5, 0.7, 1],
                    outputRange: [0, 1, 1, 0],
                  })
                }
              ]}
            >
              {/* Firecracker trail */}
              <View style={styles.firecrackerTrail} />
              
              {/* Explosion at top */}
              <View style={styles.firecrackerExplosion}>
                {[...Array(12)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.firecrackerSpark,
                      {
                        backgroundColor: ['#6C63FF', '#FF6CAB', '#FFD452', '#EA4335'][i % 4],
                        transform: [{
                          translateX: firecrackerAnim2.interpolate({
                            inputRange: [0.7, 1],
                            outputRange: [0, 30 + Math.random() * 40],
                          })
                        }, {
                          translateY: firecrackerAnim2.interpolate({
                            inputRange: [0.7, 1],
                            outputRange: [0, -20 - Math.random() * 30],
                          })
                        }, {
                          rotate: firecrackerAnim2.interpolate({
                            inputRange: [0.7, 1],
                            outputRange: ['0deg', `${360 + Math.random() * 360}deg`],
                          })
                        }],
                        opacity: firecrackerAnim2.interpolate({
                          inputRange: [0.7, 1],
                          outputRange: [0, 1],
                        })
                      }
                    ]}
                  />
                ))}
              </View>
            </Animated.View>

            {/* Firecracker 3 - Shooting up from bottom */}
            <Animated.View
              style={[
                styles.firecracker,
                {
                  left: '40%',
                  transform: [{
                    translateY: firecrackerAnim3.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [height, height * 0.25, height * 0.15],
                    })
                  }, {
                    scale: firecrackerAnim3.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [0.5, 1, 1.5],
                    })
                  }],
                  opacity: firecrackerAnim3.interpolate({
                    inputRange: [0, 0.5, 0.7, 1],
                    outputRange: [0, 1, 1, 0],
                  })
                }
              ]}
            >
              {/* Firecracker trail */}
              <View style={styles.firecrackerTrail} />
              
              {/* Explosion at top */}
              <View style={styles.firecrackerExplosion}>
                {[...Array(12)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.firecrackerSpark,
                      {
                        backgroundColor: ['#FFD452', '#6C63FF', '#FF6CAB', '#EA4335'][i % 4],
                        transform: [{
                          translateX: firecrackerAnim3.interpolate({
                            inputRange: [0.7, 1],
                            outputRange: [0, 30 + Math.random() * 40],
                          })
                        }, {
                          translateY: firecrackerAnim3.interpolate({
                            inputRange: [0.7, 1],
                            outputRange: [0, -20 - Math.random() * 30],
                          })
                        }, {
                          rotate: firecrackerAnim3.interpolate({
                            inputRange: [0.7, 1],
                            outputRange: ['0deg', `${360 + Math.random() * 360}deg`],
                          })
                        }],
                        opacity: firecrackerAnim3.interpolate({
                          inputRange: [0.7, 1],
                          outputRange: [0, 1],
                        })
                      }
                    ]}
                  />
                ))}
              </View>
            </Animated.View>
          </View>
        </LinearGradient>
      );
    }

    // Draw or Defeat screen
    return (
      <LinearGradient 
        colors={isDraw ? ["#4F46E5", "#7C3AED", "#8B5CF6"] : ["#FF6B6B", "#FF8E53", "#FF6B35"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Tears Animation for Defeat */}
        {!isDraw && (
          <View style={styles.tearsContainer}>
            {[...Array(5)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.tear,
                  {
                    left: `${20 + i * 15}%`,
                    transform: [{
                      translateY: tearAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200 + Math.random() * 100],
                      })
                    }],
                    opacity: tearAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1, 0],
                    })
                  }
                ]}
              />
            ))}
          </View>
        )}

        <View style={styles.finishedContainer}>
          <Animated.View
            style={[
              styles.resultIcon,
              {
                transform: [{
                  translateX: defeatAnim.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: [0, -10, 10, -10, 0],
                  })
                }]
              }
            ]}
          >
            <LinearGradient
              colors={isDraw ? ["#6C63FF", "#7366FF"] : ["#FF6CAB", "#EA4335"]}
              style={styles.resultIconGradient}
            >
              <Ionicons 
                name={isDraw ? "flag" : "close-circle"} 
                size={60} 
                color="#fff" 
              />
            </LinearGradient>
          </Animated.View>
          
          <Text style={styles.resultTitle}>
            {isDraw ? '🤝 Draw!' : '💪 Better Luck Next Time!'}
          </Text>
          
          <View style={styles.finalScores}>
            <View style={styles.scoreRow}>
              <Text style={styles.finalScoreLabel}>You:</Text>
              <Text style={styles.finalScoreValue}>{battleState.player1Score} pts</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.finalScoreLabel}>Opponent:</Text>
              <Text style={styles.finalScoreValue}>{battleState.player2Score} pts</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <LinearGradient
              colors={["#6C63FF", "#7366FF"]}
              style={styles.backButtonGradient}
            >
              <Text style={styles.backButtonText}>Back to Battle Quiz</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient 
      colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Animated Background Elements */}
      <View style={styles.backgroundContainer}>
        {/* Floating Particles */}
        <Animated.View 
          style={[
            styles.floatingParticle1,
            {
              transform: [{
                translateY: new Animated.Value(0).interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -100]
                })
              }],
              opacity: new Animated.Value(0).interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0]
              })
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingParticle2,
            {
              transform: [{
                translateY: new Animated.Value(0).interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -80]
                })
              }],
              opacity: new Animated.Value(0).interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0]
              })
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingParticle3,
            {
              transform: [{
                translateY: new Animated.Value(0).interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -120]
                })
              }],
              opacity: new Animated.Value(0).interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0]
              })
            }
          ]}
        />
        
        {/* Glowing Orbs */}
        <Animated.View 
          style={[
            styles.glowOrb1,
            {
              transform: [{ scale: new Animated.Value(1) }],
              opacity: new Animated.Value(0).interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8]
              })
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.glowOrb2,
            {
              transform: [{ scale: new Animated.Value(1) }],
              opacity: new Animated.Value(0).interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.6]
              })
            }
          ]}
        />
        
        {/* Animated Waves */}
        <Animated.View 
          style={[
            styles.animatedWave1,
            {
              transform: [{
                scale: new Animated.Value(0).interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.5]
                })
              }],
              opacity: new Animated.Value(0).interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.4, 0.8, 0.2]
              })
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.animatedWave2,
            {
              transform: [{
                scale: new Animated.Value(0).interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.2, 1.8]
                })
              }],
              opacity: new Animated.Value(0).interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 0.6, 0.1]
              })
            }
          ]}
        />
      </View>

      <View style={styles.content}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
              style={styles.headerBackGradient}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>⚔️ Battle Arena</Text>
            <Text style={styles.headerSubtitle}>Question {battleState.currentQuestion + 1} of {battleState.totalQuestions}</Text>
          </View>
        </View>

        {/* Enhanced Score Board */}
        <View style={styles.scoreBoard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
            style={styles.scoreBoardGradient}
          >
            <View style={styles.scoreContainer}>
              <View style={styles.playerAvatar}>
                <LinearGradient
                  colors={["#FF6B6B", "#FF8E53"]}
                  style={styles.avatarGradient}
                >
                  <Ionicons name="person" size={20} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.scoreLabel}>You</Text>
              <Text style={styles.scoreValue}>{battleState.player1Score}</Text>
            </View>
            
            <View style={styles.vsContainer}>
              <LinearGradient
                colors={["#FF6B6B", "#FF8E53", "#FFD93D"]}
                style={styles.vsGradient}
              >
                <Text style={styles.vsText}>⚔️ VS</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.scoreContainer}>
              <View style={styles.playerAvatar}>
                <LinearGradient
                  colors={["#4ECDC4", "#44A08D"]}
                  style={styles.avatarGradient}
                >
                  <Ionicons name="person" size={20} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.scoreLabel}>Opponent</Text>
              <Text style={styles.scoreValue}>{battleState.player2Score}</Text>
            </View>
            
            <View style={styles.timerContainer}>
              <LinearGradient
                colors={battleState.timeLeft <= 5 ? ["#FF6B6B", "#FF5252"] : ["#4F46E5", "#7C3AED"]}
                style={styles.timerGradient}
              >
                <Ionicons name="time" size={18} color="#fff" />
                <Text style={styles.timerText}>
                  {battleState.timeLeft}s
                </Text>
              </LinearGradient>
            </View>
          </LinearGradient>
        </View>

        {/* Enhanced Progress Dots */}
        <View style={styles.progressContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
            style={styles.progressGradient}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.progressRow}>
                {Array.from({ length: battleState.totalQuestions }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.progressDot,
                      getAnswerStyle(i)
                    ]}
                  >
                    <LinearGradient
                      colors={
                        getAnswerStatus(i) === 'answered' 
                          ? ["#4F46E5", "#7C3AED"]
                          : getAnswerStatus(i) === 'opponent-answered'
                          ? ["#FF6B6B", "#FF5252"]
                          : ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']
                      }
                      style={styles.progressDotGradient}
                    >
                      <Text style={styles.progressText}>{i + 1}</Text>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </ScrollView>
          </LinearGradient>
        </View>

        {/* Enhanced Question Container */}
        {battleState.question && (
          <View style={styles.questionContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
              style={styles.questionGradient}
            >
              <View style={styles.questionHeader}>
                <LinearGradient
                  colors={["#FF6B6B", "#FF8E53"]}
                  style={styles.questionIconGradient}
                >
                  <Ionicons name="help-circle" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.questionNumber}>Question {battleState.currentQuestion + 1}</Text>
              </View>
              
              <Text style={styles.questionText}>
                {battleState.question.text}
              </Text>
            
            <View style={styles.optionsContainer}>
              {/* {battleState.question.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAnswer(index)}
                  disabled={battleState.answers[battleState.currentQuestion] !== undefined}
                  style={[
                    styles.optionButton,
                    battleState.answers[battleState.currentQuestion] === index && styles.selectedOption
                  ]}
                >
                  <LinearGradient
                    colors={
                      battleState.answers[battleState.currentQuestion] === index
                          ? ["#6C63FF", "#7366FF"]
                          : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.7)']
                    }
                    style={styles.optionButtonGradient}
                    >
                      <View style={styles.optionContent}>
                        <View style={styles.optionNumber}>
                          <LinearGradient
                            colors={
                              battleState.answers[battleState.currentQuestion] === index
                                ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']
                                : ['rgba(108, 99, 255, 0.2)', 'rgba(255, 108, 171, 0.1)']
                            }
                            style={styles.optionNumberGradient}
                          >
                            <Text style={[
                              styles.optionNumberText,
                              battleState.answers[battleState.currentQuestion] === index && styles.selectedOptionNumberText
                            ]}>
                              {String.fromCharCode(65 + index)}
                            </Text>
                          </LinearGradient>
                        </View>
                    <Text style={[
                      styles.optionText,
                      battleState.answers[battleState.currentQuestion] === index && styles.selectedOptionText
                    ]}>
                      {option}
                    </Text>
                      </View>
                    {battleState.answers[battleState.currentQuestion] === index && (
                        <View style={styles.checkmarkContainer}>
                          <LinearGradient
                            colors={["#6C63FF", "#7366FF"]}
                            style={styles.checkmarkGradient}
                          >
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          </LinearGradient>
                        </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))} */}

{battleState.question.options.map((option, index) => (
  <TouchableOpacity
    key={index}
    onPress={() => handleAnswer(index)}
    disabled={battleState.answers[battleState.currentQuestion] !== undefined}
    style={[
      styles.optionButton,
      battleState.answers[battleState.currentQuestion] === index && styles.selectedOption
    ]}
  >
    <LinearGradient
      colors={
        battleState.answers[battleState.currentQuestion] === index
          ? ["#4F46E5", "#7C3AED"]
          : battleState.opponentAnswers[battleState.currentQuestion] === index &&
            battleState.answers[battleState.currentQuestion] !== undefined
          ? ["#FF6B6B", "#FF5252"]
          : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']
      }
      style={styles.optionButtonGradient}
    >
      <View style={styles.optionContent}>
        <View style={styles.optionNumber}>
          <LinearGradient
            colors={
              battleState.answers[battleState.currentQuestion] === index
                ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']
                : ['rgba(79, 70, 229, 0.2)', 'rgba(124, 58, 237, 0.1)']
            }
            style={styles.optionNumberGradient}
          >
            <Text style={[
              styles.optionNumberText,
              battleState.answers[battleState.currentQuestion] === index && styles.selectedOptionNumberText
            ]}>
              {String.fromCharCode(65 + index)}
            </Text>
          </LinearGradient>
        </View>
        <Text style={[
          styles.optionText,
          battleState.answers[battleState.currentQuestion] === index && styles.selectedOptionText
        ]}>
          {option}
        </Text>
        
        {/* Answer indicators */}
        {battleState.answers[battleState.currentQuestion] === index && (
          <View style={styles.answerIndicator}>
            <Text style={styles.answerIndicatorText}>You</Text>
          </View>
        )}
        
        {battleState.opponentAnswers[battleState.currentQuestion] === index && 
         battleState.answers[battleState.currentQuestion] !== undefined && (
          <View style={[styles.answerIndicator, styles.opponentIndicator]}>
            <Text style={styles.answerIndicatorText}>Opponent</Text>
          </View>
        )}
        
        {battleState.answers[battleState.currentQuestion] === index && (
          <View style={styles.checkmarkContainer}>
            <LinearGradient
              colors={["#4F46E5", "#7C3AED"]}
              style={styles.checkmarkGradient}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
            </LinearGradient>
          </View>
        )}
      </View>
    </LinearGradient>
  </TouchableOpacity>
))}
            </View>
            </LinearGradient>
          </View>
          
        )}
      </View>
      {/* Enhanced Status Container */}
      <View style={styles.statusContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
          style={styles.statusGradient}
        >
          <Text style={styles.statusText}>
            {battleState.answers[battleState.currentQuestion] !== undefined && 
             battleState.opponentAnswers[battleState.currentQuestion] !== undefined ? (
              "🎯 Both players answered! Next question loading..."
            ) : battleState.answers[battleState.currentQuestion] !== undefined ? (
              "⏳ Waiting for opponent to answer..."
            ) : (
              `⏰ Time remaining: ${battleState.timeLeft}s`
            )}
          </Text>
        </LinearGradient>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  statusGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerBackGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  scoreBoard: {
    marginBottom: 12,
  },
  scoreBoardGradient: {
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
    borderColor: 'rgba(255,255,255,0.25)',
  },
  scoreContainer: {
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
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
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#fff',
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 20,
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
  },
  timerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
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
  progressContainer: {
    marginBottom: 12,
  },
  progressGradient: {
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  progressDotGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  questionContainer: {
    flex: 1,
  },
  questionGradient: {
    borderRadius: 16,
    padding: 16,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionIconGradient: {
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  optionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  answerIndicator: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  opponentIndicator: {
    backgroundColor: '#FF6B6B',
  },
  answerIndicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectedOption: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '700',
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionNumberGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  selectedOptionNumberText: {
    color: '#fff',
    fontWeight: '900',
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkmarkGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
    textAlign: 'center',
  },
  errorButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  errorButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  preparingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
  },
  preparingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  preparingSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  reactNativeIndicator: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  resultIcon: {
    marginBottom: 20,
  },
  resultIconGradient: {
    borderRadius: 30,
    padding: 15,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  finalScores: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  finalScoreLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  finalScoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  backButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  victoryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  trophyContainer: {
    marginBottom: 20,
  },
  trophyGradient: {
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  victoryTextContainer: {
    marginBottom: 30,
  },
  victoryTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 12,
    letterSpacing: 2,
    marginBottom: 8,
  },
  victorySubtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  victoryScoreContainer: {
    marginBottom: 30,
  },
  victoryScoreGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  victoryScoreLabel: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
    fontWeight: '600',
  },
  victoryScoreValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  victoryButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 350,
  },
  victoryButton: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  victoryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  victoryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  firecrackersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  firecracker: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  firecrackerTrail: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
  },
  firecrackerExplosion: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  firecrackerSpark: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tearsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    backgroundColor: 'transparent',
  },
  tear: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  // Enhanced Background Animation Styles
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  floatingParticle1: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    top: '20%',
    left: '15%',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingParticle2: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    top: '60%',
    right: '20%',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  floatingParticle3: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    top: '40%',
    left: '70%',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 5,
  },
  glowOrb1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: '10%',
    right: '10%',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  glowOrb2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: '20%',
    left: '10%',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  animatedWave1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  animatedWave2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.03)',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -150 }],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  // Enhanced Trophy Styles
  trophyContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  trophyGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  // Enhanced Result Styles
  resultTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 1.5,
    marginBottom: 24,
  },
  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  resultIcon: {
    marginBottom: 30,
  },
  resultIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Enhanced Final Scores
  finalScores: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  finalScoreLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
  },
  finalScoreValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // Enhanced Back Button
  backButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  backButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Enhanced Victory Styles
  sparkleBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  sparkle: {
    position: 'absolute',
    zIndex: 2,
  },
  sparkleText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  trophyGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  crownContainer: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    zIndex: 3,
  },
  crownEmoji: {
    fontSize: 32,
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  victoryMotivation: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
    marginTop: 8,
  },
});

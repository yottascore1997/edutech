import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface QuestionData {
  id: string;
  question: string;
  options: string[];
  correct: number;
  timeLimit: number;
  isActive: boolean;
  hasAttempted: boolean;
  selectedOption?: number; // User's selected option
  isCorrect?: boolean; // Whether user's answer was correct
  correctAnswer?: number; // Alternative field for correct answer
}

interface QuestionOfTheDayProps {
  onTimerRender?: (timerElement: React.ReactNode) => void;
}

const QuestionOfTheDay = ({ onTimerRender }: QuestionOfTheDayProps = {}) => {
  const { user } = useAuth();
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const tickSoundRef = useRef<Audio.Sound | null>(null);
  const [tickReady, setTickReady] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  useEffect(() => {
    if (user?.token) {
      fetchQuestionOfTheDay();
    }
  }, [user?.token]);

  useEffect(() => {
    if (questionData) {
      console.log('Setting timer to:', questionData.timeLimit);
      setTimeLeft(questionData.timeLimit);
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [questionData]);

  // Prepare audio for ticking (optional sound)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: 1,
          shouldDuckAndroid: true,
          interruptionModeAndroid: 1,
          playThroughEarpieceAndroid: false,
        });
        // Try primary clock tick sound, fallback to alternative if it fails
        let sound: Audio.Sound | null = null;
        try {
          const created = await Audio.Sound.createAsync(
            { uri: 'https://assets.mixkit.co/sfx/preview/mixkit-clock-tick-1051.mp3' },
            { volume: 1.0, shouldPlay: false, isLooping: false }
          );
          sound = created.sound;
        } catch (e) {
          console.log('Primary tick sound failed, trying fallback...', e);
          const fallback = await Audio.Sound.createAsync(
            { uri: 'https://assets.mixkit.co/sfx/preview/mixkit-mechanical-click-1120.mp3' },
            { volume: 1.0, shouldPlay: false, isLooping: false }
          );
          sound = fallback.sound;
        }
        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }
        tickSoundRef.current = sound;
        setTickReady(true);
      } catch (e) {
        console.log('Tick sound load failed:', e);
      }
    })();
    return () => {
      isMounted = false;
      if (tickSoundRef.current) {
        tickSoundRef.current.unloadAsync().catch(() => {});
        tickSoundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log('Timer effect - timeLeft:', timeLeft, 'isAnswered:', isAnswered, 'hasAttempted:', questionData?.hasAttempted);
    if (timeLeft > 0 && !isAnswered && !questionData?.hasAttempted) {
      const timer = setTimeout(() => {
        console.log('Timer tick - new timeLeft:', timeLeft - 1);
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isAnswered, questionData?.hasAttempted]);

  // Play tick on each decrement
  useEffect(() => {
    if (!tickReady) return;
    if (timeLeft > 0 && !isAnswered && !questionData?.hasAttempted) {
      // Fire tick sound (no overlap)
      (async () => {
        try {
          const s = tickSoundRef.current;
          if (!s) return;
          await s.replayAsync();
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [timeLeft, isAnswered, questionData?.hasAttempted, tickReady]);

  const fetchQuestionOfTheDay = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiFetchAuth('/student/question-of-the-day', user.token);
      
      if (response.ok) {
        setQuestionData(response.data);
        
        // Simple logic: if already attempted, show result; if not, allow answering
        if (response.data.hasAttempted) {
          // Show previous attempt result
          setSelectedOption(response.data.selectedOption || null);
          setIsAnswered(true);
          setShowResult(true);
          setTimeLeft(0);
        } else {
          // Allow answering - reset all states
          setSelectedOption(null);
          setIsAnswered(false);
          setShowResult(false);
        }
      }
    } catch (error) {
      console.error('Error fetching question of the day:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = async (optionIndex: number) => {
    // Only allow selection if question hasn't been attempted
    if (questionData?.hasAttempted) {
      return;
    }
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    // Submit answer to API
    try {
      const response = await apiFetchAuth('/student/question-of-the-day', user?.token || '', {
        method: 'POST',
        body: {
          questionId: questionData?.id,
          selectedOption: optionIndex,
        },
      });
      
      // After successful submission, fetch updated question data
      if (response.ok) {
        console.log('Answer submitted successfully, fetching updated data...');
        await fetchQuestionOfTheDay(); // Refresh the data
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
    
    // Show result immediately
    setShowResult(true);
  };

  const handleTimeout = () => {
    console.log('Time up!');
    setIsAnswered(true);
    setShowResult(true);
  };

  const handleRefresh = () => {
    console.log('Refreshing question...');
    setSelectedOption(null);
    setIsAnswered(false);
    setShowResult(false);
    setTimeLeft(0);
    fetchQuestionOfTheDay();
  };

  const getOptionStyle = (index: number) => {
    // If question hasn't been attempted yet, show normal selection state
    if (!questionData?.hasAttempted) {
      return [
        styles.optionButton,
        selectedOption === index && styles.selectedOption,
      ];
    }

    // For attempted questions, show correct/incorrect indicators
    if (index === (questionData?.correct || 0)) {
      return [styles.optionButton, styles.correctOption];
    } else if ((questionData?.selectedOption || 0) === index && index !== (questionData?.correct || 0)) {
      return [styles.optionButton, styles.incorrectOption];
    }
    
    return [styles.optionButton, styles.disabledOption];
  };

  const getOptionTextStyle = (index: number) => {
    // If question hasn't been attempted yet, show normal selection state
    if (!questionData?.hasAttempted) {
      return [
        styles.optionText,
        selectedOption === index && styles.selectedOptionText,
      ];
    }

    // For attempted questions, show correct/incorrect indicators
    if (index === (questionData?.correct || 0)) {
      return [styles.optionText, styles.correctOptionText];
    } else if ((questionData?.selectedOption || 0) === index && index !== (questionData?.correct || 0)) {
      return [styles.optionText, styles.incorrectOptionText];
    }
    
    return [styles.optionText, styles.disabledOptionText];
  };

  const getOptionIcon = (index: number) => {
    // Only show icons for attempted questions
    if (!questionData?.hasAttempted) return null;
    
    if (index === (questionData?.correct || 0)) {
      return <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />;
    } else if ((questionData?.selectedOption || 0) === index && index !== (questionData?.correct || 0)) {
      return <Ionicons name="close-circle" size={24} color="#F44336" />;
    }
    return null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Create timer element
  const timerElement = questionData && !questionData.hasAttempted ? (
    <View style={styles.timerCard}>
      <Ionicons name="time" size={16} color={timeLeft < 30 ? "#F44336" : "#4F46E5"} />
      <Text style={[styles.timerText, timeLeft < 30 && styles.timerWarning]}>
        {formatTime(timeLeft)}
      </Text>
    </View>
  ) : questionData?.hasAttempted ? (
    <View style={styles.completedCard}>
      <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
      <Text style={styles.completedText}>Done</Text>
    </View>
  ) : null;

  // Pass timer to parent if callback provided
  useEffect(() => {
    if (onTimerRender && questionData) {
      onTimerRender(timerElement);
    }
  }, [timeLeft, questionData, onTimerRender]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a08efe" />
        <Text style={styles.loadingText}>Loading today's question...</Text>
      </View>
    );
  }

  if (!questionData) {
    return (
      <View style={styles.noQuestionContainer}>
        <Ionicons name="help-circle-outline" size={64} color="#a08efe" />
        <Text style={styles.noQuestionText}>No Question Available</Text>
        <Text style={styles.noQuestionSubtext}>Check back tomorrow for a new question!</Text>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}
    >
      {/* Question Container */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{questionData.question}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {questionData.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={getOptionStyle(index)}
            onPress={() => handleOptionSelect(index)}
            disabled={questionData.hasAttempted}
            activeOpacity={0.8}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionNumber}>
                <Text style={styles.optionNumberText}>{String.fromCharCode(65 + index)}</Text>
              </View>
              <Text style={getOptionTextStyle(index)}>
                {option}
              </Text>
              {getOptionIcon(index)}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Result Section */}
      {showResult && (
        <Animated.View 
          style={[styles.resultContainer]}
        >
          <View style={styles.resultContent}>
            {questionData?.isCorrect ? (
              <>
                {/* Victory Celebration */}
                <View style={styles.victoryContainer}>
                  <View style={styles.victoryIconContainer}>
                    <Ionicons name="trophy" size={48} color="#FFD700" />
                  </View>
                  <Text style={[styles.resultTitle, { color: '#4CAF50' }]}>🎉 Correct! 🎉</Text>
                  <Text style={styles.resultSubtext}>Excellent! You got it right!</Text>
                  <View style={styles.celebrationContainer}>
                    <Text style={styles.celebrationText}>🏆 Great Job! 🏆</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Wrong Answer Result */}
                <View style={styles.wrongAnswerContainer}>
                  <View style={styles.resultIconContainer}>
                    <Ionicons name="close-circle" size={48} color="#F44336" />
                  </View>
                  <Text style={[styles.resultTitle, { color: '#F44336' }]}>Incorrect!</Text>
                  <Text style={styles.resultSubtext}>
                    Your answer: <Text style={styles.userAnswerText}>
                      {questionData.options[questionData.selectedOption || 0]}
                    </Text>
                  </Text>
                  <Text style={styles.correctAnswerText}>
                    Correct answer: <Text style={styles.correctAnswerHighlight}>
                      {questionData.options[questionData.correct || 0]}
                    </Text>
                  </Text>
                </View>
              </>
            )}
            
            {/* Show "Already Attempted" message if previously answered */}
            {questionData?.hasAttempted && (
              <View style={styles.attemptedMessageContainer}>
                <Text style={styles.attemptedMessage}>
                  You have already attempted this question today
                </Text>
                <Text style={styles.attemptedSubtext}>
                  Come back tomorrow for a new question!
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  noQuestionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noQuestionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  noQuestionSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(160, 142, 254, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerText: {
    fontSize: 12, // Very small font size
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 4, // Minimal margin
  },
  timerWarning: {
    color: '#F44336',
  },
  questionContainer: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 80,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  correctOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  incorrectOption: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: '#F44336',
  },
  disabledOption: {
    backgroundColor: '#fff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  selectedOptionText: {
    color: '#a08efe',
    fontWeight: '600',
  },
  correctOptionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  incorrectOptionText: {
    color: '#F44336',
    fontWeight: '600',
  },
  disabledOptionText: {
    color: '#999',
    fontWeight: '400',
  },
  resultContainer: {
    marginTop: 24,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resultContent: {
    alignItems: 'center',
  },
  resultIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  resultSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  questionTextWrapper: {
    flex: 1,
  },
  timerCard: {
    backgroundColor: '#FFFFFF', // White background
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)', // Light purple border
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionNumber: {
    backgroundColor: 'rgba(160, 142, 254, 0.2)',
    borderRadius: 10,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  optionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#a08efe',
  },
  victoryContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  victoryIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
  },
  celebrationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  celebrationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  wrongAnswerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userAnswerText: {
    fontWeight: 'bold',
    color: '#F44336',
  },
  correctAnswerText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  correctAnswerHighlight: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  attemptedMessageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  attemptedMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    textAlign: 'center',
  },
  attemptedSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)', // Light green border
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  completedSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  debugContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

export default QuestionOfTheDay; 
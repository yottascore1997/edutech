import { WEBSOCKET_CONFIG } from '@/constants/websocket';
import { useAuth } from '@/context/AuthContext';
import { SoundManager } from '@/utils/sounds';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { io, Socket } from 'socket.io-client';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  name: string;
  profilePhoto?: string;
  level: number;
}

interface MatchmakingState {
  status: 'searching' | 'found' | 'starting' | 'error';
  timeElapsed: number;
  opponent?: User;
  category?: string;
  estimatedWait: number;
}

export default function MatchmakingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [matchmakingState, setMatchmakingState] = useState<MatchmakingState>({
    status: 'searching',
    timeElapsed: 0,
    estimatedWait: 30
  });
  
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  // Countdown state
  const [countdown, setCountdown] = useState(3);
  
  // Enhanced Animation values
  const [pulseAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [searchAnim] = useState(new Animated.Value(0));
  const [glowAnim] = useState(new Animated.Value(0));
  const [waveAnim] = useState(new Animated.Value(0));
  const [particleAnim1] = useState(new Animated.Value(0));
  const [particleAnim2] = useState(new Animated.Value(0));
  const [particleAnim3] = useState(new Animated.Value(0));
  const [radarAnim] = useState(new Animated.Value(0));
  const [scanAnim] = useState(new Animated.Value(0));
  const [gradientAnim] = useState(new Animated.Value(0));
  
  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchStartTime = useRef<number>(Date.now());
  const hasStartedSearch = useRef(false);
  const matchStartRetriesRef = useRef<number>(0);
  const pendingRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const category = params.category as string;
  const mode = params.mode as string;
  const amount = params.amount as string;
  const navigation = useNavigation();

  // Reset matchmaking state when screen gains focus (helps when returning from a finished match)
  useEffect(() => {
    const onFocus = () => {
      // clear timers and retries
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (pendingRetryTimeoutRef.current) {
        clearTimeout(pendingRetryTimeoutRef.current);
        pendingRetryTimeoutRef.current = null;
      }
      hasStartedSearch.current = false;
      matchStartRetriesRef.current = 0;
      setMatchmakingState({
        status: 'searching',
        timeElapsed: 0,
        estimatedWait: 30
      });
      setError(null);
    };

    const unsub = navigation?.addListener?.('focus', onFocus);
    return () => {
      try { unsub(); } catch (err) {}
    };
  }, [navigation]);



  // Fetch user profile like web version
  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));

      }
    } catch (error) {
      console.error('❌ Error decoding token:', error);
    }
  };

  // Initialize matchmaking state
  useEffect(() => {
    fetchUserProfile();
    if (!hasStartedSearch.current) {
      setMatchmakingState({
        status: 'searching',
        timeElapsed: 0,
        estimatedWait: 30
      });
      hasStartedSearch.current = false;
      searchStartTime.current = Date.now();
    }
  }, []);

  // Start timer when status is searching
  useEffect(() => {
    if (matchmakingState.status === 'searching') {
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Ensure start time is set
      if (!searchStartTime.current || searchStartTime.current === 0) {
        searchStartTime.current = Date.now();
      }
      
      // Start timer
      timerRef.current = setInterval(() => {
        setMatchmakingState(prev => ({
          ...prev,
          timeElapsed: Math.floor((Date.now() - searchStartTime.current) / 1000)
        }));
      }, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    } else {
      // Clear timer when not searching
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [matchmakingState.status]);

  // Initialize socket connection - Enhanced like web version
  useEffect(() => {



    
    if (user?.token) {

      const newSocket = io(WEBSOCKET_CONFIG.SERVER_URL, {
        auth: {
          token: user.token
        },
        ...WEBSOCKET_CONFIG.CONNECTION_OPTIONS
      });

      newSocket.on('connect', () => {







        setIsConnected(true);
        
        // Register user immediately after connection (like web version)
        if (user?.id) {

          newSocket.emit('register_user', user.id);
        }
      });

      newSocket.on('disconnect', () => {

        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        // Silently handle socket errors - no console logging
        // console.error('🔥 Socket connection error:', error);
        setError('Connection failed. Please check your internet connection and try again.');
      });

      newSocket.on('pong', () => {

      });

      setSocket(newSocket);

      return () => {

        newSocket.disconnect();
      };
    } else {

      setError('Authentication required. Please login again.');
    }
  }, [user?.token]);

  // Start matchmaking - Simplified like web version
  useEffect(() => {
    // Reset start flag to allow re-starting matchmaking after returning from a match
    hasStartedSearch.current = false;
    matchStartRetriesRef.current = 0;
    if (pendingRetryTimeoutRef.current) {
      clearTimeout(pendingRetryTimeoutRef.current);
      pendingRetryTimeoutRef.current = null;
    }

    if (!socket || !isConnected || hasStartedSearch.current) return;


    hasStartedSearch.current = true;
    searchStartTime.current = Date.now();

    // Start timer immediately
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setMatchmakingState(prev => ({
        ...prev,
        timeElapsed: Math.floor((Date.now() - searchStartTime.current) / 1000)
      }));
    }, 1000);

    // Emit matchmaking request

    socket.emit('join_matchmaking', {
      categoryId: category,
      mode: mode || 'quick',
      amount: amount ? parseFloat(amount) : undefined
    });

    // Test socket connection
    setTimeout(() => {

      socket.emit('ping');
    }, 1000);

    // Set search timeout (2 minutes)
    const timeout = setTimeout(() => {

      setError('No opponent found within 2 minutes. Please try again.');
      setMatchmakingState(prev => ({ ...prev, status: 'error' }));
    }, 120000); // 2 minutes

    setSearchTimeout(timeout);

    // Socket event listeners - Simplified like web version
    socket.on('matchmaking_update', (data: { 
      status: string; 
      estimatedWait?: number; 
      message?: string 
    }) => {

      setMatchmakingState(prev => ({
        ...prev,
        status: data.status as any,
        estimatedWait: data.estimatedWait || prev.estimatedWait
      }));
    });

    socket.on('opponent_found', (data: { opponent: User; category?: string }) => {

      // Play match found sound
      SoundManager.playMatchFoundSound();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setMatchmakingState(prev => ({
        ...prev,
        status: 'found',
        opponent: data.opponent,
        category: data.category
      }));
    });

    socket.on('match_starting', (data: { countdown: number }) => {

      setMatchmakingState(prev => ({
        ...prev,
        status: 'starting'
      }));
      
      // Start countdown
      setCountdown(3);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    socket.on('match_ready', (data: { matchId: string; roomCode?: string }) => {

      
      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      
      if (searchTimeout) {
        clearTimeout(searchTimeout);
        setSearchTimeout(null);
      }
      
      // Navigate to battle
      if (data.roomCode) {

        router.push({
          pathname: '/(tabs)/battle-room',
          params: { roomCode: data.roomCode }
        } as any);
      } else {

        router.push({
          pathname: '/(tabs)/battle-room',
          params: { matchId: data.matchId }
        } as any);
      }
    });

    socket.on('matchmaking_error', (data: { message: string }) => {
      console.error('❌ Matchmaking error:', data);
      setError(data.message || 'Matchmaking failed. Please try again.');
      setMatchmakingState(prev => ({ ...prev, status: 'error' }));
    });

    socket.on('opponent_cancelled', () => {

      setMatchmakingState(prev => ({ ...prev, status: 'searching' }));
    });

    socket.on('pong', () => {

    });

    socket.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error);
      setError('Connection failed. Please check your internet connection and try again.');
    });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      
      // Clean up socket listeners
      socket.off('matchmaking_update');
      socket.off('opponent_found');
      socket.off('match_starting');
      socket.off('match_ready');
      socket.off('matchmaking_error');
      socket.off('opponent_cancelled');
    };
  }, [socket, isConnected, category, mode, amount, router, user?.id]);

  // Enhanced animations
  useEffect(() => {

    
    // Radar scan animation
    Animated.loop(
      Animated.timing(radarAnim, { 
        toValue: 1, 
        duration: 3000, 
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin)
      })
    ).start();
    
    // Scanning wave animation
    Animated.loop(
      Animated.timing(scanAnim, { 
        toValue: 1, 
        duration: 2000, 
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin)
      })
    ).start();
    
    // Search animation with particles
    Animated.loop(
      Animated.sequence([
        Animated.timing(searchAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(searchAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
    
    // Enhanced pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Wave animation
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin),
      })
    ).start();

    // Particle animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim1, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(particleAnim1, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim2, { toValue: 1, duration: 3500, useNativeDriver: true }),
        Animated.timing(particleAnim2, { toValue: 0, duration: 3500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim3, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(particleAnim3, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
    
    // Subtle background gradient shift
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(gradientAnim, { toValue: 0, duration: 8000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  // 🧹 Cleanup on component unmount
  useEffect(() => {
    return () => {

      
      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (searchTimeout) {
        clearTimeout(searchTimeout);
        setSearchTimeout(null);
      }
      
      // Reset state
      hasStartedSearch.current = false;
      
      // Disconnect socket if needed
      if (socket && socket.connected) {

        socket.disconnect();
      }
    };
  }, [socket]);
  const handleCancelSearch = () => {

    setMatchmakingState({
      status: 'searching',
      timeElapsed: 0,
      estimatedWait: 30
    });
    hasStartedSearch.current = false;
    if (socket && isConnected) {
      socket.emit('cancel_matchmaking');
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
    
    router.back();
  };

  const handleRetrySearch = () => {

    setError(null);
    hasStartedSearch.current = false;
    setMatchmakingState({
      status: 'searching',
      timeElapsed: 0,
      estimatedWait: 30
    });
    
    // Restart the matchmaking process
    if (socket && isConnected) {

      socket.emit('join_matchmaking', {
        categoryId: category,
        mode: mode || 'quick',
        amount: amount ? parseFloat(amount) : undefined
      });
    } else {

      // Force reconnection
      if (socket) {
        socket.connect();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryName = (categoryId?: string | null) => {
    if (!categoryId || categoryId === 'any') return 'Any Category';
    return categoryId;
  };



  if (error) {
    // Check if it's an insufficient balance error
    const isInsufficientBalance = error.toLowerCase().includes('insufficient') || 
                                  error.toLowerCase().includes('balance') ||
                                  error.toLowerCase().includes('required') ||
                                  error.toLowerCase().includes('available');
    
    // Check if it's a "No opponent found" error
    const isNoOpponentError = error.toLowerCase().includes('no opponent found') || 
                             error.toLowerCase().includes('within 2 minutes');
    
    return (
      <LinearGradient
        colors={isInsufficientBalance ? ['#4F46E5', '#7C3AED', '#8B5CF6'] : 
                isNoOpponentError ? ['#4F46E5', '#7C3AED', '#8B5CF6'] : 
                ['#0f172a', '#1e293b', '#334155']}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Animated.View style={[styles.errorIconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons 
              name={isInsufficientBalance ? "wallet-outline" : 
                    isNoOpponentError ? "people-outline" : "alert-circle"} 
              size={56} 
              color={isInsufficientBalance ? "#ffffff" : 
                     isNoOpponentError ? "#ffffff" : "#ef4444"} 
            />
          </Animated.View>
          
          <Text style={styles.errorTitle}>
            {isInsufficientBalance ? "Insufficient Balance" : 
             isNoOpponentError ? "No Opponent Found" : "Matchmaking Error"}
          </Text>
          
          <Text style={styles.errorMessage}>
            {isInsufficientBalance 
              ? "You don't have enough balance to join this battle. Please add money to your wallet to continue."
              : isNoOpponentError 
              ? "We couldn't find a suitable opponent within 2 minutes. Don't worry, this happens sometimes!"
              : error
            }
          </Text>
          
          {isNoOpponentError && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>💡 Try These Tips:</Text>
              <View style={styles.suggestionItem}>
                <Ionicons name="time-outline" size={16} color="#10B981" />
                <Text style={styles.suggestionText}>Try again during peak hours (7-9 PM)</Text>
              </View>
              <View style={styles.suggestionItem}>
                <Ionicons name="refresh-outline" size={16} color="#10B981" />
                <Text style={styles.suggestionText}>Refresh and search again</Text>
              </View>
              <View style={styles.suggestionItem}>
                <Ionicons name="people-outline" size={16} color="#10B981" />
                <Text style={styles.suggestionText}>Try a different category or amount</Text>
              </View>
            </View>
          )}
          
          {isInsufficientBalance && (
            <View style={styles.balanceInfoContainer}>
              <View style={styles.balanceInfoCard}>
                <View style={styles.balanceInfoRow}>
                  <Ionicons name="wallet" size={20} color="#10B981" />
                  <Text style={styles.balanceInfoLabel}>Required Amount:</Text>
                  <Text style={styles.balanceInfoValue}>₹{amount}</Text>
                </View>
                <View style={styles.balanceInfoRow}>
                  <Ionicons name="cash-outline" size={20} color="#F59E0B" />
                  <Text style={styles.balanceInfoLabel}>Available:</Text>
                  <Text style={styles.balanceInfoValue}>₹0.00</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceInfoRow}>
                  <Ionicons name="calculator" size={20} color="#8B5CF6" />
                  <Text style={styles.balanceInfoLabel}>Need to Add:</Text>
                  <Text style={styles.balanceInfoValue}>₹{amount}</Text>
                </View>
              </View>
            </View>
          )}
          
          <View style={styles.errorButtons}>
            <TouchableOpacity
              style={styles.errorButton}
              onPress={() => router.back()}
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={styles.errorButtonGradient}
              >
                <Ionicons name="arrow-back" size={16} color="#fff" />
                <Text style={styles.errorButtonText}>Go Back</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {isInsufficientBalance ? (
              <TouchableOpacity
                style={styles.errorButtonPrimary}
                onPress={() => router.push('/(tabs)/wallet')}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.errorButtonGradient}
                >
                  <Ionicons name="add-circle" size={16} color="#fff" />
                  <Text style={styles.errorButtonText}>Add Money</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : isNoOpponentError ? (
              <TouchableOpacity
                style={styles.errorButtonPrimary}
                onPress={handleRetrySearch}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.errorButtonGradient}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={styles.errorButtonText}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.errorButtonOutline}
                onPress={handleRetrySearch}
              >
                <Text style={styles.errorButtonOutlineText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      {/* animated background gradients matching app header */}
      <Animated.View style={[styles.animatedGradient, { opacity: gradientAnim }]}>
        <LinearGradient
          colors={['#070610', '#0f1230', '#1b153f', '#2b0f5a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.animatedGradientInner}
        />
      </Animated.View>
      <Animated.View style={[styles.animatedGradient, { opacity: gradientAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <LinearGradient
          colors={['#070610', '#0f1230', '#1b153f', '#2b0f5a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.animatedGradientInner}
        />
      </Animated.View>
      

             {/* Animated Background Elements */}
       <View style={styles.backgroundContainer}>
         {/* Floating Particles */}
         <Animated.View 
           style={[
             styles.floatingParticle1,
             {
               transform: [{
                 translateY: particleAnim1.interpolate({
                   inputRange: [0, 1],
                   outputRange: [0, -100]
                 })
               }],
               opacity: particleAnim1.interpolate({
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
                 translateY: particleAnim2.interpolate({
                   inputRange: [0, 1],
                   outputRange: [0, -80]
                 })
               }],
               opacity: particleAnim2.interpolate({
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
                 translateY: particleAnim3.interpolate({
                   inputRange: [0, 1],
                   outputRange: [0, -120]
                 })
               }],
               opacity: particleAnim3.interpolate({
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
               transform: [{ scale: pulseAnim }],
               opacity: glowAnim.interpolate({
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
               transform: [{ scale: pulseAnim }],
               opacity: glowAnim.interpolate({
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
                 scale: waveAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: [1, 1.5]
                 })
               }],
               opacity: waveAnim.interpolate({
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
                 scale: waveAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: [1.2, 1.8]
                 })
               }],
               opacity: waveAnim.interpolate({
                 inputRange: [0, 0.5, 1],
                 outputRange: [0.2, 0.6, 0.1]
               })
             }
           ]}
         />
       </View>

       {/* Exciting Main Content */}
       <View style={styles.content}>
         {/* Exciting Searching State */}
         {matchmakingState.status === 'searching' && (
           <View style={styles.searchingContainer}>
             {/* Amazing Animated Background */}
             <View style={styles.animatedBackground}>
              {/* Exciting Glowing Orbs */}
              <Animated.View 
                style={[
                  styles.bgCircle1,
                  { 
                    transform: [{ scale: pulseAnim }],
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 0.9]
                    })
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.bgCircle2,
                  { 
                    transform: [{ scale: pulseAnim }],
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.7]
                    })
                  }
                ]} 
              />
              
              {/* Exciting Radar Scan */}
              <Animated.View 
                style={[
                  styles.radarScan,
                  {
                    transform: [{
                      scale: radarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 2.8]
                      })
                    }],
                    opacity: radarAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.9, 0.5, 0]
                    })
                  }
                ]}
              />
              
              {/* Exciting Scanning Wave */}
              <Animated.View 
                style={[
                  styles.scanWave,
                  {
                    transform: [{
                      scale: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.2, 2.5]
                      })
                    }],
                    opacity: scanAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 0.4, 0]
                    })
                  }
                ]}
              />
              
              {/* Exciting Floating Elements */}
              <Animated.View 
                style={[
                  styles.particle1,
                  {
                    opacity: particleAnim1,
                    transform: [{
                      translateY: particleAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -80]
                      })
                    }]
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.particle2,
                  {
                    opacity: particleAnim2,
                    transform: [{
                      translateY: particleAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -70]
                      })
                    }]
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.particle3,
                  {
                    opacity: particleAnim3,
                    transform: [{
                      translateY: particleAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -90]
                      })
                    }]
                  }
                ]}
              />
            </View>
            
                         {/* Exciting Match Animation */}
             <View style={styles.matchAnimation}>
               {/* You - Exciting Design */}
               <View style={[styles.playerContainer, { left: -20 }]}>
                <Animated.View 
                  style={[
                    styles.playerGlow,
                    {
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1]
                      })
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                    style={styles.playerGlowGradient}
                  />
                </Animated.View>
                <View style={styles.playerAvatar}>
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8E53']}
                    style={styles.playerAvatarGradient}
                  >
                    <Text style={styles.playerInitial}>Y</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.playerName}>You</Text>
                <View style={styles.statusBadge}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.statusBadgeGradient}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.statusText}>Ready</Text>
                  </LinearGradient>
                </View>
              </View>
              
                             {/* Fixed VS Badge */}
               <View style={styles.vsContainer}>
                                 <LinearGradient
                   colors={['#FF6B6B', '#FF8E53', '#FFD93D']}
                   style={styles.vsGradient}
                 >
                   <Text style={styles.vsText}>⚔️ VS</Text>
                 </LinearGradient>
               </View>
              
                                            {/* Exciting Opponent Search */}
               <Animated.View 
                 style={[
                   styles.playerContainer,
                   { right: -20 },
                   {
                     transform: [
                       {
                         translateY: searchAnim.interpolate({
                           inputRange: [0, 1],
                           outputRange: [-20, 20]
                         })
                       }
                     ]
                   }
                 ]}
               >
                 <Animated.View 
                   style={[
                     styles.playerGlow,
                     {
                       opacity: glowAnim.interpolate({
                         inputRange: [0, 1],
                         outputRange: [0.5, 1]
                       })
                     }
                   ]}
                 >
                   <LinearGradient
                     colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                     style={styles.playerGlowGradient}
                   />
                 </Animated.View>
                 <View style={styles.playerAvatar}>
                  <Animated.View
                    style={{
                      transform: [{
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.2)']}
                      style={styles.opponentAvatarGradient}
                    >
                      <Ionicons name="person" size={36} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                </View>
                <Text style={styles.playerName}>Opponent</Text>
                <View style={styles.searchingBadge}>
                  <Animated.View
                    style={{
                      opacity: searchAnim
                    }}
                  >
                    <Ionicons name="radio" size={16} color="#fff" />
                  </Animated.View>
                  <Text style={styles.searchingText}>Finding</Text>
                </View>
              </Animated.View>
            </View>
            
            {/* Premium Status Info */}
            <View style={styles.statusInfo}>
              <Animated.Text 
                style={[
                  styles.statusTitle,
                  {
                    opacity: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })
                  }
                ]}
              >
                Searching for Opponent
              </Animated.Text>
              <Text style={styles.statusSubtitleText}>
                Finding the perfect match for you...
              </Text>

                {/* Premium Time Display */}
                <Animated.View
                  style={[
                    styles.largeTimeContainer,
                    {
                      opacity: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.05)']}
                    style={styles.largeTimeGradient}
                  >
                    <View style={styles.timeIconContainer}>
                      <Ionicons name="time-outline" size={28} color="rgba(255,255,255,0.95)" />
                    </View>
                    <Text style={styles.largeTimeText}>
                      {formatTime(matchmakingState.timeElapsed)}
                    </Text>
                    <Text style={styles.largeTimeLabel}>Time Elapsed</Text>
                  </LinearGradient>
                </Animated.View>
            </View>
            
            {/* Premium Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSearch}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.9)', 'rgba(220, 38, 38, 0.9)', 'rgba(185, 28, 28, 0.9)']}
                style={styles.cancelButtonGradient}
              >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.cancelButtonText}>Cancel Search</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

                          {/* Premium Opponent Found State */}
         {matchmakingState.status === 'found' && matchmakingState.opponent && (
           <View style={styles.foundContainer}>
             {/* Premium Success Animation */}
             <Animated.View 
               style={[
                 styles.successIcon,
                 { transform: [{ scale: scaleAnim }] }
               ]}
             >
               <LinearGradient
                 colors={['#10b981', '#059669', '#047857', '#065f46']}
                 style={styles.successIconGradient}
               >
                <Ionicons name="checkmark-circle" size={Platform.OS === 'android' ? 56 : 72} color="#fff" />
               </LinearGradient>
             </Animated.View>
             
             <Text style={styles.foundTitle}>Opponent Found!</Text>
             <Text style={styles.foundSubtitle}>Get ready for battle</Text>
             
            {/* Compact Matchup */}
            <View style={styles.foundMatchupContainer}>
              {/* You */}
              <View style={styles.playerCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']}
                  style={styles.foundPlayerCardGradient}
                >
                  <View style={[styles.playerAvatar, styles.foundPlayerAvatar]}>
                    <LinearGradient
                      colors={['#FF6B6B', '#FF8E53']}
                      style={styles.playerAvatarGradient}
                    >
                      <Text style={[styles.playerInitial, styles.foundPlayerInitial]}>Y</Text>
                    </LinearGradient>
                  </View>
                  <Text style={[styles.playerName, styles.foundPlayerName]}>You</Text>
                  <View style={styles.readyBadge}>
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.readyBadgeGradient}
                    >
                      <Ionicons name="checkmark-circle" size={14} color="#fff" />
                      <Text style={styles.readyText}>Ready</Text>
                    </LinearGradient>
                  </View>
                </LinearGradient>
              </View>
              
              {/* VS (smaller, in-flow) */}
              <View style={styles.foundVsContainer}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53', '#FFD93D']}
                  style={[styles.vsGradient, styles.vsSmall]}
                >
                  <Text style={[styles.vsText, styles.vsSmallText]}>⚔️ VS</Text>
                </LinearGradient>
              </View>
              
              {/* Opponent */}
              <View style={styles.playerCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']}
                  style={styles.foundPlayerCardGradient}
                >
                  <View style={[styles.playerAvatar, styles.foundPlayerAvatar]}>
                    <LinearGradient
                      colors={['#4ECDC4', '#44A08D']}
                      style={styles.playerAvatarGradient}
                    >
                      <Text style={[styles.playerInitial, styles.foundPlayerInitial]}>
                        {matchmakingState.opponent.name.charAt(0).toUpperCase()}
                      </Text>
                    </LinearGradient>
                  </View>
                  <Text style={[styles.playerName, styles.foundPlayerName]}>{matchmakingState.opponent.name}</Text>
                  <View style={styles.foundReadyBadge}>
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.statusBadgeGradient}
                    >
                      <Ionicons name="checkmark-circle" size={14} color="#fff" />
                      <Text style={styles.readyText}>Ready</Text>
                    </LinearGradient>
                  </View>
                </LinearGradient>
              </View>
            </View>
           </View>
         )}

        {/* Premium Match Starting State */}
        {matchmakingState.status === 'starting' && (
          <View style={styles.startingContainer}>
            <Animated.View 
              style={[
                styles.gameIcon,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626', '#b91c1c', '#991b1b']}
                style={styles.gameIconGradient}
              >
                <Ionicons name="flash" size={Platform.OS === 'android' ? 44 : 64} color="#fff" />
              </LinearGradient>
            </Animated.View>
            
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.9)', 'rgba(220, 38, 38, 0.9)', 'rgba(185, 28, 28, 0.9)']}
              style={styles.battleTitleGradient}
            >
              <Text style={styles.battleTitleText}>Battle Starting!</Text>
            </LinearGradient>
            <Text style={styles.statusSubtitle}>Prepare yourself...</Text>
            
            <View style={styles.countdownCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.12)']}
                style={styles.countdownGradient}
              >
                <Text style={styles.countdownNumber}>{countdown}</Text>
                <Text style={styles.countdownText}>
                  {countdown > 0 ? 'Starting in' : 'GO!'}
                </Text>
              </LinearGradient>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? ((StatusBar.currentHeight ?? 28) + 18) : 30,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  headerContent: {
    flex: 1,
    marginLeft: 20,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF8EA',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 248, 234, 0.85)',
    textAlign: 'center',
  },
  timerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
     content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 18 : 0,
    justifyContent: 'center',
    alignItems: 'center',
   },
  searchingContainer: {
    flex: Platform.OS === 'android' ? 0.65 : 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'android' ? 4 : 12,
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: 10,
  },
  searchAnimationContainer: {
    width: Platform.OS === 'android' ? 64 : 110,
    height: Platform.OS === 'android' ? 64 : 110,
    position: 'relative',
    marginBottom: Platform.OS === 'android' ? 4 : 10,
    borderRadius: Platform.OS === 'android' ? 8 : 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'android' ? 4 : 8 },
    shadowOpacity: Platform.OS === 'android' ? 0.08 : 0.24,
    shadowRadius: Platform.OS === 'android' ? 8 : 20,
    elevation: Platform.OS === 'android' ? 4 : 10,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  userContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: Platform.OS === 'android' ? 64 : 84,
    height: Platform.OS === 'android' ? 64 : 84,
    borderRadius: Platform.OS === 'android' ? 32 : 42,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  userInitial: {
    fontSize: Platform.OS === 'android' ? 22 : 28,
    fontWeight: '900',
    color: '#FFF8EA',
  },
  userLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 8,
    fontWeight: '700',
  },
  vsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? '44%' : '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: Platform.OS === 'android' ? -18 : -8 }],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  vsText: {
    fontSize: Platform.OS === 'android' ? 16 : 22,
    fontWeight: '900',
    color: '#FFD166',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  opponentScrollContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opponentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  opponentInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  opponentLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  errorIconContainer: {
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 18,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorButtons: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  errorButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    width: 190,
  },
  errorButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  errorButtonOutline: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  errorButtonOutlineText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  suggestionsContainer: {
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  suggestionText: {
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  balanceInfoContainer: {
    marginVertical: 20,
    width: '100%',
  },
  balanceInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  balanceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  balanceInfoLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
    flex: 1,
    fontWeight: '600',
  },
  balanceInfoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 8,
  },
  errorButtonPrimary: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 30,
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  foundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  successIcon: {
    marginBottom: 32,
  },
  successIconGradient: {
    borderRadius: 50,
    padding: Platform.OS === 'android' ? 12 : 20,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.4)',
    // flat: remove shadows/elevation
    elevation: 0,
  },
  matchupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 28,
    padding: 22,
    width: '100%',
    maxWidth: 460,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#0b1220',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 18,
  },
  userCard: {
    flex: 1,
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  opponentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  opponentLevel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  startingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  gameIcon: {
    marginBottom: 32,
  },
  gameIconGradient: {
    borderRadius: 50,
    padding: Platform.OS === 'android' ? 12 : 20,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.4)',
    elevation: 0,
  },
    countdownCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: Platform.OS === 'android' ? 12 : 16,
    width: '100%',
    maxWidth: Platform.OS === 'android' ? 160 : 200,
    borderWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
    // flat look
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: 'hidden',
  },
  countdownNumber: {
    fontSize: Platform.OS === 'android' ? 48 : 64,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
    letterSpacing: 1,
    textAlign: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cancelButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: Platform.OS === 'android' ? 6 : 8,
    elevation: 6,
  },
  cancelButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    minWidth: 160,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFD166',
    textAlign: 'center',
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.6,
  },
  tipsContainer: {
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  tipsGrid: {
    gap: 16,
  },
  tipCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  matchAnimation: {
    width: Platform.OS === 'android' ? 220 : 260,
    height: Platform.OS === 'android' ? 86 : 110,
    position: 'relative',
    marginBottom: Platform.OS === 'android' ? 4 : 10,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: Platform.OS === 'android' ? -10 : -6 }],
  },
  playerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: Platform.OS === 'android' ? 58 : 76,
    height: '100%',
  },
  playerAvatar: {
    width: Platform.OS === 'android' ? 48 : 60,
    height: Platform.OS === 'android' ? 48 : 60,
    borderRadius: Platform.OS === 'android' ? 24 : 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.4)',
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    } : {}),
    elevation: Platform.OS === 'android' ? 6 : 6,
  },
  playerInitial: {
    fontSize: Platform.OS === 'android' ? 20 : 24,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
    marginTop: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  playerStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
     statusInfo: {
    marginBottom: Platform.OS === 'android' ? 12 : 24,
    marginTop: Platform.OS === 'android' ? 20 : 32,
     alignItems: 'center',
     width: '100%',
     paddingHorizontal: 20,
   },
   statusTitle: {
    fontSize: Platform.OS === 'android' ? 20 : 24,
     fontWeight: '800',
     color: '#fff',
     marginBottom: 8,
     textAlign: 'center',
     letterSpacing: 0.5,
     textShadowColor: 'rgba(0,0,0,0.5)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 4,
   },
   statusSubtitleText: {
     fontSize: 14,
     fontWeight: '500',
     color: 'rgba(255,255,255,0.7)',
     textAlign: 'center',
     marginTop: 4,
   },
  statusBadge: {
    // Make Ready badge visually match the "Finding" pill but green
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: Platform.OS === 'android' ? 6 : 8,
    paddingHorizontal: Platform.OS === 'android' ? 14 : 22,
    marginTop: 12,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    // remove shadows for a flat pill look
    elevation: 0,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  searchingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 4 : 10,
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#c02626',
    minWidth: 90,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#ef4444',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
    } : {}),
    elevation: Platform.OS === 'android' ? 2 : 3,
  },
  searchingText: {
    fontSize: Platform.OS === 'android' ? 11 : 12,
    fontWeight: Platform.OS === 'android' ? '700' : '800',
    color: '#fff',
    marginLeft: 6,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  playerGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 35,
    opacity: 0.5,
    zIndex: -1,
  },
  playerGlowGradient: {
    flex: 1,
    borderRadius: 35,
  },
  vsGradient: {
    borderRadius: 18,
    paddingVertical: Platform.OS === 'android' ? 8 : 12,
    paddingHorizontal: Platform.OS === 'android' ? 12 : 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
    } : {}),
    elevation: Platform.OS === 'android' ? 6 : 8,
  },
  readyBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 50,
  },
  readyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  levelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  playerCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  playerCardGradient: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 140,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    } : {}),
    elevation: Platform.OS === 'android' ? 8 : 6,
  },
  countdownGradient: {
    borderRadius: 16,
    padding: Platform.OS === 'android' ? 12 : 15,
    width: '100%',
    maxWidth: Platform.OS === 'android' ? 140 : 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedBackground: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    zIndex: -1,
  },
  bgCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bgCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  radarScan: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  scanWave: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ translateX: -75 }, { translateY: -75 }],
  },
  progressContainer: {
    width: '100%',
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    marginTop: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  progressBackground: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  particle1: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    top: -10,
    left: 10,
  },
  particle2: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    top: 20,
    right: 15,
  },
  particle3: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    bottom: 10,
    left: 20,
  },
  opponentAvatarGradient: {
    borderRadius: 30,
    padding: 5,
  },
  statusBadgeGradient: {
    borderRadius: 16,
    paddingVertical: Platform.OS === 'android' ? 6 : 8,
    paddingHorizontal: Platform.OS === 'android' ? 12 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    // green border to match the green pill
    borderWidth: 1,
    borderColor: Platform.OS === 'android' ? '#047857' : 'rgba(255,255,255,0.18)',
  },
  readyBadgeGradient: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  levelBadgeGradient: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  playerAvatarGradient: {
    borderRadius: 30,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
     modeText: {
     fontSize: 15,
     fontWeight: '800',
     color: '#fff',
     marginLeft: 8,
     textAlign: 'center',
     letterSpacing: 0.3,
     textShadowColor: 'rgba(0,0,0,0.3)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
   },
   largeTimeContainer: {
    marginTop: Platform.OS === 'android' ? 6 : 24,
    marginBottom: Platform.OS === 'android' ? 8 : 16,
     alignItems: 'center',
   },
  animatedGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -2,
  },
  animatedGradientInner: {
    flex: 1,
  },
  foundVsContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foundPlayerCardGradient: {
    borderRadius: 16,
    padding: Platform.OS === 'android' ? 12 : 14,
    width: '100%',
    maxWidth: Platform.OS === 'android' ? 120 : 130,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    elevation: 0,
  },
  /* Found screen compact styles */
  foundMatchupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: Platform.OS === 'android' ? 12 : 18,
    width: '100%',
    maxWidth: Platform.OS === 'android' ? 360 : 420,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 20,
  },
  foundPlayerAvatar: {
    width: Platform.OS === 'android' ? 44 : 56,
    height: Platform.OS === 'android' ? 44 : 56,
    borderRadius: Platform.OS === 'android' ? 22 : 28,
  },
  foundPlayerInitial: {
    fontSize: Platform.OS === 'android' ? 18 : 22,
  },
  foundPlayerName: {
    fontSize: Platform.OS === 'android' ? 13 : 15,
    marginTop: Platform.OS === 'android' ? 8 : 10,
  },
  vsSmall: {
    borderRadius: 14,
    paddingVertical: Platform.OS === 'android' ? 6 : 10,
    paddingHorizontal: Platform.OS === 'android' ? 10 : 14,
    borderWidth: 1,
  },
  vsSmallText: {
    fontSize: Platform.OS === 'android' ? 14 : 18,
  },
  foundReadyBadge: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: Platform.OS === 'android' ? 8 : 10,
  },
   largeTimeGradient: {
    borderRadius: 20,
    paddingVertical: Platform.OS === 'android' ? 10 : 18,
    paddingHorizontal: Platform.OS === 'android' ? 16 : 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden', // ensure rounded corners clip any inner visuals
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
    } : {}),
    // Remove elevation on Android to avoid hard corner shadow artifacts
    elevation: Platform.OS === 'android' ? 0 : 8,
    minWidth: Platform.OS === 'android' ? 140 : 200,
   },
   timeIconContainer: {
     width: 48,
     height: 48,
     borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    // remove shadows on Android to prevent corner artifacts
    ...(Platform.OS === 'android' ? { elevation: 0 } : {}),
   },
   largeTimeText: {
    fontSize: Platform.OS === 'android' ? 26 : 34,
    fontWeight: '900',
    color: '#fff',
    marginTop: 4,
    textShadowColor: Platform.OS === 'android' ? 'transparent' : 'rgba(0,0,0,0.6)',
    textShadowOffset: Platform.OS === 'android' ? { width: 0, height: 0 } : { width: 0, height: 3 },
    textShadowRadius: Platform.OS === 'android' ? 0 : 6,
    letterSpacing: 2,
   },
   largeTimeLabel: {
    fontSize: Platform.OS === 'android' ? 10 : 12,
     fontWeight: '600',
     color: 'rgba(255,255,255,0.75)',
     marginTop: 6,
     textTransform: 'uppercase',
     letterSpacing: 1.5,
   },
    battleTitleGradient: {
      borderRadius: 14,
      paddingVertical: Platform.OS === 'android' ? 8 : 12,
      paddingHorizontal: Platform.OS === 'android' ? 12 : 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      elevation: 0,
      marginBottom: Platform.OS === 'android' ? 8 : 12,
    },
    battleTitleText: {
      fontSize: Platform.OS === 'android' ? 18 : 22,
      fontWeight: '900',
      color: '#fff',
      textAlign: 'center',
      textShadowColor: 'transparent',
      letterSpacing: 0.6,
    },
    statusSubtitle: {
      fontSize: 15,
      color: 'rgba(255,255,255,0.75)',
      textAlign: 'center',
      fontWeight: '500',
      marginBottom: 24,
      letterSpacing: 0.3,
    },
     liveBattleContainer: {
       marginTop: 20,
       marginBottom: 12,
       alignItems: 'center',
     },
     liveBattleGradient: {
       borderRadius: 20,
       paddingVertical: 10,
       paddingHorizontal: 20,
       alignItems: 'center',
       flexDirection: 'row',
       borderWidth: 1.5,
       borderColor: 'rgba(255,255,255,0.3)',
       shadowColor: '#ef4444',
       shadowOffset: { width: 0, height: 4 },
       shadowOpacity: 0.5,
       shadowRadius: 12,
       elevation: 8,
     },
     liveIndicatorDot: {
       width: 8,
       height: 8,
       borderRadius: 4,
       backgroundColor: '#fff',
       marginRight: 8,
       shadowColor: '#fff',
       shadowOffset: { width: 0, height: 0 },
       shadowOpacity: 0.8,
       shadowRadius: 4,
     },
     liveBattleText: {
       fontSize: 14,
       fontWeight: '800',
       color: '#fff',
       textShadowColor: 'rgba(0,0,0,0.5)',
       textShadowOffset: { width: 0, height: 1 },
       textShadowRadius: 3,
       letterSpacing: 1.5,
     },
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
       // Premium Opponent Found Styles
       foundTitle: {
         fontSize: 28,
         fontWeight: '900',
         color: '#fff',
         marginBottom: 6,
         textAlign: 'center',
         textShadowColor: 'rgba(0,0,0,0.6)',
         textShadowOffset: { width: 0, height: 3 },
         textShadowRadius: 6,
         letterSpacing: 0.8,
       },
       foundSubtitle: {
         fontSize: 15,
         color: 'rgba(255,255,255,0.75)',
         marginBottom: 32,
         textAlign: 'center',
         fontWeight: '500',
         textShadowColor: 'rgba(0,0,0,0.3)',
         textShadowOffset: { width: 0, height: 1 },
         textShadowRadius: 3,
         letterSpacing: 0.3,
       },
       enhancedMatchupContainer: {
         flexDirection: 'row',
         alignItems: 'center',
         justifyContent: 'space-between',
         backgroundColor: 'rgba(255,255,255,0.1)',
         borderRadius: 25,
         padding: 30,
         width: '100%',
         maxWidth: 380,
         borderWidth: 2,
         borderColor: 'rgba(255,255,255,0.2)',
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 10 },
         shadowOpacity: 0.3,
         shadowRadius: 20,
         elevation: 12,
         marginBottom: 30,
       },
       enhancedPlayerCard: {
         flex: 1,
         alignItems: 'center',
         marginHorizontal: 8,
       },
       enhancedPlayerCardGradient: {
         borderRadius: 20,
         padding: 20,
         width: '100%',
         maxWidth: 140,
         alignItems: 'center',
         borderWidth: 1,
         borderColor: 'rgba(255,255,255,0.3)',
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 4 },
         shadowOpacity: 0.2,
         shadowRadius: 8,
         elevation: 6,
       },
       enhancedPlayerAvatar: {
         width: 70,
         height: 70,
         borderRadius: 35,
         marginBottom: 12,
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 4 },
         shadowOpacity: 0.3,
         shadowRadius: 8,
         elevation: 6,
       },
       enhancedPlayerAvatarGradient: {
         borderRadius: 35,
         padding: 12,
         justifyContent: 'center',
         alignItems: 'center',
         borderWidth: 2,
         borderColor: 'rgba(255,255,255,0.4)',
       },
       enhancedPlayerInitial: {
         fontSize: 28,
         fontWeight: '900',
         color: '#fff',
         textShadowColor: 'rgba(0,0,0,0.5)',
         textShadowOffset: { width: 0, height: 2 },
         textShadowRadius: 4,
       },
       enhancedPlayerName: {
         fontSize: 16,
         fontWeight: '800',
         color: '#fff',
         marginBottom: 8,
         textAlign: 'center',
         textShadowColor: 'rgba(0,0,0,0.4)',
         textShadowOffset: { width: 0, height: 2 },
         textShadowRadius: 4,
       },
       enhancedReadyBadge: {
        borderRadius: 15,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        // remove shadows for flat look on Android/iOS
        elevation: 0,
       },
       enhancedReadyBadgeGradient: {
         borderRadius: 15,
         paddingVertical: 4,
         paddingHorizontal: 10,
         flexDirection: 'row',
         alignItems: 'center',
         justifyContent: 'center',
       },
       enhancedReadyText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#fff',
        marginLeft: 4,
       },
       enhancedVsContainer: {
         alignItems: 'center',
         justifyContent: 'center',
         marginHorizontal: 15,
       },
       enhancedVsGradient: {
         borderRadius: 25,
         paddingVertical: 15,
         paddingHorizontal: 20,
         borderWidth: 3,
         borderColor: 'rgba(255,255,255,0.5)',
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 6 },
         shadowOpacity: 0.4,
         shadowRadius: 12,
         elevation: 8,
       },
       enhancedVsText: {
         fontSize: 24,
         fontWeight: '900',
         color: '#fff',
         textShadowColor: 'rgba(0,0,0,0.7)',
         textShadowOffset: { width: 0, height: 3 },
         textShadowRadius: 6,
         letterSpacing: 1,
       },
       enhancedLevelBadge: {
         borderRadius: 15,
         paddingVertical: 6,
         paddingHorizontal: 12,
         borderWidth: 1,
         borderColor: 'rgba(255,255,255,0.3)',
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 2 },
         shadowOpacity: 0.2,
         shadowRadius: 4,
         elevation: 3,
       },
       enhancedLevelBadgeGradient: {
         borderRadius: 15,
         paddingVertical: 4,
         paddingHorizontal: 10,
         flexDirection: 'row',
         alignItems: 'center',
         justifyContent: 'center',
       },
       enhancedLevelText: {
         fontSize: 12,
         fontWeight: '800',
         color: '#fff',
         marginLeft: 4,
         textShadowColor: 'rgba(0,0,0,0.3)',
         textShadowOffset: { width: 0, height: 1 },
         textShadowRadius: 2,
       },
       battleInfoContainer: {
         width: '100%',
         maxWidth: 380,
         marginTop: 20,
       },
       battleInfoGradient: {
         borderRadius: 20,
         padding: 24,
         borderWidth: 1,
         borderColor: 'rgba(255,255,255,0.2)',
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 6 },
         shadowOpacity: 0.2,
         shadowRadius: 12,
         elevation: 8,
       },
       battleInfoRow: {
         flexDirection: 'row',
         alignItems: 'center',
         marginBottom: 16,
       },
       battleInfoText: {
         fontSize: 16,
         fontWeight: '700',
         color: '#fff',
         marginLeft: 12,
         textShadowColor: 'rgba(0,0,0,0.4)',
         textShadowOffset: { width: 0, height: 2 },
         textShadowRadius: 4,
       },
}); 

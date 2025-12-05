import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
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
  
  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchStartTime = useRef<number>(Date.now());
  const hasStartedSearch = useRef(false);

  const category = params.category as string;
  const mode = params.mode as string;
  const amount = params.amount as string;



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

  // Initialize socket connection - Enhanced like web version
  useEffect(() => {



    
    if (user?.token) {

      const newSocket = io('http://192.168.1.7:3001', {
        auth: {
          token: user.token
        },
        transports: ['polling', 'websocket'],
        path: '/api/socket',
        timeout: 20000,
        forceNew: true
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
    if (!socket || !isConnected || hasStartedSearch.current) return;


    hasStartedSearch.current = true;
    searchStartTime.current = Date.now();

    // Start timer
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
              size={80} 
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
                           outputRange: [-40, 40]
                         })
                       },
                       {
                         scale: searchAnim.interpolate({
                           inputRange: [0, 0.5, 1],
                           outputRange: [1, 1.3, 1]
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
                <Text style={styles.playerName}>Finding...</Text>
                <View style={styles.searchingBadge}>
                  <Animated.View
                    style={{
                      opacity: searchAnim
                    }}
                  >
                    <Ionicons name="radio" size={16} color="#FF6B6B" />
                  </Animated.View>
                  <Text style={styles.searchingText}>Searching</Text>
                </View>
              </Animated.View>
            </View>
            
            {/* Exciting Status Info */}
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
                  🔍 Searching for Opponent
                </Animated.Text>

                {/* Large Time Display */}
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
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    style={styles.largeTimeGradient}
                  >
                    <Ionicons name="time" size={32} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.largeTimeText}>
                      {formatTime(matchmakingState.timeElapsed)}
                    </Text>
                    <Text style={styles.largeTimeLabel}>elapsed</Text>
                  </LinearGradient>
                                 </Animated.View>
                 
                 {/* Live Battle Text */}
                 <Animated.View
                   style={[
                     styles.liveBattleContainer,
                     {
                       opacity: fadeAnim.interpolate({
                         inputRange: [0, 1],
                         outputRange: [0.8, 1]
                       })
                     }
                   ]}
                 >
                   <LinearGradient
                     colors={['#FF6B6B', '#FF8E53', '#FFD93D']}
                     style={styles.liveBattleGradient}
                   >
                     <Ionicons name="radio" size={20} color="rgba(255,255,255,0.9)" />
                     <Text style={styles.liveBattleText}>Live Battle</Text>
                   </LinearGradient>
                 </Animated.View>
                 
                
                
            </View>
            
            {/* Exciting Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSearch}
            >
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.5)', 'rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.2)']}
                style={styles.cancelButtonGradient}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.cancelButtonText}>Cancel Search</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

                          {/* Exciting Opponent Found State */}
         {matchmakingState.status === 'found' && matchmakingState.opponent && (
           <View style={styles.foundContainer}>
             {/* Exciting Success Animation */}
             <Animated.View 
               style={[
                 styles.successIcon,
                 { transform: [{ scale: scaleAnim }] }
               ]}
             >
               <LinearGradient
                 colors={['#10B981', '#059669', '#047857']}
                 style={styles.successIconGradient}
               >
                 <Ionicons name="checkmark-circle" size={80} color="#fff" />
               </LinearGradient>
             </Animated.View>
             
             <Text style={styles.statusTitle}>🎯 Opponent Found!</Text>
             
             {/* Exciting Matchup */}
             <View style={styles.matchupContainer}>
               {/* You */}
               <View style={styles.playerCard}>
                 <LinearGradient
                   colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']}
                   style={styles.playerCardGradient}
                 >
                   <View style={styles.playerAvatar}>
                     <LinearGradient
                       colors={['#FF6B6B', '#FF8E53']}
                       style={styles.playerAvatarGradient}
                     >
                       <Text style={styles.playerInitial}>Y</Text>
                     </LinearGradient>
                   </View>
                   <Text style={styles.playerName}>You</Text>
                   <View style={styles.readyBadge}>
                     <LinearGradient
                       colors={['#10B981', '#059669']}
                       style={styles.readyBadgeGradient}
                     >
                       <Ionicons name="checkmark-circle" size={16} color="#fff" />
                       <Text style={styles.readyText}>Ready</Text>
                     </LinearGradient>
                   </View>
                 </LinearGradient>
               </View>
               
               {/* VS */}
               <View style={styles.vsContainer}>
                 <LinearGradient
                   colors={['#FF6B6B', '#FF8E53', '#FFD93D']}
                   style={styles.vsGradient}
                 >
                   <Text style={styles.vsText}>⚔️ VS</Text>
                 </LinearGradient>
               </View>
               
               {/* Opponent */}
               <View style={styles.playerCard}>
                 <LinearGradient
                   colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']}
                   style={styles.playerCardGradient}
                 >
                   <View style={styles.playerAvatar}>
                     <LinearGradient
                       colors={['#4ECDC4', '#44A08D']}
                       style={styles.playerAvatarGradient}
                     >
                       <Text style={styles.playerInitial}>
                         {matchmakingState.opponent.name.charAt(0).toUpperCase()}
                       </Text>
                     </LinearGradient>
                   </View>
                   <Text style={styles.playerName}>{matchmakingState.opponent.name}</Text>
                   <View style={styles.levelBadge}>
                     <LinearGradient
                       colors={['#8B5CF6', '#7C3AED']}
                       style={styles.levelBadgeGradient}
                     >
                       <Ionicons name="trophy" size={16} color="#fff" />
                       <Text style={styles.levelText}>Level {matchmakingState.opponent.level}</Text>
                     </LinearGradient>
                   </View>
                 </LinearGradient>
               </View>
             </View>
           </View>
         )}

        {/* Exciting Match Starting State */}
        {matchmakingState.status === 'starting' && (
          <View style={styles.startingContainer}>
            <Animated.View 
              style={[
                styles.gameIcon,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53', '#FFD93D']}
                style={styles.gameIconGradient}
              >
                <Ionicons name="game-controller" size={80} color="#fff" />
              </LinearGradient>
            </Animated.View>
            
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53', '#FFD93D']}
              style={styles.battleTitleGradient}
            >
              <Text style={styles.battleTitleText}>🎮 Battle Starting!</Text>
            </LinearGradient>
            <Text style={styles.statusSubtitle}>Get ready to compete...</Text>
            
            <View style={styles.countdownCard}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53', '#FFD93D']}
                style={styles.countdownGradient}
              >
                <Text style={styles.countdownNumber}>{countdown}</Text>
                <Text style={styles.countdownText}>
                  {countdown > 0 ? 'Battle begins in...' : 'GO!'}
                </Text>
              </LinearGradient>
            </View>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
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
     paddingHorizontal: 20,
     paddingTop: -20,
     justifyContent: 'center',
     alignItems: 'center',
   },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
    maxWidth: 350,
  },
  searchAnimationContainer: {
    width: 120,
    height: 120,
    position: 'relative',
    marginBottom: 30,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  vsContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -18 }],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  vsText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.8,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorIconContainer: {
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
  errorButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  errorButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  errorButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
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
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  suggestionText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
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
              statusTitle: {
     fontSize: 18,
     fontWeight: '900',
     color: '#fff',
     marginTop: 40,
     marginBottom: 16,
     textAlign: 'left',
     textShadowColor: 'rgba(0,0,0,0.5)',
     textShadowOffset: { width: 0, height: 3 },
     textShadowRadius: 6,
     letterSpacing: 0.8,
   },
  statusSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 40,
    textAlign: 'center',
    fontWeight: '600',
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
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 40,
  },
  successIconGradient: {
    borderRadius: 40,
    padding: 15,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  matchupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
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
    marginBottom: 40,
  },
  gameIconGradient: {
    borderRadius: 40,
    padding: 15,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  countdownCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 220,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  countdownNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  countdownText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '600',
  },
                       cancelButton: {
       backgroundColor: 'rgba(239,68,68,0.2)',
       paddingHorizontal: 32,
       paddingVertical: 14,
       borderRadius: 25,
       borderWidth: 2,
       borderColor: 'rgba(239,68,68,0.4)',
       marginTop: 0,
       shadowColor: '#ef4444',
       shadowOffset: { width: 0, height: 4 },
       shadowOpacity: 0.3,
       shadowRadius: 8,
       elevation: 6,
     },
   cancelButtonGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 10,
     paddingHorizontal: 20,
   },
   cancelButtonText: {
     fontSize: 16,
     fontWeight: '700',
     color: '#fff',
     textAlign: 'center',
     marginLeft: 8,
     textShadowColor: 'rgba(0,0,0,0.3)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
     letterSpacing: 0.3,
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
     width: 280,
     height: 120,
     position: 'relative',
     marginBottom: 10,
     alignItems: 'center',
     justifyContent: 'center',
   },
  playerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: '100%',
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  playerInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  playerStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
     statusInfo: {
     marginBottom: 20,
     alignItems: 'center',
     width: '100%',
     paddingHorizontal: 20,
   },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 80,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  searchingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,107,107,0.15)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
    minWidth: 100,
  },
  searchingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B6B',
    marginLeft: 6,
    textAlign: 'center',
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
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxWidth: 130,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  countdownGradient: {
    borderRadius: 16,
    padding: 15,
    width: '100%',
    maxWidth: 120,
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
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
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
     marginTop: 20,
     marginBottom: 10,
     alignItems: 'center',
   },
   largeTimeGradient: {
     borderRadius: 20,
     paddingVertical: 16,
     paddingHorizontal: 24,
     alignItems: 'center',
     borderWidth: 2,
     borderColor: 'rgba(255,255,255,0.3)',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.3,
     shadowRadius: 8,
     elevation: 6,
   },
   largeTimeText: {
     fontSize: 28,
     fontWeight: '900',
     color: '#fff',
     marginTop: 8,
     textShadowColor: 'rgba(0,0,0,0.5)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 4,
     letterSpacing: 1,
   },
       largeTimeLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.8)',
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    battleTitleGradient: {
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.4)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
      marginBottom: 16,
    },
         battleTitleText: {
       fontSize: 28,
       fontWeight: '900',
       color: '#fff',
       textAlign: 'center',
       textShadowColor: 'rgba(0,0,0,0.6)',
       textShadowOffset: { width: 0, height: 2 },
       textShadowRadius: 4,
       letterSpacing: 0.8,
     },
     liveBattleContainer: {
       marginTop: 20,
       marginBottom: 10,
       alignItems: 'center',
     },
     liveBattleGradient: {
       borderRadius: 20,
       paddingVertical: 12,
       paddingHorizontal: 24,
       alignItems: 'center',
       flexDirection: 'row',
       borderWidth: 2,
       borderColor: 'rgba(255,255,255,0.4)',
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 4 },
       shadowOpacity: 0.3,
       shadowRadius: 8,
       elevation: 6,
     },
           liveBattleText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginLeft: 8,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 0.8,
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
       // Enhanced Opponent Found Styles
       foundTitle: {
         fontSize: 32,
         fontWeight: '900',
         color: '#fff',
         marginBottom: 8,
         textAlign: 'center',
         textShadowColor: 'rgba(0,0,0,0.6)',
         textShadowOffset: { width: 0, height: 3 },
         textShadowRadius: 6,
         letterSpacing: 1,
       },
       foundSubtitle: {
         fontSize: 18,
         color: 'rgba(255,255,255,0.9)',
         marginBottom: 40,
         textAlign: 'center',
         fontWeight: '600',
         textShadowColor: 'rgba(0,0,0,0.4)',
         textShadowOffset: { width: 0, height: 2 },
         textShadowRadius: 4,
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
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 2 },
         shadowOpacity: 0.2,
         shadowRadius: 4,
         elevation: 3,
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
         textShadowColor: 'rgba(0,0,0,0.3)',
         textShadowOffset: { width: 0, height: 1 },
         textShadowRadius: 2,
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

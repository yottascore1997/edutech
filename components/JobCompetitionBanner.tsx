import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface JobCompetitionBannerProps {
  onPress?: () => void;
}

const JobCompetitionBanner: React.FC<JobCompetitionBannerProps> = ({ onPress }) => {
  const raceAnimation = useRef(new Animated.Value(0)).current;
  const winnerAnimation = useRef(new Animated.Value(0)).current;
  const competitionPulse = useRef(new Animated.Value(1)).current;
  const crownAnimation = useRef(new Animated.Value(0)).current;
  const celebrationBurst = useRef(new Animated.Value(0)).current;
  const confettiAnimation = useRef(new Animated.Value(0)).current;
  const successGlow = useRef(new Animated.Value(0)).current;
  const firecracker1 = useRef(new Animated.Value(0)).current;
  const firecracker2 = useRef(new Animated.Value(0)).current;
  const firecracker3 = useRef(new Animated.Value(0)).current;
  const sparksAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Racing animation with celebration trigger
    const startRacing = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(raceAnimation, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          // Trigger celebration when winner reaches job
          Animated.timing(celebrationBurst, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(celebrationBurst, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(raceAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Winner celebration animation
    const startWinnerCelebration = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(winnerAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(winnerAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Competition pulse
    const startCompetitionPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(competitionPulse, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(competitionPulse, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Crown floating animation
    const startCrownAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(crownAnimation, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(crownAnimation, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Confetti burst animation
    const startConfettiAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(4000), // Start after winner reaches job
          Animated.timing(confettiAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Success glow animation
    const startSuccessGlow = () => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(4000), // Start when winner reaches job
          Animated.timing(successGlow, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(successGlow, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Firecracker animations - like real fireworks!
    const startFirecrackers = () => {
      // Firecracker 1 - shoots up and explodes
      Animated.loop(
        Animated.sequence([
          Animated.delay(4000), // Start when winner reaches job
          Animated.timing(firecracker1, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(firecracker1, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Firecracker 2 - delayed explosion
      Animated.loop(
        Animated.sequence([
          Animated.delay(4300), // Slightly delayed
          Animated.timing(firecracker2, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(firecracker2, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Firecracker 3 - final explosion
      Animated.loop(
        Animated.sequence([
          Animated.delay(4600), // Even more delayed
          Animated.timing(firecracker3, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(firecracker3, {
            toValue: 0,
            duration: 1300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Sparks flying animation
    const startSparksAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(4000),
          Animated.timing(sparksAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(sparksAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startRacing();
    startWinnerCelebration();
    startCompetitionPulse();
    startCrownAnimation();
    startConfettiAnimation();
    startSuccessGlow();
    startFirecrackers();
    startSparksAnimation();
  }, []);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      console.log('Job Competition banner pressed');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        <Animated.View
          style={[
            styles.bannerWrapper,
            {
              transform: [{ scale: competitionPulse }],
            },
          ]}
        >
          <LinearGradient
            colors={['#87CEEB', '#E0F6FF', '#87CEEB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Horizontal Racing Road */}
            <View style={styles.racingRoad}>
              {/* Road Surface */}
              <View style={styles.roadSurface} />
              
              {/* Road Center Lines */}
              <View style={styles.roadCenterLines}>
                {[...Array(8)].map((_, index) => (
                  <View key={index} style={styles.roadDash} />
                ))}
              </View>
              
              {/* YottaScore Road Paint */}
              <View style={styles.roadText}>
                <Text style={styles.paintedText}>YOTTASCORE</Text>
              </View>
              
              {/* Start Flag */}
              <View style={styles.startFlag}>
                <Text style={styles.flagText}>🏁</Text>
              </View>
              
              {/* Finish Target */}
              <View style={styles.finishTarget}>
                <View style={styles.targetCircle}>
                  <Text style={styles.goalText}>Your Goal</Text>
                </View>
              </View>
            </View>

            {/* Competition Background Pattern */}
            <View style={styles.backgroundPattern}>
              
              {/* Firecracker Explosions */}
              <View style={styles.firecrackerContainer}>
                {/* Firecracker 1 - Top Right */}
                <View style={styles.firecracker1Position}>
                  {[...Array(8)].map((_, index) => (
                    <Animated.View
                      key={`f1-${index}`}
                      style={[
                        styles.firecrackerSpark,
                        {
                          backgroundColor: ['#FFD700', '#FF4444', '#FF6B6B', '#FFA500'][index % 4],
                          transform: [{
                            translateX: firecracker1.interpolate({
                              inputRange: [0, 0.3, 1],
                              outputRange: [0, (30 + Math.random() * 40) * Math.cos(index * Math.PI / 4), 0],
                            })
                          }, {
                            translateY: firecracker1.interpolate({
                              inputRange: [0, 0.3, 1],
                              outputRange: [0, (30 + Math.random() * 40) * Math.sin(index * Math.PI / 4), 0],
                            })
                          }, {
                            scale: firecracker1.interpolate({
                              inputRange: [0, 0.3, 1],
                              outputRange: [0, 1.5, 0],
                            })
                          }],
                          opacity: firecracker1.interpolate({
                            inputRange: [0, 0.2, 0.6, 1],
                            outputRange: [0, 1, 1, 0],
                          }),
                        }
                      ]}
                    />
                  ))}
                </View>

                {/* Firecracker 2 - Center */}
                <View style={styles.firecracker2Position}>
                  {[...Array(10)].map((_, index) => (
                    <Animated.View
                      key={`f2-${index}`}
                      style={[
                        styles.firecrackerSpark,
                        {
                          backgroundColor: ['#4CAF50', '#2196F3', '#FFD700', '#FF6B6B'][index % 4],
                          transform: [{
                            translateX: firecracker2.interpolate({
                              inputRange: [0, 0.4, 1],
                              outputRange: [0, (35 + Math.random() * 50) * Math.cos(index * Math.PI / 5), 0],
                            })
                          }, {
                            translateY: firecracker2.interpolate({
                              inputRange: [0, 0.4, 1],
                              outputRange: [0, (35 + Math.random() * 50) * Math.sin(index * Math.PI / 5), 0],
                            })
                          }, {
                            scale: firecracker2.interpolate({
                              inputRange: [0, 0.4, 1],
                              outputRange: [0, 2, 0],
                            })
                          }],
                          opacity: firecracker2.interpolate({
                            inputRange: [0, 0.3, 0.7, 1],
                            outputRange: [0, 1, 1, 0],
                          }),
                        }
                      ]}
                    />
                  ))}
                </View>

                {/* Firecracker 3 - Left Side */}
                <View style={styles.firecracker3Position}>
                  {[...Array(6)].map((_, index) => (
                    <Animated.View
                      key={`f3-${index}`}
                      style={[
                        styles.firecrackerSpark,
                        {
                          backgroundColor: ['#9C27B0', '#E91E63', '#FFD700', '#FF8F00'][index % 4],
                          transform: [{
                            translateX: firecracker3.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0, (25 + Math.random() * 35) * Math.cos(index * Math.PI / 3), 0],
                            })
                          }, {
                            translateY: firecracker3.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0, (25 + Math.random() * 35) * Math.sin(index * Math.PI / 3), 0],
                            })
                          }, {
                            scale: firecracker3.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0, 1.8, 0],
                            })
                          }],
                          opacity: firecracker3.interpolate({
                            inputRange: [0, 0.4, 0.8, 1],
                            outputRange: [0, 1, 1, 0],
                          }),
                        }
                      ]}
                    />
                  ))}
                </View>

                {/* Flying Sparks */}
                <View style={styles.sparksContainer}>
                  {[...Array(15)].map((_, index) => (
                    <Animated.View
                      key={`spark-${index}`}
                      style={[
                        styles.flyingSpark,
                        {
                          left: `${Math.random() * 100}%`,
                          backgroundColor: ['#FFD700', '#FF4444', '#4CAF50', '#2196F3', '#9C27B0'][index % 5],
                          transform: [{
                            translateY: sparksAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -120 - Math.random() * 80],
                            })
                          }, {
                            translateX: sparksAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, (Math.random() - 0.5) * 100],
                            })
                          }, {
                            rotate: sparksAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', `${720 + Math.random() * 360}deg`],
                            })
                          }],
                          opacity: sparksAnimation.interpolate({
                            inputRange: [0, 0.2, 0.8, 1],
                            outputRange: [0, 1, 1, 0],
                          }),
                        }
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.content}>
              {/* Full Race Animation Container */}
              <View style={styles.fullRaceContainer}>
                <View style={styles.raceContainer}>
                  {/* Job Target with Crown */}
                  <View style={styles.jobTarget}>
                    <Animated.View
                      style={[
                        styles.crownContainer,
                        {
                          transform: [{
                            translateY: crownAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -8],
                            })
                          }]
                        }
                      ]}
                    >
                      <Ionicons name="diamond" size={16} color="#FFD700" />
                    </Animated.View>
                    
                    {/* Success Glow Effect */}
                    <Animated.View
                      style={[
                        styles.successGlowRing,
                        {
                          opacity: successGlow.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 0.8],
                          }),
                          transform: [{
                            scale: successGlow.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.5],
                            })
                          }]
                        }
                      ]}
                    />
                    
                    <Animated.View
                      style={[
                        styles.jobIconContainer,
                        {
                          transform: [{
                            scale: celebrationBurst.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.2],
                            })
                          }]
                        }
                      ]}
                    >
                      <LinearGradient
                        colors={['#4CAF50', '#2E7D32']}
                        style={styles.jobIcon}
                      >
                        <Ionicons name="briefcase" size={24} color="#fff" />
                      </LinearGradient>
                    </Animated.View>
                  </View>

                  {/* Racing Students */}
                  <View style={styles.racingStudents}>
                    {/* Winner Student */}
                    {/* Realistic Running Students */}
                    
                    {/* Winner Runner */}
                    <Animated.View
                      style={[
                        styles.runnerContainer,
                        styles.runner1,
                        {
                          transform: [{
                            translateX: raceAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 310],
                            })
                          }],
                        }
                      ]}
                    >
                      <View style={styles.runnerBody}>
                        <View style={styles.runnerHead}>
                          <Text style={styles.runnerFace}>😊</Text>
                        </View>
                        <View style={[styles.runnerTorso, { backgroundColor: '#4CAF50' }]}>
                          <Text style={styles.runnerNumber}>1</Text>
                        </View>
                        <View style={styles.runnerLegs}>
                          <View style={[styles.leg, styles.leftLeg]} />
                          <View style={[styles.leg, styles.rightLeg]} />
                        </View>
                      </View>
                      <Animated.View
                        style={[
                          styles.winnerCrown,
                          {
                            transform: [{ scale: crownAnimation }],
                          }
                        ]}
                      >
                        <Text style={styles.crownText}>👑</Text>
                      </Animated.View>
                    </Animated.View>

                    {/* Runner 2 */}
                    <Animated.View
                      style={[
                        styles.runnerContainer,
                        styles.runner2,
                        {
                          transform: [{
                            translateX: raceAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 250],
                            })
                          }],
                        }
                      ]}
                    >
                      <View style={styles.runnerBody}>
                        <View style={styles.runnerHead}>
                          <Text style={styles.runnerFace}>😅</Text>
                        </View>
                        <View style={[styles.runnerTorso, { backgroundColor: '#FF9800' }]}>
                          <Text style={styles.runnerNumber}>2</Text>
                        </View>
                        <View style={styles.runnerLegs}>
                          <View style={[styles.leg, styles.leftLeg]} />
                          <View style={[styles.leg, styles.rightLeg]} />
                        </View>
                      </View>
                    </Animated.View>

                    {/* Runner 3 */}
                    <Animated.View
                      style={[
                        styles.runnerContainer,
                        styles.runner3,
                        {
                          transform: [{
                            translateX: raceAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 200],
                            })
                          }],
                        }
                      ]}
                    >
                      <View style={styles.runnerBody}>
                        <View style={styles.runnerHead}>
                          <Text style={styles.runnerFace}>😰</Text>
                        </View>
                        <View style={[styles.runnerTorso, { backgroundColor: '#2196F3' }]}>
                          <Text style={styles.runnerNumber}>3</Text>
                        </View>
                        <View style={styles.runnerLegs}>
                          <View style={[styles.leg, styles.leftLeg]} />
                          <View style={[styles.leg, styles.rightLeg]} />
                        </View>
                      </View>
                    </Animated.View>

                    {/* Runner 4 */}
                    <Animated.View
                      style={[
                        styles.runnerContainer,
                        styles.runner4,
                        {
                          transform: [{
                            translateX: raceAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 100],
                            })
                          }],
                        }
                      ]}
                    >
                      <View style={styles.runnerBody}>
                        <View style={styles.runnerHead}>
                          <Text style={styles.runnerFace}>😫</Text>
                        </View>
                        <View style={[styles.runnerTorso, { backgroundColor: '#9C27B0' }]}>
                          <Text style={styles.runnerNumber}>4</Text>
                        </View>
                        <View style={styles.runnerLegs}>
                          <View style={[styles.leg, styles.leftLeg]} />
                          <View style={[styles.leg, styles.rightLeg]} />
                        </View>
                      </View>
                    </Animated.View>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    marginBottom: 8,
  },
  bannerWrapper: {
    borderRadius: 0,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  gradient: {
    height: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  racingRoad: {
    position: 'absolute',
    top: '15%',
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: '#666',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFF',
  },
  roadSurface: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#555',
  },
  roadCenterLines: {
    position: 'absolute',
    top: '48%',
    left: 0,
    right: 0,
    height: 3,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  roadDash: {
    width: 20,
    height: 2,
    backgroundColor: '#FFD700',
    opacity: 0.8,
  },
  startFlag: {
    position: 'absolute',
    left: 5,
    top: '5%',
    zIndex: 3,
  },
  flagText: {
    fontSize: 20,
  },
  finishTarget: {
    position: 'absolute',
    right: 5,
    top: '35%',
    zIndex: 3,
  },
  targetCircle: {
    width: 60,
    height: 25,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  goalText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  roadText: {
    position: 'absolute',
    top: '25%',
    left: '20%',
    right: '20%',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '0deg' }],
    zIndex: 2,
  },
  paintedText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    backgroundColor: 'transparent',
    textAlign: 'center',
    opacity: 0.8,
    fontFamily: 'System',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },

  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: '100%',
    zIndex: 2,
  },
  fullRaceContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  raceContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  jobTarget: {
    position: 'absolute',
    top: 10,
    right: 20,
    alignItems: 'center',
  },
  crownContainer: {
    marginBottom: 2,
  },
  successGlowRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFD700',
    top: -12,
    left: -12,
  },
  jobIconContainer: {
    zIndex: 2,
  },
  jobIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  firecrackerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  firecracker1Position: {
    position: 'absolute',
    top: '20%',
    right: '15%',
  },
  firecracker2Position: {
    position: 'absolute',
    top: '35%',
    left: '50%',
  },
  firecracker3Position: {
    position: 'absolute',
    top: '25%',
    left: '20%',
  },
  firecrackerSpark: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  sparksContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  flyingSpark: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    top: '70%',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  racingStudents: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '100%',
  },
  runnerContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
  },
  runnerBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FDBCB4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  runnerFace: {
    fontSize: 10,
  },
  runnerTorso: {
    width: 18,
    height: 20,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  runnerNumber: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFF',
  },
  runnerLegs: {
    flexDirection: 'row',
    marginTop: 2,
    justifyContent: 'space-between',
    width: 16,
  },
  leg: {
    width: 6,
    height: 12,
    backgroundColor: '#8D6E63',
    borderRadius: 3,
  },
  leftLeg: {
    marginRight: 2,
  },
  rightLeg: {
    marginLeft: 2,
  },
  runner1: {
    top: '25%',
    left: 10,
  },
  runner2: {
    top: '45%',
    left: 5,
  },
  runner3: {
    top: '35%',
    left: 15,
  },
  runner4: {
    top: '55%',
    left: 20,
  },
  winnerCrown: {
    position: 'absolute',
    top: -18,
    left: 5,
    zIndex: 4,
  },
  crownText: {
    fontSize: 12,
  },
});

export default JobCompetitionBanner;

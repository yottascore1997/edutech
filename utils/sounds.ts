import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

// Sound manager with actual audio playback using expo-av
// Uses online sound files that work on both iOS and Android
export class SoundManager {
  private static sounds: { [key: string]: Audio.Sound | null } = {
    matchFound: null,
    questionStart: null,
    answer: null,
  };

  // Initialize audio system
  static async initialize() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.log('Audio initialization error:', error);
    }
  }

  // Play match found sound - Victory/celebration sound
  static async playMatchFoundSound() {
    try {
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Play audio sound - try local file first, then fallback to online
      try {
        // Unload previous sound if exists
        if (this.sounds.matchFound) {
          await this.sounds.matchFound.unloadAsync();
        }

        // Try local sound file first
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/quiz.mp3'),
            { 
              shouldPlay: true, 
              volume: 0.8,
              isLooping: false 
            }
          );
          
          this.sounds.matchFound = sound;
          
          // Cleanup when finished
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
              this.sounds.matchFound = null;
            }
          });
        } catch (localError) {
          // If local file fails, try online URLs
          console.log('Local sound file failed, trying online:', localError);
          
          const soundUrls = [
            'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3',
            'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
          ];

          let soundCreated = false;
          for (const url of soundUrls) {
            try {
              const { sound } = await Audio.Sound.createAsync(
                { uri: url },
                { 
                  shouldPlay: true, 
                  volume: 0.8,
                  isLooping: false 
                }
              );
              
              this.sounds.matchFound = sound;
              soundCreated = true;
              
              sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                  sound.unloadAsync();
                  this.sounds.matchFound = null;
                }
              });
              break;
            } catch (urlError) {
              continue;
            }
          }

          if (!soundCreated) {
            console.log('All match found sound sources failed');
          }
        }
      } catch (audioError) {
        console.log('Match found audio error:', audioError);
      }
    } catch (error) {
      // Silent fail
    }
  }

  // Play question start sound - Timer/start sound
  static async playQuestionStartSound() {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Play audio sound - try local file first
      try {
        if (this.sounds.questionStart) {
          await this.sounds.questionStart.unloadAsync();
        }

        // Try local sound file first
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/quiz.mp3'),
            { 
              shouldPlay: true, 
              volume: 0.8,
              isLooping: false 
            }
          );
          
          this.sounds.questionStart = sound;
          
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
              this.sounds.questionStart = null;
            }
          });
        } catch (localError) {
          // Fallback to online
          console.log('Local sound file failed, trying online:', localError);
          
          const soundUrls = [
            'https://assets.mixkit.co/sfx/preview/mixkit-game-show-intro-331.mp3',
            'https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav',
          ];

          let soundCreated = false;
          for (const url of soundUrls) {
            try {
              const { sound } = await Audio.Sound.createAsync(
                { uri: url },
                { 
                  shouldPlay: true, 
                  volume: 0.6,
                  isLooping: false 
                }
              );
              
              this.sounds.questionStart = sound;
              soundCreated = true;
              
              sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                  sound.unloadAsync();
                  this.sounds.questionStart = null;
                }
              });
              break;
            } catch (urlError) {
              continue;
            }
          }

          if (!soundCreated) {
            console.log('All question start sound sources failed');
          }
        }
      } catch (audioError) {
        console.log('Question start audio error:', audioError);
      }
    } catch (error) {
      // Silent fail
    }
  }

  // Play answer sound - Click/selection sound
  static async playAnswerSound() {
    try {
      // Haptic feedback for instant response
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Play audio sound - try local file first
      try {
        if (this.sounds.answer) {
          await this.sounds.answer.unloadAsync();
          this.sounds.answer = null;
        }

        // Try local sound file first
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/quiz.mp3'),
            { 
              shouldPlay: true, 
              volume: 0.5,
              isLooping: false 
            }
          );
          
          this.sounds.answer = sound;
          
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
              this.sounds.answer = null;
            }
          });
        } catch (localError) {
          // Fallback to online
          console.log('Local sound file failed, trying online:', localError);
          
          const soundUrls = [
            'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3',
            'https://www.soundjay.com/misc/sounds/click-09.wav',
          ];

          let soundCreated = false;
          for (const url of soundUrls) {
            try {
              const { sound } = await Audio.Sound.createAsync(
                { uri: url },
                { 
                  shouldPlay: true, 
                  volume: 0.5,
                  isLooping: false 
                }
              );
              
              this.sounds.answer = sound;
              soundCreated = true;
              
              sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                  sound.unloadAsync();
                  this.sounds.answer = null;
                }
              });
              break;
            } catch (urlError) {
              continue;
            }
          }

          if (!soundCreated) {
            console.log('All answer sound sources failed');
          }
        }
      } catch (audioError) {
        console.log('Answer audio error:', audioError);
      }
    } catch (error) {
      // Silent fail
    }
  }

  // Cleanup all sounds
  static async cleanup() {
    try {
      for (const key in this.sounds) {
        if (this.sounds[key]) {
          try {
            await this.sounds[key]?.unloadAsync();
            this.sounds[key] = null;
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      }
    } catch (error) {
      // Silent fail
    }
  }
}


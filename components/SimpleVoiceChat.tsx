import { Audio } from 'expo-av';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

interface SimpleVoiceChatProps {
  roomId: string;
  userId: string;
  isMyTurn: boolean;
  currentTurn: number;
  onError?: (error: any) => void;
  onJoinSuccess?: () => void;
  onLeaveChannel?: () => void;
}

export default function SimpleVoiceChat({
  roomId,
  userId,
  isMyTurn,
  currentTurn,
  onError,
  onJoinSuccess,
  onLeaveChannel
}: SimpleVoiceChatProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Request audio permissions
  const requestAudioPermissions = async () => {
    try {
      console.log('🎤 Requesting audio permissions...');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission denied');
      }
      console.log('🎤 Audio permissions granted');
      return true;
    } catch (error) {
      console.error('🎤 Permission request failed:', error);
      setError('Audio permission denied');
      return false;
    }
  };

  // Initialize audio
  const initAudio = async () => {
    try {
      console.log('🎤 Initializing audio...');
      
      // Request permissions
      const hasPermission = await requestAudioPermissions();
      if (!hasPermission) {
        throw new Error('Audio permission denied');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      console.log('🎤 Audio initialized successfully');
      return true;

    } catch (error) {
      console.error('🎤 Failed to initialize audio:', error);
      setError(`Failed to initialize audio: ${error}`);
      setIsLoading(false);
      return false;
    }
  };

  // Join room (simplified)
  const joinRoom = async () => {
    try {
      console.log('🎤 Joining room:', roomId);
      setIsLoading(true);
      setError(null);

      // Initialize audio
      const audioReady = await initAudio();
      if (!audioReady) {
        throw new Error('Audio initialization failed');
      }

      // Simulate joining (in real app, you'd connect to your server)
      setTimeout(() => {
        setIsJoined(true);
        setIsLoading(false);
        onJoinSuccess?.();
        console.log('🎤 Successfully joined room');
      }, 1000);

    } catch (error) {
      console.error('🎤 Failed to join room:', error);
      setError(`Failed to join room: ${error}`);
      setIsLoading(false);
      onError?.(error);
    }
  };

  // Leave room
  const leaveRoom = async () => {
    try {
      console.log('🎤 Leaving room...');
      
      // Stop recording if active
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
        setIsRecording(false);
      }

      // Stop sound if playing
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      setIsJoined(false);
      onLeaveChannel?.();
      console.log('🎤 Left room successfully');

    } catch (error) {
      console.error('🎤 Failed to leave room:', error);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      if (!isMyTurn) {
        Alert.alert('Not Your Turn', 'Wait for your turn to speak');
        return;
      }

      console.log('🎤 Starting recording...');
      
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = newRecording;
      setRecording(newRecording);
      setIsRecording(true);
      setIsMuted(false);
      
      console.log('🎤 Recording started');

    } catch (error) {
      console.error('🎤 Failed to start recording:', error);
      setError(`Failed to start recording: ${error}`);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      console.log('🎤 Stopping recording...');
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      // In a real app, you would send this audio file to other players
      console.log('🎤 Recording saved to:', uri);
      
      // Send audio to other players via socket
      if (uri) {
        console.log('🎤 Sending audio to other players...');
        // In a real implementation, you would:
        // 1. Upload audio file to your server
        // 2. Send audio URL to other players via socket
        // 3. Other players would receive and play the audio
        
        // For now, we'll simulate this
        setTimeout(() => {
          console.log('🎤 Audio sent to all players in room');
        }, 500);
      }

      recordingRef.current = null;
      setRecording(null);
      setIsRecording(false);
      setIsMuted(true);
      
      console.log('🎤 Recording stopped');

    } catch (error) {
      console.error('🎤 Failed to stop recording:', error);
      setError(`Failed to stop recording: ${error}`);
    }
  };

  // Play received audio (simplified)
  const playReceivedAudio = async (audioUri: string) => {
    try {
      console.log('🎤 Playing received audio...');
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync();
          setSound(null);
        }
      });

    } catch (error) {
      console.error('🎤 Failed to play audio:', error);
      setError(`Failed to play audio: ${error}`);
    }
  };

  // Simulate receiving audio from other players
  const simulateAudioReceived = () => {
    // This would be called when other players send audio
    console.log('🎤 Simulating audio received from other player');
    // In real implementation, you would play the received audio
  };

  // Toggle microphone
  const toggleMicrophone = async () => {
    if (!isJoined) return;

    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  // Toggle speaker
  const toggleSpeaker = async () => {
    try {
      const newSpeakerState = !isSpeakerOn;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: !newSpeakerState,
        staysActiveInBackground: false,
      });
      setIsSpeakerOn(newSpeakerState);
      console.log('🎤 Speaker', newSpeakerState ? 'on' : 'off');
    } catch (error) {
      console.error('🎤 Failed to toggle speaker:', error);
    }
  };

  // Initialize on mount
  useEffect(() => {
    joinRoom();

    return () => {
      leaveRoom();
    };
  }, []);

  // Turn-based microphone control
  useEffect(() => {
    if (!isJoined) return;

    // If it's not your turn and you're recording, stop recording
    if (!isMyTurn && isRecording) {
      stopRecording();
    }
  }, [isMyTurn, isJoined]);

  return (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderRadius: 8,
      marginTop: 8
    }}>
      {/* Connection Status */}
      <View style={{ 
        width: 8, 
        height: 8, 
        borderRadius: 4, 
        backgroundColor: isJoined ? '#22c55e' : '#ef4444',
        marginRight: 8
      }} />
      
      <Text style={{ 
        color: 'white', 
        fontSize: 12, 
        marginRight: 12,
        fontWeight: '600'
      }}>
        {isJoined ? 'Connected' : isLoading ? 'Connecting...' : 'Disconnected'}
      </Text>

      {/* Microphone Control */}
      <TouchableOpacity
        onPress={toggleMicrophone}
        disabled={!isJoined || (!isMyTurn && !isRecording)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 6,
          backgroundColor: isRecording ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          borderWidth: 1,
          borderColor: isRecording ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
          marginRight: 8,
          opacity: (!isJoined || (!isMyTurn && !isRecording)) ? 0.5 : 1
        }}
      >
        {isRecording ? (
          <Mic color="#86efac" size={16} />
        ) : (
          <MicOff color="#fca5a5" size={16} />
        )}
        <Text style={{ 
          color: isRecording ? '#86efac' : '#fca5a5', 
          marginLeft: 4, 
          fontSize: 12,
          fontWeight: '600'
        }}>
          {isRecording ? 'Recording' : 'Tap to Speak'}
        </Text>
      </TouchableOpacity>

      {/* Speaker Control */}
      <TouchableOpacity
        onPress={toggleSpeaker}
        disabled={!isJoined}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 6,
          backgroundColor: isSpeakerOn ? 'rgba(34,197,94,0.2)' : 'rgba(107,114,128,0.2)',
          borderWidth: 1,
          borderColor: isSpeakerOn ? 'rgba(34,197,94,0.3)' : 'rgba(107,114,128,0.3)',
          opacity: !isJoined ? 0.5 : 1
        }}
      >
        {isSpeakerOn ? (
          <Volume2 color="#86efac" size={16} />
        ) : (
          <VolumeX color="#9ca3af" size={16} />
        )}
        <Text style={{ 
          color: isSpeakerOn ? '#86efac' : '#9ca3af', 
          marginLeft: 4, 
          fontSize: 12,
          fontWeight: '600'
        }}>
          {isSpeakerOn ? 'Speaker' : 'Earpiece'}
        </Text>
      </TouchableOpacity>

      {/* Error Display */}
      {error && (
        <View style={{ 
          position: 'absolute', 
          top: -30, 
          left: 0, 
          right: 0, 
          backgroundColor: 'rgba(239,68,68,0.9)', 
          padding: 8, 
          borderRadius: 4 
        }}>
          <Text style={{ color: 'white', fontSize: 12, textAlign: 'center' }}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import RtcEngine, {
    ChannelProfileType,
    ClientRoleType,
    RtcConnection,
    RtcStats
} from 'react-native-agora';

interface AgoraNativeVoiceChatProps {
  gameId: string;
  userId: string;
  userName: string;
  currentTurn: number;
  isMyTurn: boolean;
  timeLeft: number;
  participants: Array<{
    id: string;
    name: string;
    micOn: boolean;
    isCurrentTurn: boolean;
  }>;
  onTurnEnd?: () => void;
  onError?: (error: any) => void;
}

// Agora App ID - Replace with your actual App ID
const AGORA_APP_ID = '5a9df195-e82a-49cc-ba27-aaa41f0bb59b'; // Your existing API key
const CHANNEL_NAME = 'spy-game-voice-chat';

export default function AgoraNativeVoiceChat({
  gameId,
  userId,
  userName,
  currentTurn,
  isMyTurn,
  timeLeft,
  participants,
  onTurnEnd,
  onError
}: AgoraNativeVoiceChatProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const engine = useRef<RtcEngine | null>(null);

  // Initialize Agora Engine
  const initAgora = async () => {
    try {

      
      // Create Agora Engine
      engine.current = await RtcEngine.create(AGORA_APP_ID);
      
      if (!engine.current) {
        throw new Error('Failed to create Agora engine');
      }

      // Set channel profile to communication
      await engine.current.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      
      // Set client role to broadcaster
      await engine.current.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Enable audio
      await engine.current.enableAudio();

      // Register event handlers
      registerEventHandlers();

      setIsInitialized(true);

      
    } catch (error) {
      console.error('❌ Failed to initialize Agora:', error);
      onError?.(error);
    }
  };

  // Register Agora event handlers
  const registerEventHandlers = () => {
    if (!engine.current) return;

    // User joined channel
    engine.current.registerEventHandler({
      onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {

        setIsConnected(true);
        setIsJoined(true);
      },
      
      onLeaveChannel: (connection: RtcConnection, stats: RtcStats) => {

        setIsConnected(false);
        setIsJoined(false);
        setRemoteUsers([]);
      },
      
      onError: (err: number, msg: string) => {
        console.error('❌ Agora error:', err, msg);
        onError?.(err);
      },
      
      onUserJoined: (connection: RtcConnection, remoteUid: number, elapsed: number) => {

        setRemoteUsers(prev => [...prev, remoteUid]);
      },
      
      onUserOffline: (connection: RtcConnection, remoteUid: number, reason: number) => {

        setRemoteUsers(prev => prev.filter(uid => uid !== remoteUid));
      },
    });
  };

  // Join channel
  const joinChannel = async () => {
    if (!engine.current || !isInitialized) {
      Alert.alert('Error', 'Agora engine not initialized');
      return;
    }

    try {

      
      // Generate unique token (for testing, use null - in production use proper token)
      const token = null;
      
      await engine.current.joinChannel(
        token,
        CHANNEL_NAME,
        parseInt(userId.replace(/\D/g, '').slice(-8)) || Math.floor(Math.random() * 100000),
        {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishCameraTrack: false,
          publishMicrophoneTrack: true,
        }
      );
      
    } catch (error) {
      console.error('❌ Failed to join channel:', error);
      onError?.(error);
    }
  };

  // Leave channel
  const leaveChannel = async () => {
    if (!engine.current) return;

    try {

      await engine.current.leaveChannel();
    } catch (error) {
      console.error('❌ Failed to leave channel:', error);
    }
  };

  // Toggle microphone
  const toggleMic = async () => {
    if (!engine.current) return;

    try {
      if (micOn) {
        await engine.current.muteLocalAudioStream(true);
        setMicOn(false);

      } else {
        await engine.current.muteLocalAudioStream(false);
        setMicOn(true);

      }
    } catch (error) {
      console.error('❌ Failed to toggle mic:', error);
    }
  };

  // Toggle speaker
  const toggleSpeaker = async () => {
    if (!engine.current) return;

    try {
      await engine.current.setEnableSpeakerphone(!speakerOn);
      setSpeakerOn(!speakerOn);

    } catch (error) {
      console.error('❌ Failed to toggle speaker:', error);
    }
  };

  // End turn manually
  const endTurn = () => {
    if (isMyTurn) {
      onTurnEnd?.();
    }
  };

  // Initialize on mount
  useEffect(() => {
    initAgora();
    
    return () => {
      // Cleanup
      if (engine.current) {
        engine.current.destroy();
      }
    };
  }, []);

  // Auto-join when initialized
  useEffect(() => {
    if (isInitialized && !isJoined) {
      joinChannel();
    }
  }, [isInitialized, isJoined]);

  // Turn-based mic control
  useEffect(() => {
    if (engine.current && isJoined) {
      if (isMyTurn) {
        // Enable mic when it's my turn
        engine.current.muteLocalAudioStream(false);
        setMicOn(true);
      } else {
        // Mute mic when it's not my turn
        engine.current.muteLocalAudioStream(true);
        setMicOn(false);
      }
    }
  }, [isMyTurn, isJoined]);

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View style={{
        padding: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons 
              name={isConnected ? "mic" : "mic-off"} 
              size={24} 
              color={isConnected ? "#22c55e" : "#ef4444"} 
            />
            <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '600' }}>
              Agora Voice Chat
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isConnected ? '#22c55e' : '#ef4444',
              marginRight: 8
            }} />
            <Text style={{ color: '#fff', fontSize: 12 }}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Voice Chat Status */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons 
          name={isConnected ? "checkmark-circle" : "alert-circle"} 
          size={64} 
          color={isConnected ? "#22c55e" : "#f59e0b"} 
        />
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16, textAlign: 'center' }}>
          {isConnected ? 'Agora Voice Chat Active' : 'Connecting to Voice Chat...'}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
          {isConnected 
            ? `Connected to channel: ${CHANNEL_NAME}` 
            : 'Initializing Agora engine...'
          }
        </Text>
        
        {isConnected && (
          <Text style={{ color: '#22c55e', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
            {remoteUsers.length + 1} players in voice chat
          </Text>
        )}
      </View>

      {/* Controls */}
      <View style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}>
        {/* Turn Indicator */}
        {isMyTurn && (
          <View style={{
            backgroundColor: '#f59e0b',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            alignItems: 'center'
          }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              Your Turn - {timeLeft}s remaining
            </Text>
          </View>
        )}

        {/* Control Buttons */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          {/* Mic Button */}
          <TouchableOpacity
            onPress={toggleMic}
            disabled={!isConnected}
            style={{
              backgroundColor: micOn ? '#22c55e' : '#ef4444',
              padding: 16,
              borderRadius: 50,
              opacity: isConnected ? 1 : 0.5
            }}
          >
            <Ionicons 
              name={micOn ? "mic" : "mic-off"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>

          {/* Speaker Button */}
          <TouchableOpacity
            onPress={toggleSpeaker}
            disabled={!isConnected}
            style={{
              backgroundColor: speakerOn ? '#22c55e' : '#6b7280',
              padding: 16,
              borderRadius: 50,
              opacity: isConnected ? 1 : 0.5
            }}
          >
            <Ionicons 
              name={speakerOn ? "volume-high" : "volume-mute"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>

          {/* End Turn Button */}
          {isMyTurn && (
            <TouchableOpacity
              onPress={endTurn}
              style={{
                backgroundColor: '#ef4444',
                padding: 16,
                borderRadius: 50
              }}
            >
              <Ionicons name="stop" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Participants Count */}
        <View style={{
          marginTop: 16,
          alignItems: 'center'
        }}>
          <Text style={{ color: '#fff', fontSize: 14, opacity: 0.7 }}>
            {remoteUsers.length + 1} players connected
          </Text>
        </View>
      </View>
    </View>
  );
}


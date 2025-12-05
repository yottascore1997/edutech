import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RtcEngine, {
    ChannelProfileType,
    ClientRoleType,
    RtcConnection,
    RtcStats
} from 'react-native-agora';

interface SimpleAgoraVoiceProps {
  gameId: string;
  userId: string;
  userName: string;
  isMyTurn: boolean;
}

// Agora App ID
const AGORA_APP_ID = '5a9df195-e82a-49cc-ba27-aaa41f0bb59b';
const CHANNEL_NAME = 'spy-game-voice-chat';

export default function SimpleAgoraVoice({
  gameId,
  userId,
  userName,
  isMyTurn
}: SimpleAgoraVoiceProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const engine = useRef<RtcEngine | null>(null);

  // Initialize Agora Engine
  const initAgora = async () => {
    try {
      console.log('🎤 Initializing Agora Engine...');
      
      engine.current = await RtcEngine.create(AGORA_APP_ID);
      
      if (!engine.current) {
        throw new Error('Failed to create Agora engine');
      }

      await engine.current.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      await engine.current.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      await engine.current.enableAudio();

      // Register event handlers
      engine.current.addListener('JoinChannelSuccess', (channel, uid, elapsed) => {
        console.log('🎤 Successfully joined channel:', channel, 'uid:', uid);
        setIsConnected(true);
      });

      engine.current.addListener('UserJoined', (uid, elapsed) => {
        console.log('🎤 User joined:', uid);
      });

      engine.current.addListener('UserOffline', (uid, reason) => {
        console.log('🎤 User offline:', uid);
      });

      engine.current.addListener('Error', (err) => {
        console.error('🎤 Agora error:', err);
        Alert.alert('Voice Error', 'Voice chat connection failed');
      });

      setIsInitialized(true);
      console.log('🎤 Agora Engine initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Agora:', error);
      Alert.alert('Voice Error', 'Failed to initialize voice chat');
    }
  };

  // Join channel
  const joinChannel = async () => {
    if (!engine.current || !isInitialized) {
      Alert.alert('Error', 'Voice chat not ready');
      return;
    }

    try {
      console.log('🎤 Joining channel:', CHANNEL_NAME);
      
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
      Alert.alert('Voice Error', 'Failed to join voice room');
    }
  };

  // Leave channel
  const leaveChannel = async () => {
    if (!engine.current) return;

    try {
      console.log('🎤 Leaving channel...');
      await engine.current.leaveChannel();
      setIsConnected(false);
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
        console.log('🎤 Microphone muted');
      } else {
        await engine.current.muteLocalAudioStream(false);
        setMicOn(true);
        console.log('🎤 Microphone unmuted');
      }
    } catch (error) {
      console.error('❌ Failed to toggle mic:', error);
    }
  };

  // Toggle speaker
  const toggleSpeaker = async () => {
    if (!engine.current) return;

    try {
      if (speakerOn) {
        await engine.current.setEnableSpeakerphone(false);
        setSpeakerOn(false);
        console.log('🔊 Speaker off');
      } else {
        await engine.current.setEnableSpeakerphone(true);
        setSpeakerOn(true);
        console.log('🔊 Speaker on');
      }
    } catch (error) {
      console.error('❌ Failed to toggle speaker:', error);
    }
  };

  // Initialize when component mounts
  useEffect(() => {
    initAgora();
    
    return () => {
      if (engine.current) {
        engine.current.destroy();
      }
    };
  }, []);

  // Join channel when initialized
  useEffect(() => {
    if (isInitialized && !isConnected) {
      joinChannel();
    }
  }, [isInitialized]);

  return (
    <View style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 25,
      padding: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)'
    }}>
      {/* Microphone Button */}
      <TouchableOpacity
        onPress={toggleMic}
        disabled={!isConnected || !isMyTurn}
        style={{
          backgroundColor: micOn ? '#22c55e' : '#ef4444',
          padding: 12,
          borderRadius: 20,
          marginRight: 8,
          opacity: (!isConnected || !isMyTurn) ? 0.5 : 1
        }}
      >
        <Ionicons 
          name={micOn ? "mic" : "mic-off"} 
          size={20} 
          color="#fff" 
        />
      </TouchableOpacity>

      {/* Speaker Button */}
      <TouchableOpacity
        onPress={toggleSpeaker}
        disabled={!isConnected}
        style={{
          backgroundColor: speakerOn ? '#22c55e' : '#6b7280',
          padding: 12,
          borderRadius: 20,
          opacity: !isConnected ? 0.5 : 1
        }}
      >
        <Ionicons 
          name={speakerOn ? "volume-high" : "volume-mute"} 
          size={20} 
          color="#fff" 
        />
      </TouchableOpacity>
    </View>
  );
}



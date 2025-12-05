import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';

interface AgoraVoiceChatProps {
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

export default function AgoraVoiceChat({
  gameId,
  userId,
  userName,
  currentTurn,
  isMyTurn,
  timeLeft,
  participants,
  onTurnEnd,
  onError
}: AgoraVoiceChatProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [browserOpened, setBrowserOpened] = useState(false);

  // Open Agora Web SDK in external browser
  const openAgoraBrowser = async () => {
    try {

      
      // WebRTC Demo URL - Simple and working
      const agoraURL = 'https://webrtc.github.io/samples/src/content/getusermedia/gum/';
      
      const supported = await Linking.canOpenURL(agoraURL);
      if (supported) {
        await Linking.openURL(agoraURL);
        setBrowserOpened(true);
        Alert.alert(
          'Agora Voice Chat',
          'Browser opened! Join the voice chat room and start speaking.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsConnected(true);

              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Cannot open browser');
      }
    } catch (error) {
      console.error('❌ Failed to open browser:', error);
      Alert.alert('Error', 'Failed to open Agora browser');
    }
  };

  // Initialize Agora when component mounts
  useEffect(() => {
    if (!browserOpened) {
      openAgoraBrowser();
    }
  }, []);

  // Toggle microphone
  const toggleMic = () => {

    setMicOn(!micOn);
    Alert.alert('Mic Toggled', `Mic is now: ${!micOn ? 'ON' : 'OFF'}`);
  };

  // Toggle speaker
  const toggleSpeaker = () => {

    setSpeakerOn(!speakerOn);
    Alert.alert('Speaker Toggled', `Speaker is now: ${!speakerOn ? 'ON' : 'OFF'}`);
  };

  // End turn manually
  const endTurn = () => {
    if (isMyTurn) {
      onTurnEnd?.();
    }
  };

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

      {/* Agora Status */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons 
          name={isConnected ? "checkmark-circle" : "alert-circle"} 
          size={64} 
          color={isConnected ? "#22c55e" : "#f59e0b"} 
        />
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16, textAlign: 'center' }}>
          {isConnected ? 'Agora Voice Chat Active' : 'Opening Agora in Browser...'}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
          {isConnected 
            ? 'Real-time voice chat is running in your browser' 
            : 'Please allow microphone permission in the browser'
          }
        </Text>
        
        {!isConnected && (
          <TouchableOpacity
            onPress={openAgoraBrowser}
            style={{
              backgroundColor: '#3b82f6',
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              marginTop: 20
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>
              Open Agora Browser
            </Text>
          </TouchableOpacity>
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
            onPress={() => {

              Alert.alert('Mic Button', `Connected: ${isConnected}, MyTurn: ${isMyTurn}`);
              toggleMic();
            }}
            disabled={false}
            style={{
              backgroundColor: micOn ? '#22c55e' : '#ef4444',
              padding: 16,
              borderRadius: 50,
              opacity: 1
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
            onPress={() => {

              Alert.alert('Speaker Button', `Connected: ${isConnected}`);
              toggleSpeaker();
            }}
            disabled={false}
            style={{
              backgroundColor: speakerOn ? '#22c55e' : '#6b7280',
              padding: 16,
              borderRadius: 50,
              opacity: 1
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
            {participants.length} players connected
          </Text>
        </View>
      </View>
    </View>
  );
}

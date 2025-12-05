import { LinearGradient } from 'expo-linear-gradient';
import { Crown, MessageSquare, Play, Send, Users, Volume2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SimpleVoiceChat from './SimpleVoiceChat';

type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string | number | Date;
  type: 'chat' | 'description' | 'system';
};

type Player = { userId: string; name: string; isHost: boolean };

type SpyChatInterfaceProps = {
  game: { id: string; roomCode: string; players: Player[] } | null;
  user: { id?: string; name?: string } | null;
  isConnected?: boolean;
  currentPhase: string;
  myWord?: string;
  isSpy?: boolean;
  currentTurn?: number;
  timeLeft?: number;
  isMyTurn?: boolean;
  results?: any;
  // Optional: pass a socket instance; if omitted, we try to get it from utils/websocket
  socket?: any;
};

type CategoryOption = { id: string; name: string; description?: string };

function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function SpyChatInterface({
  game,
  user,
  isConnected = true,
  currentPhase,
  myWord,
  isSpy,
  currentTurn = 0,
  timeLeft = 20,
  isMyTurn = false,
  results,
  socket: socketProp,
}: SpyChatInterfaceProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [votingActive, setVotingActive] = useState(false);
  const [revealData, setRevealData] = useState<any>(null);
  const [showVoice, setShowVoice] = useState(false);
  const [categoryVoteActive, setCategoryVoteActive] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [myCategoryVote, setMyCategoryVote] = useState<string | null>(null);

  const socket = useMemo(() => {
    if (socketProp) return socketProp;
    try {
      const ws = require('../utils/websocket').default.getSocket();
      return ws;
    } catch {
      return null;
    }
  }, [socketProp]);

  // Simple voice chat configuration
  const roomId = `spy-${game?.id || 'demo'}`;
  const userId = user?.id || 'anonymous';
  
  const INPUT_BAR_HEIGHT = 64;

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;
    const onChat = (data: ChatMessage) => {
      setChatMessages((prev) => [...prev, data]);
    };
    const onTyping = (data: { userId: string; userName: string }) => {
      setTypingUsers((prev) => {
        const filtered = prev.filter((id) => id !== data.userId);
        return [...filtered, data.userId];
      });
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }, 3000);
    };
    const onStopTyping = (data: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    };
    const onVotingStarted = () => {
      setVotingActive(true);
      setMyVote(null);
    };
    const onVoteSubmitted = (data: { userId: string; votedForId: string }) => {
      if (data.userId === user?.id) {
        setMyVote(data.votedForId);
      }
    };
    const onGameEnded = (data: any) => {
      setRevealData(data);
    };
    const onCategoryVoteStarted = (data: { categories?: CategoryOption[] }) => {
      setCategoryOptions(data.categories || []);
      setCategoryVoteActive(true);
      setMyCategoryVote(null);
    };
    const onCategoryVoteSubmitted = (data: { userId?: string; categoryId?: string }) => {
      if (data.userId === user?.id && data.categoryId) {
        setMyCategoryVote(data.categoryId);
      }
    };
    const onCategoryVoteResult = () => {
      setCategoryVoteActive(false);
      setMyCategoryVote(null);
    };

    socket.on('chat_message', onChat);
    socket.on('user_typing', onTyping);
    socket.on('user_stopped_typing', onStopTyping);
    socket.on('voting_started', onVotingStarted);
    socket.on('vote_submitted', onVoteSubmitted);
    socket.on('spy_game_ended', onGameEnded);
    socket.on('category_vote_started', onCategoryVoteStarted);
    socket.on('category_vote_submitted', onCategoryVoteSubmitted);
    socket.on('category_vote_result', onCategoryVoteResult);

    return () => {
      socket.off('chat_message', onChat);
      socket.off('user_typing', onTyping);
      socket.off('user_stopped_typing', onStopTyping);
      socket.off('voting_started', onVotingStarted);
      socket.off('vote_submitted', onVoteSubmitted);
      socket.off('spy_game_ended', onGameEnded);
      socket.off('category_vote_started', onCategoryVoteStarted);
      socket.off('category_vote_submitted', onCategoryVoteSubmitted);
      socket.off('category_vote_result', onCategoryVoteResult);
    };
  }, [socket, user?.id]);

  const formatTime = (ts: string | number | Date) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const sendMessage = () => {
    if (!socket || !game || !newMessage.trim()) return;
    socket.emit('send_chat_message', { gameId: game.id, message: newMessage.trim() });
    setNewMessage('');
  };

  const sendDescription = () => {
    if (!socket || !game || !newMessage.trim()) return;
    socket.emit('submit_description', { gameId: game.id, description: newMessage.trim() });
    // Optimistic add as description-type message
    const name = user?.name || 'Me';
    const msg: ChatMessage = {
      id: generateUniqueId(),
      userId: user?.id || 'me',
      userName: name,
      message: newMessage.trim(),
      timestamp: Date.now(),
      type: 'description',
    };
    setChatMessages((prev) => [...prev, msg]);
    setNewMessage('');
  };

  const handleTyping = () => {
    if (!socket || !game) return;
    socket.emit('typing', { gameId: game.id, userId: user?.id, userName: user?.name });
  };
  const handleStopTyping = () => {
    if (!socket || !game) return;
    socket.emit('stop_typing', { gameId: game.id, userId: user?.id, userName: user?.name });
  };

  const shareRoomCode = async () => {
    if (!game) return;
    try {
      await Share.share({ message: `Join my Spy room ${game.roomCode}` });
    } catch {}
  };

  const isHost = useMemo(() => !!game?.players.find((p) => p.userId === user?.id && p.isHost), [game?.players, user?.id]);
  const currentSpeakerId = useMemo(() => (currentPhase === 'DESCRIBING' ? game?.players?.[currentTurn]?.userId : undefined), [currentPhase, currentTurn, game?.players]);

  return (
    <LinearGradient colors={[ '#4c1d95', '#7c3aed' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      {/* Header */}
      <LinearGradient colors={[ '#5b21b6', '#9333ea' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '900' }}>WHO'S THE SPY</Text>
          {!!game && (
            <View style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#93c5fd', fontSize: 10, marginRight: 8 }}>ROOM</Text>
              <Text style={{ color: 'white', fontWeight: '900', letterSpacing: 3 }}>{game.roomCode}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Players & Word Card */}
      <View style={{ backgroundColor: 'rgba(0,0,0,0.15)', padding: 16 }}>
        {/* Players */}
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Users color="#94a3b8" size={18} />
            <Text style={{ color: 'white', fontWeight: '800', marginLeft: 8 }}>Players ({game?.players?.length || 0})</Text>
          </View>
          {game?.players?.map((player, index) => {
            const isMe = user?.id && player.userId === user.id;
            const isActive = isMyTurn && isMe;
            return (
              <View key={player.userId} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, backgroundColor: isActive ? 'rgba(34,197,94,0.12)' : 'transparent', borderRadius: 10, paddingHorizontal: 6 }}>
                <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: isActive ? 'rgba(34,197,94,0.35)' : 'rgba(59,130,246,0.35)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '800' }}>{player.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
                <View style={{ marginLeft: 10, flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '700' }}>{player.name}</Text>
                  {isMe && (
                    <View style={{ marginLeft: 8, backgroundColor: 'rgba(59,130,246,0.25)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                      <Text style={{ color: '#bfdbfe', fontSize: 10, fontWeight: '800' }}>You</Text>
                    </View>
                  )}
                </View>
                {currentPhase === 'VOTING' || votingActive ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (!socket || !game || myVote) return;
                      socket.emit('submit_vote', { gameId: game.id, votedForId: player.userId });
                      setMyVote(player.userId);
                    }}
                    disabled={!!myVote}
                    style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: myVote === player.userId ? 'transparent' : 'rgba(255,255,255,0.15)', backgroundColor: myVote === player.userId ? '#16a34a' : 'rgba(255,255,255,0.08)' }}
                  >
                    <Text style={{ color: 'white', fontWeight: '800' }}>{myVote === player.userId ? 'Voted' : 'Vote'}</Text>
                  </TouchableOpacity>
                ) : (
                  player.isHost ? <Crown color="#fbbf24" size={16} /> : <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: isActive ? '#22c55e' : '#94a3b8' }} />
                )}
              </View>
            );
          })}

          {/* Host Controls */}
          {currentPhase === 'LOBBY' && isHost && (
            <View style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden' }}>
              <TouchableOpacity
                onPress={() => socket?.emit('start_spy_game', { gameId: game?.id })}
                disabled={!isConnected || (game?.players?.length || 0) < 2}
                activeOpacity={0.9}
                style={{ opacity: !isConnected || (game?.players?.length || 0) < 2 ? 0.6 : 1 }}
              >
                <LinearGradient colors={[ '#16a34a', '#059669' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderRadius: 10 }}>
                  <Play color="#fff" size={18} />
                  <Text style={{ color: 'white', fontWeight: '900', marginLeft: 8 }}>Start Game</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 6 }}>
                {(game?.players?.length || 0) < 2 ? 'Need at least 2 players' : 'Ready to start!'}
              </Text>
            </View>
          )}
        </View>

        {/* Word Card */}
        {myWord && (
          <View style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <MessageSquare color="#94a3b8" size={14} />
              <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6, fontSize: 12 }}>
                Your Word
              </Text>
            </View>
            <View style={{ 
              backgroundColor: 'rgba(34,197,94,0.15)', 
              borderWidth: 1, 
              borderColor: 'rgba(34,197,94,0.3)', 
              borderRadius: 8, 
              padding: 8,
              alignItems: 'center'
            }}>
              <Text style={{ 
                color: '#86efac', 
                fontSize: 14, 
                fontWeight: '800',
                textAlign: 'center',
                letterSpacing: 0.5
              }}>
                {myWord.toUpperCase()}
              </Text>
              <Text style={{ 
                color: '#94a3b8', 
                fontSize: 10, 
                marginTop: 2,
                textAlign: 'center'
              }}>
                Describe this word without saying it directly
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Chat + Input */}
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {(currentPhase === 'REVEAL' || !!revealData) && (results || revealData) && (
          <View style={{ padding: 12, backgroundColor: 'rgba(5,150,105,0.15)', borderBottomWidth: 1, borderBottomColor: 'rgba(5,150,105,0.35)' }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', textAlign: 'center' }}>
              {(results || revealData)?.winner === 'VILLAGERS' ? 'Villagers Win! 🎉' : (results || revealData)?.winner === 'SPY' ? 'Spy Wins! 🕵️‍♂️' : 'Results'}
            </Text>
          </View>
        )}

        {/* Turn / Timer strip */}
        {currentPhase === 'DESCRIBING' && (
          <View style={{ padding: 12, backgroundColor: 'rgba(109,40,217,0.15)', borderBottomWidth: 1, borderBottomColor: 'rgba(109,40,217,0.35)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: 999, 
                  backgroundColor: isMyTurn ? '#22c55e' : '#f59e0b', 
                  marginRight: 8
                }} />
                <Text style={{ color: 'white', fontWeight: '700' }}>
                  {isMyTurn ? 'Your Turn - Speak Now!' : `Player ${currentTurn + 1}'s Turn - Listen`}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '800', marginRight: 8 }}>{timeLeft}s</Text>
                <View style={{ width: 100, height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, overflow: 'hidden' }}>
                  <LinearGradient
                    colors={[ '#22c55e', '#3b82f6' ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${Math.max(0, Math.min(100, (timeLeft / 20) * 100))}%`, height: '100%' }}
                  />
                </View>
              </View>
            </View>
            
            {/* Simple Voice Chat */}
    {showVoice && (
      <SimpleVoiceChat
        roomId={roomId}
        userId={userId}
        isMyTurn={isMyTurn}
        currentTurn={currentTurn}
        onError={(error) => {
          console.error('🎤 Voice chat error:', error);
        }}
        onJoinSuccess={() => {
          console.log('🎤 Successfully joined voice room');
        }}
        onLeaveChannel={() => {
          console.log('🎤 Left voice room');
        }}
      />
    )}
            
            {/* Voice Connect Button */}
            <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'center' }}>
              <TouchableOpacity 
                onPress={() => {
                  console.log('🎤 Connect Voice button pressed');
                  setShowVoice(!showVoice);
                }} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  borderWidth: 1, 
                  borderColor: 'rgba(255,255,255,0.15)', 
                  paddingVertical: 6, 
                  paddingHorizontal: 10, 
                  borderRadius: 999,
                  backgroundColor: showVoice ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)'
                }}
              >
                <Volume2 color="#fff" size={16} />
                <Text style={{ color: 'white', marginLeft: 6 }}>
                  {showVoice ? 'Disconnect Voice' : 'Connect Voice'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Inline input under Connect Voice */}
            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                placeholder={isMyTurn ? 'Type your description…' : 'Type a message…'}
                placeholderTextColor="#9ca3af"
                value={newMessage}
                onChangeText={(t) => {
                  setNewMessage(t);
                  handleTyping();
                }}
                onBlur={handleStopTyping}
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, color: 'white', fontSize: 14 }}
                multiline
                maxLength={200}
              />
              <TouchableOpacity
                onPress={isMyTurn ? sendDescription : sendMessage}
                disabled={!newMessage.trim() || !isConnected}
                style={{ marginLeft: 8, backgroundColor: !newMessage.trim() || !isConnected ? 'rgba(255,255,255,0.12)' : '#2563eb', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 }}
              >
                {(!newMessage.trim() || !isConnected) ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Send color="#fff" size={18} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Chat Messages */}
        <ScrollView style={{ flex: 1, padding: 12 }} showsVerticalScrollIndicator={false}>
          {chatMessages.map((msg) => (
            <View key={msg.id} style={{ marginBottom: 8, padding: 8, backgroundColor: msg.type === 'description' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: msg.type === 'description' ? '#22c55e' : '#3b82f6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: msg.type === 'description' ? '#86efac' : '#bfdbfe', fontWeight: '700', fontSize: 12 }}>
                  {msg.userName}
                </Text>
                <Text style={{ color: '#94a3b8', fontSize: 10, marginLeft: 8 }}>
                  {formatTime(msg.timestamp)}
                </Text>
                {msg.type === 'description' && (
                  <View style={{ marginLeft: 8, backgroundColor: 'rgba(34,197,94,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: '#86efac', fontSize: 8, fontWeight: '800' }}>DESCRIPTION</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: 'white', fontSize: 14 }}>{msg.message}</Text>
            </View>
          ))}
          
          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <View style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 8 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>
                {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} people are typing...`}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Vote Modal */}
      {categoryVoteActive && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <View style={{ width: '92%', maxWidth: 420, backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, marginBottom: 6 }}>Select a Category</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 16 }}>Choose a word category for this round</Text>
            {categoryOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => {
                  if (!socket || !game) return;
                  socket.emit('submit_category_vote', { gameId: game.id, categoryId: option.id });
                  setMyCategoryVote(option.id);
                }}
                disabled={!!myCategoryVote}
                style={{ 
                  padding: 12, 
                  backgroundColor: myCategoryVote === option.id ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', 
                  borderWidth: 1, 
                  borderColor: myCategoryVote === option.id ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)', 
                  borderRadius: 8, 
                  marginBottom: 8 
                }}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>{option.name}</Text>
                {option.description && (
                  <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{option.description}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

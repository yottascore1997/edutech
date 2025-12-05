import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Copy, Crown, Mic, MicOff, Plus, Share2, Users, Volume2, VolumeX } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Share, Text, TouchableOpacity, View } from 'react-native';
import SpyChatInterface from '../../components/SpyChatInterfaceAgora';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useWebSocket } from '../../context/WebSocketContext';

export default function SpyRoom() {
  const params = useLocalSearchParams<{ id?: string; roomCode?: string; game?: string }>();
  const { isConnected, on, off } = useWebSocket();
  const { showError, showSuccess } = useToast();
  const { user } = useAuth();

  const initialPlayers = useMemo(() => {
    try {
      if (params.game) {
        const parsed = JSON.parse(params.game as string);
        if (parsed && Array.isArray(parsed.players)) return parsed.players;
      }
    } catch {}
    return [] as Array<{ userId: string; name: string; isHost: boolean; position?: number }>;
  }, [params.game]);
  const [players, setPlayers] = useState<Array<{ userId: string; name: string; isHost: boolean; position?: number }>>(initialPlayers);
  const initialMeta = useMemo(() => {
    try {
      if (params.game) {
        const parsed = JSON.parse(params.game as string);
        return { maxPlayers: parsed?.maxPlayers || 8 };
      }
    } catch {}
    return { maxPlayers: 8 };
  }, [params.game]);
  const [maxPlayers, setMaxPlayers] = useState<number>(initialMeta.maxPlayers);
  const initialPhase = useMemo(() => {
    try {
      if (params.game) {
        const parsed = JSON.parse(params.game as string);
        if (parsed?.currentPhase) return String(parsed.currentPhase).toUpperCase();
      }
    } catch {}
    return 'LOBBY';
  }, [params.game]);
  useEffect(() => {
    setPhase(initialPhase);
  }, [initialPhase]);

  const [myWord, setMyWord] = useState<string | undefined>(undefined);
  const [isSpy, setIsSpy] = useState<boolean | undefined>(undefined);
  const [results, setResults] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [phase, setPhase] = useState<string>('LOBBY');
  const [totalSeconds, setTotalSeconds] = useState<number>(120);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const endAtRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [readyByUserId, setReadyByUserId] = useState<Record<string, boolean>>({});
  const [micMuted, setMicMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  // Category vote UI state (handled at room level so it works in lobby too)
  const [categoryVoteActive, setCategoryVoteActive] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [myCategoryVote, setMyCategoryVote] = useState<string | null>(null);

  // Example: Subscribe to lobby updates if backend emits them
  useEffect(() => {
    const handleLobbyUpdate = (data: { players: Array<{ userId: string; name: string; isHost: boolean; position?: number }> }) => {
      setPlayers(data.players || []);
    };
    const uniquePlayers = (list: Array<{ userId: string; name: string; isHost: boolean; position?: number }>) => {
      const map = new Map<string, { userId: string; name: string; isHost: boolean; position?: number }>();
      (list || []).forEach((p) => {
        if (p?.userId) map.set(p.userId, p);
      });
      return Array.from(map.values());
    };
    const extractPlayers = (payload: any): Array<{ userId: string; name: string; isHost: boolean; position?: number }> => {
      if (!payload) return [];
      if (payload.game && Array.isArray(payload.game.players)) return payload.game.players;
      if (Array.isArray(payload.players)) return payload.players;
      if (Array.isArray(payload)) return payload;
      return [];
    };
    const handlePlayerJoined = (data: any) => {
      const next = extractPlayers(data);
      if (next.length) {
        setPlayers(uniquePlayers(next));
      } else if (data && data.player) {
        setPlayers((prev) => {
          const exists = prev.some((p) => p.userId === data.player.userId);
          return exists ? prev : uniquePlayers([...(prev || []), data.player]);
        });
      }
    };
    const handlePlayerLeft = (data: any) => {
      const next = extractPlayers(data);
      if (next.length) {
        setPlayers(uniquePlayers(next));
      } else if (data && data.player) {
        setPlayers((prev) => prev.filter((p) => p.userId !== data.player.userId));
      }
    };
    const handleGameJoined = (data: { gameId?: string; game?: { players?: any[] } }) => {
      const next = extractPlayers(data);
      if (next.length) setPlayers(uniquePlayers(next));
    };
    const handleTimerSync = (data: { totalSeconds?: number; remainingSeconds?: number; phase?: string; currentTurn?: number }) => {
      const t = typeof data.totalSeconds === 'number' ? Math.max(1, data.totalSeconds) : totalSeconds;
      const r = typeof data.remainingSeconds === 'number' ? Math.max(0, data.remainingSeconds) : remainingSeconds ?? 0;
      setTotalSeconds(t);
      setRemainingSeconds(r);
      if (data.phase) setPhase(String(data.phase).toUpperCase());
      if (typeof data.currentTurn === 'number') setCurrentTurn(data.currentTurn);
      endAtRef.current = Date.now() + r * 1000;
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        if (endAtRef.current == null) return;
        const secondsLeft = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
        setRemainingSeconds(secondsLeft);
        if (secondsLeft <= 0 && tickRef.current) {
          clearInterval(tickRef.current);
          tickRef.current = null;
        }
      }, 1000);
    };
    const handlePhaseChanged = (data: { phase: string; totalSeconds?: number; remainingSeconds?: number; currentTurn?: number }) => {
      setPhase(String(data.phase || '').toUpperCase());
      if (typeof data.totalSeconds === 'number' && typeof data.remainingSeconds === 'number') {
        handleTimerSync({ totalSeconds: data.totalSeconds, remainingSeconds: data.remainingSeconds, phase: data.phase });
      }
      if (typeof data.currentTurn === 'number') setCurrentTurn(data.currentTurn);
    };

    // Map website-style events to mobile state updates
    const handleTimerUpdate = (data: { currentTurn?: number; timeLeft?: number; totalSeconds?: number }) => {
      if (typeof data.currentTurn === 'number') setCurrentTurn(data.currentTurn);
      if (typeof data.timeLeft === 'number') setRemainingSeconds(Math.max(0, data.timeLeft));
      if (typeof data.totalSeconds === 'number') setTotalSeconds(Math.max(1, data.totalSeconds));
    };
    const handleVotingStarted = () => {
      setPhase('VOTING');
    };
    const handleDescriptionPhase = () => {
      setPhase('DESCRIBING');
    };
    const extractWord = (payload: any): string | undefined => {
      if (!payload) return undefined;
      if (typeof payload === 'string') return payload;
      if (typeof payload.word === 'string') return payload.word;
      if (typeof payload.myWord === 'string') return payload.myWord;
      if (typeof payload.secretWord === 'string') return payload.secretWord;
      if (typeof payload.data?.word === 'string') return payload.data.word;
      return undefined;
    };
    const handleWordAssigned = (data: any) => {

      const w = extractWord(data);

      if (typeof w === 'string') {
        setMyWord(w);

      }
      if (typeof data?.isSpy === 'boolean') {
        setIsSpy(data.isSpy);

      }
      setPhase('WORD_ASSIGNMENT');

    };
    const handleSpyRole = (data: any) => {
      if (typeof data?.isSpy === 'boolean') setIsSpy(data.isSpy);
      if (typeof data?.role === 'string') setIsSpy(String(data.role).toUpperCase() === 'SPY');
    };
    const handleGameEnded = (data: any) => {
      setResults(data || null);
      setPhase('REVEAL');
    };
    on('spy_lobby_update' as any, handleLobbyUpdate);
    on('player_joined_spy_game' as any, handlePlayerJoined);
    on('player_left_spy_game' as any, handlePlayerLeft);
    on('spy_slot_joined' as any, (data: any) => {

      if (data?.players) {
        setPlayers(data.players);
      }
      if (data?.message) {
        showSuccess(data.message);
      }
    });
    on('spy_game_joined' as any, handleGameJoined);
    on('spy_game_updated' as any, handleGameJoined);
    on('spy_timer_sync' as any, handleTimerSync);
    on('spy_phase_changed' as any, handlePhaseChanged);
    on('timer_update' as any, handleTimerUpdate);
    on('voting_started' as any, handleVotingStarted);
    on('description_phase_started' as any, handleDescriptionPhase);
    on('word_assigned' as any, handleWordAssigned);
    on('spy_word_assigned' as any, handleWordAssigned);
    on('assigned_word' as any, handleWordAssigned);
    on('your_word' as any, handleWordAssigned);
    on('private_word' as any, handleWordAssigned);
    on('spy_game_started' as any, (data: any) => {

      // Some servers emit at start with personal data
      const w = extractWord(data);

      if (typeof w === 'string') {
        setMyWord(w);

      }
      if (typeof data?.isSpy === 'boolean') {
        setIsSpy(data.isSpy);

      }
      setPhase('WORD_ASSIGNMENT');

    });
    on('spy_role' as any, handleSpyRole);
    on('spy_game_ended' as any, handleGameEnded);
    // Category voting (may start immediately after start game)
    on('category_vote_started' as any, (data: { categories?: Array<{ id: string; name: string; description?: string }>; timeoutSec?: number }) => {
      setCategoryOptions(Array.isArray(data?.categories) ? data.categories : []);
      setCategoryVoteActive(true);
      setMyCategoryVote(null);
    });
    on('category_vote_submitted' as any, (data: { userId?: string; categoryId?: string }) => {
      if (data?.userId && data.userId === user?.id && data?.categoryId) {
        setMyCategoryVote(data.categoryId);
      }
    });
    on('category_vote_result' as any, (_data: { categoryId?: string; categoryName?: string }) => {
      setCategoryVoteActive(false);
      setMyCategoryVote(null);
    });
    return () => {
      off('spy_lobby_update' as any);
      off('player_joined_spy_game' as any);
      off('player_left_spy_game' as any);
      off('spy_slot_joined' as any);
      off('spy_game_joined' as any);
      off('spy_game_updated' as any);
      off('spy_timer_sync' as any);
      off('spy_phase_changed' as any);
      off('timer_update' as any);
      off('voting_started' as any);
      off('description_phase_started' as any);
      off('word_assigned' as any);
      off('spy_word_assigned' as any);
      off('assigned_word' as any);
      off('your_word' as any);
      off('private_word' as any);
      off('spy_game_started' as any);
      off('spy_role' as any);
      off('spy_game_ended' as any);
      off('category_vote_started' as any);
      off('category_vote_submitted' as any);
      off('category_vote_result' as any);
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [on, off, totalSeconds, remainingSeconds]);

  const isHost = useMemo(() => players.find((p) => p.userId === user?.id)?.isHost === true, [players, user?.id]);

  const copyCode = async () => {
    try {
      await Share.share({ message: `Join my Spy room ${params.roomCode} on the app!` });
    } catch (e) {
      // no-op
    }
  };
  const inviteFriends = async () => {
    try {
      await Share.share({ message: `Play Who's the Spy with me! Room: ${params.roomCode}` });
    } catch {}
  };

  const startGame = () => {
    if (!isConnected) {
      showError('Not connected to server');
      return;
    }
    setIsStarting(true);
    try {
      const socket = require('../../utils/websocket').default.getSocket();
      if (!socket?.connected) throw new Error('Socket not connected');
      // Align with backend: website uses 'start_spy_game'
      socket.emit('start_spy_game', { gameId: params.id });
      showSuccess('Starting game...');
    } catch (e: any) {
      showError(e?.message || 'Failed to start');
    } finally {
      setIsStarting(false);
    }
  };

  const toggleReady = () => {
    const next = !readyByUserId[user?.id || 'me'];
    setReadyByUserId((prev) => ({ ...prev, [user?.id || 'me']: next }));
    try {
      const socket = require('../../utils/websocket').default.getSocket();
      socket?.emit('spy_player_ready', { gameId: params.id, ready: next });
    } catch {}
  };

  const joinSlot = (position: number) => {
    try {
      const socket = require('../../utils/websocket').default.getSocket();
      if (!socket?.connected) {
        showError('Not connected to server');
        return;
      }
      socket.emit('join_spy_slot', { 
        gameId: params.id, 
        position: position,
        userId: user?.id,
        userName: user?.name || 'Player'
      });
      showSuccess(`Joining slot ${position}...`);
    } catch (error) {
      showError('Failed to join slot');
    }
  };

  const renderPlayer = ({ item }: { item: { userId: string; name: string; isHost: boolean; position?: number } }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 12, marginBottom: 8 }}>
      {item.isHost ? <Crown color="#fbbf24" size={18} /> : <Users color="#94a3b8" size={18} />}
      <Text style={{ color: 'white', fontWeight: '700', marginLeft: 8 }}>{item.name}</Text>
      <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: '#22c55e' }} />
      </View>
    </View>
  );

  const renderLobby = () => {
    const displaySlots = Math.max(maxPlayers || 8, players.length);
    
    // Assign default positions to players who don't have them (backward compatibility)
    const playersWithPositions = players.map((player, index) => ({
      ...player,
      position: player.position || index + 1
    }));
    


    
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1020' }}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={[ '#4c1d95', '#7c3aed' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 12, flex: 1 }}>
          {/* Top header */}
          <LinearGradient colors={[ '#5b21b6', '#9333ea' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }}>
            <Text style={{ color: 'white', fontWeight: '900', textAlign: 'center', fontSize: 16 }}>WHO'S  THE  SPY</Text>
            <View style={{ marginTop: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#93c5fd', fontSize: 10, marginRight: 8 }}>ROOM CODE</Text>
                <Text style={{ color: 'white', fontFamily: 'System', fontWeight: '900', letterSpacing: 4 }}>{(params.roomCode || '').toString().toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={copyCode} style={{ marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.12)', padding: 8, borderRadius: 10 }}>
                <Copy color="#fff" size={16} />
              </TouchableOpacity>
              <TouchableOpacity onPress={inviteFriends} style={{ marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.12)', padding: 8, borderRadius: 10 }}>
                <Share2 color="#fff" size={16} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Players grid */}
          <View style={{ marginTop: 12 }}>
            <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(59,130,246,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 }}>
              <Text style={{ color: '#bfdbfe', fontWeight: '800', fontSize: 11 }}>PLAYERS</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {Array.from({ length: displaySlots }).map((_, idx) => {
              // Find player by position, or fallback to array index for backward compatibility
              const player = playersWithPositions.find(p => p.position === idx + 1) || playersWithPositions[idx];
              const width = '48%';
              const isMySlot = player?.userId === user?.id;
              const isSlotEmpty = !player;
              const canJoinSlot = isSlotEmpty && !playersWithPositions.find(p => p.userId === user?.id); // Can join if slot is empty and user not already in game
              
              if (player) {
                const isMe = player.userId === user?.id;
                const ready = readyByUserId[player.userId];
                const badgeText = player.isHost ? 'HOST' : ready ? 'READY' : 'WAITING';
                const badgeColor = player.isHost ? '#fde047' : ready ? '#34d399' : '#94a3b8';
                return (
                  <View key={player.userId} style={{ width, backgroundColor: 'rgba(30,41,59,0.65)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)', borderRadius: 14, padding: 12, marginBottom: 12 }}>
                    <View style={{ position: 'absolute', right: 8, top: 8, backgroundColor: badgeColor, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                      <Text style={{ color: '#0b1020', fontWeight: '900', fontSize: 10 }}>{badgeText}</Text>
                    </View>
                    <View style={{ position: 'absolute', left: 8, top: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>#{player.position || idx + 1}</Text>
                    </View>
                    <View style={{ width: 50, height: 50, borderRadius: 999, backgroundColor: isMe ? 'rgba(59,130,246,0.35)' : 'rgba(99,102,241,0.35)', alignItems: 'center', justifyContent: 'center', borderWidth: isMe ? 2 : 0, borderColor: '#60a5fa' }}>
                      <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>{player.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                    </View>
                    <Text style={{ color: 'white', fontWeight: '700', marginTop: 8 }}>{player.name}</Text>
                  </View>
                );
              }
              
              return (
                <TouchableOpacity 
                  key={`slot-${idx}`} 
                  onPress={() => canJoinSlot && joinSlot(idx + 1)}
                  disabled={!canJoinSlot}
                  style={{ 
                    width, 
                    borderStyle: 'dashed', 
                    borderWidth: 1, 
                    borderColor: canJoinSlot ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.2)', 
                    borderRadius: 14, 
                    padding: 12, 
                    marginBottom: 12, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: canJoinSlot ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)' 
                  }}
                >
                  <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>#{idx + 1}</Text>
                  </View>
                  <Plus color={canJoinSlot ? "#22c55e" : "#94a3b8"} size={22} />
                  <Text style={{ color: canJoinSlot ? "#22c55e" : "#94a3b8", fontSize: 12, marginTop: 4, fontWeight: canJoinSlot ? '700' : '400' }}>
                    {canJoinSlot ? 'Tap to Join' : 'Occupied'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <View style={{ marginTop: 4 }}>
            <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(16,185,129,0.30)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 }}>
              <Text style={{ color: '#d1fae5', fontWeight: '800', fontSize: 11 }}>ACTIONS</Text>
            </View>
            <TouchableOpacity onPress={inviteFriends} activeOpacity={0.9} style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
              <LinearGradient colors={[ '#60a5fa', '#6366f1' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '900' }}>Invite Friends</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={isHost ? startGame : toggleReady} activeOpacity={0.9} style={{ borderRadius: 12, overflow: 'hidden' }}>
              <LinearGradient colors={isHost ? [ '#f59e0b', '#ef4444' ] : [ '#22c55e', '#f59e0b' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '900' }}>{isHost ? 'Start Game' : (readyByUserId[user?.id || 'me'] ? 'Unready' : 'Get Ready')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Mission control */}
          <View style={{ marginTop: 12 }}>
            <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(147,51,234,0.30)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 }}>
              <Text style={{ color: '#ede9fe', fontWeight: '800', fontSize: 11 }}>MISSION CONTROL</Text>
            </View>
          </View>
          <View style={{ backgroundColor: 'rgba(17,24,39,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 12, padding: 10, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setSpeakerOn((v) => !v)} style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
              {speakerOn ? <Volume2 color="#fff" size={18} /> : <VolumeX color="#fff" size={18} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMicMuted((v) => !v)} style={{ width: 42, height: 42, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              {micMuted ? <MicOff color="#fff" size={18} /> : <Mic color="#fff" size={18} />}
            </TouchableOpacity>
            <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </View>
        </LinearGradient>
        {/* Category Vote Modal (shown even in lobby) */}
        {categoryVoteActive && (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <View style={{ width: '92%', maxWidth: 420, backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, marginBottom: 6 }}>Select a Category</Text>
              <Text style={{ color: '#d1d5db', fontSize: 12, marginBottom: 12 }}>Everyone votes. Majority wins. Random picks a random category.</Text>
              {categoryOptions.map((opt) => {
                const selected = myCategoryVote === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    disabled={!!myCategoryVote}
                    onPress={() => {
                      try {
                        if (!params?.id || myCategoryVote) return;
                        const socket = require('../../utils/websocket').default.getSocket();
                        socket?.emit('submit_category_vote', { gameId: params.id, categoryId: opt.id });
                        setMyCategoryVote(opt.id);
                      } catch {}
                    }}
                    style={{ paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: selected ? 'transparent' : 'rgba(255,255,255,0.12)', backgroundColor: selected ? '#16a34a' : 'rgba(255,255,255,0.05)', marginBottom: 8 }}
                  >
                    <Text style={{ color: 'white', fontWeight: '800' }}>{opt.name}</Text>
                    {!!opt.description && <Text style={{ color: '#cbd5e1', fontSize: 12, marginTop: 2 }}>{opt.description}</Text>}
                  </TouchableOpacity>
                );
              })}
              {!!myCategoryVote && (
                <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 6 }}>Vote submitted. Waiting for others…</Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return phase === 'LOBBY' ? renderLobby() : (
    <View style={{ flex: 1, backgroundColor: '#0b1020' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1 }}>
        <SpyChatInterface
          game={{ id: (params.id || '') as string, roomCode: (params.roomCode || '') as string, players }}
          user={user as any}
          isConnected={isConnected}
          currentPhase={phase}
          currentTurn={currentTurn}
          timeLeft={remainingSeconds ?? undefined}
          isMyTurn={players[currentTurn]?.userId === user?.id}
          myWord={myWord}
          isSpy={isSpy}
          results={results}
        />
      </View>
      {/* Category Vote Modal (also shown during in-game) */}
      {categoryVoteActive && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <View style={{ width: '92%', maxWidth: 420, backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, marginBottom: 6 }}>Select a Category</Text>
            <Text style={{ color: '#d1d5db', fontSize: 12, marginBottom: 12 }}>Everyone votes. Majority wins. Random picks a random category.</Text>
            {categoryOptions.map((opt) => {
              const selected = myCategoryVote === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  disabled={!!myCategoryVote}
                  onPress={() => {
                    try {
                      if (!params?.id || myCategoryVote) return;
                      const socket = require('../../utils/websocket').default.getSocket();
                      socket?.emit('submit_category_vote', { gameId: params.id, categoryId: opt.id });
                      setMyCategoryVote(opt.id);
                    } catch {}
                  }}
                  style={{ paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: selected ? 'transparent' : 'rgba(255,255,255,0.12)', backgroundColor: selected ? '#16a34a' : 'rgba(255,255,255,0.05)', marginBottom: 8 }}
                >
                  <Text style={{ color: 'white', fontWeight: '800' }}>{opt.name}</Text>
                  {!!opt.description && <Text style={{ color: '#cbd5e1', fontSize: 12, marginTop: 2 }}>{opt.description}</Text>}
                </TouchableOpacity>
              );
            })}
            {!!myCategoryVote && (
              <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 6 }}>Vote submitted. Waiting for others…</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}




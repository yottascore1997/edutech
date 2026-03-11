import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiFetchAuth, getImageUrl } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import StudyPartnerBottomNav from '@/components/StudyPartnerBottomNav';

interface User {
  id: string;
  name: string;
  profilePhoto: string | null;
  profilePicture?: string | null;
  photos?: string[] | null;
  course?: string | null;
  year?: number | null;
}

interface Message {
  id: string;
  content: string;
  messageType: string;
  fileUrl: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  isRead: boolean;
  createdAt: string;
  sender: User;
  receiver: User;
  isRequest?: boolean;
  requestId?: string;
}

interface MessageRequest {
  id: string;
  content: string;
  messageType: string;
  fileUrl: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  sender: User;
  receiver: User;
}

interface Conversation {
  user: User;
  latestMessage: Message | null;
  unreadCount: number;
}

/** Get first available profile image URL for display (profilePhoto, profilePicture, or photos[0]). Resolves relative paths. */
function getDisplayPhotoUrl(u: User | null | undefined): string | null {
  if (!u) return null;
  const raw =
    u.profilePhoto ||
    (u as any).profilePicture ||
    (Array.isArray((u as any).photos) && (u as any).photos[0]) ||
    null;
  if (!raw || !String(raw).trim()) return null;
  const s = String(raw).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return getImageUrl(s);
}

/** Same as chat-screen: fetch study-partner profile first (4 photos), then general profile. Returns first photo URL or null. */
async function fetchPhotoForUser(userId: string, token: string): Promise<string | null> {
  try {
    const spRes = await apiFetchAuth(`/student/study-partner/profile?userId=${userId}`, token);
    if (spRes?.ok) {
      const spData = spRes.data || spRes;
      const photos = Array.isArray(spData.photos) ? spData.photos : [];
      const first = photos[0];
      if (first && typeof first === 'string') return first;
    }
  } catch (_) {}
  try {
    const res = await apiFetchAuth(`/student/profile?userId=${userId}`, token);
    if (!res?.ok) return null;
    const data = res.data || res;
    const photo =
      data.profilePhoto ??
      data.profilePicture ??
      (Array.isArray(data.photos) && data.photos[0]) ??
      null;
    if (!photo) return null;
    return typeof photo === 'string' ? photo : (photo.url || photo);
  } catch (_) {
    return null;
  }
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messageRequests, setMessageRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const fetchedPhotoIds = useRef<Set<string>>(new Set());

  // Step 1: Page Initialization
  useEffect(() => {
    // 1. JWT token se current user ko decode karta hai
    const token = user?.token;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentUserData: User = {
          id: payload.userId,
          name: payload.name || 'User',
          profilePhoto: null,
          course: null,
          year: null
        };
        setCurrentUser(currentUserData);

      } catch (error) {
        console.error('❌ Error decoding JWT token:', error);
      }
    }
  }, [user?.token]);

  // Refresh conversations only when screen comes into focus (not on initial mount)
  useFocusEffect(
    useCallback(() => {
      if (user?.token && currentUser) {
        const now = Date.now();
        // Prevent refresh if last refresh was less than 2 seconds ago
        if (now - lastRefreshTime > 2000) {
          setLastRefreshTime(now);
          fetchConversations();
          fetchMessageRequests();
        }
      }
    }, [user?.token, currentUser, lastRefreshTime])
  );

  // Step 2: (Not used on list screen - tap opens chat-screen)
  // Step 3: Messages Fetch - used only when opening a chat; list screen just shows conversations

  // Step 3: Conversations Fetch - Like React website
  const fetchConversations = async () => {
    setLoading(true);
    try {

      const response = await apiFetchAuth('/student/messages', user?.token || '');

      
      if (response.ok) {
        // Handle both response.data and direct response cases
        const data = response.data || response;

        if (Array.isArray(data)) {
          const normalized = data.map((c: any) => {
            const u = c.user || {};
            const photo =
              u.profilePhoto ??
              u.profilePicture ??
              (Array.isArray(u.photos) && u.photos[0]) ??
              null;
            return {
              ...c,
              user: {
                ...u,
                profilePhoto: photo,
              },
            };
          });
          fetchedPhotoIds.current = new Set();
          setConversations(normalized);
        } else {
          setConversations([]);
        }
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      setConversations([
        {
          user: {
            id: 'user1',
            name: 'Sarah Johnson',
            profilePhoto: null
          },
          latestMessage: {
            id: 'msg1',
            content: 'Hey, check out this photo I took yesterday!',
            messageType: 'IMAGE',
            fileUrl: null,
            fileName: null,
            fileSize: null,
            fileType: null,
            isRead: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            sender: {
              id: 'user1',
              name: 'Sarah Johnson',
              profilePhoto: null
            },
            receiver: {
              id: 'currentUser',
              name: 'Current User',
              profilePhoto: null
            }
          },
          unreadCount: 3
        },
        {
          user: {
            id: 'user2',
            name: 'Mike Chen',
            profilePhoto: null
          },
          latestMessage: {
            id: 'msg2',
            content: 'I\'ve sent you the project proposal',
            messageType: 'DOCUMENT',
            fileUrl: null,
            fileName: null,
            fileSize: null,
            fileType: null,
            isRead: true,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            sender: {
              id: 'user2',
              name: 'Mike Chen',
              profilePhoto: null
            },
            receiver: {
              id: 'currentUser',
              name: 'Current User',
              profilePhoto: null
            }
          },
          unreadCount: 0
        },
        {
          user: {
            id: 'user3',
            name: 'Emma Wilson',
            profilePhoto: null
          },
          latestMessage: {
            id: 'msg3',
            content: 'Voice message (0:37)',
            messageType: 'VOICE',
            fileUrl: null,
            fileName: null,
            fileSize: null,
            fileType: null,
            isRead: false,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            sender: {
              id: 'user3',
              name: 'Emma Wilson',
              profilePhoto: null
            },
            receiver: {
              id: 'currentUser',
              name: 'Current User',
              profilePhoto: null
            }
          },
          unreadCount: 1
        },
        {
          user: {
            id: 'group1',
            name: 'Design Team',
            profilePhoto: null
          },
          latestMessage: {
            id: 'msg4',
            content: 'Alex: Let\'s meet at 3 PM to discuss the new features',
            messageType: 'TEXT',
            fileUrl: null,
            fileName: null,
            fileSize: null,
            fileType: null,
            isRead: true,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            sender: {
              id: 'alex',
              name: 'Alex Thompson',
              profilePhoto: null
            },
            receiver: {
              id: 'currentUser',
              name: 'Current User',
              profilePhoto: null
            }
          },
          unreadCount: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageRequests = async () => {
    try {
      const response = await apiFetchAuth('/student/message-requests', user?.token || '');
      if (response.ok) {
        const data = response.data || response;
        setMessageRequests(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching message requests:', error);
      setMessageRequests([]);
    }
  };

  const onRefresh = async () => {
    const now = Date.now();
    // Prevent refresh if last refresh was less than 1 second ago
    if (now - lastRefreshTime < 1000) {
      return;
    }
    
    setRefreshing(true);
    setLastRefreshTime(now);
    try {
      await fetchConversations();
      await fetchMessageRequests();
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Same as chat-screen: fetch photo (study-partner profile then profile) for users missing photo in list
  useEffect(() => {
    const token = user?.token;
    if (!token || conversations.length === 0) return;
    const needPhoto = conversations
      .filter((c) => !getDisplayPhotoUrl(c.user) && !fetchedPhotoIds.current.has(c.user.id))
      .slice(0, 8)
      .map((c) => c.user.id);
    if (needPhoto.length === 0) return;
    needPhoto.forEach((userId) => {
      fetchedPhotoIds.current.add(userId);
      fetchPhotoForUser(userId, token).then((photo) => {
        if (!photo) return;
        setConversations((prev) =>
          prev.map((c) =>
            c.user.id === userId
              ? { ...c, user: { ...c.user, profilePhoto: photo } }
              : c
          )
        );
      });
    });
  }, [conversations, user?.token]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 86400) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diff < 172800) {
      return 'Yesterday';
    } else if (diff < 604800) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getMessageIcon = (messageType: string) => {
    switch (messageType?.toUpperCase()) {
      case 'IMAGE':
        return <Ionicons name="image" size={16} color="#6B7280" />;
      case 'DOCUMENT':
        return <Ionicons name="document" size={16} color="#6B7280" />;
      case 'VOICE':
        return <Ionicons name="mic" size={16} color="#6B7280" />;
      case 'TEXT':
      default:
        return null;
    }
  };

  const searchLower = searchQuery.toLowerCase().trim();

  // Matches to show as profiles only (no latestMessage yet)
  const matchesWithoutMessages = conversations.filter(c => !c.latestMessage);
  const filteredMatchesWithoutMessages = matchesWithoutMessages.filter(c =>
    (c.user.name || '').toLowerCase().includes(searchLower),
  );

  // Regular chats list (only those having a latestMessage)
  const conversationsWithMessages = conversations.filter(c => !!c.latestMessage);
  const totalUnread = conversationsWithMessages.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const filteredConversations = conversationsWithMessages.filter(conversation => {
    const userName = conversation.user.name || '';
    const lastMessage = conversation.latestMessage?.content || '';
    
    // Search filter
    const matchesSearch = userName.toLowerCase().includes(searchLower) ||
                         lastMessage.toLowerCase().includes(searchLower);
    
    // Unread filter
    const hasUnread = showUnreadOnly ? conversation.unreadCount > 0 : true;
    
    return matchesSearch && hasUnread;
  });

  const renderConversation = ({ item }: { item: Conversation }) => {
    const displayPhoto = getDisplayPhotoUrl(item.user);
    return (
    <TouchableOpacity
      style={[styles.chatRow, item.unreadCount > 0 && styles.chatRowUnread]}
      activeOpacity={0.75}
      onPress={() => {
        router.push({
          pathname: '/(tabs)/chat-screen',
          params: {
            userId: item.user.id,
            userName: item.user.name,
            userProfilePhoto: displayPhoto || '',
            isFollowing: 'true',
          },
        } as any);
      }}
    >
      <View style={styles.avatarWrap}>
        {displayPhoto ? (
          <Image source={{ uri: displayPhoto }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={['#A78BFA', '#7C3AED']}
            style={styles.avatarPlaceholder}
          >
            <Text style={styles.avatarInitials}>
              {item.user.name ? item.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
            </Text>
          </LinearGradient>
        )}
        {item.unreadCount > 0 && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatTop}>
          <Text style={[styles.chatName, item.unreadCount > 0 && styles.chatNameUnread]} numberOfLines={1}>
            {item.user.name}
          </Text>
          <Text style={styles.chatTime}>
            {item.latestMessage ? formatTimestamp(item.latestMessage.createdAt) : ''}
          </Text>
        </View>
        <View style={styles.chatBottom}>
          <Text style={[styles.chatPreview, item.unreadCount > 0 && styles.chatPreviewUnread]} numberOfLines={1}>
            {item.latestMessage?.content || 'No messages yet'}
          </Text>
          {item.unreadCount > 0 ? (
            <LinearGradient colors={['#7C3AED', '#6D28D9']} style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </LinearGradient>
          ) : item.latestMessage?.sender?.id === currentUser?.id ? (
            <Ionicons
              name={item.latestMessage?.isRead ? 'checkmark-done' : 'checkmark'}
              size={18}
              color={item.latestMessage?.isRead ? '#10B981' : '#9CA3AF'}
            />
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
    );
  };

  const renderMatchProfile = ({ item }: { item: Conversation }) => {
    const displayPhoto = getDisplayPhotoUrl(item.user);
    return (
    <TouchableOpacity
      style={styles.matchChip}
      activeOpacity={0.85}
      onPress={() => {
        router.push({
          pathname: '/(tabs)/chat-screen',
          params: {
            userId: item.user.id,
            userName: item.user.name,
            userProfilePhoto: displayPhoto || '',
            isFollowing: 'true',
          },
        } as any);
      }}
    >
        <View style={styles.matchAvatarRing}>
        <View style={styles.matchAvatarWrap}>
          {displayPhoto ? (
            <Image source={{ uri: displayPhoto }} style={styles.matchAvatar} />
          ) : (
            <LinearGradient
              colors={['#C4B5FD', '#A78BFA']}
              style={styles.matchAvatarPlaceholder}
            >
              <Text style={styles.matchAvatarInitials}>
                {item.user.name
                  ? item.user.name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'U'}
              </Text>
            </LinearGradient>
          )}
        </View>
      </View>
      <Text style={styles.matchName} numberOfLines={1}>
        {item.user.name}
      </Text>
      <View style={styles.matchSayHiPill}>
        <Ionicons name="chatbubble-ellipses" size={10} color="#7C3AED" />
        <Text style={styles.matchSayHiText}>Say hi</Text>
      </View>
    </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <LinearGradient
          colors={['#F5F3FF', '#EDE9FE', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingScreen}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading your chats...</Text>
            <Text style={styles.loadingSubtext}>Just a moment</Text>
          </View>
        </View>
        <StudyPartnerBottomNav />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#F5F3FF', '#FFFFFF', '#FFFFFF']}
        style={styles.bgGradient}
      />

      {/* Top header like Tinder: title + icons */}
      <View style={styles.headerBar}>
        <Text style={styles.headerBarTitle}>Chat</Text>
        <View style={styles.headerBarIcons}>
          <TouchableOpacity activeOpacity={0.8} style={styles.headerCircleBtn}>
            <Ionicons name="shield-outline" size={18} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={styles.headerCircleBtn}>
            <Ionicons name="notifications-outline" size={18} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Matches without messages - premium strip */}
      {filteredMatchesWithoutMessages.length > 0 && (
        <View style={styles.matchesStripWrap}>
          <LinearGradient
            colors={['#F5F3FF', '#EDE9FE', '#FDF4FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.matchesStrip}
          >
            <View style={styles.matchesHeader}>
              <View style={styles.matchesHeaderLeft}>
                <View style={styles.matchesIconBadge}>
                  <Ionicons name="heart" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchesTitle}>New matches</Text>
                  <Text style={styles.matchesSubtitle}>Say hi — tap to start the conversation</Text>
                </View>
              </View>
              <LinearGradient
                colors={['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.matchesCountPill}
              >
                <Text style={styles.matchesCountText}>{filteredMatchesWithoutMessages.length}</Text>
              </LinearGradient>
            </View>
            <FlatList
              data={filteredMatchesWithoutMessages}
              keyExtractor={(item) => item.user.id}
              renderItem={renderMatchProfile}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.matchesList}
            />
          </LinearGradient>
        </View>
      )}

      {/* Chat list - card style */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.user.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.chatsHeaderWrap}>
            <View style={styles.messagesHeaderRow}>
              <Text style={styles.chatsHeaderTitle}>Messages</Text>
              {totalUnread > 0 && (
                <View style={styles.messagesBadge}>
                  <Text style={styles.messagesBadgeText}>{totalUnread}</Text>
                </View>
              )}
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubbles-outline" size={56} color="#A78BFA" />
            </View>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'No matches for your search.' : 'Match with study buddies and start the conversation — it feels great!'}
            </Text>
          </View>
        }
      />
      <StudyPartnerBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 12,
  },
  headerBarTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  headerBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    paddingVertical: 0,
  },
  matchesStrip: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.15)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  matchesStripWrap: {
    marginTop: Platform.OS === 'ios' ? 48 : 24,
  },
  matchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  matchesHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  matchesIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  matchesTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.2,
  },
  matchesSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  matchesCountPill: {
    minWidth: 36,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  matchesCountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  matchesList: {
    paddingRight: 4,
  },
  matchChip: {
    width: 88,
    marginRight: 16,
    alignItems: 'center',
  },
  matchAvatarRing: {
    padding: 3,
    borderRadius: 38,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  matchAvatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  matchAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  matchAvatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchAvatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  matchName: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  matchSayHiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    gap: 4,
  },
  matchSayHiText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
    flexGrow: 1,
  },
  chatsHeaderWrap: {
    marginBottom: 14,
  },
  messagesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatsHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  messagesBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  chatRowUnread: {
    backgroundColor: '#FAF5FF',
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.08,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#EDE9FE',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  chatContent: {
    flex: 1,
    minWidth: 0,
  },
  chatTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  chatNameUnread: {
    fontWeight: '800',
    color: '#5B21B6',
  },
  chatTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 8,
  },
  chatBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatPreview: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  chatPreviewUnread: {
    color: '#4B5563',
    fontWeight: '500',
  },
  unreadBadge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    paddingVertical: 32,
    paddingHorizontal: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  loadingText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  emptyContainer: {
    paddingVertical: 64,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});


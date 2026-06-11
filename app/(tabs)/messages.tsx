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
import { useScreenLoadState } from '@/hooks/useScreenLoadState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SP_BG = ['#EDE9FE', '#FDF2F8', '#FAFAFF'] as const;
const PRIMARY = '#6344D4';

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
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messageRequests, setMessageRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const fetchedPhotoIds = useRef<Set<string>>(new Set());
  const { beginFetch, endFetch, shouldBlockUI, hasLoadedOnceRef } = useScreenLoadState();

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
              }
    }
  }, [user?.token]);

  // Refresh conversations when screen comes into focus (background refresh after first load)
  useFocusEffect(
    useCallback(() => {
      if (!user?.token) return;
      const now = Date.now();
      if (now - lastRefreshTime > 2000) {
        setLastRefreshTime(now);
        fetchConversations(hasLoadedOnceRef.current);
        fetchMessageRequests();
      }
    }, [user?.token, lastRefreshTime])
  );

  // Step 2: (Not used on list screen - tap opens chat-screen)
  // Step 3: Messages Fetch - used only when opening a chat; list screen just shows conversations

  // Step 3: Conversations Fetch - Like React website
  const fetchConversations = async (background = false) => {
    beginFetch(setLoading, setRefreshing, { refresh: background });
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
      endFetch(setLoading, setRefreshing);
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
            setMessageRequests([]);
    }
  };

  const onRefresh = async () => {
    const now = Date.now();
    if (now - lastRefreshTime < 1000) {
      return;
    }

    setLastRefreshTime(now);
    try {
      await fetchConversations(true);
      await fetchMessageRequests();
    } catch (error) {
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
        return <Ionicons name="image" size={15} color={PRIMARY} />;
      case 'DOCUMENT':
        return <Ionicons name="document" size={15} color={PRIMARY} />;
      case 'VOICE':
        return <Ionicons name="mic" size={15} color={PRIMARY} />;
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

  const previewText = (item: Conversation) => {
    const msg = item.latestMessage;
    if (!msg) return 'Tap to open chat';
    const type = msg.messageType?.toUpperCase();
    if (type === 'IMAGE') return 'Photo';
    if (type === 'DOCUMENT') return 'Document';
    return msg.content || 'Message';
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const displayPhoto = getDisplayPhotoUrl(item.user);
    const unread = item.unreadCount > 0;
    const msgIcon = item.latestMessage ? getMessageIcon(item.latestMessage.messageType) : null;
    return (
    <TouchableOpacity
      style={[styles.chatRow, unread && styles.chatRowUnread]}
      activeOpacity={0.7}
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
      <View style={[styles.avatarWrap, unread && styles.avatarWrapUnread]}>
        {displayPhoto ? (
          <Image source={{ uri: displayPhoto }} style={styles.avatar} />
        ) : (
          <LinearGradient colors={['#C4B5FD', '#8E78E7', PRIMARY]} style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {item.user.name ? item.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
            </Text>
          </LinearGradient>
        )}
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatTop}>
          <Text style={[styles.chatName, unread && styles.chatNameUnread]} numberOfLines={1}>
            {item.user.name}
          </Text>
          <Text style={[styles.chatTime, unread && styles.chatTimeUnread]}>
            {item.latestMessage ? formatTimestamp(item.latestMessage.createdAt) : ''}
          </Text>
        </View>
        <View style={styles.chatBottom}>
          {msgIcon ? <View style={styles.previewIcon}>{msgIcon}</View> : null}
          <Text style={[styles.chatPreview, unread && styles.chatPreviewUnread]} numberOfLines={1}>
            {item.latestMessage?.sender?.id === currentUser?.id ? 'You: ' : ''}
            {previewText(item)}
          </Text>
          {unread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
            </View>
          ) : item.latestMessage?.sender?.id === currentUser?.id ? (
            <Ionicons
              name={item.latestMessage?.isRead ? 'checkmark-done' : 'checkmark'}
              size={16}
              color={item.latestMessage?.isRead ? PRIMARY : '#9CA3AF'}
            />
          ) : null}
        </View>
      </View>
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
        <Ionicons name="chatbubble-ellipses" size={10} color={PRIMARY} />
        <Text style={styles.matchSayHiText}>Say hi</Text>
      </View>
    </TouchableOpacity>
    );
  };

  const listHeader = (
    <>
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={PRIMARY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search chats…"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !showUnreadOnly && styles.filterChipActive]}
          onPress={() => setShowUnreadOnly(false)}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterChipText, !showUnreadOnly && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, showUnreadOnly && styles.filterChipActive]}
          onPress={() => setShowUnreadOnly(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterChipText, showUnreadOnly && styles.filterChipTextActive]}>
            Unread
          </Text>
          {totalUnread > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {filteredMatchesWithoutMessages.length > 0 ? (
        <View style={styles.matchesStripWrap}>
          <LinearGradient colors={['#FFFFFF', '#FAF5FF']} style={styles.matchesStrip}>
            <View style={styles.matchesHeader}>
              <View style={styles.matchesHeaderLeft}>
                <LinearGradient colors={['#EC4899', '#F472B6']} style={styles.matchesIconBadge}>
                  <Ionicons name="heart" size={16} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchesTitle}>New matches</Text>
                  <Text style={styles.matchesSubtitle}>Tap to say hi</Text>
                </View>
              </View>
              <View style={styles.matchesCountPill}>
                <Text style={styles.matchesCountText}>{filteredMatchesWithoutMessages.length}</Text>
              </View>
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
      ) : null}

      <View style={styles.chatsHeaderWrap}>
        <Text style={styles.chatsHeaderTitle}>Conversations</Text>
        <Text style={styles.chatsHeaderCount}>
          {filteredConversations.length} chat{filteredConversations.length === 1 ? '' : 's'}
        </Text>
      </View>
    </>
  );

  if (shouldBlockUI(loading)) {
    return (
      <View style={styles.screen}>
        <LinearGradient colors={[...SP_BG]} style={StyleSheet.absoluteFill} />
        <View style={[styles.loadingScreen, { paddingTop: insets.top }]}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Loading chats…</Text>
          </View>
        </View>
        <StudyPartnerBottomNav />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[...SP_BG]} style={styles.bgGradient} />

      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.headerBarTitle}>Messages</Text>
          <Text style={styles.headerBarSubtitle}>Study buddies & chats</Text>
        </View>
        {totalUnread > 0 ? (
          <View style={styles.headerUnreadPill}>
            <Text style={styles.headerUnreadText}>{totalUnread} new</Text>
          </View>
        ) : null}
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.user.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} tintColor={PRIMARY} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubbles" size={48} color={PRIMARY} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No results' : showUnreadOnly ? 'All caught up!' : 'No chats yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try another name or message.'
                : showUnreadOnly
                  ? 'You have read all messages.'
                  : 'Find a study buddy and start chatting.'}
            </Text>
            {!searchQuery && !showUnreadOnly ? (
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => router.push('/(tabs)/study-partner' as any)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#8E78E7', PRIMARY]} style={styles.emptyCtaGrad}>
                  <Ionicons name="people" size={20} color="#fff" />
                  <Text style={styles.emptyCtaText}>Find study buddies</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
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
    backgroundColor: '#FAFAFF',
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerBarTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F0A1E',
  },
  headerBarSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  headerUnreadPill: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  headerUnreadText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  searchWrap: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: '#E8E8F0',
  },
  filterChipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#fff',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: PRIMARY,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    paddingVertical: 0,
  },
  matchesStrip: {
    marginBottom: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    overflow: 'hidden',
  },
  matchesStripWrap: {
    marginBottom: 4,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#F3EEFF',
  },
  matchesCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: PRIMARY,
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
    color: PRIMARY,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    flexGrow: 1,
  },
  chatsHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chatsHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F0A1E',
  },
  chatsHeaderCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  chatRowUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C4B5FD',
    borderWidth: 1.5,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatarWrapUnread: {
    padding: 2,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
  },
  previewIcon: {
    marginRight: 2,
  },
  chatContent: {
    flex: 1,
    minWidth: 0,
  },
  chatTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F0A1E',
    flex: 1,
  },
  chatNameUnread: {
    fontWeight: '800',
    color: PRIMARY,
  },
  chatTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 8,
  },
  chatTimeUnread: {
    color: PRIMARY,
  },
  chatBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatPreview: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
  },
  chatPreviewUnread: {
    color: '#334155',
    fontWeight: '600',
  },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: PRIMARY,
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
    paddingVertical: 28,
    paddingHorizontal: 36,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
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
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },
  emptyCta: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  emptyCtaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  emptyCtaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});


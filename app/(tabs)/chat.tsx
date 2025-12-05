import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
  messageType: string;
  sender?: any;
  receiver?: any;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { 
    isConnected, 
    joinChat, 
    sendMessage: wsSendMessage, 
    sendTypingIndicator, 
    markMessageAsRead,
    on: wsOn,
    off: wsOff
  } = useWebSocket();

  const route = useRoute();
  const { userId, userName, messages: initialMessages } = route.params as { 
    userId: string; 
    userName: string; 
    messages: any[] 
  };
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [chatId, setChatId] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch messages from API when chat screen loads
  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId || !user?.token) return;
      
      setLoading(true);
      try {

        const response = await apiFetchAuth(`/student/messages/${userId}`, user.token);
        
        if (response.ok) {
          const data = response.data || response;

          
          if (Array.isArray(data)) {
            // Sort messages by creation time
            const sortedMessages = data.sort((a: Message, b: Message) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            
            setMessages(sortedMessages);

          } else {

            setMessages([]);
          }
        } else {

          setMessages([]);
        }
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [userId, user?.token]);

  // Generate chat ID for WebSocket room
  useEffect(() => {
    if (user?.id && userId) {
      const sortedIds = [user.id, userId].sort();
      const generatedChatId = `${sortedIds[0]}-${sortedIds[1]}`;
      setChatId(generatedChatId);
    }
  }, [user?.id, userId]);

  useEffect(() => {
    if (isConnected) {

    } else {

    }
  }, [isConnected]);

  // WebSocket connection and event handlers
  useFocusEffect(
    useCallback(() => {
      if (!chatId) return;

      // Join chat room
      if (isConnected) {
        joinChat(chatId);

      }

      // Step 5: Real-time Updates - Like React website
      // 1. New message receive karne par
      const handleNewMessage = (newMessage: any) => {

        
        // Add null checks to prevent the error
        if (!newMessage || !newMessage.sender || !newMessage.sender.id) {

          return;
        }
        
        // Check if this message is for the currently selected user
        if (userId && 
            (newMessage.sender.id === userId || 
             newMessage.receiver?.id === userId)) {
          // Current chat mai hai to message add karta hai

          setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (!exists) {
              return [...prev, newMessage];
            }
            return prev;
          });
          
          // Auto-scroll to bottom for new message
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
          
          // Mark as read if it's from other user
          if (user?.id && newMessage.sender.id !== user.id) {
            markMessageAsRead(user.id, newMessage.sender.id);
          }
        } else {
          // Dusre chat ka message hai to conversations update karta hai

          // Note: In React Native, we'll refresh conversations when user goes back
        }
      };

      // 2. Message read status update karne par
      const handleMessagesRead = ({ readerId }: { readerId: string }) => {

        if (userId && userId === readerId) {
          setMessages(prev =>
            prev.map(msg => 
              msg.sender?.id === user?.id ? { ...msg, isRead: true } : msg
            )
          );
        }
      };

      wsOn('new_message', handleNewMessage);
      wsOn('messages_were_read', handleMessagesRead);

      // Handle typing indicators
      wsOn('user_typing', (typingUserId: string) => {
        if (typingUserId === userId) {
          setOtherUserTyping(true);
        }
      });

      wsOn('user_stopped_typing', (typingUserId: string) => {
        if (typingUserId === userId) {
          setOtherUserTyping(false);
        }
      });

      // Cleanup
      return () => {
        wsOff('new_message');
        wsOff('messages_were_read');
        wsOff('user_typing');
        wsOff('user_stopped_typing');
      };
    }, [chatId, userId, isConnected, joinChat, markMessageAsRead, wsOn, wsOff, user?.id])
  );

  // Handle typing with debounce
  const handleTyping = useCallback((text: string) => {
    setNewMessage(text);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    if (text.length > 0 && isConnected) {
      sendTypingIndicator(chatId, true);
    }

    // Stop typing indicator after delay
    typingTimeoutRef.current = setTimeout(() => {
      if (isConnected) {
        sendTypingIndicator(chatId, false);
      }
    }, 1000);
  }, [chatId, isConnected, sendTypingIndicator]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Send message function - Like React website
  const sendMessage = async () => {
    if (!userId || !newMessage.trim() || !user) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    // 1. Optimistic message create karta hai (immediate UI update)
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content,
      messageType: 'TEXT',
      senderId: user.id,
      receiverId: userId,
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: {
        id: user.id,
        name: user.name,
        profilePhoto: user.profilePhoto
      },
      receiver: {
        id: userId,
        name: userName,
        profilePhoto: null
      }
    };

    // 2. UI mai immediately show karta hai
    setMessages(prev => [...prev, optimisticMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // 3. API call karta hai
      const response = await apiFetchAuth('/student/messages', user.token, {
        method: 'POST',
        body: {
          receiverId: userId,
          content: content,
        }
      });

      if (response.ok) {
        const result = response.data || response;

        if (result.type === 'direct' || result.message) {
          // 4. Optimistic message ko real message se replace karta hai
          if (result.message) {
            setMessages(prev => prev.map(msg => 
              msg.id === optimisticMessage.id ? result.message : msg
            ));
          }
          
          // 5. Conversations update karta hai (if we had access to fetchConversations)
          // Note: In React Native, we'll need to refresh conversations when user goes back
          
                     // 6. Socket event emit karta hai real-time delivery ke liye
           if (isConnected) {
             const chatId = [user.id, userId].sort().join('-');
             wsSendMessage({
               content: content,
               receiverId: userId,
               messageType: 'text',
               sender: {
                 id: user.id,
                 name: user.name,
                 profilePhoto: user.profilePhoto
               }
             });
           }
        }
      } else {
        console.error('API error:', response);
        // Error case mai optimistic message remove karta hai
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      }
    } catch (error) {
      console.error('Send message error:', error);
      // Error case mai optimistic message remove karta hai
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    } finally {
      setSending(false);
    }
  };

  // Delete message functionality
  const handleDeleteMessage = (message: Message) => {
    setSelectedMessage(message);
    setDeleteModalVisible(true);
  };

  const confirmDeleteMessage = async (deleteType: 'for_me' | 'for_everyone') => {
    if (!selectedMessage || !user?.token) return;

    setDeleting(true);
    try {
      const response = await apiFetchAuth('/student/messages/delete-post', user.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: `{messageId:"${selectedMessage.id}",deleteType:"${deleteType}"}`
      });

      if (response.ok) {
        if (deleteType === 'for_everyone') {
          // Remove message for everyone
          setMessages(prev => prev.filter(msg => msg.id !== selectedMessage.id));
        } else {
          // Remove message only for current user (mark as deleted)
          setMessages(prev => prev.map(msg => 
            msg.id === selectedMessage.id 
              ? { ...msg, isDeleted: true, content: 'This message was deleted' }
              : msg
          ));
        }
        
        Alert.alert('Success', 'Message deleted successfully');
        setDeleteModalVisible(false);
        setSelectedMessage(null);
      } else {
        Alert.alert('Error', 'Failed to delete message. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalVisible(false);
    setSelectedMessage(null);
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Render message
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    console.log(`🎨 Rendering message ${index}:`, {
      content: item.content,
      senderId: item.senderId,
      isMyMessage: item.senderId === user?.id,
      user: user?.id
    });
    
    const isMyMessage = item.senderId === user?.id;
    const showTime = index === messages.length - 1 || 
      new Date(messages[index + 1]?.createdAt).getTime() - new Date(item.createdAt).getTime() > 300000;

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
        )}
        
        <View style={styles.messageContent}>
          <TouchableOpacity
            onLongPress={() => handleDeleteMessage(item)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isMyMessage ? ['#667eea', '#764ba2'] : ['#ffffff', '#f8f9fa']}
              style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.theirBubble]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
                {item.content}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {showTime && (
            <View style={styles.timeContainer}>
              <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.theirMessageTime]}>
                {formatTime(item.createdAt)}
              </Text>
              {isMyMessage && (
                <Ionicons 
                  name="checkmark-done" 
                  size={12} 
                  color="#667eea" 
                  style={styles.readIndicator}
                />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!otherUserTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        </View>
        
        <View style={styles.typingBubble}>
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 56}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerInfo}>
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.headerAvatarContainer}
              >
                <Text style={styles.headerAvatarText}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerName}>{userName}</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.onlineIndicator, !isConnected && styles.offlineIndicator]} />
                  <Text style={styles.statusText}>
                    {isConnected ? 'Online' : 'Connecting...'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.loadingCard}
              >
                <Text style={styles.loadingText}>Loading messages...</Text>
              </LinearGradient>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => item.id || `msg-${index}-${Date.now()}`}
              renderItem={renderMessage}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={() => renderTypingIndicator()}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No messages yet</Text>
                </View>
              )}
            />
          )}
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
            style={styles.inputWrapper}
          >
            <View style={styles.inputContent}>
              <TouchableOpacity style={styles.attachButton}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.attachButtonGradient}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#999"
                  value={newMessage}
                  onChangeText={handleTyping}
                  multiline
                  maxLength={500}
                />
              </View>
              
              <TouchableOpacity
                style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending}
              >
                <LinearGradient
                  colors={newMessage.trim() ? ['#667eea', '#764ba2'] : ['#ccc', '#ccc']}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons 
                    name="send" 
                    size={18} 
                    color="#fff" 
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Delete Message Modal */}
        <Modal
          visible={deleteModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeDeleteModal}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalContent}>
              <View style={styles.deleteModalHeader}>
                <Text style={styles.deleteModalTitle}>Delete Message</Text>
                <TouchableOpacity onPress={closeDeleteModal} style={styles.deleteModalCloseButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.deleteModalBody}>
                <Text style={styles.deleteModalText}>
                  Choose how you want to delete this message:
                </Text>
                
                <TouchableOpacity
                  style={styles.deleteOptionButton}
                  onPress={() => confirmDeleteMessage('for_me')}
                  disabled={deleting}
                >
                  <View style={styles.deleteOptionContent}>
                    <Ionicons name="person-outline" size={24} color="#FF6B6B" />
                    <View style={styles.deleteOptionTextContainer}>
                      <Text style={styles.deleteOptionTitle}>Delete for me</Text>
                      <Text style={styles.deleteOptionDescription}>
                        Remove this message from your chat only
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteOptionButton}
                  onPress={() => confirmDeleteMessage('for_everyone')}
                  disabled={deleting}
                >
                  <View style={styles.deleteOptionContent}>
                    <Ionicons name="people-outline" size={24} color="#FF4444" />
                    <View style={styles.deleteOptionTextContainer}>
                      <Text style={styles.deleteOptionTitle}>Delete for everyone</Text>
                      <Text style={styles.deleteOptionDescription}>
                        Remove this message for all participants
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
              
              {deleting && (
                <View style={styles.deleteLoadingContainer}>
                  <ActivityIndicator size="small" color="#667eea" />
                  <Text style={styles.deleteLoadingText}>Deleting message...</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  offlineIndicator: {
    backgroundColor: '#999',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatarGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageContent: {
    maxWidth: '70%',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#ffffff', // Fallback background
  },
  myBubble: {
    borderBottomRightRadius: 4,
    backgroundColor: '#667eea', // Fallback for your messages
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
    fontWeight: '400',
  },
  theirMessageText: {
    color: '#000000',
    fontWeight: '400',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginRight: 4,
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4,
  },
  myMessageTime: {
    color: '#667eea',
  },
  theirMessageTime: {
    color: '#999',
  },
  readIndicator: {
    marginLeft: 2,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
    marginHorizontal: 1,
    opacity: 0.6,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    paddingBottom: 56,
  },
  inputWrapper: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  attachButton: {
    marginRight: 8,
  },
  attachButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  textInput: {
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  deleteModalCloseButton: {
    padding: 8,
  },
  deleteModalBody: {
    gap: 16,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteOptionButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  deleteOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteOptionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  deleteOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  deleteOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  deleteLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  deleteLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#667eea',
  },
}); 

import { apiFetchAuth, getImageUrl } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_CONFIG } from '@/constants/websocket';
/** Same background as study-partner.tsx */
const SP_BG = ['#EDE9FE', '#FDF2F8', '#FAFAFF'] as const;

const ChatTheme = {
  bg: SP_BG,
  primary: '#6344D4',
  primarySoft: '#F3EEFF',
  ink: '#0F0A1E',
  inkMuted: '#64748B',
  border: '#E8E8F0',
  bubbleMine: '#6344D4',
  bubbleTheirs: '#FFFFFF',
};

interface User {
  id: string;
  name: string;
  profilePhoto?: string | null;
  course?: string | null;
  year?: number | null;
}

interface Message {
  id: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  fileUrl?: string | null;
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

interface ChatScreenProps {
  route: {
    params: {
      userId: string;
      userName: string;
      userProfilePhoto?: string;
      isFollowing: boolean;
    };
  };
}

const ChatScreen = ({ route }: ChatScreenProps) => {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string || '';
  const userName = params.userName as string || 'User';
  const userProfilePhotoParam = params.userProfilePhoto as string || '';
  const isFollowing = params.isFollowing === 'true';

  const { user: currentUser } = useAuth();

  const [fetchedOpponentPhoto, setFetchedOpponentPhoto] = useState<string | null>(null);
  const displayPhoto = (userProfilePhotoParam || fetchedOpponentPhoto || '').trim();
  const displayPhotoUrl = displayPhoto
    ? (displayPhoto.startsWith('http://') || displayPhoto.startsWith('https://') ? displayPhoto : getImageUrl(displayPhoto))
    : '';

  useEffect(() => {
    if (!userId || !currentUser?.token || displayPhoto) return;
    let cancelled = false;
    (async () => {
      try {
        // 1) Same source as Profile screen: study-partner profile (4 photos)
        const spRes = await apiFetchAuth(
          `/student/study-partner/profile?userId=${userId}`,
          currentUser.token,
        );
        if (!cancelled && spRes?.ok) {
          const spData = spRes.data || spRes;
          const photos = Array.isArray(spData.photos) ? spData.photos : [];
          const firstPhoto = photos[0];
          if (firstPhoto && typeof firstPhoto === 'string') {
            setFetchedOpponentPhoto(firstPhoto);
            return;
          }
        }
      } catch (_) {}

      try {
        // 2) Fallback: general profile (profilePhoto / profilePicture / photos[0])
        const res = await apiFetchAuth(`/student/profile?userId=${userId}`, currentUser.token);
        if (!res?.ok || cancelled) return;
        const data = res.data || res;
        const photo =
          data.profilePhoto ??
          data.profilePicture ??
          (Array.isArray(data.photos) && data.photos[0]) ??
          null;
        if (photo && !cancelled) setFetchedOpponentPhoto(typeof photo === 'string' ? photo : photo.url || photo);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [userId, currentUser?.token, displayPhoto]);
  
  // Socket connection state (like matchmaking screen)
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  
  // Initialize socket connection - Like matchmaking screen
  useEffect(() => {
    if (currentUser?.token) {
      console.log('🔌 Initializing socket connection...');
      
      const newSocket = io(WEBSOCKET_CONFIG.SERVER_URL, {
        auth: {
          token: currentUser.token
        },
        transports: ['polling', 'websocket'],
        path: WEBSOCKET_CONFIG.CONNECTION_OPTIONS.path,
        timeout: 20000,
        forceNew: true
      });

      newSocket.on('connect', () => {
        console.log('✅ Chat Socket connected:', newSocket.id);
        setIsConnected(true);
        setSocketError(null);
        
        // Register user immediately after connection
        if (currentUser?.id) {
          console.log('👤 Registering user:', currentUser.id);
          newSocket.emit('register_user', currentUser.id);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Chat Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        // Silently handle socket errors - no console logging
        // console.error('🔥 Chat Socket connection error:', error);
        setSocketError('Connection failed. Please check your internet connection and try again.');
        setIsConnected(false);
      });

      newSocket.on('pong', () => {
        console.log('🏓 Chat Socket pong received');
      });

      setSocket(newSocket);

      return () => {
        console.log('🔌 Cleaning up socket connection');
        newSocket.disconnect();
      };
    } else {
      setSocketError('Authentication required. Please login again.');
    }
  }, [currentUser?.token]);

  // Test WebSocket connection function
  const testWebSocketConnection = () => {
    console.log('🔍 Testing WebSocket connection...');
    console.log('🔍 Connection status:', isConnected);
    console.log('🔍 Socket ID:', socket?.id);
  };
  
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageRequests, setMessageRequests] = useState<MessageRequest[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Debug newMessage state
  useEffect(() => {


  }, [newMessage, sending]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    fileName: string;
    fileType: 'IMAGE' | 'PDF' | 'EXCEL';
    uploadedUrl?: string;
  } | null>(null);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Helper function to get file size
  const getFileSize = async (uri: string): Promise<number> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    } catch (error) {
      console.error('Error getting file size:', error);
      return 0;
    }
  };

  // Helper function to sanitize message content
  const sanitizeMessage = (content: string): string => {
    return content
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  };

  // Format message time to relative format (Today, Yesterday, etc.)
  const formatMessageTime = (dateString: string) => {
    const messageDate = new Date(dateString);
    const now = new Date();
    
    // Set to midnight for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    // Check if it's today
    if (messageDay.getTime() === today.getTime()) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // Check if it's yesterday
    if (messageDay.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }
    
    // Check if it's within last 7 days
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (messageDay >= oneWeekAgo) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[messageDate.getDay()];
    }
    
    // If older than a week, show date
    return messageDate.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // For date separator: "SAT 10:21 AM"
  const formatDateSeparator = (dateString: string) => {
    const d = new Date(dateString);
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${days[d.getDay()]} ${time}`;
  };

  const formatSeenDate = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (msgDay.getTime() === today.getTime()) return 'Seen just now';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `Seen on ${days[d.getDay()]}`;
  };

  const QUICK_REPLIES = [
    'Hey! Ready to study together? 📚',
    'What exam are you preparing for?',
    'Want to fix a study time?',
  ];

  const sendQuickReply = (text: string) => {
    setNewMessage(text);
    textInputRef.current?.focus();
  };

  // Common emojis list
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
    '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
    '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
    '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
    '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵',
    '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟',
    '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
    '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
    '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡',
    '😠', '🤬', '👍', '👎', '👏', '🙏', '💪', '❤️',
    '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
    '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘',
    '💝', '✨', '⭐', '🌟', '💫', '🔥', '💯', '✅',
  ];

  // Insert emoji into text
  const insertEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textInputRef.current?.focus();
  };

  // Handle document selection
  const handleDocumentSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const fileType = file.mimeType?.includes('pdf') ? 'PDF' : 'EXCEL';
        
        setSelectedFile({
          uri: file.uri,
          fileName: file.name || `file.${fileType.toLowerCase()}`,
          fileType: fileType
        });

        setIsUploading(true);
        await handleFileUpload(file);
      }
    } catch (error) {
      console.error('Error selecting document:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    } finally {
      setShowFileOptions(false);
    }
  };

  // Handle image selection
  const handleImageSelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const fileName = fileUri.split('/').pop() || 'image.jpg';
        
        setSelectedFile({
          uri: fileUri,
          fileName: fileName,
          fileType: 'IMAGE'
        });

        setIsUploading(true);
        await handleFileUpload({
          uri: fileUri,
          name: fileName,
          type: 'image/jpeg'
        });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setShowFileOptions(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: { uri: string; type?: string | null; name?: string }) => {
    try {
      // File size validation (max 10MB)
      const fileSize = await getFileSize(file.uri);
      if (fileSize > 10 * 1024 * 1024) { // 10MB
        Alert.alert('File Too Large', 'File size cannot exceed 10MB.');
        return;
      }

      // File type validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (file.type && !allowedTypes.includes(file.type)) {
        Alert.alert('Invalid File Type', 'Only images, PDFs, and Excel files are allowed.');
        return;
      }

      const formData = new FormData();
      const fileToUpload = {
        uri: file.uri,
        type: file.type || 'application/octet-stream',
        name: file.name || file.uri.split('/').pop() || 'file'
      } as any;
      formData.append('file', fileToUpload);

      if (!currentUser?.token) {
        throw new Error('No authentication token');
      }

      const uploadResponse = await fetch('http://192.168.1.5:3000/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.url) {
        setSelectedFile(prev => prev ? {
          ...prev,
          uploadedUrl: uploadData.url
        } : null);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setSelectedFile(null);
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        Alert.alert(
          'Network Error',
          'Failed to connect to server. Please check your internet connection and try again.'
        );
      } else {
        Alert.alert(
          'Upload Failed',
          'Failed to upload file. Please try again later.'
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Handle sending message with file
  const sendFileMessage = async () => {
    if (!selectedFile?.uploadedUrl || !currentUser?.token) return;

    try {
      const messagePayload = {
        receiverId: userId,
        content: selectedFile.fileName,
        messageType: selectedFile.fileType,
        fileUrl: selectedFile.uploadedUrl,
      };

      const response = await apiFetchAuth('/student/messages', currentUser.token, {
        method: 'POST',
        body: messagePayload,
      });

      if (response.data) {
        const result = response.data;
        if (result.type === 'direct' && result.message) {
          setMessages(prev => [...prev, result.message]);
        }
      }

      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending file message:', error);
      Alert.alert('Error', 'Failed to send file. Please try again.');
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (messages.length > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => {
      keyboardDidShowListener.remove();
    };
  }, [messages]);

  // Fetch messages only when screen opens or userId changes (not on every lastRefreshTime change)
  useEffect(() => {
    if (!userId) return;
    setLastRefreshTime(Date.now());
    fetchMessages(userId);
    fetchMessageRequests();
  }, [userId]);

  // Socket event listeners for real-time messaging
  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    // Helper: add message to list if for current chat and not duplicate
    const addMessageIfForCurrentChat = (message: Message) => {
      const isForCurrentChat = (
        (String(message.sender?.id) === String(userId) && String(message.receiver?.id) === String(currentUser?.id)) ||
        (String(message.sender?.id) === String(currentUser?.id) && String(message.receiver?.id) === String(userId))
      );
      if (!isForCurrentChat) return;
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === message.id);
        if (!messageExists) return [...prev, message];
        return prev;
      });
    };

    // Room mein jo log hain unhe server bhejta hai: new_message (sirf message object)
    const handleNewMessage = (message: Message) => {
      addMessageIfForCurrentChat(message);
    };

    // Receiver online but room mein nahi (e.g. list pe): server bhejta hai message_notification
    const handleMessageNotification = (data: { type?: string; message?: Message; unreadCount?: number }) => {
      if (data.type === 'new_message' && data.message) {
        addMessageIfForCurrentChat(data.message);
      }
    };

    // Server bhejta hai: messages_were_read (plural) with { readerId }
    const handleMessagesWereRead = ({ readerId }: { readerId: string }) => {
      if (userId && userId === readerId) {
        setMessages(prev =>
          prev.map(msg =>
            String(msg.sender?.id) === String(currentUser?.id) ? { ...msg, isRead: true } : msg
          )
        );
      }
    };

    // Server sunta hai: start_typing / stop_typing. Bhejta hai: user_typing / user_stopped_typing
    const handleUserTyping = () => setIsTyping(true);
    const handleUserStoppedTyping = () => setIsTyping(false);

    socket.on('new_message', handleNewMessage);
    socket.on('message_notification', handleMessageNotification);
    socket.on('messages_were_read', handleMessagesWereRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    // Chat open hote hi room join — tabhi receiver ko new_message milega
    if (userId && currentUser?.id) {
      const chatId = [currentUser.id, userId].sort().join('-');
      socket.emit('join_chat', chatId);
    }

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_notification', handleMessageNotification);
      socket.off('messages_were_read', handleMessagesWereRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [socket, isConnected, userId, currentUser]);

  // Effect to mark messages as read when a chat is opened
  useEffect(() => {
    if (isConnected && userId && currentUser) {
      const unreadMessages = messages.filter(
        (msg) => String(msg.receiver?.id) === String(currentUser.id) && !msg.isRead
      );

      if (unreadMessages.length > 0) {
        markMessagesAsRead();
      }
    }
  }, [userId, messages, isConnected, currentUser]);

  // Fetch messages from API
  const fetchMessages = async (targetUserId: string, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingMessages(true);
      }
      
      if (!currentUser?.token) {
        throw new Error('No authentication token');
      }


      const response = await apiFetchAuth(`/student/messages/${targetUserId}`, currentUser.token);
      
      if (response.data) {
        // Messages ko time ke according sort karo (oldest first)
        const sortedMessages = [...response.data].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        

        
        // Only update if we have new messages or different count
        setMessages(prev => {
          if (prev.length !== sortedMessages.length) {

            return sortedMessages;
          }
          
          // Check if any messages are different
          const hasChanges = sortedMessages.some((newMsg, index) => {
            const oldMsg = prev[index];
            return !oldMsg || oldMsg.id !== newMsg.id || oldMsg.content !== newMsg.content;
          });
          
          if (hasChanges) {

            return sortedMessages;
          }
          

          return prev;
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (!isRefresh) {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      setLoadingMessages(false);
      setRefreshing(false);
    }
  };

  // Handle pull to refresh
  const onRefresh = () => {
    const now = Date.now();
    // Prevent refresh if last refresh was less than 1 second ago
    if (now - lastRefreshTime < 1000) {
      return;
    }
    
    if (userId) {
      setLastRefreshTime(now);
      fetchMessages(userId, true);
      fetchMessageRequests();
    }
  };

  // Fetch message requests
  const fetchMessageRequests = async () => {
    try {
      if (!currentUser?.token) return;

      const response = await apiFetchAuth('/student/message-requests', currentUser.token);
      
      if (response.data) {
        setMessageRequests(response.data);
      }
    } catch (error) {
      console.error('Error fetching message requests:', error);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    try {
      if (!currentUser?.token || !userId) return;

      await apiFetchAuth('/student/messages/read', currentUser.token, {
        method: 'POST',
        body: { otherUserId: userId },
      });

      // Update messages locally
      setMessages(prev => 
        prev.map(msg => 
          String(msg.receiver?.id) === String(currentUser.id) ? { ...msg, isRead: true } : msg
        )
      );

      // Server sunta hai: notify_messages_read with { readerId, otherUserId }
      if (socket && isConnected) {
        socket.emit('notify_messages_read', { readerId: currentUser.id, otherUserId: userId });
      }

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Handle accept message request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      if (!currentUser?.token) return;

      const response = await apiFetchAuth('/student/message-requests', currentUser.token, {
        method: 'POST',
        body: {
          requestId,
          action: 'accept'
        },
      });

      if (response.data) {
        setMessageRequests(prev => prev.filter(req => req.id !== requestId));
        
        if (response.data.message) {
          setMessages(prev => prev.map(msg => 
            msg.requestId === requestId ? response.data.message : msg
          ));
        }
      }
    } catch (error) {
      console.error('Error accepting message request:', error);
    }
  };

  // Handle reject message request
  const handleRejectRequest = async (requestId: string) => {
    try {
      if (!currentUser?.token) return;

      const response = await apiFetchAuth('/student/message-requests', currentUser.token, {
        method: 'POST',
        body: {
          requestId,
          action: 'reject'
        },
      });

      if (response.ok) {
        setMessageRequests(prev => prev.filter(req => req.id !== requestId));
        setMessages(prev => prev.filter(msg => msg.requestId !== requestId));
      }
    } catch (error) {
      console.error('Error rejecting message request:', error);
    }
  };

  // Delete message functionality
  const handleDeleteMessage = (message: Message) => {
    setSelectedMessage(message);
    setDeleteModalVisible(true);
  };

  const confirmDeleteMessage = async (deleteType: 'for_me' | 'for_everyone') => {
    if (!selectedMessage || !currentUser?.token) return;

    setDeleting(true);
    try {
      const response = await apiFetchAuth('/student/messages/delete-post', currentUser.token, {
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

    // Send message function
  const sendMessage = async () => {


    
    // Enhanced validation check
    if (!userId || !newMessage.trim() || !currentUser) {
      return;
    }

    // Message length validation (max 1000 characters)
    if (newMessage.trim().length > 1000) {
      Alert.alert('Message Too Long', 'Message cannot exceed 1000 characters.');
      return;
    }

    // Prevent rapid message sending
    if (sending) {
      return;
    }

    setSending(true);
    const content = sanitizeMessage(newMessage.trim());
    setNewMessage('');
    emitStopTyping();

    // Create optimistic message for immediate display
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content,
      messageType: 'TEXT',
      fileUrl: null,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        name: currentUser.name || 'You',
        profilePhoto: currentUser.profilePhoto,
      },
      receiver: {
        id: userId,
        name: userName,
        profilePhoto: displayPhoto || undefined,
      },
    };

    // Add optimistic message to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);

         try {
       // Force REST API for now (WebSocket can be enabled later)


       // Fallback to REST API if WebSocket is not available

      if (!currentUser.token) {
        throw new Error('No authentication token');
      }

      const messagePayload = {
        receiverId: userId,
        content: content,
        messageType: 'TEXT'
      };



      const response = await apiFetchAuth('/student/messages', currentUser.token, {
        method: 'POST',
        body: messagePayload,
      });



      if (response.data) {
        const result = response.data;

        if (result.type === 'direct') {
          // Replace optimistic message with real message from server (no message_sent from server)
          if (result.message) {
            setMessages(prev => prev.map(msg => 
              msg.id === optimisticMessage.id ? result.message : msg
            ));
          }
          
          // Server sunta hai: private_message. send_message kabhi emit mat karo.
          if (socket && isConnected && result.message) {
            socket.emit('private_message', { message: result.message });
          }
        } else if (result.type === 'request') {
          // Remove optimistic message since it was sent as request
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
          
          Alert.alert(
            'Message Request', 
            'Message sent as request. The recipient will need to accept it to start the conversation.'
          );
        }
      }

    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(content);
      
      if (error.message?.includes('follow')) {
        Alert.alert('Follow Required', 'You need to follow this user first before you can message them.');
      } else {
        Alert.alert('Error', `Message failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setSending(false);
    }
  };

  // Handle typing: server sunta hai start_typing / stop_typing with { chatId }
  const handleTypingChange = (text: string) => {
    setNewMessage(text);
    if (socket && isConnected && userId && currentUser) {
      const chatId = [currentUser.id, userId].sort().join('-');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit('start_typing', { chatId });
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { chatId });
      }, 2000);
    }
  };

  const emitStopTyping = () => {
    if (socket && isConnected && userId && currentUser) {
      const chatId = [currentUser.id, userId].sort().join('-');
      socket.emit('stop_typing', { chatId });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Handle enter key press
  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

    // Render date separator
    const renderDateSeparator = (date: string) => (
      <View style={styles.dateSeparator}>
        <View style={styles.dateSeparatorLine} />
        <Text style={styles.dateSeparatorText}>{formatDateSeparator(date)}</Text>
        <View style={styles.dateSeparatorLine} />
      </View>
    );

    const renderMessageContent = (item: Message, isMyMessage: boolean) => {
      if (item.fileUrl && item.messageType === 'IMAGE') {
        return <Image source={{ uri: item.fileUrl }} style={styles.messageImage} resizeMode="cover" />;
      }
      if (item.fileUrl) {
        return (
          <View style={styles.fileMessage}>
            <View style={[styles.fileIconWrap, isMyMessage && styles.fileIconWrapMine]}>
              <Ionicons name="document" size={18} color={isMyMessage ? '#fff' : ChatTheme.primary} />
            </View>
            <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
              {item.content}
            </Text>
          </View>
        );
      }
      return (
        <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
          {item.content}
        </Text>
      );
    };

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = String(item.sender?.id || '') === String(currentUser?.id || '');
    const showDateSeparator = index === 0 || (
      index > 0 && !isSameDay(new Date(messages[index - 1].createdAt), new Date(item.createdAt))
  );

    return (
      <>
        {showDateSeparator && renderDateSeparator(item.createdAt)}
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}>
          {!isMyMessage && (
            <View style={styles.messageAvatar}>
              {displayPhotoUrl ? (
                <Image source={{ uri: displayPhotoUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {userName && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.messageContentCol}>
            <TouchableOpacity onLongPress={() => handleDeleteMessage(item)} activeOpacity={0.85}>
              {isMyMessage ? (
                <View style={[styles.messageBubble, styles.myBubble]}>
                  {renderMessageContent(item, true)}
                  <View style={styles.bubbleFooter}>
                    <Text style={styles.myBubbleTime}>{formatMessageTime(item.createdAt)}</Text>
                    <Ionicons
                      name={item.isRead ? 'checkmark-done' : 'checkmark'}
                      size={11}
                      color={item.isRead ? '#C4B5FD' : 'rgba(255,255,255,0.75)'}
                    />
                  </View>
                </View>
              ) : (
                <View style={[styles.messageBubble, styles.theirBubble]}>
                  {renderMessageContent(item, false)}
                  <Text style={styles.theirBubbleTime}>{formatMessageTime(item.createdAt)}</Text>
                </View>
              )}
            </TouchableOpacity>

            {item.isRequest && !isMyMessage && (
              <View style={styles.requestButtons}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptRequest(item.requestId!)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleRejectRequest(item.requestId!)}
                >
                  <Text style={styles.rejectButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </>
    );
  };

  const renderChatFooter = () => {
    const last = messages[messages.length - 1];
    const showSeen =
      last &&
      String(last.sender?.id) === String(currentUser?.id) &&
      last.isRead;

    return (
      <View style={styles.chatFooterWrap}>
        {showSeen && (
          <View style={styles.seenRow}>
            <Text style={styles.seenText}>{formatSeenDate(last.createdAt)}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[...ChatTheme.bg]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.replace('/(tabs)/messages' as any)} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={ChatTheme.ink} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerUserRow}
          activeOpacity={0.7}
          onPress={() => {
            router.push({
              pathname: '/(tabs)/study-partner-liked-user',
              params: {
                userId,
                name: userName,
                profilePhoto: displayPhotoUrl || displayPhoto || '',
                fromMatchOrChat: 'true',
              },
            } as any);
          }}
        >
          <View style={styles.headerAvatarWrap}>
            {displayPhotoUrl ? (
              <Image source={{ uri: displayPhotoUrl }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarInitials}>
                  {userName && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            {isConnected ? <View style={styles.headerOnlineDot} /> : null}
          </View>
          <View style={styles.headerNameWrap}>
            <Text style={styles.headerName} numberOfLines={1}>{userName}</Text>
            <Text style={styles.headerUsername} numberOfLines={1}>
              {isConnected ? 'Study Buddy' : 'Connecting…'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

      {isTyping && (
        <Text style={styles.typingHint}>{userName} is typing…</Text>
      )}

      {!isConnected && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionBannerText}>Reconnecting…</Text>
        </View>
      )}

       <View style={styles.messagesContainer}>
        {loadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ChatTheme.primary} />
            <Text style={styles.loadingText}>Loading messages…</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={48} color={ChatTheme.primary} />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              {isFollowing
                ? 'Say hi to your study buddy'
                : 'Send a message request to start chatting'}
            </Text>
            <View style={styles.quickRepliesWrap}>
              {QUICK_REPLIES.map((reply) => (
                <TouchableOpacity
                  key={reply}
                  style={styles.quickReplyChip}
                  onPress={() => sendQuickReply(reply)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickReplyText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
                     <FlatList
             ref={flatListRef}
             data={messages}
             keyExtractor={(item) => item.id}
             renderItem={renderMessage}
             showsVerticalScrollIndicator={false}
             contentContainerStyle={styles.messagesList}
             style={styles.messagesFlatList}
             onLayout={() => {
               if (messages.length > 0) {
                 flatListRef.current?.scrollToEnd({ animated: false });
               }
             }}
             onContentSizeChange={() => {
               if (messages.length > 0) {
                 flatListRef.current?.scrollToEnd({ animated: true });
               }
             }}
             refreshControl={
               <RefreshControl
                 refreshing={refreshing}
                 onRefresh={onRefresh}
                 colors={[ChatTheme.primary]}
                 tintColor={ChatTheme.primary}
               />
             }
             ListFooterComponent={renderChatFooter}
           />
        )}
      </View>

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        style={styles.inputContainer}
      >
        {showEmojiPicker && (
          <View style={styles.emojiPickerContainer}>
            <View style={styles.emojiPickerHeader}>
              <Text style={styles.emojiPickerTitle}>Choose an emoji</Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
            </View>
            <FlatList
              data={commonEmojis}
              keyExtractor={(item, index) => `emoji-${index}`}
              numColumns={8}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.emojiButton}
                  onPress={() => insertEmoji(item)}
                >
                  <Text style={styles.emojiText}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.emojiGrid}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {showFileOptions && (
          <View style={styles.fileOptionsRow}>
            <TouchableOpacity style={styles.fileOptionBtn} onPress={handleImageSelect}>
              <Ionicons name="image-outline" size={22} color={ChatTheme.primary} />
              <Text style={styles.fileOptionText}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fileOptionBtn} onPress={handleDocumentSelect}>
              <Ionicons name="document-outline" size={22} color={ChatTheme.primary} />
              <Text style={styles.fileOptionText}>File</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn} onPress={() => setShowFileOptions(!showFileOptions)}>
            <Ionicons name="add-circle-outline" size={28} color={ChatTheme.primary} />
          </TouchableOpacity>
          <TextInput
            ref={textInputRef}
            style={styles.messageInput}
            placeholder="Message…"
            placeholderTextColor="#94A3B8"
            multiline
            value={newMessage}
            onChangeText={handleTypingChange}
            onBlur={emitStopTyping}
            onKeyPress={handleKeyPress}
            editable={!sending}
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              !newMessage.trim() && !selectedFile?.uploadedUrl && styles.sendBtnDisabled,
            ]}
            onPress={() => {
              if (selectedFile?.uploadedUrl) sendFileMessage();
              else if (newMessage.trim()) sendMessage();
            }}
            disabled={sending || (!newMessage.trim() && !selectedFile?.uploadedUrl)}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.emojiBtn} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Text style={styles.emojiBtnText}>😊</Text>
          </TouchableOpacity>
        </View>

          {/* File Preview */}
          {selectedFile && (
            <View style={styles.filePreviewContainer}>
              {selectedFile.fileType === 'IMAGE' ? (
                <Image 
                  source={{ uri: selectedFile.uri }} 
                  style={styles.filePreview} 
                />
              ) : (
                <View style={styles.documentPreview}>
                  <Ionicons 
                    name={selectedFile.fileType === 'PDF' ? 'document-text' : 'document'} 
                    size={24} 
                    color="#4F46E5" 
                  />
                </View>
              )}
              <TouchableOpacity 
                style={styles.removeFileButton}
                onPress={() => setSelectedFile(null)}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          )}
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
                   <ActivityIndicator size="small" color="#4F46E5" />
                   <Text style={styles.deleteLoadingText}>Deleting message...</Text>
                 </View>
               )}
             </View>
           </View>
         </Modal>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFF',
  },
  safeArea: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(232,232,240,0.9)',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  typingHint: {
    fontSize: 12,
    color: ChatTheme.inkMuted,
    paddingHorizontal: 16,
    paddingBottom: 6,
    fontStyle: 'italic',
  },
  connectionBanner: {
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(254,243,199,0.6)',
  },
  connectionBannerText: {
    fontSize: 12,
    color: '#92400E',
  },
  headerBackBtn: {
    padding: 8,
    marginRight: 4,
  },
  headerUserRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    position: 'relative',
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  headerAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#C4B5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitials: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  headerOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerNameWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: ChatTheme.ink,
  },
  headerUsername: {
    fontSize: 12,
    color: ChatTheme.inkMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerIconBtn: {},
  headerIconBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContentCol: {
    flex: 1,
    maxWidth: '84%',
  },
  messageBubble: {
    maxWidth: '100%',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    backgroundColor: ChatTheme.bubbleTheirs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ChatTheme.border,
  },
  myBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    marginLeft: 28,
    backgroundColor: ChatTheme.bubbleMine,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 3,
  },
  myBubbleTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  theirBubbleTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
  chatFooterWrap: {
    paddingBottom: 8,
  },
  typingDot1: { opacity: 0.35 },
  typingDot2: { opacity: 0.65 },
  typingDot3: { opacity: 1 },
  seenRow: {
    alignItems: 'flex-end',
    paddingVertical: 3,
    paddingRight: 12,
  },
  seenText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 56,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ChatTheme.border,
  },
  attachBtn: {
    paddingBottom: 6,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: ChatTheme.ink,
    maxHeight: 100,
    minHeight: 40,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ChatTheme.border,
  },
  emojiBtn: {
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
  emojiBtnText: {
    fontSize: 24,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ChatTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  fileOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ChatTheme.border,
  },
  fileOptionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  enhancedHeader: {
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerAction: {
    padding: 8,
    marginLeft: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  enhancedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  enhancedAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  enhancedAvatarInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  enhancedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  enhancedUserStatus: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
    backgroundColor: '#A78BFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 14,
    color: '#65676b',
  },
  moreButton: {
    padding: 8,
    marginLeft: 12,
  },
  messagesContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quickRepliesWrap: {
    width: '100%',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  quickReplyChip: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: ChatTheme.border,
  },
  quickReplyText: {
    fontSize: 14,
    color: ChatTheme.ink,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ChatTheme.ink,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
     messagesList: {
     paddingVertical: 8,
    paddingBottom: Platform.OS === 'android' ? 150 : 90,
   },
  messagesFlatList: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingHorizontal: 12,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 6,
    marginTop: 1,
    overflow: 'hidden',
  },
  fileIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: ChatTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  fileIconWrapMine: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  enhancedMessageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 1,
  },
  myMessageBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    marginLeft: 50, // Give some space on left for my messages
  },
  theirMessageBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    marginRight: 50, // Give some space on right for their messages
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: ChatTheme.ink,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  theirMessageTime: {
    color: '#999',
  },
  readStatus: {
    position: 'absolute',
    right: 4,
    bottom: 4,
  },
  inputContainer: {
    backgroundColor: 'transparent',
  },
  enhancedInputWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  enhancedAttachButton: {
    marginRight: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  attachButtonGradient: {
    padding: 8,
    borderRadius: 20,
  },
  enhancedTextInputWrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  enhancedMessageInput: {
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  characterCounter: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    fontSize: 12,
    color: '#999',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  enhancedSendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  enhancedSendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    padding: 10,
    borderRadius: 20,
  },
  messageRequestIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
     messageRequestText: {
     fontSize: 14,
     color: '#f39c12',
     marginLeft: 8,
   },
   messageImage: {
     width: 180,
     height: 120,
     borderRadius: 10,
     marginBottom: 2,
   },
   fileMessage: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   fileText: {
     fontSize: 16,
     lineHeight: 22,
     marginLeft: 8,
   },
  requestButtons: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: ChatTheme.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  rejectButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rejectButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
   typingIndicator: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 16,
     paddingTop: 8,
     paddingBottom: 4,
   },
  typingIndicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    gap: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
  },
  typingTextHeader: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
   websocketStatus: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: '#fff3cd',
     paddingVertical: 8,
     paddingHorizontal: 16,
     borderBottomWidth: 1,
     borderBottomColor: '#ffeaa7',
   },
  websocketStatusText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9D5FF',
    maxWidth: 48,
  },
  dateSeparatorText: {
    fontSize: 10,
    color: '#6D28D9',
    fontWeight: '700',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
    letterSpacing: 0.6,
  },
    emojiPickerContainer: {
      backgroundColor: '#fff',
      marginHorizontal: 12,
      marginBottom: 6,
      borderRadius: 20,
      maxHeight: 280,
      shadowColor: '#14532D',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 1,
      borderColor: '#DDD6FE',
    },
    emojiPickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    emojiPickerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
    },
    emojiGrid: {
      padding: 8,
    },
    emojiButton: {
      width: '12.5%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 4,
    },
    emojiText: {
      fontSize: 28,
    },
    emojiPickerButton: {
      padding: 8,
      marginLeft: 4,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emojiPickerButtonText: {
      fontSize: 26,
    },
    fileOptionText: {
      fontSize: 12,
      color: ChatTheme.inkMuted,
      marginTop: 2,
    },
    filePreviewContainer: {
      position: 'absolute',
      bottom: '100%',
      right: 48,
      marginBottom: 8,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    filePreview: {
      width: 40,
      height: 40,
      borderRadius: 12,
    },
    documentPreview: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeFileButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 0,
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
      color: '#4F46E5',
    },
 });

export default ChatScreen;

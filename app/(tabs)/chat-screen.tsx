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
        <Text style={styles.dateSeparatorText}>{formatDateSeparator(date)}</Text>
      </View>
    );

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = String(item.sender?.id || '') === String(currentUser?.id || '');
    
    // Check if we need to show date separator
    const showDateSeparator = index === 0 || (
      index > 0 && !isSameDay(new Date(messages[index - 1].createdAt), new Date(item.createdAt))
    );
    
    return (
      <>
        {showDateSeparator && renderDateSeparator(item.createdAt)}
        <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        {/* Avatar for other person's messages */}
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
        
        <View style={{ flex: 1 }}>
          {/* Message Bubble - grey left (their) / purple right (mine) */}
          <TouchableOpacity
            onLongPress={() => handleDeleteMessage(item)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.messageBubble,
                isMyMessage ? styles.myBubble : styles.theirBubble,
              ]}
            >
              {item.fileUrl && item.messageType === 'IMAGE' ? (
                <Image source={{ uri: item.fileUrl }} style={styles.messageImage} resizeMode="cover" />
              ) : item.fileUrl ? (
                <View style={styles.fileMessage}>
                  <Ionicons name="document" size={20} color={isMyMessage ? '#fff' : '#374151'} />
                  <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
                    {item.content}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
                  {item.content}
                </Text>
              )}
              {isMyMessage && (
                <View style={styles.readStatus}>
                  <Ionicons name={item.isRead ? 'checkmark-done' : 'checkmark'} size={14} color={item.isRead ? '#22C55E' : '#9CA3AF'} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Accept/Reject buttons for message requests */}
          {item.isRequest && !isMyMessage && (
            <View style={styles.requestButtons}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptRequest(item.requestId!)}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectRequest(item.requestId!)}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header: back | avatar + name + status | actions */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.chatHeader}
      >
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.replace('/(tabs)/messages' as any)} activeOpacity={0.7}>
          <View style={styles.headerBackBtnInner}>
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </View>
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
            <View style={styles.headerOnlineDot} />
          </View>
          <View style={styles.headerNameWrap}>
            <Text style={styles.headerName} numberOfLines={1}>{userName}</Text>
            <Text style={styles.headerUsername} numberOfLines={1}>
              {userName ? userName.replace(/\s+/g, '_').toLowerCase() + ' • Study Buddy' : 'Study Buddy'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </LinearGradient>
      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingIndicatorHeader}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, { opacity: 0.4 }]} />
            <View style={[styles.typingDot, { opacity: 0.7 }]} />
            <View style={[styles.typingDot, { opacity: 1 }]} />
          </View>
          <Text style={styles.typingTextHeader}>{userName} is typing...</Text>
        </View>
      )}
      
       {/* Messages */}
       <View style={styles.messagesContainer}>
        {loadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={64} color="#6366F1" />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              {isFollowing
                ? 'Start a conversation with this study buddy!'
                : 'Send a message request to start chatting'
              }
            </Text>
            <TouchableOpacity style={styles.startConversationButton} activeOpacity={0.85}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isFollowing ? 'Send a message' : 'Send message request'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
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
                 colors={['#6366F1']}
                 tintColor="#6366F1"
               />
             }
             ListFooterComponent={() => {
               const last = messages[messages.length - 1];
               if (!last || String(last.sender?.id) !== String(currentUser?.id) || !last.isRead) return null;
               return (
                 <View style={styles.seenRow}>
                   <Text style={styles.seenText}>{formatSeenDate(last.createdAt)}</Text>
                 </View>
               );
             }}
           />
        )}
      </View>

      {/* Message Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        style={styles.inputContainer}
      >
        {/* Emoji Picker */}
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

        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.cameraBtn} onPress={() => setShowFileOptions(true)} activeOpacity={0.8}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cameraBtnCircle}
            >
              <Ionicons name="camera-outline" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TextInput
            ref={textInputRef}
            style={styles.messageInput}
            placeholder="Message..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={newMessage}
            onChangeText={handleTypingChange}
            onBlur={emitStopTyping}
            onKeyPress={handleKeyPress}
            editable={!sending}
            maxLength={1000}
          />
          {!newMessage.trim() && !selectedFile?.uploadedUrl ? (
            <>
              <TouchableOpacity style={styles.inputIconBtn} onPress={() => setShowFileOptions(true)} disabled={isUploading}>
                <Ionicons name="image-outline" size={24} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.inputIconBtn} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
                <Text style={styles.emojiBtnText}>😊</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.sendBtnWrap}
              onPress={() => {
                if (selectedFile?.uploadedUrl) {
                  sendFileMessage();
                } else {
                  sendMessage();
                }
              }}
              disabled={sending}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendBtn}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

          {/* File Options Modal */}
          {showFileOptions && (
            <View style={styles.fileOptionsContainer}>
              <TouchableOpacity 
                style={styles.fileOption}
                onPress={handleImageSelect}
              >
                <Ionicons name="image-outline" size={24} color="#4F46E5" />
                <Text style={styles.fileOptionText}>Image</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.fileOption}
                onPress={handleDocumentSelect}
              >
                <Ionicons name="document-outline" size={24} color="#4F46E5" />
                <Text style={styles.fileOptionText}>PDF/Excel</Text>
              </TouchableOpacity>
            </View>
          )}

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerBackBtn: {
    marginRight: 4,
  },
  headerBackBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerUserRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
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
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerNameWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerUsername: {
    fontSize: 12,
    color: '#64748B',
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
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  myBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
    backgroundColor: '#6366F1',
    marginLeft: 48,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
  },
  seenRow: {
    alignItems: 'flex-end',
    paddingVertical: 6,
    paddingRight: 16,
  },
  seenText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraBtn: {},
  cameraBtnCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    maxHeight: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIconBtn: {
    padding: 10,
  },
  emojiBtnText: {
    fontSize: 22,
  },
  sendBtnWrap: {
    overflow: 'hidden',
    borderRadius: 23,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 20,
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#EEF2FF',
    padding: 24,
    borderRadius: 48,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
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
  startConversationButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
     messagesList: {
     paddingVertical: 16,
    paddingBottom: Platform.OS === 'android' ? 180 : 120, // Much more padding for input box and navigation bar
   },
  messagesFlatList: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 4,
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
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#1a1a1a',
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
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    // Keep input just above bottom navigation bar (Android a bit higher)
    marginBottom: Platform.OS === 'ios' ? 16 : 60,
    zIndex: 1,
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
     width: 200,
     height: 150,
     borderRadius: 12,
     marginBottom: 8,
   },
   fileMessage: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 8,
   },
   fileText: {
     fontSize: 16,
     lineHeight: 22,
     marginLeft: 8,
   },
  requestButtons: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  acceptButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
    emojiPickerContainer: {
      backgroundColor: '#fff',
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 20,
      maxHeight: 300,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 1,
      borderColor: '#e0e0e0',
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
    fileOptionsContainer: {
      position: 'absolute',
      bottom: '100%',
      left: 14,
      right: 14,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 10,
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    fileOption: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: '#F8FAFC',
    },
    fileOptionText: {
      fontSize: 13,
      color: '#4F46E5',
      marginTop: 6,
      fontWeight: '600',
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

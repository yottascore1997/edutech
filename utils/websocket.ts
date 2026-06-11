import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_CONFIG } from '../constants/websocket';

interface Message {
  id: string;
  content: string;
  messageType: string;
  fileUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  senderId: string;
  receiverId: string;
  sender: {
    id: string;
    name: string;
    profilePhoto?: string | null;
  };
  receiver: {
    id: string;
    name: string;
    profilePhoto?: string | null;
  };
}

interface WebSocketEvents {
  onMessageReceived?: (message: Message) => void;
  onMessageSent?: (message: Message) => void;
  onUserTyping?: (userId: string, isTyping: boolean) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  
  // Battle Events
  onBattleRoomCreated?: (data: any) => void;
  onBattleRoomJoined?: (data: any) => void;
  onBattleRoomLeft?: (data: any) => void;
  onPlayerJoined?: (data: any) => void;
  onPlayerLeft?: (data: any) => void;
  onPlayerReady?: (data: any) => void;
  onBattleStarted?: (data: any) => void;
  onQuestionStarted?: (data: any) => void;
  onQuestionEnded?: (data: any) => void;
  onBattleEnded?: (data: any) => void;
  onTimeUpdate?: (data: any) => void;
  // Allow arbitrary event handlers (e.g., spy_game_created)
  [eventName: string]: any;
}

class WebSocketService {
  private socket: Socket | null = null;
  private events: WebSocketEvents = {};
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string, userId: string) {
    if (this.socket?.connected) {
            return;
    }

                
    try {
      // For React Native, we need to handle connection differently
      this.socket = io(WEBSOCKET_CONFIG.SERVER_URL, {
        auth: {
          token: token,
          userId: userId
        },
        ...WEBSOCKET_CONFIG.CONNECTION_OPTIONS,
        // React Native specific settings
        transports: ['polling', 'websocket'], // Try polling first
        upgrade: true,
        rememberUpgrade: false,
        forceNew: true,
        // Add user agent for React Native
        extraHeaders: {
          ...WEBSOCKET_CONFIG.CONNECTION_OPTIONS.extraHeaders,
          'User-Agent': 'ReactNative-App'
        }
      });

      this.setupEventListeners();
    } catch (error) {
      // Silently handle connection errors - no console logging
      //       this.events.onError?.(error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
                        this.isConnected = true;
      this.reconnectAttempts = 0;
      this.events.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
      this.events.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      // Silently handle connection errors - no console logging
      this.events.onError?.(error);
    });

    this.socket.on('error', (error) => {
      // Silently handle general errors - no console logging
      //       this.events.onError?.(error);
    });

    // Message events - matching your backend
    this.socket.on(WEBSOCKET_CONFIG.EVENTS.NEW_MESSAGE, (message: Message) => {
            this.events.onMessageReceived?.(message);
    });

    // Typing events
    this.socket.on(WEBSOCKET_CONFIG.EVENTS.USER_TYPING, (data: { userId: string; isTyping: boolean }) => {
            this.events.onUserTyping?.(data.userId, true);
    });

    this.socket.on(WEBSOCKET_CONFIG.EVENTS.USER_STOPPED_TYPING, (data: { userId: string; isTyping: boolean }) => {
            this.events.onUserTyping?.(data.userId, false);
    });

    // Read receipt events
    this.socket.on(WEBSOCKET_CONFIG.EVENTS.MESSAGES_WERE_READ, (data: { readerId: string }) => {
            // You can add a callback for this if needed
    });

    // Battle Events
    this.socket.on(WEBSOCKET_CONFIG.EVENTS.BATTLE_ROOM_CREATED, (data: any) => {
            this.events.onBattleRoomCreated?.(data);
    });

    this.socket.on(WEBSOCKET_CONFIG.EVENTS.BATTLE_ROOM_JOINED, (data: any) => {
            this.events.onBattleRoomJoined?.(data);
    });

    this.socket.on(WEBSOCKET_CONFIG.EVENTS.BATTLE_ROOM_LEFT, (data: any) => {
            this.events.onBattleRoomLeft?.(data);
    });

    this.socket.on(WEBSOCKET_CONFIG.EVENTS.PLAYER_JOINED, (data: any) => {
            this.events.onPlayerJoined?.(data);
    });

    this.socket.on(WEBSOCKET_CONFIG.EVENTS.PLAYER_LEFT, (data: any) => {
            this.events.onPlayerLeft?.(data);
    });

    this.socket.on(WEBSOCKET_CONFIG.EVENTS.PLAYER_READY_UPDATE, (data: any) => {
            this.events.onPlayerReady?.(data);
    });

    this.socket.on(WEBSOCKET_CONFIG.EVENTS.BATTLE_STARTED, (data: any) => {
            this.events.onBattleStarted?.(data);
    });

    this.socket.on(WEBSOCKET_CONFIG.EVENTS.QUESTION_STARTED, (data: any) => {
            this.events.onQuestionStarted?.(data);
    });

    this.socket.on(WEBSOCKET_CONFIG.EVENTS.QUESTION_ENDED, (data: any) => {
            this.events.onQuestionEnded?.(data);
    });

    this.socket.on(WEBSOCKET_CONFIG.EVENTS.BATTLE_ENDED, (data: any) => {
            this.events.onBattleEnded?.(data);
    });

    this.socket.on(WEBSOCKET_CONFIG.EVENTS.TIME_UPDATE, (data: any) => {
            this.events.onTimeUpdate?.(data);
    });

    // Generic passthrough for arbitrary server events (e.g., spy game events)
    this.socket.onAny((event: string, ...args: any[]) => {
      const handler = this.events[event];
      if (typeof handler === 'function') {
        try {
          // Convention: pass first arg payload if present
          handler(args && args.length > 0 ? args[0] : undefined);
        } catch (err) {
                  }
      }
    });
  }

  // Register user with the WebSocket server
  registerUser(userId: string) {
    if (!this.socket?.connected) {
      // Silently return - no console logging
      return;
    }

    this.socket.emit(WEBSOCKET_CONFIG.EVENTS.REGISTER_USER, userId);
      }

  // Join a chat room with another user
  joinChat(chatId: string) {
    if (!this.socket?.connected) {
      // Silently return - no console logging
      return;
    }

    this.socket.emit(WEBSOCKET_CONFIG.EVENTS.JOIN_CHAT, { chatId });
      }

  // Send a private message
  sendMessage(message: {
    content: string;
    receiverId: string;
    messageType?: string;
    fileUrl?: string;
    sender?: {
      id: string;
      name: string;
      profilePhoto?: string | null;
    };
  }) {
    if (!this.socket?.connected) {
      // Silently return - no console logging
      return false;
    }

    const messageData = {
      message: {
        content: message.content,
        receiver: { id: message.receiverId },
        messageType: message.messageType || 'text',
        fileUrl: message.fileUrl,
        sender: message.sender || null
      }
    };

    this.socket.emit(WEBSOCKET_CONFIG.EVENTS.PRIVATE_MESSAGE, messageData);
        return true;
  }

  // Send typing indicator
  sendTypingIndicator(chatId: string, isTyping: boolean) {
    if (!this.socket?.connected) return;

    if (isTyping) {
      this.socket.emit(WEBSOCKET_CONFIG.EVENTS.START_TYPING, { chatId });
    } else {
      this.socket.emit(WEBSOCKET_CONFIG.EVENTS.STOP_TYPING, { chatId });
    }
  }

  // Mark messages as read
  markMessageAsRead(readerId: string, otherUserId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit(WEBSOCKET_CONFIG.EVENTS.NOTIFY_MESSAGES_READ, {
      readerId,
      otherUserId
    });
  }

  // Battle Events
  createBattleRoom(name: string) {
    if (!this.socket?.connected) {
      // Silently return - no console logging
      return;
    }
    this.socket.emit(WEBSOCKET_CONFIG.EVENTS.CREATE_BATTLE_ROOM, { name });
      }

  joinBattleRoom(roomId: string) {
    if (!this.socket?.connected) {
      // Silently return - no console logging
      return;
    }
    this.socket.emit(WEBSOCKET_CONFIG.EVENTS.JOIN_BATTLE_ROOM, { roomId });
      }

  leaveBattleRoom(roomId: string) {
    if (!this.socket?.connected) {
      // Silently return - no console logging
      return;
    }
    this.socket.emit(WEBSOCKET_CONFIG.EVENTS.LEAVE_BATTLE_ROOM, { roomId });
      }

  playerReady(roomId: string) {
    if (!this.socket?.connected) {
      // Silently return - no console logging
      return;
    }
    this.socket.emit(WEBSOCKET_CONFIG.EVENTS.PLAYER_READY, { roomId });
      }

  submitAnswer(roomId: string, questionIndex: number, answerIndex: number, timeRemaining: number) {
    if (!this.socket?.connected) {
      // Silently return - no console logging
      return;
    }
    this.socket.emit(WEBSOCKET_CONFIG.EVENTS.SUBMIT_ANSWER, {
      roomId,
      questionIndex,
      answerIndex,
      timeRemaining
    });
      }

  // Set event handlers
  on(event: keyof WebSocketEvents, handler: any) {
    this.events[event] = handler;
  }

  // Remove event handler
  off(event: keyof WebSocketEvents) {
    delete this.events[event];
  }

  // Get connection status
  isSocketConnected(): boolean {
    return this.isConnected;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
          }
  }

  // Get socket instance (for advanced usage)
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
export type { Message, WebSocketEvents };


// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  // Use the same server as your API but on port 3001 for WebSocket
  SERVER_URL: 'http://192.168.1.5:3001',
  
  // Connection options - matching your backend configuration
  CONNECTION_OPTIONS: {
    timeout: 30000,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['polling', 'websocket'],
    forceNew: true,
    upgrade: true,
    rememberUpgrade: false,
    // Match your backend configuration
    path: '/api/socket',
    addTrailingSlash: false,
    allowEIO3: true,
    withCredentials: true,
    extraHeaders: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  
  // Event names that match your backend
  EVENTS: {
    // Client to Server
    REGISTER_USER: 'register_user',
    JOIN_CHAT: 'join_chat',
    PRIVATE_MESSAGE: 'private_message',
    START_TYPING: 'start_typing',
    STOP_TYPING: 'stop_typing',
    NOTIFY_MESSAGES_READ: 'notify_messages_read',
    
    // Battle Events - Client to Server
    CREATE_BATTLE_ROOM: 'create_battle_room',
    JOIN_BATTLE_ROOM: 'join_battle_room',
    LEAVE_BATTLE_ROOM: 'leave_battle_room',
    PLAYER_READY: 'player_ready',
    SUBMIT_ANSWER: 'submit_answer',
    
    // Battle Events - Server to Client
    BATTLE_ROOM_CREATED: 'battle_room_created',
    BATTLE_ROOM_JOINED: 'battle_room_joined',
    BATTLE_ROOM_LEFT: 'battle_room_left',
    PLAYER_JOINED: 'player_joined',
    PLAYER_LEFT: 'player_left',
    PLAYER_READY_UPDATE: 'player_ready',
    BATTLE_STARTED: 'battle_started',
    QUESTION_STARTED: 'question_started',
    QUESTION_ENDED: 'question_ended',
    BATTLE_ENDED: 'battle_ended',
    TIME_UPDATE: 'time_update',
    
    // Server to Client
    NEW_MESSAGE: 'new_message',
    USER_TYPING: 'user_typing',
    USER_STOPPED_TYPING: 'user_stopped_typing',
    MESSAGES_WERE_READ: 'messages_were_read',
  }
}; 
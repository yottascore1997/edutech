import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import webSocketService from '../utils/websocket';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  registerUser: (userId: string) => void;
  sendMessage: (message: { content: string; receiverId: string; messageType?: string; fileUrl?: string; sender?: { id: string; name: string; profilePhoto?: string | null } }) => boolean;
  joinChat: (chatId: string) => void;
  sendTypingIndicator: (chatId: string, isTyping: boolean) => void;
  markMessageAsRead: (readerId: string, otherUserId: string) => void;
  on: (event: string, handler: any) => void;
  off: (event: string) => void;
  
  // Battle methods
  createBattleRoom: (name: string) => void;
  joinBattleRoom: (roomId: string) => void;
  leaveBattleRoom: (roomId: string) => void;
  playerReady: (roomId: string) => void;
  submitAnswer: (roomId: string, questionIndex: number, answerIndex: number, timeRemaining: number) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.token || !user?.id) {
      disconnect();
      return;
    }

    // Set up global event handlers
    webSocketService.on('onConnect', () => {
      console.log('WebSocket connected globally');
      setIsConnected(true);
      // Register user automatically when connected
      if (user?.id) {
        webSocketService.registerUser(user.id);
      }
    });

    webSocketService.on('onDisconnect', () => {
      console.log('WebSocket disconnected globally');
      setIsConnected(false);
    });

    webSocketService.on('onError', (error: any) => {
      // Silently handle WebSocket errors - no console logging
      setIsConnected(false);
    });

    // Connect automatically when user is available
    connect();

    return () => {
      webSocketService.off('onConnect');
      webSocketService.off('onDisconnect');
      webSocketService.off('onError');
      disconnect();
    };
  }, [user?.token, user?.id]);

  const connect = () => {
    if (user?.token && user?.id) {
      webSocketService.connect(user.token, user.id);
    }
  };

  const disconnect = () => {
    webSocketService.disconnect();
    setIsConnected(false);
  };

  const sendMessage = (message: { content: string; receiverId: string; messageType?: string; fileUrl?: string; sender?: { id: string; name: string; profilePhoto?: string | null } }) => {
    return webSocketService.sendMessage(message);
  };

  const joinChat = (chatId: string) => {
    webSocketService.joinChat(chatId);
  };

  const sendTypingIndicator = (chatId: string, isTyping: boolean) => {
    webSocketService.sendTypingIndicator(chatId, isTyping);
  };

  const markMessageAsRead = (readerId: string, otherUserId: string) => {
    webSocketService.markMessageAsRead(readerId, otherUserId);
  };

  const on = (event: string, handler: any) => {
    webSocketService.on(event as any, handler);
  };

  const off = (event: string) => {
    webSocketService.off(event as any);
  };

  const registerUser = (userId: string) => {
    webSocketService.registerUser(userId);
  };

  // Battle methods
  const createBattleRoom = (name: string) => {
    webSocketService.createBattleRoom(name);
  };

  const joinBattleRoom = (roomId: string) => {
    webSocketService.joinBattleRoom(roomId);
  };

  const leaveBattleRoom = (roomId: string) => {
    webSocketService.leaveBattleRoom(roomId);
  };

  const playerReady = (roomId: string) => {
    webSocketService.playerReady(roomId);
  };

  const submitAnswer = (roomId: string, questionIndex: number, answerIndex: number, timeRemaining: number) => {
    webSocketService.submitAnswer(roomId, questionIndex, answerIndex, timeRemaining);
  };

  const value: WebSocketContextType = {
    isConnected,
    connect,
    disconnect,
    registerUser,
    sendMessage,
    joinChat,
    sendTypingIndicator,
    markMessageAsRead,
    on,
    off,
    createBattleRoom,
    joinBattleRoom,
    leaveBattleRoom,
    playerReady,
    submitAnswer,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}; 
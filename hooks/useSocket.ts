// hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  match_started: (data: any) => void;
  next_question: (data: any) => void;
  match_ended: (data: any) => void;
  opponent_answered: (data: any) => void;
  match_not_found: (data: any) => void;
  pong: () => void;
}

interface ClientToServerEvents {
  get_match_status: (data: { matchId: string }) => void;
  answer_question: (data: any) => void;
  ping: () => void;
}

let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

// Configure your socket server URL here
// For React Native development, use your computer's IP address instead of localhost
const SOCKET_SERVER_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.1.7:3001';

export const useSocket = () => {
  const [socket, setSocket] = useState<typeof socketInstance>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socketInstance) {
      console.log('🔌 Initializing socket connection to:', SOCKET_SERVER_URL);
      socketInstance = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });
    }

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected to:', SOCKET_SERVER_URL);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected from:', SOCKET_SERVER_URL);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      // Silently handle connection errors - no console logging
      // console.error('🔌 Socket connection error:', error);
      setIsConnected(false);
    });

    return () => {
      // Don't disconnect here as we want to keep the connection alive
      // socketInstance?.disconnect();
    };
  }, []);

  return { socket, isConnected };
};

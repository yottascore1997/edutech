// hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_CONFIG } from '@/constants/websocket';

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
const SOCKET_SERVER_URL = WEBSOCKET_CONFIG.SERVER_URL;

type UseSocketOptions = {
  token?: string | null;
  userId?: string | null;
};

export const useSocket = (options: UseSocketOptions = {}) => {
  const [socket, setSocket] = useState<typeof socketInstance>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socketInstance) {
      console.log('🔌 Initializing socket connection to:', SOCKET_SERVER_URL);
      socketInstance = io(SOCKET_SERVER_URL, {
        ...(WEBSOCKET_CONFIG.CONNECTION_OPTIONS as object),
        auth: options.token
          ? { token: options.token, ...(options.userId ? { userId: options.userId } : {}) }
          : undefined,
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      } as any);
    } else if (options.token && (socketInstance as any).auth?.token !== options.token) {
      (socketInstance as any).auth = {
        token: options.token,
        ...(options.userId ? { userId: options.userId } : {}),
      };
      if (!socketInstance.connected) socketInstance.connect();
    }

    setSocket(socketInstance);

    const onConnect = () => {
      setIsConnected(true);
    };
    const onDisconnect = () => {
      setIsConnected(false);
    };
    const onError = () => {
      setIsConnected(false);
    };

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('connect_error', onError);

    return () => {
      if (socketInstance) {
        socketInstance.off('connect', onConnect);
        socketInstance.off('disconnect', onDisconnect);
        socketInstance.off('connect_error', onError);
      }
    };
  }, [options.token, options.userId]);

  return { socket, isConnected };
};

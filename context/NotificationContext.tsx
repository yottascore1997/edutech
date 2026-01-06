import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import SocketService from '../services/socketService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext<{
  expoPushToken: string;
  notifications: any[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  clearAllNotifications: () => void;
}>({
  expoPushToken: '',
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {},
  markAsRead: () => {},
  clearAllNotifications: () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    // Register for push notifications (disabled for now to avoid errors)
    // registerForPushNotificationsAsync().then(token => {
    //   if (token) {
    //     setExpoPushToken(token);
    //     console.log('Expo push token:', token);
    //   }
    // });

    // Setup notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Listen for notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    // Setup socket notification handler
    SocketService.setNotificationHandler((notification) => {
      console.log('Socket notification:', notification);
      // You can add local notification here if needed
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    if (user?.token) {
      // Connect to socket when user is logged in
      SocketService.connect(user.token);
      
      // Fetch initial notifications
      fetchNotifications();
    } else {
      // Disconnect when user logs out
      SocketService.disconnect();
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      SocketService.disconnect();
    };
  }, [user?.token]);

  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    let token: string | null = null;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: 'your-project-id' // Add your Expo project ID here
        })).data;
      } catch (error) {
        console.error('Error getting push token:', error);
        // Don't throw error, just continue without push notifications
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  };

  const fetchNotifications = async () => {
    if (!user?.token) return;

    try {
      const response = await fetch('http://192.168.1.5:3000/api/student/notifications', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{
      expoPushToken,
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead,
      clearAllNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};



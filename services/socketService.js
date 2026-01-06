import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.onNotification = null;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io('http://192.168.1.5:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('message_notification', (data) => {
      console.log('Message notification received:', data);
      this.showNotification('New Message', data.message?.content || 'You have a new message');
    });

    this.socket.on('admin_notification', (data) => {
      console.log('Admin notification received:', data);
      this.showNotification(data.title || 'Admin Notification', data.message || 'You have a new notification');
    });

    this.socket.on('exam_ended', (data) => {
      console.log('Exam ended notification received:', data);
      this.showNotification('Exam Ended', `"${data.title || 'Exam'}" has ended!`);
    });

    this.socket.on('battle_match_found', (data) => {
      console.log('Battle match found notification received:', data);
      this.showNotification('Battle Found!', 'Your opponent is ready!');
    });

    this.socket.on('practice_exam_result', (data) => {
      console.log('Practice exam result notification received:', data);
      this.showNotification('Exam Result', `Your practice exam result is ready!`);
    });

    this.socket.on('error', (error) => {
      // Silently handle socket errors - no console logging
      // console.error('Socket error:', error);
    });
  }

  showNotification(title, body) {
    console.log('Showing notification:', { title, body });
    if (this.onNotification) {
      this.onNotification({ title, body });
    }
  }

  setNotificationHandler(handler) {
    this.onNotification = handler;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }
}

export default new SocketService();



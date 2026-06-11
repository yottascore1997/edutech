import io from 'socket.io-client';
import { WEBSOCKET_CONFIG } from '../constants/websocket';

class SocketService {
  constructor() {
    this.socket = null;
    this.onNotification = null;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(WEBSOCKET_CONFIG.SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
          });

    this.socket.on('disconnect', () => {
          });

    this.socket.on('message_notification', (data) => {
            this.showNotification('New Message', data.message?.content || 'You have a new message');
    });

    this.socket.on('admin_notification', (data) => {
            this.showNotification(data.title || 'Admin Notification', data.message || 'You have a new notification');
    });

    this.socket.on('exam_ended', (data) => {
            this.showNotification('Exam Ended', `"${data.title || 'Exam'}" has ended!`);
    });

    this.socket.on('battle_match_found', (data) => {
            this.showNotification('Battle Found!', 'Your opponent is ready!');
    });

    this.socket.on('practice_exam_result', (data) => {
            this.showNotification('Exam Result', `Your practice exam result is ready!`);
    });

    this.socket.on('error', () => {
      // Silently handle socket errors
    });
  }

  showNotification(title, body) {
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


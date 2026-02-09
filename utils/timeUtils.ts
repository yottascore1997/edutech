// Time utility functions for exam start time handling

export const formatTimeUntilStart = (startTime: string | Date): string => {
  const now = new Date();
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const diff = start.getTime() - now.getTime();
  
  if (diff <= 0) return '00:00:00';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const formatDateTime = (dateTime: string | Date): string => {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const hasExamStarted = (startTime: string | Date): boolean => {
  const now = new Date();
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  return now >= start;
};

export const getTimeUntilStart = (startTime: string | Date): number => {
  const now = new Date();
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const diff = start.getTime() - now.getTime();
  return Math.max(0, diff);
};


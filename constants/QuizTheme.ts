/** Quiz tab — rich premium palette */
export const QuizTheme = {
  bg: '#F5F3FF',
  ink: '#0F0A1E',
  inkMuted: '#64748B',
  primary: '#6D28D9',
  primaryDark: '#4C1D95',
  primaryLight: '#A78BFA',
  gold: '#FBBF24',
  goldDark: '#F59E0B',
  heroGradient: ['#0A0618', '#1E1B4B', '#4338CA', '#6D28D9'] as const,
  journeyBorder: ['#C4B5FD', '#DDD6FE'] as const,
  journeyIcon: ['#EDE9FE', '#DDD6FE'] as const,
  progress: ['#A78BFA', '#7C3AED', '#6D28D9'] as const,
  resumeBtn: ['#8B5CF6', '#6D28D9'] as const,
  quickCard: ['#FAF5FF', '#F3E8FF', '#EDE9FE'] as const,
  quickPlay: ['#8B5CF6', '#6D28D9', '#5B21B6'] as const,
  dailyCard: ['#ECFDF5', '#D1FAE5', '#BBF7D0'] as const,
  dailyPlay: ['#10B981', '#059669', '#047857'] as const,
  qotd: ['#0C1929', '#1E3A8A', '#2563EB', '#3B82F6'] as const,
};

export const CATEGORY_GRADIENTS: { colors: [string, string]; border: string; icon: string }[] = [
  { colors: ['#F5F3FF', '#EDE9FE'], border: '#C4B5FD', icon: '#7C3AED' },
  { colors: ['#FFF7ED', '#FFEDD5'], border: '#FDBA74', icon: '#EA580C' },
  { colors: ['#F0FDF4', '#DCFCE7'], border: '#86EFAC', icon: '#16A34A' },
  { colors: ['#EFF6FF', '#DBEAFE'], border: '#93C5FD', icon: '#2563EB' },
  { colors: ['#FEFCE8', '#FEF9C3'], border: '#FDE047', icon: '#CA8A04' },
];

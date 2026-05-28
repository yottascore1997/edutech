/** Live exam result — premium dashboard palette */
export const R = {
  bg: '#F4F7FC',
  bgGrad: ['#EEF4FF', '#F8FAFC', '#FFFBF7'] as const,
  ink: '#0F172A',
  inkSoft: '#1E293B',
  muted: '#64748B',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primarySoft: '#DBEAFE',
  violet: '#7C3AED',
  violetSoft: '#EDE9FE',
  success: '#10B981',
  successDark: '#059669',
  successSoft: '#D1FAE5',
  error: '#EF4444',
  errorSoft: '#FEE2E2',
  warn: '#F59E0B',
  warnSoft: '#FEF3C7',
  gold: '#D97706',
  goldSoft: '#FFFBEB',
  card: '#FFFFFF',
  border: '#E2E8F0',
  heroDark: ['#0F172A', '#1E3A8A', '#312E81'] as const,
  ctaGrad: ['#3B82F6', '#2563EB', '#1D4ED8'] as const,
  certGrad: ['#8B5CF6', '#7C3AED', '#6D28D9'] as const,
  goldGrad: ['#FDE68A', '#F59E0B', '#D97706'] as const,
  prizeGrad: ['#6EE7B7', '#10B981', '#059669'] as const,
};

export function scoreAccent(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#F97316';
  return '#94A3B8';
}

export function scoreAccentSoft(score: number): string {
  if (score >= 80) return '#D1FAE5';
  if (score >= 60) return '#FEF3C7';
  if (score >= 40) return '#FFEDD5';
  return '#F1F5F9';
}

export function scoreMessage(score: number): string {
  if (score >= 90) return 'Outstanding! You crushed it.';
  if (score >= 80) return 'Excellent performance!';
  if (score >= 70) return 'Great job — keep it up!';
  if (score >= 60) return 'Good effort. Room to grow.';
  return 'Keep practicing — you will improve!';
}

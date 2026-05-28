// Global Font System — Poppins across the app
import { fontFamilyForWeight } from './Typography';

type FontDef = {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700' | '800' | '900';
  letterSpacing?: number;
  lineHeight?: number;
  color?: string;
  textShadowColor?: string;
  textShadowOffset?: { width: number; height: number };
  textShadowRadius?: number;
};

function def(d: FontDef) {
  const { fontWeight, ...rest } = d;
  return {
    ...rest,
    fontWeight,
    fontFamily: fontFamilyForWeight(fontWeight),
  };
}

export const Fonts = {
  header: {
    large: def({
      fontSize: 24,
      fontWeight: '900',
      letterSpacing: 0.6,
      lineHeight: 28,
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 3,
    }),
    medium: def({
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: 0.5,
      lineHeight: 24,
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 3,
    }),
    small: def({
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.4,
      lineHeight: 22,
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    }),
  },
  subheader: {
    large: def({
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.4,
      lineHeight: 20,
    }),
    medium: def({
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.3,
      lineHeight: 18,
    }),
    small: def({
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.3,
      lineHeight: 17,
    }),
  },
  body: {
    large: def({ fontSize: 16, fontWeight: '600', letterSpacing: 0.3, lineHeight: 20 }),
    medium: def({ fontSize: 15, fontWeight: '500', letterSpacing: 0.2, lineHeight: 18 }),
    small: def({ fontSize: 14, fontWeight: '500', letterSpacing: 0.2, lineHeight: 17 }),
  },
  button: {
    large: def({
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: 0.4,
      lineHeight: 20,
    }),
    medium: def({
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.3,
      lineHeight: 18,
    }),
    small: def({ fontSize: 13, fontWeight: '600', letterSpacing: 0.3, lineHeight: 16 }),
  },
  caption: {
    large: def({ fontSize: 13, fontWeight: '500', letterSpacing: 0.2, lineHeight: 16 }),
    medium: def({ fontSize: 12, fontWeight: '500', letterSpacing: 0.2, lineHeight: 15 }),
    small: def({ fontSize: 11, fontWeight: '500', letterSpacing: 0.1, lineHeight: 14 }),
  },
  special: {
    largeAmount: def({
      fontSize: 44,
      fontWeight: '900',
      letterSpacing: 0.5,
      lineHeight: 52,
    }),
    mediumAmount: def({
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: 0.4,
      lineHeight: 28,
    }),
    smallAmount: def({
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.3,
      lineHeight: 22,
    }),
  },
  white: {
    large: def({
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 0.5,
      lineHeight: 24,
      color: '#FFFFFF',
    }),
    medium: def({
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.3,
      lineHeight: 20,
      color: '#FFFFFF',
    }),
    small: def({
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.2,
      lineHeight: 18,
      color: 'rgba(255, 255, 255, 0.95)',
    }),
  },
  grey: {
    large: def({
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.2,
      lineHeight: 19,
      color: '#6B7280',
    }),
    medium: def({
      fontSize: 15,
      fontWeight: '500',
      letterSpacing: 0.2,
      lineHeight: 18,
      color: '#6B7280',
    }),
    small: def({
      fontSize: 14,
      fontWeight: '500',
      letterSpacing: 0.2,
      lineHeight: 17,
      color: '#6B7280',
    }),
  },
};

export const createFontStyle = (fontConfig: object, customColor?: string) => ({
  ...fontConfig,
  ...(customColor ? { color: customColor } : {}),
});

export const FontColors = {
  primary: '#1F2937',
  secondary: '#6B7280',
  white: '#FFFFFF',
  whiteMuted: 'rgba(255, 255, 255, 0.9)',
  accent: '#4F46E5',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

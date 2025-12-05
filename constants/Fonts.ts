// Global Font System for the entire application
// This file contains all font configurations that can be used across the app

export const Fonts = {
  // Headers and Titles
  header: {
    large: {
      fontSize: 24,
      fontWeight: '900' as const,
      letterSpacing: 0.6,
      lineHeight: 28,
      fontFamily: 'System',
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 3,
    },
    medium: {
      fontSize: 20,
      fontWeight: '800' as const,
      letterSpacing: 0.5,
      lineHeight: 24,
      fontFamily: 'System',
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 3,
    },
    small: {
      fontSize: 18,
      fontWeight: '700' as const,
      letterSpacing: 0.4,
      lineHeight: 22,
      fontFamily: 'System',
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  },

  // Subheaders and Section Titles
  subheader: {
    large: {
      fontSize: 16,
      fontWeight: '700' as const,
      letterSpacing: 0.4,
      lineHeight: 20,
      fontFamily: 'System',
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },
    medium: {
      fontSize: 15,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
      lineHeight: 18,
      fontFamily: 'System',
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },
    small: {
      fontSize: 14,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
      lineHeight: 17,
      fontFamily: 'System',
    },
  },

  // Body Text
  body: {
    large: {
      fontSize: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
      lineHeight: 20,
      fontFamily: 'System',
    },
    medium: {
      fontSize: 15,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
      lineHeight: 18,
      fontFamily: 'System',
    },
    small: {
      fontSize: 14,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
      lineHeight: 17,
      fontFamily: 'System',
    },
  },

  // Button Text
  button: {
    large: {
      fontSize: 17,
      fontWeight: '800' as const,
      letterSpacing: 0.4,
      lineHeight: 20,
      fontFamily: 'System',
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    medium: {
      fontSize: 15,
      fontWeight: '700' as const,
      letterSpacing: 0.3,
      lineHeight: 18,
      fontFamily: 'System',
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },
    small: {
      fontSize: 13,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
      lineHeight: 16,
      fontFamily: 'System',
    },
  },

  // Caption and Small Text
  caption: {
    large: {
      fontSize: 13,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
      lineHeight: 16,
      fontFamily: 'System',
    },
    medium: {
      fontSize: 12,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
      lineHeight: 15,
      fontFamily: 'System',
    },
    small: {
      fontSize: 11,
      fontWeight: '500' as const,
      letterSpacing: 0.1,
      lineHeight: 14,
      fontFamily: 'System',
    },
  },

  // Special Text (like amounts, numbers)
  special: {
    largeAmount: {
      fontSize: 44,
      fontWeight: '900' as const,
      letterSpacing: 0.5,
      lineHeight: 52,
      fontFamily: 'System',
      textShadowColor: 'rgba(0, 0, 0, 0.4)',
      textShadowOffset: { width: 0, height: 3 },
      textShadowRadius: 6,
    },
    mediumAmount: {
      fontSize: 24,
      fontWeight: '800' as const,
      letterSpacing: 0.4,
      lineHeight: 28,
      fontFamily: 'System',
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 3,
    },
    smallAmount: {
      fontSize: 18,
      fontWeight: '700' as const,
      letterSpacing: 0.3,
      lineHeight: 22,
      fontFamily: 'System',
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  },

  // White Text (for dark backgrounds)
  white: {
    large: {
      fontSize: 20,
      fontWeight: '900' as const,
      letterSpacing: 0.5,
      lineHeight: 24,
      fontFamily: 'System',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.4)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 3,
    },
    medium: {
      fontSize: 17,
      fontWeight: '700' as const,
      letterSpacing: 0.3,
      lineHeight: 20,
      fontFamily: 'System',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    small: {
      fontSize: 15,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
      lineHeight: 18,
      fontFamily: 'System',
      color: 'rgba(255, 255, 255, 0.95)',
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },
  },

  // Grey Text (for secondary information)
  grey: {
    large: {
      fontSize: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
      lineHeight: 19,
      fontFamily: 'System',
      color: '#6B7280',
    },
    medium: {
      fontSize: 15,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
      lineHeight: 18,
      fontFamily: 'System',
      color: '#6B7280',
    },
    small: {
      fontSize: 14,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
      lineHeight: 17,
      fontFamily: 'System',
      color: '#6B7280',
    },
  },
};

// Helper function to combine font styles with custom colors
export const createFontStyle = (fontConfig: any, customColor?: string) => {
  return {
    ...fontConfig,
    ...(customColor && { color: customColor }),
  };
};

// Predefined color combinations
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

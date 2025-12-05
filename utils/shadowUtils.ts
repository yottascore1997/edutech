import { Platform } from 'react-native';

/**
 * Platform-specific shadow utilities for consistent shadow rendering
 * across Android and iOS devices
 */

export const ShadowUtils = {
  /**
   * Creates platform-specific shadow styles
   * @param shadowColor - Color of the shadow
   * @param shadowOffset - Offset of the shadow
   * @param shadowOpacity - Opacity of the shadow
   * @param shadowRadius - Blur radius of the shadow
   * @param elevation - Android elevation (only used on Android)
   */
  createShadow: (
    shadowColor: string = '#000',
    shadowOffset: { width: number; height: number } = { width: 0, height: 2 },
    shadowOpacity: number = 0.1,
    shadowRadius: number = 4,
    elevation: number = 2
  ) => {
    if (Platform.OS === 'ios') {
      return {
        shadowColor,
        shadowOffset,
        shadowOpacity,
        shadowRadius,
      };
    } else {
      // Android uses elevation instead of shadow properties
      return {
        elevation,
        shadowColor: shadowColor,
        shadowOffset: { width: 0, height: 0 }, // Android doesn't use shadowOffset
        shadowOpacity: 0, // Android doesn't use shadowOpacity
        shadowRadius: 0, // Android doesn't use shadowRadius
      };
    }
  },

  /**
   * Creates a subtle shadow for cards and containers
   */
  cardShadow: () => {
    return ShadowUtils.createShadow(
      '#000',
      { width: 0, height: 2 },
      0.08,
      4,
      2
    );
  },

  /**
   * Creates a medium shadow for buttons and interactive elements
   */
  buttonShadow: () => {
    return ShadowUtils.createShadow(
      '#000',
      { width: 0, height: 3 },
      0.15,
      6,
      4
    );
  },

  /**
   * Creates a strong shadow for modals and overlays
   */
  modalShadow: () => {
    return ShadowUtils.createShadow(
      '#000',
      { width: 0, height: 10 },
      0.25,
      20,
      10
    );
  },

  /**
   * Creates a colored shadow (useful for themed elements)
   */
  coloredShadow: (color: string, intensity: number = 0.2) => {
    return ShadowUtils.createShadow(
      color,
      { width: 0, height: 4 },
      intensity,
      8,
      Math.round(intensity * 20)
    );
  },

  /**
   * Creates a glow effect shadow
   */
  glowShadow: (color: string, intensity: number = 0.3) => {
    return ShadowUtils.createShadow(
      color,
      { width: 0, height: 0 },
      intensity,
      10,
      Math.round(intensity * 15)
    );
  },

  /**
   * Creates a bottom-only shadow (useful for headers and tabs)
   */
  bottomShadow: () => {
    return ShadowUtils.createShadow(
      '#000',
      { width: 0, height: 2 },
      0.1,
      4,
      2
    );
  },

  /**
   * Creates a top shadow (useful for bottom navigation)
   */
  topShadow: () => {
    return ShadowUtils.createShadow(
      '#000',
      { width: 0, height: -2 },
      0.1,
      4,
      2
    );
  },

  /**
   * Creates no shadow (useful for flat design elements)
   */
  noShadow: () => {
    return {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    };
  },

  /**
   * Creates a medium shadow for cards and containers
   */
  medium: () => {
    return ShadowUtils.createShadow(
      '#000',
      { width: 0, height: 4 },
      0.12,
      8,
      4
    );
  },

  /**
   * Creates a large shadow for modals and overlays
   */
  large: () => {
    return ShadowUtils.createShadow(
      '#000',
      { width: 0, height: 8 },
      0.2,
      16,
      8
    );
  },
};

/**
 * Pre-defined shadow styles for common use cases
 */
export const ShadowStyles = {
  // Card shadows
  cardLight: ShadowUtils.cardShadow(),
  cardMedium: ShadowUtils.createShadow('#000', { width: 0, height: 4 }, 0.12, 8, 4),
  cardHeavy: ShadowUtils.createShadow('#000', { width: 0, height: 6 }, 0.2, 12, 6),

  // Button shadows
  buttonLight: ShadowUtils.buttonShadow(),
  buttonMedium: ShadowUtils.createShadow('#000', { width: 0, height: 4 }, 0.2, 8, 5),
  buttonHeavy: ShadowUtils.createShadow('#000', { width: 0, height: 6 }, 0.3, 12, 8),

  // Modal shadows
  modalLight: ShadowUtils.modalShadow(),
  modalHeavy: ShadowUtils.createShadow('#000', { width: 0, height: 15 }, 0.4, 25, 15),

  // Navigation shadows
  tabBar: ShadowUtils.topShadow(),
  header: ShadowUtils.bottomShadow(),

  // Themed shadows
  primary: ShadowUtils.coloredShadow('#4F46E5', 0.15),
  success: ShadowUtils.coloredShadow('#10B981', 0.2),
  warning: ShadowUtils.coloredShadow('#F59E0B', 0.2),
  danger: ShadowUtils.coloredShadow('#EF4444', 0.2),

  // Glow effects
  glowPrimary: ShadowUtils.glowShadow('#4F46E5', 0.3),
  glowSuccess: ShadowUtils.glowShadow('#10B981', 0.3),
  glowWarning: ShadowUtils.glowShadow('#F59E0B', 0.3),
  glowDanger: ShadowUtils.glowShadow('#EF4444', 0.3),
};

export default ShadowUtils;

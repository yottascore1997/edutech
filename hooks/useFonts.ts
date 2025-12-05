import { FontColors, Fonts, createFontStyle } from '@/constants/Fonts';

// Custom hook to easily access font styles throughout the app
export const useFonts = () => {
  return {
    // Header styles
    headerLarge: Fonts.header.large,
    headerMedium: Fonts.header.medium,
    headerSmall: Fonts.header.small,
    
    // Subheader styles
    subheaderLarge: Fonts.subheader.large,
    subheaderMedium: Fonts.subheader.medium,
    subheaderSmall: Fonts.subheader.small,
    
    // Body text styles
    bodyLarge: Fonts.body.large,
    bodyMedium: Fonts.body.medium,
    bodySmall: Fonts.body.small,
    
    // Button text styles
    buttonLarge: Fonts.button.large,
    buttonMedium: Fonts.button.medium,
    buttonSmall: Fonts.button.small,
    
    // Caption styles
    captionLarge: Fonts.caption.large,
    captionMedium: Fonts.caption.medium,
    captionSmall: Fonts.caption.small,
    
    // Special styles (amounts, numbers)
    amountLarge: Fonts.special.largeAmount,
    amountMedium: Fonts.special.mediumAmount,
    amountSmall: Fonts.special.smallAmount,
    
    // White text styles
    whiteLarge: Fonts.white.large,
    whiteMedium: Fonts.white.medium,
    whiteSmall: Fonts.white.small,
    
    // Grey text styles
    greyLarge: Fonts.grey.large,
    greyMedium: Fonts.grey.medium,
    greySmall: Fonts.grey.small,
    
    // Utility functions
    withColor: (fontStyle: any, color: string) => createFontStyle(fontStyle, color),
    
    // Color constants
    colors: FontColors,
  };
};

export default useFonts;

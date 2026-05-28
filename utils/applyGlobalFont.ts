import { FontFamily } from '@/constants/Typography';
import { Text, TextInput, type TextProps, type TextStyle } from 'react-native';

/**
 * Sets default font for all Text / TextInput in the app (Poppins Regular).
 * Custom styles should set fontFamily via Fonts.ts or fontFamilyForWeight().
 */
export function applyGlobalFont() {
  const baseStyle: TextStyle = { fontFamily: FontFamily.regular };

  const textDefaults = (Text as unknown as { defaultProps?: Partial<TextProps> })
    .defaultProps;
  (Text as unknown as { defaultProps?: Partial<TextProps> }).defaultProps = {
    ...textDefaults,
    style: [baseStyle, textDefaults?.style],
  };

  const inputDefaults = (
    TextInput as unknown as { defaultProps?: { style?: TextStyle } }
  ).defaultProps;
  (TextInput as unknown as { defaultProps?: { style?: TextStyle } }).defaultProps =
    {
      ...inputDefaults,
      style: [baseStyle, inputDefaults?.style],
    };
}

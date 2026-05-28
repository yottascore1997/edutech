/**
 * Global Poppins font families — use across the entire app.
 * Load fonts in app/_layout.tsx before rendering.
 */
export const FontFamily = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
} as const;

export type FontWeightKey = '400' | '500' | '600' | '700' | '800' | '900';

/** Map React Native fontWeight to the correct Poppins file. */
export function fontFamilyForWeight(
  weight?: string | number | null
): string {
  const w = weight == null ? '400' : String(weight);
  if (w === '900' || w === '800') return FontFamily.extraBold;
  if (w === '700' || w === 'bold') return FontFamily.bold;
  if (w === '600' || w === 'semibold') return FontFamily.semiBold;
  if (w === '500' || w === 'medium') return FontFamily.medium;
  return FontFamily.regular;
}

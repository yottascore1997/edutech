import { HomeTheme } from '@/constants/HomeTheme';
import { StyleSheet, View } from 'react-native';

export default function HomeDotPattern() {
  const dots = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 11; col++) {
      dots.push(
        <View
          key={`${row}-${col}`}
          style={[styles.dot, { left: col * 22 + 10, top: row * 22 + 10 }]}
        />
      );
    }
  }
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.glowOrb} />
      {dots}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  glowOrb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.5)',
    top: -50,
    right: -30,
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: HomeTheme.primary,
    opacity: 0.14,
  },
});

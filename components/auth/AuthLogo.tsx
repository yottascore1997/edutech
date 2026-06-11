import { AuthTheme } from '@/constants/AuthTheme';
import { FontFamily } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

/** Q-learn style: star icon + brand name */
export function AuthLogo() {
  return (
    <View style={styles.row}>
      <Ionicons name="sparkles" size={18} color={AuthTheme.ink} />
      <Text style={styles.name}>
        Yotta<Text style={styles.accent}>score</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: AuthTheme.ink,
    letterSpacing: -0.3,
  },
  accent: {
    fontFamily: FontFamily.extraBold,
    color: AuthTheme.primary,
  },
});

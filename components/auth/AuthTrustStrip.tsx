import { AuthTheme } from '@/constants/AuthTheme';
import { FontFamily } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ITEMS = [
  { icon: 'shield-checkmark' as const, label: 'Secure' },
  { icon: 'ribbon' as const, label: 'Verified' },
  { icon: 'people' as const, label: '10K+ Students' },
];

export function AuthTrustStrip() {
  return (
    <View style={styles.row}>
      {ITEMS.map((item) => (
        <View key={item.label} style={styles.chip}>
          <Ionicons name={item.icon} size={13} color={AuthTheme.primary} />
          <Text style={styles.txt}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: AuthTheme.inputBorder,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  txt: {
    fontSize: 10,
    fontFamily: FontFamily.semiBold,
    color: AuthTheme.inkSecondary,
  },
});

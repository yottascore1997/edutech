import { AuthTheme } from '@/constants/AuthTheme';
import { FontFamily } from '@/constants/Typography';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface AuthPrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AuthPrimaryButton({ label, onPress, loading, disabled }: AuthPrimaryButtonProps) {
  const off = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      disabled={off}
      style={[styles.btn, off && styles.btnOff]}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" size="small" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    backgroundColor: AuthTheme.primary,
    borderRadius: AuthTheme.radius,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: 8,
  },
  btnOff: {
    backgroundColor: '#93C5FD',
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
});

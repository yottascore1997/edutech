import { AuthTheme } from '@/constants/AuthTheme';
import { FontFamily } from '@/constants/Typography';
import { useToast } from '@/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AuthSocialProps {
  mode: 'sign in' | 'sign up';
}

export function AuthDivider({ text }: { text: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerTxt}>{text}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export function AuthSocial({ mode }: AuthSocialProps) {
  const { showError } = useToast();
  const dividerText = mode === 'sign in' ? 'Or sign in with' : 'Or sign up with';

  const onSocial = (provider: string) => {
    showError(`${provider} login coming soon!`);
  };

  return (
    <View style={styles.wrap}>
      <AuthDivider text={dividerText} />
      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => onSocial('Google')} activeOpacity={0.85}>
          <Ionicons name="logo-google" size={20} color={AuthTheme.google} />
          <Text style={styles.btnTxt}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => onSocial('Facebook')} activeOpacity={0.85}>
          <Ionicons name="logo-facebook" size={20} color={AuthTheme.facebook} />
          <Text style={styles.btnTxt}>Facebook</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: AuthTheme.inputBorder },
  dividerTxt: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: AuthTheme.inkMuted,
  },
  row: { flexDirection: 'row', gap: 14 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: AuthTheme.radius,
    borderWidth: 1.5,
    borderColor: AuthTheme.socialBorder,
    backgroundColor: AuthTheme.white,
  },
  btnTxt: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: AuthTheme.ink,
  },
});

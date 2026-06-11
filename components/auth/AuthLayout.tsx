import { AuthLogo } from '@/components/auth/AuthLogo';
import { AUTH_PAD, AuthTheme } from '@/constants/AuthTheme';
import { FontFamily } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import {
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface AuthLayoutProps {
  screenTitle: string;
  switchPrompt: string;
  switchAction: string;
  onSwitch: () => void;
  onBack?: () => void;
  illustration?: ImageSourcePropType;
  children: ReactNode;
}

export function AuthLayout({
  screenTitle,
  switchPrompt,
  switchAction,
  onSwitch,
  onBack,
  illustration,
  children,
}: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={[styles.back, { top: 4 }]}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={26} color={AuthTheme.ink} />
            </TouchableOpacity>
          ) : null}

          <View style={[styles.logoWrap, illustration && styles.logoWrapWithIllus]}>
            <AuthLogo />
          </View>

          {illustration ? (
            <View style={styles.illusWrap}>
              <Image source={illustration} style={styles.illus} resizeMode="contain" />
            </View>
          ) : null}

          <Text style={styles.screenTitle}>{screenTitle}</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchMuted}>{switchPrompt}</Text>
            <TouchableOpacity onPress={onSwitch} activeOpacity={0.8}>
              <Text style={styles.switchLink}>{switchAction}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AuthTheme.screenBg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: AUTH_PAD,
    paddingTop: 8,
  },
  back: {
    position: 'absolute',
    left: AUTH_PAD - 4,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  logoWrapWithIllus: {
    marginBottom: 16,
  },
  illusWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  illus: {
    width: 200,
    height: 150,
  },
  screenTitle: {
    fontSize: 32,
    fontFamily: FontFamily.extraBold,
    color: AuthTheme.ink,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 28,
  },
  switchMuted: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: AuthTheme.inkSecondary,
  },
  switchLink: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: AuthTheme.primary,
  },
  form: {
    width: '100%',
  },
});

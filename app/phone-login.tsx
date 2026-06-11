import { AuthLogo } from '@/components/auth/AuthLogo';
import { AuthTrustStrip } from '@/components/auth/AuthTrustStrip';
import { firebaseConfig } from '@/config/firebase';
import { AUTH_PAD, AuthTheme } from '@/constants/AuthTheme';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Step = 'phone' | 'otp';

const RESEND_SECONDS = 30;

const BG_IMAGE = require('@/assets/images/loginbg.png');

function formatPhoneDisplay(digits: string) {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

function OtpBoxes({
  value,
  onChange,
  onComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.replace(/\D/g, '').slice(0, 6);

  const handleChange = (text: string) => {
    const next = text.replace(/\D/g, '').slice(0, 6);
    onChange(next);
    if (next.length === 6) onComplete?.(next);
  };

  return (
    <View style={otpStyles.wrap}>
      <TextInput
        ref={inputRef}
        value={digits}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        caretHidden
        style={otpStyles.hiddenInput}
      />
      <View style={otpStyles.row}>
        {Array.from({ length: 6 }).map((_, i) => {
          const char = digits[i] ?? '';
          const active = i === digits.length;
          const filled = !!char;
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.85}
              onPress={() => inputRef.current?.focus()}
              style={[
                otpStyles.box,
                filled && otpStyles.boxFilled,
                active && otpStyles.boxActive,
              ]}
            >
              <Text style={otpStyles.digit}>{char}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const otpStyles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: 8 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxHeight: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  boxActive: {
    borderColor: AuthTheme.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: AuthTheme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  digit: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: AuthTheme.ink,
  },
});

export default function PhoneLogin() {
  const auth = useAuth();
  const { showError, showSuccess } = useToast();
  const insets = useSafeAreaInsets();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const phoneInputRef = useRef<TextInput>(null);

  const [step, setStep] = useState<Step>('phone');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const phoneForApi = phoneDigits.replace(/\D/g, '');

  const sendOtp = async () => {
    if (loading) return;
    if (phoneForApi.length < 10) {
      showError('Please enter a valid 10-digit mobile number.');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setLoading(true);
    try {
      await auth.loginWithOTP(phoneForApi, recaptchaVerifier.current);
      setStep('otp');
      setOtp('');
      setResendIn(RESEND_SECONDS);
      showSuccess('OTP sent to your phone.');
    } catch (error: any) {
      showError(error?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (code?: string) => {
    if (loading) return;
    const pin = (code ?? otp).trim();
    if (pin.length !== 6) {
      showError('Please enter the 6-digit OTP.');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setLoading(true);
    try {
      await auth.verifyOTP(pin);
      showSuccess('Login successful! Welcome back.');
    } catch (error: any) {
      showError(error?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const goBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setResendIn(0);
  };

  return (
    <>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />

      <ImageBackground source={BG_IMAGE} style={styles.root} resizeMode="cover">
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.page}>
              <View style={styles.header}>
                <View style={styles.logoPill}>
                  <AuthLogo />
                </View>
              </View>

              <View style={[styles.bottom, { bottom: insets.bottom + 4 }]}>
              <View style={styles.card}>
                {step === 'phone' ? (
                  <>
                    <Text style={styles.cardLabel}>Mobile Number</Text>
                    <View style={styles.phoneRow}>
                      <View style={styles.phoneInputWrap}>
                        <Text style={styles.prefix}>+91</Text>
                        <View style={styles.prefixDivider} />
                        <TextInput
                          ref={phoneInputRef}
                          value={formatPhoneDisplay(phoneDigits)}
                          onChangeText={(t) =>
                            setPhoneDigits(t.replace(/\D/g, '').slice(0, 10))
                          }
                          keyboardType="phone-pad"
                          style={styles.phoneInput}
                          maxLength={11}
                          autoFocus
                        />
                        {phoneForApi.length === 10 ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color="#10B981"
                            style={styles.phoneCheck}
                          />
                        ) : null}
                      </View>
                    </View>
                    <Text style={styles.hint}>
                      We'll send a one-time password via SMS. Standard rates may apply.
                    </Text>

                    <TouchableOpacity
                      onPress={sendOtp}
                      activeOpacity={0.9}
                      disabled={loading || phoneForApi.length < 10}
                      style={[
                        styles.ctaWrap,
                        (loading || phoneForApi.length < 10) && styles.ctaDisabled,
                      ]}
                    >
                      <LinearGradient
                        colors={
                          phoneForApi.length >= 10
                            ? ['#3B82F6', '#2563EB']
                            : ['#93C5FD', '#93C5FD']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.cta}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <>
                            <Text style={styles.ctaText}>Send OTP</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={goBackToPhone}
                      style={styles.changeNumber}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="pencil" size={14} color={AuthTheme.primary} />
                      <Text style={styles.changeNumberTxt}>Change number</Text>
                    </TouchableOpacity>

                    <Text style={styles.cardLabel}>Enter 6-digit OTP</Text>
                    <OtpBoxes
                      value={otp}
                      onChange={setOtp}
                      onComplete={(code) => verifyOtp(code)}
                    />

                    <TouchableOpacity
                      onPress={() => verifyOtp()}
                      activeOpacity={0.9}
                      disabled={loading || otp.length !== 6}
                      style={[
                        styles.ctaWrap,
                        (loading || otp.length !== 6) && styles.ctaDisabled,
                      ]}
                    >
                      <LinearGradient
                        colors={
                          otp.length === 6
                            ? ['#3B82F6', '#2563EB']
                            : ['#93C5FD', '#93C5FD']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.cta}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <>
                            <Text style={styles.ctaText}>Verify & Login</Text>
                            <Ionicons name="log-in-outline" size={20} color="#FFF" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={sendOtp}
                      disabled={loading || resendIn > 0}
                      style={styles.resend}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.resendTxt, resendIn > 0 && styles.resendMuted]}>
                        {resendIn > 0
                          ? `Resend OTP in ${resendIn}s`
                          : "Didn't receive code? Resend OTP"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <AuthTrustStrip />
              </View>

              </View>
            </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  page: {
    flex: 1,
    paddingHorizontal: AUTH_PAD,
  },
  bottom: {
    position: 'absolute',
    left: AUTH_PAD,
    right: AUTH_PAD,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
  },
  logoPill: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#1e3a5f',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  cardLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: AuthTheme.inkSecondary,
    marginBottom: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  phoneRow: {
    marginBottom: 12,
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingLeft: 12,
    paddingRight: 14,
    minHeight: 52,
  },
  prefix: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: AuthTheme.ink,
    paddingRight: 8,
  },
  prefixDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#D1D5DB',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: AuthTheme.ink,
    letterSpacing: 0.5,
    paddingVertical: 12,
  },
  phoneCheck: { marginLeft: 4 },
  hint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: AuthTheme.inkMuted,
    lineHeight: 18,
    marginBottom: 20,
  },

  ctaWrap: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  ctaDisabled: { opacity: 0.85 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
    minHeight: 56,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  changeNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginBottom: 16,
    marginTop: -4,
  },
  changeNumberTxt: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: AuthTheme.primary,
  },
  resend: { alignItems: 'center', marginTop: 18, paddingVertical: 4 },
  resendTxt: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: AuthTheme.primary,
  },
  resendMuted: {
    color: AuthTheme.inkMuted,
    fontFamily: FontFamily.medium,
  },

});

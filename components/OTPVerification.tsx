import { useAuth } from '@/context/AuthContext';
import authService from '@/services/authServiceFirebaseJS';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView, Platform, StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

interface OTPVerificationProps {
  phoneNumber: string;
  onVerificationSuccess: (user: any) => void;
  onBack: () => void;
  onResendOTP: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  phoneNumber,
  onVerificationSuccess,
  onBack,
  onResendOTP,
}) => {
  const { verifyOTP: authContextVerifyOTP } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<TextInput[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animation on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Start countdown
    startCountdown();
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    setCanResend(false);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Don't auto-verify - user must click verify button
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    // Prevent multiple simultaneous verification attempts
    if (loading) return;

    const otpToVerify = otpCode || otp.join('');

    if (otpToVerify.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      console.log('🔥 Verifying OTP in component:', otpToVerify);
      const result = await authService.verifyOTP(otpToVerify);

      if (result.success) {
        console.log('✅ OTP verification successful in component');

        // 🔥 STEP 1: Firebase OTP verification successful
        // 🔥 STEP 2: Now call AuthContext verifyOTP to set user in context and storage
        try {
          console.log('🔄 Calling AuthContext verifyOTP...');
          const authContextResult = await authContextVerifyOTP(otpToVerify);

          if (authContextResult.success) {
            console.log('✅ AuthContext verifyOTP successful');
            onVerificationSuccess(result.user);
          } else {
            console.error('❌ AuthContext verifyOTP failed:', authContextResult);
            Alert.alert('Error', 'Authentication failed. Please try again.');
          }
        } catch (authContextError) {
          console.error('❌ AuthContext verifyOTP error:', authContextError);
          Alert.alert('Error', 'Authentication failed. Please try again.');
        }
      } else {
        Alert.alert('Verification Failed', result.message || 'Invalid OTP');
        // Clear OTP on failure
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('❌ OTP verification error in component:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    
    try {
      await onResendOTP();
      startCountdown();
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith('+91')) {
      return `+91 ${phone.slice(3, 8)} ${phone.slice(8)}`;
    }
    return phone;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#A855F7']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity 
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => {
              // Close keyboard when tapping outside
              Keyboard.dismiss();
            }}
          >
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <View style={styles.headerContent}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC']}
                    style={styles.iconContainer}
                  >
                    <Ionicons name="shield-checkmark" size={36} color="#6366F1" />
                  </LinearGradient>
                  
                  <Text style={styles.title}>Verify OTP</Text>
                  <Text style={styles.subtitle}>
                    Enter the 6-digit code sent to{'\n'}
                    <Text style={styles.phoneNumber}>{formatPhoneNumber(phoneNumber)}</Text>
                  </Text>
                </View>
              </View>

              {/* OTP Input */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      if (ref) inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      digit ? styles.otpInputFilled : styles.otpInputEmpty,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              {/* Resend OTP */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>
                  Didn't receive the code?{' '}
                  {canResend ? (
                    <TouchableOpacity onPress={handleResendOTP} disabled={resendLoading}>
                      <Text style={styles.resendButton}>
                        {resendLoading ? 'Sending...' : 'Resend OTP'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.countdownText}>
                      Resend in {countdown}s
                    </Text>
                  )}
                </Text>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  otp.join('').length === 6 && !loading ? styles.verifyButtonActive : styles.verifyButtonDisabled,
                ]}
                onPress={() => handleVerifyOTP()}
                disabled={otp.join('').length !== 6 || loading}
              >
                <View
                  style={[
                    styles.verifyButtonGradient,
                    {
                      backgroundColor: otp.join('').length === 6 && !loading ? '#4CAF50' : '#E5E7EB',
                      borderWidth: otp.join('').length === 6 && !loading ? 2 : 0,
                      borderColor: otp.join('').length === 6 && !loading ? '#2E7D32' : 'transparent',
                    }
                  ]}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.verifyButtonText}>Verifying...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.verifyButtonText}>Verify OTP</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {/* Help Text */}
              <View style={styles.helpContainer}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.helpText}>
                  Enter the 6-digit verification code sent to{'\n'}
                  <Text style={styles.phoneNumber}>{formatPhoneNumber(phoneNumber)}</Text>{'\n'}
                  Make sure you have a stable internet connection
                </Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'rgba(156, 39, 176, 0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  phoneNumber: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  otpInputEmpty: {
    borderColor: '#E2E8F0',
    color: '#9CA3AF',
  },
  otpInputFilled: {
    borderColor: '#9C27B0',
    color: '#1E293B',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  resendButton: {
    color: '#FFFFFF',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  countdownText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  verifyButton: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  verifyButtonActive: {
    shadowOpacity: 0.4,
  },
  verifyButtonDisabled: {
    shadowOpacity: 0.1,
  },
  verifyButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginRight: 8,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  helpText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default OTPVerification;

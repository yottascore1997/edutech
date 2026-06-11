import { AuthInput } from '@/components/auth/AuthInput';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { AuthSocial } from '@/components/auth/AuthSocial';
import { useToast } from '@/context/ToastContext';
import { apiFetch } from '@/constants/api';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const Register = () => {
  const { showError } = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    if (!name || !username || !email || !password || !phoneNumber) {
      showError('Please fill all the required fields.');
      return;
    }
    if (password.length < 8) {
      showError('Password must be at least 8 characters and contain one letter and one number.');
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (!hasLetter || !hasNumber) {
      showError('Password must be at least 8 characters and contain one letter and one number.');
      return;
    }
    if (!email.includes('@')) {
      showError('Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      const userData = {
        name,
        username,
        email,
        password,
        phoneNumber,
        referralCode,
        role: 'STUDENT',
      };
      const res = await apiFetch('/auth/register', { method: 'POST', body: userData });
      if (res?.ok) {
        router.replace({ pathname: '/check-email', params: { email } } as any);
        return;
      }
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error?.response?.data?.message) errorMessage = error.response.data.message;
      else if (error?.data?.message) errorMessage = error.data.message;
      else if (error?.message) errorMessage = error.message;
      if (error?.status === 429 || error?.data?.statusCode === 429) {
        showError('Too many attempts. Please try again later.');
        return;
      }
      if (errorMessage.toLowerCase().includes('email already exists')) {
        showError('This email is already registered. Please use a different email or try logging in.');
      } else if (errorMessage.toLowerCase().includes('phone')) {
        showError('Please enter a valid phone number.');
      } else {
        showError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      screenTitle="Sign Up"
      switchPrompt="Already have an account?, "
      switchAction="Sign in"
      onSwitch={() => router.replace('/phone-login')}
      onBack={() => router.back()}
    >
      <AuthInput label="Full Name" value={name} onChangeText={setName} />
      <AuthInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <AuthInput
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AuthInput label="Create Password" value={password} onChangeText={setPassword} secureToggle />
      <AuthInput
        label="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      <AuthInput
        label="Referral Code (optional)"
        value={referralCode}
        onChangeText={setReferralCode}
        autoCapitalize="characters"
      />

      <AuthPrimaryButton label="Register" onPress={handleRegister} loading={isSubmitting} />
      <AuthSocial mode="sign up" />
    </AuthLayout>
  );
};

export default Register;

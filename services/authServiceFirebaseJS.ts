import { auth } from '@/config/firebase';
import {
    ConfirmationResult,
    signInWithPhoneNumber
} from 'firebase/auth';

export interface OTPResult {
  success: boolean;
  message: string;
  verificationId?: string;
  sessionInfo?: string; // For backend compatibility
}

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  user?: any;
}

class AuthServiceFirebaseJS {
  private confirmationResult: ConfirmationResult | null = null;

  // ✅ Setup Application Verifier for Expo/React Native
  private setupRecaptcha() {
    try {
      // For React Native/Expo, we'll use a mock verifier for now
      // In production, you might need to implement proper recaptcha
      if (!this.appVerifier) {
        this.appVerifier = {
          type: 'recaptcha',
          verify: () => Promise.resolve('mock-recaptcha-token'),
          _reset: () => {
            console.log('🔄 Mock verifier reset');
          }
        };
      }
      console.log('✅ Mock application verifier setup for React Native');
    } catch (error) {
      console.error('❌ Application verifier setup failed:', error);
    }
  }

  private appVerifier: any = null;

  // Send OTP
  async sendOTP(phoneNumber: string): Promise<OTPResult> {
    try {
      const formattedPhoneNumber = phoneNumber.startsWith('+91')
        ? phoneNumber
        : `+91${phoneNumber}`;

      console.log('🔥 Sending OTP to:', formattedPhoneNumber);

      // For React Native/Expo, use a production-ready approach
      try {
        this.setupRecaptcha();

        if (!this.appVerifier) {
          return {
            success: false,
            message: 'Application verifier not initialized',
          };
        }

        this.confirmationResult = await signInWithPhoneNumber(
          auth,
          formattedPhoneNumber,
          this.appVerifier
        );

      return {
        success: true,
        message: 'OTP sent successfully!',
        verificationId: this.confirmationResult.verificationId,
        sessionInfo: this.confirmationResult.verificationId, // For backend compatibility
      };
      } catch (firebaseError: any) {
        console.error('❌ Firebase Phone Auth error:', firebaseError);

        // For development/testing, provide helpful error messages
        if (firebaseError.code === 'auth/argument-error') {
          return {
            success: false,
            message: 'Phone authentication is not available in development mode. Please test on a built app or real device.',
          };
        }

        return {
          success: false,
          message: this.getErrorMessage(firebaseError.code),
        };
      }
    } catch (error: any) {
      console.error('❌ Error sending OTP:', error);
      return {
        success: false,
        message: this.getErrorMessage(error.code || 'unknown'),
      };
    }
  }

  // Verify OTP
  async verifyOTP(otp: string): Promise<VerifyOTPResult> {
    try {
      console.log('🔥 Verifying OTP:', otp);

      if (!this.confirmationResult) {
        return {
          success: false,
          message: 'No verification session found. Please request OTP again.',
        };
      }

      // Use Firebase's confirm method (standard approach)
      const result = await this.confirmationResult.confirm(otp);
      console.log('✅ OTP verified successfully, Firebase user:', result.user);

      return {
        success: true,
        message: 'OTP verified successfully!',
        user: result.user,
      };
    } catch (error: any) {
      console.error('❌ Verification Error:', error);

      // For development, return mock success for testing
      if (__DEV__ && otp === '123456') {
        const mockUser = {
          uid: 'dev-user-' + Date.now(),
          phoneNumber: '+919529092412',
          displayName: 'Dev User',
          email: null,
          getIdToken: () => Promise.resolve('dev-firebase-token-' + Date.now()),
        } as any;

        return {
          success: true,
          message: 'OTP verified successfully! (Development mode)',
          user: mockUser,
        };
      }

      return {
        success: false,
        message: this.getErrorMessage(error.code),
      };
    }
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-phone-number':
        return 'Invalid phone number format.';
      case 'auth/too-many-requests':
        return 'Too many requests. Try again later.';
      case 'auth/invalid-verification-code':
        return 'Invalid OTP.';
      case 'auth/code-expired':
        return 'OTP expired.';
      case 'auth/session-expired':
        return 'Session expired. Please request OTP again.';
      default:
        return `Error: ${errorCode}`;
    }
  }

  async signOut(): Promise<void> {
    await auth.signOut();
    this.confirmationResult = null;
  }

  getCurrentUser() {
    return auth.currentUser;
  }
}

export default new AuthServiceFirebaseJS();

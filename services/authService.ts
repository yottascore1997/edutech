import { auth } from '@/config/firebase';
import {
    ConfirmationResult,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'firebase/auth';

export interface OTPResult {
  success: boolean;
  message: string;
  verificationId?: string;
}

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  user?: any;
}

class AuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  // Initialize reCAPTCHA verifier for React Native (Not used in current implementation)
  initializeRecaptcha(containerId: string = 'recaptcha-container') {
    console.log('reCAPTCHA not needed for React Native OTP');
    this.recaptchaVerifier = null;
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber: string): Promise<OTPResult> {
    try {
      // Format phone number for India (+91)
      const formattedPhoneNumber = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      console.log('Sending OTP to:', formattedPhoneNumber);
      
      // For React Native, use signInWithPhoneNumber without reCAPTCHA
      // reCAPTCHA is not needed for React Native in most cases
      this.confirmationResult = await signInWithPhoneNumber(
        auth, 
        formattedPhoneNumber
      );

      return {
        success: true,
        message: 'OTP sent successfully',
        verificationId: this.confirmationResult.verificationId
      };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: this.getErrorMessage(error.code)
      };
    }
  }

  // Verify OTP
  async verifyOTP(otp: string): Promise<VerifyOTPResult> {
    try {
      console.log('Verifying OTP:', otp);
      
      // Real Firebase verification
      if (!this.confirmationResult) {
        return {
          success: false,
          message: 'No verification session found. Please request OTP again.'
        };
      }

      const result = await this.confirmationResult.confirm(otp);
      
      return {
        success: true,
        message: 'OTP verified successfully',
        user: result.user
      };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: this.getErrorMessage(error.code)
      };
    }
  }

  // Get user-friendly error messages
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-phone-number':
        return 'Invalid phone number format';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later';
      case 'auth/invalid-verification-code':
        return 'Invalid OTP. Please check and try again';
      case 'auth/code-expired':
        return 'OTP has expired. Please request a new one';
      case 'auth/session-expired':
        return 'Session expired. Please request OTP again';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection';
      default:
        return 'An error occurred. Please try again';
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    try {
      await auth.signOut();
      this.confirmationResult = null;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  // Clean up reCAPTCHA (Not needed for React Native)
  cleanup() {
    console.log('reCAPTCHA cleanup not needed for React Native');
    this.recaptchaVerifier = null;
  }
}

export default new AuthService();

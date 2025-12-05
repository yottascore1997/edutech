import { auth } from '@/config/firebase';
import {
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

class AuthServiceExpo {
  private confirmationResult: any = null;

  // Send OTP to phone number using Real Firebase
  async sendOTP(phoneNumber: string): Promise<OTPResult> {
    try {
      // Format phone number for India (+91)
      const formattedPhoneNumber = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      console.log('Sending REAL OTP to:', formattedPhoneNumber);
      
      // Real Firebase OTP sending - no mock, only real implementation
      this.confirmationResult = await signInWithPhoneNumber(
        auth, 
        formattedPhoneNumber
      );
      
      return {
        success: true,
        message: 'OTP sent successfully! Check your SMS.',
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

  // Verify OTP with Real Firebase
  async verifyOTP(otp: string): Promise<VerifyOTPResult> {
    try {
      console.log('Verifying REAL OTP:', otp);
      
      // Real Firebase verification only
      if (!this.confirmationResult) {
        return {
          success: false,
          message: 'No verification session found. Please request OTP again.'
        };
      }

      const result = await this.confirmationResult.confirm(otp);
      
      return {
        success: true,
        message: 'OTP verified successfully!',
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

  // Real Firebase implementation - no mock properties needed

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
      case 'auth/argument-error':
        return 'Firebase configuration issue. Using mock mode for development.';
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

  // Clean up
  cleanup() {
    this.confirmationResult = null;
  }
}

export default new AuthServiceExpo();

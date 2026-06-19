import { auth, firebaseConfig } from '@/config/firebase';
import { ConfirmationResult, signInWithPhoneNumber } from 'firebase/auth';

export interface OTPResult {
  success: boolean;
  message: string;
  verificationId?: string;
}

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  user?: import('firebase/auth').User;
}

class AuthServiceFirebaseJS {
  private confirmationResult: ConfirmationResult | null = null;
  private mockVerifier: any = {
    type: 'recaptcha',
    verify: async () => 'mock-verification-token',
  };

  async sendOTP(phoneNumber: string, appVerifier?: any): Promise<OTPResult> {
    try {
      this.confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier || this.mockVerifier);

      return {
        success: true,
        message: 'OTP sent successfully!',
        verificationId: this.confirmationResult.verificationId,
      };
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error?.code || error?.message || 'unknown'),
      };
    }
  }

  async verifyOTP(otp: string): Promise<VerifyOTPResult> {
    try {
      if (!this.confirmationResult) {
        return {
          success: false,
          message: 'No verification session found. Please request OTP again.',
        };
      }

      const result = await this.confirmationResult.confirm(otp);

      return {
        success: true,
        message: 'OTP verified successfully!',
        user: result.user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error?.code || 'unknown'),
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
      case 'auth/argument-error':
        return 'Phone authentication failed. Please try again.';
      default:
        return typeof errorCode === 'string' && errorCode.startsWith('auth/')
          ? `Authentication error: ${errorCode}`
          : String(errorCode);
    }
  }

  async signOut(): Promise<void> {
    await auth.signOut();
    this.confirmationResult = null;
  }

  getCurrentUser() {
    return auth.currentUser;
  }

  clearSession() {
    this.confirmationResult = null;
  }
}

export { firebaseConfig };
export default new AuthServiceFirebaseJS();

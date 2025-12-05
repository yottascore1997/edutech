import auth from '@react-native-firebase/auth';

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

class AuthServiceRN {
  private confirmationResult: any = null;

  // Send OTP to phone number using React Native Firebase
  async sendOTP(phoneNumber: string): Promise<OTPResult> {
    try {
      // Format phone number for India (+91)
      const formattedPhoneNumber = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      console.log('Sending OTP to:', formattedPhoneNumber);
      
      // Use React Native Firebase Auth
      const confirmation = await auth().signInWithPhoneNumber(formattedPhoneNumber);
      this.confirmationResult = confirmation;
      
      return {
        success: true,
        message: 'OTP sent successfully',
        verificationId: confirmation.verificationId
      };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: this.getErrorMessage(error.code)
      };
    }
  }

  // Verify OTP using React Native Firebase
  async verifyOTP(otp: string): Promise<VerifyOTPResult> {
    try {
      console.log('Verifying OTP:', otp);
      
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
      await auth().signOut();
      this.confirmationResult = null;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return auth().currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!auth().currentUser;
  }

  // Clean up
  cleanup() {
    this.confirmationResult = null;
  }
}

export default new AuthServiceRN();















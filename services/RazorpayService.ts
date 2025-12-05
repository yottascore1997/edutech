import { RAZORPAY_CONFIG } from '@/config/razorpay';
import { apiFetchAuth } from '@/constants/api';

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  handler: (response: any) => void;
  modal: {
    ondismiss: () => void;
  };
}

export interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

class RazorpayService {
  private static instance: RazorpayService;
  private razorpay: any = null;

  private constructor() {
    this.initializeRazorpay();
  }

  public static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  private async initializeRazorpay() {
    try {
      // For React Native, we'll use the web version
      if (typeof window !== 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.head.appendChild(script);
        
        script.onload = () => {
          this.razorpay = (window as any).Razorpay;
        };
      }
    } catch (error) {
      console.error('Error initializing Razorpay:', error);
    }
  }

  public async createOrder(amount: number, currency: string = 'INR', userToken: string): Promise<any> {
    try {
      const response = await apiFetchAuth('/student/wallet/razorpay/create-order', userToken, {
        method: 'POST',
        body: {
          amount: amount * 100, // Convert to paise
          currency: currency
        }
      });

      if (response.ok) {
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  public async verifyPayment(paymentData: PaymentResponse, userToken: string): Promise<any> {
    try {
      const response = await apiFetchAuth('/student/wallet/razorpay/verify-payment', userToken, {
        method: 'POST',
        body: paymentData
      });

      if (response.ok) {
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  public openRazorpay(options: RazorpayOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.razorpay) {
        reject(new Error('Razorpay not initialized'));
        return;
      }

      const razorpayOptions = {
        ...options,
        handler: (response: any) => {
          resolve(response);
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          }
        }
      };

      const razorpayInstance = new this.razorpay(razorpayOptions);
      razorpayInstance.open();
    });
  }

  public async processPayment(
    amount: number,
    userDetails: { name?: string; email?: string; contact?: string },
    userToken: string
  ): Promise<any> {
    try {
      // 1. Create order
      const orderData = await this.createOrder(amount, 'INR', userToken);
      
      // 2. Open Razorpay checkout
      const paymentOptions: RazorpayOptions = {
        key: orderData.key_id || RAZORPAY_CONFIG.KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: RAZORPAY_CONFIG.COMPANY.name,
        description: `${RAZORPAY_CONFIG.COMPANY.description} - ₹${amount}`,
        order_id: orderData.id,
        prefill: {
          name: userDetails.name || '',
          email: userDetails.email || '',
          contact: userDetails.contact || ''
        },
        theme: RAZORPAY_CONFIG.THEME,
        handler: () => {}, // Will be overridden
        modal: {
          ondismiss: () => {} // Will be overridden
        }
      };

      const paymentResponse = await this.openRazorpay(paymentOptions);
      
      // 3. Verify payment
      const verificationResult = await this.verifyPayment(paymentResponse, userToken);
      
      return {
        success: true,
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
        amount: amount,
        verification: verificationResult
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }
}

export default RazorpayService;

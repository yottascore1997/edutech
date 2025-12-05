// Razorpay Configuration
export const RAZORPAY_CONFIG = {
  // Replace with your actual Razorpay Key ID
  KEY_ID: 'rzp_test_xxxxxxxxxxxxxxxx', // Your Razorpay Key ID
  
  // Currency
  CURRENCY: 'INR',
  
  // Theme colors
  THEME: {
    color: '#4F46E5'
  },
  
  // Company details
  COMPANY: {
    name: 'Exam Platform',
    description: 'Wallet Recharge'
  }
};

// Environment-specific configurations
export const getRazorpayConfig = () => {
  const isDevelopment = __DEV__;
  
  return {
    ...RAZORPAY_CONFIG,
    // Add environment-specific settings here
    isDevelopment
  };
};

# Razorpay Payment Integration Setup

## 🚀 Razorpay Wallet Integration Complete!

Your wallet system is now integrated with Razorpay payment gateway. Here's what has been implemented:

### ✅ Features Added:

1. **Razorpay Payment Service** - Complete payment processing
2. **Payment Modal** - Beautiful UI for payment selection
3. **Wallet Integration** - Seamless wallet recharge
4. **Error Handling** - Comprehensive error management
5. **Success/Failure Handling** - Proper payment status handling

### 🔧 Backend API Endpoints Required:

Your backend needs to implement these endpoints:

#### 1. Create Razorpay Order
```
POST /student/wallet/razorpay/create-order
Headers: Authorization: Bearer {token}
Body: {
  "amount": 10000, // Amount in paise (₹100 = 10000 paise)
  "currency": "INR"
}

Response: {
  "id": "order_xxxxxxxxx",
  "amount": 10000,
  "currency": "INR",
  "key_id": "rzp_test_xxxxxxxxx"
}
```

#### 2. Verify Payment
```
POST /student/wallet/razorpay/verify-payment
Headers: Authorization: Bearer {token}
Body: {
  "razorpay_payment_id": "pay_xxxxxxxxx",
  "razorpay_order_id": "order_xxxxxxxxx",
  "razorpay_signature": "xxxxxxxxx"
}

Response: {
  "success": true,
  "message": "Payment verified successfully",
  "wallet_balance": 1000.00
}
```

### 🔑 Razorpay Configuration:

1. **Get Razorpay Credentials:**
   - Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Get your Key ID and Key Secret
   - Update `config/razorpay.ts` with your Key ID

2. **Update Configuration:**
   ```typescript
   // config/razorpay.ts
   export const RAZORPAY_CONFIG = {
     KEY_ID: 'rzp_test_your_key_id_here', // Replace with your Key ID
     // ... other config
   };
   ```

### 📱 How It Works:

1. **User clicks "Add Cash"** in wallet
2. **Selects amount** from predefined options or enters custom amount
3. **Clicks "Pay with Razorpay"**
4. **Razorpay checkout opens** with payment options
5. **User completes payment** using UPI, cards, net banking, etc.
6. **Payment is verified** on backend
7. **Wallet balance is updated** automatically

### 🎨 UI Features:

- **Predefined Amount Buttons** - Quick selection (₹100, ₹250, ₹500, etc.)
- **Custom Amount Input** - Enter any amount
- **Beautiful Payment Modal** - Modern, user-friendly interface
- **Loading States** - Proper loading indicators
- **Error Handling** - User-friendly error messages
- **Success Feedback** - Clear success notifications

### 🔒 Security Features:

- **Server-side verification** - All payments verified on backend
- **Secure order creation** - Orders created on server
- **Signature verification** - Razorpay signature validation
- **Token-based authentication** - Secure API calls

### 🧪 Testing:

#### Test Mode:
- Use Razorpay test credentials
- Test with test cards: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

#### Production Mode:
- Use live Razorpay credentials
- Real payments will be processed

### 📋 Backend Implementation Guide:

#### 1. Install Razorpay SDK:
```bash
npm install razorpay
```

#### 2. Create Order Endpoint:
```javascript
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: 'your_key_id',
  key_secret: 'your_key_secret'
});

// Create order endpoint
app.post('/student/wallet/razorpay/create-order', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    const order = await razorpay.orders.create({
      amount: amount,
      currency: currency,
      receipt: `receipt_${Date.now()}`
    });
    
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 3. Verify Payment Endpoint:
```javascript
const crypto = require('crypto');

app.post('/student/wallet/razorpay/verify-payment', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    
    // Create signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    // Verify signature
    if (expectedSignature === razorpay_signature) {
      // Update wallet balance
      await updateWalletBalance(req.user.id, amount);
      
      res.json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      res.status(400).json({ error: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 🎯 Next Steps:

1. **Update Razorpay Key ID** in `config/razorpay.ts`
2. **Implement backend endpoints** as shown above
3. **Test with test credentials** first
4. **Deploy to production** with live credentials

### 📞 Support:

- **Razorpay Documentation**: [https://razorpay.com/docs/](https://razorpay.com/docs/)
- **Razorpay Support**: [https://razorpay.com/support/](https://razorpay.com/support/)

Your wallet system is now ready for Razorpay payments! 🎉

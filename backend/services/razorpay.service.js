const Razorpay = require('razorpay');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ CRITICAL: Razorpay API keys are missing in .env');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'missing_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'missing_secret',
});

module.exports = razorpay;

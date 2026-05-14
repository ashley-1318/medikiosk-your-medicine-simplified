const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { sendFcmNotification, saveNotification } = require('../lib/fcm');

// POST /notifications/send
router.post('/send', async (req, res) => {
  try {
    const { trigger, user_id, name, doctor_name, medicine_names, date_time } = req.body;
    if (!user_id || !trigger) return res.status(400).json({ error: 'user_id and trigger required' });

    // Get user FCM token
    const { data: user } = await supabase.from('users').select('fcm_token').eq('id', user_id).single();
    const fcmToken = user?.fcm_token ?? null;

    let title = '';
    let body = '';

    switch (trigger) {
      case 'welcome':
        title = 'Welcome to MEDIKIOSK 👋';
        body = `Hi ${name ?? 'User'}! Your account is ready. No queues. No waiting. Just care.`;
        break;
      case 'approved':
        title = '✅ Prescription Approved!';
        body = `Dr. ${doctor_name ?? 'Doctor'} approved your prescription. Please collect your medicines.`;
        break;
      case 'rejected':
        title = '❌ Prescription Rejected';
        body = `Your prescription was rejected. Please re-upload with a clearer image.`;
        break;
      case 'dispensed':
        title = '🎉 Medicines Dispensed!';
        body = `Your medicines (${medicine_names ?? ''}) were dispensed on ${date_time ?? new Date().toLocaleString()}. Get well soon! 💊`;
        break;
      case 'new_prescription':
        title = '📋 New Prescription Received';
        body = `Patient ${name ?? 'Unknown'} has submitted a prescription for your review.`;
        break;
      default:
        return res.status(400).json({ error: `Unknown trigger: ${trigger}` });
    }

    const result = await sendFcmNotification(fcmToken, title, body);
    await saveNotification(user_id, trigger, body, result);

    res.json({ success: true, fcm: result });
  } catch (err) {
    console.error('[/notifications/send]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

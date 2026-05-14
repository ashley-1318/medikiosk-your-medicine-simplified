// FCM send helper — used by all notification triggers
const admin = require('./firebase-admin');
const supabase = require('./supabase');

/**
 * Send a push notification to a single device via FCM.
 * @param {string|null} fcmToken - The device FCM registration token
 * @param {string} title - Notification title
 * @param {string} body  - Notification body
 */
async function sendFcmNotification(fcmToken, title, body) {
  if (!fcmToken) return { success: false, reason: 'no_token' };
  try {
    await admin.messaging().send({ notification: { title, body }, token: fcmToken });
    return { success: true };
  } catch (err) {
    console.error('[FCM Error]', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Persist a notification record in Supabase notifications table.
 */
async function saveNotification(userId, type, message, fcmResult) {
  await supabase.from('notifications').insert([{
    user_id: userId,
    type,
    message,
    sms_status: fcmResult?.success ? 'sent' : 'failed',
    sent_at: new Date().toISOString(),
  }]);
}

module.exports = { sendFcmNotification, saveNotification };

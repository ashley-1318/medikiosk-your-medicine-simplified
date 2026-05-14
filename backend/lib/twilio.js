const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

let client;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

/**
 * Sends an OTP to the given phone number using Twilio Verify
 * @param {string} phoneNumber - E.164 formatted phone number
 * @returns {Promise<any>}
 */
async function sendOtp(phoneNumber) {
    if (!client || !verifyServiceSid) {
        // Fallback for development if credentials are missing
        console.warn('Twilio credentials missing. Skipping SMS send.');
        if (phoneNumber === '+919999999999') return { status: 'pending', mock: true };
        throw new Error('Twilio configuration missing');
    }

    try {
        const verification = await client.verify.v2.services(verifyServiceSid)
            .verifications
            .create({ to: phoneNumber, channel: 'sms' });
        return verification;
    } catch (error) {
        console.error('Twilio Send OTP Error:', error);
        throw error;
    }
}

/**
 * Verifies an OTP for the given phone number
 * @param {string} phoneNumber - E.164 formatted phone number
 * @param {string} code - 6-digit code
 * @returns {Promise<any>}
 */
async function verifyOtp(phoneNumber, code) {
    if (!client || !verifyServiceSid) {
        // Fallback for development if credentials are missing
        console.warn('Twilio credentials missing. Checking for mock code.');
        if (phoneNumber === '+919999999999' && code === '123456') {
            return { status: 'approved', mock: true };
        }
        throw new Error('Twilio configuration missing');
    }

    try {
        const verificationCheck = await client.verify.v2.services(verifyServiceSid)
            .verificationChecks
            .create({ to: phoneNumber, code: code });
        return verificationCheck;
    } catch (error) {
        console.error('Twilio Verify OTP Error:', error);
        throw error;
    }
}

module.exports = {
    sendOtp,
    verifyOtp
};

const nodemailer = require('nodemailer');

// Configure the transporter
// For Gmail: host: 'smtp.gmail.com', port: 465, secure: true
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true' || true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // your gmail address
    pass: process.env.EMAIL_PASS, // your gmail app password
  },
});

const EmailService = {
  // EMAIL 1: SEND OTP EMAIL
  async sendOTPEmail(email, otp, userName = 'User') {
    try {
      await transporter.sendMail({
        from: `"MEDIKIOSK" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: `${otp} is your MEDIKIOSK verification code`,
        html: generateOTPEmailHTML(otp, userName)
      });
      return { success: true };
    } catch (error) {
      console.error('EmailService.sendOTPEmail error:', error);
      return { success: false, error };
    }
  },

  // EMAIL 2: WELCOME EMAIL (NEW USER)
  async sendWelcomeEmail(email, userName, role) {
    try {
      await transporter.sendMail({
        from: `"MEDIKIOSK" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: `Welcome to MEDIKIOSK, ${userName}! 🎉`,
        html: generateWelcomeEmailHTML(userName, role)
      });
      return { success: true };
    } catch (error) {
      console.error('EmailService.sendWelcomeEmail error:', error);
      return { success: false, error };
    }
  },

  // EMAIL 3: LOGIN NOTIFICATION (RETURNING USER)
  async sendLoginNotificationEmail(email, userName, loginTime) {
    try {
      await transporter.sendMail({
        from: `"MEDIKIOSK" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: `New login to your MEDIKIOSK account`,
        html: generateLoginNotificationHTML(userName, loginTime)
      });
      return { success: true };
    } catch (error) {
      console.error('EmailService.sendLoginNotificationEmail error:', error);
      return { success: false, error };
    }
  },

  // EMAIL 4: PRESCRIPTION APPROVED EMAIL
  async sendPrescriptionApprovedEmail(email, userName, medicines) {
    try {
      await transporter.sendMail({
        from: `"MEDIKIOSK" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: `✅ Your prescription has been approved - MEDIKIOSK`,
        html: generatePrescriptionApprovedHTML(userName, medicines)
      });
      return { success: true };
    } catch (error) {
      console.error('EmailService.sendPrescriptionApprovedEmail error:', error);
      return { success: false, error };
    }
  },

  // EMAIL 5: HEALTH REPORT EMAIL
  async sendHealthReportEmail(email, userName, reportUrl, medicines) {
    try {
      await transporter.sendMail({
        from: `"MEDIKIOSK" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: `📋 Your health report is ready - MEDIKIOSK`,
        html: generateHealthReportHTML(userName, reportUrl, medicines),
        attachments: [{
          filename: 'health-report.pdf',
          path: reportUrl
        }]
      });
      return { success: true };
    } catch (error) {
      console.error('EmailService.sendHealthReportEmail error:', error);
      return { success: false, error };
    }
  },

  // EMAIL 6: PAYMENT SUCCESS EMAIL
  async sendPaymentSuccessEmail(email, patientName, paymentData, receiptPDFBuffer) {
    try {
      const html = generatePaymentSuccessHTML(patientName, paymentData);
      await transporter.sendMail({
        from: `"MEDIKIOSK Payments" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: `✅ Payment Confirmed - Receipt #${paymentData.receiptId} | MEDIKIOSK`,
        html: html,
        attachments: [
          {
            filename: `MEDIKIOSK_Receipt_${paymentData.receiptId}.pdf`,
            content: receiptPDFBuffer,
            contentType: 'application/pdf'
          }
        ]
      });
      return { success: true };
    } catch (error) {
      console.error('EmailService.sendPaymentSuccessEmail error:', error);
      return { success: false, error };
    }
  },

  // EMAIL 7: MEDICINE DISPENSED EMAIL (THANK YOU + HEALTH REPORT)
  async sendDispensedThankYouEmail(email, patientName, dispenseData, healthReportPDFBuffer) {
    try {
      const html = generateDispensedThankYouHTML(patientName, dispenseData);
      await transporter.sendMail({
        from: `"MEDIKIOSK Health" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: `💊 Medicines Dispensed Successfully - MEDIKIOSK`,
        html: html,
        attachments: [
          {
            filename: `MEDIKIOSK_HealthReport_${dispenseData.dispenseId}.pdf`,
            content: healthReportPDFBuffer,
            contentType: 'application/pdf'
          }
        ]
      });
      return { success: true };
    } catch (error) {
      console.error('EmailService.sendDispensedThankYouEmail error:', error);
      return { success: false, error };
    }
  }
};

// --- HTML Templates (Same as before) ---

function generateOTPEmailHTML(otp, userName) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MEDIKIOSK OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f0e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 600px; width: 100%;">
          <tr>
            <td style="background-color: #1a3a2a; padding: 32px 40px; text-align: center;">
              <div style="width: 56px; height: 56px; background: #d4a853; border-radius: 14px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 28px;">💊</div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 4px; text-transform: uppercase;">MEDIKIOSK</h1>
              <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 8px 0 0; letter-spacing: 1px;">AI-Powered Medicine Dispensing</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <h2 style="color: #1a3a2a; font-size: 22px; font-weight: 600; margin: 0 0 8px;">Verification Code</h2>
              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
                Hello ${userName},<br>
                Use the code below to verify your identity. This code is valid for 5 minutes.
              </p>
              <div style="background: #f5f0e8; border: 2px dashed #d4a853; border-radius: 12px; padding: 24px 40px; margin: 0 0 32px; display: inline-block;">
                <p style="color: #1a3a2a; font-size: 48px; font-weight: 800; letter-spacing: 16px; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
              </div>
              <div style="background: #fff8ee; border-left: 4px solid #d4a853; border-radius: 4px; padding: 12px 16px; margin: 0 0 32px; text-align: left;">
                <p style="color: #9a6b1a; font-size: 13px; margin: 0;">⏰ This code expires in 5 minutes. Do not share this code with anyone.</p>
              </div>
              <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 0;">If you did not request this code,<br>please ignore this email or contact support.</p>
            </td>
          </tr>
          <tr>
            <td style="background: #1a3a2a; padding: 24px 40px; text-align: center;">
              <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 8px;">© 2026 MEDIKIOSK. All rights reserved.</p>
              <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0;">Your Prescription. Verified. Dispensed.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateWelcomeEmailHTML(userName, role) {
    const roleColors = { patient: '#1a3a2a', doctor: '#3b82f6', admin: '#d4a853' };
    const roleColor = roleColors[role.toLowerCase()] || '#1a3a2a';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MEDIKIOSK</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f0e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 600px; width: 100%;">
          <tr>
            <td style="background-color: #1a3a2a; padding: 32px 40px; text-align: center;">
              <div style="width: 56px; height: 56px; background: #d4a853; border-radius: 14px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 28px;">💊</div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 4px; text-transform: uppercase;">MEDIKIOSK</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <h2 style="color: #1a3a2a; font-size: 26px; font-weight: 600; margin: 0 0 16px;">Welcome to MEDIKIOSK, ${userName}! 👋</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Your AI-powered medicine dispensing account is ready. You are now part of the future of healthcare.</p>
              <div style="display: inline-block; padding: 6px 16px; border-radius: 20px; background-color: ${roleColor}; color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 32px;">${role}</div>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td width="33%" style="padding: 10px; text-align: center; vertical-align: top;">
                    <div style="font-size: 32px; margin-bottom: 8px;">🤖</div>
                    <div style="color: #1a3a2a; font-weight: 600; font-size: 14px; margin-bottom: 4px;">AI Prescription</div>
                    <div style="color: #888888; font-size: 11px;">98% accuracy in reading handwritten notes.</div>
                  </td>
                  <td width="33%" style="padding: 10px; text-align: center; vertical-align: top;">
                    <div style="font-size: 32px; margin-bottom: 8px;">🔒</div>
                    <div style="color: #1a3a2a; font-weight: 600; font-size: 14px; margin-bottom: 4px;">Fraud Protection</div>
                    <div style="color: #888888; font-size: 11px;">Verified for authenticity before dispensing.</div>
                  </td>
                  <td width="33%" style="padding: 10px; text-align: center; vertical-align: top;">
                    <div style="font-size: 32px; margin-bottom: 8px;">⚡</div>
                    <div style="color: #1a3a2a; font-weight: 600; font-size: 14px; margin-bottom: 4px;">Instant Dispensing</div>
                    <div style="color: #888888; font-size: 11px;">Get medicines in under 2 minutes, 24/7.</div>
                  </td>
                </tr>
              </table>

              <div style="text-align: left; background: #f9f9f9; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
                <h3 style="color: #1a3a2a; margin-top: 0;">Getting Started:</h3>
                <p style="margin: 8px 0;">📄 Step 1: Upload your prescription</p>
                <p style="margin: 8px 0;">🤖 Step 2: AI verifies and reads it</p>
                <p style="margin: 8px 0;">💊 Step 3: Collect your medicine</p>
              </div>

              <a href="https://medikiosk.com/dashboard" style="display: inline-block; background-color: #d4a853; color: #1a3a2a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">Start Using MEDIKIOSK →</a>
            </td>
          </tr>
          <tr>
            <td style="background: #1a3a2a; padding: 24px 40px; text-align: center;">
              <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 8px;">© 2026 MEDIKIOSK. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
}

function generateLoginNotificationHTML(userName, loginTime) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Login Detected</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f0e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 600px; width: 100%;">
          <tr>
            <td style="background-color: #1a3a2a; padding: 32px 40px; text-align: center;">
              <div style="width: 56px; height: 56px; background: #d4a853; border-radius: 14px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 28px;">💊</div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 4px; text-transform: uppercase;">MEDIKIOSK</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
              <h2 style="color: #1a3a2a; font-size: 22px; font-weight: 600; margin: 0 0 8px;">New Login Detected</h2>
              <p style="color: #666666; font-size: 15px; margin: 0 0 32px;">Hello ${userName}, someone just logged into your account.</p>
              
              <div style="background: #f9f9f9; border: 1px solid #eeeeee; border-radius: 12px; padding: 24px; text-align: left; margin-bottom: 32px;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #666666;">Time: <strong>${loginTime}</strong></p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #666666;">Method: <strong>Email OTP</strong></p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #666666;">Device: <strong>Web Browser</strong></p>
                <p style="margin: 0; font-size: 14px; color: #1a3a2a;">Status: <strong>✅ Successful</strong></p>
              </div>

              <div style="margin-bottom: 32px;">
                <a href="https://medikiosk.com/dashboard" style="display: block; background-color: #1a3a2a; color: #ffffff; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 12px;">✅ Yes, this was me - I'm safe</a>
                <a href="https://medikiosk.com/security" style="display: block; border: 1px solid #ff4444; color: #ff4444; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 600;">🚨 No, this wasn't me - Secure my account</a>
              </div>

              <p style="color: #999999; font-size: 12px;">Never share your OTP with anyone. MEDIKIOSK will never ask for your OTP.</p>
            </td>
          </tr>
          <tr>
            <td style="background: #1a3a2a; padding: 24px 40px; text-align: center;">
              <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">© 2026 MEDIKIOSK. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generatePrescriptionApprovedHTML(userName, medicines) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Prescription Approved</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f0e8; font-family: sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: #1a3a2a; padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0; letter-spacing: 4px;">MEDIKIOSK</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
              <h2 style="color: #1a3a2a; font-size: 22px; font-weight: 600; margin: 0 0 8px;">Prescription Approved!</h2>
              <p style="color: #666666; font-size: 15px; margin-bottom: 32px;">Your prescription has been verified and approved. Please proceed to the kiosk to collect your medicine.</p>
              
              <table width="100%" style="border-collapse: collapse; margin-bottom: 32px; text-align: left;">
                <thead>
                  <tr style="border-bottom: 1px solid #eeeeee;">
                    <th style="padding: 12px; font-size: 14px; color: #1a3a2a;">Medicine</th>
                    <th style="padding: 12px; font-size: 14px; color: #1a3a2a;">Dosage</th>
                    <th style="padding: 12px; font-size: 14px; color: #1a3a2a;">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  ${medicines.map(m => `
                    <tr style="border-bottom: 1px solid #f9f9f9;">
                      <td style="padding: 12px; font-size: 14px; color: #666666;">${m.name}</td>
                      <td style="padding: 12px; font-size: 14px; color: #666666;">${m.dosage}</td>
                      <td style="padding: 12px; font-size: 14px; color: #666666;">${m.duration}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <a href="#" style="display: inline-block; background-color: #1a3a2a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 24px;">Proceed to Kiosk →</a>
              <p style="color: #999999; font-size: 13px;">Approval valid for 24 hours. Take medicines as prescribed.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateHealthReportHTML(userName, reportUrl, medicines) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Health Report Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f0e8; font-family: sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: #1a3a2a; padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0; letter-spacing: 4px;">MEDIKIOSK</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
              <h2 style="color: #1a3a2a; font-size: 22px; font-weight: 600; margin: 0 0 8px;">Your Health Report is Ready</h2>
              <p style="color: #666666; font-size: 15px; margin-bottom: 32px;">Your personalized health report from today's prescription has been generated.</p>
              
              <div style="text-align: left; background: #f5f0e8; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
                <p style="color: #1a3a2a; font-weight: 700; margin-top: 0;">🤖 AI Health Insights for You:</p>
                <ul style="color: #666666; font-size: 14px; padding-left: 20px;">
                  <li>Follow the dosage strictly for maximum recovery.</li>
                  <li>Stay hydrated while taking these medicines.</li>
                  <li>Avoid heavy meals before medication if specified.</li>
                </ul>
              </div>

              <a href="${reportUrl}" style="display: inline-block; background-color: #d4a853; color: #1a3a2a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-bottom: 24px;">📄 Download Health Report (PDF)</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generatePaymentSuccessHTML(patientName, paymentData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful - MEDIKIOSK</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f0e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 600px; width: 100%;">
          <tr>
            <td style="background-color: #1a3a2a; padding: 32px 40px; text-align: center;">
              <div style="width: 56px; height: 56px; background: #d4a853; border-radius: 14px; margin: 0 auto 16px; font-size: 28px; line-height: 56px; text-align: center;">💊</div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 4px;">MEDIKIOSK</h1>
              <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 8px 0 0; letter-spacing: 2px;">AI-POWERED MEDICINE DISPENSING</p>
            </td>
          </tr>
          <tr>
            <td style="background: linear-gradient(135deg, #2e7d32, #388e3c); padding: 24px 40px; text-align: center;">
              <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; font-size: 32px; line-height: 64px; text-align: center;">✅</div>
              <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px;">Payment Successful!</h2>
              <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0;">Your payment has been confirmed and processed securely.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 24px;">
              <p style="color: #1a3a2a; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Dear ${patientName},</p>
              <p style="color: #555555; font-size: 14px; line-height: 1.7; margin: 0;">
                Thank you for using MEDIKIOSK! 🙏<br><br>
                Your payment of <strong style="color: #1a3a2a;">₹${paymentData.totalAmount.toFixed(2)}</strong> has been successfully received. 
                Your medicines are now ready for collection from the kiosk.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 24px;">
              <div style="background: #f5f0e8; border-radius: 12px; padding: 24px; border: 1px solid #e8e0d5;">
                <h3 style="color: #1a3a2a; font-size: 14px; font-weight: 700; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Payment Summary</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color: #888888; font-size: 13px; padding-bottom: 10px;">Receipt Number</td>
                    <td style="color: #1a1a1a; font-size: 13px; font-weight: 600; text-align: right; padding-bottom: 10px;">#${paymentData.receiptId}</td>
                  </tr>
                  <tr>
                    <td style="color: #888888; font-size: 13px; padding-bottom: 10px;">Transaction ID</td>
                    <td style="color: #1a1a1a; font-size: 13px; font-weight: 600; text-align: right; padding-bottom: 10px;">${paymentData.transactionId}</td>
                  </tr>
                  <tr>
                    <td style="color: #888888; font-size: 13px; padding-bottom: 10px;">Payment Method</td>
                    <td style="color: #1a1a1a; font-size: 13px; font-weight: 600; text-align: right; padding-bottom: 10px;">💳 ${paymentData.paymentMethod}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="border-top: 1px solid #ddd; padding-top: 10px; padding-bottom: 10px;"></td>
                  </tr>
                  <tr>
                    <td style="color: #1a3a2a; font-size: 15px; font-weight: 700;">Total Paid</td>
                    <td style="color: #1a3a2a; font-size: 18px; font-weight: 800; text-align: right;">₹${paymentData.totalAmount.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 24px;">
              <h3 style="color: #1a3a2a; font-size: 14px; font-weight: 700; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Medicines for Collection</h3>
              ${paymentData.medicines.map((med, index) => `
              <div style="display: flex; align-items: center; padding: 12px 16px; background: ${index % 2 === 0 ? '#f9f9f9' : '#ffffff'}; border-radius: 8px; margin-bottom: 8px; border: 1px solid #f0f0f0;">
                <div style="flex: 1;">
                  <p style="color: #1a1a1a; font-size: 13px; font-weight: 600; margin: 0;">${med.name}</p>
                  <p style="color: #888888; font-size: 12px; margin: 0;">${med.dosage} • ${med.quantity} Units</p>
                </div>
                <div style="color: #1a3a2a; font-size: 13px; font-weight: 600;">₹${med.price.toFixed(2)}</div>
              </div>
              `).join('')}
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background: #fff8ee; border: 1px solid #d4a853; border-radius: 8px; padding: 16px; text-align: center;">
                <p style="color: #9a6b1a; font-size: 13px; margin: 0;">📎 Your detailed payment receipt PDF is attached to this email.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: #1a3a2a; padding: 24px 40px; text-align: center;">
              <p style="color: #d4a853; font-size: 13px; font-weight: 700; margin: 0 0 6px; letter-spacing: 2px;">MEDIKIOSK</p>
              <p style="color: rgba(255,255,255,0.3); font-size: 10px; margin: 0;">© 2026 MEDIKIOSK. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateDispensedThankYouHTML(patientName, dispenseData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medicines Dispensed - MEDIKIOSK</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f0e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 600px; width: 100%;">
          <tr>
            <td style="background-color: #1a3a2a; padding: 32px 40px; text-align: center;">
              <div style="width: 56px; height: 56px; background: #d4a853; border-radius: 14px; margin: 0 auto 16px; font-size: 28px; line-height: 56px; text-align: center;">💊</div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 4px;">MEDIKIOSK</h1>
            </td>
          </tr>
          <tr>
            <td style="background: #d4a853; padding: 32px 40px; text-align: center;">
              <div style="width: 72px; height: 72px; background: rgba(255,255,255,0.25); border-radius: 50%; margin: 0 auto 16px; font-size: 36px; line-height: 72px; text-align: center;">🎉</div>
              <h2 style="color: #1a3a2a; font-size: 24px; font-weight: 800; margin: 0 0 8px;">Medicines Dispensed!</h2>
              <p style="color: rgba(26,58,42,0.75); font-size: 14px; margin: 0;">Your medicines have been successfully released from the kiosk.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 24px;">
              <p style="color: #1a3a2a; font-size: 18px; font-weight: 700; margin: 0 0 16px;">Dear ${patientName}, <span style="font-weight: 400;">we're glad you chose MEDIKIOSK! 💚</span></p>
              <p style="color: #555555; font-size: 14px; line-height: 1.8; margin: 0;">
                Your medicines have been successfully dispensed. We have attached your personalized <strong>AI Health Report</strong> to this email. Please read it carefully for dosage instructions and care recommendations.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 24px;">
              <div style="background: #1a3a2a; border-radius: 12px; padding: 24px;">
                <h3 style="color: #d4a853; font-size: 14px; font-weight: 700; margin: 0 0 16px;">🤖 AI Health Insights</h3>
                ${dispenseData.healthInsights?.map(insight => `
                  <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0 0 8px;">• ${insight}</p>
                `).join('')}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background: #fff8ee; border: 2px dashed #d4a853; border-radius: 12px; padding: 20px; text-align: center;">
                <p style="color: #1a3a2a; font-size: 14px; font-weight: 700; margin: 0 0 6px;">📎 Your Health Report is Attached!</p>
                <p style="color: #888888; font-size: 12px; margin: 0;">A detailed AI-generated health report is attached as a PDF.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: #1a3a2a; padding: 28px 40px; text-align: center;">
              <p style="color: #d4a853; font-size: 14px; font-weight: 700; margin: 0 0 6px; letter-spacing: 3px;">MEDIKIOSK</p>
              <p style="color: rgba(255,255,255,0.3); font-size: 10px; margin: 0;">© 2026 MEDIKIOSK. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

module.exports = EmailService;

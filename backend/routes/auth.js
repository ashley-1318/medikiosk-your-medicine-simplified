const express = require('express');
const router = express.Router();
const admin = require('../lib/firebase-admin');
const supabase = require('../lib/supabase');
const { sendFcmNotification, saveNotification } = require('../lib/fcm');
const { makeJwt, parseJwt } = require('../lib/jwt');
const { sendOtp, verifyOtp } = require('../lib/twilio');
const EmailService = require('../lib/email.service');
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');

// POST /auth/send-otp — Trigger Twilio SMS
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    // Bypass for dev
    if (phone === "9999999999") {
      return res.json({ success: true, status: 'approved', message: 'Bypass active' });
    }

    const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const result = await sendOtp(fullPhone);
    res.json({ success: true, status: result.status });
  } catch (err) {
    console.error('[/auth/send-otp]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/verify — Handles BOTH Firebase (legacy) and Twilio
router.post('/verify', async (req, res) => {
  try {
    const { token, phone, code, role = 'patient' } = req.body;
    
    let phoneNumber;

    if (token) {
        // Legacy Firebase Verification
        if (token === "mock-dev-token") {
            phoneNumber = "+919999999999";
        } else {
            const decoded = await admin.auth().verifyIdToken(token);
            phoneNumber = decoded.phone_number;
        }
    } else if (phone && code) {
        // New Twilio Verification
        const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        
        // Bypass for dev
        if (phone === "9999999999" && code === "123456") {
            phoneNumber = "+919999999999";
        } else {
            const result = await verifyOtp(fullPhone, code);
            if (result.status !== 'approved') {
                return res.status(401).json({ error: 'Invalid or expired OTP' });
            }
            phoneNumber = fullPhone;
        }
    } else {
        return res.status(400).json({ error: 'Token or Phone/Code required' });
    }
    
    if (!phoneNumber) return res.status(400).json({ error: 'Phone not identified' });


    const { data: existing } = await supabase
      .from('users').select('*').eq('phone_number', phoneNumber).limit(1);

    let user;
    let is_new_user = false;

    if (!existing || existing.length === 0) {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{ phone_number: phoneNumber, role: role.toLowerCase(), last_login: new Date().toISOString() }])
        .select().single();
      if (error) throw error;
      user = newUser;
      is_new_user = true;
    } else {
      user = existing[0];
      const updateData = { last_login: new Date().toISOString() };
      if (role) updateData.role = role.toLowerCase();
      
      const { data: updatedUser } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();
      
      if (updatedUser) user = updatedUser;
    }

    const jwt = makeJwt({ id: user.id, role: user.role, phone: phoneNumber });
    res.json({ jwt, user, is_new_user });
  } catch (err) {
    console.error('[/auth/verify]', err);
    res.status(401).json({ error: err.message });
  }
});

// --- EMAIL OTP ROUTES ---

// POST /auth/email/send-otp
router.post('/email/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }

    // Rate Limit Check (5 OTPs per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('otp_logs')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .gt('created_at', oneHourAgo);

    if (countError) throw countError;
    if (count >= 5) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Please wait 1 hour.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Save to otp_logs
    const { error: insertError } = await supabase
      .from('otp_logs')
      .insert([{
        email,
        otp_hash: hashedOtp,
        otp_type: 'email',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        is_used: false,
        created_at: new Date().toISOString()
      }]);

    if (insertError) throw insertError;

    // Send Email
    await EmailService.sendOTPEmail(email, otp);

    res.json({ success: true, message: 'OTP sent to your email', expires_in: 300 });
  } catch (err) {
    console.error('[/auth/email/send-otp]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /auth/email/verify-otp
router.post('/email/verify-otp', async (req, res) => {
  try {
    const { email, otp, role = 'patient' } = req.body;
    if (!email || !validator.isEmail(email)) return res.status(400).json({ error: 'Valid email required' });
    if (!otp || otp.length !== 6) return res.status(400).json({ error: '6-digit OTP required' });

    // Find latest unused, non-locked, non-expired OTP
    const { data: log, error: fetchError } = await supabase
      .from('otp_logs')
      .select('*')
      .eq('email', email)
      .eq('otp_type', 'email')
      .eq('is_used', false)
      .eq('is_locked', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!log) return res.status(401).json({ success: false, message: 'OTP expired or not found. Please request a new one.' });

    // Compare Hash
    const isValid = await bcrypt.compare(otp, log.otp_hash);
    if (!isValid) {
      const newCount = (log.attempt_count || 0) + 1;
      const isLocked = newCount >= 5;
      
      await supabase
        .from('otp_logs')
        .update({ attempt_count: newCount, is_locked: isLocked })
        .eq('id', log.id);

      return res.status(401).json({ 
        success: false, 
        message: isLocked ? 'Account locked for this OTP. Request a new one.' : `Invalid OTP. ${5 - newCount} attempts remaining.`,
        attempts_remaining: 5 - newCount
      });
    }

    // Mark as used
    await supabase.from('otp_logs').update({ is_used: true }).eq('id', log.id);

    // Upsert User
    const { data: existing } = await supabase
      .from('users').select('*').eq('email', email).limit(1).maybeSingle();

    let user;
    let is_new_user = false;

    if (!existing) {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{ 
          email, 
          role: role.toLowerCase(), 
          auth_method: 'email',
          email_verified: true,
          last_login_at: new Date().toISOString(),
          last_login_method: 'email_otp'
        }])
        .select().single();
      if (error) throw error;
      user = newUser;
      is_new_user = true;
      
      // Trigger Welcome Email
      await EmailService.sendWelcomeEmail(email, user.name || 'New User', user.role);
      await supabase.from('users').update({ greeting_sent: true }).eq('id', user.id);
    } else {
      user = existing;
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ 
            last_login_at: new Date().toISOString(),
            last_login_method: 'email_otp'
        })
        .eq('id', user.id)
        .select()
        .single();
      if (updatedUser) user = updatedUser;

      // Trigger Login Notification
      await EmailService.sendLoginNotificationEmail(email, user.name || 'User', new Date().toLocaleString());
    }

    const token = makeJwt({ id: user.id, role: user.role, email: user.email });
    res.json({ 
      success: true, 
      jwt: token, 
      user: { ...user, is_new_user } 
    });
  } catch (err) {
    console.error('[/auth/email/verify-otp]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /auth/update-profile — save name + role for new users
router.patch('/update-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = parseJwt(token);
    if (!session?.id) return res.status(401).json({ error: 'Unauthorized' });

    const { name, role } = req.body;
    const { data, error } = await supabase
      .from('users').update({ name, role: role?.toLowerCase() }).eq('id', session.id).select().single();
    if (error) throw error;

    // Send welcome FCM
    if (data.fcm_token) {
      const result = await sendFcmNotification(data.fcm_token, 'Welcome to MEDIKIOSK 👋', `Hi ${name}! Your account is ready.`);
      await saveNotification(data.id, 'welcome', `Welcome, ${name}!`, result);
    }
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /auth/fcm-token — save device FCM token
router.patch('/fcm-token', async (req, res) => {
  try {
    const { user_id, fcm_token } = req.body;
    const { error } = await supabase.from('users').update({ fcm_token }).eq('id', user_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/handle-profile
router.post('/handle-profile', async (req, res) => {
    try {
        const { id, name, phone_number } = req.body;
        if (!id) return res.status(400).json({ error: 'User ID required' });

        // 1. Check if user already exists
        const { data: existing, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
            // Already has a profile, don't overwrite anything!
            return res.json(existing);
        }

        // 2. Only if user is brand new, create the basic record
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{ 
                id, 
                name: name || 'New Patient', 
                phone_number: phone_number || '',
                role: 'patient'
            }])
            .select()
            .single();

        if (createError) throw createError;
        res.json(newUser);
    } catch (err) {
        console.error('[Auth Sync] error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /auth/profile/:id
router.get('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'User not found' });
        
        res.json(data);
    } catch (err) {
        console.error('[Profile Get] error:', err);
        res.status(500).json({ error: err.message });
    }
});
router.post('/save-profile', async (req, res) => {
    try {
        const { 
            id, 
            name, 
            email, 
            phone_number, 
            address, 
            age, 
            blood_group, 
            weight, 
            height, 
            gender, 
            allergies, 
            conditions 
        } = req.body;
        
        if (!id) return res.status(400).json({ error: 'User ID required' });

        // Helper to convert string to array for Postgres text[] columns
        const toArray = (val) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            return val.split(',').map(s => s.trim()).filter(Boolean);
        };

        const { data, error } = await supabase
            .from('users')
            .update({ 
                name, 
                email,
                phone_number,
                address,
                age: age ? parseInt(age.toString()) : null, 
                blood_group, 
                weight, 
                height, 
                gender, 
                allergies: toArray(allergies), 
                conditions: toArray(conditions) 
            })
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw error;
        res.json(data || {});
    } catch (err) {
        console.error('[Profile Save] error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const EmailService = require('../lib/email.service');
const { generateHealthReportPDF } = require('../services/pdf.service');
const { sendFcmNotification, saveNotification } = require('../lib/fcm');

// POST /receipt/generate
// This is triggered when medicine is dispensed
router.post('/generate', async (req, res) => {
  try {
    const { dispense_log_id } = req.body;
    if (!dispense_log_id) return res.status(400).json({ error: 'dispense_log_id required' });

    // 1. Fetch dispense log with patient and prescription info
    const { data: log, error: logErr } = await supabase
      .from('dispense_logs')
      .select('*, users(id, name, email, phone_number, fcm_token, allergies, conditions), prescriptions(id, doctor_id)')
      .eq('id', dispense_log_id)
      .single();

    if (logErr || !log) return res.status(404).json({ error: 'Dispense log not found' });

    // 2. Prepare Dispense Data for PDF and Email
    const dispenseData = {
      dispenseId: `DSP-${log.id.substring(0, 8).toUpperCase()}`,
      dispensedAt: log.dispensed_at || new Date().toISOString(),
      patientName: log.users?.name || 'Patient',
      prescriptionId: log.prescription_id,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'), // Default 7 days
      healthInsights: [
        'Maintain hydration while taking your medication.',
        'Complete the full course even if you feel better.',
        'Consult your doctor if you experience severe side effects.'
      ],
      careRecommendations: [
        'Take adequate rest.',
        'Monitor your blood pressure daily.',
        'Avoid strenuous activity for 48 hours.'
      ],
      medicines: (log.medicines_dispensed || []).map(m => ({
        name: m.medicine_name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        quantity: m.quantity || 1,
        instructions: 'Take after food with water.',
        sideEffects: 'May cause mild drowsiness.',
        warnings: 'Avoid alcohol during treatment.'
      }))
    };

    // 3. Generate health report PDF
    const healthReportPDF = await generateHealthReportPDF(dispenseData, log.users);

    // 4. Upload PDF to Supabase Storage
    const fileName = `health-reports/${log.users.id}/${dispenseData.dispenseId}.pdf`;
    await supabase.storage
      .from('medikiosk-storage')
      .upload(fileName, healthReportPDF, {
        contentType: 'application/pdf',
        upsert: true
      });

    const { data: { publicUrl } } = supabase.storage
      .from('medikiosk-storage')
      .getPublicUrl(fileName);

    // 5. Update dispense_logs and create health_report entry
    await supabase.from('dispense_logs').update({ 
      receipt_url: publicUrl,
      dispense_email_sent: true,
      dispense_email_sent_at: new Date().toISOString()
    }).eq('id', dispense_log_id);

    await supabase.from('health_reports').insert({
      patient_id: log.users.id,
      prescription_id: log.prescription_id,
      dispense_id: log.id,
      report_url: publicUrl,
      created_at: new Date().toISOString()
    });

    // 6. Send dispensed thank you email WITH health report PDF (Non-blocking)
    if (log.users?.email) {
      EmailService.sendDispensedThankYouEmail(
        log.users.email,
        log.users.name || 'Patient',
        dispenseData,
        healthReportPDF
      ).catch(e => console.error('Dispense email failed:', e));
    }

    // 7. Send FCM push notification (Non-blocking)
    if (log.users?.fcm_token) {
      sendFcmNotification(
        log.users.fcm_token,
        '💊 Medicines Dispensed!',
        'Your medicines have been released. Health report sent to your email.'
      ).catch(e => console.error('FCM failed:', e));
      
      saveNotification(log.users.id, 'dispensed', `Health report: ${publicUrl}`).catch(e => {});
    }

    res.json({ success: true, receipt_url: publicUrl });
  } catch (err) {
    console.error('[/receipt/generate]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

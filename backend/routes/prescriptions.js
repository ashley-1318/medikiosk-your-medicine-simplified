const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const EmailService = require('../lib/email.service');

// GET /prescriptions/patient/:id
router.get('/patient/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /prescriptions/doctor/:id
router.get('/doctor/:doctor_id', async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*, users!patient_id(name, phone_number)')
      .eq('doctor_id', doctor_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /prescriptions/queue (All pending unassigned prescriptions for any doctor to pick)
router.get('/queue', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*, users!patient_id(name, phone_number)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /prescriptions/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, doctor_id, notes } = req.body;
    
    const { data, error } = await supabase
      .from('prescriptions')
      .update({ 
        status, 
        doctor_id, 
        doctor_notes: notes,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    
    // Trigger Email if approved
    if (status === 'approved' && data && data.length > 0) {
      const presc = data[0];
      const { data: user } = await supabase.from('users').select('name, email').eq('id', presc.patient_id).single();
      
      if (user?.email) {
        // Map extracted_data or raw text to medicine list for template
        const medicines = presc.extracted_data?.medicines || [];
        await EmailService.sendPrescriptionApprovedEmail(user.email, user.name || 'Patient', medicines);
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /prescriptions (Create new prescription or consultation)
router.post('/', async (req, res) => {
  try {
    const { patient_id, doctor_id, status, type, report_id, doctor_notes, image_url, raw_ocr_text, extracted_data } = req.body;
    
    const { data, error } = await supabase
      .from('prescriptions')
      .insert([{
        patient_id,
        doctor_id,
        status: status || 'pending',
        type: type || 'prescription',
        report_id,
        doctor_notes,
        image_url,
        raw_ocr_text,
        extracted_data,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /prescriptions/dispense-logs/:patient_id
router.get('/dispense-logs/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { data, error } = await supabase
      .from('dispense_logs')
      .select('*')
      .eq('patient_id', patient_id)
      .order('dispensed_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;



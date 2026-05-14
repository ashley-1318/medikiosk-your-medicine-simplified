const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const Groq = require('groq-sdk');
const supabase = require('../lib/supabase');
const fs = require('fs');
const { sendFcmNotification, saveNotification } = require('../lib/fcm');

const upload = multer({ dest: 'uploads/' });
const groqPrescription = new Groq({ apiKey: process.env.GROQ_API_KEY_PRESCRIPTION });

router.post('/process-prescription', upload.single('prescription'), async (req, res) => {
  try {
    const { file } = req;
    const { patient_id, doctor_id } = req.body;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // 1. Upload image to Supabase Storage
    const fileBuffer = fs.readFileSync(file.path);
    const fileName = `prescriptions/${Date.now()}-${file.originalname}`;
    await supabase.storage.from('medikiosk-storage').upload(fileName, fileBuffer, { contentType: file.mimetype });
    const { data: { publicUrl } } = supabase.storage.from('medikiosk-storage').getPublicUrl(fileName);

    // 2. OCR
    const { data: { text: raw_ocr_text } } = await Tesseract.recognize(file.path, 'eng');

    // 3. Extract medicines via Groq
    const extraction = await groqPrescription.chat.completions.create({
      messages: [{
        role: 'user',
        content: `You are a medical prescription parser. 
 Extract from this OCR text: Medicine names, Dosage, Frequency, Duration.
 Return ONLY valid JSON array: [{"medicine_name":"","dosage":"","frequency":"","duration":"","quantity":0}]. No explanation.
 OCR Text: ${raw_ocr_text}`,
      }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    });
    const raw_data = extraction.choices[0]?.message?.content?.replace(/```json|```/g, '').trim();
    const extracted_data = JSON.parse(raw_data);

    // 4. AI Doctor Summary via Groq
    const summary = await groqPrescription.chat.completions.create({
      messages: [{
        role: 'user',
        content: `You are a medical AI helping a doctor.
Given these medicines: ${JSON.stringify(extracted_data)}
Analyze drug interactions, dosage safety, risk level (low/medium/high), and one line suggestion.
Return ONLY JSON: {"drug_interactions":"","dosage_safety":"","risk_level":"low","suggestion":""}`,
      }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    });

    const raw_summary = summary.choices[0]?.message?.content?.replace(/```json|```/g, '').trim();
    const ai_summary = JSON.parse(raw_summary);

    // 5. Save to Supabase
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .insert([{
        patient_id,
        doctor_id: doctor_id || null,
        image_url: publicUrl,
        raw_ocr_text,
        extracted_data,
        status: 'pending',
        ai_suggestion: ai_summary.suggestion,
        ai_risk_level: ai_summary.risk_level,
      }])
      .select().single();
    if (error) throw error;

    // 5b. Insert into prescription_medicines (Needed for payment calculation)
    if (extracted_data && Array.isArray(extracted_data)) {
      const { data: allMeds } = await supabase.from('medicines').select('id, name');
      
      const medicineInserts = extracted_data.map(m => {
        // Try to find a match in the medicines table (case insensitive)
        const match = allMeds?.find(am => am.name.toLowerCase() === (m.medicine_name || m.name).toLowerCase());
        
        return {
          prescription_id: prescription.id,
          medicine_name: m.medicine_name || m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          quantity: m.quantity || 1 // Default to 1 if not specified
        };
      });

      const { error: medInsertError } = await supabase
        .from('prescription_medicines')
        .insert(medicineInserts);
      
      if (medInsertError) console.error('[AI] Medicine insert error:', medInsertError);
    }

    // 6. Notify doctor
    if (doctor_id) {
      const { data: doctor } = await supabase.from('users').select('fcm_token').eq('id', doctor_id).single();
      const { data: patient } = await supabase.from('users').select('name').eq('id', patient_id).single();
      if (doctor?.fcm_token) {
        await sendFcmNotification(doctor.fcm_token, '📋 New Prescription', `New prescription from ${patient?.name ?? 'Unknown'}`);
      }
    }

    fs.unlinkSync(file.path);
    res.json({ success: true, prescription, extracted_data, ai_summary });
  } catch (err) {
    console.error('[AI] error:', err);
    res.status(500).json({ error: err.message });
  }
});

// FEATURE 1 — AI PRE-ANALYSIS
router.post('/analyze', async (req, res) => {
  try {
    const { prescription_id } = req.body;
    if (!prescription_id) return res.status(400).json({ error: 'prescription_id required' });

    // 1. Fetch prescription + patient profile
    const { data: rx, error: rxErr } = await supabase
      .from('prescriptions')
      .select('*, users!patient_id(allergies, conditions)')
      .eq('id', prescription_id)
      .single();

    if (rxErr || !rx) throw new Error('Prescription not found');

    const medicines = JSON.stringify(rx.extracted_data?.medicines || []);
    const allergies = JSON.stringify(rx.users?.allergies || []);
    const conditions = JSON.stringify(rx.users?.conditions || []);

    // 2. Call Groq for advanced analysis
    const analysis = await groqPrescription.chat.completions.create({
      messages: [{
        role: 'user',
        content: `You are a medical AI assistant.
Analyze these medicines: ${medicines}
Patient allergies: ${allergies}
Patient conditions: ${conditions}
Check:
- Drug interactions between medicines
- Dosage safety for each medicine
- Allergy conflicts
- Overall risk level (low/medium/high)
- One line suggestion for doctor

Return ONLY valid JSON:
{
  "risk_level": "low|medium|high",
  "drug_interaction": "text",
  "dosage_safety": "text",
  "allergy_check": "text",
  "suggestion": "text",
  "allergy_warning": "text|null"
}`,
      }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    });

    const raw_analysis = analysis.choices[0]?.message?.content?.replace(/```json|```/g, '').trim();
    const ai_analysis = JSON.parse(raw_analysis);

    // 3. Save to database
    await supabase.from('prescriptions').update({ ai_analysis }).eq('id', prescription_id);

    res.json(ai_analysis);
  } catch (err) {
    console.error('[AI Analyze] error:', err);
    res.status(500).json({ error: err.message });
  }
});

// FEATURE 7 — DOCTOR ANALYTICS
router.get('/doctor-analytics/:doctor_id', async (req, res) => {
  try {
    const doctor_id = req.params.doctor_id?.trim();
    if (!doctor_id) return res.status(400).json({ error: "Doctor ID is required" });

    // Fetch all prescriptions reviewed by this doctor
    const { data: prescriptions, error } = await supabase
      .from('prescriptions')
      .select('status, rejection_reason, created_at, updated_at')
      .eq('doctor_id', doctor_id);

    console.log(`[Doctor Analytics] ID: ${doctor_id} | Found: ${prescriptions?.length || 0}`);

    if (error) throw error;

    const total = prescriptions.length;
    const approved = prescriptions.filter(p => p.status === 'approved').length;
    const rejected = prescriptions.filter(p => p.status === 'rejected').length;

    // Today's stats (Flexible date check)
    const isToday = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const now = new Date();
        return d.getDate() === now.getDate() && 
               d.getMonth() === now.getMonth() && 
               d.getFullYear() === now.getFullYear();
    };

    const approvedToday = prescriptions.filter(p => p.status === 'approved' && isToday(p.updated_at || p.created_at)).length;
    const rejectedToday = prescriptions.filter(p => p.status === 'rejected' && isToday(p.updated_at || p.created_at)).length;
    
    // Average review time in minutes
    const reviewTimes = prescriptions
      .filter(p => p.status !== 'pending' && p.updated_at && p.created_at)
      .map(p => (new Date(p.updated_at).getTime() - new Date(p.created_at).getTime()) / 60000);
    
    const avgTime = reviewTimes.length > 0 ? (reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length).toFixed(1) : 0;

    // Weekly Breakdown
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const weeklyData = last7Days.map(day => {
      const dayData = prescriptions.filter(p => {
        const pDate = new Date(p.updated_at || p.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        return pDate === day;
      });
      return {
        name: day,
        App: dayData.filter(p => p.status === 'approved').length,
        Rej: dayData.filter(p => p.status === 'rejected').length
      };
    });

    // Rejection Reasons Breakdown
    const rejectionReasons = prescriptions
      .filter(p => p.status === 'rejected' && p.rejection_reason)
      .reduce((acc, curr) => {
        acc[curr.rejection_reason] = (acc[curr.rejection_reason] || 0) + 1;
        return acc;
      }, {});

    res.json({
      summary: {
        total,
        approved: approvedToday, // Show today's approved for the dashboard card
        rejected: rejectedToday, // Show today's rejected for the dashboard card
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
        avgTime
      },
      rejectionReasons,
      weeklyData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


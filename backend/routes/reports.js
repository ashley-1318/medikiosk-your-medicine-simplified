const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const Groq = require('groq-sdk');
const supabase = require('../lib/supabase');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY_PRESCRIPTION }); // Using existing key

router.post('/analyze', upload.single('report'), async (req, res) => {
  try {
    const { file } = req;
    const { patient_id, report_type } = req.body;
    if (!file) return res.status(400).json({ error: 'No report uploaded' });

    // 1. Upload to Supabase Storage (bucket: medikiosk-storage)
    console.log(`[Reports AI] Reading file: ${file.path}`);
    const fileBuffer = fs.readFileSync(file.path);
    const fileName = `reports/${patient_id}/${Date.now()}-${file.originalname}`;
    
    console.log(`[Reports AI] Uploading to Supabase: ${fileName}`);
    const { error: uploadError } = await supabase.storage
      .from('medikiosk-storage')
      .upload(fileName, fileBuffer, { contentType: file.mimetype });

    if (uploadError) {
        console.error('[Reports AI] Upload error:', uploadError);
        throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage.from('medikiosk-storage').getPublicUrl(fileName);
    console.log(`[Reports AI] Public URL: ${publicUrl}`);

    // 2. OCR
    console.log(`[Reports AI] Starting OCR...`);
    const { data: { text: raw_ocr_text } } = await Tesseract.recognize(file.path, 'eng');
    console.log(`[Reports AI] OCR complete, text length: ${raw_ocr_text.length}`);

    // 3. AI Analysis via Groq
    console.log(`[Reports AI] Analyzing report type: ${report_type}`);
    const analysis = await groq.chat.completions.create({
      messages: [{
        role: 'user',
        content: `You are a medical report analyzer for MEDIKIOSK.
        Type: ${report_type}
        OCR Text: ${raw_ocr_text}

        Extract all test values, compare to normal ranges for a human, flag abnormal values, explain what they mean in simple plain language.
        Return ONLY valid JSON including:
        {"extracted_values": [{"test_name": "", "value": "", "unit": "", "status": "Normal|High|Low"}], "ai_summary": "", "ai_recommendation": "", "has_critical_values": false}`,
      }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
    });

    let raw_data = analysis.choices[0]?.message?.content || '';
    console.log(`[Reports AI] Raw response length: ${raw_data.length}`);

    // Robust JSON extraction
    const jsonMatch = raw_data.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Reports AI] No JSON found in response:', raw_data);
      throw new Error('AI failed to return structured data');
    }
    
    const data = JSON.parse(jsonMatch[0]);
    console.log(`[Reports AI] Successfully parsed JSON`);

    // 4. Save to health_reports table
    const { data: report, error } = await supabase
      .from('health_reports')
      .insert([{
        patient_id,
        report_type,
        image_url: publicUrl,
        raw_ocr_text,
        extracted_values: data.extracted_values,
        ai_summary: data.ai_summary,
        ai_recommendation: data.ai_recommendation,
        has_critical_values: data.has_critical_values
      }])
      .select().single();

    if (error) throw error;

    fs.unlinkSync(file.path);
    res.json({ success: true, report });

  } catch (err) {
    console.error('[Reports AI] error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/patient/:patient_id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('health_reports')
            .select('*')
            .eq('patient_id', req.params.patient_id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

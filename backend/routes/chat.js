const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const supabase = require('../lib/supabase');

const groqChatbot = new Groq({ apiKey: process.env.GROQ_API_KEY_CHATBOT });

const SERIOUS_KEYWORDS = [
  'chest pain', 'breathing', 'headache', 'unconscious', 'fainted', 'seizure', 
  'blood pressure', 'sugar low', 'emergency', 'help', 'suicide', 'bleeding'
];

router.post('/health-message', async (req, res) => {
  try {
    const { patient_id, message, language = 'en' } = req.body;
    if (!message || !patient_id) return res.status(400).json({ error: 'patient_id and message required' });

    // 1. Fetch Holistic Patient Context
    const [userRes, prescRes, reportRes, logRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', patient_id).single(),
      supabase.from('prescriptions').select('extracted_data, status, created_at').eq('patient_id', patient_id).order('created_at', { ascending: false }).limit(3),
      supabase.from('health_reports').select('report_type, extracted_values, ai_summary').eq('patient_id', patient_id).order('created_at', { ascending: false }).limit(1),
      supabase.from('dispense_logs').select('medicines_dispensed, dispensed_at').eq('patient_id', patient_id).order('dispensed_at', { ascending: false }).limit(5)
    ]);

    const context = {
      profile: userRes.data,
      prescriptions: prescRes.data,
      latest_report: reportRes.data,
      dispense_history: logRes.data
    };

    // 2. Keyword Detection
    const lowerMsg = message.toLowerCase();
    const isSerious = SERIOUS_KEYWORDS.some(kw => lowerMsg.includes(kw));

    // 3. AI Generation
    const langNote = language === 'ta' ? "Always respond ONLY in Tamil (தமிழ்) using Tamil script." : "Always respond ONLY in English.";
    
    const systemPrompt = `You are a personal AI health assistant for MEDIKIOSK. 
    ${langNote}
    You have access to this patient's complete health context below. 
    Answer only from this context. Be friendly, simple, and clear.
    If symptoms are serious always recommend consulting a doctor. 
    Never diagnose or prescribe medicines.
    
    PATIENT CONTEXT:
    Profile: ${JSON.stringify(context.profile)}
    Active/Recent Prescriptions: ${JSON.stringify(context.prescriptions)}
    Latest Health Report: ${JSON.stringify(context.latest_report)}
    Dispense History: ${JSON.stringify(context.dispense_history)}
    
    If the answer is not in the context, say: ${language === 'ta' ? "'தயவுசெய்து இந்த விவரத்திற்கு உங்கள் மருத்துவரை அணுகவும்.'" : "'Please consult your doctor for this detail.'"} `;

    const completion = await groqChatbot.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      model: 'llama-3.1-8b-instant', 
      temperature: 0.2,
    });

    const aiResponse = completion.choices[0]?.message?.content ?? 'Sorry, I am having trouble connecting.';

    // 4. Persistence
    await supabase.from('chat_sessions').insert([{
      patient_id,
      messages: [{ role: 'user', content: message }, { role: 'ai', content: aiResponse, is_serious: isSerious }],
    }]);

    res.json({ 
      response: aiResponse, 
      is_serious: isSerious 
    });

  } catch (err) {
    console.error('[Chat AI] error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/history/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('messages, created_at')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Flatten the message pairs into a single list
    const history = data.flatMap(row => row.messages.map(m => ({
        ...m,
        time: row.created_at
    })));

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

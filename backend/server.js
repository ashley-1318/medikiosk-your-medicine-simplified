require('dotenv').config();
process.on('uncaughtException', (err) => { console.error('🔥 UNCAUGHT EXCEPTION:', err); });
process.on('unhandledRejection', (reason, promise) => { console.error('🔥 UNHANDLED REJECTION at:', promise, 'reason:', reason); });
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = require('./lib/supabase');
console.log('📡 Supabase Client check:', typeof supabase.from === 'function' ? '✅ OK' : '❌ FAILED');

// ── Route modules ─────────────────────────────────────────────────────────────
app.use('/auth',          require('./routes/auth'));
app.use('/ai',            require('./routes/ai'));
app.use('/chat',          require('./routes/chat'));
app.use('/notifications', require('./routes/notifications'));
app.use('/receipt',       require('./routes/receipt'));
app.use('/admin',         require('./routes/admin'));
app.use('/prescriptions', require('./routes/prescriptions'));
app.use('/reports',       require('./routes/reports'));
app.use('/payment',       require('./routes/payment'));


// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'MEDIKIOSK Backend' }));

// ── Keep-alive ────────────────────────────────────────────────────────────────
setInterval(() => { /* keep event loop alive */ }, 1000 * 60 * 60);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ MEDIKIOSK Backend running → http://localhost:${PORT}`);
  console.log('   Routes: /auth  /ai  /chat  /notifications  /receipt  /admin  /prescriptions');
});

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const authRoutes = require('./routes/authRoutes');
const academicRoutes = require('./routes/academicRoutes');
const operationRoutes = require('./routes/operationRoutes');
const examRoutes = require('./routes/examRoutes');

const app = express();

// ১. CORS কনফিগারেশন
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ২. হেলথ চেক ও পিং রুট
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Edulygo backend is running smoothly' });
});

// ৩. রুটস মাউন্ট করা
app.use('/api/users', authRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/exams', examRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Edulygo সার্ভার পরিচ্ছন্ন ও প্রস্তুত: http://localhost:${PORT}`);
  
  // ৪. অটো-পিং ব্যবস্থা
  const PING_INTERVAL = 14 * 60 * 1000;
  setInterval(async () => {
    try {
      const fetch = (await import('node-fetch')).default || global.fetch;
      await fetch('https://edulygo-backend.onrender.com/health');
      console.log('Keep-alive ping sent to prevent sleep mode');
    } catch (err) {
      console.log('Keep-alive ping error:', err.message);
    }
  }, PING_INTERVAL);
});

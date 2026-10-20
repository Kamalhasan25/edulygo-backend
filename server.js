require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

// রুটগুলো ইম্পোর্ট
const authRoutes = require('./routes/authRoutes');
const academicRoutes = require('./routes/academicRoutes');
const operationRoutes = require('./routes/operationRoutes');
const examRoutes = require('./routes/examRoutes'); // নতুন পরীক্ষা রুট

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// হোম রুট
app.get('/', async (req, res) => {
    try {
        const dbRes = await pool.query('SELECT NOW()');
        res.json({
            success: true,
            message: 'স্বাগতম! Edulygo ব্যাকএন্ড ও ক্লাউড ডেটাবেস সক্রিয় রয়েছে।',
            db_server_time: dbRes.rows[0].now
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// রুটগুলো অ্যাপে যুক্ত করা
app.use('/api', authRoutes);
app.use('/api', academicRoutes);
app.use('/api', operationRoutes);
app.use('/api', examRoutes);

app.listen(PORT, () => {
    console.log(`Edulygo সার্ভার পরিচ্ছন্ন ও প্রস্তুত: http://localhost:${PORT}`);
});

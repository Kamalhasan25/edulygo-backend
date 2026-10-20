const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const verifyToken = require('../authMiddleware');

// স্কুল রেজিস্ট্রেশন
router.post('/schools/register', async (req, res) => {
    const { name, slug, email, phone, address } = req.body;
    try {
        const newSchool = await pool.query(
            'INSERT INTO schools (name, slug, email, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, slug, email, phone, address]
        );
        res.status(201).json({ success: true, message: 'স্কুল সফলভাবে রেজিস্টার হয়েছে!', data: newSchool.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// সমস্ত স্কুলের তালিকা
router.get('/schools', async (req, res) => {
    try {
        const allSchools = await pool.query('SELECT * FROM schools ORDER BY id DESC');
        res.json({ success: true, count: allSchools.rowCount, data: allSchools.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ইউজার রেজিস্ট্রেশন
router.post('/users/register', async (req, res) => {
    const { school_id, name, email, password, role } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await pool.query(
            'INSERT INTO users (school_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, school_id, name, email, role, created_at',
            [school_id, name, email, hashedPassword, role || 'admin']
        );
        res.status(201).json({ success: true, message: 'ইউজার সফলভাবে রেজিস্টার হয়েছে!', data: newUser.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ইউজার লগইন
router.post('/users/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'ভুল ইমেইল অথবা পাসওয়ার্ড!' });
        }
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'ভুল ইমেইল অথবা পাসওয়ার্ড!' });
        }
        const token = jwt.sign(
            { id: user.id, school_id: user.school_id, role: user.role },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '7d' }
        );
        res.json({
            success: true,
            message: 'লগইন সফল হয়েছে!',
            token,
            user: { id: user.id, school_id: user.school_id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ইউজার প্রোফাইল
router.get('/users/profile', verifyToken, async (req, res) => {
    try {
        const userResult = await pool.query(
            'SELECT id, school_id, name, email, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        res.json({ success: true, message: 'সিকিউরিটি গার্ড আপনাকে ভেতরে প্রবেশের অনুমতি দিয়েছে!', profile: userResult.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

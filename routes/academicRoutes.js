const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../authMiddleware');

// শিক্ষক যোগ করা
router.post('/teachers', verifyToken, async (req, res) => {
    const { name, phone, subject, designation } = req.body;
    try {
        const newTeacher = await pool.query(
            'INSERT INTO teachers (school_id, name, phone, subject, designation) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.school_id, name, phone, subject, designation || 'Assistant Teacher']
        );
        res.status(201).json({ success: true, message: 'শিক্ষক সফলভাবে যুক্ত হয়েছেন!', data: newTeacher.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// শিক্ষকদের তালিকা
router.get('/teachers', verifyToken, async (req, res) => {
    try {
        const teachers = await pool.query(
            'SELECT * FROM teachers WHERE school_id = $1 ORDER BY id DESC',
            [req.user.school_id]
        );
        res.json({ success: true, count: teachers.rowCount, data: teachers.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ছাত্র ভর্তি করা
router.post('/students', verifyToken, async (req, res) => {
    const { name, class_name, roll_no, guardian_phone } = req.body;
    try {
        const newStudent = await pool.query(
            'INSERT INTO students (school_id, name, class_name, roll_no, guardian_phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.school_id, name, class_name, roll_no, guardian_phone]
        );
        res.status(201).json({ success: true, message: 'ছাত্র/ছাত্রী সফলভাবে যুক্ত হয়েছে!', data: newStudent.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ছাত্রছাত্রীদের তালিকা
router.get('/students', verifyToken, async (req, res) => {
    try {
        const students = await pool.query(
            'SELECT * FROM students WHERE school_id = $1 ORDER BY class_name, roll_no ASC',
            [req.user.school_id]
        );
        res.json({ success: true, count: students.rowCount, data: students.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../authMiddleware');

// ১. নতুন পরীক্ষা তৈরি করা (Create Exam)
router.post('/exams', verifyToken, async (req, res) => {
    const { name, term, start_date, end_date } = req.body;
    try {
        const newExam = await pool.query(
            `INSERT INTO exams (school_id, name, term, start_date, end_date)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [req.user.school_id, name, term, start_date || null, end_date || null]
        );
        res.status(201).json({
            success: true,
            message: 'পরীক্ষা সফলভাবে তৈরি হয়েছে!',
            data: newExam.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ২. স্কুলের সমস্ত পরীক্ষার তালিকা দেখা
router.get('/exams', verifyToken, async (req, res) => {
    try {
        const exams = await pool.query(
            'SELECT * FROM exams WHERE school_id = $1 ORDER BY id DESC',
            [req.user.school_id]
        );
        res.json({
            success: true,
            count: exams.rowCount,
            data: exams.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ৩. ছাত্রের বিষয়ের নম্বর ইনপুট করা (Add / Update Marks)
router.post('/marks', verifyToken, async (req, res) => {
    const { exam_id, student_id, subject, max_marks, obtained_marks, remarks } = req.body;
    try {
        const markRecord = await pool.query(
            `INSERT INTO marks (school_id, exam_id, student_id, subject, max_marks, obtained_marks, remarks)
             VALUES ($1, $2, $3, $4, COALESCE($5, 100.00), $6, $7)
             ON CONFLICT (school_id, exam_id, student_id, subject)
             DO UPDATE SET 
                max_marks = EXCLUDED.max_marks,
                obtained_marks = EXCLUDED.obtained_marks,
                remarks = EXCLUDED.remarks
             RETURNING *`,
            [req.user.school_id, exam_id, student_id, subject, max_marks || null, obtained_marks, remarks || '']
        );
        res.status(201).json({
            success: true,
            message: 'নম্বর সফলভাবে নথিভুক্ত হয়েছে!',
            data: markRecord.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ৪. ছাত্রের মার্কশিট বা রেজাল্ট দেখা (Report Card by Student & Exam)
router.get('/marks/student/:student_id', verifyToken, async (req, res) => {
    const { student_id } = req.params;
    const { exam_id } = req.query;
    try {
        const report = await pool.query(
            `SELECT 
                s.name as student_name,
                s.class_name,
                s.roll_no,
                e.name as exam_name,
                m.subject,
                m.max_marks,
                m.obtained_marks,
                m.remarks
             FROM marks m
             JOIN students s ON m.student_id = s.id
             JOIN exams e ON m.exam_id = e.id
             WHERE m.school_id = $1 
               AND m.student_id = $2
               AND ($3::INTEGER IS NULL OR m.exam_id = $3)
             ORDER BY m.subject ASC`,
            [req.user.school_id, student_id, exam_id || null]
        );

        res.json({
            success: true,
            total_subjects: report.rowCount,
            data: report.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

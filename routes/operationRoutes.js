const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../authMiddleware');

// হাজিরা মার্ক করা
router.post('/attendance', verifyToken, async (req, res) => {
    const { student_id, date, status, remarks } = req.body;
    try {
        const record = await pool.query(
            `INSERT INTO attendance (school_id, student_id, date, status, remarks)
             VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5)
             ON CONFLICT (school_id, student_id, date) 
             DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks
             RETURNING *`,
            [req.user.school_id, student_id, date || null, status, remarks || '']
        );
        res.status(201).json({ success: true, message: 'হাজিরা সফলভাবে নথিভুক্ত হয়েছে!', data: record.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// হাজিরার রিপোর্ট
router.get('/attendance/report', verifyToken, async (req, res) => {
    const { date, class_name } = req.query;
    try {
        const queryText = `
            SELECT s.id as student_id, s.name as student_name, s.class_name, s.roll_no,
                   COALESCE(a.status, 'Not Marked') as attendance_status, a.date, a.remarks
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id AND a.date = COALESCE($2::DATE, CURRENT_DATE)
            WHERE s.school_id = $1 AND ($3::VARCHAR IS NULL OR s.class_name = $3)
            ORDER BY s.roll_no ASC`;
        const result = await pool.query(queryText, [req.user.school_id, date || null, class_name || null]);
        res.json({ success: true, total_students: result.rowCount, date: date || new Date().toISOString().split('T')[0], data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ফি তৈরি
router.post('/fees', verifyToken, async (req, res) => {
    const { student_id, fee_type, amount, due_date } = req.body;
    try {
        const newFee = await pool.query(
            `INSERT INTO fees (school_id, student_id, fee_type, amount, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [req.user.school_id, student_id, fee_type, amount, due_date || null]
        );
        res.status(201).json({ success: true, message: 'ফি বিল সফলভাবে তৈরি হয়েছে!', data: newFee.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ফি পেমেন্ট জমা নেওয়া
router.put('/fees/:id/pay', verifyToken, async (req, res) => {
    const feeId = req.params.id;
    const { paid_amount } = req.body;
    try {
        const existing = await pool.query('SELECT * FROM fees WHERE id = $1 AND school_id = $2', [feeId, req.user.school_id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'ফি রেকর্ড পাওয়া যায়নি!' });
        }
        const fee = existing.rows[0];
        const newPaidTotal = parseFloat(fee.paid_amount) + parseFloat(paid_amount);
        const newStatus = (newPaidTotal >= parseFloat(fee.amount)) ? 'Paid' : 'Partial';

        const updated = await pool.query(
            `UPDATE fees SET paid_amount = $1, status = $2, payment_date = CURRENT_TIMESTAMP WHERE id = $3 AND school_id = $4 RETURNING *`,
            [newPaidTotal, newStatus, feeId, req.user.school_id]
        );
        res.json({ success: true, message: 'পেমেন্ট সফলভাবে জমা নেওয়া হয়েছে!', data: updated.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ফি রিপোর্ট
router.get('/fees/report', verifyToken, async (req, res) => {
    try {
        const report = await pool.query(
            `SELECT f.id as fee_id, s.name as student_name, s.class_name, s.roll_no,
                    f.fee_type, f.amount, f.paid_amount, (f.amount - f.paid_amount) as due_amount,
                    f.status, f.due_date, f.payment_date
             FROM fees f
             JOIN students s ON f.student_id = s.id
             WHERE f.school_id = $1
             ORDER BY f.id DESC`,
            [req.user.school_id]
        );
        res.json({ success: true, total_records: report.rowCount, data: report.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

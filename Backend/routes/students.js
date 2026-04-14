import express from 'express';
import pool from '../db.js';
import { authAdmin, authStudent } from '../middleware/auth.js';
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.get('/', authAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    const { page, limit, offset } = getPaginationParams(req);
    let where = '';
    const params = [];
    if (search) {
      where = ' WHERE regd_no LIKE ? OR full_name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    const [countRes] = await pool.query(`SELECT COUNT(*) as c FROM students${where}`, params);
    const total = countRes[0].c;
    const [rows] = await pool.query(
      `SELECT id, regd_no, full_name, father_name, mother_name, student_phone, father_phone, mother_phone, address, aadhaar_no, blood_group, caste, religion, branch, year, payment_status, dob, category, veg_nonveg, photo_base64, created_date, created_at FROM students${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json(paginatedResponse(rows, total, page, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', authStudent, async (req, res) => {
  try {
    const regd = req.user.regd_no;
    const [rows] = await pool.query(
      `SELECT s.*,
        (SELECT room_number FROM room_allotments WHERE regd_no = s.regd_no ORDER BY id DESC LIMIT 1) AS current_room
       FROM students s WHERE s.regd_no = ?`,
      [regd]
    );
    if (!rows.length) return res.status(404).json({ error: 'Student not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:regd_no', authAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE regd_no = ?', [req.params.regd_no]);
    if (!rows.length) return res.status(404).json({ error: 'Student not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authAdmin, async (req, res) => {
  try {
    const { regd_no, full_name, father_name, mother_name, student_phone, father_phone, mother_phone, address, aadhaar_no, blood_group, caste, religion, branch, year, payment_status, dob, category, veg_nonveg, password, photo_base64, student_signature_base64 } = req.body;
    const [r] = await pool.query('INSERT INTO students (regd_no, full_name, father_name, mother_name, student_phone, father_phone, mother_phone, address, aadhaar_no, blood_group, caste, religion, branch, year, payment_status, dob, category, veg_nonveg, photo_base64, student_signature_base64, created_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE())',
      [regd_no, full_name, father_name, mother_name, student_phone, father_phone, mother_phone, address, aadhaar_no, blood_group, caste, religion, branch, year, payment_status || 'UNPAID', dob, category, veg_nonveg, photo_base64 || null, student_signature_base64 || null]);
    const pwd = await bcrypt.hash(password || 'student123', 10);
    await pool.query('INSERT INTO student_auth (regd_no, password) VALUES (?,?)', [regd_no, pwd]);
    res.json({ id: r.insertId, regd_no });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:regd_no', authAdmin, async (req, res) => {
  try {
    const { full_name, father_name, mother_name, student_phone, father_phone, mother_phone, address, aadhaar_no, blood_group, caste, religion, branch, year, payment_status, dob, photo_base64, student_signature_base64, password } = req.body;
    await pool.query(
      'UPDATE students SET full_name=?, father_name=?, mother_name=?, student_phone=?, father_phone=?, mother_phone=?, address=?, aadhaar_no=?, blood_group=?, caste=?, religion=?, branch=?, year=?, payment_status=?, dob=?, photo_base64=COALESCE(?, photo_base64), student_signature_base64=COALESCE(?, student_signature_base64) WHERE regd_no=?',
      [full_name, father_name, mother_name, student_phone, father_phone, mother_phone, address, aadhaar_no, blood_group, caste, religion, branch, year, payment_status, dob ? (String(dob).slice(0, 10)) : null, photo_base64 || null, student_signature_base64 || null, req.params.regd_no]
    );
    if (password && String(password).trim()) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query('UPDATE student_auth SET password = ? WHERE regd_no = ?', [hashed, req.params.regd_no]);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/me/password', authStudent, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    const [rows] = await pool.query('SELECT password FROM student_auth WHERE regd_no = ?', [req.user.regd_no]);
    if (!rows.length) return res.status(404).json({ error: 'Student not found' });
    const match = await bcrypt.compare(current_password, rows[0].password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE student_auth SET password = ? WHERE regd_no = ?', [hashed, req.user.regd_no]);
    res.json({ ok: true, message: 'Password changed successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:regd_no', authAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM student_auth WHERE regd_no = ?', [req.params.regd_no]);
    await pool.query('DELETE FROM students WHERE regd_no = ?', [req.params.regd_no]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();

router.post('/login/admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid email or password' });
    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email, role: 'admin' },
      process.env.JWT_SECRET || 'hostelloom-secret',
      { expiresIn: '7d' }
    );
    res.json({ token, user: { email: rows[0].email, name: rows[0].name, role: 'admin' } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login/student', async (req, res) => {
  try {
    const { regd_no, password } = req.body;
    const [rows] = await pool.query('SELECT sa.*, s.full_name FROM student_auth sa JOIN students s ON s.regd_no = sa.regd_no WHERE sa.regd_no = ?', [regd_no]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid registration number or password' });
    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return res.status(401).json({ error: 'Invalid registration number or password' });
    const token = jwt.sign(
      { regd_no: rows[0].regd_no, role: 'student' },
      process.env.JWT_SECRET || 'hostelloom-secret',
      { expiresIn: '7d' }
    );
    res.json({ token, user: { regd_no: rows[0].regd_no, full_name: rows[0].full_name, role: 'student' } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

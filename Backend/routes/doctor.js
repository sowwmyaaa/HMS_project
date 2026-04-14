import express from 'express';
import pool from '../db.js';
import { authAdmin, authStudent } from '../middleware/auth.js';
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const router = express.Router();

router.get('/schedule', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM doctor_schedule ORDER BY FIELD(day_name, "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday")');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/today', async (req, res) => {
  try {
    const today = DAYS[new Date().getDay()];
    const [rows] = await pool.query('SELECT * FROM doctor_schedule WHERE day_name = ?', [today]);
    res.json(rows[0] || { available: false });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/visits', authAdmin, async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const [countRes] = await pool.query('SELECT COUNT(*) as c FROM doctor_visits');
    const total = countRes[0].c;
    const [rows] = await pool.query('SELECT * FROM doctor_visits ORDER BY visit_date DESC, visit_time DESC LIMIT ? OFFSET ?', [limit, offset]);
    res.json(paginatedResponse(rows, total, page, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/visits/:regd_no', authStudent, async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const [countRes] = await pool.query('SELECT COUNT(*) as c FROM doctor_visits WHERE regd_no = ?', [req.params.regd_no]);
    const total = countRes[0].c;
    const [rows] = await pool.query('SELECT * FROM doctor_visits WHERE regd_no = ? ORDER BY visit_date DESC LIMIT ? OFFSET ?', [req.params.regd_no, limit, offset]);
    res.json(paginatedResponse(rows, total, page, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/visits', authAdmin, async (req, res) => {
  try {
    const { regd_no, student_name, room_no, year_branch, reason, prescription, visit_date, visit_time, phone } = req.body;
    await pool.query(
      'INSERT INTO doctor_visits (regd_no, student_name, room_no, year_branch, reason, prescription, visit_date, visit_time, phone) VALUES (?,?,?,?,?,?,?,?,?)',
      [regd_no, student_name, room_no, year_branch, reason, prescription, visit_date, visit_time, phone]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/visits/:id', authAdmin, async (req, res) => {
  try {
    const { regd_no, student_name, room_no, year_branch, reason, prescription, visit_date, visit_time, phone } = req.body;
    await pool.query(
      'UPDATE doctor_visits SET regd_no=?, student_name=?, room_no=?, year_branch=?, reason=?, prescription=?, visit_date=?, visit_time=?, phone=? WHERE id=?',
      [regd_no, student_name, room_no, year_branch, reason, prescription, visit_date, visit_time, phone, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/visits/:id', authAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM doctor_visits WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/schedule/:id', authAdmin, async (req, res) => {
  try {
    const { available, time_slot } = req.body;
    await pool.query('UPDATE doctor_schedule SET available=?, time_slot=? WHERE id=?', [available, time_slot, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

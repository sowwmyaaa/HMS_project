import express from 'express';
import pool from '../db.js';
import { authAdmin, authStudent } from '../middleware/auth.js';
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js';

const router = express.Router();

router.get('/', authAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const { page, limit, offset } = getPaginationParams(req);
    let where = ' WHERE 1=1';
    const params = [];
    if (status) { where += ' AND status = ?'; params.push(status); }
    const [countRes] = await pool.query(`SELECT COUNT(*) as c FROM complaints${where}`, params);
    const total = countRes[0].c;
    const [rows] = await pool.query(
      `SELECT * FROM complaints${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json(paginatedResponse(rows, total, page, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/student/:regd_no', authStudent, async (req, res) => {
  if (req.params.regd_no !== req.user.regd_no) return res.status(403).json({ error: 'Access denied' });
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const [countRes] = await pool.query('SELECT COUNT(*) as c FROM complaints WHERE regd_no = ?', [req.params.regd_no]);
    const total = countRes[0].c;
    const [rows] = await pool.query('SELECT * FROM complaints WHERE regd_no = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [req.params.regd_no, limit, offset]);
    res.json(paginatedResponse(rows, total, page, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/stats', authAdmin, async (req, res) => {
  try {
    const [total] = await pool.query('SELECT COUNT(*) as c FROM complaints');
    const [pending] = await pool.query('SELECT COUNT(*) as c FROM complaints WHERE status = ?', ['pending']);
    const [solved] = await pool.query('SELECT COUNT(*) as c FROM complaints WHERE status = ?', ['solved']);
    res.json({ total: total[0].c, pending: pending[0].c, solved: solved[0].c });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authStudent, async (req, res) => {
  try {
    const { problem } = req.body;
    if (!problem || !String(problem).trim()) {
      return res.status(400).json({ error: 'Problem description is required' });
    }
    const regd_no = req.user.regd_no;
    const [s] = await pool.query('SELECT full_name FROM students WHERE regd_no = ?', [regd_no]);
    const [ra] = await pool.query('SELECT room_number FROM room_allotments WHERE regd_no = ?', [regd_no]);
    const room_no = ra[0]?.room_number || null;
    await pool.query(
      'INSERT INTO complaints (regd_no, room_no, student_name, problem, complaint_date, status) VALUES (?,?,?,?,CURDATE(),?)',
      [regd_no, room_no, s[0]?.full_name, String(problem).trim(), 'pending']
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin', authAdmin, async (req, res) => {
  try {
    const { regd_no, room_no, student_name, problem } = req.body;
    await pool.query(
      'INSERT INTO complaints (regd_no, room_no, student_name, problem, complaint_date, status) VALUES (?,?,?,?,CURDATE(),?)',
      [regd_no, room_no, student_name, problem, 'pending']
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', authAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE complaints SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', authAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM complaints WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

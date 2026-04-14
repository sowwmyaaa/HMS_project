import express from 'express';
import pool from '../db.js';
import { authAdmin, authStudent } from '../middleware/auth.js';
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js';

const router = express.Router();

router.get('/', authAdmin, async (req, res) => {
  try {
    const { month_year, status } = req.query;
    const { page, limit, offset } = getPaginationParams(req, 10, 5000);
    let whereMb = ' WHERE 1=1';
    const params = [];
    if (month_year) { whereMb += ' AND mb.month_year = ?'; params.push(month_year); }
    if (status && (status === 'paid' || status === 'unpaid')) {
      whereMb += ` AND LOWER(COALESCE(mb.status, 'unpaid')) = ?`;
      params.push(status);
    }
    const [countRes] = await pool.query(
      `SELECT COUNT(*) as c FROM mess_bills mb ${whereMb}`,
      params
    );
    const total = countRes[0].c;
    const [rows] = await pool.query(
      `SELECT mb.*, s.year AS student_year, COALESCE(mb.status, 'unpaid') AS payment_status
       FROM mess_bills mb
       LEFT JOIN students s ON s.regd_no = mb.regd_no
       ${whereMb} ORDER BY mb.student_name LIMIT ? OFFSET ?`,
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
    const [countRes] = await pool.query('SELECT COUNT(*) as c FROM mess_bills WHERE regd_no = ?', [req.params.regd_no]);
    const total = countRes[0].c;
    const [rows] = await pool.query(
      'SELECT *, COALESCE(status, \'unpaid\') AS payment_status FROM mess_bills WHERE regd_no = ? ORDER BY month_year DESC LIMIT ? OFFSET ?',
      [req.params.regd_no, limit, offset]
    );
    res.json(paginatedResponse(rows, total, page, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authAdmin, async (req, res) => {
  try {
    const { regd_no, student_name, year_branch, room_no, month_year, staying_days, mess_amount, old_due, fine, total_amount, remarks, status } = req.body;
    const total = (parseFloat(mess_amount) || 0) + (parseFloat(old_due) || 0) + (parseFloat(fine) || 0);
    await pool.query(
      'INSERT INTO mess_bills (regd_no, student_name, year_branch, room_no, month_year, staying_days, mess_amount, old_due, fine, total_amount, remarks, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [regd_no, student_name, year_branch, room_no, month_year, staying_days, mess_amount, old_due || 0, fine || 0, total_amount || total, remarks || '', status || 'unpaid']
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', authAdmin, async (req, res) => {
  try {
    const { staying_days, mess_amount, old_due, fine, total_amount, remarks, status } = req.body;
    await pool.query(
      'UPDATE mess_bills SET staying_days=?, mess_amount=?, old_due=?, fine=?, total_amount=?, remarks=?, status=? WHERE id=?',
      [staying_days, mess_amount, old_due, fine, total_amount, remarks, status || 'unpaid', req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', authAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM mess_bills WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

import express from 'express';
import pool from '../db.js';
import { authAdmin, authStudent } from '../middleware/auth.js';
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js';

const router = express.Router();

router.get('/', authAdmin, async (req, res) => {
  try {
    const { status, date, date_from, date_to } = req.query;
    const { page, limit, offset } = getPaginationParams(req);
    let where = ' WHERE 1=1';
    let whereRa = ' WHERE 1=1';
    const params = [];
    if (status) { where += ' AND status = ?'; whereRa += ' AND ra.status = ?'; params.push(status); }
    if (date) {
      where += ' AND DATE(from_date) <= ? AND DATE(to_date) >= ?';
      whereRa += ' AND DATE(ra.from_date) <= ? AND DATE(ra.to_date) >= ?';
      params.push(date, date);
    } else if (date_from && date_to) {
      where += ' AND DATE(from_date) <= ? AND DATE(to_date) >= ?';
      whereRa += ' AND DATE(ra.from_date) <= ? AND DATE(ra.to_date) >= ?';
      params.push(date_to, date_from);
    }
    const [countRes] = await pool.query(`SELECT COUNT(*) as c FROM outing_requests${where}`, params);
    const total = countRes[0].c;
    const [rows] = await pool.query(
      `SELECT ra.*, COALESCE(ra.branch, s.branch) AS branch, COALESCE(ra.year, s.year) AS year
       FROM outing_requests ra
       LEFT JOIN students s ON s.regd_no = ra.regd_no
       ${whereRa} ORDER BY ra.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json(paginatedResponse(rows, total, page, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Report: outings in date range (all statuses) — overlap filter: outing intersects selected day or [from,to]
router.get('/report', authAdmin, async (req, res) => {
  try {
    const { date, date_from, date_to, regd_no, status } = req.query;
    let where = ' WHERE 1=1';
    const params = [];
    if (status && ['pending', 'approved', 'rejected'].includes(String(status))) {
      where += ' AND ra.status = ?';
      params.push(status);
    }
    if (regd_no) {
      where += ' AND ra.regd_no = ?';
      params.push(regd_no);
    }
    if (!regd_no && date) {
      where += ' AND DATE(ra.from_date) <= ? AND DATE(ra.to_date) >= ?';
      params.push(date, date);
    } else if (!regd_no && date_from && date_to) {
      where += ' AND DATE(ra.from_date) <= ? AND DATE(ra.to_date) >= ?';
      params.push(date_to, date_from);
    }
    const [rows] = await pool.query(
      `SELECT ra.*, COALESCE(ra.branch, s.branch) AS branch, COALESCE(ra.year, s.year) AS year
       FROM outing_requests ra
       LEFT JOIN students s ON s.regd_no = ra.regd_no
       ${where} ORDER BY ra.from_date DESC`,
      params
    );
    res.json({ data: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Particular student: all outing details (all statuses) for one student
router.get('/report/student/:regd_no', authAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ra.*, COALESCE(ra.branch, s.branch) AS branch, COALESCE(ra.year, s.year) AS year
       FROM outing_requests ra
       LEFT JOIN students s ON s.regd_no = ra.regd_no
       WHERE ra.regd_no = ? ORDER BY ra.from_date DESC`,
      [req.params.regd_no]
    );
    res.json({ data: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/student/:regd_no', authStudent, async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const [countRes] = await pool.query('SELECT COUNT(*) as c FROM outing_requests WHERE regd_no = ?', [req.params.regd_no]);
    const total = countRes[0].c;
    const [rows] = await pool.query(
      `SELECT ra.*, COALESCE(ra.branch, s.branch) AS branch, COALESCE(ra.year, s.year) AS year
       FROM outing_requests ra
       LEFT JOIN students s ON s.regd_no = ra.regd_no
       WHERE ra.regd_no = ? ORDER BY ra.created_at DESC LIMIT ? OFFSET ?`,
      [req.params.regd_no, limit, offset]
    );
    res.json(paginatedResponse(rows, total, page, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [total] = await pool.query('SELECT COUNT(*) as c FROM outing_requests');
    const [pending] = await pool.query('SELECT COUNT(*) as c FROM outing_requests WHERE status = ?', ['pending']);
    const [approved] = await pool.query('SELECT COUNT(*) as c FROM outing_requests WHERE status = ?', ['approved']);
    res.json({ total: total[0].c, pending: pending[0].c, approved: approved[0].c });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authStudent, async (req, res) => {
  try {
    const { outing_type, purpose, from_date, to_date, phone } = req.body;
    const regd_no = req.user.regd_no;
    const [s] = await pool.query('SELECT full_name FROM students WHERE regd_no = ?', [regd_no]);
    const [ra] = await pool.query('SELECT room_number FROM room_allotments WHERE regd_no = ?', [regd_no]);
    const [y] = await pool.query('SELECT branch, year FROM students WHERE regd_no = ?', [regd_no]);
    await pool.query(
      'INSERT INTO outing_requests (regd_no, student_name, room_no, branch, year, outing_type, purpose, from_date, to_date, phone, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [regd_no, s[0]?.full_name, ra[0]?.room_number, y[0]?.branch, y[0]?.year, outing_type, purpose, from_date, to_date, phone, 'pending']
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id/approve', authAdmin, async (req, res) => {
  try {
    const delayRaw = req.body?.delay_hours;
    let delay_hours = null;
    if (delayRaw !== '' && delayRaw !== undefined && delayRaw !== null) {
      const n = parseInt(delayRaw, 10);
      if (!Number.isNaN(n) && n > 0) delay_hours = n;
    }
    await pool.query(
      'UPDATE outing_requests SET status = ?, delay_hours = ? WHERE id = ?',
      ['approved', delay_hours, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id/reject', authAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE outing_requests SET status = ? WHERE id = ?', ['rejected', req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

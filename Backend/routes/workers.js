import express from 'express';
import pool from '../db.js';
import { authAdmin } from '../middleware/auth.js';
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const [countRes] = await pool.query('SELECT COUNT(*) as c FROM workers');
    const total = countRes[0].c;
    const [rows] = await pool.query('SELECT * FROM workers ORDER BY id LIMIT ? OFFSET ?', [limit, offset]);
    res.json(paginatedResponse(rows, total, page, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authAdmin, async (req, res) => {
  try {
    const { name, phone, designation, working_timings } = req.body;
    await pool.query('INSERT INTO workers (name, phone, designation, working_timings) VALUES (?,?,?,?)', [name, phone, designation, working_timings]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', authAdmin, async (req, res) => {
  try {
    const { name, phone, designation, working_timings } = req.body;
    await pool.query('UPDATE workers SET name=?, phone=?, designation=?, working_timings=? WHERE id=?', [name, phone, designation, working_timings, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', authAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM workers WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

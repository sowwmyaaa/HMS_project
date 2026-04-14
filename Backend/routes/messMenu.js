import express from 'express';
import pool from '../db.js';
import { authAdmin } from '../middleware/auth.js';

const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM mess_menu ORDER BY FIELD(day_name, "MON","TUE","WED","THU","FRI","SAT","SUN")');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/today', async (req, res) => {
  try {
    const today = DAYS[new Date().getDay()];
    const [rows] = await pool.query('SELECT * FROM mess_menu WHERE day_name = ?', [today]);
    res.json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/day/:day', async (req, res) => {
  try {
    const day = req.params.day.toUpperCase();
    const [rows] = await pool.query('SELECT * FROM mess_menu WHERE day_name = ?', [day]);
    res.json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:day_name', authAdmin, async (req, res) => {
  try {
    const { breakfast, lunch, snacks, dinner } = req.body;
    await pool.query(
      'UPDATE mess_menu SET breakfast=?, lunch=?, snacks=?, dinner=? WHERE day_name=?',
      [breakfast, lunch, snacks, dinner, req.params.day_name]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

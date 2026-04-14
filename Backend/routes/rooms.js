import express from 'express';
import pool from '../db.js';
import { authAdmin } from '../middleware/auth.js';
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js';

const router = express.Router();

/** Rooms with at least one free bed (for allotment dropdown). Must be before /:room_number */
router.get('/availability', authAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.room_number, r.max_sharing, COALESCE(t.cnt, 0) AS occupied
      FROM rooms r
      LEFT JOIN (
        SELECT room_number, COUNT(*) AS cnt FROM room_allotments GROUP BY room_number
      ) t ON t.room_number = r.room_number
      WHERE COALESCE(t.cnt, 0) < r.max_sharing
      ORDER BY r.room_number
    `);
    res.json({ data: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const { page, limit, offset } = getPaginationParams(req);
    let where = '';
    const params = [];
    if (search) {
      where = ' WHERE room_number LIKE ?';
      params.push(`%${search}%`);
    }
    const [countRes] = await pool.query(`SELECT COUNT(*) as c FROM rooms${where}`, params);
    const total = countRes[0].c;
    const [rows] = await pool.query(
      `SELECT * FROM rooms${where} ORDER BY room_number LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json(paginatedResponse(rows, total, page, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:room_number', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rooms WHERE room_number = ?', [req.params.room_number]);
    if (!rows.length) return res.status(404).json({ error: 'Room not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authAdmin, async (req, res) => {
  try {
    const { room_number, beds, cots, fans, tube_lights, chairs, dustbin, washrooms, foot_stand, mirrors, shelf, max_sharing, bed_lights } = req.body;
    await pool.query(
      'INSERT INTO rooms (room_number, beds, cots, fans, tube_lights, chairs, dustbin, washrooms, foot_stand, mirrors, shelf, max_sharing, bed_lights) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [room_number, beds || 4, cots || 2, fans || 2, tube_lights || 2, chairs || 2, dustbin || 1, washrooms || 'ATTACHED', foot_stand || 1, mirrors || 1, shelf || 4, max_sharing || 4, bed_lights || 2]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:room_number', authAdmin, async (req, res) => {
  try {
    const { beds, cots, fans, tube_lights, chairs, dustbin, washrooms, foot_stand, mirrors, shelf, max_sharing, bed_lights } = req.body;
    await pool.query(
      'UPDATE rooms SET beds=?, cots=?, fans=?, tube_lights=?, chairs=?, dustbin=?, washrooms=?, foot_stand=?, mirrors=?, shelf=?, max_sharing=?, bed_lights=? WHERE room_number=?',
      [beds, cots, fans, tube_lights, chairs, dustbin, washrooms, foot_stand, mirrors, shelf, max_sharing, bed_lights, req.params.room_number]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:room_number', authAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM rooms WHERE room_number = ?', [req.params.room_number]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

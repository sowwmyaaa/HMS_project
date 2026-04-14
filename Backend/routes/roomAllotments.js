import express from 'express';
import pool from '../db.js';
import { authAdmin } from '../middleware/auth.js';
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js';

const router = express.Router();

function pickBed(maxSharing, usedBeds) {
  const used = new Set(usedBeds.map((b) => String(b)));
  for (let i = 1; i <= maxSharing; i++) {
    if (!used.has(String(i))) return String(i);
  }
  return String(maxSharing + 1);
}

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const { page, limit, offset } = getPaginationParams(req);
    let where = '';
    const params = [];
    if (search) {
      where = ' WHERE ra.room_number LIKE ? OR ra.regd_no LIKE ? OR ra.student_name LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const [countRes] = await pool.query(`SELECT COUNT(*) as c FROM room_allotments ra${where}`, params);
    const total = countRes[0].c;
    const [rows] = await pool.query(
      `SELECT ra.*, s.branch, s.year, s.photo_base64 FROM room_allotments ra LEFT JOIN students s ON s.regd_no = ra.regd_no${where} ORDER BY ra.room_number, ra.bed_number LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json(paginatedResponse(rows, total, page, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/room/:room_number', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT ra.*, s.branch, s.year FROM room_allotments ra LEFT JOIN students s ON s.regd_no = ra.regd_no WHERE ra.room_number = ?',
      [req.params.room_number]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { room_number, regd_no, student_name } = req.body;
    if (!room_number || !regd_no) {
      await conn.rollback();
      return res.status(400).json({ error: 'room_number and regd_no are required' });
    }

    await conn.query('DELETE FROM room_allotments WHERE regd_no = ?', [regd_no]);

    const [[room]] = await conn.query('SELECT max_sharing FROM rooms WHERE room_number = ?', [room_number]);
    if (!room) {
      await conn.rollback();
      return res.status(400).json({ error: 'Room not found' });
    }

    const [[{ cnt }]] = await conn.query(
      'SELECT COUNT(*) as cnt FROM room_allotments WHERE room_number = ?',
      [room_number]
    );
    if (cnt >= room.max_sharing) {
      await conn.rollback();
      return res.status(400).json({ error: 'Room is full' });
    }

    const [bedRows] = await conn.query(
      'SELECT bed_number FROM room_allotments WHERE room_number = ?',
      [room_number]
    );
    const bed_number = pickBed(room.max_sharing, bedRows.map((r) => r.bed_number));

    await conn.query(
      'INSERT INTO room_allotments (room_number, regd_no, student_name, bed_number) VALUES (?,?,?,?)',
      [room_number, regd_no, student_name || '', bed_number]
    );
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

router.put('/:id', authAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { room_number, regd_no, student_name } = req.body;
    const id = req.params.id;

    const [[row]] = await conn.query('SELECT * FROM room_allotments WHERE id = ?', [id]);
    if (!row) {
      await conn.rollback();
      return res.status(404).json({ error: 'Allotment not found' });
    }

    if (String(row.room_number) === String(room_number)) {
      await conn.query('DELETE FROM room_allotments WHERE regd_no = ? AND id != ?', [regd_no, id]);
      await conn.query(
        'UPDATE room_allotments SET regd_no=?, student_name=? WHERE id=?',
        [regd_no, student_name, id]
      );
      await conn.commit();
      return res.json({ ok: true });
    }

    await conn.query('DELETE FROM room_allotments WHERE regd_no = ? AND id != ?', [regd_no, id]);

    const [[room]] = await conn.query('SELECT max_sharing FROM rooms WHERE room_number = ?', [room_number]);
    if (!room) {
      await conn.rollback();
      return res.status(400).json({ error: 'Room not found' });
    }

    const [[{ cnt }]] = await conn.query(
      'SELECT COUNT(*) as cnt FROM room_allotments WHERE room_number = ? AND id != ?',
      [room_number, id]
    );
    if (cnt >= room.max_sharing) {
      await conn.rollback();
      return res.status(400).json({ error: 'Room is full' });
    }

    const [bedRows] = await conn.query(
      'SELECT bed_number FROM room_allotments WHERE room_number = ? AND id != ?',
      [room_number, id]
    );
    const bed_number = pickBed(room.max_sharing, bedRows.map((r) => r.bed_number));

    await conn.query(
      'UPDATE room_allotments SET room_number=?, regd_no=?, student_name=?, bed_number=? WHERE id=?',
      [room_number, regd_no, student_name, bed_number, id]
    );
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

router.delete('/:id', authAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM room_allotments WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

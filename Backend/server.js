import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import studentsRoutes from './routes/students.js';
import roomsRoutes from './routes/rooms.js';
import roomAllotmentsRoutes from './routes/roomAllotments.js';
import outingRoutes from './routes/outings.js';
import messBillRoutes from './routes/messBills.js';
import messMenuRoutes from './routes/messMenu.js';
import workersRoutes from './routes/workers.js';
import complaintsRoutes from './routes/complaints.js';
import doctorRoutes from './routes/doctor.js';
import pool from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/room-allotments', roomAllotmentsRoutes);
app.use('/api/outings', outingRoutes);
app.use('/api/mess-bills', messBillRoutes);
app.use('/api/mess-menu', messMenuRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/doctor', doctorRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

async function runMigrations() {
  try {
    await pool.query('ALTER TABLE outing_requests ADD COLUMN delay_hours INT NULL');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME' && e.errno !== 1060) {
      console.warn('DB migration (outing_requests.delay_hours):', e.message);
    }
  }
  try {
    await pool.query(
      "ALTER TABLE mess_bills ADD COLUMN status ENUM('paid', 'unpaid') DEFAULT 'unpaid' AFTER remarks"
    );
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME' && e.errno !== 1060) {
      console.warn('DB migration (mess_bills.status):', e.message);
    }
  }
}

app.listen(PORT, async () => {
  await runMigrations();
  console.log(`Hostelloom API running on http://localhost:${PORT}`);
});

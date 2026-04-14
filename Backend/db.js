import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'project@A5',
  database: process.env.DB_NAME || 'hostel_database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
import mysql from 'mysql2/promise';

if (!process.env.DB_HOST) {
  throw new Error('DB_HOST environment variable is required');
}
if (!process.env.DB_NAME) {
  throw new Error('DB_NAME environment variable is required');
}
if (!process.env.DB_USER) {
  throw new Error('DB_USER environment variable is required');
}
if (!process.env.DB_PASSWORD) {
  throw new Error('DB_PASSWORD environment variable is required');
}

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export default pool;

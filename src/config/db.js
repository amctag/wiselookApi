console.log('📦 Loading db.js');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), 'src', 'api', 'routes', '.env') });

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT || 5011,
  ssl: process.env.DB_SSL === "true"
});

// اختبار الاتصال عند بدء التشغيل
pool.query('SELECT 1 FROM users')
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('PostgreSQL connection error', err));

const query = async (text, params) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    console.error('❌ Empty or invalid SQL query passed to db.query');
    throw new Error('Invalid SQL query');
  }

  try {
    console.log('Executing query:', text);
    if (params) console.log('With params:', params);
    const res = await pool.query(text, params);
    return res.rows; // <-- ✅ التعديل هنا
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};



module.exports = {
  query,
  pool,
};

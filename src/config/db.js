// config/db.js
const path = require('path');
// Load .env from root directory (one level up from src)
require('dotenv').config({ path:path.join(process.cwd(), 'src', 'api', 'routes', '.env') });

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === "true"
});

// Test the connection on startup
pool.query('SELECT 1 FROM users')
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('PostgreSQL connection error', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};

const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: process.env.DB_PORT
});
pool.query("SELECT id_service, station_actuelle, voyage_complet FROM service WHERE id_service=13").then(r => { console.log(r.rows); process.exit(0); }).catch(console.error);

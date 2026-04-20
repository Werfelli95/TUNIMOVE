const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: process.env.DB_PORT
});
pool.query("UPDATE service SET statut = 'Terminé', date_fin = NOW() WHERE statut = 'En cours'").then(r => { console.log('Cleaned up zombie services'); process.exit(0); }).catch(console.error);

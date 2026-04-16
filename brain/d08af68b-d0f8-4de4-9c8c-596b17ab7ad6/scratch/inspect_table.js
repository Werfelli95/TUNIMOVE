const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function inspectTable() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ticket'
        `);
        console.log('Columns in ticket table:');
        console.table(res.rows);
    } catch (err) {
        console.error('Error inspecting table:', err);
    } finally {
        await pool.end();
    }
}

inspectTable();

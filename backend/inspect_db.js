const { Pool } = require('./config/db');
require('dotenv').config();

const pool = require('./config/db');

async function inspect() {
    try {
        const l = await pool.query('SELECT num_ligne FROM ligne LIMIT 1');
        if (l.rows.length === 0) {
            console.log('No lines found');
            process.exit();
        }
        const num_ligne = l.rows[0].num_ligne;
        const b = await pool.query('SELECT numero_bus FROM bus WHERE num_ligne = $1 LIMIT 1', [num_ligne]);
        
        console.log('Sample Data:');
        console.log({
            num_ligne: num_ligne,
            numero_bus: b.rows.length > 0 ? b.rows[0].numero_bus : 'None'
        });
        
        const constraints = await pool.query(`
            SELECT conname, pg_get_constraintdef(oid) 
            FROM pg_constraint 
            WHERE conrelid = 'ticket'::regclass
        `);
        console.log('Constraints:');
        console.table(constraints.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}
inspect();

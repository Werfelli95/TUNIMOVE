const pool = require('./config/db');

async function dumpSchema() {
    try {
        const query = `
            SELECT table_name, column_name, data_type, character_maximum_length, is_nullable
            FROM information_schema.columns
            WHERE table_name IN ('ticket', 'ligne', 'bus', 'service', 'reservation', 'trajet')
            ORDER BY table_name, ordinal_position;
        `;
        const res = await pool.query(query);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
dumpSchema();

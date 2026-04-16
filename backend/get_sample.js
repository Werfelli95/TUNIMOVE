const pool = require('./config/db');
(async () => {
    try {
        const l = await pool.query('SELECT num_ligne FROM ligne LIMIT 1');
        if (l.rows.length === 0) {
            console.log('No lines found');
            process.exit();
        }
        const num_ligne = l.rows[0].num_ligne;
        const b = await pool.query('SELECT numero_bus FROM bus WHERE num_ligne = $1 LIMIT 1', [num_ligne]);
        
        const data = {
            num_ligne: num_ligne,
            numero_bus: b.rows.length > 0 ? b.rows[0].numero_bus : 'None'
        };
        console.log('JSON_START' + JSON.stringify(data) + 'JSON_END');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();

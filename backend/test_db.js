const db = require('./config/db');

async function getSchema() {
    try {
        const tablesRes = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log("Tables:", tables);
        
        for (const table of tables) {
            const colsRes = await db.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
            console.log(`\nTable ${table}:`);
            colsRes.rows.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));
        }

        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
getSchema();

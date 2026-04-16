const db = require('./config/db');

async function getCols() {
    const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ticket'");
    console.log(res.rows.map(r => r.column_name));
    process.exit(0);
}
getCols();

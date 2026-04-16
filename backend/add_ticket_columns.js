const db = require('./config/db');

async function migrate_tickets() {
    try {
        console.log("Adding scan columns to ticket table...");
        await db.query(`ALTER TABLE ticket ADD COLUMN IF NOT EXISTS est_scanne BOOLEAN DEFAULT FALSE;`);
        await db.query(`ALTER TABLE ticket ADD COLUMN IF NOT EXISTS date_scan TIMESTAMP WITHOUT TIME ZONE;`);
        console.log("Columns added successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error adding columns:", err);
        process.exit(1);
    }
}

migrate_tickets();

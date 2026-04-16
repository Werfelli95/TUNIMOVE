const db = require('./config/db');

async function migrate() {
    try {
        console.log("Adding columns to bus table...");
        await db.query(`ALTER TABLE bus ADD COLUMN IF NOT EXISTS date_debut_affectation DATE;`);
        await db.query(`ALTER TABLE bus ADD COLUMN IF NOT EXISTS date_fin_affectation DATE;`);
        console.log("Columns added successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error adding columns:", err);
        process.exit(1);
    }
}

migrate();

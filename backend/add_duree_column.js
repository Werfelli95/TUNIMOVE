const db = require('./config/db');

async function addDureeColumn() {
    try {
        await db.query(`
            ALTER TABLE trajet 
            ADD COLUMN IF NOT EXISTS duree_minutes INTEGER DEFAULT 0;
        `);
        console.log("Column 'duree_minutes' added successfully to table 'trajet'");
        process.exit(0);
    } catch (error) {
        console.error("Error adding column:", error);
        process.exit(1);
    }
}

addDureeColumn();

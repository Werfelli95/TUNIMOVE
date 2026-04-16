const db = require('./config/db');

async function updateTicket() {
    try {
        await db.query(`ALTER TABLE ticket ADD COLUMN IF NOT EXISTS num_ligne INT;`);
        await db.query(`ALTER TABLE ticket ADD COLUMN IF NOT EXISTS heure_depart VARCHAR(50);`);
        await db.query(`ALTER TABLE ticket ADD COLUMN IF NOT EXISTS id_bus INT;`);
        console.log("Ticket columns added successfully.");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
updateTicket();

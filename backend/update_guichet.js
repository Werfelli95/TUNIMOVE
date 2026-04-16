const db = require('./config/db');

async function updateGuichet() {
    try {
        await db.query(`ALTER TABLE guichet ADD COLUMN IF NOT EXISTS num_ligne INT;`);
        await db.query(`ALTER TABLE guichet ADD COLUMN IF NOT EXISTS station_depart VARCHAR(255);`);
        console.log("Guichet columns added successfully.");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
updateGuichet();

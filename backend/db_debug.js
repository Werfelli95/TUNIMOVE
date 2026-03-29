require('dotenv').config();
const db = require('./config/db');

async function test() {
    try {
        console.log("--- LIGNES ---");
        const lines = await db.query("SELECT num_ligne, ville_depart, ville_arrivee FROM ligne WHERE statut_ligne = 'active'");
        console.table(lines.rows);

        console.log("--- BUS ---");
        const buses = await db.query("SELECT id_bus, numero_bus, num_ligne FROM bus");
        console.table(buses.rows);

        console.log("--- JOIN TEST ---");
        const joined = await db.query(`
            SELECT l.num_ligne, l.ville_depart, b.numero_bus
            FROM ligne l
            LEFT JOIN bus b ON l.num_ligne = b.num_ligne
            WHERE l.statut_ligne = 'active'
        `);
        console.table(joined.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();

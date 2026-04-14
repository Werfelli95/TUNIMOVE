const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function checkSchema() {
    try {
        const user = await pool.query("SELECT id_utilisateur FROM utilisateur WHERE nom = 'Ben Salah'");
        console.table(user.rows);
        const id = user.rows[0]?.id_utilisateur;
        if (id) {
            const guichet = await pool.query("SELECT * FROM guichet WHERE id_agent = $1", [id]);
            console.table(guichet.rows);
        }

        console.log('--- LIGNE DATA ---');
        const lignes = await pool.query('SELECT num_ligne, ville_depart, ville_arrivee FROM ligne');
        console.table(lignes.rows);
        
    } catch (err) {
        console.error('Error debugging data:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();

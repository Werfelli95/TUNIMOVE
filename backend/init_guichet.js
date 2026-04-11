const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const initDb = async () => {
    try {
        console.log("Initialisation de la table guichet...");
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS guichet (
                id_guichet SERIAL PRIMARY KEY,
                nom_guichet VARCHAR(100) NOT NULL,
                emplacement VARCHAR(255),
                id_agent INTEGER REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL,
                statut VARCHAR(50) DEFAULT 'Actif'
            );
        `);

        // Vérifier si des données existent déjà
        const countRes = await pool.query("SELECT COUNT(*) FROM guichet");
        if (parseInt(countRes.rows[0].count) === 0) {
            console.log("Insertion des guichets par défaut...");
            await pool.query(`
                INSERT INTO guichet (nom_guichet, emplacement) VALUES 
                ('Guichet Tunis', 'Gare Tunis Marine'),
                ('Guichet Rades', 'Station Rades'),
                ('Guichet Sfax', 'Centre ville Sfax');
            `);
        }

        console.log("Base de données prête !");
        process.exit(0);
    } catch (err) {
        console.error("Erreur lors de l'initialisation :", err);
        process.exit(1);
    }
};

initDb();

const db = require('./config/db');

async function migrate() {
    try {
        await db.query(`
            ALTER TABLE trajet 
            ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'Actif' NOT NULL
        `);
        console.log("✅ Colonne 'statut' ajoutée à la table 'trajet' avec succès");
        process.exit(0);
    } catch (err) {
        console.error("❌ Erreur migration:", err.message);
        process.exit(1);
    }
}

migrate();

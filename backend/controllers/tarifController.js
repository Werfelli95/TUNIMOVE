const db = require('../config/db');

// Récupérer la configuration (unique ligne id=1)
exports.getTarif = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM tarif ORDER BY id_tarif LIMIT 1");
        res.json(result.rows[0] || {});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Sauvegarder/Mettre à jour la configuration
exports.updateTarif = async (req, res) => {
    const { prix_par_km, frais_fixes, red_etudiant, red_militaire, red_handicape, red_senior } = req.body;
    try {
        // On vérifie s'il existe déjà une ligne
        const check = await db.query("SELECT id_tarif FROM tarif LIMIT 1");

        if (check.rows.length > 0) {
            const id = check.rows[0].id_tarif;
            await db.query(
                `UPDATE tarif SET 
                 prix_par_km=$1, frais_fixes=$2, 
                 red_etudiant=$3, red_militaire=$4, red_handicape=$5, red_senior=$6,
                 date_mise_a_jour=NOW() WHERE id_tarif=$7`,
                [prix_par_km, frais_fixes, red_etudiant, red_militaire, red_handicape, red_senior, id]
            );
        } else {
            await db.query(
                `INSERT INTO tarif (prix_par_km, frais_fixes, red_etudiant, red_militaire, red_handicape, red_senior) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [prix_par_km, frais_fixes, red_etudiant, red_militaire, red_handicape, red_senior]
            );
        }
        res.json({ message: "Configuration tarifaire enregistrée !" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

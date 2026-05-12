const db = require('../config/db');

// Migration: Create fiche_controleur_service table
const initControleurTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS fiche_controleur_service (
                id_fiche SERIAL PRIMARY KEY,
                id_controleur INTEGER REFERENCES utilisateur(id_utilisateur),
                heure_connexion TIMESTAMPTZ,
                heure_cloture TIMESTAMPTZ DEFAULT NOW(),
                nb_tickets_scannes INTEGER DEFAULT 0,
                statut VARCHAR(20) DEFAULT 'Validé'
            );
        `);
    } catch (err) {
        console.error('Controleur Migration error:', err);
    }
};
initControleurTable();

/**
 * GET /api/controleur-service/reports
 * Get all controller service reports (Admin)
 */
exports.getAllReports = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT f.*, u.nom, u.prenom, u.matricule
            FROM fiche_controleur_service f
            JOIN utilisateur u ON f.id_controleur = u.id_utilisateur
            ORDER BY f.heure_cloture DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getAllReports contrôleur:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des rapports: ' + err.message });
    }
};

/**
 * POST /api/controleur-service/close
 * Close controller service and save report
 */
exports.closeService = async (req, res) => {
    const { id_controleur, heure_connexion, nb_tickets_scannes } = req.body;

    if (!id_controleur) {
        return res.status(400).json({ message: 'ID contrôleur manquant' });
    }

    try {
        let dateConnexion = null;
        if (heure_connexion) {
            const ts = parseInt(heure_connexion);
            if (!isNaN(ts)) {
                dateConnexion = new Date(ts);
            }
        }

        const result = await db.query(`
            INSERT INTO fiche_controleur_service (id_controleur, heure_connexion, heure_cloture, nb_tickets_scannes)
            VALUES ($1, $2, NOW(), $3)
            RETURNING *
        `, [id_controleur, dateConnexion, nb_tickets_scannes || 0]);

        res.status(201).json({
            message: 'Service contrôleur clôturé avec succès',
            fiche: result.rows[0]
        });
    } catch (err) {
        console.error('Erreur closeService contrôleur:', err);
        res.status(500).json({ message: 'Erreur lors de la clôture du service: ' + err.message });
    }
};

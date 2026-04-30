const db = require('../config/db');

// Initialize affectation_service table
const initAffectationTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS affectation_service (
                id_affectation SERIAL PRIMARY KEY,
                id_utilisateur INTEGER REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
                id_bus INTEGER REFERENCES bus(id_bus) ON DELETE CASCADE,
                num_ligne VARCHAR(50),
                horaire VARCHAR(20),
                date_affectation DATE NOT NULL,
                heure_debut TIME NOT NULL,
                heure_fin TIME,
                statut VARCHAR(50) DEFAULT 'Planifié',
                UNIQUE (id_utilisateur, date_affectation, heure_debut),
                UNIQUE (id_bus, date_affectation, heure_debut)
            );
        `);
    } catch (err) {
        console.error('Migration error (affectation_service):', err);
    }
};
initAffectationTable();

/**
 * GET /api/affectations
 * Get all assignments for admin
 */
exports.getAffectations = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.id_affectation, a.id_utilisateur, a.id_bus, a.num_ligne, a.horaire, 
                   a.date_affectation, a.heure_debut, a.heure_fin, a.statut,
                   u.nom as receveur_nom, u.prenom as receveur_prenom, u.matricule,
                   b.numero_bus, b.capacite,
                   l.ville_depart, l.ville_arrivee
            FROM affectation_service a
            JOIN utilisateur u ON a.id_utilisateur = u.id_utilisateur
            JOIN bus b ON a.id_bus = b.id_bus
            LEFT JOIN ligne l ON a.num_ligne = l.num_ligne
            ORDER BY a.date_affectation DESC, a.heure_debut ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getAffectations:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des affectations' });
    }
};

/**
 * POST /api/affectations
 * Create a new assignment
 */
exports.createAffectation = async (req, res) => {
    const { id_utilisateur, id_bus, num_ligne, horaire, date_affectation, heure_debut, heure_fin } = req.body;
    
    if (!id_utilisateur || !id_bus || !date_affectation || !heure_debut) {
        return res.status(400).json({ message: 'Données incomplètes (utilisateur, bus, date, heure_debut requis)' });
    }

    try {
        // Validation: No overlap for the receveur
        const receveurOverlap = await db.query(`
            SELECT id_affectation FROM affectation_service 
            WHERE id_utilisateur = $1 
            AND date_affectation = $2 
            AND statut != 'Annulé'
            AND (
                ($3 >= heure_debut AND (heure_fin IS NULL OR $3 < heure_fin)) OR
                ($4 IS NOT NULL AND $4 > heure_debut AND ($4 <= heure_fin OR heure_fin IS NULL)) OR
                ($3 <= heure_debut AND ($4 IS NULL OR $4 >= heure_fin))
            )
        `, [id_utilisateur, date_affectation, heure_debut, heure_fin || null]);

        if (receveurOverlap.rows.length > 0) {
            return res.status(400).json({ message: 'Le receveur a déjà une affectation sur ce créneau horaire.' });
        }

        // Validation: No overlap for the bus
        const busOverlap = await db.query(`
            SELECT id_affectation FROM affectation_service 
            WHERE id_bus = $1 
            AND date_affectation = $2 
            AND statut != 'Annulé'
            AND (
                ($3 >= heure_debut AND (heure_fin IS NULL OR $3 < heure_fin)) OR
                ($4 IS NOT NULL AND $4 > heure_debut AND ($4 <= heure_fin OR heure_fin IS NULL)) OR
                ($3 <= heure_debut AND ($4 IS NULL OR $4 >= heure_fin))
            )
        `, [id_bus, date_affectation, heure_debut, heure_fin || null]);

        if (busOverlap.rows.length > 0) {
            return res.status(400).json({ message: 'Ce bus est déjà affecté sur ce créneau horaire.' });
        }

        const result = await db.query(`
            INSERT INTO affectation_service (id_utilisateur, id_bus, num_ligne, horaire, date_affectation, heure_debut, heure_fin, statut)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'Planifié')
            RETURNING *
        `, [id_utilisateur, id_bus, num_ligne || null, horaire || null, date_affectation, heure_debut, heure_fin || null]);

        res.status(201).json({ message: 'Affectation créée avec succès', affectation: result.rows[0] });

    } catch (err) {
        console.error('Erreur createAffectation:', err);
        res.status(500).json({ message: "Erreur lors de la création de l'affectation: " + err.message });
    }
};

/**
 * DELETE /api/affectations/:id
 * Delete an assignment
 */
exports.deleteAffectation = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM affectation_service WHERE id_affectation = $1', [id]);
        res.json({ message: 'Affectation supprimée avec succès' });
    } catch (err) {
        console.error('Erreur deleteAffectation:', err);
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};

/**
 * GET /api/affectations/receveur/:id/today
 * Get today's assignments for a specific receveur
 */
exports.getTodayAssignmentsForReceveur = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT a.id_affectation, a.id_bus, a.num_ligne, a.horaire, a.heure_debut, a.heure_fin, a.statut,
                   b.numero_bus, b.capacite,
                   l.ville_depart, l.ville_arrivee
            FROM affectation_service a
            JOIN bus b ON a.id_bus = b.id_bus
            LEFT JOIN ligne l ON a.num_ligne = l.num_ligne
            WHERE a.id_utilisateur = $1 
              AND a.date_affectation = CURRENT_DATE
              AND a.statut != 'Annulé'
            ORDER BY a.heure_debut ASC
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getTodayAssignmentsForReceveur:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des affectations du jour' });
    }
};

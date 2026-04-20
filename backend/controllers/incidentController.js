const db = require('../config/db');

// Créer la table si elle n'existe pas encore
const initTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS incident (
            id_incident   SERIAL PRIMARY KEY,
            type_incident VARCHAR(100) NOT NULL,
            description   TEXT NOT NULL,
            numero_bus    VARCHAR(50),
            ligne         VARCHAR(100),
            rapporte_par  VARCHAR(100),
            date_incident TIMESTAMPTZ DEFAULT NOW(),
            statut        VARCHAR(30) DEFAULT 'En attente'
        )
    `);
};
initTable().catch(console.error);

// Créer un incident
exports.createIncident = async (req, res) => {
    const { type_incident, description, numero_bus, ligne, rapporte_par, date_incident } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO incident (type_incident, description, numero_bus, ligne, rapporte_par, date_incident)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id_incident, type_incident, statut, date_incident`,
            [type_incident, description, numero_bus || null, ligne || null, rapporte_par || null, date_incident || new Date()]
        );
        res.status(201).json({
            message: 'Incident signalé avec succès',
            incident: result.rows[0]
        });
    } catch (err) {
        console.error('Erreur createIncident:', err);
        res.status(500).json({ message: 'Erreur lors de l\'enregistrement de l\'incident' });
    }
};

// Lister tous les incidents (admin) with optional ?statut= filter
exports.getAllIncidents = async (req, res) => {
    try {
        const { statut } = req.query;
        let query = `SELECT * FROM incident`;
        const params = [];
        if (statut && statut !== 'all') {
            params.push(statut);
            query += ` WHERE statut = $1`;
        }
        query += ` ORDER BY date_incident DESC`;
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getAllIncidents:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des incidents' });
    }
};

// Update incident status (admin)
exports.updateIncidentStatus = async (req, res) => {
    const { id } = req.params;
    const { statut } = req.body;
    const allowed = ['En attente', 'En cours de traitement', 'Résolu'];
    if (!allowed.includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide' });
    }
    try {
        const result = await db.query(
            `UPDATE incident SET statut = $1 WHERE id_incident = $2 RETURNING *`,
            [statut, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Incident introuvable' });
        res.json({ message: 'Statut mis à jour', incident: result.rows[0] });
    } catch (err) {
        console.error('Erreur updateIncidentStatus:', err);
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
};

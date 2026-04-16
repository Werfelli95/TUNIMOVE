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

// Lister tous les incidents (admin)
exports.getAllIncidents = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM incident ORDER BY date_incident DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getAllIncidents:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des incidents' });
    }
};

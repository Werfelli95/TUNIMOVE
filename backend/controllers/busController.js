const db = require('../config/db');

// Récupérer tous les bus de la table 'bus'
exports.getBuses = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id_bus, numero_bus, capacite, etat, num_ligne FROM bus ORDER BY numero_bus ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getBuses:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération de la flotte' });
    }
};


// Ajouter un nouveau bus
exports.createBus = async (req, res) => {
    try {
        const { numero_bus, capacite, etat, num_ligne } = req.body;
        const checkBus = await db.query('SELECT * FROM bus WHERE numero_bus = $1', [numero_bus]);
        if (checkBus.rows.length > 0) {
            return res.status(400).json({ message: "Ce numéro de bus existe déjà." });
        }
        const result = await db.query(
            'INSERT INTO bus (numero_bus, capacite, etat, num_ligne) VALUES ($1, $2, $3, $4) RETURNING *',
            [numero_bus, capacite, etat, num_ligne]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erreur createBus:', err);
        res.status(500).json({ message: 'Erreur lors de l’ajout du bus' });
    }
};
// Mettre à jour un bus
exports.updateBus = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero_bus, capacite, etat, num_ligne } = req.body;

        const result = await db.query(
            'UPDATE bus SET numero_bus = $1, capacite = $2, etat = $3, num_ligne = $4 WHERE id_bus = $5 RETURNING *',
            [numero_bus, capacite, etat, num_ligne, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Bus introuvable" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erreur updateBus:', err);
        res.status(500).json({ message: 'Erreur lors de la modification' });
    }
};

// Supprimer un bus
exports.deleteBus = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM bus WHERE id_bus = $1', [id]);
        res.json({ message: "Bus supprimé avec succès" });
    } catch (err) {
        console.error('Erreur deleteBus:', err);
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};
// Compter uniquement les bus actifs (En service)
exports.getActiveBusCount = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT COUNT(*) FROM bus WHERE etat = 'En service'"
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('Erreur getActiveBusCount:', err);
        res.status(500).json({ message: 'Erreur lors du comptage des bus actifs' });
    }
};



const db = require('../config/db');

// 1. Statistiques des guichets
exports.getGuichetStats = async (req, res) => {
    try {
        const totalGuichets = await db.query("SELECT COUNT(*) FROM guichet");
        const withAgent = await db.query("SELECT COUNT(*) FROM guichet WHERE id_agent IS NOT NULL");
        const withoutAgent = await db.query("SELECT COUNT(*) FROM guichet WHERE id_agent IS NULL");
        const activeGuichets = await db.query("SELECT COUNT(*) FROM guichet WHERE statut = 'Actif'");

        // Agents disponibles (Rôle AGENT et pas encore affectés à un guichet)
        const availableAgents = await db.query(`
            SELECT COUNT(*) FROM utilisateur 
            WHERE LOWER(role) = 'agent' 
            AND id_utilisateur NOT IN (SELECT id_agent FROM guichet WHERE id_agent IS NOT NULL)
        `);

        res.json({
            total: parseInt(totalGuichets.rows[0].count),
            withAgent: parseInt(withAgent.rows[0].count),
            withoutAgent: parseInt(withoutAgent.rows[0].count),
            activeCount: parseInt(activeGuichets.rows[0].count),
            availableAgents: parseInt(availableAgents.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur stats guichets" });
    }
};

// 2. Liste des guichets avec leurs agents
exports.getGuichets = async (req, res) => {
    try {
        const query = `
            SELECT g.id_guichet, g.nom_guichet, g.emplacement, g.statut, g.num_ligne, g.station_depart,
                   u.nom as agent_nom, u.prenom as agent_prenom, u.id_utilisateur as id_agent
            FROM guichet g
            LEFT JOIN utilisateur u ON g.id_agent = u.id_utilisateur
            ORDER BY g.nom_guichet ASC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur liste guichets" });
    }
};

// 3. Liste des agents disponibles
exports.getAvailableAgents = async (req, res) => {
    try {
        const query = `
            SELECT id_utilisateur, nom, prenom 
            FROM utilisateur 
            WHERE LOWER(role) = 'agent' 
            AND id_utilisateur NOT IN (SELECT id_agent FROM guichet WHERE id_agent IS NOT NULL)
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur agents disponibles" });
    }
};

// 4. Mettre à jour l'affectation d'un guichet
exports.updateAssignment = async (req, res) => {
    const { id_guichet, id_agent, num_ligne, station_depart } = req.body;
    try {
        await db.query(
            'UPDATE guichet SET id_agent = $1, num_ligne = $2, station_depart = $3 WHERE id_guichet = $4', 
            [id_agent, num_ligne || null, station_depart || null, id_guichet]
        );
        res.json({ message: "Affectation du guichet réussie" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur SQL lors de l'affectation du guichet" });
    }
};

// 5. Créer un nouveau guichet
exports.createGuichet = async (req, res) => {
    const { nom_guichet, emplacement } = req.body;
    try {
        if (!nom_guichet) {
            return res.status(400).json({ message: "Le nom du guichet est requis" });
        }
        const query = `
            INSERT INTO guichet (nom_guichet, emplacement) 
            VALUES ($1, $2) 
            RETURNING *
        `;
        const result = await db.query(query, [nom_guichet, emplacement || null]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la création du guichet" });
    }
};

// 6. Mettre à jour le statut d'un guichet
exports.updateStatus = async (req, res) => {
    const { id_guichet, statut } = req.body;
    try {
        await db.query(
            'UPDATE guichet SET statut = $1 WHERE id_guichet = $2',
            [statut, id_guichet]
        );
        res.json({ message: "Statut du guichet mis à jour" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
};

// 7. Récupérer le guichet d'un agent spécifique
exports.getGuichetByAgent = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            "SELECT id_guichet, nom_guichet, emplacement, num_ligne, station_depart FROM guichet WHERE id_agent = $1", 
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(200).json(null); // Return 200 with null to avoid 404 console errors
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur récupération guichet agent" });
    }
};

// 8. Supprimer un guichet
exports.deleteGuichet = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM guichet WHERE id_guichet = $1', [id]);
        res.json({ message: "Guichet supprimé avec succès" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la suppression du guichet" });
    }
};

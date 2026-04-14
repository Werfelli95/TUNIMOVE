const db = require('../config/db');

// 1. Statistiques : Uniquement pour les bus "En service"
exports.getAssignmentStats = async (req, res) => {
    try {
        // Uniquement les bus PRÊTS à rouler
        const busWithReceiver = await db.query("SELECT COUNT(*) FROM bus WHERE id_receveur IS NOT NULL AND etat = 'En service'");
        const busWithoutReceiver = await db.query("SELECT COUNT(*) FROM bus WHERE id_receveur IS NULL AND etat = 'En service'");

        // Receveurs disponibles
        const availableReceivers = await db.query(`
            SELECT COUNT(*) FROM utilisateur 
            WHERE LOWER(role) = 'receveur' 
            AND id_utilisateur NOT IN (SELECT id_receveur FROM bus WHERE id_receveur IS NOT NULL)
        `);

        res.json({
            withReceiver: parseInt(busWithReceiver.rows[0].count),
            withoutReceiver: parseInt(busWithoutReceiver.rows[0].count),
            availableReceivers: parseInt(availableReceivers.rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ message: "Erreur stats" });
    }
};

// 2. Liste du tableau : Uniquement les bus "En service"
exports.getAssignments = async (req, res) => {
    try {
        const query = `
            SELECT b.id_bus, b.numero_bus, b.capacite, b.etat, b.date_debut_affectation, b.date_fin_affectation,
                   u.nom as receveur_nom, u.prenom as receveur_prenom, u.id_utilisateur as id_receveur
            FROM bus b
            LEFT JOIN utilisateur u ON b.id_receveur = u.id_utilisateur
            WHERE b.etat = 'En service' -- <--- On filtre ici
            ORDER BY b.numero_bus ASC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error in getAssignments:", err);
        res.status(500).json({ message: "Erreur liste affectations", error: err.message });
    }
};

// 3. Liste des receveurs disponibles (Ne change pas)
exports.getAvailableReceivers = async (req, res) => {
    try {
        const query = `
            SELECT id_utilisateur, nom, prenom 
            FROM utilisateur 
            WHERE LOWER(role) = 'receveur' 
            AND id_utilisateur NOT IN (SELECT id_receveur FROM bus WHERE id_receveur IS NOT NULL)
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Erreur receveurs" });
    }
};

// 4. Mettre à jour (Ne change pas)
exports.updateAssignment = async (req, res) => {
    const { id_bus, id_receveur, date_debut, date_fin } = req.body;
    try {
        if (id_receveur === null) {
            await db.query('UPDATE bus SET id_receveur = NULL, date_debut_affectation = NULL, date_fin_affectation = NULL WHERE id_bus = $1', [id_bus]);
        } else {
            await db.query(
                'UPDATE bus SET id_receveur = $1, date_debut_affectation = $2, date_fin_affectation = $3 WHERE id_bus = $4', 
                [id_receveur, date_debut || null, date_fin || null, id_bus]
            );
        }
        res.json({ message: "Affectation réussie" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur SQL" });
    }
};

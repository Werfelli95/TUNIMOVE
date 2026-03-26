const db = require('../config/db');

// 1. Récupérer tout le réseau (Groupé par ligne)
exports.getNetwork = async (req, res) => {
    try {
        const query = `
            SELECT l.*, 
                   COALESCE(json_agg(t.* ORDER BY t.id_trajet) FILTER (WHERE t.id_trajet IS NOT NULL), '[]') as stations
            FROM ligne l
            LEFT JOIN trajet t ON l.num_ligne = t.num_ligne
            GROUP BY l.num_ligne
            ORDER BY l.num_ligne DESC;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Créer (Déjà fait, mais vérifiez les noms de tables)
exports.createLineWithTrajets = async (req, res) => {
    const { ville_depart, ville_arrivee, horaire, statut_ligne, stations } = req.body;
    try {
        const today = new Date().toISOString().split('T')[0];
        const timestampValue = `${today} ${horaire}:00`;
        const lineRes = await db.query(
            "INSERT INTO ligne (ville_depart, ville_arrivee, horaire, statut_ligne) VALUES ($1, $2, $3, $4) RETURNING num_ligne",
            [ville_depart, ville_arrivee, timestampValue, statut_ligne]
        );
        const num_ligne = lineRes.rows[0].num_ligne;

        if (stations && stations.length > 0) {
            for (let st of stations) {
                if (st.arret) {
                    await db.query("INSERT INTO trajet (arret, distance_km, num_ligne) VALUES ($1, $2, $3)",
                        [st.arret, parseFloat(st.distance_km) || 0, num_ligne]);
                }
            }
        }
        res.status(201).json({ message: "Ligne créée" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. Mettre à jour (Update)
exports.updateLine = async (req, res) => {
    const { id } = req.params;
    const { ville_depart, ville_arrivee, horaire, statut_ligne, stations } = req.body;
    try {
        const today = new Date().toISOString().split('T')[0];
        const timestampValue = horaire.includes('-') ? horaire : `${today} ${horaire}:00`;

        await db.query(
            "UPDATE ligne SET ville_depart=$1, ville_arrivee=$2, horaire=$3, statut_ligne=$4 WHERE num_ligne=$5",
            [ville_depart, ville_arrivee, timestampValue, statut_ligne, id]
        );

        await db.query("DELETE FROM trajet WHERE num_ligne = $1", [id]);
        if (stations && stations.length > 0) {
            for (let st of stations) {
                if (st.arret) {
                    await db.query("INSERT INTO trajet (arret, distance_km, num_ligne) VALUES ($1, $2, $3)",
                        [st.arret, parseFloat(st.distance_km) || 0, id]);
                }
            }
        }
        res.json({ message: "Ligne mise à jour" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 4. Supprimer (Delete)
exports.deleteLine = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM ligne WHERE num_ligne = $1", [id]);
        res.json({ message: "Ligne supprimée" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 5. Compter les lignes actives (Dashboard)
exports.getLineCount = async (req, res) => {
    try {
        const result = await db.query("SELECT COUNT(*) FROM ligne WHERE statut_ligne = 'Active'");
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


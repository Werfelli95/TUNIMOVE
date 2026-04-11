const db = require('../config/db');

// 1. Récupérer tout le réseau (Groupé par ligne)
exports.getNetwork = async (req, res) => {
    try {
        const query = `
            SELECT l.*, 
                   COALESCE(
                       (SELECT json_agg(TO_CHAR(h.heure_depart, 'HH24:MI') ORDER BY h.heure_depart) 
                        FROM horaire_ligne h 
                        WHERE h.num_ligne = l.num_ligne
                       ), '[]'
                   ) as horaires,
                   COALESCE(
                       (SELECT json_agg(t.* ORDER BY t.id_trajet) 
                        FROM trajet t 
                        WHERE t.num_ligne = l.num_ligne
                       ), '[]'
                   ) as stations
            FROM ligne l
            ORDER BY l.num_ligne DESC;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Créer
exports.createLineWithTrajets = async (req, res) => {
    const { ville_depart, ville_arrivee, statut_ligne, stations, horaires } = req.body;
    try {
        const lineRes = await db.query(
            "INSERT INTO ligne (ville_depart, ville_arrivee, statut_ligne) VALUES ($1, $2, $3) RETURNING num_ligne",
            [ville_depart, ville_arrivee, statut_ligne]
        );
        const num_ligne = lineRes.rows[0].num_ligne;

        if (horaires && horaires.length > 0) {
            for (let h of horaires) {
                if (h) {
                    await db.query("INSERT INTO horaire_ligne (num_ligne, heure_depart) VALUES ($1, $2)", [num_ligne, h]);
                }
            }
        }

        if (stations && stations.length > 0) {
            for (let st of stations) {
                if (st.arret) {
                    await db.query("INSERT INTO trajet (arret, distance_km, num_ligne) VALUES ($1, $2, $3)",
                        [st.arret, parseFloat(st.distance_km) || 0, num_ligne]);
                }
            }
        }
        res.status(201).json({ message: "Ligne créée avec succès" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. Mettre à jour (Update)
exports.updateLine = async (req, res) => {
    const { id } = req.params;
    const { ville_depart, ville_arrivee, statut_ligne, stations, horaires } = req.body;
    try {
        await db.query(
            "UPDATE ligne SET ville_depart=$1, ville_arrivee=$2, statut_ligne=$3 WHERE num_ligne=$4",
            [ville_depart, ville_arrivee, statut_ligne, id]
        );

        // Update horaires
        await db.query("DELETE FROM horaire_ligne WHERE num_ligne = $1", [id]);
        if (horaires && horaires.length > 0) {
            for (let h of horaires) {
                if (h) {
                    await db.query("INSERT INTO horaire_ligne (num_ligne, heure_depart) VALUES ($1, $2)", [id, h]);
                }
            }
        }

        // Update stations
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
    const client = await db.connect(); // On utilise un client pour la transaction

    try {
        await client.query('BEGIN');

        // 1. Détacher les services (tickets) de cette ligne pour garder l'historique
        await client.query("UPDATE service SET num_ligne = NULL WHERE num_ligne = $1", [id]);

        // 2. Détacher les bus de cette ligne
        await client.query("UPDATE bus SET num_ligne = NULL WHERE num_ligne = $1", [id]);

        // 3. Supprimer les horaires associés
        await client.query("DELETE FROM horaire_ligne WHERE num_ligne = $1", [id]);

        // 4. Supprimer les stations (trajets) associées
        await client.query("DELETE FROM trajet WHERE num_ligne = $1", [id]);

        // 5. Suppression finale de la ligne
        const result = await client.query("DELETE FROM ligne WHERE num_ligne = $1", [id]);

        if (result.rowCount === 0) {
            throw new Error("La ligne n'existe plus ou n'a pas pu être supprimée.");
        }

        await client.query('COMMIT');
        res.json({ message: "Ligne et toutes ses dépendances supprimées avec succès" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erreur critique deleteLine:", error);
        res.status(500).json({ 
            message: "Échec de la suppression complète", 
            error: error.message 
        });
    } finally {
        client.release();
    }
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



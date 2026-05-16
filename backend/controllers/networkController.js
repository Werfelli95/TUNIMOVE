const db = require('../config/db');

const normalizeCity = (city) => String(city || '').trim().replace(/\s+/g, ' ').toLowerCase();

const lineExists = async (client, ville_depart, ville_arrivee) => {
    const result = await client.query(
        `SELECT num_ligne
         FROM ligne
         WHERE LOWER(TRIM(ville_depart)) = $1
           AND LOWER(TRIM(ville_arrivee)) = $2
         LIMIT 1`,
        [normalizeCity(ville_depart), normalizeCity(ville_arrivee)]
    );

    return result.rows[0] || null;
};

const buildReverseStations = (stations = []) => {
    const cleanedStations = stations
        .filter(st => st.arret)
        .map(st => ({
            arret: String(st.arret).trim(),
            distance_km: parseFloat(st.distance_km) || 0,
            duree_minutes: parseInt(st.duree_minutes) || 0
        }));
    const maxDistance = cleanedStations.length > 0
        ? Math.max(...cleanedStations.map(st => st.distance_km))
        : 0;

    return cleanedStations
        .slice()
        .reverse()
        .map(st => ({
            arret: st.arret,
            distance_km: maxDistance > 0 ? Math.max(maxDistance - st.distance_km, 0) : st.distance_km,
            duree_minutes: st.duree_minutes
        }));
};

const hasDureeMinutesColumn = async (client) => {
    const result = await client.query(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_name = 'trajet'
           AND column_name = 'duree_minutes'
         LIMIT 1`
    );

    return result.rows.length > 0;
};

const insertStation = async (client, num_ligne, station, includeDuration) => {
    if (includeDuration) {
        await client.query(
            "INSERT INTO trajet (arret, distance_km, duree_minutes, num_ligne) VALUES ($1, $2, $3, $4)",
            [String(station.arret).trim(), parseFloat(station.distance_km) || 0, parseInt(station.duree_minutes) || 0, num_ligne]
        );
        return;
    }

    await client.query(
        "INSERT INTO trajet (arret, distance_km, num_ligne) VALUES ($1, $2, $3)",
        [String(station.arret).trim(), parseFloat(station.distance_km) || 0, num_ligne]
    );
};

const insertLineWithDetails = async (client, { ville_depart, ville_arrivee, statut_ligne, horaires, stations }) => {
    const lineRes = await client.query(
        "INSERT INTO ligne (ville_depart, ville_arrivee, statut_ligne) VALUES ($1, $2, $3) RETURNING num_ligne",
        [String(ville_depart).trim(), String(ville_arrivee).trim(), statut_ligne]
    );
    const num_ligne = lineRes.rows[0].num_ligne;

    for (let h of horaires) {
        await client.query("INSERT INTO horaire_ligne (num_ligne, heure_depart) VALUES ($1, $2)", [num_ligne, h]);
    }

    const includeDuration = await hasDureeMinutesColumn(client);
    for (let st of stations) {
        if (st.arret) {
            await insertStation(client, num_ligne, st, includeDuration);
        }
    }

    return num_ligne;
};

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
    const depart = normalizeCity(ville_depart);
    const arrivee = normalizeCity(ville_arrivee);
    const cleanedHoraires = [...new Set((horaires || []).filter(Boolean))];
    const client = await db.connect();

    if (!depart || !arrivee) {
        client.release();
        return res.status(400).json({ message: "Le départ et l'arrivée sont obligatoires." });
    }

    try {
        await client.query('BEGIN');

        const existingDirection = await lineExists(client, ville_depart, ville_arrivee);

        if (existingDirection) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: "Cette ligne existe déjà. Modifiez la ligne existante au lieu d'en créer une autre." });
        }

        const num_ligne = await insertLineWithDetails(client, {
            ville_depart,
            ville_arrivee,
            statut_ligne,
            horaires: cleanedHoraires,
            stations: stations || []
        });

        let retour_ligne = null;
        const existingReverse = await lineExists(client, ville_arrivee, ville_depart);
        if (!existingReverse) {
            retour_ligne = await insertLineWithDetails(client, {
                ville_depart: ville_arrivee,
                ville_arrivee: ville_depart,
                statut_ligne,
                horaires: cleanedHoraires,
                stations: buildReverseStations(stations || [])
            });
        }

        await client.query('COMMIT');
        res.status(201).json({ message: "Ligne créée avec succès", num_ligne, retour_ligne });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: error.message });
    } finally {
        client.release();
    }
};

// 3. Mettre à jour (Update)
exports.updateLine = async (req, res) => {
    const { id } = req.params;
    const { ville_depart, ville_arrivee, statut_ligne, stations, horaires } = req.body;
    const depart = normalizeCity(ville_depart);
    const arrivee = normalizeCity(ville_arrivee);
    const cleanedHoraires = [...new Set((horaires || []).filter(Boolean))];

    if (!depart || !arrivee) {
        return res.status(400).json({ message: "Le départ et l'arrivée sont obligatoires." });
    }

    try {
        const duplicate = await db.query(
            `SELECT num_ligne
             FROM ligne
             WHERE LOWER(TRIM(ville_depart)) = $1
               AND LOWER(TRIM(ville_arrivee)) = $2
               AND num_ligne != $3
             LIMIT 1`,
            [depart, arrivee, id]
        );

        if (duplicate.rows.length > 0) {
            return res.status(409).json({ message: "Une autre ligne avec ce départ et cette arrivée existe déjà." });
        }

        await db.query(
            "UPDATE ligne SET ville_depart=$1, ville_arrivee=$2, statut_ligne=$3 WHERE num_ligne=$4",
            [String(ville_depart).trim(), String(ville_arrivee).trim(), statut_ligne, id]
        );

        // Update horaires
        await db.query("DELETE FROM horaire_ligne WHERE num_ligne = $1", [id]);
        if (cleanedHoraires.length > 0) {
            for (let h of cleanedHoraires) {
                await db.query("INSERT INTO horaire_ligne (num_ligne, heure_depart) VALUES ($1, $2)", [id, h]);
            }
        }

        // Update stations
        await db.query("DELETE FROM trajet WHERE num_ligne = $1", [id]);
        const includeDuration = await hasDureeMinutesColumn(db);
        if (stations && stations.length > 0) {
            for (let st of stations) {
                if (st.arret) {
                    await insertStation(db, id, st, includeDuration);
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



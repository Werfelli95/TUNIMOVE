const db = require('../config/db');

exports.getBuses = async (req, res) => {
    try {
        const query = `
            SELECT b.id_bus, b.numero_bus, b.capacite, b.etat, b.num_ligne, b.id_receveur,
                   b.date_debut_affectation, b.date_fin_affectation, b.image_url,
                   b.horaire_affecte,
                   l.ville_depart, l.ville_arrivee 
            FROM bus b 
            LEFT JOIN ligne l ON b.num_ligne = l.num_ligne 
            ORDER BY b.numero_bus ASC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getBuses:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération de la flotte' });
    }
};


// Ajouter un nouveau bus
exports.createBus = async (req, res) => {
    try {
        const { numero_bus, capacite, etat, num_ligne, horaire_affecte } = req.body;
        const checkBus = await db.query('SELECT * FROM bus WHERE numero_bus = $1', [numero_bus]);
        if (checkBus.rows.length > 0) {
            return res.status(400).json({ message: "Ce numéro de bus existe déjà." });
        }

        if (num_ligne && horaire_affecte) {
            const checkHoraire = await db.query(
                'SELECT numero_bus FROM bus WHERE num_ligne = $1 AND horaire_affecte = $2',
                [num_ligne, horaire_affecte]
            );
            if (checkHoraire.rows.length > 0) {
                return res.status(400).json({ 
                    message: `L'horaire ${horaire_affecte} sur la ligne ${num_ligne} est déjà affecté au bus ${checkHoraire.rows[0].numero_bus}.` 
                });
            }
        }
        const image_url = req.file ? req.file.path.replace(/\\/g, '/') : null;

        const result = await db.query(
            'INSERT INTO bus (numero_bus, capacite, etat, num_ligne, horaire_affecte, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [numero_bus, capacite, etat, num_ligne || null, horaire_affecte || null, image_url]
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
        const { numero_bus, capacite, etat, num_ligne, horaire_affecte } = req.body;

        if (num_ligne && horaire_affecte) {
            const checkHoraire = await db.query(
                'SELECT numero_bus FROM bus WHERE num_ligne = $1 AND horaire_affecte = $2 AND id_bus != $3',
                [num_ligne, horaire_affecte, id]
            );
            if (checkHoraire.rows.length > 0) {
                return res.status(400).json({ 
                    message: `L'horaire ${horaire_affecte} sur la ligne ${num_ligne} est déjà affecté au bus ${checkHoraire.rows[0].numero_bus}.` 
                });
            }
        }

        let image_url = req.body.image_url; // Conserver l'ancienne si pas de nouveau fichier
        if (req.file) {
            image_url = req.file.path.replace(/\\/g, '/');
        }

        const result = await db.query(
            'UPDATE bus SET numero_bus = $1, capacite = $2, etat = $3, num_ligne = $4, horaire_affecte = $5, image_url = $6 WHERE id_bus = $7 RETURNING *',
            [numero_bus, capacite, etat, num_ligne || null, horaire_affecte || null, image_url, id]
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



const db = require('../config/db');

exports.getTarifications = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM type_tarification ORDER BY id_type_tarification ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des tarifications' });
    }
};

exports.getBagages = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM type_bagage ORDER BY id_type_bagage ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des bagages' });
    }
};

// Toggle, Create, Update pour dashboard admin
exports.updateTarification = async (req, res) => {
    const { id } = req.params;
    const { code, libelle, categorie, mode_calcul, valeur } = req.body;
    try {
        await db.query(
            'UPDATE type_tarification SET code=$1, libelle=$2, categorie=$3, mode_calcul=$4, valeur=$5 WHERE id_type_tarification=$6',
            [code, libelle, categorie, mode_calcul, valeur, id]
        );
        res.json({ message: 'Tarification mise à jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur modification tarification' });
    }
};

exports.addTarification = async (req, res) => {
    const { code, libelle, categorie, mode_calcul, valeur } = req.body;
    try {
        await db.query(
            'INSERT INTO type_tarification (code, libelle, categorie, mode_calcul, valeur) VALUES ($1, $2, $3, $4, $5)',
            [code, libelle, categorie, mode_calcul, valeur]
        );
        res.status(201).json({ message: 'Tarification ajoutée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur ajout tarification' });
    }
};

exports.deleteTarification = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'DELETE FROM type_tarification WHERE id_type_tarification = $1 RETURNING id_type_tarification',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tarification introuvable' });
        }

        res.json({ message: 'Tarification supprimée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Impossible de supprimer cette tarification. Désactivez-la si elle est déjà utilisée dans des ventes.' });
    }
};

exports.updateBagage = async (req, res) => {
    const { id } = req.params;
    const { code, libelle, prix } = req.body;
    try {
        await db.query(
            'UPDATE type_bagage SET code=$1, libelle=$2, prix=$3 WHERE id_type_bagage=$4',
            [code, libelle, prix, id]
        );
        res.json({ message: 'Bagage mis à jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur modification bagage' });
    }
};

exports.addBagage = async (req, res) => {
    const { code, libelle, prix } = req.body;
    try {
        await db.query(
            'INSERT INTO type_bagage (code, libelle, prix) VALUES ($1, $2, $3)',
            [code, libelle, prix]
        );
        res.status(201).json({ message: 'Bagage ajouté' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur ajout bagage' });
    }
};

exports.deleteBagage = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'DELETE FROM type_bagage WHERE id_type_bagage = $1 RETURNING id_type_bagage',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Supplément introuvable' });
        }

        res.json({ message: 'Supplément supprimé' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Impossible de supprimer ce supplément. Désactivez-le s’il est déjà utilisé dans des ventes.' });
    }
};

exports.toggleTarification = async (req, res) => {
    const { id } = req.params;
    const { actif } = req.body;
    try {
        await db.query('UPDATE type_tarification SET actif = $1 WHERE id_type_tarification = $2', [actif, id]);
        res.json({ message: 'Statut modifié' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur modification statut' });
    }
};

exports.toggleBagage = async (req, res) => {
    const { id } = req.params;
    const { actif } = req.body;
    try {
        await db.query('UPDATE type_bagage SET actif = $1 WHERE id_type_bagage = $2', [actif, id]);
        res.json({ message: 'Statut modifié' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur modification statut' });
    }
};

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

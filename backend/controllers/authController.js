const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.loginAdmin = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Note: I'm using 'matricule' to search for the admin if email is not in schema, 
        // but I'll update the logic to support an 'email' field as requested for login.
        const result = await db.query('SELECT * FROM utilisateur WHERE (email = $1 OR matricule = $1) AND role = \'ADMIN\'', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        const user = result.rows[0];
        if (password !== user.mot_de_passe) {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }
        const token = jwt.sign({ id: user.id_utilisateur, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id_utilisateur, nom: user.nom, prenom: user.prenom, role: 'ADMIN', image_url: user.image_url } });

    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.loginAgent = async (req, res) => {
    const { matricule, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM utilisateur WHERE matricule = $1 AND role = \'AGENT\'', [matricule]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Matricule invalide' });
        }
        const user = result.rows[0];
        if (password !== user.mot_de_passe) {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }
        if (user.est_bloque) {
            return res.status(403).json({ message: "Votre compte a été suspendu par un administrateur." });
        }

        const token = jwt.sign({ id: user.id_utilisateur, role: 'AGENT' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id_utilisateur, matricule: user.matricule, nom: user.nom, prenom: user.prenom, role: 'AGENT', image_url: user.image_url } });

    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.loginReceveur = async (req, res) => {
    const { matricule, password } = req.body;
    try {
        const result = await db.query("SELECT * FROM utilisateur WHERE matricule = $1 AND LOWER(role) = 'receveur'", [matricule]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Matricule invalide ou rôle non autorisé' });
        }
        const user = result.rows[0];
        if (password !== user.mot_de_passe) {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }
        if (user.est_bloque) {
            return res.status(403).json({ message: "Votre compte a été suspendu." });
        }

        // Fetch assignment (bus and line)
        const affectationResult = await db.query(`
            SELECT b.numero_bus, l.num_ligne, l.ville_depart, l.ville_arrivee
            FROM bus b
            LEFT JOIN ligne l ON b.num_ligne = l.num_ligne
            WHERE b.id_receveur = $1
            LIMIT 1
        `, [user.id_utilisateur]);

        const affectation = affectationResult.rows.length > 0 ? affectationResult.rows[0] : null;

        const token = jwt.sign({ id: user.id_utilisateur, role: 'RECEVEUR' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ 
            token, 
            user: { 
                id: user.id_utilisateur, 
                matricule: user.matricule, 
                nom: user.nom, 
                prenom: user.prenom, 
                role: 'RECEVEUR' 
            },
            affectation
        });
    } catch (err) {
        console.error("Erreur loginReceveur:", err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
exports.loginControleur = async (req, res) => {
    const { matricule, password } = req.body;
    try {
        const result = await db.query(
            "SELECT * FROM utilisateur WHERE matricule = $1 AND LOWER(role) = 'controleur'",
            [matricule]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Matricule invalide ou rôle non autorisé' });
        }
        const user = result.rows[0];
        if (password !== user.mot_de_passe) {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }
        if (user.est_bloque) {
            return res.status(403).json({ message: 'Votre compte a été suspendu.' });
        }

        // Fetch bus assignment for controleur
        let affectation = null;
        try {
            const affRes = await db.query(`
                SELECT b.numero_bus, l.num_ligne, l.ville_depart, l.ville_arrivee
                FROM bus b
                LEFT JOIN ligne l ON b.num_ligne = l.num_ligne
                WHERE b.id_controleur = $1
                LIMIT 1
            `, [user.id_utilisateur]);
            if (affRes.rows.length > 0) affectation = affRes.rows[0];
        } catch { /* column may not exist yet — ok */ }

        const token = jwt.sign(
            { id: user.id_utilisateur, role: 'CONTROLEUR' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id_utilisateur,
                matricule: user.matricule,
                nom: user.nom,
                prenom: user.prenom,
                role: 'CONTROLEUR'
            },
            affectation
        });
    } catch (err) {
        console.error('Erreur loginControleur:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const db = require('../config/db');

// Récupérer tous les utilisateurs
exports.getUsers = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id_utilisateur, nom, prenom, matricule, email, num_tel, role, est_bloque, image_url FROM utilisateur ORDER BY nom ASC'

        );

        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getUsers:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
    }
};
exports.getUserCount = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT COUNT(*) FROM utilisateur WHERE role != 'admin'"
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('Erreur getUserCount:', err);
        res.status(500).json({ message: 'Erreur lors du comptage des utilisateurs' });
    }
};
exports.createUser = async (req, res) => {
    try {
        const { nom, prenom, email, matricule, num_tel, role, mot_de_passe } = req.body;
        const emailCheck = await db.query('SELECT * FROM utilisateur WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: "Cet email est déjà utilisé par un autre utilisateur." });
        }

        const matriculeCheck = await db.query('SELECT * FROM utilisateur WHERE matricule = $1', [matricule]);
        if (matriculeCheck.rows.length > 0) {
            return res.status(400).json({ message: "Ce matricule est déjà attribué." });
        }

        const telCheck = await db.query('SELECT * FROM utilisateur WHERE num_tel = $1', [num_tel]);
        if (telCheck.rows.length > 0) {
            return res.status(400).json({ message: "Ce numéro de téléphone est déjà enregistré." });
        }

        const image_url = req.file ? req.file.path.replace(/\\/g, '/') : null;

        const newUserQuery = `
            INSERT INTO utilisateur (nom, prenom, email, matricule, num_tel, role, mot_de_passe, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;

        const values = [nom, prenom, email, matricule, num_tel, role, mot_de_passe, image_url];
        const result = await db.query(newUserQuery, values);


        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la création de l\'utilisateur.' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Empêcher la suppression d'un utilisateur introuvable
        const userCheck = await db.query('SELECT role FROM utilisateur WHERE id_utilisateur = $1', [userId]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }

        // Optionnel : Empêcher la suppression des administrateurs
        if (userCheck.rows[0].role === 'admin' || userCheck.rows[0].role === 'ADMIN') {
            // return res.status(403).json({ message: "Impossible de supprimer un administrateur." });
        }

        // Suppression de la base de données
        await db.query('DELETE FROM utilisateur WHERE id_utilisateur = $1', [userId]);

        res.status(200).json({ message: "Utilisateur supprimé avec succès." });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression." });
    }
};
exports.toggleBlockUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const userCheck = await db.query('SELECT role, est_bloque FROM utilisateur WHERE id_utilisateur = $1', [userId]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }

        if (userCheck.rows[0].role === 'ADMIN' || userCheck.rows[0].role === 'admin') {
            return res.status(403).json({ message: "Impossible de bloquer un administrateur." });
        }

        const result = await db.query(
            'UPDATE utilisateur SET est_bloque = NOT est_bloque WHERE id_utilisateur = $1 RETURNING id_utilisateur, nom, prenom, role, est_bloque',
            [userId]
        );

        res.status(200).json({
            message: result.rows[0].est_bloque ? "Utilisateur bloqué avec succès." : "Utilisateur débloqué avec succès.",
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur lors du blocage/déblocage de l\'utilisateur:', error);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
// Récupérer un utilisateur par son ID (pour le profil)
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'SELECT id_utilisateur, nom, prenom, matricule, email, num_tel, role, image_url FROM utilisateur WHERE id_utilisateur = $1',
            [id]
        );


        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erreur getUserById:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour un utilisateur (Profil)
/**
 * PATCH /api/users/:id/role
 * Change the role of a user (Admin only).
 * Blocked if user has an active service.
 */
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['ADMIN', 'RECEVEUR', 'AGENT', 'CONTROLEUR'];
        if (!role || !validRoles.includes(role.toUpperCase())) {
            return res.status(400).json({ message: `Rôle invalide. Valeurs acceptées : ${validRoles.join(', ')}` });
        }

        // Check user exists
        const userCheck = await db.query(
            'SELECT id_utilisateur, nom, prenom, role FROM utilisateur WHERE id_utilisateur = $1',
            [id]
        );
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        // Check for active service — wrapped in its own try/catch in case the column doesn't exist yet
        try {
            const activeService = await db.query(
                `SELECT id_service FROM service WHERE id_receveur = $1 AND statut = 'En cours' LIMIT 1`,
                [id]
            );
            if (activeService.rows.length > 0) {
                return res.status(409).json({
                    message: 'Impossible de changer le rôle : cet utilisateur a un service actif en cours.'
                });
            }
        } catch (svcErr) {
            // If the service table / column doesn't exist yet, log and continue
            console.warn('updateUserRole: service check skipped -', svcErr.message);
        }

        const result = await db.query(
            'UPDATE utilisateur SET role = $1 WHERE id_utilisateur = $2 RETURNING id_utilisateur, nom, prenom, role',
            [role.toUpperCase(), id]
        );

        res.json({ message: 'Rôle mis à jour avec succès.', user: result.rows[0] });
    } catch (error) {
        console.error('Erreur updateUserRole:', error);
        res.status(500).json({ message: 'Erreur serveur lors du changement de rôle.' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, email, num_tel, matricule, role } = req.body;
        let image_url = req.body.image_url;
        if (req.file) {
            image_url = req.file.path.replace(/\\/g, '/');
        }

        // Mise à jour de l'utilisateur
        const query = `
            UPDATE utilisateur 
            SET nom = $1, prenom = $2, email = $3, num_tel = $4, image_url = $5, matricule = $6, role = $7
            WHERE id_utilisateur = $8 
            RETURNING id_utilisateur, nom, prenom, email, num_tel, role, matricule, image_url;
        `;

        const result = await db.query(query, [nom, prenom, email, num_tel, image_url, matricule, role, id]);


        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }

        res.json({ message: "Profil mis à jour avec succès", user: result.rows[0] });
    } catch (error) {
        console.error('Erreur updateUser:', error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du profil" });
    }
};


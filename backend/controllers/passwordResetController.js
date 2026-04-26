const db = require('../config/db');
const transporter = require('../config/mailConfig');
const crypto = require('crypto');

// 1. Demande de réinitialisation (Côté Agent)
exports.requestReset = async (req, res) => {
    const { matricule, email, role } = req.body;
    try {
        // Vérifier si l'utilisateur existe avec ce matricule et cet email
        // On permet les rôles RECEVEUR, CONTROLEUR et AGENT (ou tout rôle non-admin par sécurité)
        const userResult = await db.query(
            "SELECT id_utilisateur FROM utilisateur WHERE matricule = $1 AND email = $2 AND (LOWER(role) = LOWER($3) OR LOWER(role) = 'agent')",
            [matricule, email, role || '']
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "Aucun utilisateur trouvé avec ces informations pour ce rôle." });
        }

        const userId = userResult.rows[0].id_utilisateur;

        // Vérifier s'il n'y a pas déjà une demande en attente
        const pendingCheck = await db.query(
            "SELECT * FROM demande_reinitialisation WHERE id_utilisateur = $1 AND statut = 'En attente'",
            [userId]
        );

        if (pendingCheck.rows.length > 0) {
            return res.status(400).json({ message: "Une demande est déjà en cours. Veuillez patienter." });
        }

        // Créer la demande
        await db.query(
            "INSERT INTO demande_reinitialisation (id_utilisateur, matricule, email) VALUES ($1, $2, $3)",
            [userId, matricule, email]
        );

        res.status(201).json({ message: "Votre demande a été envoyée à l'administrateur." });
    } catch (error) {
        console.error("Erreur requestReset:", error);
        res.status(500).json({ message: "Erreur lors de l'envoi de la demande." });
    }
};

// 2. Récupérer les statistiques (NOUVEAU)
exports.getResetStats = async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE statut = 'En attente') as pending,
                COUNT(*) FILTER (WHERE date_demande >= CURRENT_DATE) as total_today,
                COUNT(*) FILTER (WHERE statut = 'Traité' AND date_demande >= CURRENT_DATE) as treated_today
            FROM demande_reinitialisation
        `);
        res.json(stats.rows[0]);
    } catch (error) {
        console.error("Erreur getResetStats:", error);
        res.status(500).json({ message: "Erreur statistiques." });
    }
};

// 2. Récupérer les demandes en attente (Côté Admin)
exports.getPendingRequests = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT d.*, u.nom, u.prenom, u.role 
            FROM demande_reinitialisation d
            JOIN utilisateur u ON d.id_utilisateur = u.id_utilisateur
            WHERE d.statut = 'En attente'
            ORDER BY d.date_demande DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Erreur getPendingRequests:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des demandes." });
    }
};

// 3. Approuver la réinitialisation (Côté Admin)
exports.approveReset = async (req, res) => {
    const { id_demande } = req.params;
    try {
        // 1. Récupérer les détails de la demande
        const demandeRes = await db.query("SELECT * FROM demande_reinitialisation WHERE id = $1", [id_demande]);
        if (demandeRes.rows.length === 0) {
            return res.status(404).json({ message: "Demande introuvable." });
        }

        const demande = demandeRes.rows[0];

        // 2. Générer un mot de passe temporaire
        const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 caractères

        // 3. Mettre à jour le mot de passe de l'utilisateur
        // Note: Selon authController.js, les mots de passe sont actuellement en clair.
        // On pourra passer au hachage plus tard si l'utilisateur le demande.
        await db.query(
            "UPDATE utilisateur SET mot_de_passe = $1 WHERE id_utilisateur = $2",
            [tempPassword, demande.id_utilisateur]
        );

        // 4. Envoyer l'email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: demande.email,
            subject: 'Votre nouveau mot de passe - TuniMove',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4f46e5;">Réinitialisation de votre mot de passe</h2>
                    <p>Bonjour,</p>
                    <p>Votre demande de réinitialisation a été approuvée par l'administrateur.</p>
                    <p>Voici votre nouveau mot de passe temporaire :</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 20px; font-family: monospace; text-align: center; margin: 20px 0; color: #111; font-weight: bold;">
                        ${tempPassword}
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">Nous vous conseillons de le changer dès votre première connexion.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #9ca3af;">Il s'agit d'un e-mail automatique, merci de ne pas y répondre.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        // 5. Marquer la demande comme traitée
        await db.query("UPDATE demande_reinitialisation SET statut = 'Traité' WHERE id = $1", [id_demande]);

        res.json({ message: "Mot de passe réinitialisé et envoyé par e-mail avec succès." });
    } catch (error) {
        console.error("Erreur approveReset:", error);
        res.status(500).json({ message: "Erreur lors du traitement de la réinitialisation." });
    }
};

// 4. Optionnel : Supprimer ou Archiver une demande
exports.deleteRequest = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM demande_reinitialisation WHERE id = $1", [id]);
        res.json({ message: "Demande supprimée." });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur." });
    }
};

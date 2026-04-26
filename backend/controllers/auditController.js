const db = require('../config/db');

// Récupérer toutes les fiches de clôture avec les détails (Bus, Receveur, Tickets)
exports.getAuditRecords = async (req, res) => {
    try {
        const query = `
            SELECT 
                f.id_fiche,
                u.nom as receveur_nom,
                u.prenom as receveur_prenom,
                u.matricule as receveur_matricule,
                b.numero_bus,
                f.heure_cloture,
                f.total_collecte,
                f.statut,
                f.duree_minutes,
                f.motif_cloture,
                s.num_ligne,
                l.ville_depart,
                l.ville_arrivee,
                (SELECT COUNT(*) FROM ticket t WHERE t.id_service = f.id_service) as tickets_count
            FROM fiche_cloture_service f
            JOIN service s ON f.id_service = s.id_service
            JOIN bus b ON s.id_bus = b.id_bus
            LEFT JOIN utilisateur u ON COALESCE(f.id_responsable_cloture, s.id_receveur, b.id_receveur) = u.id_utilisateur
            LEFT JOIN ligne l ON s.num_ligne = l.num_ligne
            ORDER BY f.heure_cloture DESC;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getAuditRecords:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des audits' });
    }
};

// Valider ou Rejeter une fiche
exports.updateAuditStatus = async (req, res) => {
    const { id } = req.params;
    const { statut } = req.body; // 'Validé' ou 'Rejeté'

    try {
        const result = await db.query(
            'UPDATE fiche_cloture_service SET statut = $1 WHERE id_fiche = $2 RETURNING *',
            [statut, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Fiche introuvable' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
};

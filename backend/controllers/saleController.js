const db = require('../config/db');

// Récupérer tout l'historique des ventes avec les détails de la ligne
exports.getSalesHistory = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || 'CURRENT_DATE';

        const query = `
            SELECT 
                'T-' || t.id_ticket as id,
                'Ticket' as type,
                t.montant_total as prix,
                t.date_emission as date_tri,
                l.ville_depart,
                l.ville_arrivee,
                (t.arret_depart || ' → ' || t.arret_arrivee) as trajet
            FROM ticket t
            JOIN service s ON t.id_service = s.id_service
            JOIN ligne l ON s.num_ligne = l.num_ligne
            WHERE t.date_emission::date = ${targetDate === 'CURRENT_DATE' ? 'CURRENT_DATE' : '$1'}
            
            UNION ALL
            
            SELECT 
                'R-' || r.id_reservation as id,
                'Réservation' as type,
                r.montant_total as prix,
                r.date_reservation as date_tri,
                l.ville_depart,
                l.ville_arrivee,
                (r.arret_depart || ' → ' || r.arret_arrivee) as trajet
            FROM reservation r
            JOIN service s ON r.id_service = s.id_service
            JOIN ligne l ON s.num_ligne = l.num_ligne
            WHERE r.date_reservation::date = ${targetDate === 'CURRENT_DATE' ? 'CURRENT_DATE' : '$1'}
            
            ORDER BY date_tri DESC;
        `;

        const params = targetDate === 'CURRENT_DATE' ? [] : [targetDate];
        const result = await db.query(query, params);

        const formattedData = result.rows.map(item => ({
            id: item.id,
            type: item.type,
            ligne: `${item.ville_depart} - ${item.ville_arrivee}`,
            trajet: item.trajet,
            date: new Date(item.date_tri).toLocaleString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }),
            prix: `${parseFloat(item.prix).toFixed(3)} TND`
        }));

        res.json(formattedData);
    } catch (err) {
        console.error('Erreur getSalesHistory:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération de l’historique' });
    }
};

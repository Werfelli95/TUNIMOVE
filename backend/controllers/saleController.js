const db = require('../config/db');

// Récupérer tout l'historique des ventes avec les détails de la ligne
exports.getSalesHistory = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id_ticket,
                t.qr_code,
                t.montant_total as prix,
                t.date_emission,
                l.ville_depart,
                l.ville_arrivee,
                -- Pour le trajet, on affiche Ville Départ -> Ville Arrivée de la ligne par défaut
                -- Si vous avez des arrêts spécifiques par ticket, on pourra l'adapter
                (l.ville_depart || ' → ' || l.ville_arrivee) as trajet
            FROM ticket t
            JOIN service s ON t.id_service = s.id_service
            LEFT JOIN ligne l ON s.num_ligne = l.num_ligne
            ORDER BY t.date_emission DESC;
        `;
        const result = await db.query(query);

        // Formater l'ID pour qu'il ressemble à T001, T002...
        const formattedSales = result.rows.map(sale => ({
            id: 'T' + String(sale.id_ticket).padStart(3, '0'),
            ligne: `${sale.ville_depart} - ${sale.ville_arrivee}`,
            trajet: sale.trajet,
            date: new Date(sale.date_emission).toLocaleString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }),
            prix: `${parseFloat(sale.prix).toFixed(3)} TND`
        }));

        res.json(formattedSales);
    } catch (err) {
        console.error('Erreur getSalesHistory:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des ventes' });
    }
};

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
                COALESCE(l.ville_depart, 'Inconnu') as ville_depart,
                COALESCE(l.ville_arrivee, 'Inconnu') as ville_arrivee,
                (COALESCE(l.ville_depart, 'N/A') || ' → ' || COALESCE(l.ville_arrivee, 'N/A')) as trajet
            FROM ticket t
            LEFT JOIN service s ON t.id_service = s.id_service
            LEFT JOIN ligne l ON COALESCE(s.num_ligne, t.num_ligne) = l.num_ligne
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
            isoDate: sale.date_emission,
            prix: `${parseFloat(sale.prix).toFixed(3)} TND`
        }));

        res.json(formattedSales);
    } catch (err) {
        console.error('Erreur getSalesHistory:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des ventes' });
    }
};

exports.sellTicket = async (req, res) => {
    const { 
        num_ligne, 
        bus, 
        date_voyage, 
        heure, 
        siege, 
        prix, 
        arret_depart, 
        arret_arrivee,
        agent_id,
        type_tarif
    } = req.body;

    try {
        // 1. Tenter de trouver un service correspondant pour lier le ticket
        const serviceLookup = await db.query(
            "SELECT id_service FROM service WHERE num_ligne = $1 AND date_service = $2 AND id_bus = (SELECT id_bus FROM bus WHERE numero_bus = $3 LIMIT 1) LIMIT 1",
            [num_ligne, date_voyage, bus]
        );
        const id_service = serviceLookup.rows.length > 0 ? serviceLookup.rows[0].id_service : null;

        const code_ticket = 'TKT' + Math.floor(Math.random() * 1000000);
        const qr_code = code_ticket; // Utiliser le code ticket comme QR code unique

        const query = `
            INSERT INTO ticket (
                num_ligne, id_bus, date_voyage, heure_depart, siege, montant_total,
                station_depart, station_arrivee, id_agent, type_tarif, date_emission, 
                code_ticket, qr_code, id_service
            ) VALUES (
                $1, 
                (SELECT id_bus FROM bus WHERE numero_bus = $2 LIMIT 1), 
                $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 
                $11, $12, $13
            )
            RETURNING id_ticket
        `;
        
        await db.query(query, [
            num_ligne, 
            String(bus), 
            date_voyage, 
            heure, 
            siege, 
            prix, 
            arret_depart, 
            arret_arrivee, 
            agent_id || null, 
            type_tarif, 
            code_ticket,
            qr_code,
            id_service
        ]);
        
        res.status(201).json({ message: "Billet vendu et enregistré avec succès" });
    } catch (err) {
        console.error("Erreur lors de la vente du ticket :", err);
        res.status(500).json({ message: "Erreur lors de la vente : " + err.message });
    }
};

exports.getOccupiedSeats = async (req, res) => {
    const { num_ligne, date, heure } = req.query;
    try {
        const query = `
            SELECT siege FROM ticket 
            WHERE num_ligne = $1 AND date_voyage = $2 AND heure_depart = $3
        `;
        const result = await db.query(query, [num_ligne, date, heure]);
        const occupied = result.rows.map(r => r.siege);
        res.json(occupied);
    } catch (err) {
        console.error("Erreur occupied seats :", err);
        res.status(500).json({ message: "Erreur récupération sièges" });
    }
};

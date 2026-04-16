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

// Récupérer les statistiques de revenus pour une période donnée (semaine ou mois)
exports.getRevenueStats = async (req, res) => {
    const { period } = req.query;
    const daysCount = period === 'month' ? 29 : 6;

    try {
        const query = `
            SELECT 
                d.day::date as full_date,
                CASE 
                    WHEN EXTRACT(DOW FROM d.day) = 0 THEN 'Dim'
                    WHEN EXTRACT(DOW FROM d.day) = 1 THEN 'Lun'
                    WHEN EXTRACT(DOW FROM d.day) = 2 THEN 'Mar'
                    WHEN EXTRACT(DOW FROM d.day) = 3 THEN 'Mer'
                    WHEN EXTRACT(DOW FROM d.day) = 4 THEN 'Jeu'
                    WHEN EXTRACT(DOW FROM d.day) = 5 THEN 'Ven'
                    WHEN EXTRACT(DOW FROM d.day) = 6 THEN 'Sam'
                END as name,
                COALESCE(SUM(t.montant_total), 0) as value
            FROM generate_series(CURRENT_DATE - INTERVAL '${daysCount} days', CURRENT_DATE, '1 day'::interval) as d(day)
            LEFT JOIN ticket t ON date_trunc('day', t.date_emission) = date_trunc('day', d.day)
            GROUP BY d.day
            ORDER BY d.day ASC;
        `;
        const result = await db.query(query);

        const formattedData = result.rows.map(row => ({
            full_date: new Date(row.full_date).toLocaleDateString('fr-FR'),
            name: row.name,
            value: parseFloat(row.value)
        }));

        res.json(formattedData);
    } catch (err) {
        console.error('Erreur getRevenueStats:', err);
        res.status(500).json({ message: 'Erreur stats revenus' });
    }
};

// Récupérer la répartition des passagers par type de tarif
exports.getPassengerStats = async (req, res) => {
    try {
        const query = `
            SELECT 
                type_tarif as name,
                COUNT(*) as value
            FROM ticket
            GROUP BY type_tarif;
        `;
        const result = await db.query(query);

        // Formater pour correspondre au format attendu par le frontend (avec des couleurs par défaut)
        const colors = {
            'Normal': '#6366f1',
            'Étudiant': '#818cf8',
            'Militaire': '#c7d2fe'
        };

        const stats = result.rows.map(row => ({
            name: row.name,
            value: parseInt(row.value),
            color: colors[row.name] || '#94a3b8'
        }));

        res.json(stats);
    } catch (err) {
        console.error('Erreur getPassengerStats:', err);
        res.status(500).json({ message: 'Erreur stats passagers' });
    }
};

// Récupérer les ventes du jour pour un agent spécifique
exports.getAgentDailySales = async (req, res) => {
    const { agentId } = req.params;
    try {
        const query = `
            SELECT 
                t.id_ticket,
                t.num_ligne,
                t.id_bus,
                b.numero_bus,
                t.date_voyage,
                t.heure_depart as heure,
                t.siege,
                t.montant_total as prix,
                t.station_depart as arret_depart,
                t.station_arrivee as arret_arrivee,
                t.type_tarif,
                t.date_emission,
                t.qr_code,
                l.ville_depart as ligne_depart,
                l.ville_arrivee as ligne_arrivee
            FROM ticket t
            LEFT JOIN bus b ON t.id_bus = b.id_bus
            LEFT JOIN ligne l ON t.num_ligne = l.num_ligne
            WHERE t.id_agent = $1 
            AND t.date_emission::date = NOW()::date
            ORDER BY t.date_emission DESC
        `;
        const result = await db.query(query, [agentId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getAgentDailySales:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des ventes du jour' });
    }
};
// Récupérer les statistiques avancées pour le dashboard (Ligne top, occupation, heure pointe)
exports.getAdvancedStats = async (req, res) => {
    try {
        console.log("Calcul des stats avancées...");
        
        // 1. Ligne la plus fréquentée (Géré avec CAST pour éviter les erreurs de type)
        const topLineQuery = `
            SELECT 
                CAST(l.num_ligne AS VARCHAR) as num_ligne, 
                l.ville_depart, 
                l.ville_arrivee, 
                COUNT(t.id_ticket) as ticket_count
            FROM ticket t
            JOIN ligne l ON CAST(t.num_ligne AS VARCHAR) = CAST(l.num_ligne AS VARCHAR)
            GROUP BY l.num_ligne, l.ville_depart, l.ville_arrivee
            ORDER BY ticket_count DESC LIMIT 1
        `;
        const topLineResult = await db.query(topLineQuery);
        const topLine = topLineResult.rows[0];

        // 2. Taux de remplissage moyen
        const occupancyQuery = `
            SELECT AVG(occ_rate) as avg_rate FROM (
                SELECT 
                    COUNT(t.id_ticket)::float / NULLIF(b.capacite, 0) * 100 as occ_rate
                FROM ticket t
                JOIN bus b ON t.id_bus = b.id_bus
                GROUP BY t.id_bus, t.num_ligne, t.date_voyage, t.heure_depart, b.capacite
            ) as subquery
        `;
        const occupancyResult = await db.query(occupancyQuery);
        const avgOccupancy = occupancyResult.rows[0]?.avg_rate || 0;

        // 3. Horaire le plus demandé
        const peakHourQuery = `
            SELECT 
                heure_depart, 
                COUNT(*) as count
            FROM ticket
            GROUP BY heure_depart
            ORDER BY count DESC LIMIT 1
        `;
        const peakHourResult = await db.query(peakHourQuery);
        const peakHour = peakHourResult.rows[0];

        const stats = {
            topLine: topLine ? {
                name: `Ligne ${topLine.num_ligne}`,
                route: `${topLine.ville_depart} → ${topLine.ville_arrivee}`,
                count: parseInt(topLine.ticket_count),
                distance: 0
            } : null,
            avgOccupancy: Math.round(parseFloat(avgOccupancy)),
            peakHour: peakHour ? {
                time: String(peakHour.heure_depart).substring(0, 5),
                count: parseInt(peakHour.count)
            } : null
        };

        console.log("Stats calculées avec succès:", stats);
        res.json(stats);
    } catch (err) {
        console.error('Erreur CRITIQUE getAdvancedStats:', err);
        res.status(500).json({ message: 'Erreur technique lors du calcul des statistiques' });
    }
};

// Scanner et valider un ticket
exports.scanTicket = async (req, res) => {
    const { qr_code } = req.body;
    if (!qr_code) {
        return res.status(400).json({ message: "Code QR manquant" });
    }
    
    try {
        // Rechercher le ticket et extraire les informations pertinentes
        const checkQuery = `
            SELECT id_ticket, code_ticket, qr_code, est_scanne, date_scan, date_voyage, type_tarif 
            FROM ticket 
            WHERE qr_code = $1 OR code_ticket = $1
            LIMIT 1
        `;
        const result = await db.query(checkQuery, [qr_code]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Ticket introuvable ou invalide" });
        }

        const ticket = result.rows[0];

        if (ticket.est_scanne) {
            return res.status(409).json({ 
                message: "Ticket déjà scanné",
                date_scan: ticket.date_scan 
            });
        }

        // Marquer comme scanné
        const updateQuery = `
            UPDATE ticket 
            SET est_scanne = TRUE, date_scan = NOW() 
            WHERE id_ticket = $1
            RETURNING id_ticket, est_scanne, date_scan
        `;
        const updated = await db.query(updateQuery, [ticket.id_ticket]);

        res.status(200).json({ 
            message: "Ticket validé avec succès", 
            ticket: updated.rows[0] 
        });

    } catch (err) {
        console.error('Erreur scanTicket:', err);
        res.status(500).json({ message: 'Erreur lors de la vérification du ticket' });
    }
};

// Manifeste du jour pour un bus donné (utilisé par le Receveur mobile)
exports.getManifeste = async (req, res) => {
    const { numero_bus } = req.params;
    try {
        const query = `
            SELECT 
                t.id_ticket,
                t.siege,
                t.type_tarif,
                t.montant_total,
                t.heure_depart,
                t.station_depart,
                t.station_arrivee,
                t.date_emission,
                t.qr_code
            FROM ticket t
            JOIN bus b ON t.id_bus = b.id_bus
            WHERE b.numero_bus = $1
              AND t.date_emission::date = NOW()::date
            ORDER BY t.date_emission DESC
        `;
        const result = await db.query(query, [numero_bus]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getManifeste:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération du manifeste' });
    }
};

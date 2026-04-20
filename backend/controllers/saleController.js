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
        type_tarif,
        id_type_tarification,
        id_type_bagage,
        prix_bagage
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
                code_ticket, qr_code, id_service,
                id_type_tarification, id_type_bagage, prix_bagage
            ) VALUES (
                $1, 
                (SELECT id_bus FROM bus WHERE numero_bus = $2 LIMIT 1), 
                $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 
                $11, $12, $13,
                $14, $15, $16
            )
            RETURNING id_ticket
        `;

        const ticketData = await db.query(query, [
            num_ligne,
            String(bus),
            date_voyage,
            heure,
            siege,
            prix,
            arret_depart,
            arret_arrivee,
            agent_id || null,
            type_tarif, // Libellé existant pour la compatibilité
            code_ticket,
            qr_code,
            id_service,
            id_type_tarification || null,
            id_type_bagage || null,
            prix_bagage || 0
        ]);

        res.status(201).json({ 
            message: "Billet vendu et enregistré avec succès",
            id_ticket: ticketData.rows[0].id_ticket,
            code_ticket: code_ticket
        });
    } catch (err) {
        console.error("Erreur lors de la vente du ticket :", err);
        res.status(500).json({ message: "Erreur lors de la vente : " + err.message });
    }
};

exports.getOccupiedSeats = async (req, res) => {
    const { num_ligne, date, heure, depart, arrivee } = req.query;
    try {
        const ligneRes = await db.query("SELECT ville_depart, ville_arrivee FROM ligne WHERE num_ligne = $1", [num_ligne]);
        if (ligneRes.rows.length === 0) return res.json([]);
        const ligne = ligneRes.rows[0];
        
        const stationsRes = await db.query("SELECT arret, distance_km FROM trajet WHERE num_ligne = $1 ORDER BY distance_km", [num_ligne]);
        let stationsList = stationsRes.rows;
        
        if (!stationsList.some(s => s.arret.toLowerCase() === ligne.ville_depart.toLowerCase())) {
            stationsList.unshift({ arret: ligne.ville_depart, distance_km: 0 });
        }
        if (!stationsList.some(s => s.arret.toLowerCase() === ligne.ville_arrivee.toLowerCase())) {
            stationsList.push({ arret: ligne.ville_arrivee, distance_km: 9999 });
        }
        
        const getDist = (arr) => {
            const st = stationsList.find(s => s.arret.toLowerCase() === arr.toLowerCase());
            return st ? st.distance_km : null;
        };

        const reqStart = getDist(depart || '');
        const reqEnd = getDist(arrivee || '');

        const query = `
            SELECT siege, station_depart, station_arrivee FROM ticket 
            WHERE num_ligne = $1 AND date_voyage = $2 AND heure_depart = $3
        `;
        const result = await db.query(query, [num_ligne, date, heure]);
        
        const occupied = [];
        
        result.rows.forEach(t => {
            if (!depart || !arrivee) {
                // If the client didn't specify the segment, consider it occupied to be safe
                occupied.push(t.siege);
            } else {
                const tStart = getDist(t.station_depart);
                const tEnd = getDist(t.station_arrivee);
                
                if (tStart !== null && tEnd !== null && reqStart !== null && reqEnd !== null) {
                    // Two segments overlap if: max(start1, start2) < min(end1, end2)
                    const overlap = Math.max(reqStart, tStart) < Math.min(reqEnd, tEnd);
                    if (overlap) {
                        occupied.push(t.siege);
                    }
                } else {
                    // Fallback
                    occupied.push(t.siege);
                }
            }
        });

        res.json([...new Set(occupied)]);
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
    // Supporter à la fois qr_code et code_ticket pour la compatibilité mobile
    const inputCode = req.body.qr_code || req.body.code_ticket;
    
    if (!inputCode) {
        return res.status(400).json({ message: "Code QR manquant" });
    }
    
    try {
        let uniqueId = inputCode;
        let searchParams = null;

        // Tenter de parser si c'est du JSON (format Web Guichet)
        if (typeof inputCode === 'string' && (inputCode.startsWith('{') || inputCode.startsWith('['))) {
            try {
                console.log("Tentative de parsing JSON du QR code...");
                const parsed = JSON.parse(inputCode);
                console.log("JSON parsé:", parsed);
                // Si on a l'ID ou le code spécifique dans le JSON
                if (parsed.code_ticket) uniqueId = parsed.code_ticket;
                else if (parsed.id_ticket) uniqueId = parsed.id_ticket;
                else {
                    // Sinon on utilisera les champs pour une recherche combinée
                    searchParams = parsed;
                }
            } catch (e) {
                console.log("Échec du parsing JSON, traitement comme code brut");
                // Pas du JSON valide, on traite comme un code brut
            }
        }

        // 1. Recherche du ticket avec jointures pour avoir tous les détails
        let query = `
            SELECT 
                t.*,
                b.numero_bus,
                l.ville_depart as ligne_depart,
                l.ville_arrivee as ligne_arrivee
            FROM ticket t
            LEFT JOIN bus b ON t.id_bus = b.id_bus
            LEFT JOIN ligne l ON t.num_ligne::text = l.num_ligne::text
            WHERE 1=1
        `;
        let params = [];

        if (searchParams) {
            // Recherche par critères (Ligne, Date, Heure, Siège) - Fallback pour les vieux tickets
            // On utilise CAST en TEXT pour être sûr de la comparaison avec les strings du JSON
            query += ` AND CAST(t.num_ligne AS TEXT) = $1 AND CAST(t.date_voyage AS TEXT) = $2 AND CAST(t.heure_depart AS TEXT) LIKE $3 AND t.siege = $4`;
            params = [String(searchParams.ligne), String(searchParams.date), String(searchParams.heure) + '%', String(searchParams.siege)];
        } else {
            // Recherche par identificateur unique
            query += ` AND (t.qr_code = $1 OR t.code_ticket = $1 OR CAST(t.id_ticket AS VARCHAR) = $1)`;
            params = [String(uniqueId)];
        }

        console.log("Exécution de la requête de recherche avec params:", params);
        const result = await db.query(query + " LIMIT 1", params);
        console.log("Nombre de tickets trouvés:", result.rows.length);

        if (result.rows.length === 0) {
            console.log("Aucun ticket trouvé pour ces critères");
            return res.status(404).json({ message: "Ticket introuvable ou invalide" });
        }

        const ticket = result.rows[0];
        console.log("Ticket trouvé, ID:", ticket.id_ticket);

        // Formatage de la réponse pour le mobile
        const ticketInfo = {
            id_ticket: ticket.id_ticket,
            code_ticket: ticket.code_ticket,
            siege: ticket.siege,
            type_tarif: ticket.type_tarif,
            montant_total: ticket.montant_total,
            station_depart: ticket.station_depart,
            station_arrivee: ticket.station_arrivee,
            heure_depart: ticket.heure_depart ? String(ticket.heure_depart).substring(0, 5) : '',
            date_voyage: ticket.date_voyage,
            date_emission: ticket.date_emission,
            date_scan: ticket.date_scan,
            est_scanne: ticket.est_scanne,
            num_ligne: ticket.num_ligne,
            numero_bus: ticket.numero_bus,
            trajet: `${ticket.station_depart} → ${ticket.station_arrivee}`
        };

        // 2. Vérification du statut
        console.log("Vérification du statut 'est_scanne':", ticket.est_scanne);
        if (ticket.est_scanne) {
            return res.status(409).json({ 
                message: "Ce ticket a déjà été validé",
                status: 'used',
                ticket: ticketInfo
            });
        }

        // Vérification de la date (Optionnel)
        const voyageDate = new Date(ticket.date_voyage);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (voyageDate < today) {
            return res.status(410).json({ 
                message: "Ce ticket est expiré (date passée)",
                status: 'expired',
                ticket: ticketInfo
            });
        }

        // 3. Marquage comme scanné
        const updateQuery = `
            UPDATE ticket 
            SET est_scanne = TRUE, date_scan = NOW() 
            WHERE id_ticket = $1
            RETURNING date_scan
        `;
        const updated = await db.query(updateQuery, [ticket.id_ticket]);
        ticketInfo.est_scanne = true;
        ticketInfo.date_scan = updated.rows[0].date_scan;

        res.status(200).json({ 
            message: "Ticket validé avec succès", 
            status: 'valid',
            ticket: ticketInfo 
        });

    } catch (err) {
        console.error('Erreur scanTicket CRITIQUE:', err);
        res.status(500).json({ 
            message: 'Erreur lors de la vérification du ticket',
            error: err.message,
            stack: err.stack
        });
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

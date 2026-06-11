const db = require('../config/db');

// Récupère la liste complète des tickets vendus pour l'affichage dans le tableau d'historique
exports.getSalesHistory = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id_ticket,
                t.qr_code,
                t.heure_depart,
                t.montant_total as prix,
                t.date_emission,
                t.station_depart,
                t.station_arrivee,
                COALESCE(l.ville_depart, 'Inconnu') as ville_depart,
                COALESCE(l.ville_arrivee, 'Inconnu') as ville_arrivee,
                (COALESCE(t.station_depart, 'N/A') || ' → ' || COALESCE(t.station_arrivee, 'N/A')) as trajet,
                t.type_ticket,
                t.date_voyage
            FROM ticket t
            LEFT JOIN service s ON t.id_service = s.id_service
            LEFT JOIN ligne l ON COALESCE(s.num_ligne, t.num_ligne) = l.num_ligne
            ORDER BY t.date_emission DESC;
        `;
        const result = await db.query(query);

        const formattedSales = result.rows.map(sale => ({
            id: 'T' + String(sale.id_ticket).padStart(3, '0'),
            ligne: `${sale.ville_depart} - ${sale.ville_arrivee}`,
            trajet: sale.trajet,
            horaire: new Date(sale.date_emission).toLocaleString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            date: new Date(sale.date_emission).toLocaleString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }),
            isoDate: sale.date_emission,
            prix: `${parseFloat(sale.prix).toFixed(3)} TND`,
            type: (sale.type_ticket === 'Directe' || sale.type_ticket === 'Vente Directe') ? 'Directe' : 
                  (sale.type_ticket === 'Réservations' || sale.type_ticket === 'Réservation') ? 'Réservations' :
                  (new Date(sale.date_voyage).toDateString() === new Date(sale.date_emission).toDateString() ? 'Directe' : 'Réservations')
        }));

        res.json(formattedSales);
    } catch (err) {
        console.error('Erreur getSalesHistory:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des ventes' });
    }
};

// Crée un nouveau ticket, génère son QR Code unique et l'enregistre en base de données
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
        prix_bagage,
        type_ticket,
        id_service: provided_id_service
    } = req.body;

    try {
        let id_service = provided_id_service;

        if (!id_service) {
            const serviceLookup = await db.query(
                "SELECT id_service FROM service WHERE num_ligne = $1 AND date_service = $2 AND id_bus = (SELECT id_bus FROM bus WHERE numero_bus = $3 LIMIT 1) AND statut = 'En cours' LIMIT 1",
                [num_ligne, date_voyage, bus]
            );
            id_service = serviceLookup.rows.length > 0 ? serviceLookup.rows[0].id_service : null;
        }

        const code_ticket = 'TKT' + Math.floor(Math.random() * 1000000);
        const qr_code = code_ticket; 

        const query = `
            INSERT INTO ticket (
                num_ligne, id_bus, date_voyage, heure_depart, siege, montant_total,
                station_depart, station_arrivee, id_agent, type_tarif, date_emission, 
                code_ticket, qr_code, id_service,
                id_type_tarification, id_type_bagage, prix_bagage,
                type_ticket
            ) VALUES (
                $1, 
                (SELECT id_bus FROM bus WHERE numero_bus = $2 LIMIT 1), 
                $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 
                $11, $12, $13,
                $14, $15, $16,
                $17
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
            type_tarif, 
            code_ticket,
            qr_code,
            id_service,
            id_type_tarification || null,
            id_type_bagage || null,
            prix_bagage || 0,
            type_ticket || 'Vente Directe'
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

// Identifie les places déjà occupées pour un trajet spécifique afin d'éviter le double placement
exports.getOccupiedSeats = async (req, res) => {
    const { num_ligne, date, heure, depart, arrivee } = req.query;
    try {
        const ligneRes = await db.query("SELECT ville_depart, ville_arrivee FROM ligne WHERE num_ligne = $1", [num_ligne]);
        if (ligneRes.rows.length === 0) return res.json([]);
        const ligne = ligneRes.rows[0];
        
        const stationsRes = await db.query("SELECT arret, distance_km FROM trajet WHERE num_ligne = $1 AND statut = 'Actif' ORDER BY distance_km", [num_ligne]);
        let stationsList = stationsRes.rows;
        
        if (!stationsList.some(s => s.arret.toLowerCase() === ligne.ville_depart.toLowerCase())) {
            stationsList.unshift({ arret: ligne.ville_depart, distance_km: 0 });
        }
        if (!stationsList.some(s => s.arret.toLowerCase() === ligne.ville_arrivee.toLowerCase())) {
            stationsList.push({ arret: ligne.ville_arrivee, distance_km: 9999 });
        }
        
        const getDist = (arr) => {
            if (!arr) return null;
            const st = stationsList.find(s => s.arret.toLowerCase() === arr.toLowerCase());
            return st ? parseFloat(st.distance_km) : null;
        };

        const reqStart = getDist(depart);
        const reqEnd = getDist(arrivee);

        let query;
        let params;
        if (heure) {
            query = `
                SELECT t.siege, t.station_depart, t.station_arrivee 
                FROM ticket t 
                WHERE t.num_ligne::text = $1
                  AND t.date_voyage::date = $2::date
                  AND t.heure_depart::text LIKE $3 || '%'
            `;
            params = [String(num_ligne), date, String(heure).substring(0, 5)];
        } else {
            query = `
                SELECT t.siege, t.station_depart, t.station_arrivee 
                FROM ticket t 
                WHERE t.num_ligne::text = $1
                  AND t.date_voyage::date = $2::date
            `;
            params = [String(num_ligne), date];
        }
        const result = await db.query(query, params);
        
        const occupied = [];
        
        result.rows.forEach(t => {
            if (!depart || !arrivee) {
                occupied.push(t.siege);
            } else {
                const tStart = getDist(t.station_depart);
                const tEnd = getDist(t.station_arrivee);
                
                if (tStart !== null && tEnd !== null && reqStart !== null && reqEnd !== null) {
                    const overlap = Math.max(reqStart, tStart) < Math.min(reqEnd, tEnd);
                    if (overlap) {
                        occupied.push(t.siege);
                    }
                } else {
                    occupied.push(t.siege);
                }
            }
        });

        res.json([...new Set(occupied)]);
    } catch (err) {
        console.error("Erreur occupied seats", err);
        res.status(500).json({ message: "Erreur recuperation sieges" });
    }
};

// Calcule les revenus generes sur une periode donnee pour alimenter les graphiques du Dashboard
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
        console.error('Erreur getRevenueStats', err);
        res.status(500).json({ message: 'Erreur stats revenus' });
    }
};

// Recupere la repartition des types de passagers pour les statistiques du Dashboard
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
        console.error('Erreur getPassengerStats', err);
        res.status(500).json({ message: 'Erreur stats passagers' });
    }
};

// Permet à un guichetier de consulter uniquement ses propres ventes de la journée en cours
exports.getAgentDailySales = async (req, res) => {
    const { agentId } = req.params;
    try {
        const checkClosed = await db.query(`
            SELECT id_fiche FROM fiche_cloture_service
            WHERE id_responsable_cloture = $1
              AND heure_cloture::date = CURRENT_DATE
              AND id_service IS NULL
        `, [agentId]);

        if (checkClosed.rows.length > 0) {
            return res.json([]);
        }

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
                l.ville_arrivee as ligne_arrivee,
                t.type_ticket
            FROM ticket t
            LEFT JOIN bus b ON t.id_bus = b.id_bus
            LEFT JOIN ligne l ON t.num_ligne = l.num_ligne
            WHERE t.id_agent = $1 
            AND t.date_emission::date = NOW()::date
            ORDER BY t.date_emission DESC
        `;
        const result = await db.query(query, [agentId]);
        
        const formattedSales = result.rows.map(t => ({
            ...t,
            type_ticket: (t.type_ticket === 'Directe' || t.type_ticket === 'Vente Directe') ? 'Directe' : 
                         (t.type_ticket === 'Réservations' || t.type_ticket === 'Réservation') ? 'Réservations' :
                         (new Date(t.date_voyage).toDateString() === new Date(t.date_emission).toDateString() ? 'Directe' : 'Réservations')
        }));
        
        res.json(formattedSales);
    } catch (err) {
        console.error('Erreur getAgentDailySales:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des ventes du jour' });
    }
};
// Calcule la ligne la plus performante, le taux d'occupation moyen et l'heure de pointe pour l'administration
exports.getAdvancedStats = async (req, res) => {
    try {
        let todayRevenue = 0;
        let todayTicketCount = 0;
        try {
            const todayStatsResult = await db.query(`
                SELECT 
                    COALESCE(SUM(montant_total), 0) as total,
                    COUNT(*) as count
                FROM ticket 
                WHERE date_emission >= CURRENT_DATE
            `);
            todayRevenue = parseFloat(todayStatsResult.rows[0].total || 0);
            todayTicketCount = parseInt(todayStatsResult.rows[0].count || 0);
        } catch (e) {
            console.error("Erreur calcul todayStats:", e);
        }

        let topLine = null;
        try {
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
            topLine = topLineResult.rows[0];
        } catch (e) { console.error("Erreur topLine:", e); }

        let avgOccupancy = 0;
        try {
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
            avgOccupancy = occupancyResult.rows[0]?.avg_rate || 0;
        } catch (e) { console.error("Erreur occupancy:", e); }

        let peakHour = null;
        try {
            const peakHourQuery = `
                SELECT 
                    heure_depart, 
                    COUNT(*) as count
                FROM ticket
                GROUP BY heure_depart
                ORDER BY count DESC LIMIT 1
            `;
            const peakHourResult = await db.query(peakHourQuery);
            peakHour = peakHourResult.rows[0];
        } catch (e) { console.error("Erreur peakHour:", e); }

        const stats = {
            topLine: topLine ? {
                name: `Ligne ${topLine.num_ligne}`,
                route: `${topLine.ville_depart} → ${topLine.ville_arrivee}`,
                count: parseInt(topLine.ticket_count),
                distance: 0
            } : null,
            avgOccupancy: Math.round(parseFloat(avgOccupancy || 0)),
            peakHour: peakHour ? {
                time: String(peakHour.heure_depart).substring(0, 5),
                count: parseInt(peakHour.count)
            } : null,
            todayRevenue: todayRevenue,
            todayTicketCount: todayTicketCount
        };

        res.json(stats);
    } catch (err) {
        console.error('Erreur CRITIQUE getAdvancedStats:', err);
        res.status(500).json({ message: 'Erreur technique lors du calcul des statistiques' });
    }
};

// Permet à un contrôleur de scanner et valider un ticket en vérifiant sa date et s'il a déjà été utilisé (date, doublons, etc.)
exports.scanTicket = async (req, res) => {
    const inputCode = req.body.qr_code || req.body.code_ticket;
    const { id_controleur } = req.body;
    
    if (!inputCode) {
        return res.status(400).json({ message: "Code QR manquant" });
    }
    
    try {
        let uniqueId = inputCode;
        let searchParams = null;

        if (typeof inputCode === 'string' && (inputCode.startsWith('{') || inputCode.startsWith('['))) {
            try {
                const parsed = JSON.parse(inputCode);
                if (parsed.code_ticket) uniqueId = parsed.code_ticket;
                else if (parsed.id_ticket) uniqueId = parsed.id_ticket;
                else {
                    searchParams = parsed;
                }
            } catch (e) {
            }
        }

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
            query += ` AND CAST(t.num_ligne AS TEXT) = $1 AND CAST(t.date_voyage AS TEXT) = $2 AND CAST(t.heure_depart AS TEXT) LIKE $3 AND t.siege = $4`;
            params = [String(searchParams.ligne), String(searchParams.date), String(searchParams.heure) + '%', String(searchParams.siege)];
        } else {
            query += ` AND (t.qr_code = $1 OR t.code_ticket = $1 OR CAST(t.id_ticket AS VARCHAR) = $1)`;
            params = [String(uniqueId)];
        }

        const result = await db.query(query + " LIMIT 1", params);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Ticket introuvable ou invalide" });
        }

        const ticket = result.rows[0];

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

        if (ticket.est_scanne) {
            return res.status(409).json({ 
                message: "Ce ticket a déjà été validé",
                status: 'used',
                ticket: ticketInfo
            });
        }

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

        const updateQuery = `
            UPDATE ticket 
            SET est_scanne = TRUE, date_scan = NOW(), id_controleur = $2
            WHERE id_ticket = $1
            RETURNING date_scan
        `;
        const updated = await db.query(updateQuery, [ticket.id_ticket, id_controleur || null]);
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

// Affiche au contrôleur la liste des tickets qu'il a verifies pendant sa journee de service
exports.getControleurDailyScans = async (req, res) => {
    const { controleurId } = req.params;
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
                t.date_scan,
                t.qr_code,
                l.ville_depart as ligne_depart,
                l.ville_arrivee as ligne_arrivee
            FROM ticket t
            LEFT JOIN bus b ON t.id_bus = b.id_bus
            LEFT JOIN ligne l ON t.num_ligne::text = l.num_ligne::text
            WHERE t.id_controleur = $1 
            AND t.date_scan::date = NOW()::date
            ORDER BY t.date_scan DESC
        `;
        const result = await db.query(query, [controleurId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getControleurDailyScans:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des scans du jour' });
    }
};

// Genere la liste de tous les passagers embarques pour un bus donne, utilise par le Receveur
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
              AND t.date_voyage::date = CURRENT_DATE
            ORDER BY t.date_emission DESC
        `;
        const result = await db.query(query, [numero_bus]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getManifeste:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération du manifeste' });
    }
};
// Affiche le taux de remplissage en temps réel des bus actuellement en service
exports.getBusOccupancy = async (req, res) => {
    try {
        const query = `
            SELECT 
                b.numero_bus, 
                b.capacite,
                l.ville_depart, 
                l.ville_arrivee,
                b.horaire_affecte,
                (SELECT COUNT(*) FROM ticket t 
                 WHERE t.id_bus = b.id_bus 
                 AND t.date_voyage::date = CURRENT_DATE) as tickets_vendus
            FROM bus b
            JOIN ligne l ON b.num_ligne = l.num_ligne
            WHERE b.etat = 'En service'
            ORDER BY b.horaire_affecte ASC
            LIMIT 5;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getBusOccupancy:', err);
        res.status(500).json({ message: 'Erreur stats occupation' });
    }
};
// Permet à l'agent de terminer sa journée et de remonter son bilan financier à la direction
exports.closeAgentService = async (req, res) => {
    const { agentId } = req.params;
    const { heure_connexion } = req.body;

    try {
        const checkExisting = await db.query(`
            SELECT id_fiche FROM fiche_cloture_service 
            WHERE id_responsable_cloture = $1 
            AND heure_cloture::date = CURRENT_DATE
            AND id_service IS NULL
        `, [agentId]);

        if (checkExisting.rows.length > 0) {
            return res.status(400).json({ message: "Le service pour aujourd'hui a déjà été clôturé." });
        }

        const stats = await db.query(`
            SELECT 
                COALESCE(SUM(montant_total), 0) as total,
                COUNT(*) as count
            FROM ticket 
            WHERE id_agent = $1 
            AND date_emission::date = CURRENT_DATE
        `, [agentId]);

        const totalRecette = parseFloat(stats.rows[0].total || 0);
        const ticketCount = parseInt(stats.rows[0].count || 0);

        let dureeMinutes = null;
        if (heure_connexion) {
            const start = new Date(heure_connexion);
            const end = new Date();
            dureeMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
        }

        const result = await db.query(`
            INSERT INTO fiche_cloture_service (
                id_responsable_cloture, 
                total_collecte, 
                heure_cloture, 
                heure_connexion,
                statut, 
                duree_minutes, 
                motif_cloture
            )
            VALUES ($1, $2, NOW(), $3, 'En attente', $4, 'Fin de service guichet')
            RETURNING id_fiche
        `, [agentId, totalRecette, heure_connexion || null, dureeMinutes]);

        res.status(201).json({
            message: "Service clôturé avec succès. Le rapport a été envoyé à l'administration.",
            id_fiche: result.rows[0].id_fiche,
            stats: {
                totalRecette,
                ticketCount,
                dureeMinutes
            }
        });

    } catch (err) {
        console.error('Erreur closeAgentService:', err);
        res.status(500).json({ message: 'Erreur lors de la clôture du service : ' + err.message });
    }
};

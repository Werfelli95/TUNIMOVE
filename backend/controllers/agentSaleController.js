const db = require('../config/db');
const crypto = require('crypto');

function normalizeReduction(value) {
    if (value === null || value === undefined) return 0;
    const n = Number(value);
    if (isNaN(n)) return 0;
    return n > 1 ? n / 100 : n;
}

function mapReductionColumn(type) {
    switch ((type || 'AUCUNE').toUpperCase()) {
        case 'ETUDIANT':
            return 'red_etudiant';
        case 'MILITAIRE':
            return 'red_militaire';
        case 'HANDICAPE':
            return 'red_handicape';
        case 'SENIOR':
            return 'red_senior';
        default:
            return null;
    }
}

// GET lines actives
exports.getActiveLines = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                num_ligne,
                ville_depart,
                ville_arrivee,
                horaire,
                statut_ligne
            FROM ligne
            WHERE LOWER(statut_ligne) = 'active'
            ORDER BY num_ligne ASC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getActiveLines:', err);
        res.status(500).json({ message: 'Erreur récupération des lignes' });
    }
};

exports.getTodayServices = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || 'CURRENT_DATE';
        
        // 1. Identifier les lignes actives avec bus statique qui n'ont pas de service aujourd'hui
        const checkQuery = `
            SELECT l.num_ligne, b.id_bus
            FROM ligne l
            JOIN bus b ON l.num_ligne = b.num_ligne
            LEFT JOIN service s ON (
                s.num_ligne = l.num_ligne AND 
                s.id_bus = b.id_bus AND 
                s.date_service::date = ${targetDate === 'CURRENT_DATE' ? 'CURRENT_DATE' : '$1'}::date
            )
            WHERE l.statut_ligne ILIKE 'active' AND s.id_service IS NULL
        `;
        const checkParams = targetDate === 'CURRENT_DATE' ? [] : [targetDate];
        const toCreate = await db.query(checkQuery, checkParams);

        // 2. Créer les services manquants
        for (const row of toCreate.rows) {
            const insertQuery = targetDate === 'CURRENT_DATE' 
                ? `INSERT INTO service (date_service, num_ligne, id_bus) VALUES (CURRENT_DATE, $1, $2) ON CONFLICT DO NOTHING`
                : `INSERT INTO service (date_service, num_ligne, id_bus) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`;
            
            const insertParams = targetDate === 'CURRENT_DATE' 
                ? [row.num_ligne, row.id_bus] 
                : [targetDate, row.num_ligne, row.id_bus];

            await db.query(insertQuery, insertParams);
        }

        // 3. Retourner la liste complète mise à jour
        const finalQuery = `
            SELECT
                l.num_ligne,
                l.ville_depart,
                l.ville_arrivee,
                l.horaire,
                l.statut_ligne,
                b.id_bus,
                b.numero_bus,
                b.capacite,
                b.etat,
                s.id_service,
                s.date_service
            FROM ligne l
            LEFT JOIN bus b ON l.num_ligne = b.num_ligne
            LEFT JOIN service s ON (
                s.num_ligne = l.num_ligne AND 
                s.id_bus = b.id_bus AND 
                s.date_service::date = ${targetDate === 'CURRENT_DATE' ? 'CURRENT_DATE' : '$1'}::date
            )
            WHERE l.statut_ligne ILIKE 'active'
            ORDER BY l.horaire ASC
        `;
        const result = await db.query(finalQuery, checkParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getTodayServices (Auto-Create):', err);
        res.status(500).json({ message: 'Erreur lors de la préparation des services du jour' });
    }
};

// GET arrêts d'une ligne
exports.getLineStops = async (req, res) => {
    try {
        const { num_ligne } = req.params;

        const result = await db.query(`
            SELECT
                id_trajet,
                arret,
                distance_km,
                num_ligne
            FROM trajet
            WHERE num_ligne = $1
            ORDER BY distance_km ASC
        `, [num_ligne]);

        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getLineStops:', err);
        res.status(500).json({ message: 'Erreur récupération des arrêts' });
    }
};

// GET sièges occupés
exports.getOccupiedSeats = async (req, res) => {
    try {
        const { id_service } = req.params;

        if (!id_service || id_service === "null" || id_service === "undefined") {
            return res.json([]);
        }

        const result = await db.query(`
            SELECT siege FROM ticket WHERE id_service = $1 AND siege IS NOT NULL
            UNION
            SELECT siege FROM reservation WHERE id_service = $1 AND siege IS NOT NULL AND statut = 'CONFIRMEE'
            ORDER BY siege ASC
        `, [id_service]);

        res.json(result.rows.map(row => row.siege));
    } catch (err) {
        console.error('Erreur getOccupiedSeats:', err);
        res.status(500).json({ message: 'Erreur récupération des sièges occupés' });
    }
};

// POST calcul tarif
exports.calculateFare = async (req, res) => {
    try {
        const { num_ligne, arret_depart, arret_arrivee, type_reduction } = req.body;

        if (!num_ligne || !arret_depart || !arret_arrivee) {
            return res.status(400).json({ message: 'Champs requis manquants' });
        }

        const stopsResult = await db.query(`
            SELECT arret, distance_km
            FROM trajet
            WHERE num_ligne = $1
            ORDER BY distance_km ASC
        `, [num_ligne]);

        const stops = stopsResult.rows;
        const depart = stops.find(s => s.arret === arret_depart);
        const arrivee = stops.find(s => s.arret === arret_arrivee);

        if (!depart || !arrivee) {
            return res.status(404).json({ message: 'Arrêt introuvable' });
        }

        const distance = Number(arrivee.distance_km) - Number(depart.distance_km);

        if (distance <= 0) {
            return res.status(400).json({ message: "L'arrêt d'arrivée doit être après le départ" });
        }

        const tarifResult = await db.query(`
            SELECT *
            FROM tarif
            ORDER BY date_mise_a_jour DESC
            LIMIT 1
        `);

        if (tarifResult.rows.length === 0) {
            return res.status(404).json({ message: 'Aucun tarif configuré' });
        }

        const tarif = tarifResult.rows[0];
        const basePrice = distance * Number(tarif.prix_par_km) + Number(tarif.frais_fixes);

        const reductionColumn = mapReductionColumn(type_reduction);
        const reductionRate = reductionColumn ? normalizeReduction(tarif[reductionColumn]) : 0;

        const reductionAmount = basePrice * reductionRate;
        const finalPrice = Math.max(basePrice - reductionAmount, 0);

        res.json({
            num_ligne,
            arret_depart,
            arret_arrivee,
            distance_km: Number(distance.toFixed(2)),
            base_price: Number(basePrice.toFixed(3)),
            reduction_type: type_reduction || 'AUCUNE',
            reduction_rate: reductionRate,
            reduction_amount: Number(reductionAmount.toFixed(3)),
            final_price: Number(finalPrice.toFixed(3))
        });
    } catch (err) {
        console.error('Erreur calculateFare:', err);
        res.status(500).json({ message: 'Erreur calcul du tarif' });
    }
};

// POST créer ticket
exports.createTicket = async (req, res) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const {
            id_service,
            siege,
            arret_depart,
            arret_arrivee,
            type_reduction = 'AUCUNE'
        } = req.body;

        const agentId = req.user?.id_utilisateur || req.user?.id;

        if (!agentId) {
            await client.query('ROLLBACK');
            return res.status(401).json({ message: 'Agent non authentifié (Token invalide ou ID manquant)' });
        }

        if ((!id_service && !req.body.num_ligne) || !arret_depart || !arret_arrivee) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Champs requis manquants (Service ou Ligne, Départ, Arrivée)' });
        }

        let service;
        let finalServiceId = id_service;

        // Si id_service n'est pas fourni, on tente de le trouver ou de le créer pour aujourd'hui
        if (!finalServiceId) {
            // Dans ce module, on s'attendait à recevoir un id_service.
            // Cependant, avec la nouvelle logique de static assignment (bus.num_ligne), 
            // l'agent peut avoir choisi une ligne/bus sans qu'un service existe.
            // On va essayer de trouver le service existant pour aujourd'hui pour ce bus/ligne.
            const findService = await client.query(`
                SELECT id_service FROM service 
                WHERE num_ligne = (SELECT num_ligne FROM ligne WHERE num_ligne = $1)
                AND id_bus = (SELECT id_bus FROM bus WHERE num_ligne = $1 LIMIT 1)
                AND date_service = CURRENT_DATE
                LIMIT 1
            `, [req.body.num_ligne || null]); // On peut avoir besoin du num_ligne si id_service est null

            if (findService.rows.length > 0) {
                finalServiceId = findService.rows[0].id_service;
            } else {
                // On doit créer le service pour aujourd'hui
                // On récupère d'abord le bus assigné à cette ligne
                const busAssigned = await client.query('SELECT id_bus FROM bus WHERE num_ligne = $1 LIMIT 1', [req.body.num_ligne]);
                if (busAssigned.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ message: 'Aucun bus n’est assigné à cette ligne.' });
                }
                
                const newService = await client.query(`
                    INSERT INTO service (date_service, num_ligne, id_bus)
                    VALUES (CURRENT_DATE, $1, $2)
                    RETURNING id_service
                `, [req.body.num_ligne, busAssigned.rows[0].id_bus]);
                
                finalServiceId = newService.rows[0].id_service;
            }
        }

        const serviceResult = await client.query(`
            SELECT
                s.id_service,
                s.date_service,
                s.num_ligne,
                s.id_bus,
                l.ville_depart,
                l.ville_arrivee,
                l.horaire,
                b.numero_bus,
                b.capacite,
                u.nom,
                u.prenom
            FROM service s
            INNER JOIN ligne l ON s.num_ligne = l.num_ligne
            INNER JOIN bus b ON s.id_bus = b.id_bus
            LEFT JOIN utilisateur u ON u.id_utilisateur = $2
            WHERE s.id_service = $1
            LIMIT 1
        `, [finalServiceId, agentId]);

        if (serviceResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Service introuvable' });
        }

        service = serviceResult.rows[0];

        if (siege !== null && siege !== undefined && siege !== '') {
            const seatNumber = Number(siege);

            if (isNaN(seatNumber) || seatNumber <= 0 || seatNumber > Number(service.capacite)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Numéro de siège invalide' });
            }

            const seatCheck = await client.query(`
                SELECT id_ticket
                FROM ticket
                WHERE id_service = $1 AND siege = $2
                LIMIT 1
            `, [id_service, seatNumber]);

            if (seatCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ message: 'Ce siège est déjà occupé' });
            }
        }

        const stopsResult = await client.query(`
            SELECT arret, distance_km
            FROM trajet
            WHERE num_ligne = $1
            ORDER BY distance_km ASC
        `, [service.num_ligne]);

        const stops = stopsResult.rows;
        const depart = stops.find(s => s.arret === arret_depart);
        const arrivee = stops.find(s => s.arret === arret_arrivee);

        if (!depart || !arrivee) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Arrêt introuvable' });
        }

        const distance = Number(arrivee.distance_km) - Number(depart.distance_km);

        if (distance <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: "L'arrêt d'arrivée doit être après le départ" });
        }

        const tarifResult = await client.query(`
            SELECT *
            FROM tarif
            ORDER BY date_mise_a_jour DESC
            LIMIT 1
        `);

        if (tarifResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Tarif introuvable' });
        }

        const tarif = tarifResult.rows[0];
        const basePrice = distance * Number(tarif.prix_par_km) + Number(tarif.frais_fixes);

        const reductionColumn = mapReductionColumn(type_reduction);
        const reductionRate = reductionColumn ? normalizeReduction(tarif[reductionColumn]) : 0;
        const finalPrice = Math.max(basePrice - (basePrice * reductionRate), 0);

        const qrCode = crypto.randomUUID();

        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        const randomPart = Math.floor(Math.random() * 9000) + 1000;
        const codeTicket = `TK-${y}${m}${d}-${randomPart}`;

        const insertResult = await client.query(`
            INSERT INTO ticket (
                code_ticket,
                qr_code,
                montant_total,
                date_emission,
                id_service,
                siege,
                id_agent,
                arret_depart,
                arret_arrivee,
                type_reduction,
                distance_km,
                est_imprime
            )
            VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10, FALSE)
            RETURNING *
        `, [
            codeTicket,
            qrCode,
            Number(finalPrice.toFixed(3)),
            finalServiceId,
            siege || null,
            agentId,
            arret_depart,
            arret_arrivee,
            type_reduction,
            Number(distance.toFixed(2))
        ]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Ticket créé avec succès',
            ticket: {
                ...insertResult.rows[0],
                numero_bus: service.numero_bus,
                nom_ligne: `${service.ville_depart} → ${service.ville_arrivee}`,
                depart: arret_depart,
                arrivee: arret_arrivee,
                date_depart: service.date_service,
                heure_depart: service.horaire,
                agent_nom: `${service.prenom || ''} ${service.nom || ''}`.trim(),
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur createTicket:', err);
        res.status(500).json({ message: 'Erreur création ticket' });
    } finally {
        client.release();
    }
};

// GET mes ventes
exports.getMySales = async (req, res) => {
    try {
        const agentId = req.user?.id_utilisateur;

        if (!agentId) {
            return res.status(401).json({ message: 'Agent non authentifié' });
        }

        const result = await db.query(`
            SELECT
                t.id_ticket,
                t.code_ticket,
                t.qr_code,
                t.montant_total,
                t.date_emission,
                t.siege,
                t.arret_depart,
                t.arret_arrivee,
                t.type_reduction,
                t.distance_km,
                t.est_imprime,
                s.date_service,
                b.numero_bus,
                l.ville_depart,
                l.ville_arrivee,
                l.horaire
            FROM ticket t
            INNER JOIN service s ON t.id_service = s.id_service
            INNER JOIN bus b ON s.id_bus = b.id_bus
            INNER JOIN ligne l ON s.num_ligne = l.num_ligne
            WHERE t.id_agent = $1
            ORDER BY t.date_emission DESC
        `, [agentId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getMySales:', err);
        res.status(500).json({ message: 'Erreur récupération historique agent' });
    }
};

exports.createReservation = async (req, res) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const {
            id_service,
            num_ligne,
            date_voyage,
            id_agent,
            siege,
            arret_depart,
            arret_arrivee,
            type_reduction,
            montant_total
        } = req.body;

        const voyageDateObj = new Date(date_voyage);
        const todayObj = new Date();
        todayObj.setHours(0, 0, 0, 0);

        if (voyageDateObj < todayObj) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Impossible de réserver pour une date passée.' });
        }

        let finalServiceId = id_service;

        // Auto-create/find service for the travel date if id_service is missing
        if (!finalServiceId) {
            const dateToUse = date_voyage || new Date().toISOString().split('T')[0];
            const lineToUse = num_ligne;

            if (!lineToUse) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Ligne non spécifiée' });
            }

            const findService = await client.query(`
                SELECT id_service FROM service 
                WHERE num_ligne = $1
                AND id_bus = (SELECT id_bus FROM bus WHERE num_ligne = $1 LIMIT 1)
                AND date_service = $2
                LIMIT 1
            `, [lineToUse, dateToUse]);

            if (findService.rows.length > 0) {
                finalServiceId = findService.rows[0].id_service;
            } else {
                const busAssigned = await client.query('SELECT id_bus FROM bus WHERE num_ligne = $1 LIMIT 1', [lineToUse]);
                if (busAssigned.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ message: 'Aucun bus n’est assigné à cette ligne.' });
                }
                
                const newService = await client.query(`
                    INSERT INTO service (date_service, num_ligne, id_bus)
                    VALUES ($1, $2, $3)
                    RETURNING id_service
                `, [dateToUse, lineToUse, busAssigned.rows[0].id_bus]);
                
                finalServiceId = newService.rows[0].id_service;
            }
        }

        const result = await client.query(`
            INSERT INTO reservation (
                id_service,
                id_agent,
                siege,
                arret_depart,
                arret_arrivee,
                type_reduction,
                montant_total,
                nb_places_reservees,
                date_reservation,
                statut
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW(), 'CONFIRMEE')
            RETURNING *
        `, [
            finalServiceId,
            id_agent,
            siege,
            arret_depart,
            arret_arrivee,
            type_reduction,
            montant_total
        ]);

        const reservation = result.rows[0];

        // Fetch additional details for the printable ticket
        const details = await client.query(`
            SELECT 
                l.ville_depart, l.ville_arrivee, l.num_ligne,
                b.numero_bus,
                s.date_service
            FROM service s
            JOIN ligne l ON s.num_ligne = l.num_ligne
            JOIN bus b ON s.id_bus = b.id_bus
            WHERE s.id_service = $1
        `, [finalServiceId]);

        const fullReservation = {
            ...reservation,
            ...details.rows[0]
        };

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Réservation confirmée',
            reservation: fullReservation
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur createReservation:', err);
        res.status(500).json({ message: 'Erreur création réservation' });
    } finally {
        client.release();
    }
};

// GET Mes réservations
exports.getMyReservations = async (req, res) => {
    try {
        const agentId = req.user?.id_utilisateur || req.user?.id;
        const result = await db.query(`
            SELECT 
                r.*,
                l.ville_depart, l.ville_arrivee, l.num_ligne,
                b.numero_bus,
                s.date_service
            FROM reservation r
            JOIN service s ON r.id_service = s.id_service
            JOIN ligne l ON s.num_ligne = l.num_ligne
            JOIN bus b ON s.id_bus = b.id_bus
            WHERE r.id_agent = $1
            ORDER BY r.date_reservation DESC
        `, [agentId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getMyReservations:', err);
        res.status(500).json({ message: 'Erreur historique réservations' });
    }
};

// POST Impression unique
exports.printTicketOnce = async (req, res) => {
    try {
        const { id } = req.params;

        const ticketCheck = await db.query(
            'SELECT est_imprime FROM ticket WHERE id_ticket = $1',
            [id]
        );

        if (ticketCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Ticket introuvable' });
        }

        if (ticketCheck.rows[0].est_imprime) {
            return res.status(400).json({ message: 'Ce ticket a déjà été imprimé' });
        }

        await db.query(
            'UPDATE ticket SET est_imprime = TRUE, date_impression = NOW() WHERE id_ticket = $1',
            [id]
        );

        res.json({ message: 'Impression autorisée' });
    } catch (err) {
        console.error('Erreur printTicketOnce:', err);
        res.status(500).json({ message: 'Erreur impression ticket' });
    }
};
const db = require('../config/db');

// Auto-create the statut column if it doesn't exist (safe migration)
const initServiceTable = async () => {
    try {
        await db.query(`
            ALTER TABLE service 
            ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'En cours',
            ADD COLUMN IF NOT EXISTS id_receveur INTEGER,
            ADD COLUMN IF NOT EXISTS date_debut TIMESTAMPTZ DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS date_fin TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS station_actuelle VARCHAR(100),
            ADD COLUMN IF NOT EXISTS horaire VARCHAR(20),
            ADD COLUMN IF NOT EXISTS voyage_complet BOOLEAN DEFAULT FALSE
        `);
        // Ensure fiche_cloture_service table exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS fiche_cloture_service (
                id_fiche SERIAL PRIMARY KEY,
                id_service INTEGER REFERENCES service(id_service),
                id_responsable_cloture INTEGER REFERENCES utilisateur(id_utilisateur),
                heure_cloture TIMESTAMPTZ DEFAULT NOW(),
                total_collecte DECIMAL(10, 3) DEFAULT 0,
                statut VARCHAR(20) DEFAULT 'En attente',
                duree_minutes INTEGER,
                motif_cloture VARCHAR(255)
            );
        `);

        // Migration to add missing columns if table already existed
        await db.query(`
            ALTER TABLE fiche_cloture_service 
            ADD COLUMN IF NOT EXISTS duree_minutes INTEGER,
            ADD COLUMN IF NOT EXISTS motif_cloture VARCHAR(255)
        `);
    } catch (err) {
        console.error('Migration error:', err);
    }
};
initServiceTable();

/**
 * POST /api/receveur-service/start
 * Start a new service for the receveur's bus
 */
exports.startService = async (req, res) => {
    const { numero_bus, id_receveur, horaire } = req.body;
    if (!numero_bus) {
        return res.status(400).json({ message: 'Numéro de bus manquant' });
    }

    try {
        // Get bus + line info
        const busRes = await db.query(`
            SELECT b.id_bus, b.num_ligne, b.id_receveur, l.ville_depart, l.ville_arrivee
            FROM bus b
            LEFT JOIN ligne l ON b.num_ligne = l.num_ligne
            WHERE b.numero_bus = $1
            LIMIT 1
        `, [numero_bus]);

        if (busRes.rows.length === 0) {
            return res.status(404).json({ message: 'Bus introuvable' });
        }

        const bus = busRes.rows[0];
        const effectiveReceveurId = id_receveur || bus.id_receveur;

        // Close any currently open service for this bus first
        await db.query(`
            UPDATE service SET statut = 'Terminé', date_fin = NOW()
            WHERE id_bus = $1 AND statut = 'En cours'
        `, [bus.id_bus]);

        // Set the initial station to ville_depart
        const result = await db.query(`
            INSERT INTO service (num_ligne, id_bus, date_service, statut, id_receveur, date_debut, station_actuelle, voyage_complet, horaire)
            VALUES ($1, $2, CURRENT_DATE, 'En cours', $3, NOW(), $4, FALSE, $5)
            RETURNING id_service, num_ligne, date_service, statut, date_debut, station_actuelle, voyage_complet, horaire
        `, [bus.num_ligne, bus.id_bus, effectiveReceveurId, bus.ville_depart || null, horaire || null]);

        const service = result.rows[0];

        res.status(201).json({
            message: 'Service démarré avec succès',
            service: {
                ...service,
                numero_bus,
                id_bus: bus.id_bus,
                ville_depart: bus.ville_depart,
                ville_arrivee: bus.ville_arrivee,
                num_ligne: bus.num_ligne,
                station_actuelle: bus.ville_depart,
                voyage_complet: false
            }
        });
    } catch (err) {
        console.error('Erreur startService:', err);
        res.status(500).json({ message: 'Erreur lors du démarrage du service: ' + err.message });
    }
};

/**
 * POST /api/receveur-service/:id/close
 * Close a service — only allowed if voyage is complete OR an incident reason is given
 */
exports.closeService = async (req, res) => {
    const { id } = req.params;
    const { raison_incident } = req.body; // optional: reason if closing due to incident
    try {
        // Check if voyage is complete or incident override is provided
        const check = await db.query(
            'SELECT voyage_complet, statut FROM service WHERE id_service = $1',
            [id]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Service introuvable' });
        }
        const svc = check.rows[0];
        if (!svc.voyage_complet && !raison_incident) {
            return res.status(403).json({
                message: `Le service ne peut être clôturé que si le voyage est terminé ou en cas d'incident.`
            });
        }

        // 1. Fetch details for the report
        const details = await db.query(`
            SELECT s.*, 
                   (SELECT COUNT(*) FROM ticket t WHERE t.id_service = s.id_service) as tickets_count,
                   (SELECT COALESCE(SUM(t.montant_total), 0) FROM ticket t WHERE t.id_service = s.id_service) as total_recette
            FROM service s
            WHERE s.id_service = $1
        `, [id]);

        if (details.rows.length === 0) return res.status(404).json({ message: 'Service non trouvé' });
        const serviceData = details.rows[0];

        const motif = raison_incident ? `INCIDENT: ${raison_incident}` : 'Voyage terminé';
        
        // Calculate duration in minutes
        const dateFin = new Date();
        const dureeMinutes = Math.floor((dateFin.getTime() - new Date(serviceData.date_debut).getTime()) / 60000);

        // 2. Mark service as finished
        const result = await db.query(`
            UPDATE service 
            SET statut = 'Terminé', date_fin = $1
            WHERE id_service = $2
            RETURNING id_service, statut, date_fin
        `, [dateFin, id]);

        // 3. Create the closure fiche
        await db.query(`
            INSERT INTO fiche_cloture_service (id_service, id_responsable_cloture, total_collecte, duree_minutes, motif_cloture, statut, heure_cloture)
            VALUES ($1, $2, $3, $4, $5, 'En attente', $6)
        `, [id, serviceData.id_receveur, serviceData.total_recette, dureeMinutes, motif, dateFin]);

        res.json({ 
            message: `Service clôturé — ${motif}`, 
            service: result.rows[0],
            fiche: {
                total_recette: serviceData.total_recette,
                tickets_count: serviceData.tickets_count,
                duree_minutes: dureeMinutes
            }
        });
    } catch (err) {
        console.error('Erreur closeService:', err);
        res.status(500).json({ message: 'Erreur lors de la clôture' });
    }
};

/**
 * GET /api/receveur-service/active/:numero_bus
 * Get the current active service for a bus
 */
exports.getActiveService = async (req, res) => {
    const { numero_bus } = req.params;
    try {
        // Auto-close any "En cours" service from previous days for this bus
        await db.query(`
            UPDATE service 
            SET statut = 'Terminé', date_fin = NOW()
            WHERE id_bus = (SELECT id_bus FROM bus WHERE numero_bus = $1 LIMIT 1)
              AND statut = 'En cours' 
              AND date_service < CURRENT_DATE
        `, [numero_bus]);

        const result = await db.query(`
            SELECT s.id_service, s.num_ligne, s.date_service, s.statut, s.date_debut,
                   s.station_actuelle, s.voyage_complet, s.horaire,
                   b.numero_bus, b.capacite,
                   l.ville_depart, l.ville_arrivee,
                   (SELECT COUNT(*) FROM ticket t WHERE t.id_service = s.id_service) as nb_tickets,
                   (SELECT COALESCE(SUM(t.montant_total), 0) FROM ticket t WHERE t.id_service = s.id_service) as recette
            FROM service s
            JOIN bus b ON s.id_bus = b.id_bus
            LEFT JOIN ligne l ON s.num_ligne = l.num_ligne
            WHERE b.numero_bus = $1 AND s.statut = 'En cours'
            ORDER BY s.date_debut DESC
            LIMIT 1
        `, [numero_bus]);

        if (result.rows.length === 0) {
            return res.json(null);
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erreur getActiveService:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * GET /api/receveur-service/:id/tickets
 * Get all tickets for a service
 */
exports.getServiceTickets = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT t.id_ticket, t.siege, t.type_tarif, t.montant_total,
                   t.heure_depart, t.station_depart, t.station_arrivee, 
                   t.date_emission, t.code_ticket
            FROM ticket t
            WHERE t.id_service = $1
               OR (t.id_bus = (SELECT id_bus FROM service WHERE id_service = $1) 
                   AND t.date_voyage = (SELECT date_service FROM service WHERE id_service = $1))
            ORDER BY t.date_emission DESC
        `, [id]);

        res.json(result.rows);
    } catch (err) {
        console.error('Erreur getServiceTickets:', err);
        res.status(500).json({ message: 'Erreur récupération tickets service' });
    }
};

/**
 * POST /api/receveur-service/:id/avancer
 * Advance to the next station along the route.
 * Body: { prochaine_station: string, est_derniere: boolean }
 * When est_derniere=true, marks voyage_complet=TRUE.
 */
exports.avancerStation = async (req, res) => {
    const { id } = req.params;
    const { prochaine_station, est_derniere } = req.body;
    if (!prochaine_station) {
        return res.status(400).json({ message: 'Station manquante' });
    }
    try {
        const result = await db.query(`
            UPDATE service
            SET station_actuelle = $1,
                voyage_complet = $2
            WHERE id_service = $3
            RETURNING id_service, station_actuelle, voyage_complet
        `, [prochaine_station, est_derniere === true, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Service introuvable' });
        }

        res.json({
            message: est_derniere
                ? `Arrivée à la destination finale : ${prochaine_station}`
                : `Station mise à jour : ${prochaine_station}`,
            service: result.rows[0]
        });
    } catch (err) {
        console.error('Erreur avancerStation:', err);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la station' });
    }
};


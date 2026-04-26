const db = require('../config/db');

/**
 * GET /api/admin/roles-overview
 * Returns live KPIs for each role: receveurs, controleurs, agents de guichet
 */
exports.getRolesOverview = async (req, res) => {
    try {
        const [
            receveursRes,
            activeServicesRes,
            controleurRes,
            agentsRes,
            incidentsRes,
            totalTicketsRes,
        ] = await Promise.all([
            // All receveurs
            db.query("SELECT COUNT(*) FROM utilisateur WHERE LOWER(role) = 'receveur'"),
            // Active services right now
            db.query("SELECT COUNT(*) FROM service WHERE statut = 'En cours'"),
            // All controleurs
            db.query("SELECT COUNT(*) FROM utilisateur WHERE LOWER(role) = 'controleur'"),
            // All agents de guichet
            db.query("SELECT COUNT(*) FROM utilisateur WHERE LOWER(role) = 'agent'"),
            // Open incidents (last 24h)
            db.query("SELECT COUNT(*) FROM incident WHERE date_incident >= NOW() - INTERVAL '24 hours'"),
            // Today's tickets sold via receveur (have an id_service)
            db.query(`
                SELECT COUNT(*) FROM ticket 
                WHERE DATE(date_emission) = CURRENT_DATE AND id_service IS NOT NULL
            `),
        ]);

        // Recent active services detail
        const activeServicesDetail = await db.query(`
            SELECT 
                s.id_service,
                b.numero_bus,
                s.station_actuelle,
                s.voyage_complet,
                s.date_debut,
                COALESCE(u.nom, '') || ' ' || COALESCE(u.prenom, '') AS receveur_nom,
                COUNT(t.id_ticket) AS nb_tickets,
                COALESCE(SUM(t.montant_total), 0) AS recette
            FROM service s
            LEFT JOIN bus b ON b.id_bus = s.id_bus
            LEFT JOIN utilisateur u ON u.id_utilisateur = s.id_receveur
            LEFT JOIN ticket t ON t.id_service = s.id_service
            WHERE s.statut = 'En cours'
            GROUP BY s.id_service, b.numero_bus, s.station_actuelle, s.voyage_complet, s.date_debut, u.nom, u.prenom
            ORDER BY s.date_debut DESC
            LIMIT 10
        `);

        // Recent incidents
        const recentIncidents = await db.query(`
            SELECT id_incident, type_incident as categorie, 'Moyenne' as gravite, description, numero_bus, rapporte_par as signale_par, date_incident
            FROM incident
            ORDER BY date_incident DESC
            LIMIT 5
        `);

        res.json({
            receveurs: {
                total: parseInt(receveursRes.rows[0].count),
                activeServices: parseInt(activeServicesRes.rows[0].count),
                ticketsToday: parseInt(totalTicketsRes.rows[0].count),
            },
            controleurs: {
                total: parseInt(controleurRes.rows[0].count),
            },
            agents: {
                total: parseInt(agentsRes.rows[0].count),
            },
            incidents: {
                last24h: parseInt(incidentsRes.rows[0].count),
                recent: recentIncidents.rows,
            },
            activeServices: activeServicesDetail.rows,
        });
    } catch (err) {
        console.error('Erreur getRolesOverview:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * GET /api/admin/notifications
 * Returns counts of pending items for resets, incidents, and audits
 */
exports.getNotificationsCount = async (req, res) => {
    try {
        const [resets, incidents, audits] = await Promise.all([
            db.query("SELECT COUNT(*) FROM demande_reinitialisation WHERE statut = 'En attente'"),
            db.query("SELECT COUNT(*) FROM incident WHERE statut = 'En attente'"),
            db.query("SELECT COUNT(*) FROM fiche_cloture_service WHERE statut = 'En attente'")
        ]);

        res.json({
            resets: parseInt(resets.rows[0].count),
            incidents: parseInt(incidents.rows[0].count),
            audits: parseInt(audits.rows[0].count),
            total: parseInt(resets.rows[0].count) + parseInt(incidents.rows[0].count) + parseInt(audits.rows[0].count)
        });
    } catch (err) {
        console.error('Erreur getNotificationsCount:', err);
        res.status(500).json({ message: 'Erreur notifications' });
    }
};

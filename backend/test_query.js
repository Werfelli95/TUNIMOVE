const db = require('./config/db');

async function test() {
    try {
        const query = `
            SELECT 
                f.id_fiche,
                u.nom as receveur_nom,
                u.prenom as receveur_prenom,
                u.matricule as receveur_matricule,
                u.role as agent_role,
                b.numero_bus,
                g.nom_guichet,
                f.heure_cloture,
                f.heure_connexion,
                f.total_collecte,
                f.statut,
                f.duree_minutes,
                f.motif_cloture,
                s.num_ligne,
                l.ville_depart,
                l.ville_arrivee,
                CASE 
                    WHEN f.id_service IS NOT NULL THEN (SELECT COUNT(*) FROM ticket t WHERE t.id_service = f.id_service)
                    ELSE (SELECT COUNT(*) FROM ticket t WHERE t.id_agent = f.id_responsable_cloture AND t.date_emission::date = f.heure_cloture::date)
                END as tickets_count
            FROM fiche_cloture_service f
            LEFT JOIN service s ON f.id_service = s.id_service
            LEFT JOIN bus b ON s.id_bus = b.id_bus
            LEFT JOIN utilisateur u ON f.id_responsable_cloture = u.id_utilisateur
            LEFT JOIN guichet g ON u.id_utilisateur = g.id_agent
            LEFT JOIN ligne l ON s.num_ligne = l.num_ligne
            
            UNION ALL
            
            SELECT 
                f.id_fiche,
                u.nom as receveur_nom,
                u.prenom as receveur_prenom,
                u.matricule as receveur_matricule,
                u.role as agent_role,
                NULL as numero_bus,
                NULL as nom_guichet,
                f.heure_cloture,
                f.heure_connexion,
                0 as total_collecte,
                f.statut,
                CAST(EXTRACT(EPOCH FROM (f.heure_cloture - f.heure_connexion))/60 AS INTEGER) as duree_minutes,
                'Rapport de contrôle' as motif_cloture,
                NULL as num_ligne,
                NULL as ville_depart,
                NULL as ville_arrivee,
                f.nb_tickets_scannes as tickets_count
            FROM fiche_controleur_service f
            JOIN utilisateur u ON f.id_controleur = u.id_utilisateur
            
            ORDER BY heure_cloture DESC;
        `;
        const res = await db.query(query);
        console.log("SUCCESS:", res.rows.length, "rows");
        process.exit(0);
    } catch (err) {
        console.error("FAILURE:", err.message);
        process.exit(1);
    }
}

test();

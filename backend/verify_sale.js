const pool = require('./config/db');

async function verify() {
    const testData = {
        num_ligne: 3,
        bus: "149",
        date_voyage: new Date().toISOString().split('T')[0],
        heure: "10:30",
        siege: "A1",
        prix: 15.500,
        arret_depart: "Tunis",
        arret_arrivee: "Sousse",
        agent_id: null,
        type_tarif: "Tarif Plein"
    };

    console.log('Testing sellTicket logic...');
    
    try {
        // Mocking the behavior of sellTicket controller
        const { num_ligne, bus, date_voyage, heure, siege, prix, arret_depart, arret_arrivee, agent_id, type_tarif } = testData;

        // 1. Service Lookup
        const serviceLookup = await pool.query(
            "SELECT id_service FROM service WHERE num_ligne = $1 AND date_service = $2 AND id_bus = (SELECT id_bus FROM bus WHERE numero_bus = $3 LIMIT 1) LIMIT 1",
            [num_ligne, date_voyage, bus]
        );
        const id_service = serviceLookup.rows.length > 0 ? serviceLookup.rows[0].id_service : null;
        console.log('Detected id_service:', id_service);

        const code_ticket = 'TEST-' + Math.floor(Math.random() * 1000000);
        const qr_code = code_ticket;

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
        
        const result = await pool.query(query, [
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

        console.log('Successfully inserted ticket ID:', result.rows[0].id_ticket);

        // 2. Verify History Query
        console.log('Testing getSalesHistory query...');
        const historyQuery = `
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
            WHERE t.id_ticket = $1
        `;
        const historyResult = await pool.query(historyQuery, [result.rows[0].id_ticket]);
        console.log('History View for new ticket:');
        console.table(historyResult.rows);

        // Cleanup
        await pool.query("DELETE FROM ticket WHERE id_ticket = $1", [result.rows[0].id_ticket]);
        console.log('Test ticket cleaned up.');

    } catch (err) {
        console.error('VERIFICATION FAILED:', err.message);
    } finally {
        process.exit();
    }
}

verify();

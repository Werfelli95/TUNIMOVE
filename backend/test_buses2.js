const db = require('./config/db');

async function testBuses() {
    try {
        const query = `
            SELECT b.id_bus, b.numero_bus, b.capacite, b.etat, b.num_ligne, b.id_receveur,
                   b.date_debut_affectation, b.date_fin_affectation,
                   b.horaire_affecte,
                   l.ville_depart, l.ville_arrivee 
            FROM bus b 
            LEFT JOIN ligne l ON b.num_ligne = l.num_ligne 
            ORDER BY b.numero_bus ASC
        `;
        const result = await db.query(query);
        console.log("Success:", result.rows);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}
testBuses();

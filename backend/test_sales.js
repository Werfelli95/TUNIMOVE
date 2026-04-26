const db = require('./config/db');
async function test() {
  try {
    const query = `
      SELECT 
          t.id_ticket,
          t.qr_code,
          t.montant_total as prix,
          t.date_emission,
          COALESCE(l.ville_depart, 'Inconnu') as ville_depart,
          COALESCE(l.ville_arrivee, 'Inconnu') as ville_arrivee,
          (COALESCE(l.ville_depart, 'N/A') || ' -> ' || COALESCE(l.ville_arrivee, 'N/A')) as trajet
      FROM ticket t
      LEFT JOIN service s ON t.id_service = s.id_service
      LEFT JOIN ligne l ON COALESCE(s.num_ligne, t.num_ligne) = l.num_ligne
      ORDER BY t.date_emission DESC
      LIMIT 10;
    `;
    const res = await db.query(query);
    console.log("Rows:", res.rows.length);
    console.log(res.rows);
  } catch(e) {
    console.error("Erreur SQL:", e.message);
  } finally {
    process.exit(0);
  }
}
test();

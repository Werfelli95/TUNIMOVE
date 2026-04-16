const db = require('./config/db');
db.query("SELECT b.id_bus, b.numero_bus, b.capacite, b.etat, b.num_ligne, b.id_receveur, b.date_debut_affectation, b.date_fin_affectation, b.image_url, TO_CHAR(b.horaire_affecte, 'HH24:MI') as horaire_affecte, l.ville_depart, l.ville_arrivee FROM bus b LEFT JOIN ligne l ON b.num_ligne = l.num_ligne ORDER BY b.numero_bus ASC")
  .then(res => { console.log('Query success'); process.exit(0); })
  .catch(err => { console.error('Query error:', err); process.exit(1); });

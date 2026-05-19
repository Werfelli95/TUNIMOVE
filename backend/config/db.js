const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // La limite par défaut de PostgreSQL est souvent de 100. 
  // Mettre max: 100 ici fait que Node.js essaie d'ouvrir 100 connexions, ce qui dépasse la limite du DB et cause le crash.
  // En mettant max à 20, pg-pool va mettre les autres requêtes en file d'attente (sans crasher) jusqu'à ce qu'une connexion soit libérée.
  max: 20, 
  idleTimeoutMillis: 10000, // Fermer les clients inactifs après 10 secondes
  connectionTimeoutMillis: 5000, // Temps d'attente max pour une nouvelle connexion
});

// Log des erreurs du pool
pool.on('error', (err, client) => {
  console.error('Erreur inattendue sur un client PostgreSQL idle', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
  pool: pool // Exportation du pool au cas où on en aurait besoin (ex: fermeture propre)
};

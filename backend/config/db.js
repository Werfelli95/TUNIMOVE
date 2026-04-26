const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // Optimisation du pool pour éviter l'erreur "too many clients"
  max: 20, // Maximum de 20 connexions simultanées pour ce backend
  idleTimeoutMillis: 10000, // Fermer les clients inactifs après 10 secondes
  connectionTimeoutMillis: 2000, // Temps d'attente max pour une nouvelle connexion
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

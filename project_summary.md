# 🚀 TuniMove - Documentation Technique Complète (Système de Connexion)

Ce fichier regroupe l'intégralité du code source et les explications pour le système d'authentification de **TuniMove**.

---

## 📂 1. Configuration Globale & Base de Données

### 💾 Schéma SQL (`transport_app`)
Exécutez ceci dans PostgreSQL pour préparer vos tables :

```sql
-- Table Utilisateur
CREATE TABLE utilisateur (
    id_utilisateur SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE, -- Requis pour Admin
    matricule VARCHAR(50) UNIQUE NOT NULL, -- Requis pour Agent
    mot_de_passe TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('ADMIN', 'AGENT', 'RECEVEUR', 'CONTROLEUR')) NOT NULL
);

-- Exemple d'insertion pour tester
INSERT INTO utilisateur (nom, prenom, email, matricule, mot_de_passe, role)
VALUES ('Admin', 'TuniMove', 'admin@tunimove.tn', 'ADM-001', 'admin123', 'ADMIN');

INSERT INTO utilisateur (nom, prenom, matricule, mot_de_passe, role)
VALUES ('Ben Ahmed', 'Amine', 'AG2024-001', 'agent123', 'AGENT');
```

---

## 🟢 2. BACKEND (Node.js / Express)

### 📄 `.env`
Configuration des variables d'environnement.
```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=123456789
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transport_app
JWT_SECRET=tunimove_secret_key_2024
```

### 📄 `config/db.js`
Gestion de la connexion PostgreSQL.
```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
```

### 📄 `controllers/authController.js`
Logique métier pour la connexion Admin (Email) et Agent (Matricule).
```javascript
const db = require('../config/db');
const jwt = require('jsonwebtoken');

exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query(
      'SELECT * FROM utilisateur WHERE (email = $1 OR matricule = $1) AND role = \'ADMIN\'', 
      [email]
    );
    if (result.rows.length === 0) return res.status(401).json({ message: 'Admin non trouvé' });
    
    const user = result.rows[0];
    if (password !== user.mot_de_passe) return res.status(401).json({ message: 'MDP incorrect' });

    const token = jwt.sign({ id: user.id_utilisateur, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { nom: user.nom, role: 'ADMIN' } });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.loginAgent = async (req, res) => {
  const { matricule, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM utilisateur WHERE matricule = $1 AND role = \'AGENT\'', [matricule]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Agent non trouvé' });

    const user = result.rows[0];
    if (password !== user.mot_de_passe) return res.status(401).json({ message: 'MDP incorrect' });

    const token = jwt.sign({ id: user.id_utilisateur, role: 'AGENT' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { matricule: user.matricule, role: 'AGENT' } });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
```

### 📄 `server.js`
Point d'entrée de l'API.
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(5000, () => console.log('Serveur démarré sur le port 5000'));
```

---

## 🔵 3. FRONTEND (React / Vite)

### 📄 `src/index.css`
Design premium (Glassmorphism & Gradients).
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap');

:root {
  --background: #0f172a;
  --glass: rgba(30, 41, 59, 0.7);
}

body {
  font-family: 'Outfit', sans-serif;
  background: radial-gradient(at 0% 0%, #020617 0, transparent 50%), 
              radial-gradient(at 100% 0%, #1e1b4b 0, transparent 50%);
  background-color: var(--background);
  color: white;
  height: 100vh;
  display: flex; justify-content: center; align-items: center;
}

.glass-card {
  background: var(--glass);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 2.5rem; border-radius: 20px; width: 400px;
}

.btn-primary {
  width: 100%; padding: 0.8rem; background: #4f46e5; border: none;
  border-radius: 10px; color: white; cursor: pointer; font-weight: bold;
}
```

### 📄 `src/App.jsx`
Routage sécurisé.
```javascript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AgentLogin from './pages/AgentLogin';
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AgentLogin />} />
        <Route path="/admin-secure-portal" element={<AdminLogin />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
export default App;
```

### 📄 `src/pages/AgentLogin.jsx`
Connexion via **Matricule**.
```javascript
import React, { useState } from 'react';
import axios from 'axios';

const AgentLogin = () => {
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login/agent', { matricule, password });
      alert('Connexion Agent Réussie !');
      localStorage.setItem('token', res.data.token);
    } catch (err) {
      alert('Identifiants incorrects');
    }
  };

  return (
    <div className="glass-card text-center">
      <h2>TuniMove</h2>
      <p>Espace Agent</p>
      <form onSubmit={handleLogin}>
        <input type="text" placeholder="Matricule" onChange={e => setMatricule(e.target.value)} required />
        <input type="password" placeholder="Mot de passe" onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="btn-primary">Connexion</button>
      </form>
    </div>
  );
};
export default AgentLogin;
```

## 🚀 Comment Démarrer le Projet

### 1. Démarrer le BACKEND
Ouvrez un terminal dans le dossier `backend` :
```bash
cd backend
npm install
npm run dev
```
*Le serveur écoutera sur `http://localhost:5000`.*

### 2. Démarrer le FRONTEND
Ouvrez un **deuxième terminal** dans le dossier `frontend-web` :
```bash
cd frontend-web
npm install
npm run dev
```
*L'application sera accessible sur `http://localhost:3000`.*

---
*Fin de la documentation technique pour le module Authentification.*

import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login/admin', { email, password });

            // SAUVEGARDE DES DONNÉES
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', 'admin');

            // ICI : On ajoute l'ID dans l'objet user
            localStorage.setItem('user', JSON.stringify({
                id: res.data.user.id, // <--- AJOUT IMPORTANT
                nom: res.data.user.nom,
                prenom: res.data.user.prenom
            }));

            window.location.href = '/admin-dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la connexion');
        }
    };

    return (
        <div className="login-page">
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex justify-center w-full mb-4"
                >
                    <div className="road-container">
                        <motion.div
                            animate={{ x: [-2, 2, -2], y: [0, -1, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="bus-vibration"
                        >
                            <ShieldCheck size={44} className="text-indigo-600" strokeWidth={1.5} />
                        </motion.div>
                        <div className="moving-road" />
                    </div>
                </motion.div>

                <motion.h1 className="logo-text">Administration</motion.h1>
                <motion.p className="text-center text-slate-500 mb-8"><center>Espace Admin Sécurisé</center></motion.p>

                {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-center border border-red-100 italic">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label><Mail size={18} style={{ marginRight: '10px' }} />Email Professionnel</label>
                        <input
                            type="email"
                            placeholder="admin@tunimove.tn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label><Lock size={18} style={{ marginRight: '10px' }} /> Mot de passe</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="btn-primary w-full py-4 mt-4"
                    >
                        Accès Administrateur
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminLogin;

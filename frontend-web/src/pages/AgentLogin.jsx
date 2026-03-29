import React, { useState } from 'react';
import axios from 'axios';
import { User, Lock, Bus } from 'lucide-react';
import { motion } from 'framer-motion';

const AgentLogin = () => {
    const [matricule, setMatricule] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login/agent', { matricule, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', 'agent');
            localStorage.setItem('agentMatricule', matricule);
            localStorage.setItem('user', JSON.stringify({
                nom: res.data.user.nom,
                prenom: res.data.user.prenom
            }));
            window.location.href = '/agent-dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la connexion');
        }
    };

    return (
        <div className="login-page">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card"
            >
                {/* ... existing content ... */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex justify-center w-full mb-4"
                >
                    <div className="road-container">
                        <motion.div
                            animate={{
                                x: [-2, 2, -2],
                                y: [0, -1, 0]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "easeInOut"
                            }}
                            className="bus-vibration"
                        >
                            <Bus size={44} className="text-indigo-600" strokeWidth={1.5} />
                        </motion.div>
                        <div className="moving-road" />
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="logo-text"
                >
                    TuniMove
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem', fontWeight: 500 }}
                >
                    Espace Agent de Guichet
                </motion.p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', padding: '1rem', borderRadius: '16px', marginBottom: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.1)', fontSize: '0.9rem', fontWeight: 500 }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin}>
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="input-group"
                    >
                        <label><User size={18} style={{ marginRight: '10px' }} /> Matricule Agent</label>
                        <input
                            type="text"
                            placeholder="Ex: AG-2024-001"
                            value={matricule}
                            onChange={(e) => setMatricule(e.target.value)}
                            required
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="input-group"
                    >
                        <label><Lock size={18} style={{ marginRight: '10px' }} /> Mot de passe</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="btn-primary"
                    >
                        Se Connecter
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default AgentLogin;

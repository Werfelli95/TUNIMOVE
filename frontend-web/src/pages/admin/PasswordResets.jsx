import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, CheckCircle, Clock, Trash2, RefreshCw, ShieldAlert, History, CalendarCheck, ArrowRight, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './PasswordResets.css';

const PasswordResets = () => {
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ pending: 0, total_today: 0, treated_today: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [requestsRes, statsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/password-reset/pending'),
                axios.get('http://localhost:5000/api/password-reset/stats')
            ]);
            setRequests(requestsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Erreur fetchData:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id_demande) => {
        if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ? Un mail lui sera envoyé automatiquement.")) return;

        setActionLoading(id_demande);
        try {
            const res = await axios.post(`http://localhost:5000/api/password-reset/approve/${id_demande}`);
            setMessage({ type: 'success', text: res.data.message });
            fetchData();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || "Erreur lors du traitement." });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Supprimer cette demande sans la traiter ?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/password-reset/${id}`);
            fetchData();
        } catch (error) {
            console.error("Erreur delete:", error);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
                duration: 0.6,
                staggerChildren: 0.1 
            } 
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="password-resets-container"
        >
            {/* Header Amélioré */}
            <header className="page-header">
                <div className="header-content">
                    <div className="header-title-row">
                        <div className="header-icon-box">
                            <ShieldAlert size={32} />
                        </div>
                        <h1 className="header-title">Réinitialisations</h1>
                    </div>
                    <p className="header-subtitle">Gestion sécurisée des accès collaborateurs</p>
                </div>
                <button
                    onClick={fetchData}
                    className="btn-refresh shadow-md hover:shadow-lg transition-all"
                    title="Rafraîchir les données"
                >
                    <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
                </button>
            </header>

            {/* Cartes de Statistiques Premium */}
            <div className="stats-grid">
                <motion.div variants={itemVariants} className="stat-card-premium">
                    <div className="stat-icon-container stat-pending">
                        <Clock size={32} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.pending}</div>
                        <div className="stat-label">En attente</div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="stat-card-premium">
                    <div className="stat-icon-container stat-today">
                        <CalendarCheck size={32} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.treated_today}</div>
                        <div className="stat-label">Traitées aujourd'hui</div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="stat-card-premium">
                    <div className="stat-icon-container stat-history">
                        <History size={32} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{stats.total_today}</div>
                        <div className="stat-label">Total Aujourd'hui</div>
                    </div>
                </motion.div>
            </div>

            {/* Alert Messages */}
            <AnimatePresence>
                {message.text && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className={`p-4 rounded-2xl flex items-center gap-3 font-bold shadow-xl border ${
                            message.type === 'success' 
                            ? 'bg-green-50 border-green-100 text-green-700 shadow-green-900/5' 
                            : 'bg-red-50 border-red-100 text-red-700 shadow-red-900/5'
                        }`}
                    >
                        <CheckCircle size={24} />
                        <span>{message.text}</span>
                        <button 
                            className="ml-auto p-1.5 hover:bg-black/5 rounded-lg"
                            onClick={() => setMessage({ type: '', text: '' })}
                        >
                            <Trash2 size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <motion.div
                variants={itemVariants}
                className="content-section"
            >
                <div className="section-header">
                    <h3 className="section-title">
                        <Mail className="text-indigo-500" size={24} />
                        Demandes en cours
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-widest">
                        {requests.length} demandes trouvées
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Collaborateur</th>
                                <th>Matricule</th>
                                <th>Contact Email</th>
                                <th>Date de réception</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan="5">
                                        <div className="empty-state">
                                            <div className="empty-icon-wrapper">
                                                <Mail size={48} className="text-slate-200" />
                                            </div>
                                            <h4 className="empty-title">Tout est en ordre !</h4>
                                            <p className="empty-text">Aucune demande de réinitialisation pour le moment.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {requests.map((req) => (
                                        <motion.tr
                                            key={req.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <td>
                                                <div className="agent-cell">
                                                    <div className="agent-avatar">
                                                        {req.prenom?.[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="agent-name">{req.prenom} {req.nom}</div>
                                                        <div className="agent-role">
                                                            {req.role === 'RECEVEUR' ? 'Receveur' : 
                                                             req.role === 'CONTROLEUR' ? 'Contrôleur' : 
                                                             req.role === 'ADMIN' ? 'Administrateur' : 'Agent de Guichet'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="matricule-badge">{req.matricule}</span>
                                            </td>
                                            <td>
                                                <div className="contact-info">
                                                    <Mail size={18} className="text-slate-300" />
                                                    {req.email}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="date-info">
                                                    <Clock size={18} />
                                                    {new Date(req.date_demande).toLocaleDateString('fr-FR', {
                                                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-group">
                                                    <button
                                                        onClick={() => handleApprove(req.id)}
                                                        disabled={actionLoading === req.id}
                                                        className="btn-approve"
                                                    >
                                                        {actionLoading === req.id ? (
                                                            <RefreshCw className="animate-spin" size={20} />
                                                        ) : (
                                                            <>
                                                                <UserCheck size={20} />
                                                                <span>APPROUVER</span>
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(req.id)}
                                                        className="btn-reject"
                                                        title="Rejeter la demande"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <p style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                © 2026 TuniMove — Plateforme de Gestion du Transport Public
            </p>
        </motion.div>
    );
};

export default PasswordResets;


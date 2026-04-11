import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, CheckCircle, Clock, Trash2, RefreshCw, User, ShieldAlert, History, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PasswordResets = () => {
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ pending: 0, total_treated: 0, treated_today: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchData = async () => {
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
        if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet agent ? Un mail lui sera envoyé automatiquement.")) return;

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
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
            className="p-8 pb-20 max-w-7xl mx-auto"
        >
            {/* Header Amélioré */}
            <header className="mb-10 relative">
                <div className="absolute -top-10 -left-10 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 z-0"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                                <ShieldAlert size={24} className="text-white" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Réinitialisations</h1>
                        </div>
                        <p className="text-slate-500 font-medium text-lg ml-12">Gestion sécurisée des accès agents de guichet</p>
                    </div>
                </div>
            </header>

            {/* Cartes de Statistiques Réelles */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <motion.div variants={itemVariants} style={{ flex: 1 }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center gap-5">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                        <Clock size={28} />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-slate-800">{stats.pending}</div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">En attente</div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} style={{ flex: 1 }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center gap-5">
                    <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                        <CalendarCheck size={28} />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-slate-800">{stats.treated_today}</div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Traitées aujourd'hui</div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} style={{ flex: 1 }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center gap-5">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <History size={28} />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-slate-800">{stats.total_treated}</div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Historique</div>
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {message.text && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-5 rounded-2xl mb-8 shadow-lg flex items-center gap-4 font-bold ${message.type === 'success' ? 'bg-green-600 text-white shadow-green-200' : 'bg-red-600 text-white shadow-red-200'
                            }`}
                        onClick={() => setMessage({ type: '', text: '' })}
                    >
                        <CheckCircle size={24} />
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                variants={itemVariants}
                className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden"
            >
                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 text-xl">Demandes en cours</h3>
                    <button
                        onClick={fetchData}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-8 py-5 text-slate-400 font-bold uppercase text-xs tracking-[0.15em]">Agent</th>
                                <th className="px-8 py-5 text-slate-400 font-bold uppercase text-xs tracking-[0.15em]">Matricule</th>
                                <th className="px-8 py-5 text-slate-400 font-bold uppercase text-xs tracking-[0.15em]">Contact Email</th>
                                <th className="px-8 py-5 text-slate-400 font-bold uppercase text-xs tracking-[0.15em]">Date de réception</th>
                                <th className="px-8 py-5 text-right text-slate-400 font-bold uppercase text-xs tracking-[0.15em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-indigo-50 rounded-full blur-2xl opacity-70"></div>
                                                <div className="relative p-6 bg-white rounded-full border border-slate-100 shadow-sm">
                                                    <Mail size={48} className="text-slate-200" />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-800 mb-1">Tout est en ordre !</h4>
                                                <p className="text-slate-400 font-medium">Aucune demande de réinitialisation pour le moment.</p>
                                            </div>
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
                                            className="group hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-0"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-100">
                                                        {req.prenom?.[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight">{req.prenom} {req.nom}</div>
                                                        <div className="text-xs text-indigo-500 font-bold uppercase tracking-widest mt-1">Guichetier</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="font-mono bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 text-sm font-bold border border-slate-200/50">{req.matricule}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-slate-600 font-bold">
                                                    <div className="p-1.5 bg-slate-100 rounded-lg">
                                                        <Mail size={14} className="text-slate-400" />
                                                    </div>
                                                    {req.email}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                                    <Clock size={16} className="text-slate-300" />
                                                    {new Date(req.date_demande).toLocaleDateString('fr-FR', {
                                                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => handleApprove(req.id)}
                                                        disabled={actionLoading === req.id}
                                                        className={`group/btn flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 hover:-translate-y-0.5 transition-all shadow-lg shadow-indigo-100 active:translate-y-0 ${actionLoading === req.id ? 'opacity-50' : ''}`}
                                                    >
                                                        {actionLoading === req.id ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                                        <span>APPROUVER</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(req.id)}
                                                        className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                                                        title="Rejeter"
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



        </motion.div>
    );
};

export default PasswordResets;

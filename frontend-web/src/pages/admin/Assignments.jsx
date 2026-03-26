import React, { useState, useEffect } from 'react';
import { Bus, UserPlus, Search, Loader2, CheckCircle, XCircle, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Users.css'; // On réutilise vos styles premium

const Assignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState({ withReceiver: 0, withoutReceiver: 0, availableReceivers: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBus, setSelectedBus] = useState(null);
    const [availableReceivers, setAvailableReceivers] = useState([]);
    const [selectedReceiverId, setSelectedReceiverId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignRes, statsRes] = await Promise.all([
                fetch('http://localhost:5000/api/assignments'),
                fetch('http://localhost:5000/api/assignments/stats')
            ]);
            setAssignments(await assignRes.json());
            setStats(await statsRes.json());
        } catch (error) {
            console.error("Erreur chargement:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = async (bus) => {
        setSelectedBus(bus);
        try {
            const res = await fetch('http://localhost:5000/api/assignments/available-receivers');
            setAvailableReceivers(await res.json());
            setSelectedReceiverId('');
            setIsModalOpen(true);
        } catch (error) {
            alert("Erreur lors de la récupération des receveurs");
        }
    };
    // Affectation d un receveur
    const handleAssign = async (id_receveur) => {
        setIsSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/api/assignments/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_bus: selectedBus.id_bus, id_receveur })
            });
            if (res.ok) {
                await fetchData();
                setIsModalOpen(false);
            }
        } catch (error) {
            alert("Erreur d'affectation");
        } finally {
            setIsSubmitting(false);
        }
    };
    // supprimer l affectation d'un receveur
    const handleUnassign = async (id_bus) => {
        // Une petite confirmation par sécurité
        if (!window.confirm("Voulez-vous vraiment retirer ce receveur de ce bus ?")) return;

        try {
            const res = await fetch('http://localhost:5000/api/assignments/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_bus, id_receveur: null }) // On envoie null pour détacher le receveur
            });

            if (res.ok) {
                await fetchData(); // On rafraîchit le tableau et les compteurs
            }
        } catch (error) {
            alert("Erreur lors de la suppression de l'affectation");
        }
    };


    const filtered = assignments.filter(a =>
        a.numero_bus.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.receveur_nom && a.receveur_nom.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="users-container">
            {/* STATS CARDS */}
            <div className="stats-grid">
                <motion.div className="stat-card" style={{ borderLeft: '4px solid #4f46e5' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-slate-500 text-sm">Bus avec receveur</p>
                            <h3 className="text-3xl font-bold text-slate-800">{stats.withReceiver}</h3>
                        </div>
                        <CheckCircle className="text-indigo-500" size={32} />
                    </div>
                </motion.div>

                <motion.div className="stat-card" style={{ borderLeft: '4px solid #f97316' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-slate-500 text-sm">Bus sans receveur</p>
                            <h3 className="text-3xl font-bold text-slate-800">{stats.withoutReceiver}</h3>
                        </div>
                        <XCircle className="text-orange-500" size={32} />
                    </div>
                </motion.div>

                <motion.div className="stat-card" style={{ borderLeft: '4px solid #10b981' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-slate-500 text-sm">Receveurs disponibles</p>
                            <h3 className="text-3xl font-bold text-slate-800">{stats.availableReceivers}</h3>
                        </div>
                        <Users className="text-emerald-500" size={32} />
                    </div>
                </motion.div>
            </div>

            {/* HEADER & TABLE */}
            <div className="users-table-card">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Affectation Bus - Receveur</h2>
                        <p className="text-sm text-slate-500">Gérer l'affectation des receveurs aux bus</p>
                    </div>
                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text" className="search-input" placeholder="Rechercher..."
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto mb-4" size={40} /><p>Chargement...</p></div>
                ) : (
                    <div className="table-responsive">
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th>Bus</th>
                                    <th>Capacité</th>
                                    <th>État</th>
                                    <th>Receveur Affecté</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(bus => (
                                    <tr key={bus.id_bus}>
                                        <td className="font-bold text-slate-700">
                                            <div className="flex items-center gap-2"><Bus size={16} className="text-indigo-500" />Bus N° {bus.numero_bus}</div>
                                        </td>
                                        <td>{bus.capacite} places</td>
                                        <td>
                                            <span className={`role-badge ${bus.etat === 'En service' ? 'badge-agent' : 'badge-receveur'}`}>
                                                {bus.etat}
                                            </span>
                                        </td>
                                        <td>
                                            {bus.receveur_nom ? (
                                                <div className="flex items-center justify-between gap-2 group/item">
                                                    <span className="text-slate-700 font-medium">
                                                        {bus.receveur_prenom} {bus.receveur_nom}
                                                    </span>
                                                    {/* Bouton de suppression qui apparaît au survol */}
                                                    <button
                                                        onClick={() => handleUnassign(bus.id_bus)}
                                                        className="p-1 rounded-md bg-red-50 text-red-500 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                                        title="Retirer le receveur"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic bg-slate-50 px-3 py-1 rounded-full text-xs border border-slate-100">
                                                    Non affecté
                                                </span>
                                            )}
                                        </td>

                                        <td className="text-center">
                                            <button
                                                className="btn-add-user h-8 py-0 px-4 text-xs"
                                                onClick={() => handleOpenModal(bus)}
                                                disabled={bus.etat !== 'En service'}
                                            >
                                                <UserPlus size={14} />
                                                <span>Affecter</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ASSIGNMENT MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal-content max-w-md" initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }}>
                            <div className="modal-header">
                                <h2>Affecter au Bus {selectedBus?.numero_bus}</h2>
                                <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-sm text-slate-500 mb-6">Choisissez un receveur disponible dans la liste :</p>

                                {availableReceivers.length > 0 ? (
                                    <div className="space-y-6">
                                        <div className="form-group">
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                                                Choisir un receveur
                                            </label>

                                            <select
                                                className="form-select w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                                                value={selectedReceiverId}
                                                onChange={(e) => setSelectedReceiverId(e.target.value)}
                                            >
                                                <option value="">Sélectionner un receveur...</option>
                                                {availableReceivers.map(rec => (
                                                    <option key={rec.id_utilisateur} value={rec.id_utilisateur}>
                                                        {rec.prenom} {rec.nom}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <button
                                            className="btn-submit w-full py-4 justify-center"
                                            onClick={() => handleAssign(selectedReceiverId)}
                                            disabled={!selectedReceiverId || isSubmitting}
                                        >
                                            {isSubmitting ? "Affectation en cours..." : "Confirmer l'affectation"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-slate-50 rounded-xl">
                                        <XCircle className="mx-auto text-slate-300 mb-2" size={32} />
                                        <p className="text-slate-500">Aucun receveur disponible.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Assignments;


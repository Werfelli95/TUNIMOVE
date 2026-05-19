import React, { useState, useEffect } from 'react';
import { Bus, UserPlus, Search, Loader2, CheckCircle, XCircle, Users, X, Edit2, Store, Plus, Trash2, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showConfirm, showAlert } from '../../utils/alert';
import './Users.css'; // On réutilise vos styles premium

const Assignments = () => {
    // États généraux
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // États pour les Guichets
    const [guichets, setGuichets] = useState([]);
    const [guichetStats, setGuichetStats] = useState({ total: 0, withAgent: 0, withoutAgent: 0, availableAgents: 0 });

    // États du Modal d'Affectation
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // Peut être un bus ou un guichet
    const [availableStaff, setAvailableStaff] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [stationDepart, setStationDepart] = useState('');

    // États pour l'Ajout de Guichet
    const [isAddGuichetModalOpen, setIsAddGuichetModalOpen] = useState(false);
    const [newGuichet, setNewGuichet] = useState({ nom_guichet: '', emplacement: '' });

    const fetchGuichetData = async () => {
        try {
            const [guichetRes, statsRes] = await Promise.all([
                fetch('http://localhost:5000/api/guichets'),
                fetch('http://localhost:5000/api/guichets/stats')
            ]);
            setGuichets(await guichetRes.json());
            setGuichetStats(await statsRes.json());
        } catch (error) {
            console.error("Erreur chargement guichets:", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        await fetchGuichetData();
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = async (item) => {
        setSelectedItem(item);
        try {
            const endpoint = 'http://localhost:5000/api/guichets/available-agents';

            const res = await fetch(endpoint);
            let available = await res.json();

            // Ajouter la personne déjà affectée à la liste pour pouvoir la conserver
            const currentStaffId = item.id_agent;
            if (currentStaffId) {
                const staffName = { id_utilisateur: item.id_agent, nom: item.agent_nom, prenom: item.agent_prenom };

                // Éviter les doublons
                if (!available.find(u => u.id_utilisateur === currentStaffId)) {
                    available.unshift(staffName);
                }
            }
            setAvailableStaff(available);

            if (currentStaffId) {
                setSelectedStaffId(currentStaffId);
                setStationDepart(item.station_depart || '');
            } else {
                setSelectedStaffId('');
                setStationDepart(item.emplacement || '');
            }

            setIsModalOpen(true);
        } catch (error) {
            showAlert("Erreur", "Erreur lors de la récupération du personnel disponible", "error");
        }
    };

    const handleAssign = async () => {
        setIsSubmitting(true);
        try {
            const url = 'http://localhost:5000/api/guichets/update';

            const body = {
                id_guichet: selectedItem.id_guichet,
                id_agent: selectedStaffId,
                num_ligne: null,
                station_depart: stationDepart || selectedItem.emplacement || null
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                await fetchData();
                setIsModalOpen(false);
            }
        } catch (error) {
            showAlert("Erreur", "Erreur lors de l'affectation", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnassign = async (id) => {
        const msg = "Voulez-vous vraiment retirer cet agent de ce guichet ?";
        const isConfirmed = await showConfirm("Retirer l'affectation", msg, "Oui, Retirer");
        if (!isConfirmed) return;

        try {
            const url = 'http://localhost:5000/api/guichets/update';

            const body = { id_guichet: id, id_agent: null };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                await fetchData();
            }
        } catch (error) {
            showAlert("Erreur", "Erreur lors de la suppression de l'affectation", "error");
        }
    };

    const handleToggleStatus = async (item) => {
        const newStatus = item.statut === 'Actif' ? 'Inactif' : 'Actif';
        try {
            const res = await fetch('http://localhost:5000/api/guichets/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_guichet: item.id_guichet, statut: newStatus })
            });
            if (res.ok) {
                await fetchGuichetData();
            }
        } catch (error) {
            showAlert("Erreur", "Erreur lors de la mise à jour du statut", "error");
        }
    };

    const handleCreateGuichet = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/api/guichets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newGuichet)
            });
            if (res.ok) {
                await fetchGuichetData();
                setIsAddGuichetModalOpen(false);
                setNewGuichet({ nom_guichet: '', emplacement: '' });
            } else {
                const data = await res.json();
                showAlert("Erreur", data.message || "Erreur lors de la création", "error");
            }
        } catch (error) {
            showAlert("Erreur", "Erreur de connexion au serveur", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGuichet = async (id) => {
        const isConfirmed = await showConfirm(
            "Supprimer le guichet",
            "Voulez-vous vraiment supprimer ce guichet ? Cette action est irréversible.",
            "Oui, Supprimer"
        );
        if (!isConfirmed) return;

        try {
            const res = await fetch(`http://localhost:5000/api/guichets/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                await fetchGuichetData();
            } else {
                const data = await res.json();
                showAlert("Erreur", data.message || "Erreur lors de la suppression", "error");
            }
        } catch (error) {
            showAlert("Erreur", "Erreur lors de la suppression", "error");
        }
    };

    const filteredGuichets = guichets.filter(g =>
        g.nom_guichet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.agent_nom && g.agent_nom.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const tableHtml = document.querySelector('.enterprise-table').outerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Affectation Agent - Guichet - TuniMove</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        h1 { color: #1e293b; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; white-space: nowrap; }
                        th { background-color: #f8fafc; font-weight: bold; text-transform: uppercase; font-size: 12px; }
                        .role-badge { border: 1px solid #ccc; padding: 4px 10px; border-radius: 99px; font-size: 10px; font-weight: bold; }
                        .actions-col, .btn-add-user, .search-wrapper, .btn-unassign { display: none !important; }
                    </style>
                </head>
                <body>
                    <h1>Liste des Affectations (Guichets) - TuniMove</h1>
                    <p>Généré le : ${new Date().toLocaleString()}</p>
                    ${tableHtml}
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="users-container">
            <div className="flex justify-end items-center mb-8 gap-3">
                <button
                    className="btn-add-user"
                    style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                    onClick={handlePrint}
                >
                    <Printer size={18} />
                    <span>Imprimer Liste</span>
                </button>
                <button
                    onClick={() => setIsAddGuichetModalOpen(true)}
                    className="btn-add-user"
                >
                    <Plus size={18} />
                    <span>Ajouter un Guichet</span>
                </button>
            </div>

            {/* STATS CARDS */}
            <div className="stats-grid">
                <>
                    <motion.div className="stat-card" style={{ borderLeft: '4px solid #4f46e5' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <div className="flex justify-between items-center">
                            <div><p className="text-slate-500 text-sm">Guichets avec agent</p><h3 className="text-3xl font-bold text-slate-800">{guichetStats.withAgent}</h3></div>
                            <CheckCircle className="text-indigo-500" size={32} />
                        </div>
                    </motion.div>
                    <motion.div className="stat-card" style={{ borderLeft: '4px solid #f97316' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                        <div className="flex justify-between items-center">
                            <div><p className="text-slate-500 text-sm">Guichets inoccupés</p><h3 className="text-3xl font-bold text-slate-800">{guichetStats.withoutAgent}</h3></div>
                            <XCircle className="text-orange-500" size={32} />
                        </div>
                    </motion.div>
                    <motion.div className="stat-card" style={{ borderLeft: '4px solid #10b981' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                        <div className="flex justify-between items-center">
                            <div><p className="text-slate-500 text-sm">Agents dispos</p><h3 className="text-3xl font-bold text-slate-800">{guichetStats.availableAgents}</h3></div>
                            <Users className="text-emerald-500" size={32} />
                        </div>
                    </motion.div>
                </>
            </div>

            {/* HEADER & TABLE */}
            <div className="users-table-card">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Affectation Agent - Guichet
                        </h2>
                        <br></br>
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
                                    <th>Guichet</th>
                                    <th>Emplacement</th>
                                    <th>État</th>
                                    <th>Agent Affecté</th>
                                    <th className="text-center actions-col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGuichets.map(item => (
                                    <tr key={item.id_guichet}>
                                        <td className="font-bold text-slate-700">
                                            <div className="flex items-center gap-2">
                                                <Store size={16} className="text-indigo-500" />
                                                {item.nom_guichet}
                                            </div>
                                        </td>
                                        <td>{item.emplacement}</td>
                                        <td>
                                            <button
                                                onClick={() => handleToggleStatus(item)}
                                                className={`role-badge ${item.statut === 'Actif' ? 'badge-agent' : 'badge-receveur'} cursor-pointer hover:ring-2 hover:ring-indigo-100 transition-all`}
                                                title="Cliquer pour changer le statut"
                                            >
                                                {item.statut}
                                            </button>
                                        </td>
                                        <td>
                                            {item.agent_nom ? (
                                                <div className="flex items-center justify-between gap-3 group/item">
                                                    <div>
                                                        <div className="text-slate-700 font-bold text-lg">
                                                            {`${item.agent_prenom} ${item.agent_nom}`}
                                                        </div>
                                                        {item.emplacement && (
                                                            <div className="flex flex-col gap-1 mt-2">
                                                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-[13px] font-bold border border-slate-200 w-fit">
                                                                    Emplacement: {item.emplacement}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        className="btn-unassign"
                                                        onClick={() => handleUnassign(item.id_guichet)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '26px',
                                                            height: '26px',
                                                            borderRadius: '50%',
                                                            backgroundColor: '#fee2e2',
                                                            color: '#ef4444',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            marginLeft: '10px',
                                                            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#ef4444';
                                                            e.currentTarget.style.color = 'white';
                                                            e.currentTarget.style.transform = 'scale(1.1)';
                                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#fee2e2';
                                                            e.currentTarget.style.color = '#ef4444';
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.1)';
                                                        }}
                                                        title="Retirer l'affectation"
                                                    >
                                                        <X size={14} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic bg-slate-50 px-3 py-1 rounded-full text-sm border border-slate-100">
                                                    Non affecté
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-center actions-col">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    className={`btn-add-user h-10 py-0 px-6 text-sm ${item.id_agent ? 'btn-modifier' : ''}`}
                                                    onClick={() => handleOpenModal(item)}
                                                >
                                                    {item.id_agent ? (
                                                        <><Edit2 size={14} /><span>Modifier</span></>
                                                    ) : (
                                                        <><UserPlus size={14} /><span>Affecter</span></>
                                                    )}
                                                </button>


                                            </div>
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
                                <h2>
                                    {selectedItem?.id_agent ? 'Modifier l\'affectation' : 'Nouvelle Affectation'}
                                    - {selectedItem?.nom_guichet}
                                </h2>
                                <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-sm text-slate-500 mb-6">Choisissez un personnel disponible dans la liste :</p>
                                {availableStaff.length > 0 ? (
                                    <div className="space-y-6">
                                        <div className="form-group">
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                                                Choisir un agent
                                            </label>
                                            <select
                                                className="form-select w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                                                value={selectedStaffId}
                                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                            >
                                                <option value="">Sélectionner...</option>
                                                {availableStaff.map(s => (
                                                    <option key={s.id_utilisateur} value={s.id_utilisateur}>
                                                        {s.prenom} {s.nom}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                                                Point de départ du guichet
                                            </label>
                                            <input
                                                className="form-input w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                                                value={stationDepart}
                                                onChange={(e) => setStationDepart(e.target.value)}
                                                placeholder={selectedItem?.emplacement || 'Ex: Tunis'}
                                            />
                                        </div>

                                        <button
                                            className="btn-submit w-full py-4 justify-center"
                                            onClick={handleAssign}
                                            disabled={!selectedStaffId || isSubmitting}
                                        >
                                            {isSubmitting ? "Enregistrement..." : "Confirmer l'affectation"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-slate-50 rounded-xl">
                                        <XCircle className="mx-auto text-slate-300 mb-2" size={32} />
                                        <p className="text-slate-500">Aucun personnel disponible.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CREATE GUICHET MODAL */}
            <AnimatePresence>
                {isAddGuichetModalOpen && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal-content max-w-md" initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }}>
                            <div className="modal-header">
                                <h2>Ajouter un nouveau Guichet</h2>
                                <button className="btn-close" onClick={() => setIsAddGuichetModalOpen(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateGuichet}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nom du Guichet *</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Guichet Ariana"
                                            className="form-input w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                                            value={newGuichet.nom_guichet}
                                            onChange={(e) => setNewGuichet({ ...newGuichet, nom_guichet: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Emplacement</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Station Métro 2"
                                            className="form-input w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                                            value={newGuichet.emplacement}
                                            onChange={(e) => setNewGuichet({ ...newGuichet, emplacement: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn-submit w-full py-4 justify-center"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Création..." : "Créer le Guichet"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Assignments;

import React, { useState, useEffect } from 'react';
import { Bus, UserPlus, Search, Loader2, CheckCircle, XCircle, Users, X, Edit2, Store, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Users.css'; // On réutilise vos styles premium

const Assignments = () => {
    // États généraux
    const [activeTab, setActiveTab] = useState('bus');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // États pour les Bus
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState({ withReceiver: 0, withoutReceiver: 0, availableReceivers: 0 });

    // États pour les Guichets
    const [guichets, setGuichets] = useState([]);
    const [guichetStats, setGuichetStats] = useState({ total: 0, withAgent: 0, withoutAgent: 0, availableAgents: 0 });

    // États du Modal d'Affectation
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // Peut être un bus ou un guichet
    const [availableStaff, setAvailableStaff] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [selectedLigne, setSelectedLigne] = useState('');
    const [stationDepart, setStationDepart] = useState('');
    const [lignes, setLignes] = useState([]);

    // États pour l'Ajout de Guichet
    const [isAddGuichetModalOpen, setIsAddGuichetModalOpen] = useState(false);
    const [newGuichet, setNewGuichet] = useState({ nom_guichet: '', emplacement: '' });

    const fetchBusData = async () => {
        try {
            const [assignRes, statsRes] = await Promise.all([
                fetch('http://localhost:5000/api/assignments'),
                fetch('http://localhost:5000/api/assignments/stats')
            ]);
            setAssignments(await assignRes.json());
            setStats(await statsRes.json());
        } catch (error) {
            console.error("Erreur chargement bus:", error);
        }
    };

    const fetchGuichetData = async () => {
        try {
            const [guichetRes, statsRes, lignesRes] = await Promise.all([
                fetch('http://localhost:5000/api/guichets'),
                fetch('http://localhost:5000/api/guichets/stats'),
                fetch('http://localhost:5000/api/network')
            ]);
            setGuichets(await guichetRes.json());
            setGuichetStats(await statsRes.json());
            setLignes(await lignesRes.json());
        } catch (error) {
            console.error("Erreur chargement guichets:", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        if (activeTab === 'bus') {
            await fetchBusData();
        } else {
            await fetchGuichetData();
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleOpenModal = async (item) => {
        setSelectedItem(item);
        try {
            const endpoint = activeTab === 'bus'
                ? 'http://localhost:5000/api/assignments/available-receivers'
                : 'http://localhost:5000/api/guichets/available-agents';

            const res = await fetch(endpoint);
            let available = await res.json();

            // Ajouter la personne déjà affectée à la liste pour pouvoir la conserver
            const currentStaffId = activeTab === 'bus' ? item.id_receveur : item.id_agent;
            if (currentStaffId) {
                const staffName = activeTab === 'bus'
                    ? { id_utilisateur: item.id_receveur, nom: item.receveur_nom, prenom: item.receveur_prenom }
                    : { id_utilisateur: item.id_agent, nom: item.agent_nom, prenom: item.agent_prenom };

                // Éviter les doublons
                if (!available.find(u => u.id_utilisateur === currentStaffId)) {
                    available.unshift(staffName);
                }
            }
            setAvailableStaff(available);

            if (currentStaffId) {
                setSelectedStaffId(currentStaffId);
                if (activeTab === 'bus') {
                    setDateDebut(item.date_debut_affectation ? new Date(item.date_debut_affectation).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                    setDateFin(item.date_fin_affectation ? new Date(item.date_fin_affectation).toISOString().split('T')[0] : '');
                } else {
                    setSelectedLigne(item.num_ligne || '');
                    setStationDepart(item.station_depart || '');
                }
            } else {
                setSelectedStaffId('');
                if (activeTab === 'bus') {
                    setDateDebut(new Date().toISOString().split('T')[0]);
                    setDateFin('');
                } else {
                    setSelectedLigne('');
                    setStationDepart(item.emplacement || '');
                }
            }

            setIsModalOpen(true);
        } catch (error) {
            alert("Erreur lors de la récupération du personnel disponible");
        }
    };

    const handleAssign = async () => {
        setIsSubmitting(true);
        try {
            const url = activeTab === 'bus'
                ? 'http://localhost:5000/api/assignments/update'
                : 'http://localhost:5000/api/guichets/update';

            const body = activeTab === 'bus' ? {
                id_bus: selectedItem.id_bus,
                id_receveur: selectedStaffId,
                date_debut: dateDebut,
                date_fin: dateFin
            } : {
                id_guichet: selectedItem.id_guichet,
                id_agent: selectedStaffId
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
            alert("Erreur d'affectation");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnassign = async (id) => {
        const msg = activeTab === 'bus'
            ? "Voulez-vous vraiment retirer ce receveur de ce bus ?"
            : "Voulez-vous vraiment retirer cet agent de ce guichet ?";

        if (!window.confirm(msg)) return;

        try {
            const url = activeTab === 'bus'
                ? 'http://localhost:5000/api/assignments/update'
                : 'http://localhost:5000/api/guichets/update';

            const body = activeTab === 'bus'
                ? { id_bus: id, id_receveur: null }
                : { id_guichet: id, id_agent: null };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                await fetchData();
            }
        } catch (error) {
            alert("Erreur lors de la suppression de l'affectation");
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
            alert("Erreur lors de la mise à jour du statut");
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
                alert(data.message || "Erreur lors de la création");
            }
        } catch (error) {
            alert("Erreur de connexion au serveur");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredBus = assignments.filter(a =>
        a.numero_bus.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.receveur_nom && a.receveur_nom.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredGuichets = guichets.filter(g =>
        g.nom_guichet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.agent_nom && g.agent_nom.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="users-container">
            {/* TABS SELECTOR - Premium Style */}
            <div className="flex justify-between items-center mb-8">
                <div className="tabs-container mb-0">
                    <button
                        onClick={() => setActiveTab('bus')}
                        className={`tab-button ${activeTab === 'bus' ? 'active' : ''}`}
                    >
                        <Bus size={20} />
                        <span>Affectation Bus</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('guichet')}
                        className={`tab-button ${activeTab === 'guichet' ? 'active' : ''}`}
                    >
                        <Store size={20} />
                        <span>Agents Guichet</span>
                    </button>
                </div>

                {activeTab === 'guichet' && (
                    <button
                        onClick={() => setIsAddGuichetModalOpen(true)}
                        className="btn-add-user"
                    >
                        <Plus size={18} />
                        <span>Ajouter un Guichet</span>
                    </button>
                )}
            </div>

            {/* STATS CARDS */}
            <div className="stats-grid">
                {activeTab === 'bus' ? (
                    <>
                        <motion.div className="stat-card" style={{ borderLeft: '4px solid #4f46e5' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                            <div className="flex justify-between items-center">
                                <div><p className="text-slate-500 text-sm">Bus avec receveur</p><h3 className="text-3xl font-bold text-slate-800">{stats.withReceiver}</h3></div>
                                <CheckCircle className="text-indigo-500" size={32} />
                            </div>
                        </motion.div>
                        <motion.div className="stat-card" style={{ borderLeft: '4px solid #f97316' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                            <div className="flex justify-between items-center">
                                <div><p className="text-slate-500 text-sm">Bus sans receveur</p><h3 className="text-3xl font-bold text-slate-800">{stats.withoutReceiver}</h3></div>
                                <XCircle className="text-orange-500" size={32} />
                            </div>
                        </motion.div>
                        <motion.div className="stat-card" style={{ borderLeft: '4px solid #10b981' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                            <div className="flex justify-between items-center">
                                <div><p className="text-slate-500 text-sm">Receveurs disponibles</p><h3 className="text-3xl font-bold text-slate-800">{stats.availableReceivers}</h3></div>
                                <Users className="text-emerald-500" size={32} />
                            </div>
                        </motion.div>
                    </>
                ) : (
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
                )}
            </div>

            {/* HEADER & TABLE */}
            <div className="users-table-card">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {activeTab === 'bus' ? 'Affectation Bus - Receveur' : 'Affectation Agent - Guichet'}
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
                                    <th>{activeTab === 'bus' ? 'Bus' : 'Guichet'}</th>
                                    <th>{activeTab === 'bus' ? 'Capacité' : 'Emplacement'}</th>
                                    <th>État</th>
                                    <th>{activeTab === 'bus' ? 'Receveur Affecté' : 'Agent Affecté'}</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(activeTab === 'bus' ? filteredBus : filteredGuichets).map(item => (
                                    <tr key={activeTab === 'bus' ? item.id_bus : item.id_guichet}>
                                        <td className="font-bold text-slate-700">
                                            <div className="flex items-center gap-2">
                                                {activeTab === 'bus' ? <Bus size={16} className="text-indigo-500" /> : <Store size={16} className="text-indigo-500" />}
                                                {activeTab === 'bus' ? `Bus N° ${item.numero_bus}` : item.nom_guichet}
                                            </div>
                                        </td>
                                        <td>{activeTab === 'bus' ? `${item.capacite} places` : item.emplacement}</td>
                                        <td>
                                            <button 
                                                onClick={() => activeTab === 'guichet' && handleToggleStatus(item)}
                                                className={`role-badge ${activeTab === 'bus' ? (item.etat === 'En service' ? 'badge-agent' : 'badge-receveur') : (item.statut === 'Actif' ? 'badge-agent' : 'badge-receveur')} ${activeTab === 'guichet' ? 'cursor-pointer hover:ring-2 hover:ring-indigo-100 transition-all' : ''}`}
                                                title={activeTab === 'guichet' ? "Cliquer pour changer le statut" : ""}
                                                disabled={activeTab === 'bus'}
                                            >
                                                {activeTab === 'bus' ? item.etat : item.statut}
                                            </button>
                                        </td>
                                        <td>
                                            {(activeTab === 'bus' ? item.receveur_nom : item.agent_nom) ? (
                                                <div className="flex items-center justify-between gap-2 group/item">
                                                    <div>
                                                        <div className="text-slate-700 font-medium">
                                                            {activeTab === 'bus' ? `${item.receveur_prenom} ${item.receveur_nom}` : `${item.agent_prenom} ${item.agent_nom}`}
                                                        </div>
                                                        {activeTab === 'bus' && (item.date_debut_affectation || item.date_fin_affectation) && (
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                {item.date_debut_affectation && (
                                                                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-medium border border-slate-200">
                                                                        Du {new Date(item.date_debut_affectation).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                                {item.date_fin_affectation && (
                                                                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-medium border border-slate-200">
                                                                        Au {new Date(item.date_fin_affectation).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {activeTab === 'guichet' && item.emplacement && (
                                                            <div className="flex flex-col gap-1 mt-1.5">
                                                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-medium border border-slate-200 w-fit">
                                                                    Emplacement: {item.emplacement}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleUnassign(activeTab === 'bus' ? item.id_bus : item.id_guichet)}
                                                        className="p-1 rounded-md bg-red-50 text-red-500 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-500 hover:text-white mt-1"
                                                        title="Retirer l'affectation"
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
                                                className={`btn-add-user h-8 py-0 px-4 text-xs ${(activeTab === 'bus' ? item.id_receveur : item.id_agent) ? 'btn-modifier' : ''}`}
                                                onClick={() => handleOpenModal(item)}
                                                disabled={activeTab === 'bus' && item.etat !== 'En service'}
                                                style={activeTab === 'bus' && item.etat !== 'En service' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                            >
                                                {(activeTab === 'bus' ? item.id_receveur : item.id_agent) ? (
                                                    <><Edit2 size={14} /><span>Modifier</span></>
                                                ) : (
                                                    <><UserPlus size={14} /><span>Affecter</span></>
                                                )}
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
                                <h2>
                                    {(activeTab === 'bus' ? selectedItem?.id_receveur : selectedItem?.id_agent) ? 'Modifier l\'affectation' : 'Nouvelle Affectation'}
                                    - {activeTab === 'bus' ? `Bus ${selectedItem?.numero_bus}` : selectedItem?.nom_guichet}
                                </h2>
                                <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-sm text-slate-500 mb-6">Choisissez un personnel disponible dans la liste :</p>
                                {availableStaff.length > 0 ? (
                                    <div className="space-y-6">
                                        <div className="form-group">
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                                                Choisir {activeTab === 'bus' ? 'un receveur' : 'un agent'}
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

                                        {activeTab === 'bus' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="form-group mb-0">
                                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Date de début *</label>
                                                    <input
                                                        type="date"
                                                        className="form-input w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                                                        value={dateDebut}
                                                        onChange={(e) => setDateDebut(e.target.value)}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group mb-0">
                                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Date de fin (Optionnel)</label>
                                                    <input
                                                        type="date"
                                                        className="form-input w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                                                        value={dateFin}
                                                        onChange={(e) => setDateFin(e.target.value)}
                                                        min={dateDebut || new Date().toISOString().split('T')[0]}
                                                    />
                                                </div>
                                            </div>
                                        )}



                                        <button
                                            className="btn-submit w-full py-4 justify-center"
                                            onClick={handleAssign}
                                            disabled={!selectedStaffId || (activeTab === 'bus' && !dateDebut) || isSubmitting}
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

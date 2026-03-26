import React, { useState, useEffect } from 'react';
import { Bus, Plus, Edit2, Trash2, Loader2, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Users.css';

const Fleet = () => {
    // --- ÉTATS ---
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(''); // État pour la recherche
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingBus, setEditingBus] = useState(null);

    const [formData, setFormData] = useState({
        numero_bus: '',
        capacite: '',
        etat: 'En service'
    });

    // --- CHARGEMENT DES DONNÉES ---
    const fetchBuses = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/buses');
            const data = await response.json();
            setBuses(data);
        } catch (error) {
            console.error("Erreur chargement bus:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBuses();
    }, []);

    // --- LOGIQUE DE RECHERCHE ---
    const filteredBuses = buses.filter(bus =>
        bus.numero_bus.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bus.etat.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- GESTION DU MODAL ---
    const handleOpenAddModal = () => {
        setEditingBus(null);
        setFormData({ numero_bus: '', capacite: '', etat: 'En service' });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (bus) => {
        setEditingBus(bus);
        setFormData({
            numero_bus: bus.numero_bus,
            capacite: bus.capacite,
            etat: bus.etat
        });
        setIsModalOpen(true);
    };

    // --- ACTIONS API (AJOUT / MODIF / SUPPRIMER) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const url = editingBus
            ? `http://localhost:5000/api/buses/${editingBus.id_bus}`
            : 'http://localhost:5000/api/buses';
        const method = editingBus ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await fetchBuses();
                setIsModalOpen(false);
            } else {
                const err = await response.json();
                alert(err.message || "Erreur lors de l'opération");
            }
        } catch (error) {
            alert("Erreur de connexion");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBus = async (id) => {
        if (!window.confirm("🗑️ Voulez-vous vraiment supprimer ce bus ?")) return;
        try {
            const response = await fetch(`http://localhost:5000/api/buses/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setBuses(buses.filter(b => b.id_bus !== id));
            }
        } catch (error) {
            alert("Erreur lors de la suppression");
        }
    };

    // --- DESIGN DES BADGES ---
    const getStatusBadge = (etat) => {
        const s = etat.toLowerCase();
        if (s === 'en service') return <span className="role-badge badge-agent">En service</span>;
        if (s === 'maintenance') return <span className="role-badge badge-receveur">Maintenance</span>;
        return <span className="role-badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>{etat}</span>;
    };

    return (
        <div className="users-container">
            {/* --- HEADER AVEC BARRE DE RECHERCHE --- */}
            <div className="users-header-card">
                <div className="header-titles">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Bus size={24} color="#1e293b" />
                        Gestion de la Flotte
                    </h1>
                    <p>Liste des bus et leur état en temps réel</p>
                </div>

                <div className="header-actions">
                    {/* BARRE DE RECHERCHE */}
                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher numéro ou état..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <button className="btn-add-user" onClick={handleOpenAddModal}>
                        <Plus size={18} />
                        <span>Ajouter Bus</span>
                    </button>
                </div>
            </div>

            {/* --- TABLEAU --- */}
            <div className="users-table-card">
                {loading ? (
                    <div className="loading-state" style={{ padding: '5rem', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" size={40} />
                        <p>Synchronisation avec la base de données...</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Numéro</th>
                                    <th>Capacité</th>
                                    <th>État</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {filteredBuses.length > 0 ? (
                                        filteredBuses.map((bus) => (
                                            <motion.tr
                                                key={bus.id_bus}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <td><span style={{ fontWeight: 600, color: '#64748b' }}>#{bus.id_bus}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: 600 }}>
                                                        <Bus size={19} color="#4f46e5" />
                                                        {bus.numero_bus}
                                                    </div>
                                                </td>
                                                <td><span style={{ color: '#64748b' }}>{bus.capacite} places</span></td>
                                                <td>{getStatusBadge(bus.etat)}</td>
                                                <td>
                                                    <div className="row-actions">
                                                        <button title="Éditer" className="action-btn btn-edit" onClick={() => handleOpenEditModal(bus)}>
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button title="Supprimer" className="action-btn btn-trash" onClick={() => handleDeleteBus(bus.id_bus)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="empty-state">
                                                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                                    <Search size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                                                    <p>Aucun bus trouvé pour "{searchQuery}"</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- MODAL --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal-content" initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }}>
                            <div className="modal-header">
                                <h2>{editingBus ? 'Modifier le bus' : 'Ajouter un nouveau bus'}</h2>
                                <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Numéro du Bus</label>
                                        <input
                                            type="text" required className="form-input"
                                            value={formData.numero_bus}
                                            onChange={(e) => setFormData({ ...formData, numero_bus: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Capacité (Places)</label>
                                        <input
                                            type="number" required className="form-input"
                                            value={formData.capacite}
                                            onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>État</label>
                                        <select
                                            className="form-select"
                                            value={formData.etat}
                                            onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
                                        >
                                            <option value="En service">En service</option>
                                            <option value="Maintenance">Maintenance</option>
                                            <option value="En panne">En panne</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Annuler</button>
                                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Enregistrer'}
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

export default Fleet;



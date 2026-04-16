import React, { useState, useEffect } from 'react';
import { Bus, Plus, Edit2, Trash2, Loader2, X, Search, Eye, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Users.css';

const Fleet = () => {
    // --- ÉTATS ---
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(''); // État pour la recherche
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewingBus, setViewingBus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingBus, setEditingBus] = useState(null);
    const [lines, setLines] = useState([]); // Pour stocker la liste des lignes
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        numero_bus: '',
        capacite: '',
        etat: 'En service',
        num_ligne: '', // Nouvelle colonne
        horaire_affecte: '' // L'horaire précis assigné
    });

    // --- CHARGEMENT DES DONNÉES ---
    const fetchLines = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/network');
            const data = await response.json();
            setLines(data);
        } catch (error) {
            console.error("Erreur chargement lignes:", error);
        }
    };

    const fetchBuses = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/buses');
            const data = await response.json();
            setBuses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erreur chargement bus:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBuses();
        fetchLines(); // Chargement initial des lignes
    }, []);

    // --- LOGIQUE DE RECHERCHE ---
    const filteredBuses = buses.filter(bus =>
        bus.numero_bus.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bus.etat.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- GESTION DU MODAL ---
    const handleOpenAddModal = () => {
        setEditingBus(null);
        setFormData({ numero_bus: '', capacite: '', etat: 'En service', num_ligne: '' });
        setImageFile(null);
        setImagePreview(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (bus) => {
        setEditingBus(bus);
        setFormData({
            numero_bus: bus.numero_bus,
            capacite: bus.capacite,
            etat: bus.etat,
            num_ligne: bus.num_ligne || '',
            horaire_affecte: bus.horaire_affecte || ''
        });
        setImageFile(null);
        setImagePreview(bus.image_url ? `http://localhost:5000/${bus.image_url}` : null);
        setIsModalOpen(true);
    };

    const handleOpenDetailsModal = (bus) => {
        setViewingBus(bus);
        setIsDetailsModalOpen(true);
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
            const data = new FormData();
            data.append('numero_bus', formData.numero_bus);
            data.append('capacite', formData.capacite);
            data.append('etat', formData.etat);
            data.append('num_ligne', formData.num_ligne);
            data.append('horaire_affecte', formData.horaire_affecte);
            
            if (imageFile) {
                data.append('image', imageFile);
            } else if (editingBus && editingBus.image_url) {
                data.append('image_url', editingBus.image_url);
            }

            const response = await fetch(url, {
                method: method,
                // Ne pas mettre de Content-Type pour FormData, le navigateur s'en occupe
                body: data
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
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
                                    <th>Numéro</th>
                                    <th>Capacité</th>
                                    <th>Ligne Assignée</th>
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
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: 600 }}>
                                                        <Bus size={19} color="#4f46e5" />
                                                        {bus.numero_bus}
                                                    </div>
                                                </td>
                                                <td><span style={{ color: '#64748b' }}>{bus.capacite} places</span></td>
                                                <td>
                                                    {bus.ville_depart ? (
                                                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                                                            <span style={{ fontWeight: 600, color: '#4f46e5' }}>L{bus.num_ligne}</span> : {bus.ville_depart} ➔ {bus.ville_arrivee}
                                                            {bus.horaire_affecte && <div style={{ marginTop: '4px', display: 'inline-block', marginLeft: '6px', background: '#eef2ff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#4338ca' }}>🕒 {bus.horaire_affecte}</div>}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>Non assigné</span>
                                                    )}
                                                </td>
                                                <td>{getStatusBadge(bus.etat)}</td>
                                                <td>
                                                    <div className="row-actions">
                                                        <button title="Voir détails" className="action-btn btn-view" onClick={() => handleOpenDetailsModal(bus)}>
                                                            <Eye size={16} />
                                                        </button>
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
                                            <td colSpan="6" className="empty-state">
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
                                        <label>Ligne Assignée</label>
                                        <select
                                            className="form-select"
                                            value={formData.num_ligne}
                                            onChange={(e) => setFormData({ ...formData, num_ligne: e.target.value, horaire_affecte: '' })}
                                        >
                                            <option value="">-- Aucune ligne --</option>
                                            {lines.map((line) => (
                                                <option key={line.num_ligne} value={line.num_ligne}>
                                                    Ligne {line.num_ligne} : {line.ville_depart} ➔ {line.ville_arrivee}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {formData.num_ligne && (
                                        <div className="form-group">
                                            <label>Horaire Assigné</label>
                                            <select
                                                className="form-select"
                                                value={formData.horaire_affecte || ''}
                                                onChange={(e) => setFormData({ ...formData, horaire_affecte: e.target.value })}
                                            >
                                                <option value="">-- Sélectionnez l'horaire du voyage --</option>
                                                {(() => {
                                                    const selectedLineData = lines.find(l => String(l.num_ligne) === String(formData.num_ligne));
                                                    if (!selectedLineData) return null;
                                                    let hList = [];
                                                    if (selectedLineData.horaires && selectedLineData.horaires.length > 0 && selectedLineData.horaires[0] !== null) {
                                                        hList = selectedLineData.horaires;
                                                    } else if (selectedLineData.horaire) {
                                                        hList = [selectedLineData.horaire];
                                                    }
                                                    return hList.map((h, idx) => (
                                                        <option key={idx} value={h}>{h}</option>
                                                    ));
                                                })()}
                                            </select>
                                        </div>
                                    )}
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
                                    
                                    <div className="form-group" style={{ gridColumn: 'span 1' }}>
                                        <label>Photo du Bus</label>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '5px' }}>
                                            <div style={{ width: '80px', height: '60px', borderRadius: '12px', background: '#f8fafc', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                {imagePreview ? (
                                                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <Plus size={20} color="#94a3b8" />
                                                )}
                                            </div>
                                            <label 
                                                htmlFor="bus-photo-upload" 
                                                style={{ 
                                                    padding: '10px 18px', 
                                                    fontSize: '0.85rem', 
                                                    cursor: 'pointer', 
                                                    background: '#eef2ff', 
                                                    color: '#4318FF', 
                                                    borderRadius: '10px',
                                                    border: '1px solid #e0e7ff',
                                                    fontWeight: 600,
                                                    transition: 'all 0.2s ease',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                                onMouseOver={(e) => e.target.style.background = '#e0e7ff'}
                                                onMouseOut={(e) => e.target.style.background = '#eef2ff'}
                                            >
                                                <Plus size={16} />
                                                {imagePreview ? 'Modifier la photo' : 'Choisir une photo'}
                                            </label>
                                            <input 
                                                id="bus-photo-upload"
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleImageChange}
                                                style={{ display: 'none' }}
                                            />
                                        </div>
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

            {/* --- MODAL DE DÉTAILS --- */}
            <AnimatePresence>
                {isDetailsModalOpen && viewingBus && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDetailsModalOpen(false)}>
                        <motion.div 
                            className="modal-content detail-modal" 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: '600px' }}
                        >
                            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ backgroundColor: '#eef2ff', padding: '12px', borderRadius: '15px' }}>
                                        <Bus size={30} color="#4318FF" />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Détails du Bus {viewingBus.numero_bus}</h2>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>ID interne : #{viewingBus.id_bus}</p>
                                    </div>
                                </div>
                                <button className="btn-close" onClick={() => setIsDetailsModalOpen(false)}><X size={20} /></button>
                            </div>

                            <div className="modal-body" style={{ marginTop: '20px' }}>
                                {/* Image du Bus en haut */}
                                {viewingBus.image_url && (
                                    <div style={{ width: '100%', height: '220px', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 8px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                                        <img 
                                            src={`http://localhost:5000/${viewingBus.image_url}`} 
                                            alt="Bus" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    {/* Carte Statut */}
                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                                            <ShieldCheck size={16} /> État du véhicule
                                        </div>
                                        {getStatusBadge(viewingBus.etat)}
                                        <div style={{ marginTop: '15px', color: '#1e293b', fontWeight: 600 }}>
                                            Capacité : <span style={{ color: '#4318FF' }}>{viewingBus.capacite} passagers</span>
                                        </div>
                                    </div>

                                    {/* Carte Horaire */}
                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                                            <Clock size={16} /> Planification
                                        </div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1b2559' }}>
                                            {viewingBus.horaire_affecte || 'Non planifié'}
                                        </div>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Horaire de départ prévu</p>
                                    </div>
                                </div>

                                {/* Carte Itinéraire */}
                                <div style={{ marginTop: '20px', background: 'linear-gradient(135deg, #4318FF 0%, #1b2559 100%)', padding: '25px', borderRadius: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1 }}>
                                        <Bus size={120} color="white" />
                                    </div>
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '15px' }}>
                                            <MapPin size={16} /> Itinéraire Actif
                                        </div>
                                        {viewingBus.num_ligne ? (
                                            <>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '5px' }}>Ligne {viewingBus.num_ligne}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{viewingBus.ville_depart}</span>
                                                    <div style={{ height: '2px', flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', right: 0, top: '-4px', width: '10px', height: '10px', backgroundColor: 'white', borderRadius: '50%' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{viewingBus.ville_arrivee}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ fontStyle: 'italic', opacity: 0.7 }}>Aucune ligne assignée actuellement</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer" style={{ borderTop: 'none' }}>
                                <button className="btn-cancel" style={{ width: '100%' }} onClick={() => setIsDetailsModalOpen(false)}>Fermer</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Fleet;



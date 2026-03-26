import React, { useState, useEffect } from 'react';
import {
    Network as NetIcon, MapPin, Clock, Plus, Trash2, X, Edit2,
    ChevronRight, Search, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Users.css'; // On utilise votre CSS centralisé

const Network = () => {
    const [lines, setLines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        ville_depart: '', ville_arrivee: '', horaire: '', statut_ligne: 'Active',
        stations: [{ arret: '', distance_km: '' }]
    });

    useEffect(() => { fetchNetwork(); }, []);

    const fetchNetwork = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/network');
            const data = await res.json();
            setLines(data);
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    const handleOpenModal = (line = null) => {
        if (line) {
            setEditingId(line.num_ligne);
            // Formatage de l'heure pour le input type="time"
            const time = new Date(line.horaire).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            setFormData({
                ville_depart: line.ville_depart, ville_arrivee: line.ville_arrivee,
                horaire: time, statut_ligne: line.statut_ligne,
                stations: line.stations
            });
        } else {
            setEditingId(null);
            setFormData({ ville_depart: '', ville_arrivee: '', horaire: '', statut_ligne: 'Active', stations: [{ arret: '', distance_km: '' }] });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("🗑️ Supprimer cette ligne et tous ses trajets ?")) return;
        const res = await fetch(`http://localhost:5000/api/network/${id}`, { method: 'DELETE' });
        if (res.ok) fetchNetwork();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `http://localhost:5000/api/network/${editingId}` : 'http://localhost:5000/api/network';
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            setIsModalOpen(false);
            fetchNetwork();
        }
    };

    // Fonctions stations
    const addStation = () => setFormData({ ...formData, stations: [...formData.stations, { arret: '', distance_km: '' }] });
    const removeStation = (idx) => setFormData({ ...formData, stations: formData.stations.filter((_, i) => i !== idx) });
    const updateSt = (idx, field, val) => {
        const newSt = [...formData.stations];
        newSt[idx][field] = val;
        setFormData({ ...formData, stations: newSt });
    };

    return (
        <div className="users-container">
            <div className="users-header-card">
                <div className="header-titles">
                    <h1>Gestion du Réseau</h1>
                    <p>{lines.length} lignes configurées sur le réseau TuniMove</p>
                </div>
                <button className="btn-add-user" onClick={() => handleOpenModal()}>
                    <Plus size={20} /> Nouvelle Ligne
                </button>
            </div>

            <div className="users-table-card">
                {loading ? (
                    <div className="loading-state"><Loader2 className="animate-spin" size={40} /><p>Chargement du réseau...</p></div>
                ) : (
                    <table className="enterprise-table">
                        <thead>
                            <tr>
                                <th>Ligne</th>
                                <th>Horaire</th>
                                <th>Stations</th>
                                <th>Statut</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map(line => (
                                <tr key={line.num_ligne}>
                                    <td>
                                        <div className="user-info-cell">
                                            <div className="user-avatar"><NetIcon size={18} /></div>
                                            <div>
                                                <div className="user-name">{line.ville_depart} → {line.ville_arrivee}</div>

                                            </div>
                                        </div>
                                    </td>
                                    <td><div className="user-matricule"><Clock size={14} style={{ marginRight: '5px' }} /> {new Date(line.horaire).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></td>
                                    <td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '300px' }}>
                                            {line.stations.length > 0 ? (
                                                line.stations.map((st, idx) => (
                                                    <span key={idx} style={{
                                                        fontSize: '0.7rem', background: '#f8fafc', padding: '2px 8px',
                                                        borderRadius: '6px', border: '1px solid #e2e8f0', color: '#64748b'
                                                    }}>
                                                        {st.arret}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="user-email" style={{ fontStyle: 'italic' }}>Aucun arrêt intermédiaire</span>
                                            )}
                                        </div>
                                    </td>
                                    <td><span className={`role-badge ${line.statut_ligne === 'Active' ? 'badge-agent' : 'badge-receveur'}`}>{line.statut_ligne}</span></td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="action-btn btn-edit" onClick={() => handleOpenModal(line)}><Edit2 size={16} /></button>
                                            <button className="action-btn btn-trash" onClick={() => handleDelete(line.num_ligne)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL (Réutilisé pour Ajout et Edit) */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
                        <motion.div className="network-modal-card" onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="modal-header-premium">
                                <div><span className="net-badge">{editingId ? 'MODIFICATION' : 'NOUVEAU RÉSEAU'}</span><h2>{editingId ? 'Modifier la Ligne' : "Ajout d'une Ligne"}</h2></div>
                                <button className="x-btn" onClick={() => setIsModalOpen(false)}><X /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="p-grid">
                                    <div className="p-field"><label>DÉPART</label><div className="p-input"><MapPin size={16} /><input type="text" value={formData.ville_depart} onChange={e => setFormData({ ...formData, ville_depart: e.target.value })} required /></div></div>
                                    <div className="p-field"><label>ARRIVÉE</label><div className="p-input"><ChevronRight size={16} /><input type="text" value={formData.ville_arrivee} onChange={e => setFormData({ ...formData, ville_arrivee: e.target.value })} required /></div></div>
                                    <div className="p-field"><label>HORAIRE</label><div className="p-input"><Clock size={16} /><input type="time" value={formData.horaire} onChange={e => setFormData({ ...formData, horaire: e.target.value })} required /></div></div>
                                    <div className="p-field"><label>STATUT</label><select className="p-input" value={formData.statut_ligne} onChange={e => setFormData({ ...formData, statut_ligne: e.target.value })}><option value="Active">Active</option><option value="Ligne Fermé">Ligne Fermé</option></select></div>
                                </div>
                                <div className="st-passage">
                                    <h3>Stations de passage <span className="st-count">{formData.stations.length}</span></h3>
                                    <div className="st-list">
                                        {formData.stations.map((st, i) => (
                                            <div key={i} className="st-item">
                                                <span className="st-number">{i + 1}</span>
                                                <input className="st-name-input" placeholder="Nom station" value={st.arret} onChange={e => updateSt(i, 'arret', e.target.value)} required />
                                                <div className="st-km"><input type="number" value={st.distance_km} onChange={e => updateSt(i, 'distance_km', e.target.value)} /><span>km</span></div>
                                                <button type="button" className="st-remove" onClick={() => removeStation(i)}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" className="st-add-btn" onClick={addStation}><Plus size={16} /> Ajouter station</button>
                                </div>
                                <div className="modal-actions-premium">
                                    <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
                                    <button type="submit" className="btn-primary-gradient">{editingId ? 'Enregistrer' : 'Créer'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Network;

import React, { useState, useEffect } from 'react';
import {
    Network as NetIcon, MapPin, Clock, Plus, Trash2, X, Edit2,
    ChevronRight, Search, Loader2, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showConfirm, showAlert } from '../../utils/alert';
import './Users.css';

const Network = () => {
    const [lines, setLines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        ville_depart: '', ville_arrivee: '', horaires: [''], statut_ligne: 'Active',
        stations: [{ arret: '', distance_km: '', duree_minutes: '' }]
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
            setFormData({
                ville_depart: line.ville_depart, ville_arrivee: line.ville_arrivee,
                horaires: (line.horaires && line.horaires.length > 0) ? line.horaires : [''], statut_ligne: line.statut_ligne,
                stations: line.stations
            });
        } else {
            setEditingId(null);
            setFormData({ ville_depart: '', ville_arrivee: '', horaires: [''], statut_ligne: 'Active', stations: [{ arret: '', distance_km: '', duree_minutes: '' }] });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const isConfirmed = await showConfirm(
            "Supprimer la ligne",
            "Voulez-vous vraiment supprimer cette ligne et tous ses trajets ?",
            "Oui, Supprimer"
        );
        if (!isConfirmed) return;
        const res = await fetch(`http://localhost:5000/api/network/${id}`, { method: 'DELETE' });
        if (res.ok) fetchNetwork();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const url = editingId ? `http://localhost:5000/api/network/${editingId}` : 'http://localhost:5000/api/network';
        const method = editingId ? 'PUT' : 'POST';

        setIsSubmitting(true);
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setIsModalOpen(false);
                fetchNetwork();
            } else {
                alert(data.message || "Impossible d'enregistrer cette ligne.");
            }
        } catch (error) {
            console.error(error);
            alert("Erreur de connexion au serveur.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonctions stations
    const addStation = () => setFormData({ ...formData, stations: [...formData.stations, { arret: '', distance_km: '', duree_minutes: '' }] });
    const removeStation = (idx) => setFormData({ ...formData, stations: formData.stations.filter((_, i) => i !== idx) });
    const updateSt = (idx, field, val) => {
        const newSt = [...formData.stations];
        newSt[idx][field] = val;
        setFormData({ ...formData, stations: newSt });
    };

    // Fonctions horaires
    const addHoraire = () => setFormData({ ...formData, horaires: [...(formData.horaires || []), ''] });
    const removeHoraire = (idx) => setFormData({ ...formData, horaires: (formData.horaires || []).filter((_, i) => i !== idx) });
    const updateHoraire = (idx, val) => {
        const newH = [...(formData.horaires || [])];
        newH[idx] = val;
        setFormData({ ...formData, horaires: newH });
    };

    const calculateArrivalTime = (departureTime, cumulativeMinutes) => {
        if (!departureTime) return '';
        const [hours, minutes] = departureTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes + cumulativeMinutes, 0, 0);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredLines = lines.filter(l =>
        `${l.ville_depart} ${l.ville_arrivee} ${l.num_ligne}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const tableHtml = document.querySelector('.enterprise-table').outerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Réseau TuniMove</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        h1 { color: #1e293b; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
                        th { background-color: #f8fafc; font-weight: bold; text-transform: uppercase; font-size: 12px; }
                        .role-badge { border: 1px solid #ccc; padding: 4px 10px; border-radius: 99px; font-size: 10px; font-weight: bold; }
                        .actions-col, .row-actions, .btn-add-user, .search-wrapper, .screen-only { display: none !important; }
                        .print-only { display: block !important; white-space: normal; }
                        .user-info-cell { display: flex; align-items: center; gap: 10px; }
                        .user-avatar { display: none; }
                    </style>
                </head>
                <body>
                    <h1>Réseau des Lignes - TuniMove</h1>
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
            <div className="users-header-card">
                <div className="header-titles">
                    <h1>Gestion du Réseau</h1>
                    <p>{lines.length} lignes configurées sur le réseau TuniMove</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-add-user" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }} onClick={handlePrint}>
                        <Printer size={20} /> Imprimer Liste
                    </button>
                    <button className="btn-add-user" onClick={() => handleOpenModal()}>
                        <Plus size={20} /> Nouvelle Ligne
                    </button>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div style={{ marginBottom: 16 }}>
                <div className="search-wrapper search-wrapper--light" style={{ width: '100%' }}>
                    <Search className="search-icon" size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher par ville départ, arrivée ou numéro..."
                        className="search-input"
                        style={{ width: '100%' }}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
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
                                <th style={{ textAlign: 'center' }} className="actions-col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLines.map(line => (
                                <tr key={line.num_ligne}>
                                    <td>
                                        <div className="user-info-cell">
                                            <div className="user-avatar"><NetIcon size={18} /></div>
                                            <div>
                                                <div className="user-name">{line.ville_depart} → {line.ville_arrivee}</div>

                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ maxWidth: '220px' }}>
                                            {(line.horaires && line.horaires.length > 0 && line.horaires[0] !== null) ? (
                                                <>
                                                    <select className="stations-select screen-only" defaultValue="">
                                                        <option value="" disabled>🕒 {line.horaires.length} Horaires</option>
                                                        {line.horaires.map((h, i) => (
                                                            <option key={i} value={h} disabled>{h}</option>
                                                        ))}
                                                    </select>
                                                    <div className="print-only" style={{ display: 'none', color: '#334155', fontWeight: 600 }}>
                                                        🕒 {line.horaires.join(', ')}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="user-matricule" style={{ textAlign: 'center' }}>-</div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ maxWidth: '300px' }}>
                                            {line.stations.length > 0 ? (
                                                <>
                                                    <select
                                                        className="stations-select screen-only"
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled> {line.stations.length} Stations</option>
                                                        {line.stations.map((st, idx) => {
                                                            return (
                                                                <option key={idx} value={st.arret} disabled>
                                                                    {idx + 1}. {st.arret} 
                                                                    {st.distance_km ? ` - ${st.distance_km} km` : ''} 
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                    <div className="print-only" style={{ display: 'none', margin: '4px 0' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            {line.stations.map((st, idx) => {
                                                                return (
                                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                                                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', border: '1px solid #e2e8f0' }}>
                                                                            {idx + 1}
                                                                        </span>
                                                                        <span style={{ fontWeight: '700', color: '#1e293b' }}>{st.arret}</span>
                                                                        {st.distance_km && (
                                                                            <span style={{ color: '#64748b', fontSize: '11px', background: '#f8fafc', padding: '1px 5px', borderRadius: '4px' }}>
                                                                                {st.distance_km} km
                                                                            </span>
                                                                        )}
                                                                        {st.duree_minutes && (
                                                                            <span style={{ color: '#0f172a', fontSize: '11px', fontWeight: 'bold' }}>
                                                                                ⏱️ {st.duree_minutes} min
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="user-email" style={{ fontStyle: 'italic' }}>Aucun arrêt intermédiaire</span>
                                            )}
                                        </div>
                                    </td>
                                    <td><span className={`role-badge ${line.statut_ligne === 'Active' ? 'badge-agent' : 'badge-receveur'}`}>{line.statut_ligne}</span></td>
                                    <td className="actions-col">
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
                                    <div className="p-field" style={{ gridColumn: '1 / -1' }}><label>STATUT</label><select className="p-input" value={formData.statut_ligne} onChange={e => setFormData({ ...formData, statut_ligne: e.target.value })}><option value="Active">Active</option><option value="Ligne Fermé">Ligne Fermé</option></select></div>
                                </div>
                                <div className="st-passage">
                                    <h3>Horaires de Départ <span className="st-count">{formData.horaires?.length || 0}</span></h3>
                                    <div className="st-list">
                                        {(formData.horaires || []).map((h, i) => (
                                            <div key={i} className="st-item">
                                                <span className="st-number">{i + 1}</span>
                                                <div className="st-km" style={{flex: 1}}><Clock size={16} /><input type="time" style={{border: 'none', background: 'transparent', outline: 'none', width: '100%', marginLeft: '10px'}} value={h} onChange={e => updateHoraire(i, e.target.value)} required /></div>
                                                <button type="button" className="st-remove" onClick={() => removeHoraire(i)}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" className="st-add-btn" onClick={addHoraire}><Plus size={16} /> Ajouter horaire</button>
                                </div>
                                <div className="st-passage">
                                    <h3>Stations de passage <span className="st-count">{formData.stations.length}</span></h3>
                                    <div className="st-list">
                                        {formData.stations.map((st, i) => (
                                            <div key={i} className="st-item">
                                                <span className="st-number">{i + 1}</span>
                                                <input className="st-name-input" placeholder="Nom station" value={st.arret} onChange={e => updateSt(i, 'arret', e.target.value)} required />
                                                <div className="st-km" style={{width: '100px'}}><input type="number" placeholder="Km" value={st.distance_km} onChange={e => updateSt(i, 'distance_km', e.target.value)} /><span style={{fontSize: '10px', marginLeft: '4px'}}>km</span></div>
                                                <div className="st-km" style={{width: '120px'}}><Clock size={14} style={{marginRight: '5px'}} /><input type="number" placeholder="Min" value={st.duree_minutes} onChange={e => updateSt(i, 'duree_minutes', e.target.value)} /><span style={{fontSize: '10px', marginLeft: '4px'}}>min</span></div>
                                                <button type="button" className="st-remove" onClick={() => removeStation(i)}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" className="st-add-btn" onClick={addStation}><Plus size={16} /> Ajouter station</button>
                                </div>
                                <div className="modal-actions-premium">
                                    <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Annuler</button>
                                    <button type="submit" className="btn-primary-gradient" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (editingId ? 'Enregistrer' : 'Créer')}
                                    </button>
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

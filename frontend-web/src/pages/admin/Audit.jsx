import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Loader2, History, Bus, AlertCircle, Search, Eye, X, User, MapPin, Tag, FileText, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showConfirm, showAlert } from '../../utils/alert';
import './Users.css'; // On utilise tes styles existants

const Audit = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecord, setSelectedRecord] = useState(null);

    const fetchRecords = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/audit');
            const data = await res.json();
            setRecords(data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchRecords(); }, []);

    const handleAction = async (id, statut) => {
        const isConfirmed = await showConfirm(
            "Confirmer le statut",
            `Confirmer le statut : ${statut} ?`,
            "Oui, Confirmer"
        );
        if (!isConfirmed) return;
        try {
            await fetch(`http://localhost:5000/api/audit/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statut })
            });
            fetchRecords();
        } catch (e) { showAlert("Erreur", "Une erreur est survenue.", "error"); }
    };

    return (
        <div className="users-container">
            <div className="users-header-card">
                <div className="header-titles">
                    <h1>
                        <History size={24} style={{ verticalAlign: 'middle', marginRight: '10px', color: '#4f46e5' }} />
                        Fiches de Service
                    </h1>
                    <p>Consultation et suivi des fiches de clôture de service</p>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div style={{ marginBottom: 16 }}>
                <div className="search-wrapper search-wrapper--light" style={{ width: '100%' }}>
                    <Search className="search-icon" size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher par personnel, guichet, ligne, bus..."
                        className="search-input"
                        style={{ width: '100%' }}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="users-table-card">
                {loading ? (
                    <div className="loading-state" style={{ padding: '5rem', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" size={40} />
                        <p>Chargement des données...</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th>Personnel</th>
                                    <th>Affectation / Guichet</th>
                                    <th>Connexion / Clôture</th>
                                    <th>Recette Totale</th>
                                    <th>Tickets</th>
                                    <th>Motif</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode='popLayout'>
                                    {(records.filter(r =>
                                        `${r.receveur_prenom} ${r.receveur_nom} ${r.num_ligne} ${r.numero_bus} ${r.nom_guichet} ${r.ville_depart} ${r.ville_arrivee}`.toLowerCase().includes(searchQuery.toLowerCase())
                                    )).length > 0 ? (
                                        records.filter(r =>
                                            `${r.receveur_prenom} ${r.receveur_nom} ${r.num_ligne} ${r.numero_bus} ${r.nom_guichet} ${r.ville_depart} ${r.ville_arrivee}`.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map(r => (
                                            <motion.tr key={r.id_fiche} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ 
                                                            width: '32px', 
                                                            height: '32px', 
                                                            borderRadius: '50%', 
                                                            background: r.agent_role === 'AGENT' ? '#eef2ff' : (r.agent_role === 'RECEVEUR' ? '#ecfdf5' : '#fff7ed'), 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            color: r.agent_role === 'AGENT' ? '#4f46e5' : (r.agent_role === 'RECEVEUR' ? '#059669' : '#f97316')
                                                        }}>
                                                            {r.agent_role === 'CONTROLEUR' ? <Shield size={16} /> : <User size={16} />}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem' }}>
                                                                {r.receveur_prenom} {r.receveur_nom}
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                                                                {r.agent_role} • {r.receveur_matricule}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {r.agent_role === 'AGENT' ? (
                                                        <div style={{ fontSize: '1rem', color: '#64748b' }}>
                                                            <span style={{ fontWeight: 800, color: '#4f46e5' }}>{r.nom_guichet || 'Guichet Principal'}</span>
                                                            <div style={{ fontSize: '0.85rem' }}>Vente</div>
                                                        </div>
                                                    ) : r.agent_role === 'RECEVEUR' ? (
                                                        <div style={{ fontSize: '1rem', color: '#64748b' }}>
                                                            <span style={{ fontWeight: 800, color: '#059669' }}>Ligne {r.num_ligne}</span>
                                                            <div style={{ fontSize: '0.85rem' }}>{r.ville_depart} ↔ {r.ville_arrivee}</div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                                 <Bus size={14} /> <span>N° {r.numero_bus}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: '1rem', color: '#64748b' }}>
                                                            <span style={{ fontWeight: 800, color: '#f97316' }}>Contrôle Itinérant</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                                                        {new Date(r.heure_cloture).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={12} color="#4f46e5" /> {r.heure_connexion ? new Date(r.heure_connexion).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                        </span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={12} color="#ef4444" /> {new Date(r.heure_cloture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {r.agent_role === 'CONTROLEUR' ? (
                                                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>—</span>
                                                    ) : (
                                                        <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#0f172a' }}>{parseFloat(r.total_collecte || 0).toFixed(3)} TND</span>
                                                    )}
                                                </td>
                                                <td><span className="user-matricule" style={{ fontSize: '1.05rem', background: '#f1f5f9', color: '#475569' }}>{r.tickets_count} tickets</span></td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem', color: r.motif_cloture?.includes('INCIDENT') ? '#ef4444' : '#64748b', fontWeight: 600 }}>
                                                        {r.motif_cloture || '—'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="row-actions" style={{ opacity: 1, gap: '10px', justifyContent: 'center' }}>
                                                        <button 
                                                            className="btn-add-user" 
                                                            style={{ padding: '0.6rem 1rem', background: '#3b82f6', boxShadow: 'none', fontSize: '0.95rem' }} 
                                                            onClick={() => setSelectedRecord(r)}
                                                        >
                                                            <Eye size={16} /> Détails
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="8" className="empty-state">Aucune fiche trouvée.</td></tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL DE DÉTAILS DE LA FICHE */}
            <AnimatePresence>
                {selectedRecord && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRecord(null)}>
                        <motion.div 
                            className="modal-content" 
                            style={{ maxWidth: '750px', width: '90%', padding: '0' }}
                            initial={{ y: 50, scale: 0.95 }} 
                            animate={{ y: 0, scale: 1 }} 
                            exit={{ y: 50, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '1.5rem', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
                                <div>
                                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#1e293b' }}>
                                        <FileText className="text-indigo-600" size={24} />
                                        Fiche de Clôture #{selectedRecord.agent_role === 'AGENT' ? 'A' : (selectedRecord.agent_role === 'RECEVEUR' ? 'R' : 'C')}{String(selectedRecord.id_fiche).padStart(3, '0')}
                                    </h2>
                                </div>
                                <button className="btn-close" onClick={() => setSelectedRecord(null)} style={{ background: 'white', border: '1px solid #e2e8f0' }}><X size={20} /></button>
                            </div>
                            
                            <div className="modal-body" style={{ padding: '2rem', background: '#fff' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    
                                    {/* Section Personnel */}
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <User size={14} /> Personnel
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '50%',
                                                background: selectedRecord.agent_role === 'AGENT' ? '#eef2ff' : (selectedRecord.agent_role === 'RECEVEUR' ? '#ecfdf5' : '#fff7ed'),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: selectedRecord.agent_role === 'AGENT' ? '#4f46e5' : (selectedRecord.agent_role === 'RECEVEUR' ? '#059669' : '#f97316'),
                                                fontSize: '1.2rem',
                                                fontWeight: 800,
                                                border: '2px solid #fff',
                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                                                overflow: 'hidden',
                                                flexShrink: 0
                                            }}>
                                                {selectedRecord.receveur_image_url ? (
                                                    <img src={`http://localhost:5000/${selectedRecord.receveur_image_url}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    (selectedRecord.receveur_prenom ? selectedRecord.receveur_prenom[0]?.toUpperCase() : '') + (selectedRecord.receveur_nom ? selectedRecord.receveur_nom[0]?.toUpperCase() : '')
                                                )}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '800', fontSize: '1.15rem', color: '#1e293b', margin: 0, lineHeight: 1.2 }}>
                                                    {selectedRecord.receveur_prenom} {selectedRecord.receveur_nom}
                                                </p>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                                    <span style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>Rôle: <span style={{ color: '#4f46e5' }}>{selectedRecord.agent_role}</span></span>
                                                    <span style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>Matricule: <span style={{ color: '#1e293b' }}>{selectedRecord.receveur_matricule || '—'}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Horaires */}
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock size={14} /> Horaires de Service
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                                <span style={{ color: '#64748b' }}>Connexion:</span>
                                                <span style={{ fontWeight: '700', color: '#4f46e5' }}>{selectedRecord.heure_connexion ? new Date(selectedRecord.heure_connexion).toLocaleTimeString() : '--:--'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                                <span style={{ color: '#64748b' }}>Clôture:</span>
                                                <span style={{ fontWeight: '700', color: '#ef4444' }}>{new Date(selectedRecord.heure_cloture).toLocaleTimeString()}</span>
                                            </div>
                                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                                <span style={{ color: '#64748b' }}>Durée Totale:</span>
                                                <span style={{ fontWeight: '800', color: '#1e293b' }}>{selectedRecord.duree_minutes || 0} minutes</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Affectation */}
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <MapPin size={14} /> Affectation
                                        </h3>
                                        {selectedRecord.agent_role === 'AGENT' ? (
                                            <div>
                                                <p style={{ fontWeight: '800', fontSize: '1.1rem', color: '#4f46e5', marginBottom: '0.25rem' }}>
                                                    {selectedRecord.nom_guichet || 'Guichet Principal'}
                                                </p>
                                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Vente en station</p>
                                            </div>
                                        ) : selectedRecord.agent_role === 'RECEVEUR' ? (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                                    <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                        Ligne {selectedRecord.num_ligne}
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
                                                        <Bus size={14} /> Bus N° {selectedRecord.numero_bus}
                                                    </span>
                                                </div>
                                                <p style={{ color: '#475569', fontSize: '0.95rem', fontWeight: '600' }}>
                                                    {selectedRecord.ville_depart} ↔ {selectedRecord.ville_arrivee}
                                                </p>
                                            </>
                                        ) : (
                                            <div>
                                                <p style={{ fontWeight: '800', fontSize: '1.1rem', color: '#f97316', marginBottom: '0.25rem' }}>
                                                    Contrôle Itinérant
                                                </p>
                                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Multi-bus / Itinérance</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section Financière / Activité */}
                                    <div style={{ 
                                        background: selectedRecord.agent_role === 'CONTROLEUR' ? '#f0f9ff' : '#f0fdf4', 
                                        padding: '1.5rem', 
                                        borderRadius: '0.75rem', 
                                        border: selectedRecord.agent_role === 'CONTROLEUR' ? '1px solid #e0f2fe' : '1px solid #dcfce7' 
                                    }}>
                                        <h3 style={{ 
                                            fontSize: '0.75rem', 
                                            textTransform: 'uppercase', 
                                            color: selectedRecord.agent_role === 'CONTROLEUR' ? '#0369a1' : '#166534', 
                                            letterSpacing: '1px', 
                                            marginBottom: '1rem', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px' 
                                        }}>
                                            {selectedRecord.agent_role === 'CONTROLEUR' ? <Shield size={14} /> : <Tag size={14} />} 
                                            {selectedRecord.agent_role === 'CONTROLEUR' ? 'Activité de contrôle' : 'Bilan Financier'}
                                        </h3>
                                        
                                        {selectedRecord.agent_role === 'CONTROLEUR' ? (
                                            <div>
                                                <p style={{ color: '#0369a1', fontSize: '2.2rem', fontWeight: '900', lineHeight: '1', marginBottom: '0.5rem' }}>
                                                    {selectedRecord.tickets_count} <span style={{ fontSize: '1rem', fontWeight: '700' }}>Tickets</span>
                                                </p>
                                                <p style={{ color: '#0ea5e9', fontSize: '0.95rem', fontWeight: '700' }}>
                                                    Scans effectués avec succès
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p style={{ color: '#15803d', fontSize: '2.2rem', fontWeight: '900', lineHeight: '1', marginBottom: '0.5rem' }}>
                                                    {parseFloat(selectedRecord.total_collecte || 0).toFixed(3)} <span style={{ fontSize: '1rem', fontWeight: '700' }}>TND</span>
                                                </p>
                                                <p style={{ color: '#166534', fontSize: '0.95rem', fontWeight: '700' }}>
                                                    Total: {selectedRecord.tickets_count} tickets vendus
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section Motif */}
                                    <div style={{ background: '#fffbeb', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #fef3c7', gridColumn: 'span 2' }}>
                                        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#b45309', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AlertCircle size={16} /> Détails de clôture
                                        </h3>
                                        <div>
                                            <p style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '0.25rem', fontWeight: '600' }}>Motif de clôture:</p>
                                            <p style={{ color: '#b45309', fontSize: '0.95rem', fontWeight: selectedRecord.motif_cloture?.includes('INCIDENT') ? 'bold' : 'normal' }}>
                                                {selectedRecord.motif_cloture || 'Aucun motif spécifié'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Audit;

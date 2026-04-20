import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Loader2, History, Bus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Users.css'; // On utilise tes styles existants

const Audit = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/audit');
            const data = await res.json();
            setRecords(data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchRecords(); }, []);

    const handleAction = async (id, statut) => {
        if (!window.confirm(`Confirmer le statut : ${statut} ?`)) return;
        try {
            await fetch(`http://localhost:5000/api/audit/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statut })
            });
            fetchRecords();
        } catch (e) { alert("Erreur"); }
    };

    return (
        <div className="users-container">
            <div className="users-header-card">
                <div className="header-titles">
                    <h1>
                        <History size={24} style={{ verticalAlign: 'middle', marginRight: '10px', color: '#4f46e5' }} />
                        Suivi d'Audit
                    </h1>
                    <p>Validation des fiches de clôture service par les administrateurs</p>
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
                                    <th>ID Fiche</th>
                                    <th>Receveur</th>
                                    <th>Bus</th>
                                    <th>Date de clôture</th>
                                    <th>Recette Totale</th>
                                    <th>Tickets</th>
                                    <th>Statut</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode='popLayout'>
                                    {records.length > 0 ? (
                                        records.map(r => (
                                            <motion.tr key={r.id_fiche} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                <td style={{ fontWeight: 700, color: '#64748b', fontSize: '1.05rem' }}>#A{String(r.id_fiche).padStart(3, '0')}</td>
                                                <td><div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>{r.receveur_prenom} {r.receveur_nom}</div></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                                                        <Bus size={18} color="#4f46e5" />
                                                        <span style={{ fontWeight: 700 }}>N° {r.numero_bus}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '1.05rem', fontWeight: 600 }}>{new Date(r.heure_cloture).toLocaleDateString()}</td>
                                                <td><span style={{ fontWeight: 900, fontSize: '1.15rem' }}>{parseFloat(r.total_collecte || 0).toFixed(3)} TND</span></td>
                                                <td><span className="user-matricule" style={{ fontSize: '1.05rem' }}>{r.tickets_count} tickets</span></td>
                                                <td>
                                                    <span className={`role-badge ${r.statut === 'Validé' ? 'badge-agent' : r.statut === 'Rejeté' ? 'badge-receveur' : ''}`}
                                                        style={!r.statut || r.statut === 'En attente' ? { backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7' } : {}}>
                                                        {r.statut || 'En attente'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {(!r.statut || r.statut === 'En attente') ? (
                                                        <div className="row-actions" style={{ opacity: 1, gap: '10px' }}>
                                                             <button className="btn-add-user" style={{ padding: '0.6rem 1rem', background: '#22c55e', boxShadow: 'none', fontSize: '0.95rem' }} onClick={() => handleAction(r.id_fiche, 'Validé')}>
                                                                <CheckCircle size={16} /> Valider
                                                            </button>
                                                            <button className="btn-add-user" style={{ padding: '0.6rem 1rem', background: '#ef4444', boxShadow: 'none', fontSize: '0.95rem' }} onClick={() => handleAction(r.id_fiche, 'Rejeté')}>
                                                                <XCircle size={16} /> Rejeter
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '1rem', fontWeight: 700 }}>Traité</div>
                                                    )}
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
        </div>
    );
};

export default Audit;

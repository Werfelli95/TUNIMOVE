import React, { useState, useEffect } from 'react';
import { CircleDollarSign, Calculator, Save, Info, Plus, Percent, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Users.css';

const Tarifs = () => {
    // Config de base (Prix au km)
    const [config, setConfig] = useState({
        prix_par_km: 0.065,
        frais_fixes: 1.5,
    });
    
    const [tarifications, setTarifications] = useState([]);
    const [bagages, setBagages] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchData = async () => {
        try {
            const [tarifsRes, typeTarifRes, typeBagageRes] = await Promise.all([
                fetch('http://localhost:5000/api/tarifs'),
                fetch('http://localhost:5000/api/tarification'),
                fetch('http://localhost:5000/api/tarification/bagages')
            ]);
            
            const tarifsData = await tarifsRes.json();
            if (tarifsData.id_tarif) setConfig({ prix_par_km: tarifsData.prix_par_km, frais_fixes: tarifsData.frais_fixes });
            
            const typeTarifData = await typeTarifRes.json();
            setTarifications(typeTarifData);
            
            const typeBagageData = await typeBagageRes.json();
            setBagages(typeBagageData);
        } catch (error) {
            console.error("Erreur de chargement", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveBase = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/tarifs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config) // On envoie les valeurs de base
            });
            if (res.ok) {
                setMessage('✅ Prix de base mis à jour !');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    const toggleTarification = async (id, currentStatus) => {
        try {
            await fetch(`http://localhost:5000/api/tarification/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actif: !currentStatus })
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const toggleBagage = async (id, currentStatus) => {
        try {
            await fetch(`http://localhost:5000/api/tarification/bagages/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actif: !currentStatus })
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="users-container pb-20">
            <motion.div
                className="users-header-card mb-8"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="header-titles">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="user-avatar" style={{ width: '50px', height: '50px', background: '#f5f3ff' }}>
                            <CircleDollarSign size={28} color="#6366f1" />
                        </div>
                        <div>
                            <h1>Gestion Tarifaire (Nouveau Modèle)</h1>
                            <p>Définissez les paramètres de la billetterie, réductions, conventions et suppléments bagages.</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* BASE PRICING */}
            <div className="users-table-card mb-8" style={{ padding: '2.5rem' }}>
                <h3 className="mb-6 font-bold text-lg text-slate-800 border-b pb-2">1. Tarification Kilométrique de Base</h3>
                <div className="tarifs-grid">
                    <div className="tarif-field">
                        <label className="tarif-label">Prix par kilomètre (a)</label>
                        <div className="tarif-input-wrapper">
                            <input type="number" step="0.001" value={config.prix_par_km} onChange={e => setConfig({ ...config, prix_par_km: e.target.value })} />
                            <span className="unit-tag">TND/km</span>
                        </div>
                    </div>
                    <div className="tarif-field">
                        <label className="tarif-label">Frais fixes (b)</label>
                        <div className="tarif-input-wrapper">
                            <input type="number" step="0.1" value={config.frais_fixes} onChange={e => setConfig({ ...config, frais_fixes: e.target.value })} />
                            <span className="unit-tag">TND</span>
                        </div>
                    </div>
                </div>

                <div className="formula-card mt-6">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0369a1', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        <Calculator size={18} /> Formule de base
                    </div>
                    <div className="formula-display">
                        Prix = (Distance × <span className="formula-val">{config.prix_par_km}</span>) + <span className="formula-val">{config.frais_fixes}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: '#64748b' }}>
                        <Info size={14} />
                        <span style={{ fontSize: '0.9rem' }}>
                            Exemple: Un trajet de 100 km coûtera <b>{(100 * config.prix_par_km + parseFloat(config.frais_fixes)).toFixed(3)} TND</b> (Plein Tarif)
                        </span>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <AnimatePresence>
                        {message && (
                            <motion.span className="text-green-600 font-bold mr-4 flex items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {message}
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <button className="btn-add-user" onClick={handleSaveBase} disabled={loading}>
                        <Save size={18} className="mr-2" /> Enregistrer la Base
                    </button>
                </div>
            </div>

            {/* DYNAMIC TARIFS (REDUCTIONS & CONVENTIONS & EXPEDITIONS) */}
            <div className="users-table-card mb-8" style={{ padding: '2.5rem' }}>
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h3 className="font-bold text-lg text-slate-800">2. Types de Tarifs (Réductions, Conventions, Expéditions)</h3>
                    <button className="btn-secondary text-sm flex items-center" disabled>
                        <Plus size={16} className="mr-2" /> Ajouter un Type
                    </button>
                </div>
                
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Libellé</th>
                            <th>Catégorie</th>
                            <th>Mode Calcul</th>
                            <th>Valeur</th>
                            <th>Statut</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tarifications.map((t) => (
                            <tr key={t.id_type_tarification}>
                                <td><span className="text-slate-500 text-sm font-mono bg-slate-100 px-2 py-1 rounded">{t.code}</span></td>
                                <td><strong>{t.libelle}</strong></td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                                        backgroundColor: t.categorie === 'VOYAGEUR' ? '#e0e7ff' : t.categorie === 'CONVENTION' ? '#fce7f3' : '#ffedd5',
                                        color: t.categorie === 'VOYAGEUR' ? '#4f46e5' : t.categorie === 'CONVENTION' ? '#be185d' : '#c2410c'
                                    }}>
                                        {t.categorie}
                                    </span>
                                </td>
                                <td>
                                    <span className="text-slate-600 text-sm flex items-center gap-1">
                                        {t.mode_calcul === 'PERCENT_RESTANT' ? <Percent size={14}/> : <CircleDollarSign size={14}/>}
                                        {t.mode_calcul === 'PERCENT_RESTANT' ? '% à Payer' : 'Prix Fixe'}
                                    </span>
                                </td>
                                <td className="font-bold text-indigo-700">
                                    {t.mode_calcul === 'PERCENT_RESTANT' ? `${t.valeur} %` : `${(t.valeur/1000).toFixed(3)} TND`}
                                </td>
                                <td>
                                    {t.actif ? (
                                        <span className="badge badge-green hover:opacity-80 cursor-pointer" onClick={() => toggleTarification(t.id_type_tarification, t.actif)}>
                                            <CheckCircle size={14} className="mr-1" /> Actif
                                        </span>
                                    ) : (
                                        <span className="badge badge-red hover:opacity-80 cursor-pointer" onClick={() => toggleTarification(t.id_type_tarification, t.actif)}>
                                            <XCircle size={14} className="mr-1" /> Inactif
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <button className="text-indigo-600 font-bold text-sm" disabled>Modifier</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* BAGGAGE SUPPLEMENTS */}
            <div className="users-table-card" style={{ padding: '2.5rem' }}>
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h3 className="font-bold text-lg text-slate-800">3. Suppléments Bagages</h3>
                    <button className="btn-secondary text-sm flex items-center" disabled>
                        <Plus size={16} className="mr-2" /> Ajouter un Bagage
                    </button>
                </div>

                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Libellé Bagage</th>
                            <th>Prix Fixe</th>
                            <th>Statut</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bagages.map((b) => (
                            <tr key={b.id_type_bagage}>
                                <td><span className="text-slate-500 text-sm font-mono bg-slate-100 px-2 py-1 rounded">{b.code}</span></td>
                                <td><strong>{b.libelle}</strong></td>
                                <td className="font-bold text-amber-700">
                                    + {(b.prix/1000).toFixed(3)} TND
                                </td>
                                <td>
                                    {b.actif ? (
                                        <span className="badge badge-green hover:opacity-80 cursor-pointer" onClick={() => toggleBagage(b.id_type_bagage, b.actif)}>
                                            <CheckCircle size={14} className="mr-1" /> Actif
                                        </span>
                                    ) : (
                                        <span className="badge badge-red hover:opacity-80 cursor-pointer" onClick={() => toggleBagage(b.id_type_bagage, b.actif)}>
                                            <XCircle size={14} className="mr-1" /> Inactif
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <button className="text-indigo-600 font-bold text-sm" disabled>Modifier</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Tarifs;

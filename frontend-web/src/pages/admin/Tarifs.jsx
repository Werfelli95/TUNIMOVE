import React, { useState, useEffect } from 'react';
import { CircleDollarSign, Calculator, Save, Info, Plus, Percent, CheckCircle, XCircle, TrendingUp, Briefcase, Package, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Tarifs.css';

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
                setMessage('✅ Configuration mise à jour !');
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

    // Variantes d'animation
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="tarifs-container pb-20">
            {/* ═══ HEADER ════════════════════════════════════════════ */}
            <motion.div
                className="tarifs-premium-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div>
                    <h1>
                        <CircleDollarSign size={32} className="text-white" />
                        Gestion Tarifaire & Billetterie
                    </h1>
                    <p>
                        Configurez les paramètres financiers de votre réseau : prix de base au kilomètre,
                        réductions catégorielles et suppléments bagages en temps réel.
                    </p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                        <TrendingUp size={18} />
                        <span style={{ fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>Index Actuel</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'white' }}>
                        {config.prix_par_km} <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>TND/KM</span>
                    </div>
                </div>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* ═══ 1. BASE PRICING ══════════════════════════════════ */}
                <motion.div className="tarifs-section-card" variants={itemVariants}>
                    <h3 className="tarifs-section-title">
                        <TrendingUp size={20} className="text-indigo-600" />
                        1. Tarification Kilométrique de Base
                    </h3>

                    <div className="base-pricing-grid">
                        <div className="input-group-premium">
                            <label>Prix par kilomètre (a)</label>
                            <div className="input-premium-wrapper">
                                <input
                                    type="number"
                                    step="0.001"
                                    value={config.prix_par_km}
                                    onChange={e => setConfig({ ...config, prix_par_km: e.target.value })}
                                />
                                <span className="unit-tag-premium">TND/KM</span>
                            </div>
                        </div>
                        <div className="input-group-premium">
                            <label>Frais fixes (b)</label>
                            <div className="input-premium-wrapper">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.frais_fixes}
                                    onChange={e => setConfig({ ...config, frais_fixes: e.target.value })}
                                />
                                <span className="unit-tag-premium">TND</span>
                            </div>
                        </div>
                    </div>

                    <div className="formula-premium-card">
                        <div className="formula-label">
                            <Calculator size={14} /> Formule Algorithmique Applicative
                        </div>
                        <div className="formula-body">
                            Prix Final = (Distance × <span className="formula-highlight">{config.prix_par_km}</span>) + <span className="formula-highlight">{config.frais_fixes}</span>
                        </div>
                        <div className="formula-example">
                            <Info size={16} className="text-sky-500" />
                            <span>
                                Simulation : Un trajet de <b>100 km</b> sera facturé <b className="text-indigo-600">{(100 * config.prix_par_km + parseFloat(config.frais_fixes)).toFixed(3)} TND</b>
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end items-center mt-8 gap-4">
                        <AnimatePresence>
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-green-600 font-bold flex items-center gap-2"
                                >
                                    <CheckCircle size={18} /> {message}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button className="btn-premium-save" onClick={handleSaveBase} disabled={loading}>
                            <Save size={20} />
                            Enregistrer la Configuration
                        </button>
                    </div>
                </motion.div>

                {/* ═══ 2. DYNAMIC TARIFS ═══════════════════════════════ */}
                <motion.div className="tarifs-section-card" variants={itemVariants}>
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="tarifs-section-title !mb-0">
                            <Briefcase size={20} className="text-indigo-600" />
                            2. Types de Tarifs (Réductions & Conventions)
                        </h3>
                        <button className="btn-action-premium flex items-center gap-2" disabled>
                            <Plus size={18} /> Ajouter un Type
                        </button>
                    </div>

                    <div className="tarifs-table-container">
                        <table className="tarifs-premium-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Libellé / Désignation</th>
                                    <th>Catégorie</th>
                                    <th>Modèle Econ.</th>
                                    <th>Valeur</th>
                                    <th>Statut Flux</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tarifications.map((t, idx) => (
                                    <motion.tr
                                        key={t.id_type_tarification}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <td><span className="code-tag-premium">{t.code}</span></td>
                                        <td>
                                            <div className="font-bold text-slate-800">{t.libelle}</div>

                                        </td>
                                        <td>
                                            <span
                                                className="category-badge-premium"
                                                style={{
                                                    backgroundColor: t.categorie === 'VOYAGEUR' ? '#eef2ff' : t.categorie === 'CONVENTION' ? '#fdf2f8' : '#fff7ed',
                                                    color: t.categorie === 'VOYAGEUR' ? '#6366f1' : t.categorie === 'CONVENTION' ? '#db2777' : '#ea580c'
                                                }}
                                            >
                                                {t.categorie === 'VOYAGEUR' && <TrendingUp size={10} />}
                                                {t.categorie === 'CONVENTION' && <Briefcase size={10} />}
                                                {t.categorie === 'EXPEDITION' && <Package size={10} />}
                                                {t.categorie}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                                {t.mode_calcul === 'PERCENT_RESTANT' ? <Percent size={14} className="text-indigo-500" /> : <Calculator size={14} className="text-amber-500" />}
                                                {t.mode_calcul === 'PERCENT_RESTANT' ? '% Restant à payer' : 'Forfait Fixe'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-lg font-black text-indigo-700">
                                                {t.mode_calcul === 'PERCENT_RESTANT' ? `${t.valeur}%` : `${(t.valeur / 1000).toFixed(3)}`}
                                                <span className="text-xs font-normal ml-1 text-slate-400">
                                                    {t.mode_calcul === 'PERCENT_RESTANT' ? '' : 'TND'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div
                                                className={`status-badge-premium ${t.actif ? 'active-premium' : 'inactive-premium'}`}
                                                onClick={() => toggleTarification(t.id_type_tarification, t.actif)}
                                            >
                                                {t.actif ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                {t.actif ? 'Opérationnel' : 'Suspendu'}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <button className="btn-action-premium" disabled>Éditer</button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* ═══ 3. BAGGAGE SUPPLEMENTS ═════════════════════════ */}
                <motion.div className="tarifs-section-card" variants={itemVariants}>
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="tarifs-section-title !mb-0">
                            <Package size={20} className="text-indigo-600" />
                            3. Suppléments Bagages & Encombrements
                        </h3>
                        <button className="btn-action-premium flex items-center gap-2" disabled>
                            <Plus size={18} /> Ajouter une règle
                        </button>
                    </div>

                    <div className="tarifs-table-container">
                        <table className="tarifs-premium-table">
                            <thead>
                                <tr>
                                    <th>Code Flux</th>
                                    <th>Description Bagage</th>
                                    <th>Tarif Additionnel</th>
                                    <th>Visibilité</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bagages.map((b, idx) => (
                                    <motion.tr
                                        key={b.id_type_bagage}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <td><span className="code-tag-premium">{b.code}</span></td>
                                        <td>
                                            <div className="font-bold text-slate-800">{b.libelle}</div>
                                            <div className="text-xs text-slate-400">Règle de bagage active</div>
                                        </td>
                                        <td>
                                            <div className="text-lg font-black text-amber-700">
                                                + {(b.prix / 1000).toFixed(3)}
                                                <span className="text-xs font-normal ml-1 text-slate-400">TND</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div
                                                className={`status-badge-premium ${b.actif ? 'active-premium' : 'inactive-premium'}`}
                                                onClick={() => toggleBagage(b.id_type_bagage, b.actif)}
                                            >
                                                {b.actif ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                {b.actif ? 'En ligne' : 'Masqué'}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <button className="btn-action-premium" disabled>Paramétrer</button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </motion.div>

            <div className="mt-8 text-center text-slate-400 text-sm pb-10">
                <div className="flex items-center justify-center gap-2">
                    <ShieldCheck size={14} /> Sécurisé par le moteur TuniMove Central Pricing Engine v1.2
                </div>
            </div>
        </div>
    );
};

const ShieldCheck = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
);

export default Tarifs;


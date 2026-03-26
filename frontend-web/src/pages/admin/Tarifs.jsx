import React, { useState, useEffect } from 'react';
import { CircleDollarSign, Percent, Calculator, Save, Info, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Users.css';

const Tarifs = () => {
    const [config, setConfig] = useState({
        prix_par_km: 0.065,
        frais_fixes: 1.5,
        red_etudiant: 20,
        red_militaire: 15,
        red_handicape: 30,
        red_senior: 25
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/api/tarifs')
            .then(res => res.json())
            .then(data => {
                if (data.id_tarif) setConfig(data);
            });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/tarifs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                setMessage('✅ Configuration mise à jour !');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    return (
        <div className="users-container">
            <motion.div
                className="users-header-card"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="header-titles">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="user-avatar" style={{ width: '50px', height: '50px', background: '#f5f3ff' }}>
                            <CircleDollarSign size={28} color="#6366f1" />
                        </div>
                        <div>
                            <h1>Configuration Tarifaire</h1>
                            <p>Définissez les paramètres de calcul pour les tickets passagers</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="users-table-card" style={{ padding: '2.5rem' }}>
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

                <div className="tarifs-grid" style={{ marginBottom: '3rem' }}>
                    {[
                        { label: 'Réduction Étudiant', key: 'red_etudiant' },
                        { label: 'Réduction Militaire', key: 'red_militaire' },
                        { label: 'Réduction Handicapé', key: 'red_handicape' },
                        { label: 'Réduction Senior', key: 'red_senior' }
                    ].map(red => (
                        <div key={red.key} className="tarif-field">
                            <label className="tarif-label">{red.label}</label>
                            <div className="tarif-input-wrapper">
                                <Percent size={18} color="#cbd5e1" />
                                <input type="number" value={config[red.key]} onChange={e => setConfig({ ...config, [red.key]: e.target.value })} />
                                <span className="unit-tag">%</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="formula-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0369a1', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        <Calculator size={18} /> Formule de base
                    </div>
                    <div className="formula-display">
                        Prix = (Distance × <span className="formula-val">{config.prix_par_km}</span>) + <span className="formula-val">{config.frais_fixes}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: '#64748b' }}>
                        <Info size={14} />
                        <span style={{ fontSize: '0.9rem' }}>
                            Exemple: Un trajet de 270 km coûtera <b>{(270 * config.prix_par_km + parseFloat(config.frais_fixes)).toFixed(3)} TND</b> (hors réduction)
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <AnimatePresence>
                        {message && (
                            <motion.div
                                className="tarif-message"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                {message}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        className="btn-add-user"
                        style={{ padding: '0.8rem 2rem', fontSize: '1rem', marginLeft: 'auto' }}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        <Save size={20} /> {loading ? 'Enregistrement...' : 'Enregistrer la configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Tarifs;

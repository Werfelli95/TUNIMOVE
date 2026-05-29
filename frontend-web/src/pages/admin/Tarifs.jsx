import React, { useState, useEffect } from 'react';
import { CircleDollarSign, Calculator, Save, Info, Plus, Percent, CheckCircle, XCircle, TrendingUp, Briefcase, Package, ArrowRight, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
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
    const [expandedGroups, setExpandedGroups] = useState({});

    // Modal states for Tarifs
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        id_type_tarification: null,
        code: '',
        libelle: '',
        categorie: 'VOYAGEUR',
        mode_calcul: 'PERCENT_RESTANT',
        valeur: ''
    });

    // Modal states for Bagages
    const [showBagageModal, setShowBagageModal] = useState(false);
    const [isEditBagage, setIsEditBagage] = useState(false);
    const [bagageFormData, setBagageFormData] = useState({
        id_type_bagage: null,
        code: '',
        libelle: '',
        prix: ''
    });

    const toggleGroup = (key) => {
        setExpandedGroups(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

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
                body: JSON.stringify(config)
            });
            if (res.ok) {
                setMessage('✅ Configuration mise à jour !');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    // Tarif Form Handlers
    const openAddModal = () => {
        setFormData({ id_type_tarification: null, code: '', libelle: '', categorie: 'VOYAGEUR', mode_calcul: 'PERCENT_RESTANT', valeur: '' });
        setIsEdit(false);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setFormData({ ...item });
        setIsEdit(true);
        setShowModal(true);
    };

    const handleSubmitTarif = async (e) => {
        e.preventDefault();
        setLoading(true);
        const url = isEdit
            ? `http://localhost:5000/api/tarification/${formData.id_type_tarification}`
            : 'http://localhost:5000/api/tarification';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                fetchData();
                setMessage(isEdit ? '✅ Mis à jour !' : '✅ Ajouté !');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    // Bagage Form Handlers
    const openAddBagageModal = () => {
        setBagageFormData({ id_type_bagage: null, code: '', libelle: '', prix: '' });
        setIsEditBagage(false);
        setShowBagageModal(true);
    };

    const openEditBagageModal = (item) => {
        setBagageFormData({ ...item });
        setIsEditBagage(true);
        setShowBagageModal(true);
    };

    const handleSubmitBagage = async (e) => {
        e.preventDefault();
        setLoading(true);
        const url = isEditBagage
            ? `http://localhost:5000/api/tarification/bagages/${bagageFormData.id_type_bagage}`
            : 'http://localhost:5000/api/tarification/bagages';
        const method = isEditBagage ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bagageFormData)
            });
            if (res.ok) {
                setShowBagageModal(false);
                fetchData();
                setMessage(isEditBagage ? '✅ Règle mise à jour !' : '✅ Règle ajoutée !');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const toggleTarification = async (ids, currentStatus) => {
        const idArray = Array.isArray(ids) ? ids : [ids];
        try {
            await Promise.all(idArray.map(id =>
                fetch(`http://localhost:5000/api/tarification/${id}/toggle`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ actif: !currentStatus })
                })
            ));
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

    const handleDeleteBagage = async (id) => {
        const isConfirmed = window.confirm("Voulez-vous vraiment supprimer cette règle de bagage ?");
        if (!isConfirmed) return;
        try {
            const res = await fetch(`http://localhost:5000/api/tarification/bagages/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchData();
                setMessage('✅ Règle supprimée !');
                setTimeout(() => setMessage(''), 3000);
            } else {
                const err = await res.json();
                alert(err.message || "Erreur de suppression");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteTarification = async (id) => {
        const isConfirmed = window.confirm("Voulez-vous vraiment supprimer ce type de tarif ?");
        if (!isConfirmed) return;
        try {
            const res = await fetch(`http://localhost:5000/api/tarification/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchData();
                setMessage('✅ Tarif supprimé !');
                setTimeout(() => setMessage(''), 3000);
            } else {
                const err = await res.json();
                alert(err.message || "Erreur de suppression");
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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

            <motion.div variants={containerVariants} initial="hidden" animate="visible">
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
                    <div className="section-header">
                        <div className="section-title">
                            <Percent className="icon-blue" />
                            <h2>2. Types de Tarifs (Réductions & Conventions)</h2>
                        </div>
                        <button className="btn-add-premium" onClick={openAddModal}>
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
                                {(() => {
                                    const groups = {};
                                    tarifications.forEach(t => {
                                        const key = `${t.mode_calcul}-${t.valeur}`;
                                        if (!groups[key]) {
                                            groups[key] = {
                                                key,
                                                valeur: t.valeur,
                                                mode_calcul: t.mode_calcul,
                                                items: [t],
                                                actif: t.actif
                                            };
                                        } else {
                                            groups[key].items.push(t);
                                        }
                                    });

                                    return Object.values(groups)
                                        .sort((a, b) => b.valeur - a.valeur)
                                        .map((group, idx) => {
                                            const isExpanded = expandedGroups[group.key];
                                            const hasMultiple = group.items.length > 1;

                                            return (
                                                <React.Fragment key={group.key}>
                                                    <motion.tr
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className={hasMultiple ? 'cursor-pointer hover:bg-slate-50' : ''}
                                                        onClick={() => hasMultiple && toggleGroup(group.key)}
                                                    >
                                                        <td>
                                                            <div className="flex items-center gap-3">
                                                                {hasMultiple && (
                                                                    <div className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                                                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-wrap gap-1 max-w-[180px]">
                                                                    <span className="code-tag-premium !py-0.5 !px-2 !text-[10px]">{group.items[0].code}</span>
                                                                    {hasMultiple && (
                                                                        <span className="text-[10px] font-bold text-indigo-500">+{group.items.length - 1} autres</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="max-w-[300px]">
                                                            <div className="font-bold text-slate-800 text-[13px]">
                                                                {hasMultiple ? (
                                                                    <span>{group.items[0].libelle} <span className="text-slate-400 font-normal">et {group.items.length - 1} autres types</span></span>
                                                                ) : (
                                                                    group.items[0].libelle
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="flex flex-wrap gap-1">
                                                                {Array.from(new Set(group.items.map(i => i.categorie))).map(cat => (
                                                                    <span
                                                                        key={cat}
                                                                        className="category-badge-premium !py-0.5 !px-2"
                                                                        style={{
                                                                            backgroundColor: cat === 'VOYAGEUR' ? '#eef2ff' : cat === 'CONVENTION' ? '#fdf2f8' : '#fff7ed',
                                                                            color: cat === 'VOYAGEUR' ? '#6366f1' : cat === 'CONVENTION' ? '#db2777' : '#ea580c'
                                                                        }}
                                                                    >
                                                                        {cat}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold whitespace-nowrap">
                                                                {group.mode_calcul === 'PERCENT_RESTANT' ? <Percent size={12} className="text-indigo-500" /> : <Calculator size={12} className="text-amber-500" />}
                                                                {group.mode_calcul === 'PERCENT_RESTANT' ? '% Restant' : 'Forfait Fixe'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="text-lg font-black text-indigo-700 whitespace-nowrap">
                                                                {group.mode_calcul === 'PERCENT_RESTANT' ? `${group.valeur}%` : `${(group.valeur / 1000).toFixed(3)}`}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div
                                                                className={`status-badge-premium ${group.actif ? 'active-premium' : 'inactive-premium'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleTarification(group.items.map(i => i.id_type_tarification), group.actif);
                                                                }}
                                                            >
                                                                {group.actif ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                                {group.actif ? 'Opérationnel' : 'Suspendu'}
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                                <button
                                                                    className="btn-action-premium"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (hasMultiple) toggleGroup(group.key);
                                                                        else openEditModal(group.items[0]);
                                                                    }}
                                                                >
                                                                    {hasMultiple ? (isExpanded ? 'Fermer' : 'Gérer') : 'Éditer'}
                                                                </button>
                                                                
                                                            </div>
                                                        </td>
                                                    </motion.tr>

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <tr>
                                                                <td colSpan="7" className="!p-0 border-none">
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="overflow-hidden bg-slate-50/50 rounded-xl m-2 border border-dashed border-slate-200"
                                                                    >
                                                                        <table className="w-full text-left text-[11px]">
                                                                            <thead>
                                                                                <tr className="text-slate-400 uppercase tracking-widest font-black">
                                                                                    <th className="py-2 px-8">Code</th>
                                                                                    <th className="py-2">Désignation</th>
                                                                                    <th className="py-2">Catégorie</th>
                                                                                    <th className="py-2 text-center">Action</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {group.items.map((item) => (
                                                                                    <tr key={item.id_type_tarification} className="border-t border-slate-100">
                                                                                        <td className="py-2 px-8"><span className="code-tag-premium !text-[9px]">{item.code}</span></td>
                                                                                        <td className="py-2 font-medium text-slate-600">{item.libelle}</td>
                                                                                        <td className="py-2">
                                                                                            <span className="text-[10px] font-bold text-slate-400">{item.categorie}</span>
                                                                                        </td>
                                                                                        <td className="py-2 text-center">
                                                                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                                                                <button
                                                                                                    className="text-indigo-600 font-bold hover:underline"
                                                                                                    onClick={() => openEditModal(item)}
                                                                                                >
                                                                                                    Éditer
                                                                                                </button>
                                                                                                
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </motion.div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </AnimatePresence>
                                                </React.Fragment>
                                            );
                                        });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* ═══ 3. BAGGAGE SUPPLEMENTS ═════════════════════════ */}
                <motion.div className="tarifs-section-card" variants={itemVariants}>
                    <div className="section-header">
                        <div className="section-title">
                            <Package size={20} className="text-indigo-600" />
                            <h2>3. Suppléments Bagages & Encombrements</h2>
                        </div>
                        <button className="btn-add-premium" onClick={openAddBagageModal}>
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
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button
                                                    className="btn-action-premium"
                                                    onClick={() => openEditBagageModal(b)}
                                                >
                                                    Paramétrer
                                                </button>
                                                
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </motion.div>

            <motion.div className="mt-8 text-center text-slate-400 text-sm pb-10">
                <div className="flex items-center justify-center gap-2">
                    <ShieldCheck size={14} /> Sécurisé par le moteur TuniMove Central Pricing Engine v1.2
                </div>
            </motion.div>

            {/* Modal Tarifs */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay-premium">
                        <motion.div
                            className="modal-content-premium"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="modal-header">
                                <h3>{isEdit ? 'Modifier le Type de Tarif' : 'Nouveau Type de Tarif'}</h3>
                                <button className="btn-close" onClick={() => setShowModal(false)}><XCircle size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmitTarif} className="modal-form">
                                <div className="form-group">
                                    <label>Code (ex: RED_25, PLEIN)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="CODE_UNIQUE"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Libellé / Désignation</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.libelle}
                                        onChange={e => setFormData({ ...formData, libelle: e.target.value })}
                                        placeholder="Ex: 25% Réduction Étudiant"
                                    />
                                </div>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Catégorie</label>
                                        <select
                                            value={formData.categorie}
                                            onChange={e => setFormData({ ...formData, categorie: e.target.value })}
                                        >
                                            <option value="VOYAGEUR">VOYAGEUR</option>
                                            <option value="CONVENTION">CONVENTION</option>
                                            <option value="EXPEDITION">EXPEDITION</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Mode de calcul</label>
                                        <select
                                            value={formData.mode_calcul}
                                            onChange={e => setFormData({ ...formData, mode_calcul: e.target.value })}
                                        >
                                            <option value="PERCENT_RESTANT">% Restant à payer</option>
                                            <option value="FIXE">Forfait Fixe (TND)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Valeur ({formData.mode_calcul === 'PERCENT_RESTANT' ? '%' : 'Millimes'})</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.valeur}
                                        onChange={e => setFormData({ ...formData, valeur: e.target.value })}
                                        placeholder={formData.mode_calcul === 'PERCENT_RESTANT' ? "75 pour payer 75%" : "3000 pour 3 DT"}
                                    />
                                    <p className="form-hint">
                                        {formData.mode_calcul === 'PERCENT_RESTANT'
                                            ? "Entrez le pourcentage du prix final (ex: 75 pour 25% de réduction)"
                                            : "Entrez la valeur en millimes (ex: 5000 pour 5 TND)"}
                                    </p>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                                    <button type="submit" className="btn-save" disabled={loading}>
                                        {loading ? 'Enregistrement...' : 'Confirmer'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Bagages */}
            <AnimatePresence>
                {showBagageModal && (
                    <div className="modal-overlay-premium">
                        <motion.div
                            className="modal-content-premium"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="modal-header">
                                <h3>{isEditBagage ? 'Modifier la Règle Bagage' : 'Nouvelle Règle Bagage'}</h3>
                                <button className="btn-close" onClick={() => setShowBagageModal(false)}><XCircle size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmitBagage} className="modal-form">
                                <div className="form-group">
                                    <label>Code Flux (ex: BAG_30)</label>
                                    <input
                                        type="text"
                                        required
                                        value={bagageFormData.code}
                                        onChange={e => setBagageFormData({ ...bagageFormData, code: e.target.value.toUpperCase() })}
                                        placeholder="BAG_CODE"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Description du Bagage</label>
                                    <input
                                        type="text"
                                        required
                                        value={bagageFormData.libelle}
                                        onChange={e => setBagageFormData({ ...bagageFormData, libelle: e.target.value })}
                                        placeholder="Ex: Bagage volumineux > 30kg"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Tarif Additionnel (Millimes)</label>
                                    <input
                                        type="number"
                                        required
                                        value={bagageFormData.prix}
                                        onChange={e => setBagageFormData({ ...bagageFormData, prix: e.target.value })}
                                        placeholder="Ex: 2000 pour 2 DT"
                                    />
                                    <p className="form-hint">Entrez la valeur en millimes (ex: 1500 pour 1.500 TND)</p>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setShowBagageModal(false)}>Annuler</button>
                                    <button type="submit" className="btn-save" disabled={loading}>
                                        {loading ? 'Enregistrement...' : 'Confirmer'}
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

const ShieldCheck = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
);

export default Tarifs;

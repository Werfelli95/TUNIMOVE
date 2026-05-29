import React, { useState, useEffect } from 'react';
import { Printer, Search, Loader2, ShoppingCart, Clock, Calendar, List, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Users.css';

/* ─── Mini modal : détail d'un jour ─── */
const DayModal = ({ day, sales, onClose }) => {
    const total = sales.reduce((sum, s) => {
        const n = parseFloat(String(s.prix || '0').replace(' TND', ''));
        return sum + (isNaN(n) ? 0 : n);
    }, 0);

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'white', borderRadius: '24px', width: '680px', maxHeight: '80vh',
                    overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
                    display: 'flex', flexDirection: 'column'
                }}
            >
                {/* header */}
                <div style={{
                    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>Ventes du</p>
                        <h2 style={{ margin: '4px 0 0', color: 'white', fontSize: '22px', fontWeight: 900 }}>{day}</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 700 }}>{sales.length} ticket{sales.length > 1 ? 's' : ''}</p>
                            <p style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: 900 }}>{total.toFixed(3)} TND</p>
                        </div>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
                            <X size={18} />
                        </button>
                    </div>
                </div>
                {/* liste */}
                <div style={{ overflowY: 'auto', padding: '20px 28px 28px' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                                <th style={{ textAlign: 'left', padding: '0 12px 4px' }}>ID</th>
                                <th style={{ textAlign: 'left', padding: '0 12px 4px' }}>Ligne</th>
                                <th style={{ textAlign: 'left', padding: '0 12px 4px' }}>Trajet</th>
                                <th style={{ textAlign: 'left', padding: '0 12px 4px' }}>Type</th>
                                <th style={{ textAlign: 'left', padding: '0 12px 4px' }}>Horaire</th>
                                <th style={{ textAlign: 'right', padding: '0 12px 4px' }}>Prix</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(s => (
                                <tr key={s.id} style={{ background: '#f8fafc', borderRadius: '12px' }}>
                                    <td style={{ padding: '12px', fontWeight: 800, color: '#4f46e5', borderRadius: '12px 0 0 12px' }}>{s.id}</td>
                                    <td style={{ padding: '12px', fontWeight: 700, color: '#1e293b' }}>{s.ligne}</td>
                                    <td style={{ padding: '12px', fontStyle: 'italic', color: '#64748b' }}>{s.trajet}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                                            background: s.type === 'Directe' ? '#ecfdf5' : '#eff6ff',
                                            color: s.type === 'Directe' ? '#059669' : '#2563eb',
                                            border: `1px solid ${s.type === 'Directe' ? '#10b981' : '#3b82f6'}`
                                        }}>{s.type}</span>
                                    </td>
                                    <td style={{ padding: '12px', color: '#475569', fontWeight: 700 }}>{s.horaire}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#0f172a', borderRadius: '0 12px 12px 0' }}>{s.prix}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

/* ─── Vue Calendrier ─── */
const CalendarView = ({ sales, filterType }) => {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState(null);

    const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

    const filtered = sales.filter(s => {
        if (filterType === 'DIRECTE') return s.type === 'Directe';
        if (filterType === 'RESERVATION') return s.type === 'Réservations';
        return true;
    });

    // group by isoDate (YYYY-MM-DD)
    const grouped = {};
    filtered.forEach(s => {
        const key = s.isoDate ? s.isoDate.substring(0, 10) : null;
        if (!key) return;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
    });

    const firstDay = new Date(year, month, 1);
    let startDow = firstDay.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // convert to Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    const modalSales = selectedDay
        ? (grouped[selectedDay] || [])
        : [];

    return (
        <>
            <div style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                {/* nav mois */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                    <button onClick={prev} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '10px', cursor: 'pointer', display: 'flex', color: '#475569' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>
                        {MONTHS_FR[month]} {year}
                    </h2>
                    <button onClick={next} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '10px', cursor: 'pointer', display: 'flex', color: '#475569' }}>
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* jours de semaine */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '8px', marginBottom: '8px' }}>
                    {DAYS_FR.map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', padding: '4px 0' }}>{d}</div>
                    ))}
                </div>

                {/* cellules */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '8px' }}>
                    {cells.map((day, idx) => {
                        if (!day) return <div key={`e-${idx}`} />;
                        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const daySales = grouped[key] || [];
                        const hasData = daySales.length > 0;
                        const dayTotal = daySales.reduce((sum, s) => {
                            const n = parseFloat(String(s.prix || '0').replace(' TND', ''));
                            return sum + (isNaN(n) ? 0 : n);
                        }, 0);
                        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                        return (
                            <div
                                key={key}
                                onClick={() => hasData && setSelectedDay(key)}
                                style={{
                                    borderRadius: '14px',
                                    padding: '10px 8px',
                                    minHeight: '80px',
                                    background: hasData
                                        ? 'linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)'
                                        : isToday ? '#fafafa' : '#f8fafc',
                                    border: isToday
                                        ? '2px solid #4f46e5'
                                        : hasData ? '1px solid #c7d2fe' : '1px solid #f1f5f9',
                                    cursor: hasData ? 'pointer' : 'default',
                                    transition: 'all 0.2s',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                                }}
                                onMouseEnter={e => { if (hasData) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(79,70,229,0.15)'; } }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <span style={{
                                    fontSize: '14px', fontWeight: isToday || hasData ? 900 : 700,
                                    color: isToday ? '#4f46e5' : hasData ? '#3730a3' : '#94a3b8'
                                }}>{day}</span>

                                {hasData && (
                                    <>
                                        <span style={{
                                            background: '#4f46e5', color: 'white',
                                            fontSize: '11px', fontWeight: 800,
                                            padding: '2px 8px', borderRadius: '99px'
                                        }}>{daySales.length} ticket{daySales.length > 1 ? 's' : ''}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#4338ca' }}>
                                            {dayTotal.toFixed(2)} TND
                                        </span>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* légende */}
                <div style={{ marginTop: '24px', display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', border: '1px solid #c7d2fe' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Jour avec ventes</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#fafafa', border: '2px solid #4f46e5' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Aujourd'hui</span>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedDay && (
                    <DayModal
                        day={new Date(selectedDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        sales={modalSales}
                        onClose={() => setSelectedDay(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

/* ─── Page principale ─── */
const SalesHistory = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'

    useEffect(() => { fetchSales(); }, []);

    const fetchSales = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/sales');
            const data = await response.json();
            setSales(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(sale => {
        const matchesSearch =
            sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.ligne.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.type.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesStart = true, matchesEnd = true;
        if (startDate || endDate) {
            const saleDate = new Date(sale.isoDate);
            if (!isNaN(saleDate.getTime())) {
                if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); if (saleDate < s) matchesStart = false; }
                if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); if (saleDate > e) matchesEnd = false; }
            }
        }
        const matchesFilter =
            filterType === 'ALL' ||
            (filterType === 'DIRECTE' && sale.type === 'Directe') ||
            (filterType === 'RESERVATION' && sale.type === 'Réservations');

        return matchesSearch && matchesStart && matchesEnd && matchesFilter;
    });

    const totalRevenue = filteredSales.reduce((sum, sale) => {
        const n = parseFloat(String(sale.prix || '0').replace(' TND', ''));
        return sum + (isNaN(n) ? 0 : n);
    }, 0);

    const FILTER_BTNS = [
        { key: 'ALL', label: 'Tous les tickets', color: '#4f46e5' },
        { key: 'DIRECTE', label: 'Vente', color: '#10b981' },
        { key: 'RESERVATION', label: 'Réservations', color: '#3b82f6' },
    ];

    return (
        <div className="users-container">
            {/* HEADER */}
            <div className="users-header-card">
                <div className="header-titles">
                    <h1>
                        <ShoppingCart size={24} style={{ verticalAlign: 'middle', marginRight: '10px', color: '#4f46e5' }} />
                        Historique des Ventes
                    </h1>
                    <p>Gérez et consultez tous les tickets émis par le réseau</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {/* toggle vue */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.25)' }}>
                        <button
                            onClick={() => setViewMode('table')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 800,
                                background: viewMode === 'table' ? 'white' : 'transparent',
                                color: viewMode === 'table' ? '#4f46e5' : 'rgba(255,255,255,0.85)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <List size={16} /> Tableau
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 800,
                                background: viewMode === 'calendar' ? 'white' : 'transparent',
                                color: viewMode === 'calendar' ? '#4f46e5' : 'rgba(255,255,255,0.85)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Calendar size={16} /> Calendrier
                        </button>
                    </div>

                    {/* filtres date (seulement en tableau) */}
                    {viewMode === 'table' && (
                        <>
                            <div className="date-filter"><span>Du</span><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                            <div className="date-filter"><span>Au</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                        </>
                    )}
                </div>
            </div>

            {/* FILTRES TYPE */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem' }}>
                {FILTER_BTNS.map(({ key, label, color }) => (
                    <button
                        key={key}
                        onClick={() => setFilterType(key)}
                        style={{
                            padding: '10px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
                            transition: 'all 0.2s', cursor: 'pointer',
                            background: filterType === key ? color : 'white',
                            color: filterType === key ? 'white' : '#64748b',
                            border: `1px solid ${filterType === key ? color : '#e2e8f0'}`,
                            boxShadow: filterType === key ? `0 4px 12px ${color}33` : 'none'
                        }}
                    >{label}</button>
                ))}
            </div>

            {/* ── VUE CALENDRIER ── */}
            {viewMode === 'calendar' ? (
                loading ? (
                    <div className="loading-state"><Loader2 className="animate-spin" size={40} /><p>Chargement...</p></div>
                ) : (
                    <CalendarView sales={sales} filterType={filterType} />
                )
            ) : (
                /* ── VUE TABLEAU ── */
                <>
                    {/* search */}
                    <div style={{ marginBottom: 16 }}>
                        <div className="search-wrapper search-wrapper--light" style={{ width: '100%' }}>
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher un ticket (ID, Ligne, Type...)"
                                className="search-input"
                                style={{ width: '100%' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* bandeau revenu période */}
                    <AnimatePresence>
                        {(startDate || endDate) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                                style={{
                                    padding: '1.25rem 2rem', background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)',
                                    borderRadius: '16px', marginBottom: '1.5rem',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    border: '1px solid #c7d2fe', boxShadow: '0 4px 15px rgba(79,70,229,0.05)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ background: '#4f46e5', color: 'white', padding: '8px', borderRadius: '10px' }}><ShoppingCart size={20} /></div>
                                    <div>
                                        <span style={{ fontWeight: 800, color: '#4338ca', display: 'block', textTransform: 'uppercase', fontSize: '0.95rem' }}>Revenu de la période</span>
                                        <span style={{ color: '#4f46e5', fontSize: '1.05rem', fontWeight: 600 }}>{filteredSales.length} ticket{filteredSales.length > 1 ? 's' : ''} vendu{filteredSales.length > 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#312e81' }}>
                                    {totalRevenue.toFixed(3)} <span style={{ fontSize: '1rem', color: '#4f46e5' }}>TND</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="users-table-card">
                        {loading ? (
                            <div className="loading-state"><Loader2 className="animate-spin" size={40} /><p>Chargement des ventes...</p></div>
                        ) : (
                            <div className="table-responsive">
                                <table className="enterprise-table">
                                    <thead>
                                        <tr>
                                            <th>ID_Ticket</th>
                                            <th>Ligne</th>
                                            <th>Trajet</th>
                                            <th>Type</th>
                                            <th>Date</th>
                                            <th>Horaire</th>
                                            <th style={{ textAlign: 'center' }}>Prix</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <AnimatePresence mode='popLayout'>
                                            {filteredSales.length > 0 ? filteredSales.map(sale => (
                                                <motion.tr key={sale.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    <td style={{ fontWeight: 800, color: '#4f46e5', fontSize: '1.1rem' }}>{sale.id}</td>
                                                    <td><div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>{sale.ligne}</div></td>
                                                    <td><span className="user-matricule" style={{ fontStyle: 'italic', fontSize: '1.05rem' }}>{sale.trajet}</span></td>
                                                    <td>
                                                        <span style={{
                                                            padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700,
                                                            background: sale.type === 'Directe' ? '#ecfdf5' : '#eff6ff',
                                                            color: sale.type === 'Directe' ? '#059669' : '#2563eb',
                                                            border: `1px solid ${sale.type === 'Directe' ? '#10b981' : '#3b82f6'}`
                                                        }}>{sale.type}</span>
                                                    </td>
                                                    <td style={{ fontSize: '1.05rem', fontWeight: 600 }}>{sale.date}</td>
                                                    <td>
                                                        <div style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                            background: '#F1F5F9', color: '#475569',
                                                            padding: '6px 12px', borderRadius: '10px',
                                                            fontWeight: 800, fontSize: '0.95rem', border: '1px solid #E2E8F0'
                                                        }}>
                                                            <Clock size={14} color="#64748B" />{sale.horaire}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: '1.25rem' }}>{sale.prix}</td>
                                                </motion.tr>
                                            )) : (
                                                <tr><td colSpan="7" className="empty-state">Aucune vente trouvée.</td></tr>
                                            )}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default SalesHistory;

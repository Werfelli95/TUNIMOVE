import React, { useState, useEffect } from 'react';
import { Printer, Search, Loader2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Users.css';

const SalesHistory = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/sales');
            const data = await response.json();
            setSales(data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(sale => {
        const matchesSearch = sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              sale.ligne.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesStart = true;
        let matchesEnd = true;
        
        if (startDate || endDate) {
            const saleDate = new Date(sale.isoDate);
            if (!isNaN(saleDate.getTime())) {
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (saleDate < start) matchesStart = false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    if (saleDate > end) matchesEnd = false;
                }
            }
        }
        
        return matchesSearch && matchesStart && matchesEnd;
    });

    // Calcul du revenu total
    const totalRevenue = filteredSales.reduce((sum, sale) => {
        const prixNum = parseFloat(sale.prix.replace(' TND', ''));
        return sum + (isNaN(prixNum) ? 0 : prixNum);
    }, 0);

    return (
        <div className="users-container">
            <div className="users-header-card">
                <div className="header-titles">
                    <h1>
                        <ShoppingCart size={24} style={{ verticalAlign: 'middle', marginRight: '10px', color: '#4f46e5' }} />
                        Historique des Ventes
                    </h1>
                    <p>Gérez et consultez tous les tickets émis par le réseau</p>
                </div>

                <div className="header-actions flex gap-4 items-center flex-wrap">
                    <div className="date-filter">
                        <span>Du</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="date-filter">
                        <span>Au</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher un ticket (ID, Ligne...)"
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {(startDate || endDate) && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, height: 0 }}
                        style={{ 
                            padding: '1.25rem 2rem', 
                            background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', 
                            borderRadius: '16px', 
                            marginBottom: '1.5rem', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            border: '1px solid #c7d2fe',
                            boxShadow: '0 4px 15px rgba(79, 70, 229, 0.05)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: '#4f46e5', color: 'white', padding: '8px', borderRadius: '10px' }}>
                                <ShoppingCart size={20} />
                            </div>
                            <div>
                                <span style={{ fontWeight: 700, color: '#4338ca', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                    Revenu de la période
                                </span>
                                <span style={{ color: '#4f46e5', fontSize: '0.875rem' }}>
                                    {filteredSales.length} ticket{filteredSales.length > 1 ? 's' : ''} vendu{filteredSales.length > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#312e81', letterSpacing: '-0.02em' }}>
                            {totalRevenue.toFixed(3)} <span style={{ fontSize: '1rem', color: '#4f46e5' }}>TND</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="users-table-card">
                {loading ? (
                    <div className="loading-state">
                        <Loader2 className="animate-spin" size={40} />
                        <p>Chargement des ventes...</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th>ID_Fiche</th>
                                    <th>Ligne</th>
                                    <th>Trajet</th>
                                    <th>Date</th>
                                    <th style={{ textAlign: 'center' }}>Prix</th>

                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <AnimatePresence mode='popLayout'>
                                    {filteredSales.length > 0 ? (
                                        filteredSales.map((sale) => (
                                            <motion.tr
                                                key={sale.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <td style={{ fontWeight: 700, color: '#4f46e5' }}>{sale.id}</td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{sale.ligne}</div>
                                                </td>
                                                <td><span className="user-matricule" style={{ fontStyle: 'italic' }}>{sale.trajet}</span></td>
                                                <td>{sale.date}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{sale.prix}</td>

                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="empty-state">Aucune vente trouvée.</td>
                                        </tr>
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

export default SalesHistory;

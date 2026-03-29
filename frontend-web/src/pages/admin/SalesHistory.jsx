import React, { useState, useEffect } from 'react';
import { Printer, Search, Loader2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Users.css';

const SalesHistory = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchSales(selectedDate);
    }, [selectedDate]);

    const fetchSales = async (date) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/sales?date=${date}`);
            const data = await response.json();
            setSales(data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(sale =>
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.ligne.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

                <div className="header-actions" style={{ gap: '15px' }}>
                    {/* FILTRE PAR DATE */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Date :</span>
                        <input
                            type="date"
                            className="search-input"
                            style={{ width: '150px', padding: '8px 12px' }}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher (ID, Ligne...)"
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

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
                                    <th>Type</th>
                                    <th>Ligne</th>
                                    <th>Trajet</th>
                                    <th>Date d’émission</th>
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
                                                    <span className={`role-badge ${sale.type === 'Ticket' ? 'badge-agent' : 'badge-admin'}`}>
                                                        {sale.type}
                                                    </span>
                                                </td>
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
                                            <td colSpan="5" className="empty-state">Aucune vente trouvée.</td>
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

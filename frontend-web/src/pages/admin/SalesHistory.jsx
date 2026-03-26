import React, { useState, useEffect } from 'react';
import { Printer, Search, Loader2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Users.css';

const SalesHistory = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

                <div className="header-actions">
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

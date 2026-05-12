import React, { useState, useEffect } from 'react';
import { Bus, MapPin, Users, Clock, AlertCircle, RefreshCw, Route } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Tracking.css';

const Tracking = () => {
    const [activeBuses, setActiveBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchTrackingData = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/buses/tracking');
            if (res.ok) {
                const data = await res.json();
                setActiveBuses(data);
            }
        } catch (error) {
            console.error("Erreur fetching tracking:", error);
        } finally {
            setLoading(false);
            setLastRefresh(new Date());
        }
    };

    useEffect(() => {
        fetchTrackingData();
        // Polling toutes les 30 secondes pour le suivi temps réel
        const interval = setInterval(fetchTrackingData, 30000);
        return () => clearInterval(interval);
    }, []);

    const getProgress = (stations, currentStation) => {
        if (!stations || stations.length === 0) return 0;
        const currentIndex = stations.findIndex(s => s.arret === currentStation);
        if (currentIndex === -1) return 0;
        return (currentIndex / (stations.length - 1)) * 100;
    };

    return (
        <div className="tracking-container">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Suivi en Direct</h1>
                    <p className="text-slate-500 font-medium">Localisation en temps réel de la flotte active</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dernière mise à jour</p>
                        <p className="text-xs font-bold text-slate-600">{lastRefresh.toLocaleTimeString()}</p>
                    </div>
                    <button 
                        onClick={() => { setLoading(true); fetchTrackingData(); }}
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600"
                        title="Rafraîchir"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            {loading && activeBuses.length === 0 ? (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="tracking-grid">
                    <AnimatePresence mode='popLayout'>
                        {activeBuses.length > 0 ? (
                            activeBuses.map((bus) => {
                                const progress = getProgress(bus.stations, bus.station_actuelle);
                                const currentIndex = bus.stations.findIndex(s => s.arret === bus.station_actuelle);

                                return (
                                    <motion.div 
                                        key={bus.id_service}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="bus-card-premium"
                                    >
                                        <div className="bus-card-header">
                                            <div className="bus-identity">
                                                <div className="bus-icon-wrapper">
                                                    <Bus size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="bus-number">Bus N° {bus.numero_bus}</h3>
                                                    <span className="bus-line-info">{bus.ville_depart} ➔ {bus.ville_arrivee}</span>
                                                </div>
                                            </div>
                                            <div className="live-badge">
                                                <div className="h-2 w-2 rounded-full bg-white"></div>
                                                En Direct
                                            </div>
                                        </div>

                                        <div className="bus-card-body">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2 text-indigo-600">
                                                    <MapPin size={16} />
                                                    <span className="text-sm font-bold">{bus.station_actuelle || 'Départ imminent'}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase">{bus.horaire}</span>
                                            </div>

                                            <div className="voyage-tracker">
                                                <div className="progress-track">
                                                    <div 
                                                        className="progress-fill" 
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                    {bus.stations.map((st, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            className={`station-dot ${idx < currentIndex ? 'reached' : ''} ${idx === currentIndex ? 'current' : ''}`}
                                                        >
                                                            <div className="station-label">{st.arret}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bus-stats">
                                                <div className="stat-item">
                                                    <div className="stat-icon-mini text-indigo-600">
                                                        <Users size={18} />
                                                    </div>
                                                    <div className="stat-info">
                                                        <label>Tickets</label>
                                                        <span>{bus.tickets_count} vendus</span>
                                                    </div>
                                                </div>
                                                <div className="stat-item">
                                                    <div className="stat-icon-mini text-indigo-600">
                                                        <Clock size={18} />
                                                    </div>
                                                    <div className="stat-info">
                                                        <label>Départ</label>
                                                        <span>{new Date(bus.date_debut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="receveur-footer">
                                            <div className="receveur-avatar">
                                                {bus.receveur_prenom?.charAt(0)}{bus.receveur_nom?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Receveur en charge</p>
                                                <p className="font-bold text-slate-700">{bus.receveur_prenom} {bus.receveur_nom}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="empty-tracking">
                                <Route size={64} />
                                <div>
                                    <h2 className="text-xl font-bold text-slate-700">Aucun voyage en cours</h2>
                                    <p className="text-slate-400 font-medium">Les bus actifs apparaîtront ici dès que les services commencent.</p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default Tracking;

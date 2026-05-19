import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    MapPin,
    User,
    Printer,
    CheckCircle,
    Bus,
    History,
    Ticket,
    ArrowRight,
    FileText,
    TrendingUp,
    ShieldCheck,
    AlertTriangle,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from "react-qr-code";
import { showAlert } from '../../utils/alert';
import './Guichet.css'; // We will create this

const Guichet = () => {
    const { mode, setMode } = useOutletContext() || { mode: 'Vente Directe', setMode: () => { } };
    const navigate = useNavigate();
    const [lignes, setLignes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [tarifConfig, setTarifConfig] = useState(null);
    const [agentInfo, setAgentInfo] = useState({ id: null, nom: 'Guichetier', prenom: '', matricule: '-' });

    // Form state
    const [selectedLigne, setSelectedLigne] = useState('');
    // Calcul de la date d'aujourd'hui et de demain au format YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const [dateVoyage, setDateVoyage] = useState(todayStr);
    const [horaire, setHoraire] = useState('');
    const [selectedBus, setSelectedBus] = useState('');
    const [arretDepart, setArretDepart] = useState('');
    const [arretArrivee, setArretArrivee] = useState('');
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [occupiedSeats, setOccupiedSeats] = useState([]);

    // New Dynamic Pricing States
    const [tarifsDb, setTarifsDb] = useState([]);
    const [bagagesDb, setBagagesDb] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('VOYAGEUR');
    const [selectedTarifId, setSelectedTarifId] = useState('');
    const [selectedBagageId, setSelectedBagageId] = useState('');

    const [isPrinting, setIsPrinting] = useState(false);
    const [myGuichet, setMyGuichet] = useState(null);
    const [dailySales, setDailySales] = useState([]);
    const [reprintTicket, setReprintTicket] = useState(null);
    const [soldTicketInfo, setSoldTicketInfo] = useState(null);
    const [isClosing, setIsClosing] = useState(false);
    const [closureResult, setClosureResult] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleCloseService = async () => {
        const userId = agentInfo.id || agentInfo.id_utilisateur;
        if (!userId) {
            localStorage.clear();
            window.location.href = '/login';
            return;
        }

        setIsClosing(true);
        setShowConfirmModal(false);
        try {
            const loginTime = localStorage.getItem('login_time');
            await fetch(`http://localhost:5000/api/Sales/agent/${userId}/close-service`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ heure_connexion: loginTime })
            });
        } catch (err) {
            console.error(err);
        } finally {
            localStorage.clear();
            window.location.href = '/login';
        }
    };

    const getLocalArrivalDate = (baseHoraire) => {
        if (!baseHoraire || !activeLigne || !arretDepart) return null;
        const [hours, minutes] = baseHoraire.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        let cumulativeMinutes = 0;
        if (arretDepart.toLowerCase().trim() !== activeLigne.ville_depart.toLowerCase().trim()) {
            const stationIdx = (activeLigne.stations || []).findIndex(s => 
                s.arret.toLowerCase().trim() === arretDepart.toLowerCase().trim()
            );
            if (stationIdx !== -1) {
                cumulativeMinutes = activeLigne.stations.slice(0, stationIdx + 1).reduce((acc, s) => acc + (parseInt(s.duree_minutes || s.duree) || 0), 0);
            }
        }

        let arrivalDate = new Date(date.getTime() + cumulativeMinutes * 60000);
        const now = new Date();

        // Logique circulaire : si l'heure est passée de plus de 12h, on considère que c'est pour demain
        // (Ex: il est 19h, on veut voir le bus de 01h00 du matin qui est donc demain)
        if (now - arrivalDate > 12 * 60 * 60 * 1000) {
            arrivalDate.setDate(arrivalDate.getDate() + 1);
        }
        
        return arrivalDate;
    };

    const getLocalTime = (baseHoraire) => {
        const arrivalDate = getLocalArrivalDate(baseHoraire);
        if (!arrivalDate) return baseHoraire;
        
        const hh = String(arrivalDate.getHours()).padStart(2, '0');
        const mm = String(arrivalDate.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            const storedUser = localStorage.getItem('user');
            let currentUser = null;
            if (storedUser) {
                try {
                    currentUser = JSON.parse(storedUser);
                    setAgentInfo({
                        id: currentUser.id || currentUser.id_utilisateur,
                        nom: currentUser.nom,
                        prenom: currentUser.prenom || '',
                        matricule: currentUser.matricule || '-'
                    });
                } catch (e) { }
            }

            try {
                // 1. On récupère d'abord toutes les données nécessaires
                const [lignesRes, busRes, tarifRes, typeTarifRes, typeBagageRes] = await Promise.all([
                    fetch('http://localhost:5000/api/network'),
                    fetch('http://localhost:5000/api/buses'),
                    fetch('http://localhost:5000/api/tarifs'),
                    fetch('http://localhost:5000/api/tarification'),
                    fetch('http://localhost:5000/api/tarification/bagages')
                ]);

                const lignesData = await lignesRes.json();
                const busData = await busRes.json();
                const tarifData = await tarifRes.json();
                const tTarifData = await typeTarifRes.json();
                const bagageData = await typeBagageRes.json();

                if (tTarifData && !tTarifData.message) {
                    setTarifsDb(tTarifData.filter(t => t.actif));
                    const voyageurs = tTarifData.filter(t => t.actif && t.categorie === 'VOYAGEUR');
                    if (voyageurs.length > 0) setSelectedTarifId(voyageurs[0].id_type_tarification);
                }
                if (bagageData && !bagageData.message) setBagagesDb(bagageData.filter(b => b.actif));

                // 2. Si on a un utilisateur connecté, on récupère son guichet pour filtrer
                // Note: AgentLogin.jsx utilise 'id' et non 'id_utilisateur'
                const userId = currentUser ? (currentUser.id || currentUser.id_utilisateur) : null;

                if (userId) {
                    try {
                        const guichetRes = await fetch(`http://localhost:5000/api/guichets/agent/${userId}`);
                        if (guichetRes.ok) {
                            const guichetData = await guichetRes.json();
                            if (guichetData) {
                                setMyGuichet(guichetData);

                                // FILTRAGE : On ne garde que les lignes ACTIVES qui partent OU PASSENT par la station du guichet
                                // EXCEPTION : Si le guichet est à l'ARRIVÉE finale de la ligne, on ne la montre pas (on ne peut plus rien vendre)
                                const filteredLignes = lignesData.filter(ligne => {
                                    // 1. Vérifier si la ligne est active
                                    if (ligne.statut_ligne?.toLowerCase() !== 'active') return false;

                                    // 2. Vérifier si elle correspond à l'emplacement du guichet
                                    const loc = guichetData.emplacement?.toLowerCase() || '';
                                    if (!loc) return true; // Si pas d'emplacement, on montre tout par sécurité

                                    const dep = ligne.ville_depart?.toLowerCase() || '';
                                    const arr = ligne.ville_arrivee?.toLowerCase() || '';

                                    // Si le guichet est au terminus de la ligne, on l'exclut
                                    if (loc.includes(arr) || arr.includes(loc)) return false;

                                    const isStart = loc.includes(dep) || dep.includes(loc);

                                    // On vérifie aussi si une des stations intermédiaires correspond au guichet
                                    const isIntermediate = ligne.stations?.some(s =>
                                        loc.includes(s.arret.toLowerCase()) || s.arret.toLowerCase().includes(loc)
                                    );

                                    return isStart || isIntermediate;
                                });
                                setLignes(filteredLignes);

                                // AUTO-SÉLECTION : Si une seule ligne correspond, on l'active tout de suite
                                if (filteredLignes.length === 1) {
                                    const l = filteredLignes[0];
                                    setSelectedLigne(l.num_ligne);

                                    // On fixe le départ de manière robuste
                                    const loc = guichetData.emplacement.toLowerCase();
                                    const match = l.stations.find(s =>
                                        loc.includes(s.arret.toLowerCase()) || s.arret.toLowerCase().includes(loc)
                                    );
                                    if (match) setArretDepart(match.arret); // On utilise le nom EXACT de la station
                                    else setArretDepart(l.ville_depart);

                                    // Ne PAS auto-affecter le bus ici : il sera déterminé après la sélection de l'horaire
                                }
                            } else {
                                // Fallback: L'agent n'a pas de guichet assigné
                                setLignes(lignesData.filter(l => l.statut_ligne?.toLowerCase() === 'active'));
                            }
                        } else {
                            // Fallback : On ne garde quand même que les actives
                            setLignes(lignesData.filter(l => l.statut_ligne?.toLowerCase() === 'active'));
                        }
                    } catch (e) {
                        setLignes(lignesData.filter(l => l.statut_ligne?.toLowerCase() === 'active'));
                    }
                } else {
                    setLignes(lignesData.filter(l => l.statut_ligne?.toLowerCase() === 'active'));
                }

                setBuses(Array.isArray(busData) ? busData : []);
                setTarifConfig(tarifData || {
                    prix_par_km: 0.1,
                    frais_fixes: 0.4,
                    red_etudiant: 25,
                    red_pmr: 50
                });
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error);
            }
        };


        fetchInitialData();
    }, []);

    const fetchDailySales = async () => {
        const userId = agentInfo.id || agentInfo.id_utilisateur;
        console.log("Fetching daily sales for agent:", userId);
        if (!userId) return;
        try {
            console.log("Fetching from URL:", `http://localhost:5000/api/Sales/agent/${userId}/daily`);
            const res = await fetch(`http://localhost:5000/api/Sales/agent/${userId}/daily`);
            if (res.ok) {
                const data = await res.json();
                console.log("Daily sales data received:", data.length, "items");
                setDailySales(data);
            }
        } catch (err) {
            console.error("Erreur fetchDailySales:", err);
        }
    };

    useEffect(() => {
        if (closureResult) return; // Service déjà clôturé, on ne recharge pas les données
        if (mode === 'Historique' || mode === 'Clôture') {
            fetchDailySales();
        } else if (mode === 'Réservations') {
            // Pour les réservations, on force au moins demain
            setDateVoyage(tomorrowStr);
        } else if (mode === 'Vente Directe') {
            // Pour la vente directe, c'est aujourd'hui
            setDateVoyage(todayStr);
        }
    }, [mode]);

    // Derived states
    const activeLigne = lignes.find(l => String(l.num_ligne) === String(selectedLigne));

    useEffect(() => {
        const fetchOccupiedSeats = async () => {
            if (activeLigne && dateVoyage && horaire) {
                try {
                    const res = await fetch(`http://localhost:5000/api/Sales/tickets/occupied-seats?num_ligne=${selectedLigne}&date=${dateVoyage}&heure=${horaire}&depart=${encodeURIComponent(arretDepart)}&arrivee=${encodeURIComponent(arretArrivee)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setOccupiedSeats(data);
                    }
                } catch (err) {
                    console.error("Erreur récupération sièges occupés", err);
                }
            } else {
                setOccupiedSeats([]);
            }
        };
        fetchOccupiedSeats();
    }, [selectedLigne, dateVoyage, horaire, activeLigne]);

    // Sécurité : Si on est en mode Vente et que l'horaire sélectionné est déjà passé à NOTRE station, on le réinitialise
    useEffect(() => {
        if (mode === 'Vente Directe' && horaire && horaire !== "" && activeLigne && arretDepart) {
            const arrivalDate = getLocalArrivalDate(horaire);
            const now = new Date();

            if (arrivalDate && arrivalDate < now) {
                // On laisse une petite marge de 5 minutes pour les retardataires
                if (now - arrivalDate > 5 * 60000) {
                    setHoraire('');
                    setSelectedBus('');
                }
            }
        }
    }, [mode, horaire, dateVoyage, arretDepart, activeLigne]);

    // On construit la liste des stations en incluant le point de départ et d'arrivée s'ils n'existent pas
    const activeStations = React.useMemo(() => {
        if (!activeLigne) return [];
        let stations = [...(activeLigne.stations || [])];

        // 1. S'assurer que le départ (ville_depart) est présent
        const hasStart = stations.some(s => Number(s.distance_km) === 0 || s.arret.toLowerCase() === activeLigne.ville_depart.toLowerCase());
        if (!hasStart) {
            stations.push({ arret: activeLigne.ville_depart, distance_km: 0, id_trajet: 'start-point' });
        }

        // 2. S'assurer que l'arrivée (ville_arrivee) est présente
        const hasEnd = stations.some(s => s.arret.toLowerCase() === activeLigne.ville_arrivee.toLowerCase());
        if (!hasEnd) {
            const maxD = stations.length > 0 ? Math.max(...stations.map(s => Number(s.distance_km))) : 0;
            stations.push({ arret: activeLigne.ville_arrivee, distance_km: maxD + 1, id_trajet: 'end-point' });
        }

        // On normalise les distances et on trie
        return stations
            .map(s => ({ ...s, distance_km: Number(s.distance_km) }))
            .sort((a, b) => a.distance_km - b.distance_km);
    }, [activeLigne]);

    // On s'assure qu'il y a un horaire pour permettre la procédure
    const hasHoraires = activeLigne ? ((activeLigne.horaires && activeLigne.horaires.length > 0 && activeLigne.horaires[0] !== null) || !!activeLigne.horaire) : false;
    // canProceed : l'agent a choisi un horaire ET le système a trouvé le bus correspondant
    const canProceed = hasHoraires && !!selectedBus;

    // Recherche robuste de la station de départ sélectionnée dans la liste ordonnée
    const departStation = activeStations.find(s => s.arret === arretDepart);
    const arriveeStation = activeStations.find(s => s.arret === arretArrivee);

    let distance = 0;
    if (departStation && arriveeStation) {
        distance = Math.abs(arriveeStation.distance_km - departStation.distance_km);
    }

    const currentTarif = tarifsDb.find(t => String(t.id_type_tarification) === String(selectedTarifId));
    const currentBagage = bagagesDb.find(b => String(b.id_type_bagage) === String(selectedBagageId));

    let calculatedTotal = 0;
    let basePriceBreakdown = 0;
    let reductionBreakdown = 0;
    let bagageBreakdown = 0;

    if (tarifConfig && distance > 0 && currentTarif) {
        let basePrice = (distance * tarifConfig.prix_par_km) + parseFloat(tarifConfig.frais_fixes || 0);
        basePriceBreakdown = basePrice;

        if (currentTarif.mode_calcul === 'PERCENT_RESTANT') {
            calculatedTotal = basePrice * (currentTarif.valeur / 100);
            reductionBreakdown = basePrice - calculatedTotal;
        } else if (currentTarif.mode_calcul === 'FIXE') {
            calculatedTotal = parseFloat(currentTarif.valeur) / 1000;
        }

        if (currentBagage) {
            bagageBreakdown = parseFloat(currentBagage.prix) / 1000;
            calculatedTotal += bagageBreakdown;
        }
    }

    // Derived Bus capacities
    const busObj = buses.find(b => String(b.numero_bus) === String(selectedBus));
    const capaciteBus = busObj ? parseInt(busObj.capacite, 10) : 50;

    // Grid Seats Generation dynamically based on real capacity
    const renderSeats = () => {
        if (!selectedBus) return <div style={{ padding: '20px', color: '#64748b' }}>Sélectionnez une ligne pour afficher les sièges.</div>;

        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

        const numRows = Math.ceil(capaciteBus / 4);
        const seatRows = [];
        let seatCount = 0;

        for (let i = 0; i < numRows; i++) {
            if (seatCount >= capaciteBus) break;

            const rowLabel = rows[i];
            const colsInThisRow = Math.min(4, capaciteBus - seatCount);
            const cols = Array.from({ length: colsInThisRow }, (_, i) => i + 1);
            seatCount += colsInThisRow;

            seatRows.push(
                <div key={rowLabel} className="seat-row">
                    {cols.map(c => {
                        const seatId = `${rowLabel}${c}`;
                        const isOccupied = occupiedSeats.includes(seatId);
                        const isSelected = selectedSeat === seatId;

                        let className = "seat ";
                        if (isOccupied) className += "occupied";
                        else if (isSelected) className += "selected";
                        else className += "available";

                        return (
                            <div
                                key={seatId}
                                className={className}
                                onClick={() => !isOccupied && setSelectedSeat(seatId)}
                            >
                                {seatId}
                            </div>
                        );
                    })}
                </div>
            );
        }
        return seatRows;
    };

    const handlePrint = async () => {
        setIsPrinting(true);
        try {
            const body = {
                num_ligne: selectedLigne,
                bus: selectedBus,
                date_voyage: dateVoyage,
                heure: getLocalTime(horaire),
                siege: selectedCategory === 'EXPEDITION' ? 'Soute' : selectedSeat,
                prix: calculatedTotal,
                arret_depart: arretDepart,
                arret_arrivee: arretArrivee,
                agent_id: agentInfo.id || agentInfo.id_utilisateur || null,
                type_tarif: currentTarif ? currentTarif.libelle : 'Tarif Normal',
                id_type_tarification: currentTarif ? currentTarif.id_type_tarification : null,
                id_type_bagage: currentBagage ? currentBagage.id_type_bagage : null,
                prix_bagage: bagageBreakdown,
                type_ticket: mode
            };

            const res = await fetch('http://localhost:5000/api/Sales/tickets/vendre', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                setSoldTicketInfo(data);
                // Update local occupied seats instantly to prevent double click while it refreshes
                setOccupiedSeats(prev => [...prev, selectedSeat]);
                setTimeout(() => {
                    window.print();
                    setIsPrinting(false);
                    // Reset soldTicketInfo after print to not affect next sale until it's done
                    setSoldTicketInfo(null);

                    // Réinitialisation des champs pour la vente suivante
                    setSelectedSeat(null);
                    setArretArrivee('');
                    setSelectedBagageId('');
                    setSelectedCategory('VOYAGEUR');
                    const defaultTarif = tarifsDb.find(t => t.actif && t.categorie === 'VOYAGEUR');
                    if (defaultTarif) setSelectedTarifId(defaultTarif.id_type_tarification);

                    // On garde la ligne et l'horaire car l'agent vend souvent plusieurs tickets pour le même bus.
                }, 700);
            } else {
                showAlert("Erreur", "Erreur lors de l'enregistrement de la vente.", "error");
                setIsPrinting(false);
            }
        } catch (err) {
            console.error(err);
            showAlert("Erreur", "Une erreur réseau est survenue lors de la vente.", "error");
            setIsPrinting(false);
        }
    };

    const handleReprint = (ticket) => {
        setReprintTicket(ticket);
        setTimeout(() => {
            window.print();
            setReprintTicket(null);
        }, 100);
    };

    const qrDataObj = {
        id_ticket: soldTicketInfo?.id_ticket || reprintTicket?.id_ticket,
        code_ticket: soldTicketInfo?.code_ticket || reprintTicket?.qr_code,
        ligne: selectedLigne || reprintTicket?.num_ligne,
        ville_depart: departStation?.arret || reprintTicket?.arret_depart || "Non spécifié",
        ville_arrivee: arriveeStation?.arret || reprintTicket?.arret_arrivee || "Non spécifié",
        date: dateVoyage || reprintTicket?.date_voyage,
        heure: getLocalTime(horaire) || reprintTicket?.heure,
        bus: selectedBus || reprintTicket?.numero_bus,
        siege: selectedSeat || reprintTicket?.siege,
        prix: (calculatedTotal || parseFloat(reprintTicket?.prix || 0)).toFixed(3),
        Matricule: agentInfo.matricule
    };
    const qrDataString = JSON.stringify(qrDataObj);
    return (
        <div className="guichet-container">
            <div className="guichet-header">
                <div>
                    <h1>Guichet de Vente</h1>
                    <p>Interface de vente et réservation</p>
                </div>
            </div>

            {mode === 'Clôture' ? (
                /* SECTION CLÔTURE SERVICE */
                <div className="historique-container animate-in">
                    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ background: '#eef2ff', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <ShieldCheck size={40} color="#4f46e5" />
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>Clôture du Service</h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Vérifiez votre bilan avant d'envoyer la fiche à l'administration.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="stat-card" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    <Clock size={16} /> HEURE DE CONNEXION
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                                    {localStorage.getItem('login_time') ? new Date(localStorage.getItem('login_time')).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </div>
                            </div>
                            <div className="stat-card" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    <TrendingUp size={16} /> HEURE ACTUELLE
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                                    {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <div className="stat-card" style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #dcfce7', gridColumn: 'span 2' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#166534', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                            <FileText size={16} /> BILAN FINANCIER DU JOUR
                                        </div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#15803d' }}>
                                            {dailySales.reduce((acc, curr) => acc + parseFloat(curr.prix), 0).toFixed(3)} <span style={{ fontSize: '1rem' }}>TND</span>
                                        </div>
                                        <div style={{ color: '#166534', fontWeight: 600, marginTop: '0.5rem' }}>
                                            {dailySales.length} tickets vendus aujourd'hui
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(21, 128, 61, 0.1)', padding: '1rem', borderRadius: '1rem' }}>
                                        <Ticket size={40} color="#15803d" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {closureResult ? (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.5rem', borderRadius: '1rem', textAlign: 'center' }}>
                                <CheckCircle size={32} color="#15803d" style={{ marginBottom: '0.5rem' }} />
                                <h3 style={{ color: '#15803d', margin: 0 }}>Service clôturé avec succès !</h3>
                                <p style={{ color: '#166534', margin: '0.5rem 0 0' }}>La fiche #A{String(closureResult.id_fiche).padStart(3, '0')} a été envoyée.</p>
                            </div>
                        ) : (
                            <button 
                                className="print-btn" 
                                style={{ width: '100%', height: '60px', fontSize: '1.1rem', background: '#4f46e5' }}
                                onClick={() => setShowConfirmModal(true)}
                                disabled={isClosing}
                            >
                                {isClosing ? 'Traitement en cours...' : 'Confirmer la Clôture et Envoyer le Rapport'}
                            </button>
                        )}
                    </div>
                </div>
            ) : mode === 'Historique' ? (
                /* SECTION HISTORIQUE */
                <div className="historique-container animate-in">
                    <div className="glass-card w-full" style={{ maxWidth: 'none', padding: '2rem' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h3><History size={24} /> Ventes d'Aujourd'hui</h3>
                            <button className="btn-pdf" onClick={fetchDailySales}>Actualiser</button>
                        </div>

                        {dailySales.length > 0 ? (
                            <div className="table-responsive">
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Ligne & Destination</th>
                                            <th>Heure</th>
                                            <th>Bus</th>
                                            <th>Siège</th>
                                            <th>Type</th>
                                            <th>Trajet (Arrêts)</th>
                                            <th>Tarif</th>
                                            <th>Prix</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailySales.map((t) => (
                                            <tr key={t.id_ticket}>
                                                <td><span className="badge badge-blue">T{String(t.id_ticket).padStart(3, '0')}</span></td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800">Ligne {t.num_ligne}</span>
                                                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                                            {t.ligne_depart} → {t.ligne_arrivee}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td><span className="time-badge">{t.heure.substring(0, 5)}</span></td>
                                                <td><span className="bus-badge">Bus {t.numero_bus}</span></td>
                                                <td><span className="seat-badge">{t.siege}</span></td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 700,
                                                        background: t.type_ticket === 'Directe' ? '#ecfdf5' : '#eff6ff',
                                                        color: t.type_ticket === 'Directe' ? '#059669' : '#2563eb',
                                                        border: `1px solid ${t.type_ticket === 'Directe' ? '#10b981' : '#3b82f6'}`,
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {t.type_ticket}
                                                    </span>
                                                </td>
                                                <td className="text-sm font-medium text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <span className="opacity-60">{t.arret_depart}</span>
                                                        <ArrowRight size={12} className="text-indigo-400" />
                                                        <span>{t.arret_arrivee}</span>
                                                    </div>
                                                </td>
                                                <td><span className={`badge-tarif ${t.type_tarif.toLowerCase().replace('é', 'e')}`}>{t.type_tarif}</span></td>
                                                <td className="font-bold text-indigo-700">{parseFloat(t.prix).toFixed(3)} TND</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state py-10 text-center text-slate-400">
                                <Ticket size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>Aucun ticket vendu aujourd'hui.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="guichet-content">
                    {/* Left Forms */}
                    <div className="guichet-forms">

                        {/* SECTION 1: Ligne */}
                        <div className="form-section">
                            <h3><MapPin size={20} /> Sélection de la Ligne</h3>
                            <select
                                className="g-select"
                                value={selectedLigne}
                                onChange={(e) => {
                                    const newLigneId = e.target.value;
                                    setSelectedLigne(newLigneId);

                                    // On cherche la ligne correspondante
                                    const foundLigne = lignes.find(l => String(l.num_ligne) === String(newLigneId));
                                    if (foundLigne && myGuichet) {
                                        // On cherche la station qui correspond à l'emplacement du guichet
                                        const loc = myGuichet.emplacement.toLowerCase();
                                        const match = foundLigne.stations.find(s =>
                                            loc.includes(s.arret.toLowerCase()) || s.arret.toLowerCase().includes(loc)
                                        );
                                        if (match) setArretDepart(match.arret); // On utilise le nom EXACT de la station
                                        else setArretDepart(foundLigne.ville_depart); // Fallback
                                    } else if (foundLigne) {
                                        // Si pas de guichet spécifique, le point de départ est tout simplement la ville de départ de la ligne
                                        setArretDepart(foundLigne.ville_depart);
                                    }

                                    setArretArrivee('');
                                    setSelectedSeat(null);
                                    setHoraire(''); // Réinitialiser l'horaire pour forcer un nouveau choix
                                    setSelectedBus(''); // Réinitialiser le bus
                                }}
                            >
                                <option value="">Sélectionnez une ligne...</option>
                                {lignes.map(l => (
                                    <option key={l.num_ligne} value={l.num_ligne}>
                                        ligne {l.num_ligne} : {l.ville_depart} → {l.ville_arrivee}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* SECTION: Date (Only for Reservation) */}
                        {mode === 'Réservations' && (
                            <div className="form-section">
                                <h3><Calendar size={20} /> Date du Voyage </h3>
                                <input
                                    type="date"
                                    className="g-input"
                                    value={dateVoyage}
                                    min={tomorrowStr} // Empêche de choisir aujourd'hui ou le passé
                                    onChange={(e) => setDateVoyage(e.target.value)}
                                    disabled={activeLigne && !canProceed}
                                />
                            </div>
                        )}

                        {/* SECTION 2: Horaire et Bus */}
                        <div className="form-section">
                            <h3><Clock size={20} /> {mode === 'Réservations' ? 'Horaire et Bus *' : 'Horaire de Départ et Bus'}</h3>
                            <div className="flex-row">
                                <div className="flex-1">
                                    <label>Horaire de Départ *</label>
                                    {activeLigne && activeLigne.horaires && activeLigne.horaires.length > 0 && activeLigne.horaires[0] !== null ? (
                                        <select className="g-select" value={horaire} onChange={(e) => {
                                            const h = e.target.value;
                                            setHoraire(h);
                                            // Auto-affecter le bus selon ligne + horaire (config Admin)
                                            const matchingBus = buses.find(b => {
                                                if (!b.horaire_affecte || !h) return false;
                                                // Handle both HH:mm and HH:mm:ss formats
                                                const dbTime = b.horaire_affecte.substring(0, 5);
                                                const selectedTime = h.substring(0, 5);
                                                return String(b.num_ligne) === String(selectedLigne) &&
                                                    dbTime === selectedTime;
                                            });
                                            setSelectedBus(matchingBus ? matchingBus.numero_bus : '');
                                            setSelectedSeat(null);
                                        }}>
                                            <option value="">--:--</option>
                                            {(activeLigne.horaires || [])
                                                .filter(h => !!h)
                                                .sort((a, b) => {
                                                    const dateA = getLocalArrivalDate(a);
                                                    const dateB = getLocalArrivalDate(b);
                                                    if (!dateA || !dateB) return 0;
                                                    return dateA - dateB;
                                                })
                                                .map((h, i) => {
                                                const arrivalDate = getLocalArrivalDate(h);
                                                const now = new Date();

                                                // En mode Vente Directe, on bloque si l'heure d'arrivée à NOTRE station est passée (avec marge 5min)
                                                const isPast = mode === 'Vente Directe' && arrivalDate && (now - arrivalDate > 5 * 60000);

                                                return (
                                                    <option
                                                        key={i}
                                                        value={h}
                                                        disabled={isPast}
                                                        style={isPast ? { color: '#ccc', fontStyle: 'italic' } : {}}
                                                    >
                                                        {getLocalTime(h)} {isPast ? ' (Passé)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    ) : activeLigne && activeLigne.horaire ? (
                                        <select className="g-select" value={horaire} onChange={e => {
                                            const h = e.target.value;
                                            setHoraire(h);
                                            const matchingBus = buses.find(b =>
                                                String(b.num_ligne) === String(selectedLigne) &&
                                                b.horaire_affecte === h
                                            );
                                            setSelectedBus(matchingBus ? matchingBus.numero_bus : '');
                                            setSelectedSeat(null);
                                        }}>
                                            <option value="">--:--</option>
                                            {(() => {
                                                const h = activeLigne.horaire;
                                                if (!h) return null;
                                                
                                                const arrivalDate = getLocalArrivalDate(h);
                                                const now = new Date();
                                                const isPast = mode === 'Vente Directe' && arrivalDate && (now - arrivalDate > 5 * 60000);
                                                
                                                return (
                                                    <option
                                                        value={h}
                                                        disabled={isPast}
                                                        style={isPast ? { color: '#ccc', fontStyle: 'italic' } : {}}
                                                    >
                                                        {getLocalTime(h)} {isPast ? ' (Déjà passé)' : ''}
                                                    </option>
                                                );
                                            })()}
                                        </select>
                                    ) : (
                                        <select className="g-select" value="" disabled>
                                            <option value="">Aucun horaire défini</option>
                                        </select>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label>Bus *</label>
                                    {selectedBus ? (
                                        <div className="g-input-fixed" style={{ color: '#4f46e5', fontWeight: 700 }}>
                                            🚌 Bus {selectedBus} — {buses.find(b => String(b.numero_bus) === String(selectedBus))?.capacite || '?'} places
                                        </div>
                                    ) : (
                                        <div className="g-input-fixed" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                            {horaire ? '⚠️ Aucun bus affecté à cet horaire' : 'Choisissez un horaire'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="info-bar bg-blue-light">
                                Sièges disponibles: <strong>{selectedBus ? Math.max(0, capaciteBus - occupiedSeats.length) : 0} / {capaciteBus}</strong>
                            </div>
                        </div>

                        {/* SECTION 3: Arrêts */}
                        {activeLigne && (
                            <div className="form-section">
                                <h3>Sélection de l'Arrivée</h3>
                                <div className="flex-row">
                                    <div className="flex-1">
                                        <label>Point de Départ (Fixé)</label>
                                        <div className="g-input-fixed">
                                            <MapPin size={16} /> {arretDepart || 'Chargement...'}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label>Destination (Arrivée) *</label>
                                        <select className="g-select" value={arretArrivee} onChange={e => setArretArrivee(e.target.value)} disabled={activeLigne && !canProceed}>
                                            <option value="">Choisir arrivée...</option>
                                            {activeStations
                                                .filter(s => {
                                                    // On ne montre que les stations situées APRÈS le point de départ sélectionné
                                                    if (!departStation) return s.arret !== arretDepart;
                                                    return s.distance_km > departStation.distance_km;
                                                })
                                                .map(s => (
                                                    <option key={s.arret} value={s.arret}>{s.arret}</option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {departStation && arriveeStation && (
                                    <div className="distance-tracker mt-3">
                                        <div className="tracker-line"></div>
                                        <div className="point start">
                                            <div className="dot green"></div>
                                            <span>{departStation.arret}</span>
                                        </div>
                                        <div className="distance-label">Distance: {distance.toFixed(1)} km</div>
                                        <div className="point end">
                                            <div className="dot red"></div>
                                            <span>{arriveeStation.arret}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SECTION 4: Tarif & Bagage */}
                        <div className="form-section mb-5 bg-indigo-50 border-indigo-100" style={{ border: '1px solid #e0e7ff', padding: '15px', borderRadius: '8px' }}>
                            <h3 style={{ color: '#4f46e5' }}><User size={20} /> Tarification et Suppléments</h3>

                            <div className="flex-row">
                                <div className="flex-1">
                                    <label>Catégorie *</label>
                                    <select className="g-select" value={selectedCategory} onChange={(e) => {
                                        const cat = e.target.value;
                                        setSelectedCategory(cat);
                                        const ops = tarifsDb.filter(t => t.categorie === cat);
                                        if (ops.length > 0) setSelectedTarifId(ops[0].id_type_tarification);
                                        else setSelectedTarifId('');
                                        
                                        // On réinitialise les bagages si c'est une expédition
                                        if (cat === 'EXPEDITION') {
                                            setSelectedBagageId('');
                                            // Optional: reset seat selection when switching to expedition
                                            setSelectedSeat(null);
                                        }
                                    }}>
                                        <option value="VOYAGEUR">Voyageur (Réductions & Base)</option>
                                        <option value="CONVENTION">Conventions (Police, Armée...)</option>
                                        <option value="EXPEDITION">Expéditions / Colis</option>
                                    </select>
                                </div>

                                <div className="flex-1">
                                    <label>Type de Tarif *</label>
                                    <select className="g-select" value={selectedTarifId} onChange={(e) => setSelectedTarifId(e.target.value)}>
                                        {tarifsDb.filter(t => t.categorie === selectedCategory).map(t => (
                                            <option key={t.id_type_tarification} value={t.id_type_tarification}>
                                                {t.libelle} ({t.mode_calcul === 'PERCENT_RESTANT' ? t.valeur + '% à payer' : (t.valeur / 1000).toFixed(3) + ' TND fix'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {selectedCategory !== 'EXPEDITION' && (
                                <div className="flex-row mt-3">
                                    <div className="flex-1">
                                        <label>Bagages supplémentaires (Optionnel)</label>
                                        <select className="g-select" value={selectedBagageId} onChange={(e) => setSelectedBagageId(e.target.value)}>
                                            <option value="">-- Aucun supplément bagage --</option>
                                            {bagagesDb.map(b => (
                                                <option key={b.id_type_bagage} value={b.id_type_bagage}>
                                                    {b.libelle} (+ {(b.prix / 1000).toFixed(3)} TND)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION 5: Sièges */}
                        {selectedCategory !== 'EXPEDITION' ? (
                            <div className="form-section">
                                <h3>Sélection du Siège *</h3>
                                <div className="seat-grid-container" style={{ opacity: (activeLigne && !canProceed) ? 0.5 : 1, pointerEvents: (activeLigne && !canProceed) ? 'none' : 'auto' }}>
                                    <div className="seat-grid">
                                        {renderSeats()}
                                    </div>
                                    <div className="seat-legend">
                                        <div><span className="box available"></span> Disponible</div>
                                        <div><span className="box occupied"></span> Occupé</div>
                                        <div><span className="box selected"></span> Sélectionné</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="form-section">
                                <h3>Sélection du Siège</h3>
                                <div className="info-bar bg-blue-light" style={{ marginBottom: 0 }}>
                                    Pour une expédition, la sélection de siège n'est pas nécessaire. Le colis sera placé dans la soute.
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Panel: Résumé */}
                    <div className="guichet-summary-panel">
                        <div className="summary-card">
                            <h3><span className="dollar-icon">$</span> {mode === 'Réservations' ? 'Résumé Réservation' : 'Résumé'}</h3>

                            <div className="summary-details">
                                <div className="row">
                                    <span>Ligne:</span>
                                    <strong>{activeLigne ? `${activeLigne.ville_depart} → ${activeLigne.ville_arrivee}` : '-'}</strong>
                                </div>
                                {mode === 'Réservations' && (
                                    <div className="row">
                                        <span>Date:</span>
                                        <strong>{dateVoyage.split('-').reverse().join('/')}</strong>
                                    </div>
                                )}
                                <div className="row">
                                    <span>Horaire:</span>
                                    <strong>{getLocalTime(horaire) || '-'}</strong>
                                </div>
                                <div className="row">
                                    <span>Bus:</span>
                                    <strong>{selectedBus || '-'}</strong>
                                </div>
                                <div className="row">
                                    <span>Siège:</span>
                                    <strong>{selectedCategory === 'EXPEDITION' ? 'Soute' : (selectedSeat || '-')}</strong>
                                </div>
                                <div className="row">
                                    <span>Départ:</span>
                                    <strong>{arretDepart || '-'}</strong>
                                </div>
                                <div className="row">
                                    <span>Arrivée:</span>
                                    <strong>{arretArrivee || '-'}</strong>
                                </div>
                                <div className="row">
                                    <span>Distance:</span>
                                    <strong>{distance.toFixed(1)} km</strong>
                                </div>
                                <div className="row">
                                    <span>Type:</span>
                                    <strong>{currentTarif ? currentTarif.libelle : '-'}</strong>
                                </div>
                            </div>

                            <div className="summary-breakdown" style={{ borderTop: '1px solid #e2e8f0', margin: '15px 0', paddingTop: '15px' }}>
                                <div className="row text-sm text-slate-600">
                                    <span>Prix de Base:</span>
                                    <span>{basePriceBreakdown.toFixed(3)} TND</span>
                                </div>
                                {reductionBreakdown > 0 && (
                                    <div className="row text-sm text-emerald-600 font-medium">
                                        <span>Réduction appliquée:</span>
                                        <span>- {reductionBreakdown.toFixed(3)} TND</span>
                                    </div>
                                )}
                                {currentTarif && currentTarif.mode_calcul === 'FIXE' && (
                                    <div className="row text-sm text-indigo-600 font-medium">
                                        <span>Tarif Fixe appliqué:</span>
                                        <span>{calculatedTotal.toFixed(3)} TND</span>
                                    </div>
                                )}
                                {bagageBreakdown > 0 && (
                                    <div className="row text-sm text-amber-600 font-medium">
                                        <span>Supplément Bagage:</span>
                                        <span>+ {bagageBreakdown.toFixed(3)} TND</span>
                                    </div>
                                )}
                            </div>

                            <div className="summary-total" style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '15px' }}>
                                <span>Total à Payer:</span>
                                <h2>{calculatedTotal.toFixed(3)} TND</h2>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                <button
                                    className="print-btn"
                                    style={{ flex: 1, margin: 0 }}
                                    disabled={(!selectedSeat && selectedCategory !== 'EXPEDITION') || !selectedLigne || !arretDepart || !arretArrivee || calculatedTotal <= 0}
                                    onClick={handlePrint}
                                >
                                    <Printer size={18} /> {mode === 'Réservations' ? 'Confirmer Réservation' : 'Imprimer le Ticket'}
                                </button>
                                <button
                                    className="print-btn"
                                    style={{ flex: 1, margin: 0, background: '#e2e8f0', color: '#475569', boxShadow: 'none' }}
                                    onClick={() => {
                                        setSelectedLigne('');
                                        setHoraire('');
                                        setSelectedBus('');
                                        setSelectedSeat(null);
                                        setArretDepart('');
                                        setArretArrivee('');
                                        setSelectedBagageId('');
                                        setSelectedCategory('VOYAGEUR');
                                        setDateVoyage('');
                                        const defaultTarif = tarifsDb.find(t => t.actif && t.categorie === 'VOYAGEUR');
                                        if (defaultTarif) setSelectedTarifId(defaultTarif.id_type_tarification);
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Layout Hidden - Activated via @media print */}
            <div className="print-only">
                {reprintTicket ? (
                    /* Ticket de réimpression */
                    <div className="ticket-print-box">
                        <h1 className="t-logo">TuniMove</h1>
                        <p className="t-subtitle">Société Nationale de Transport Routier Inter-Gouvernorats</p>

                        <div className="t-info-grid">
                            <span>N° Ticket:</span><strong>T{String(reprintTicket.id_ticket).padStart(3, '0')}</strong>
                            <span>Agent: </span><strong>{agentInfo.matricule}</strong>
                            <span>Guichet: </span><strong>{myGuichet ? myGuichet.nom_guichet : '-'}</strong>
                            <span>Ligne:</span><strong>Ligne {reprintTicket.num_ligne} ({reprintTicket.ligne_depart} - {reprintTicket.ligne_arrivee})</strong>
                            <span>Départ:</span><strong>{reprintTicket.arret_depart}</strong>
                            <span>Arrivée:</span><strong>{reprintTicket.arret_arrivee}</strong>
                            <span>Date:</span><strong>{new Date(reprintTicket.date_voyage).toLocaleDateString('fr-FR')}</strong>
                            <span>Heure:</span><strong>{reprintTicket.heure.substring(0, 5)}</strong>
                            <span>Siège:</span><strong>{reprintTicket.siege}</strong>
                            <span>Bus:</span><strong>N° {reprintTicket.numero_bus}</strong>
                        </div>

                        <h2 className="t-price">{parseFloat(reprintTicket.prix).toFixed(3)} TND</h2>

                        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                            <QRCode value={reprintTicket.qr_code} size={120} level="H" />
                        </div>
                        <p className="t-footer">Agent: {agentInfo.prenom} {agentInfo.nom}<br />Réimpression - Bon voyage !</p>
                    </div>
                ) : (
                    /* Ticket standard après vente */
                    <div className="ticket-print-box">
                        <h1 className="t-logo">TuniMove</h1>


                        <div className="t-info-grid">
                            <span>N° Ticket:</span><strong>{soldTicketInfo?.id_ticket ? `T${String(soldTicketInfo.id_ticket).padStart(3, '0')}` : '----'}</strong>
                            <span>Agent: </span><strong>{agentInfo.matricule}</strong>
                            <span>Guichet: </span><strong>{myGuichet ? myGuichet.nom_guichet : '-'}</strong>
                            <span>Ligne:</span><strong>{activeLigne ? `${activeLigne.ville_depart} - ${activeLigne.ville_arrivee}` : ''}</strong>
                            <span>Départ:</span><strong>{arretDepart}</strong>
                            <span>Arrivée:</span><strong>{arretArrivee}</strong>
                            <span>Date:</span><strong>{typeof dateVoyage === 'string' ? dateVoyage.split('-').reverse().join('/') : ''}</strong>
                            <span>Heure:</span><strong>{getLocalTime(horaire)}</strong>
                            <span>Siège:</span><strong>{selectedCategory === 'EXPEDITION' ? 'Soute' : selectedSeat}</strong>
                            <span>Bus:</span><strong>N° {selectedBus}</strong>
                            <span>Distance:</span><strong>{distance.toFixed(0)} km</strong>
                            <span>Type Tarif:</span><strong>{currentTarif ? currentTarif.libelle : '-'}</strong>
                            {currentBagage && (
                                <>
                                    <span>Bagage:</span><strong>{currentBagage.libelle}</strong>
                                </>
                            )}
                        </div>

                        <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                            <span>Prix de base:</span>
                            <span>{basePriceBreakdown.toFixed(3)} TND</span>
                        </div>
                        {reductionBreakdown > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                <span>Réduction:</span>
                                <span>-{reductionBreakdown.toFixed(3)} TND</span>
                            </div>
                        )}
                        {bagageBreakdown > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                <span>Bagage:</span>
                                <span>+{bagageBreakdown.toFixed(3)} TND</span>
                            </div>
                        )}

                        <h2 className="t-price" style={{ marginTop: '5px' }}>{calculatedTotal.toFixed(3)} TND</h2>

                        <div style={{ display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
                            <QRCode
                                value={qrDataString}
                                size={120}
                                level="H"
                            />
                        </div>

                        <p className="t-footer" style={{ textTransform: 'capitalize' }}>Agent: {agentInfo.prenom} {agentInfo.nom}<br />Bon voyage !</p>
                    </div>
                )}
            </div>
            {/* MODAL DE CONFIRMATION CLÔTURE */}
            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div 
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.6)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '20px'
                        }}
                        onClick={() => setShowConfirmModal(false)}
                    >
                        <motion.div 
                            className="glass-card"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            style={{
                                width: '100%',
                                maxWidth: '500px',
                                padding: '2.5rem',
                                textAlign: 'center',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ 
                                background: '#fef2f2', 
                                width: '64px', 
                                height: '64px', 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                margin: '0 auto 1.5rem' 
                            }}>
                                <AlertTriangle size={32} color="#dc2626" />
                            </div>

                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>
                                Confirmer la clôture ?
                            </h3>
                            
                            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem', fontSize: '1.05rem' }}>
                                Êtes-vous sûr de vouloir clôturer votre service pour aujourd'hui ? <br/>
                                <strong style={{ color: '#475569' }}>Cette action enverra votre bilan financier final à l'administration.</strong>
                            </p>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button 
                                    style={{ 
                                        flex: 1, 
                                        padding: '12px', 
                                        borderRadius: '12px', 
                                        border: '1px solid #e2e8f0', 
                                        background: 'white', 
                                        color: '#64748b', 
                                        fontWeight: 700, 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => setShowConfirmModal(false)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                >
                                    Annuler
                                </button>
                                <button 
                                    style={{ 
                                        flex: 1, 
                                        padding: '12px', 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        background: '#dc2626', 
                                        color: 'white', 
                                        fontWeight: 700, 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
                                    }}
                                    onClick={handleCloseService}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                                >
                                    Oui, Clôturer
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Guichet;

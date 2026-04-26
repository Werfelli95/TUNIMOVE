import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
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
    ArrowRight
} from 'lucide-react';
import QRCode from "react-qr-code";
import './Guichet.css'; // We will create this

const Guichet = () => {
    const { mode, setMode } = useOutletContext() || { mode: 'Vente Directe', setMode: () => { } };
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

                                // FILTRAGE : On ne garde que les lignes ACTIVES qui partent de la station du guichet
                                const filteredLignes = lignesData.filter(ligne => {
                                    // 1. Vérifier si la ligne est active
                                    if (ligne.statut_ligne?.toLowerCase() !== 'active') return false;

                                    // 2. Vérifier si elle correspond à l'emplacement du guichet
                                    const loc = guichetData.emplacement?.toLowerCase() || '';
                                    if (!loc) return true; // Si pas d'emplacement, on montre tout par sécurité

                                    const dep = ligne.ville_depart?.toLowerCase() || '';

                                    // STREICT FILTER: Only show lines starting EXACTLY from this station/city
                                    return loc.includes(dep) || dep.includes(loc);
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
                    red_handicape: 50
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
        if (mode === 'Historique') {
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

    // On construit la liste des stations en incluant le point de départ s'il n'existe pas déjà à 0 km
    const activeStations = React.useMemo(() => {
        if (!activeLigne) return [];
        let stations = [...(activeLigne.stations || [])];

        // Vérifier si la ville de départ est déjà présente à 0 km
        const hasStart = stations.some(s => s.distance_km === 0 || s.arret.toLowerCase() === activeLigne.ville_depart.toLowerCase());

        if (!hasStart) {
            // Ajouter la ville de départ comme point 0
            stations.push({
                arret: activeLigne.ville_depart,
                distance_km: 0,
                id_trajet: 'start-point'
            });
        }

        return stations.sort((a, b) => a.distance_km - b.distance_km);
    }, [activeLigne]);

    // On s'assure qu'il y a un horaire pour permettre la procédure
    const hasHoraires = activeLigne ? ((activeLigne.horaires && activeLigne.horaires.length > 0 && activeLigne.horaires[0] !== null) || !!activeLigne.horaire) : false;
    // canProceed : l'agent a choisi un horaire ET le système a trouvé le bus correspondant
    const canProceed = hasHoraires && !!selectedBus;

    // Recherche robuste des stations pour le calcul de distance
    const departStation = activeStations.find(s =>
        (s.arret === arretDepart) ||
        (arretDepart && (s.arret.toLowerCase().includes(arretDepart.toLowerCase()) || arretDepart.toLowerCase().includes(s.arret.toLowerCase()))) ||
        (s.distance_km === 0 && activeLigne && s.arret.toLowerCase() === activeLigne.ville_depart.toLowerCase())
    );
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

        const numRows = Math.ceil(capaciteBus / 5);
        const seatRows = [];
        let seatCount = 0;

        for (let i = 0; i < numRows; i++) {
            if (seatCount >= capaciteBus) break;

            const rowLabel = rows[i];
            const colsInThisRow = Math.min(5, capaciteBus - seatCount);
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
                heure: horaire,
                siege: selectedSeat,
                prix: calculatedTotal,
                arret_depart: arretDepart,
                arret_arrivee: arretArrivee,
                agent_id: agentInfo.id || agentInfo.id_utilisateur || null,
                type_tarif: currentTarif ? currentTarif.libelle : 'Tarif Normal',
                id_type_tarification: currentTarif ? currentTarif.id_type_tarification : null,
                id_type_bagage: currentBagage ? currentBagage.id_type_bagage : null,
                prix_bagage: bagageBreakdown
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
                }, 700);
            } else {
                alert("Erreur lors de l'enregistrement de la vente.");
                setIsPrinting(false);
            }
        } catch (err) {
            console.error(err);
            alert("Erreur réseau");
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
        heure: horaire || reprintTicket?.heure,
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

            {mode !== 'Historique' ? (
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
                                        <select className="g-select" value={horaire} onChange={e => {
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
                                            {activeLigne.horaires.map((h, i) => (
                                                <option key={i} value={h}>{h}</option>
                                            ))}
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
                                            <option value={activeLigne.horaire}>{activeLigne.horaire}</option>
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
                                Sièges disponibles: <strong>{selectedBus ? Math.max(0, capaciteBus - 0) : 0} / {capaciteBus}</strong>
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
                                                .filter(s => s.arret !== arretDepart) // On ne peut pas arriver là où on part
                                                .map(s => (
                                                    <option key={s.arret} value={s.arret}>{s.arret} ({s.distance_km} km)</option>
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

                        {/* SECTION 4: Sièges */}
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

                        {/* SECTION 5: Tarif & Bagage */}
                        <div className="form-section mb-5 bg-indigo-50 border-indigo-100" style={{ border: '1px solid #e0e7ff', padding: '15px', borderRadius: '8px' }}>
                            <h3 style={{ color: '#4f46e5' }}><User size={20} /> Tarification et Suppléments</h3>

                            <div className="flex-row">
                                <div className="flex-1">
                                    <label>Catégorie *</label>
                                    <select className="g-select" value={selectedCategory} onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        const ops = tarifsDb.filter(t => t.categorie === e.target.value);
                                        if (ops.length > 0) setSelectedTarifId(ops[0].id_type_tarification);
                                        else setSelectedTarifId('');
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
                        </div>

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
                                    <strong>{horaire || '-'}</strong>
                                </div>
                                <div className="row">
                                    <span>Bus:</span>
                                    <strong>{selectedBus || '-'}</strong>
                                </div>
                                <div className="row">
                                    <span>Siège:</span>
                                    <strong>{selectedSeat || '-'}</strong>
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

                            <button
                                className="print-btn"
                                disabled={!selectedSeat || !selectedLigne || !arretDepart || !arretArrivee || calculatedTotal <= 0}
                                onClick={handlePrint}
                            >
                                <Printer size={18} /> {mode === 'Réservations' ? 'Confirmer Réservation' : 'Imprimer le Ticket'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
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

                        <div className="t-qr" style={{ margin: '20px auto', textAlign: 'center', background: 'white', padding: '10px', display: 'inline-block' }}>
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
                            <span>Heure:</span><strong>{horaire}</strong>
                            <span>Siège:</span><strong>{selectedSeat}</strong>
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

                        <div className="t-qr" style={{ margin: '15px auto', textAlign: 'center', background: 'white', padding: '10px', display: 'inline-block' }}>
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
        </div>
    );
};

export default Guichet;

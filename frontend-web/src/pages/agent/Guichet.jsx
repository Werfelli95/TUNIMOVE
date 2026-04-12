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
    Ticket
} from 'lucide-react';
import QRCode from "react-qr-code";
import './Guichet.css'; // We will create this

const Guichet = () => {
    const { mode, setMode } = useOutletContext() || { mode: 'Vente Directe', setMode: () => { } };
    const [lignes, setLignes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [tarifConfig, setTarifConfig] = useState(null);
    const [agentInfo, setAgentInfo] = useState({ nom: 'Guichetier', prenom: '', matricule: '-' });

    // Form state
    const [selectedLigne, setSelectedLigne] = useState('');
    const [dateVoyage, setDateVoyage] = useState(new Date().toISOString().split('T')[0]);
    const [horaire, setHoraire] = useState('');
    const [selectedBus, setSelectedBus] = useState('');
    const [arretDepart, setArretDepart] = useState('');
    const [arretArrivee, setArretArrivee] = useState('');
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [typeTarif, setTypeTarif] = useState('Tarif Plein');

    const [isPrinting, setIsPrinting] = useState(false);
    const [myGuichet, setMyGuichet] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            const storedUser = localStorage.getItem('user');
            let currentUser = null;
            if (storedUser) {
                try {
                    currentUser = JSON.parse(storedUser);
                    setAgentInfo({
                        nom: currentUser.nom,
                        prenom: currentUser.prenom || '',
                        matricule: currentUser.matricule || '-'
                    });
                } catch (e) { }
            }

            try {
                // 1. On récupère d'abord toutes les données nécessaires
                const [lignesRes, busRes, tarifRes] = await Promise.all([
                    fetch('http://localhost:5000/api/network'),
                    fetch('http://localhost:5000/api/buses'),
                    fetch('http://localhost:5000/api/tarifs')
                ]);

                const lignesData = await lignesRes.json();
                const busData = await busRes.json();
                const tarifData = await tarifRes.json();

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
                                    if (ligne.statut_ligne !== 'Active') return false;
                                    
                                    // 2. Vérifier si elle correspond à l'emplacement du guichet
                                    const loc = guichetData.emplacement.toLowerCase();
                                    const dep = ligne.ville_depart.toLowerCase();
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

                                    // Auto-assign bus
                                    const assignedBus = busData.find(b => String(b.num_ligne) === String(l.num_ligne));
                                    if (assignedBus) setSelectedBus(assignedBus.numero_bus);
                                }
                            } else {
                                // Fallback: L'agent n'a pas de guichet assigné
                                setLignes(lignesData.filter(l => l.statut_ligne === 'Active'));
                            }
                        } else {
                            // Fallback : On ne garde quand même que les actives
                            setLignes(lignesData.filter(l => l.statut_ligne === 'Active'));
                        }
                    } catch (e) {
                        setLignes(lignesData.filter(l => l.statut_ligne === 'Active'));
                    }
                } else {
                    setLignes(lignesData.filter(l => l.statut_ligne === 'Active'));
                }

                setBuses(busData || []);
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

    // Derived states
    const activeLigne = lignes.find(l => String(l.num_ligne) === String(selectedLigne));

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

    // On considère qu'on a toujours des horaires car on permet la saisie manuelle s'il n'y en a pas en base
    const hasHoraires = true;
    const hasBus = selectedLigne ? buses.some(b => String(b.num_ligne) === String(selectedLigne)) : false;
    const canProceed = hasBus;

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

    let calculatedTotal = 0;
    if (tarifConfig && distance > 0) {
        let basePrice = (distance * tarifConfig.prix_par_km) + tarifConfig.frais_fixes;
        if (typeTarif === 'Étudiant') basePrice *= (1 - tarifConfig.red_etudiant / 100);
        if (typeTarif === 'Handicapé') basePrice *= (1 - tarifConfig.red_handicape / 100);
        calculatedTotal = basePrice;
    }

    // Derived Bus capacities
    const busObj = buses.find(b => String(b.numero_bus) === String(selectedBus));
    const capaciteBus = busObj ? parseInt(busObj.capacite, 10) : 50;

    // Grid Seats Generation dynamically based on real capacity
    const renderSeats = () => {
        if (!selectedBus) return <div style={{ padding: '20px', color: '#64748b' }}>Sélectionnez une ligne pour afficher les sièges.</div>;

        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

        // In a real app, this comes from backend tickets
        const occupied = [];

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
                        const isOccupied = occupied.includes(seatId);
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

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500);
    };
    const qrDataObj = {
        ligne: selectedLigne,
        ville_depart: departStation?.arret || "Non spécifié",
        ville_arrivee: arriveeStation?.arret || "Non spécifié",
        date: dateVoyage,
        heure: horaire,
        bus: selectedBus,
        siege: selectedSeat,
        prix: calculatedTotal.toFixed(3),
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

                                // Auto-assign bus
                                const assignedBus = buses.find(b => String(b.num_ligne) === String(newLigneId));
                                if (assignedBus) {
                                    setSelectedBus(assignedBus.numero_bus);
                                } else {
                                    setSelectedBus('');
                                }
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
                                    <select className="g-select" value={horaire} onChange={e => setHoraire(e.target.value)} required disabled={activeLigne && !canProceed}>
                                        <option value="">--:--</option>
                                        {activeLigne.horaires.map((h, i) => (
                                            <option key={i} value={h}>{h}</option>
                                        ))}
                                    </select>
                                ) : activeLigne && activeLigne.horaire ? (
                                    <select className="g-select" value={horaire} onChange={e => setHoraire(e.target.value)} required disabled={activeLigne && !canProceed}>
                                        <option value="">--:--</option>
                                        <option value={activeLigne.horaire}>{activeLigne.horaire}</option>
                                    </select>
                                ) : (
                                    <input type="time" className="g-input" value={horaire} onChange={e => setHoraire(e.target.value)} required disabled={activeLigne && !canProceed} />
                                )}
                            </div>
                            <div className="flex-1">
                                <label>Bus *</label>
                                <select className="g-select" value={selectedBus} onChange={e => setSelectedBus(e.target.value)} disabled={activeLigne && !canProceed}>
                                    <option value="">Sélectionnez un bus</option>
                                    {buses.map(b => (
                                        <option key={b.id_bus} value={b.numero_bus}>
                                            Bus {b.numero_bus} - {b.modele} ({b.capacite} places)
                                        </option>
                                    ))}
                                </select>
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

                    {/* SECTION 5: Tarif */}
                    <div className="form-section mb-5">
                        <h3>Type de Tarif</h3>
                        <div className="tarif-cards">
                            <div className={`tarif-card ${typeTarif === 'Tarif Plein' ? 'active' : ''}`} onClick={() => setTypeTarif('Tarif Plein')}>
                                <User size={24} />
                                <strong>Tarif Plein</strong>
                                <span>0% réduction</span>
                            </div>
                            <div className={`tarif-card ${typeTarif === 'Étudiant' ? 'active' : ''}`} onClick={() => setTypeTarif('Étudiant')}>
                                <User size={24} />
                                <strong>Étudiant</strong>
                                <span>-25%</span>
                            </div>
                            <div className={`tarif-card ${typeTarif === 'Handicapé' ? 'active' : ''}`} onClick={() => setTypeTarif('Handicapé')}>
                                <User size={24} />
                                <strong>Handicapé</strong>
                                <span>-50%</span>
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
                                <strong>{typeTarif === 'Tarif Plein' ? 'Normal' : typeTarif}</strong>
                            </div>
                        </div>

                        <div className="summary-total">
                            <span>Total:</span>
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

            {/* Print Layout Hidden - Activated via @media print */}
            <div className="print-only">
                <div className="ticket-print-box">
                    <h1 className="t-logo">TuniMove</h1>
                    <p className="t-subtitle">Société Nationale de Transport Routier Inter-Gouvernorats</p>

                    <div className="t-info-grid">
                        <span>N° Ticket:</span><strong>T003</strong>
                        <span>Agent: </span><strong>{agentInfo.matricule}</strong>
                        <span>Ligne:</span><strong>{activeLigne ? `${activeLigne.ville_depart} - ${activeLigne.ville_arrivee}` : ''}</strong>
                        <span>Départ:</span><strong>{arretDepart}</strong>
                        <span>Arrivée:</span><strong>{arretArrivee}</strong>
                        <span>Date:</span><strong>{typeof dateVoyage === 'string' ? dateVoyage.split('-').reverse().join('/') : ''}</strong>
                        <span>Heure:</span><strong>{horaire}</strong>
                        <span>Siège:</span><strong>{selectedSeat}</strong>
                        <span>Bus:</span><strong>N° {selectedBus}</strong>
                        <span>Distance:</span><strong>{distance.toFixed(0)} km</strong>
                    </div>

                    <h2 className="t-price">{calculatedTotal.toFixed(3)} TND</h2>

                    <div className="t-qr" style={{ margin: '20px auto', textAlign: 'center', background: 'white', padding: '10px', display: 'inline-block' }}>
                        <QRCode
                            value={qrDataString}
                            size={120}
                            level="H"
                        />
                    </div>


                    <p className="t-footer" style={{ textTransform: 'capitalize' }}>Agent: {agentInfo.prenom} {agentInfo.nom}<br />Bon voyage !</p>
                </div>
            </div>
        </div>
    );
};

export default Guichet;

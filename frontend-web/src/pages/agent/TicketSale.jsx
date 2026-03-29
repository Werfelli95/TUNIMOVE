import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AgentLayout from "./AgentLayout";
import StepCard from "../../components/agent/StepCard";
import BusSeatSelector from "../../components/agent/BusSeatSelector";
import TicketPrintModal from "../../components/agent/TicketPrintModal";
import "./AgentModule.css";

const TicketSale = () => {
  const token = localStorage.getItem("token");

  const [lines, setLines] = useState([]);
  const [stops, setStops] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const [selectedLineId, setSelectedLineId] = useState("");
  const [selectedLine, setSelectedLine] = useState(null);
  const [todayService, setTodayService] = useState(null);

  const [depart, setDepart] = useState("");
  const [arrivee, setArrivee] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [reduction, setReduction] = useState("AUCUNE");

  const [fareDetails, setFareDetails] = useState(null);
  const [createdTicket, setCreatedTicket] = useState(null);

  const authHeaders = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  useEffect(() => {
    loadLines();
  }, []);

  const loadLines = async () => {
    try {
        const res = await axios.get("http://localhost:5000/api/agent/lines/active", authHeaders);
        setLines(res.data);
    } catch (err) {
        console.error("Erreur chargement lignes:", err);
    }
  };

  const handleSelectLine = async (numLigne) => {
    setSelectedLineId(numLigne);
    setDepart("");
    setArrivee("");
    setSelectedSeat(null);
    setReduction("AUCUNE");
    setFareDetails(null);
    setTodayService(null);

    // num_ligne from DB is a number; numLigne from <select> is a string
    const line = lines.find(l => String(l.num_ligne) === String(numLigne));
    setSelectedLine(line || null);

    if (!line) return;

    try {
        // Charger les arrêts
        const stopsRes = await axios.get(`http://localhost:5000/api/agent/lignes/${line.num_ligne}/stations`, authHeaders);
        setStops(stopsRes.data);

        // Tenter de trouver un service pour cette ligne aujourd'hui pour les sièges
        const servicesRes = await axios.get("http://localhost:5000/api/agent/services/today", authHeaders);
        const service = servicesRes.data.find(s => String(s.num_ligne) === String(line.num_ligne));
        
        if (service && service.id_service) {
            setTodayService(service);
            const seatsRes = await axios.get(`http://localhost:5000/api/agent/services/${service.id_service}/occupied-seats`, authHeaders);
            setOccupiedSeats(seatsRes.data);
        } else if (service) {
            // Bus assigné statiquement mais pas encore de service (on l'affichera mais sans sièges occupés)
            setTodayService(service);
            setOccupiedSeats([]);
        } else {
            console.log("Aucun service ou bus programmé pour cette ligne aujourd'hui.");
            setOccupiedSeats([]);
        }
    } catch (err) {
        console.error("Erreur chargement détails ligne:", err);
    }
  };

  const arrivalOptions = useMemo(() => {
    if (!depart) return [];
    const dep = stops.find(s => s.arret === depart);
    if (!dep) return [];
    return stops.filter(s => Number(s.distance_km) > Number(dep.distance_km));
  }, [depart, stops]);

  useEffect(() => {
    const run = async () => {
      if (!selectedLine || !depart || !arrivee) return;
      try {
          const res = await axios.post(
            "http://localhost:5000/api/agent/tarif/calculate",
            {
              num_ligne: selectedLine.num_ligne,
              arret_depart: depart,
              arret_arrivee: arrivee,
              type_reduction: reduction
            },
            authHeaders
          );
          setFareDetails(res.data);
      } catch (err) {
          console.error("Erreur calcul tarif:", err);
      }
    };
    run();
  }, [selectedLine, depart, arrivee, reduction, authHeaders]);

  const handleSellTicket = async () => {
    try {
        const res = await axios.post(
          "http://localhost:5000/api/agent/tickets",
          {
            id_service: todayService?.id_service || null,
            num_ligne: selectedLine.num_ligne,
            siege: selectedSeat,
            arret_depart: depart,
            arret_arrivee: arrivee,
            type_reduction: reduction
          },
          authHeaders
        );

        const newTicket = res.data.ticket;
        setCreatedTicket({
            ...newTicket,
            nom_ligne: `${selectedLine.ville_depart} - ${selectedLine.ville_arrivee}`,
            numero_bus: todayService?.numero_bus || "Non assigné"
        });

        // Mettre à jour aujourd'huiService pour inclure le nouvel id_service si nécessaire
        if (todayService && !todayService.id_service) {
            setTodayService(prev => ({ ...prev, id_service: newTicket.id_service }));
        }

        // Recharger les sièges occupés
        const seatsRes = await axios.get(
          `http://localhost:5000/api/agent/services/${newTicket.id_service}/occupied-seats`,
          authHeaders
        );
        setOccupiedSeats(seatsRes.data);
    } catch (err) {
        console.error("Erreur vente ticket:", err);
        alert(err.response?.data?.message || "Erreur lors de la vente");
    }
  };

  return (
    <AgentLayout title="Guichet de Vente">
      <div className="agent-two-columns">
        <div className="agent-left-flow">
          <StepCard title="Sélection de la ligne" visible>
            <select
              className="agent-input"
              value={selectedLineId}
              onChange={(e) => handleSelectLine(e.target.value)}
            >
              <option value="" disabled hidden>Choisir une ligne</option>
              {lines.map(line => (
                <option key={line.num_ligne} value={line.num_ligne}>
                  {line.num_ligne} : {line.ville_depart} - {line.ville_arrivee}
                </option>
              ))}
            </select>
          </StepCard>

          <StepCard title="Détails de la ligne" visible={!!selectedLine}>
            <div className="agent-grid-2">
              <div>
                <label>Horaire Prévu</label>
                <input
                  className="agent-input"
                  value={selectedLine?.horaire ? new Date(selectedLine.horaire).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  readOnly
                />
              </div>
              <div>
                <label>Bus Assigné (Auj.)</label>
                <input
                  className="agent-input"
                  value={todayService ? `Bus ${todayService.numero_bus}` : "Non assigné"}
                  readOnly
                />
              </div>
            </div>
            {todayService && (
                <p className="agent-availability">
                    Places disponibles : {Number(todayService.capacite) - occupiedSeats.length} / {todayService.capacite}
                </p>
            )}
          </StepCard>

          <StepCard title="Sélection des arrêts" visible={!!selectedLine}>
            <div className="agent-grid-2">
              <div>
                <label>Départ</label>
                <select
                  className="agent-input"
                  value={depart}
                  onChange={(e) => {
                    setDepart(e.target.value);
                    setArrivee("");
                    setSelectedSeat(null);
                  }}
                >
                  <option value="" disabled hidden>Choisir le départ</option>
                  {stops.map(stop => (
                    <option key={stop.id_trajet} value={stop.arret}>
                      {stop.arret}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Arrivée</label>
                <select
                  className="agent-input"
                  value={arrivee}
                  onChange={(e) => {
                    setArrivee(e.target.value);
                    setSelectedSeat(null);
                  }}
                  disabled={!depart}
                >
                  <option value="" disabled hidden>Choisir l’arrivée</option>
                  {arrivalOptions.map(stop => (
                    <option key={stop.id_trajet} value={stop.arret}>
                      {stop.arret}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {fareDetails && (
              <div className="route-preview">
                <span>{depart}</span>
                <span>Distance: {fareDetails.distance_km} km</span>
                <span>{arrivee}</span>
              </div>
            )}
          </StepCard>

          <StepCard title="Sélection du siège" visible={!!selectedLine && !!depart && !!arrivee}>
            <BusSeatSelector
              capacity={Number(todayService?.capacite || 40)}
              occupiedSeats={occupiedSeats}
              selectedSeat={selectedSeat}
              onSeatSelect={setSelectedSeat}
            />
          </StepCard>

          <StepCard title="Type de tarif" visible={!!selectedSeat}>
            <div className="fare-types">
              {["AUCUNE", "ETUDIANT", "HANDICAPE", "MILITAIRE", "SENIOR"].map(type => (
                <button
                  key={type}
                  type="button"
                  className={`fare-type-btn ${reduction === type ? "active" : ""}`}
                  onClick={() => setReduction(type)}
                >
                  <strong>{type === "AUCUNE" ? "Tarif Plein" : type}</strong>
                </button>
              ))}
            </div>
          </StepCard>
        </div>

        <div className="agent-right-summary">
          <div className="summary-card sticky">
            <h3>Résumé</h3>
            <div className="summary-row"><span>Ligne:</span><strong>{selectedLine ? `${selectedLine.ville_depart} - ${selectedLine.ville_arrivee}` : "-"}</strong></div>
            <div className="summary-row"><span>Horaire:</span><strong>{selectedLine?.horaire ? new Date(selectedLine.horaire).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</strong></div>
            <div className="summary-row"><span>Bus:</span><strong>{todayService?.numero_bus || "N/A"}</strong></div>
            <div className="summary-row"><span>Siège:</span><strong>{selectedSeat || "-"}</strong></div>
            <div className="summary-row"><span>Départ:</span><strong>{depart || "-"}</strong></div>
            <div className="summary-row"><span>Arrivée:</span><strong>{arrivee || "-"}</strong></div>
            <div className="summary-row"><span>Distance:</span><strong>{fareDetails?.distance_km ? `${fareDetails.distance_km} km` : "-"}</strong></div>
            <div className="summary-row"><span>Type:</span><strong>{reduction}</strong></div>

            <div className="summary-total">
              <span>Total:</span>
              <strong>{fareDetails?.final_price ? `${fareDetails.final_price} TND` : "0.000 TND"}</strong>
            </div>

            <button
              className="primary-btn full"
              disabled={!fareDetails || !selectedSeat}
              onClick={handleSellTicket}
            >
              Vendre le Ticket
            </button>
          </div>
        </div>
      </div>

      {createdTicket && (
        <TicketPrintModal
          ticket={createdTicket}
          onClose={() => setCreatedTicket(null)}
        />
      )}
    </AgentLayout>
  );
};

export default TicketSale;
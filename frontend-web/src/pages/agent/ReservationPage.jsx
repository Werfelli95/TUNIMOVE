import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AgentLayout from "./AgentLayout";
import StepCard from "../../components/agent/StepCard";
import BusSeatSelector from "../../components/agent/BusSeatSelector";
import ReservationPrintModal from "../../components/agent/ReservationPrintModal";
import "./AgentModule.css";

const ReservationPage = () => {
  const token = localStorage.getItem("token");
  const [lines, setLines] = useState([]);
  const [stops, setStops] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedLineId, setSelectedLineId] = useState("");
  const [todayService, setTodayService] = useState(null);

  const [depart, setDepart] = useState("");
  const [arrivee, setArrivee] = useState("");
  const [seat, setSeat] = useState(null);
  const [reduction, setReduction] = useState("AUCUNE");
  const [fareDetails, setFareDetails] = useState(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const [dateVoyage, setDateVoyage] = useState(todayStr);
  const [createdReservation, setCreatedReservation] = useState(null);

  const authHeaders = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/agent/lines/active", authHeaders)
      .then(res => setLines(res.data))
      .catch(err => console.error("Erreur services:", err));
  }, [authHeaders]);

  const handleLineSelect = async (numLigne, date = dateVoyage) => {
    setSelectedLineId(numLigne);
    const line = lines.find(l => String(l.num_ligne) === String(numLigne));
    setSelectedLine(line || null);
    setArrivee("");
    setSeat(null);
    setFareDetails(null);
    setTodayService(null);
    setOccupiedSeats([]);

    if (!line) return;

    try {
        // Fetch stops
        const stopsRes = await axios.get(`http://localhost:5000/api/agent/lignes/${line.num_ligne}/stations`, authHeaders);
        setStops(stopsRes.data);

        // Fetch services for the selected date
        const servicesRes = await axios.get(`http://localhost:5000/api/agent/services/today?date=${date}`, authHeaders);
        const service = servicesRes.data.find(s => String(s.num_ligne) === String(line.num_ligne));
        
        if (service && service.id_service && service.id_service !== "null") {
            setTodayService(service);
            const seatsRes = await axios.get(`http://localhost:5000/api/agent/services/${service.id_service}/occupied-seats`, authHeaders);
            setOccupiedSeats(seatsRes.data);
        } else if (service) {
            setTodayService(service);
            setOccupiedSeats([]);
        } else {
            console.log("Aucun service ou bus programmé pour cette ligne à cette date.");
            setTodayService(null);
            setOccupiedSeats([]);
        }
    } catch (err) {
        console.error("Erreur détails ligne:", err);
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
          const res = await axios.post("http://localhost:5000/api/agent/tarif/calculate", {
            num_ligne: selectedLine.num_ligne,
            arret_depart: depart,
            arret_arrivee: arrivee,
            type_reduction: reduction
          }, authHeaders);

          setFareDetails(res.data);
      } catch (err) {
          console.error("Erreur calcul tarif:", err);
      }
    };
    run();
  }, [selectedLine, depart, arrivee, reduction, authHeaders]);

  const handleReservation = async () => {
    try {
        const payload = {
            id_service: todayService?.id_service || null,
            num_ligne: selectedLine.num_ligne,
            date_voyage: dateVoyage,
            id_agent: JSON.parse(atob(token.split(".")[1])).id,
            siege: seat,
            arret_depart: depart,
            arret_arrivee: arrivee,
            type_reduction: reduction,
            montant_total: fareDetails.final_price
        };
        const res = await axios.post("http://localhost:5000/api/agent/reservations", payload, authHeaders);

        setCreatedReservation(res.data.reservation);
        handleLineSelect(selectedLineId);
    } catch (err) {
        console.error("Erreur réservation:", err);
        alert(err.response?.data?.message || "Erreur lors de la réservation");
    }
  };

  return (
    <AgentLayout title="Réservations">
      <div className="agent-two-columns">
        <div className="agent-left-flow">
          <StepCard title="Détails du voyage" visible>
            <div className="agent-grid-2">
              <div>
                <label>Date du voyage</label>
                <input 
                  type="date" 
                  className="agent-input" 
                  min={todayStr}
                  value={dateVoyage} 
                  onChange={(e) => {
                    setDateVoyage(e.target.value);
                    if (selectedLineId) handleLineSelect(selectedLineId, e.target.value);
                  }} 
                />
              </div>
              <div>
                <label>Ligne</label>
                <select className="agent-input" value={selectedLineId} onChange={(e) => handleLineSelect(e.target.value)}>
                  <option value="" disabled hidden>Choisir une ligne</option>
                  {lines.map(line => (
                    <option key={line.num_ligne} value={line.num_ligne}>
                      {line.num_ligne} : {line.ville_depart} - {line.ville_arrivee}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </StepCard>

          <StepCard title="Détails de voyage" visible={!!selectedLine}>
            <div className="agent-grid-2">
                <div>
                    <label>Horaire</label>
                    <input className="agent-input" value={selectedLine?.horaire ? new Date(selectedLine.horaire).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""} readOnly />
                </div>
                <div>
                    <label>Bus (Auj.)</label>
                    <input className="agent-input" value={todayService ? `Bus ${todayService.numero_bus}` : "Non assigné"} readOnly />
                </div>
            </div>
          </StepCard>

          <StepCard title="Sélection des arrêts" visible={!!selectedLine}>
            <div className="agent-grid-2">
              <select className="agent-input" value={depart} onChange={(e) => setDepart(e.target.value)}>
                <option value="" disabled hidden>Départ</option>
                {stops.map(stop => <option key={stop.id_trajet} value={stop.arret}>{stop.arret}</option>)}
              </select>
              <select className="agent-input" value={arrivee} onChange={(e) => setArrivee(e.target.value)}>
                <option value="" disabled hidden>Arrivée</option>
                {arrivalOptions.map(stop => <option key={stop.id_trajet} value={stop.arret}>{stop.arret}</option>)}
              </select>
            </div>
          </StepCard>

          <StepCard title="Sélection du siège" visible={!!depart && !!arrivee}>
            <BusSeatSelector
              capacity={Number(todayService?.capacite || 40)}
              occupiedSeats={occupiedSeats}
              selectedSeat={seat}
              onSeatSelect={setSeat}
            />
          </StepCard>

          <StepCard title="Type de tarif" visible={!!seat}>
            <div className="fare-types">
              {["AUCUNE", "ETUDIANT", "HANDICAPE", "MILITAIRE", "SENIOR"].map(type => (
                <button
                  key={type}
                  className={`fare-type-btn ${reduction === type ? "active" : ""}`}
                  onClick={() => setReduction(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </StepCard>
        </div>

        <div className="agent-right-summary">
          <div className="summary-card sticky">
            <h3>Résumé Réservation</h3>
            <div className="summary-row"><span>Ligne:</span><strong>{selectedLine?.num_ligne || "-"}</strong></div>
            <div className="summary-row"><span>Horaire:</span><strong>{selectedLine?.horaire ? new Date(selectedLine.horaire).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</strong></div>
            <div className="summary-row"><span>Bus:</span><strong>{todayService?.numero_bus || "N/A"}</strong></div>
            <div className="summary-row"><span>Siège:</span><strong>{seat || "-"}</strong></div>

            <div className="summary-total">
              <span>Total:</span>
              <strong>{fareDetails?.final_price ? `${fareDetails.final_price} TND` : "0.000 TND"}</strong>
            </div>

            <button className="primary-btn full" disabled={!fareDetails || !seat} onClick={handleReservation}>
              Confirmer Réservation
            </button>
          </div>
        </div>
      </div>
      {createdReservation && (
        <ReservationPrintModal
          reservation={createdReservation}
          onClose={() => setCreatedReservation(null)}
        />
      )}
    </AgentLayout>
  );
};

export default ReservationPage;

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AgentLayout from "./AgentLayout";
import "./AgentModule.css";

const HistoryPage = () => {
  const token = localStorage.getItem("token");
  const [sales, setSales] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState("sales");

  const authHeaders = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  useEffect(() => {
    // Charger les ventes
    axios.get("http://localhost:5000/api/agent/tickets/me", authHeaders)
      .then(res => setSales(res.data))
      .catch(err => console.error("Erreur historique ventes:", err));

    // Charger les réservations
    axios.get("http://localhost:5000/api/agent/reservations/me", authHeaders)
      .then(res => setReservations(res.data))
      .catch(err => console.error("Erreur historique réservations:", err));
  }, [authHeaders]);

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.montant_total || 0), 0);
  const totalReservations = reservations.length;

  return (
    <AgentLayout title="Historique">
      <div className="history-tabs" style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <button 
            className={`tab-btn ${activeTab === "sales" ? "active" : ""}`} 
            onClick={() => setActiveTab("sales")}
            style={{ 
              padding: "10px 20px", borderRadius: "8px", border: "none", 
              cursor: "pointer", background: activeTab === "sales" ? "#4f46e5" : "#f1f5f9",
              color: activeTab === "sales" ? "white" : "#64748b", fontWeight: "600"
            }}
          >
            Mes Ventes ({sales.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === "reservations" ? "active" : ""}`} 
            onClick={() => setActiveTab("reservations")}
            style={{ 
              padding: "10px 20px", borderRadius: "8px", border: "none", 
              cursor: "pointer", background: activeTab === "reservations" ? "#4f46e5" : "#f1f5f9",
              color: activeTab === "reservations" ? "white" : "#64748b", fontWeight: "600"
            }}
          >
            Mes Réservations ({reservations.length})
          </button>
      </div>

      <div className="history-card">
        {activeTab === "sales" ? (
          <>
            <div className="history-header">
              <h3>Historique des ventes</h3>
              <div className="revenue-box">
                <span>Revenu Total</span>
                <strong>{totalRevenue.toFixed(3)} TND</strong>
              </div>
            </div>

            <table className="history-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ligne</th>
                  <th>Trajet</th>
                  <th>Date</th>
                  <th>Prix</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(item => (
                  <tr key={item.id_ticket}>
                    <td>{item.code_ticket || item.id_ticket}</td>
                    <td>{item.ville_depart} - {item.ville_arrivee}</td>
                    <td>{item.arret_depart} → {item.arret_arrivee}</td>
                    <td>{new Date(item.date_emission).toLocaleString()}</td>
                    <td>{Number(item.montant_total).toFixed(3)} TND</td>
                    <td>
                        {item.est_imprime ? (
                            <span style={{color: "green", fontWeight: "bold"}}>Imprimé</span>
                        ) : (
                            <span style={{color: "orange"}}>Non imprimé</span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <div className="history-header">
              <h3>Mes Réservations Actives</h3>
              <div className="revenue-box" style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}>
                <span>Total Réservées</span>
                <strong>{totalReservations}</strong>
              </div>
            </div>

            <table className="history-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ligne</th>
                  <th>Date Voyage</th>
                  <th>Trajet</th>
                  <th>Siège</th>
                  <th>Prix</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(res => (
                  <tr key={res.id_reservation}>
                    <td style={{ fontWeight: "700" }}>RES-{res.id_reservation}</td>
                    <td>{res.ville_depart} - {res.ville_arrivee}</td>
                    <td style={{ color: "#4f46e5", fontWeight: "600" }}>{new Date(res.date_service).toLocaleDateString()}</td>
                    <td>{res.arret_depart} → {res.arret_arrivee}</td>
                    <td style={{ fontWeight: "bold" }}>{res.siege}</td>
                    <td>{Number(res.montant_total).toFixed(3)} TND</td>
                    <td>
                        <span className="role-badge badge-admin" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                            {res.statut}
                        </span>
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                      Aucune réservation effectuée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </AgentLayout>
  );
};

export default HistoryPage;

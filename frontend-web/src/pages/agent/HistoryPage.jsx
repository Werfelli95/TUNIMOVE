import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AgentLayout from "./AgentLayout";
import "./AgentModule.css";

const HistoryPage = () => {
  const token = localStorage.getItem("token");
  const [sales, setSales] = useState([]);

  const authHeaders = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/agent/tickets/me", authHeaders)
      .then(res => setSales(res.data))
      .catch(err => console.error("Erreur historique:", err));
  }, [authHeaders]);

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.montant_total || 0), 0);

  return (
    <AgentLayout title="Historique">
      <div className="history-card">
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
              <th>Actions</th>
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
                <td>
                  <button className="light-btn" style={{opacity: 0.5, cursor: "not-allowed"}} disabled>
                    Réimpression interdite
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AgentLayout>
  );
};

export default HistoryPage;

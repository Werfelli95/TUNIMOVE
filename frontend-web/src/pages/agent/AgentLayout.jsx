import React from "react";
import { Ticket, CalendarDays, History, LogOut, BusFront } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import "./AgentModule.css";

const AgentLayout = ({ children, title = "Guichet de Vente" }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const agentName = user.nom ? `${user.prenom} ${user.nom}` : "Agent";
  const matricule = localStorage.getItem("agentMatricule") || "";
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <div className="agent-shell">
      <header className="agent-topbar">
        <div className="topbar-content">
          <div className="agent-brand">
            <div className="brand-icon"><BusFront size={18} /></div>
            <div>
              <h2>TuniMove</h2>
              <p>Guichet</p>
            </div>
          </div>

          <nav className="agent-nav-horizontal">
            <NavLink to="/agent/ticket" className="agent-nav-link">
              <Ticket size={16} />
              <span>Tickets</span>
            </NavLink>

            <NavLink to="/agent/reservations" className="agent-nav-link">
              <CalendarDays size={16} />
              <span>Réservations</span>
            </NavLink>

            <NavLink to="/agent/history" className="agent-nav-link">
              <History size={16} />
              <span>Historique</span>
            </NavLink>
          </nav>

          <div className="topbar-right">
            <div className="agent-info-chip">
              <p>Agent: {agentName}</p>
              {matricule && <span>#{matricule}</span>}
            </div>
            <button className="agent-logout-btn-mini" onClick={handleLogout} title="Déconnexion">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="agent-main">
        <div className="page-header-simple">
          <h1>{title}</h1>
        </div>
        <section className="agent-content">
          {children}
        </section>
      </main>
    </div>
  );
};

export default AgentLayout;

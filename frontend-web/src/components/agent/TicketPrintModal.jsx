import React, { useRef } from "react";
import { Printer, XCircle, Ticket as TicketIcon } from "lucide-react";
import axios from "axios";

const TicketPrintModal = ({ ticket, onClose }) => {
    const printRef = useRef(null);
    const token = localStorage.getItem("token");

    const handlePrint = async () => {
        try {
            // Un seul appel autorisé pour marquer comme imprimé le ticket
            await axios.post(
                `http://localhost:5000/api/agent/tickets/${ticket.id_ticket}/print`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const printWindow = window.open("", "_blank", "width=500,height=700");
            if (!printWindow || !printRef.current) return;

            printWindow.document.write(`
          <html>
            <head>
              <title>Ticket ${ticket.code_ticket || ticket.id_ticket}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  background: white;
                  margin: 0;
                  padding: 20px;
                }
                .ticket-print {
                  width: 80mm;
                  margin: 0 auto;
                  border: 2px dashed #1e293b;
                  border-radius: 8px;
                  padding: 16px;
                  color: #0f172a;
                }
                .ticket-header {
                  text-align: center;
                  border-bottom: 1px dashed #cbd5e1;
                  padding-bottom: 12px;
                  margin-bottom: 12px;
                }
                .ticket-header h1 {
                  margin: 0;
                  font-size: 22px;
                  color: #1A237E;
                }
                .ticket-header p {
                  margin: 5px 0 0;
                  font-size: 11px;
                  color: #64748b;
                }
                .ticket-row {
                  display: flex;
                  justify-content: space-between;
                  gap: 10px;
                  margin: 8px 0;
                  font-size: 13px;
                }
                .ticket-label {
                  font-weight: bold;
                }
                .ticket-value {
                  text-align: right;
                }
                .ticket-price {
                  text-align: center;
                  font-size: 26px;
                  font-weight: bold;
                  color: #1A237E;
                  margin: 18px 0;
                  padding: 10px 0;
                  border-top: 1px dashed #cbd5e1;
                  border-bottom: 1px dashed #cbd5e1;
                }
                .ticket-footer {
                  text-align: center;
                  margin-top: 14px;
                  font-size: 11px;
                  color: #64748b;
                }
              </style>
            </head>
            <body>
              <div class="ticket-print">
                <div class="ticket-header">
                  <h1>TuniMove</h1>
                  <p>Transport routier inter-gouvernorats</p>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">N° Ticket</span>
                  <span class="ticket-value">${ticket.code_ticket || ticket.id_ticket}</span>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Ligne</span>
                  <span class="ticket-value">${ticket.nom_ligne}</span>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Départ</span>
                  <span class="ticket-value">${ticket.arret_depart || ticket.depart}</span>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Arrivée</span>
                  <span class="ticket-value">${ticket.arret_arrivee || ticket.arrivee}</span>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Date</span>
                  <span class="ticket-value">${new Date(ticket.date_depart || ticket.date_service).toLocaleDateString()}</span>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Heure</span>
                  <span class="ticket-value">${ticket.heure_depart || (ticket.horaire ? new Date(ticket.horaire).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</span>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Bus</span>
                  <span class="ticket-value">${ticket.numero_bus}</span>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Siège</span>
                  <span class="ticket-value">${ticket.siege || "-"}</span>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Réduction</span>
                  <span class="ticket-value">${ticket.type_reduction || "AUCUNE"}</span>
                </div>

                <div class="ticket-price">
                  ${Number(ticket.montant_total || 0).toFixed(3)} TND
                </div>

                <div class="ticket-footer">
                  <p>Merci pour votre confiance</p>
                  <p>Bon voyage</p>
                </div>
              </div>
            </body>
          </html>
        `);

            printWindow.document.close();

            setTimeout(() => {
                printWindow.print();
                printWindow.close();
                onClose();
            }, 500);
        } catch (error) {
            console.error("Erreur impression:", error);
            alert(error.response?.data?.message || "Erreur lors du marquage de l'impression");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "430px" }}>
                <div className="modal-header">
                    <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <TicketIcon size={22} />
                        Confirmation de vente
                    </h2>
                    <button className="btn-close" onClick={onClose}>
                        <XCircle size={20} />
                    </button>
                </div>

                <div className="ticket-print-preview" ref={printRef}>
                    <div className="ticket-summary-static">
                        <p>Ticket généré : <strong>{ticket.code_ticket}</strong></p>
                        <p>Montant : <strong>{Number(ticket.montant_total).toFixed(3)} TND</strong></p>
                        <p>Ligne : <strong>{ticket.nom_ligne}</strong></p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        Fermer
                    </button>
                    <button className="btn-submit" onClick={handlePrint}>
                        <Printer size={18} />
                        <span>Imprimer</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TicketPrintModal;

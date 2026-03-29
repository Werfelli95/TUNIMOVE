import React, { useRef } from "react";
import { Printer, XCircle, Calendar } from "lucide-react";

const ReservationPrintModal = ({ reservation, onClose }) => {
    const printRef = useRef(null);

    const handlePrint = () => {
        const printWindow = window.open("", "_blank", "width=500,height=700");
        if (!printWindow || !printRef.current) return;

        printWindow.document.write(`
          <html>
            <head>
              <title>Réservation ${reservation.id_reservation}</title>
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
                  border: 2px solid #4f46e5;
                  border-radius: 8px;
                  padding: 16px;
                  color: #0f172a;
                }
                .ticket-header {
                  text-align: center;
                  border-bottom: 2px solid #4f46e5;
                  padding-bottom: 12px;
                  margin-bottom: 12px;
                }
                .ticket-header h1 {
                  margin: 0;
                  font-size: 20px;
                  color: #4f46e5;
                  text-transform: uppercase;
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
                  margin: 10px 0;
                  font-size: 13px;
                }
                .ticket-label {
                  font-weight: bold;
                  color: #64748b;
                }
                .ticket-value {
                  text-align: right;
                  font-weight: 600;
                }
                .travel-date {
                  text-align: center;
                  background: #f1f5f9;
                  padding: 10px;
                  border-radius: 4px;
                  margin: 15px 0;
                  font-weight: bold;
                  font-size: 15px;
                  color: #0f172a;
                  border: 1px solid #e2e8f0;
                }
                .ticket-price {
                  text-align: center;
                  font-size: 24px;
                  font-weight: 800;
                  color: #0f172a;
                  margin: 15px 0;
                }
                .ticket-footer {
                  text-align: center;
                  margin-top: 20px;
                  font-size: 11px;
                  color: #94a3b8;
                  border-top: 1px dashed #e2e8f0;
                  padding-top: 10px;
                }
              </style>
            </head>
            <body>
              <div class="ticket-print">
                <div class="ticket-header">
                  <h1>Bon de Réservation</h1>
                  <p>TuniMove - Transport Inter-urbain</p>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Réf. Réservation</span>
                  <span class="ticket-value">RES-${reservation.id_reservation}</span>
                </div>

                <div class="travel-date">
                   DATE DE VOYAGE : ${new Date(reservation.date_service).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Ligne</span>
                  <span class="ticket-value">${reservation.ville_depart} - ${reservation.ville_arrivee}</span>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Trajet</span>
                  <span class="ticket-value">${reservation.arret_depart} → ${reservation.arret_arrivee}</span>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Bus</span>
                  <span class="ticket-value">N° ${reservation.numero_bus}</span>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Siège</span>
                  <span class="ticket-value">${reservation.siege || "Non spécifié"}</span>
                </div>

                <div class="ticket-row">
                  <span class="ticket-label">Tarif</span>
                  <span class="ticket-value">${reservation.type_reduction}</span>
                </div>

                <div class="ticket-price">
                  HT : ${Number(reservation.montant_total).toFixed(3)} TND
                </div>

                <div class="ticket-footer">
                  <p>Présentez ce bon au guichet pour retirer votre ticket</p>
                  <p>Valide uniquement pour le voyage spécifié</p>
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
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "450px" }}>
                <div className="modal-header" style={{ borderBottom: "1px solid #eef2f6" }}>
                    <h2 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#4f46e5" }}>
                        <Calendar size={22} />
                        Réservation Confirmée
                    </h2>
                    <button className="btn-close" onClick={onClose}>
                        <XCircle size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: "30px 20px" }} ref={printRef}>
                    <div style={{ textAlign: "center", marginBottom: "20px" }}>
                        <div style={{ 
                            width: "60px", height: "60px", background: "#f0fdf4", 
                            color: "#16a34a", borderRadius: "50%", display: "flex", 
                            alignItems: "center", justifyContent: "center", margin: "0 auto 15px"
                        }}>
                            <Calendar size={32} />
                        </div>
                        <h3 style={{ margin: "0 0 5px", color: "#1e293b" }}>Bon de Réservation Généré</h3>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                            Numéro: <strong>RES-{reservation.id_reservation}</strong>
                        </p>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                            <span style={{ color: "#64748b" }}>Date Voyage:</span>
                            <strong style={{ color: "#0f172a" }}>{new Date(reservation.date_service).toLocaleDateString()}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                            <span style={{ color: "#64748b" }}>Bus:</span>
                            <strong style={{ color: "#0f172a" }}>N° {reservation.numero_bus}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                            <span style={{ color: "#64748b" }}>Total:</span>
                            <strong style={{ color: "#4f46e5" }}>{Number(reservation.montant_total).toFixed(3)} TND</strong>
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{ borderTop: "1px solid #eef2f6" }}>
                    <button className="btn-cancel" onClick={onClose}>
                        Fermer
                    </button>
                    <button className="btn-submit" onClick={handlePrint} style={{ background: "#4f46e5" }}>
                        <Printer size={18} />
                        <span>Imprimer le Bon</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReservationPrintModal;

import React, { useRef } from "react";
import { Printer, XCircle, Ticket as TicketIcon } from "lucide-react";

const TicketPrint = ({ ticket, onClose }) => {
    const printRef = useRef(null);

    const handlePrint = () => {
        const printWindow = window.open("", "_blank", "width=500,height=700");
        if (!printWindow || !printRef.current) return;

        printWindow.document.write(`
      <html>
        <head>
          <title>Ticket ${ticket.id_ticket || ""}</title>
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
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);

        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "430px" }}>
                <div className="modal-header">
                    <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <TicketIcon size={22} />
                        Aperçu du ticket
                    </h2>
                    <button className="btn-close" onClick={onClose}>
                        <XCircle size={20} />
                    </button>
                </div>

                <div ref={printRef}>
                    <div className="ticket-print-preview">
                        <div className="ticket-print">
                            <div className="ticket-header">
                                <h1>TuniMove</h1>
                                <p>Transport routier inter-gouvernorats</p>
                            </div>

                            <div className="ticket-row">
                                <span className="ticket-label">N° Ticket</span>
                                <span className="ticket-value">{ticket.id_ticket}</span>
                            </div>

                            <div className="ticket-row">
                                <span className="ticket-label">QR Code</span>
                                <span className="ticket-value">{ticket.qr_code}</span>
                            </div>

                            <div className="ticket-row">
                                <span className="ticket-label">Ligne</span>
                                <span className="ticket-value">{ticket.nom_ligne}</span>
                            </div>

                            <div className="ticket-row">
                                <span className="ticket-label">Départ</span>
                                <span className="ticket-value">{ticket.depart}</span>
                            </div>

                            <div className="ticket-row">
                                <span className="ticket-label">Arrivée</span>
                                <span className="ticket-value">{ticket.arrivee}</span>
                            </div>

                            <div className="ticket-row">
                                <span className="ticket-label">Date</span>
                                <span className="ticket-value">
                                    {new Date(ticket.date_depart).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="ticket-row">
                                <span className="ticket-label">Heure</span>
                                <span className="ticket-value">{ticket.heure_depart}</span>
                            </div>

                            <div className="ticket-row">
                                <span className="ticket-label">Bus</span>
                                <span className="ticket-value">{ticket.numero_bus}</span>
                            </div>

                            <div className="ticket-row">
                                <span className="ticket-label">Siège</span>
                                <span className="ticket-value">{ticket.siege || "-"}</span>
                            </div>

                            <div className="ticket-row">
                                <span className="ticket-label">Réduction</span>
                                <span className="ticket-value">{ticket.type_reduction || "AUCUNE"}</span>
                            </div>

                            <div className="ticket-row">
                                <span className="ticket-label">Agent</span>
                                <span className="ticket-value">{ticket.agent_nom || "-"}</span>
                            </div>

                            <div className="ticket-price">
                                {Number(ticket.montant_total || 0).toFixed(3)} TND
                            </div>

                            <div className="ticket-footer">
                                <p>Merci pour votre confiance</p>
                                <p>Bon voyage</p>
                            </div>
                        </div>
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

export default TicketPrint;
import { QRCodeSVG } from 'qrcode.react';
import { useService } from '../data/ServiceContext';

interface PrintableTicketProps {
  ticket: {
    id: string;
    from: string;
    to: string;
    fare: number;
    discount: number;
    total: number;
    timestamp: Date;
    qrCode: string;
  };
  seatNumber?: string;
}

export function PrintableTicket({ ticket, seatNumber }: PrintableTicketProps) {
  const { currentBus, currentRoute, receiverMatricule } = useService();

  return (
    <div className="print-ticket hidden print:block">
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .print-ticket {
            display: block !important;
            width: 80mm;
            padding: 10mm;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #000;
            background: #fff;
          }
          
          .print-ticket-header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          
          .print-ticket-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .print-ticket-subtitle {
            font-size: 10px;
            margin-bottom: 3px;
          }
          
          .print-ticket-section {
            margin: 10px 0;
            border-bottom: 1px solid #000;
            padding-bottom: 8px;
          }
          
          .print-ticket-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          
          .print-ticket-label {
            font-weight: bold;
          }
          
          .print-ticket-qr {
            text-align: center;
            margin: 15px 0;
          }
          
          .print-ticket-footer {
            text-align: center;
            font-size: 10px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px dashed #000;
          }
          
          .print-ticket-total {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
            padding: 8px;
            border: 2px solid #000;
          }
        }
      `}</style>

      <div className="print-ticket-header">
        <div className="print-ticket-title">TuniMove</div>
        <div className="print-ticket-subtitle">Transport Interurbain Tunisien</div>
        <div className="print-ticket-subtitle">━━━━━━━━━━━━━━━━━━━━━━━━</div>
        <div className="print-ticket-doc-type">TICKET DE TRANSPORT</div>
      </div>

      <div className="print-ticket-section">
        <div className="print-ticket-row">
          <span className="print-ticket-label">Bus N°:</span>
          <span>{currentBus?.number}</span>
        </div>
        <div className="print-ticket-row">
          <span className="print-ticket-label">Ligne:</span>
          <span>{currentRoute?.name}</span>
        </div>
        {seatNumber && (
          <div className="print-ticket-row">
            <span className="print-ticket-label">Place:</span>
            <span>{seatNumber}</span>
          </div>
        )}
        <div className="print-ticket-row">
          <span className="print-ticket-label">Receveur:</span>
          <span>#{receiverMatricule}</span>
        </div>
      </div>

      <div className="print-ticket-section">
        <div className="print-ticket-row">
          <span className="print-ticket-label">De:</span>
          <span>{ticket.from}</span>
        </div>
        <div className="print-ticket-row">
          <span className="print-ticket-label">À:</span>
          <span>{ticket.to}</span>
        </div>
      </div>

      <div className="print-ticket-section">
        <div className="print-ticket-row">
          <span className="print-ticket-label">Date:</span>
          <span>{new Date(ticket.timestamp).toLocaleDateString('fr-TN')}</span>
        </div>
        <div className="print-ticket-row">
          <span className="print-ticket-label">Heure:</span>
          <span>{new Date(ticket.timestamp).toLocaleTimeString('fr-TN')}</span>
        </div>
        <div className="print-ticket-row">
          <span className="print-ticket-label">N° Ticket:</span>
          <span>{ticket.id}</span>
        </div>
      </div>

      <div className="print-ticket-section">
        <div className="print-ticket-row">
          <span className="print-ticket-label">Tarif:</span>
          <span>{ticket.fare.toFixed(3)} TND</span>
        </div>
        {ticket.discount > 0 && (
          <div className="print-ticket-row">
            <span className="print-ticket-label">Réduction:</span>
            <span>-{ticket.discount.toFixed(3)} TND</span>
          </div>
        )}
      </div>

      <div className="print-ticket-total">
        TOTAL: {ticket.total.toFixed(3)} TND
      </div>

      <div className="print-ticket-qr">
        <QRCodeSVG value={ticket.qrCode} size={120} />
        <div style={{ fontSize: '8px', marginTop: '5px' }}>{ticket.qrCode}</div>
      </div>

      <div className="print-ticket-footer">
        <div>Merci de voyager avec TuniMove</div>
        <div>Conservez ce ticket jusqu'à la fin du voyage</div>
        <div>━━━━━━━━━━━━━━━━━━━━━━━━</div>
        <div>Service client: 71 XXX XXX</div>
      </div>
    </div>
  );
}
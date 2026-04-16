import { useService } from '../data/ServiceContext';

export function PrintableServiceReport() {
  const {
    currentBus,
    currentRoute,
    serviceStartTime,
    receiverMatricule,
    totalCash,
    tickets,
    seats,
  } = useService();

  const reservedCount = seats.filter((s) => s.status === 'reserved-counter').length;
  const soldCount = seats.filter((s) => s.status === 'sold-onboard').length;
  const validatedCount = seats.filter((s) => s.passenger?.validated === true).length;

  const endTime = new Date();
  const serviceDuration = serviceStartTime
    ? Math.floor((endTime.getTime() - serviceStartTime.getTime()) / 1000 / 60)
    : 0;

  return (
    <div className="print-report hidden print:block">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .print-report {
            display: block !important;
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #000;
            background: #fff;
            max-width: 210mm;
          }
          
          .print-report-header {
            text-align: center;
            border-bottom: 3px solid #1a3a52;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          
          .print-report-logo {
            font-size: 28px;
            font-weight: bold;
            color: #1a3a52;
            margin-bottom: 5px;
          }
          
          .print-report-title {
            font-size: 20px;
            font-weight: bold;
            margin-top: 15px;
            text-transform: uppercase;
          }
          
          .print-report-subtitle {
            font-size: 12px;
            color: #666;
          }
          
          .print-report-section {
            margin: 20px 0;
            page-break-inside: avoid;
          }
          
          .print-report-section-title {
            font-size: 16px;
            font-weight: bold;
            background: #1a3a52;
            color: #fff;
            padding: 8px 10px;
            margin-bottom: 10px;
          }
          
          .print-report-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 15px;
          }
          
          .print-report-item {
            border: 1px solid #ddd;
            padding: 10px;
          }
          
          .print-report-item-label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
          }
          
          .print-report-item-value {
            font-size: 16px;
            font-weight: bold;
            margin-top: 5px;
          }
          
          .print-report-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          .print-report-table th {
            background: #f0f0f0;
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-weight: bold;
          }
          
          .print-report-table td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          
          .print-report-total {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            background: #1a3a52;
            color: #fff;
            padding: 15px;
            margin: 20px 0;
          }
          
          .print-report-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #1a3a52;
          }
          
          .print-report-signature {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
            margin-top: 30px;
          }
          
          .print-report-signature-box {
            text-align: center;
          }
          
          .print-report-signature-line {
            border-bottom: 2px solid #000;
            margin: 40px 20px 10px 20px;
          }
        }
      `}</style>

      <div className="print-report-header">
        <div className="print-report-logo">TuniMove</div>
        <div className="print-report-subtitle">Transport Interurbain Tunisien</div>
        <div className="print-report-subtitle">République Tunisienne</div>
        <div className="print-report-separator">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
        <div className="print-report-title">RAPPORT DE CLÔTURE DE SERVICE</div>
      </div>

      {/* Informations du service */}
      <div className="print-report-section">
        <div className="print-report-section-title">Informations du Service</div>
        <div className="print-report-grid">
          <div className="print-report-item">
            <div className="print-report-item-label">Numéro de Bus</div>
            <div className="print-report-item-value">{currentBus?.number}</div>
          </div>
          <div className="print-report-item">
            <div className="print-report-item-label">Matricule Receveur</div>
            <div className="print-report-item-value">#{receiverMatricule}</div>
          </div>
          <div className="print-report-item">
            <div className="print-report-item-label">Ligne</div>
            <div className="print-report-item-value">{currentRoute?.name}</div>
          </div>
          <div className="print-report-item">
            <div className="print-report-item-label">Date de Service</div>
            <div className="print-report-item-value">
              {serviceStartTime?.toLocaleDateString('fr-TN')}
            </div>
          </div>
          <div className="print-report-item">
            <div className="print-report-item-label">Heure de Départ</div>
            <div className="print-report-item-value">
              {serviceStartTime?.toLocaleTimeString('fr-TN')}
            </div>
          </div>
          <div className="print-report-item">
            <div className="print-report-item-label">Heure d'Arrivée</div>
            <div className="print-report-item-value">
              {endTime.toLocaleTimeString('fr-TN')}
            </div>
          </div>
          <div className="print-report-item">
            <div className="print-report-item-label">Durée du Service</div>
            <div className="print-report-item-value">{serviceDuration} minutes</div>
          </div>
          <div className="print-report-item">
            <div className="print-report-item-label">Capacité Bus</div>
            <div className="print-report-item-value">{currentBus?.capacity} places</div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="print-report-section">
        <div className="print-report-section-title">Statistiques du Service</div>
        <div className="print-report-grid">
          <div className="print-report-item">
            <div className="print-report-item-label">Réservations Guichet</div>
            <div className="print-report-item-value">{reservedCount}</div>
          </div>
          <div className="print-report-item">
            <div className="print-report-item-label">Passagers Validés</div>
            <div className="print-report-item-value">{validatedCount}</div>
          </div>
          <div className="print-report-item">
            <div className="print-report-item-label">Billets Vendus à Bord</div>
            <div className="print-report-item-value">{soldCount}</div>
          </div>
          <div className="print-report-item">
            <div className="print-report-item-label">Total Transactions</div>
            <div className="print-report-item-value">{tickets.length}</div>
          </div>
        </div>
      </div>

      {/* Détail des ventes */}
      {tickets.length > 0 && (
        <div className="print-report-section">
          <div className="print-report-section-title">Détail des Ventes à Bord</div>
          <table className="print-report-table">
            <thead>
              <tr>
                <th>N° Ticket</th>
                <th>Heure</th>
                <th>De</th>
                <th>À</th>
                <th>Tarif</th>
                <th>Réduction</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td style={{ fontSize: '9px' }}>{ticket.id}</td>
                  <td>{new Date(ticket.timestamp).toLocaleTimeString('fr-TN')}</td>
                  <td>{ticket.from}</td>
                  <td>{ticket.to}</td>
                  <td>{ticket.fare.toFixed(3)}</td>
                  <td>{ticket.discount.toFixed(3)}</td>
                  <td style={{ fontWeight: 'bold' }}>{ticket.total.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f0f0f0' }}>
                <td colSpan={6} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  TOTAL GÉNÉRAL:
                </td>
                <td style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {totalCash.toFixed(3)} TND
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Total à remettre */}
      <div className="print-report-total">
        TOTAL À REMETTRE: {totalCash.toFixed(3)} TND
      </div>

      {/* Signatures */}
      <div className="print-report-footer">
        <div className="print-report-signature">
          <div className="print-report-signature-box">
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Receveur</div>
            <div className="print-report-signature-line"></div>
            <div style={{ fontSize: '10px' }}>Nom et Signature</div>
          </div>
          <div className="print-report-signature-box">
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Superviseur</div>
            <div className="print-report-signature-line"></div>
            <div style={{ fontSize: '10px' }}>Nom et Signature</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '10px', color: '#666' }}>
          Document généré le {endTime.toLocaleDateString('fr-TN')} à{' '}
          {endTime.toLocaleTimeString('fr-TN')}
        </div>
      </div>
    </div>
  );
}
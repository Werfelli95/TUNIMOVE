import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useService } from '../data/ServiceContext';
import { DISCOUNT_TYPES } from '../data/mockData';
import { Header } from '../components/Header';
import { PrintableTicket } from '../components/PrintableTicket';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, MapPin, Tag, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

export default function TicketSalePage() {
  const navigate = useNavigate();
  const { currentRoute, seats, sellTicket, currentBus, receiverMatricule } = useService();
  const [fromStopId, setFromStopId] = useState('');
  const [toStopId, setToStopId] = useState('');
  const [discountId, setDiscountId] = useState('none');
  const [selectedSeat, setSelectedSeat] = useState('');
  const [showTicket, setShowTicket] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState<any>(null);

  if (!currentRoute) {
    return null;
  }

  const fromStop = currentRoute.stops.find((s) => s.id === fromStopId);
  const toStop = currentRoute.stops.find((s) => s.id === toStopId);
  const discount = DISCOUNT_TYPES.find((d) => d.id === discountId);

  const availableSeats = seats.filter((s) => s.status === 'available');

  // Calcul du tarif (formule simplifiée ax+b basée sur la distance)
  const calculateFare = () => {
    if (!fromStop || !toStop) return 0;
    const distance = toStop.distanceKm - fromStop.distanceKm;
    // Formule: 2 TND de base + 0.08 TND par km
    const baseFare = 2 + distance * 0.08;
    return Math.max(baseFare, 1); // Minimum 1 TND
  };

  const baseFare = calculateFare();
  const discountAmount = baseFare * ((discount?.percentage || 0) / 100);
  const totalFare = baseFare - discountAmount;

  const handleSellTicket = () => {
    if (!fromStop || !toStop || !selectedSeat) {
      toast.error('Informations incomplètes', {
        description: 'Veuillez remplir tous les champs',
      });
      return;
    }

    if (fromStopId === toStopId) {
      toast.error('Trajet invalide', {
        description: 'Les arrêts de départ et d\'arrivée doivent être différents',
      });
      return;
    }

    const ticket = {
      id: `TKT-${Date.now()}`,
      from: fromStop.name,
      to: toStop.name,
      fare: baseFare,
      discount: discountAmount,
      total: totalFare,
      timestamp: new Date(),
      qrCode: `TICKET-${Date.now()}-${selectedSeat}`,
    };

    sellTicket(ticket, parseInt(selectedSeat));
    setGeneratedTicket(ticket);
    setShowTicket(true);

    toast.success('Billet vendu !', {
      description: `Place ${selectedSeat} - ${totalFare.toFixed(3)} TND`,
    });

    // Reset form
    setFromStopId('');
    setToStopId('');
    setDiscountId('none');
    setSelectedSeat('');
  };

  const handlePrintTicket = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <div className="p-4">
        <Button
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="mb-4 text-gray-700 hover:bg-white/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#1a3a52]">Vente de Billet à Bord</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">
                <MapPin className="w-4 h-4 inline mr-2" />
                Arrêt de départ
              </Label>
              <Select value={fromStopId} onValueChange={setFromStopId}>
                <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 h-12">
                  <SelectValue placeholder="Sélectionner le départ" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {currentRoute.stops.map((stop) => (
                    <SelectItem key={stop.id} value={stop.id} className="text-gray-900">
                      {stop.name} ({stop.distanceKm} km)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">
                <MapPin className="w-4 h-4 inline mr-2" />
                Arrêt d'arrivée
              </Label>
              <Select value={toStopId} onValueChange={setToStopId}>
                <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 h-12">
                  <SelectValue placeholder="Sélectionner l'arrivée" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {currentRoute.stops.map((stop) => (
                    <SelectItem key={stop.id} value={stop.id} className="text-gray-900">
                      {stop.name} ({stop.distanceKm} km)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">
                <Tag className="w-4 h-4 inline mr-2" />
                Réduction
              </Label>
              <Select value={discountId} onValueChange={setDiscountId}>
                <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 h-12">
                  <SelectValue placeholder="Sélectionner une réduction" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {DISCOUNT_TYPES.map((discount) => (
                    <SelectItem key={discount.id} value={discount.id} className="text-gray-900">
                      {discount.label} {discount.percentage > 0 && `(-${discount.percentage}%)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Numéro de place</Label>
              <Select value={selectedSeat} onValueChange={setSelectedSeat}>
                <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 h-12">
                  <SelectValue placeholder="Sélectionner une place" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {availableSeats.map((seat) => (
                    <SelectItem key={seat.number} value={seat.number.toString()} className="text-gray-900">
                      Place {seat.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-600">
                {availableSeats.length} places disponibles
              </div>
            </div>

            {fromStop && toStop && (
              <Card className="bg-gradient-to-br from-blue-50 to-slate-50 border-gray-200">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Tarif de base:</span>
                    <span className="font-semibold">{baseFare.toFixed(3)} TND</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-yellow-600">
                      <span>Réduction ({discount?.percentage}%):</span>
                      <span className="font-semibold">-{discountAmount.toFixed(3)} TND</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl text-gray-900 pt-2 border-t border-gray-300 font-bold">
                    <span>Total:</span>
                    <span>{totalFare.toFixed(3)} TND</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleSellTicket}
              disabled={!fromStopId || !toStopId || !selectedSeat}
              className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg"
              size="lg"
            >
              Vendre le Billet
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog pour afficher le ticket généré */}
      <Dialog open={showTicket} onOpenChange={setShowTicket}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1a3a52]">Billet Prêt à Imprimer</DialogTitle>
          </DialogHeader>
          {generatedTicket && (
            <div className="space-y-4">
              {/* Aperçu du ticket imprimable */}
              <div className="border-2 border-[#2a3544] rounded-lg overflow-hidden bg-white">
                <div className="p-6 text-black font-mono text-sm">
                  {/* En-tête */}
                  <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
                    <div className="text-2xl font-bold mb-1">TuniMove</div>
                    <div className="text-xs mb-1">Transport Interurbain Tunisien</div>
                    <div className="text-xs mb-2">━━━━━━━━━━━━━━━━━━━━━━━━</div>
                    <div className="text-base font-bold">TICKET DE TRANSPORT</div>
                  </div>

                  {/* Informations du service */}
                  <div className="mb-4 pb-4 border-b border-black">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">Bus N°:</span>
                      <span>{currentBus?.number}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">Ligne:</span>
                      <span>{currentRoute?.name}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">Place:</span>
                      <span>{selectedSeat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Receveur:</span>
                      <span>#{receiverMatricule}</span>
                    </div>
                  </div>

                  {/* Trajet */}
                  <div className="mb-4 pb-4 border-b border-black">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">De:</span>
                      <span>{generatedTicket.from}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">À:</span>
                      <span>{generatedTicket.to}</span>
                    </div>
                  </div>

                  {/* Date et heure */}
                  <div className="mb-4 pb-4 border-b border-black">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">Date:</span>
                      <span>{generatedTicket.timestamp.toLocaleDateString('fr-TN')}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">Heure:</span>
                      <span>{generatedTicket.timestamp.toLocaleTimeString('fr-TN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">N° Ticket:</span>
                      <span className="text-xs">{generatedTicket.id}</span>
                    </div>
                  </div>

                  {/* Tarification */}
                  <div className="mb-4 pb-4 border-b border-black">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">Tarif:</span>
                      <span>{generatedTicket.fare.toFixed(3)} TND</span>
                    </div>
                    {generatedTicket.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="font-bold">Réduction:</span>
                        <span>-{generatedTicket.discount.toFixed(3)} TND</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="mb-4 text-center">
                    <div className="border-2 border-black p-3 text-xl font-bold">
                      TOTAL: {generatedTicket.total.toFixed(3)} TND
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="text-center mb-4">
                    <QRCodeSVG value={generatedTicket.qrCode} size={150} />
                    <div className="text-xs mt-2">{generatedTicket.qrCode}</div>
                  </div>

                  {/* Pied de page */}
                  <div className="text-center text-xs border-t-2 border-dashed border-black pt-4">
                    <div>Merci de voyager avec TuniMove</div>
                    <div>Conservez ce ticket jusqu'à la fin du voyage</div>
                    <div className="mt-2">━━━━━━━━━━━━━━━━━━━━━━━━</div>
                    <div>Service client: 71 XXX XXX</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePrintTicket}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
                <Button
                  onClick={() => setShowTicket(false)}
                  className="flex-1 bg-[#1a3a52] hover:bg-[#2a4a62]"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Composant d'impression caché */}
      {generatedTicket && (
        <PrintableTicket ticket={generatedTicket} seatNumber={selectedSeat} />
      )}
    </div>
  );
}
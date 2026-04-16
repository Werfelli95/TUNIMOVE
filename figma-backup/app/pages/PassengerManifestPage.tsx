import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useService } from '../data/ServiceContext';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { ArrowLeft, QrCode, CheckCircle2, Ticket, MapPin, DollarSign, User } from 'lucide-react';
import { toast } from 'sonner';
import { Passenger } from '../data/mockData';

export default function PassengerManifestPage() {
  const navigate = useNavigate();
  const { seats, validatePassenger, currentRoute } = useService();
  const [searchQR, setSearchQR] = useState('');
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const reservedPassengers = seats
    .filter((s) => s.status === 'reserved-counter' && s.passenger)
    .map((s) => s.passenger!);

  const handleValidate = (passengerId: string) => {
    validatePassenger(passengerId);
    toast.success('Passager validé !', {
      description: 'Le passager a bien été enregistré à bord.',
    });
    setSearchQR('');
  };

  const handleScanQR = () => {
    if (!searchQR) {
      toast.error('Code QR vide', {
        description: 'Veuillez scanner un code QR valide',
      });
      return;
    }

    const passenger = reservedPassengers.find((p) => p.qrCode === searchQR);
    if (passenger) {
      handleValidate(passenger.id);
    } else {
      toast.error('QR Code invalide', {
        description: 'Aucune réservation trouvée avec ce code',
      });
    }
  };

  const handleShowDetails = (passenger: Passenger) => {
    setSelectedPassenger(passenger);
    setShowDetailsDialog(true);
  };

  const validatedCount = reservedPassengers.filter((p) => p.validated).length;
  const totalCount = reservedPassengers.length;

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

        <Card className="bg-white border-gray-200 shadow-lg mb-4">
          <CardHeader>
            <CardTitle className="text-[#1a3a52]">Scanner QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Scanner ou saisir le QR code..."
                value={searchQR}
                onChange={(e) => setSearchQR(e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900"
              />
              <Button
                onClick={handleScanQR}
                className="bg-[#1a3a52] hover:bg-[#2a4a62] flex-shrink-0"
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center text-sm text-gray-600">
              {validatedCount} / {totalCount} passagers validés
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#1a3a52]">Manifeste des Passagers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reservedPassengers.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                Aucune réservation pour ce trajet
              </div>
            ) : (
              reservedPassengers.map((passenger) => (
                <Card
                  key={passenger.id}
                  onClick={() => handleShowDetails(passenger)}
                  className={`border-2 cursor-pointer hover:border-[#fbbf24] transition-colors ${
                    passenger.validated
                      ? 'bg-green-50 border-green-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-gray-600" />
                        <div className="text-gray-900 font-mono font-semibold">{passenger.ticketNumber}</div>
                      </div>
                      <Badge
                        className={`${
                          passenger.validated
                            ? 'bg-green-600'
                            : 'bg-yellow-600'
                        } text-white`}
                      >
                        Place {passenger.seatNumber}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {passenger.boardingStop} → {passenger.destinationStop}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-gray-600">Tarif: </span>
                        <span className="text-gray-900 font-semibold">{passenger.fare.toFixed(3)} TND</span>
                      </div>

                      {passenger.validated ? (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Validé</span>
                        </div>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleValidate(passenger.id);
                          }}
                          size="sm"
                          className="bg-[#1a3a52] hover:bg-[#2a4a62] h-8"
                        >
                          Valider
                        </Button>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-500 font-mono">
                      QR: {passenger.qrCode}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog pour afficher les détails de la réservation */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-[#1a3a52]">Détails de la Réservation</DialogTitle>
          </DialogHeader>
          {selectedPassenger && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-blue-50 to-slate-50 border-gray-200">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">N° Ticket</span>
                    <span className="text-gray-900 font-mono font-bold">
                      {selectedPassenger.ticketNumber}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 text-sm">Ligne</span>
                      <span className="text-gray-900 font-semibold">{currentRoute?.name}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Départ</span>
                    <span className="text-gray-900 font-semibold">{selectedPassenger.boardingStop}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Arrivée</span>
                    <span className="text-gray-900 font-semibold">{selectedPassenger.destinationStop}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 text-sm">Matricule Guichet</span>
                      <span className="text-gray-900 font-mono font-semibold">#{selectedPassenger.counterMatricule}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Siège Réservé</span>
                    <Badge className="bg-[#fbbf24] text-black">
                      Place {selectedPassenger.seatNumber}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Prix</span>
                    <span className="text-green-600 font-bold text-lg">
                      {selectedPassenger.fare.toFixed(3)} TND
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Statut</span>
                    <Badge className={selectedPassenger.validated ? 'bg-green-600' : 'bg-yellow-600'}>
                      {selectedPassenger.validated ? 'Validé' : 'En attente'}
                    </Badge>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="text-gray-600 text-sm mb-1">QR Code</div>
                    <div className="text-gray-900 font-mono text-xs bg-gray-100 p-2 rounded">
                      {selectedPassenger.qrCode}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                {!selectedPassenger.validated && (
                  <Button
                    onClick={() => {
                      handleValidate(selectedPassenger.id);
                      setShowDetailsDialog(false);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Valider
                  </Button>
                )}
                <Button
                  onClick={() => setShowDetailsDialog(false)}
                  className="flex-1 bg-[#1a3a52] hover:bg-[#2a4a62]"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
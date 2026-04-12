import { useNavigate } from 'react-router';
import { useService } from '../data/ServiceContext';
import { Header } from '../components/Header';
import { PrintableServiceReport } from '../components/PrintableServiceReport';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { ArrowLeft, CheckCircle2, Clock, DollarSign, Ticket, Users, Printer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ServiceClosurePage() {
  const navigate = useNavigate();
  const {
    currentBus,
    currentRoute,
    serviceStartTime,
    totalCash,
    tickets,
    seats,
    endService,
  } = useService();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const reservedCount = seats.filter((s) => s.status === 'reserved-counter').length;
  const soldCount = seats.filter((s) => s.status === 'sold-onboard').length;
  const validatedCount = seats.filter((s) => s.passenger?.validated === true).length;

  const serviceDuration = serviceStartTime
    ? Math.floor((Date.now() - serviceStartTime.getTime()) / 1000 / 60)
    : 0;

  const handleConfirmClosure = () => {
    endService();
    toast.success('Service clôturé !', {
      description: 'Votre rapport a été enregistré avec succès',
    });
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const handlePrintReport = () => {
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

        <Card className="bg-white border-gray-200 shadow-lg mb-4">
          <CardHeader>
            <CardTitle className="text-[#1a3a52]">Clôture de Service</CardTitle>
            <p className="text-sm text-gray-600">
              Récapitulatif de votre service du{' '}
              {serviceStartTime?.toLocaleDateString('fr-TN')}
            </p>
          </CardHeader>
        </Card>

        {/* Statistiques principales */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl text-gray-900 font-semibold">{reservedCount}</div>
                  <div className="text-xs text-gray-600">Réservations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl text-gray-900 font-semibold">{validatedCount}</div>
                  <div className="text-xs text-gray-600">Validés</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl text-gray-900 font-semibold">{soldCount}</div>
                  <div className="text-xs text-gray-600">Vendus à Bord</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl text-gray-900 font-semibold">{serviceDuration}</div>
                  <div className="text-xs text-gray-600">Minutes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Total à remettre */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-gray-200 shadow-lg mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total à Remettre</div>
                  <div className="text-3xl text-green-600 font-bold">{totalCash.toFixed(3)} TND</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Détails du service */}
        <Card className="bg-white border-gray-200 shadow-lg mb-4">
          <CardHeader>
            <CardTitle className="text-[#1a3a52] text-lg">Détails du Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span className="text-gray-600">Bus:</span>
              <span className="font-semibold">{currentBus?.number}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span className="text-gray-600">Ligne:</span>
              <span className="font-semibold">{currentRoute?.name}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span className="text-gray-600">Heure de départ:</span>
              <span className="font-semibold">{serviceStartTime?.toLocaleTimeString('fr-TN')}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span className="text-gray-600">Heure de fin:</span>
              <span className="font-semibold">{new Date().toLocaleTimeString('fr-TN')}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-gray-700">
              <span className="text-gray-600">Places vendues à bord:</span>
              <span className="font-semibold">{soldCount}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span className="text-gray-600">Places réservées au guichet:</span>
              <span className="font-semibold">{reservedCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Liste des billets vendus */}
        {tickets.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-lg mb-4">
            <CardHeader>
              <CardTitle className="text-[#1a3a52] text-lg">Billets Vendus à Bord</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tickets.map((ticket, index) => (
                <div
                  key={ticket.id}
                  className="bg-gradient-to-br from-blue-50 to-slate-50 p-3 rounded-lg flex justify-between items-center border border-gray-200"
                >
                  <div className="text-gray-900">
                    <div className="text-sm font-medium">
                      {ticket.from} → {ticket.to}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(ticket.timestamp).toLocaleTimeString('fr-TN')}
                    </div>
                  </div>
                  <div className="text-gray-900 font-semibold">{ticket.total.toFixed(3)} TND</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 mb-4">
          <Button
            onClick={handlePrintReport}
            className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg"
            size="lg"
          >
            <Printer className="w-5 h-5 mr-2" />
            Imprimer le Rapport
          </Button>
          <Button
            onClick={() => setShowConfirmDialog(true)}
            className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white text-lg"
            size="lg"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Clôturer
          </Button>
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-[#1a3a52]">Confirmer la Clôture</DialogTitle>
            <DialogDescription className="text-gray-600">
              Êtes-vous sûr de vouloir clôturer ce service ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="text-3xl text-green-600 font-bold mb-2">
                  {totalCash.toFixed(3)} TND
                </div>
                <div className="text-sm text-gray-600">Total à remettre</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowConfirmDialog(false)}
                variant="outline"
                className="flex-1 bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmClosure}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Composant d'impression caché */}
      <PrintableServiceReport />
    </div>
  );
}
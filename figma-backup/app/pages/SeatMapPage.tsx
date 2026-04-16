import { useNavigate } from 'react-router';
import { useService } from '../data/ServiceContext';
import { Header } from '../components/Header';
import { SeatGrid } from '../components/SeatGrid';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Seat } from '../data/mockData';
import { toast } from 'sonner';

export default function SeatMapPage() {
  const navigate = useNavigate();
  const { seats } = useService();

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'reserved-counter') {
      toast.info(`Place ${seat.number} - Réservé par ${seat.passenger?.name}`, {
        description: `${seat.passenger?.boardingStop} → ${seat.passenger?.destinationStop}`,
      });
    } else if (seat.status === 'sold-onboard') {
      toast.success(`Place ${seat.number} - Vendu à bord`, {
        description: 'Ticket déjà émis',
      });
    } else {
      toast.success(`Place ${seat.number} - Disponible`, {
        description: 'Vous pouvez vendre cette place',
      });
    }
  };

  const availableCount = seats.filter((s) => s.status === 'available').length;
  const reservedCount = seats.filter((s) => s.status === 'reserved-counter').length;
  const soldCount = seats.filter((s) => s.status === 'sold-onboard').length;

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
            <CardTitle className="text-[#1a3a52]">Plan de Salle</CardTitle>
            <div className="grid grid-cols-3 gap-2 text-center text-sm pt-2">
              <div>
                <div className="text-2xl text-green-600 font-semibold">{availableCount}</div>
                <div className="text-xs text-gray-600">Disponibles</div>
              </div>
              <div>
                <div className="text-2xl text-red-600 font-semibold">{reservedCount}</div>
                <div className="text-xs text-gray-600">Réservés</div>
              </div>
              <div>
                <div className="text-2xl text-blue-600 font-semibold">{soldCount}</div>
                <div className="text-xs text-gray-600">Vendus</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SeatGrid seats={seats} onSeatClick={handleSeatClick} columns={4} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
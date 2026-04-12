import { useNavigate } from 'react-router';
import { useService } from '../data/ServiceContext';
import { Header } from '../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  LayoutGrid,
  Users,
  Ticket,
  AlertTriangle,
  Clock,
  DollarSign,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { useEffect } from 'react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isServiceActive, seats, tickets, totalCash, currentRoute } = useService();

  useEffect(() => {
    if (!isServiceActive) {
      navigate('/service-start');
    }
  }, [isServiceActive, navigate]);

  if (!isServiceActive) {
    return null;
  }

  const availableSeats = seats.filter((s) => s.status === 'available').length;
  const reservedSeats = seats.filter((s) => s.status === 'reserved-counter').length;
  const soldSeats = seats.filter((s) => s.status === 'sold-onboard').length;
  const validatedPassengers = seats.filter(
    (s) => s.passenger?.validated === true
  ).length;

  const menuItems = [
    {
      title: 'Plan de Salle',
      description: 'Vue des sièges disponibles',
      icon: LayoutGrid,
      path: '/seat-map',
      color: 'bg-blue-600',
    },
    {
      title: 'Manifeste Passagers',
      description: `${validatedPassengers}/${reservedSeats} validés`,
      icon: Users,
      path: '/manifest',
      color: 'bg-purple-600',
    },
    {
      title: 'Vendre Billet',
      description: 'Nouvelle vente à bord',
      icon: Ticket,
      path: '/ticket-sale',
      color: 'bg-green-600',
    },
    {
      title: 'Signaler Incident',
      description: 'Rapport de problème',
      icon: AlertTriangle,
      path: '/incident',
      color: 'bg-[#fbbf24]',
    },
    {
      title: 'Clôturer Service',
      description: 'Fin de service',
      icon: Clock,
      path: '/closure',
      color: 'bg-red-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <div className="p-4 space-y-4">
        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl text-gray-900 font-semibold">{availableSeats}</div>
                  <div className="text-xs text-gray-600">Places Libres</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl text-gray-900 font-semibold">{totalCash.toFixed(3)}</div>
                  <div className="text-xs text-gray-600">TND Collecté</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl text-gray-900 font-semibold">{reservedSeats}</div>
                  <div className="text-xs text-gray-600">Réservations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl text-gray-900 font-semibold">{tickets.length}</div>
                  <div className="text-xs text-gray-600">Billets Vendus</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu principal */}
        <div className="space-y-3 pt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full h-auto p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
                variant="outline"
              >
                <div className="flex items-center gap-4 p-4 w-full">
                  <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-base text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-600">{item.description}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
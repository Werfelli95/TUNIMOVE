import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useService } from '../data/ServiceContext';
import { BUSES, ROUTES } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { ArrowRight, Bus, MapPin, Play } from 'lucide-react';

export default function ServiceStartPage() {
  const navigate = useNavigate();
  const { startService } = useService();
  const [selectedBusId, setSelectedBusId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');

  const matricule = localStorage.getItem('receiverMatricule') || 'REC2024001';

  const handleStartService = () => {
    const bus = BUSES.find((b) => b.id === selectedBusId);
    const route = ROUTES.find((r) => r.id === selectedRouteId);

    if (bus && route) {
      startService(bus, route, matricule);
      navigate('/dashboard');
    }
  };

  const selectedBus = BUSES.find((b) => b.id === selectedBusId);
  const selectedRoute = ROUTES.find((r) => r.id === selectedRouteId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-[#1a3a52]">Ouverture de Service</CardTitle>
            <CardDescription className="text-gray-600">
              Sélectionnez votre bus et votre ligne de service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-700 flex items-center gap-2">
                <Bus className="w-4 h-4" />
                Numéro de Bus
              </Label>
              <Select value={selectedBusId} onValueChange={setSelectedBusId}>
                <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 h-12 focus:border-[#1a3a52] focus:ring-[#1a3a52]">
                  <SelectValue placeholder="Sélectionnez un bus" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {BUSES.map((bus) => (
                    <SelectItem key={bus.id} value={bus.id} className="text-gray-900">
                      Bus {bus.number} - {bus.capacity} places
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Ligne de Service
              </Label>
              <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 h-12 focus:border-[#1a3a52] focus:ring-[#1a3a52]">
                  <SelectValue placeholder="Sélectionnez une ligne" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {ROUTES.map((route) => (
                    <SelectItem key={route.id} value={route.id} className="text-gray-900">
                      {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBus && selectedRoute && (
              <Card className="bg-gradient-to-br from-blue-50 to-slate-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1a3a52]">Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Bus:</span>
                    <span className="font-semibold text-[#1a3a52]">{selectedBus.number}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Capacité:</span>
                    <span className="font-semibold text-[#1a3a52]">{selectedBus.capacity} places</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Ligne:</span>
                    <span className="font-semibold text-[#1a3a52]">{selectedRoute.name}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Trajet:</span>
                    <span className="font-semibold text-[#1a3a52]">
                      {selectedRoute.departure} → {selectedRoute.destination}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleStartService}
              disabled={!selectedBusId || !selectedRouteId}
              className="w-full h-14 bg-[#1a3a52] hover:bg-[#2a4a62] text-white text-lg"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Démarrer le Service
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
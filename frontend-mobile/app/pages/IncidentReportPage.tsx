import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { INCIDENT_TYPES } from '../data/mockData';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function IncidentReportPage() {
  const navigate = useNavigate();
  const [selectedIncident, setSelectedIncident] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!selectedIncident) {
      toast.error('Type d\'incident requis', {
        description: 'Veuillez sélectionner un type d\'incident',
      });
      return;
    }

    const incidentType = INCIDENT_TYPES.find((i) => i.id === selectedIncident);

    toast.success('Incident signalé !', {
      description: `${incidentType?.label} - L'administration sera notifiée`,
    });

    // Reset form
    setSelectedIncident('');
    setDescription('');

    // Navigate back after a short delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
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
            <CardTitle className="text-[#1a3a52]">Signaler un Incident</CardTitle>
            <p className="text-sm text-gray-600">
              Cette alerte sera immédiatement transmise à l'administration TuniMove
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-gray-700 font-medium">Type d'incident</label>
              <div className="grid grid-cols-2 gap-3">
                {INCIDENT_TYPES.map((incident) => (
                  <Button
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident.id)}
                    variant={selectedIncident === incident.id ? 'default' : 'outline'}
                    className={`h-auto p-4 flex flex-col items-center gap-2 ${
                      selectedIncident === incident.id
                        ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-black border-[#fbbf24]'
                        : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200'
                    }`}
                  >
                    <div className="text-3xl">{incident.icon}</div>
                    <div className="text-sm text-center">{incident.label}</div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-gray-700 font-medium">Description (optionnel)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez l'incident en détail..."
                className="bg-gray-50 border-gray-300 text-gray-900 min-h-32"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="text-sm text-gray-700">
                  <div className="text-[#f59e0b] font-semibold mb-1">Attention</div>
                  En signalant un incident, l'état du bus sera automatiquement mis à jour dans le
                  système. L'administration sera notifiée en temps réel.
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!selectedIncident}
              className="w-full h-14 bg-red-600 hover:bg-red-700 text-white text-lg"
              size="lg"
            >
              <Send className="w-5 h-5 mr-2" />
              Envoyer le Rapport
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
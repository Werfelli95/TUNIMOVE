import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Bus, KeyRound, User } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock authentication - dans une vraie app, ça serait connecté à une API
    if (matricule && password) {
      localStorage.setItem('receiverMatricule', matricule);
      navigate('/service-start');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-gray-200 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-[#1a3a52] rounded-full flex items-center justify-center">
            <Bus className="w-8 h-8 text-[#fbbf24]" />
          </div>
          <div>
            <CardTitle className="text-2xl text-[#1a3a52]">TuniMove</CardTitle>
            <p className="text-sm text-gray-600 mt-2">Transport Interurbain Tunisien</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matricule" className="text-gray-700">
                Matricule
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="matricule"
                  type="text"
                  placeholder="Entrez votre matricule"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 pl-10 h-12 focus:border-[#1a3a52] focus:ring-[#1a3a52]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900 h-12 focus:border-[#1a3a52] focus:ring-[#1a3a52]"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#1a3a52] hover:bg-[#2a4a62] text-white"
              size="lg"
            >
              Se Connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
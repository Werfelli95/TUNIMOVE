import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  CircleDollarSign,
  Bus,
  Network,
  Users,
  TrendingUp,
  MapPin,
  Clock,
  Zap,
  Store
} from 'lucide-react';
import { useState, useEffect } from 'react';

const StatCard = ({ title, value, subtext, icon, color, trend }) => (
  <div className="stat-card">
    <div className="flex justify-between items-start">
      <div className={`stat-icon bg-${color}-50 text-${color}-600`}>
        {icon}
      </div>
      {trend && (
        <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
          <TrendingUp size={12} className="mr-1" /> {trend}
        </span>
      )}
    </div>
    <div className="mt-4">
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      <p className="text-slate-400 text-xs mt-1">{subtext}</p>
    </div>
  </div>
);

const dataLine = [
  { name: 'Lun', value: 0 },
  { name: 'Mar', value: 0 },
  { name: 'Mer', value: 0 },
  { name: 'Jeu', value: 0 },
  { name: 'Ven', value: 0 },
  { name: 'Sam', value: 0 },
  { name: 'Dim', value: 0 },
];

const dataBar = [
  { name: 'Normal', value: 0, color: '#6366f1' },
  { name: 'Étudiant', value: 0, color: '#818cf8' },
  { name: 'Militaire', value: 0, color: '#c7d2fe' },
];

const Dashboard = () => {
    const [personnelCount, setPersonnelCount] = useState(0);
    const [activeBusCount, setActiveBusCount] = useState(0);
    const [activeLineCount, setActiveLineCount] = useState(0);
    const [activeGuichetCount, setActiveGuichetCount] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [userRes, busRes, lineRes, guichetRes] = await Promise.all([
                    fetch('http://localhost:5000/api/users/count'),
                    fetch('http://localhost:5000/api/buses/active-count'),
                    fetch('http://localhost:5000/api/network/count'),
                    fetch('http://localhost:5000/api/guichets/stats')
                ]);

                const userData = await userRes.json();
                const busData = await busRes.json();
                const lineData = await lineRes.json();
                const guichetData = await guichetRes.json();

                setPersonnelCount(userData.count);
                setActiveBusCount(busData.count);
                setActiveLineCount(lineData.count);
                setActiveGuichetCount(guichetData.activeCount);
            } catch (error) {
                console.error("Erreur stats dashboard:", error);
            }
        };
        fetchCounts();
    }, []);

    return (
        <div className="animate-in fade-in duration-700">

            <div className="dashboard-grid">
                <StatCard
                    title="Guichets actifs"
                    value={activeGuichetCount}
                    icon={<Store size={24} />}
                    color="indigo"
                />
                <StatCard
                    title="Bus Actifs"
                    value={activeBusCount}
                    icon={<Bus size={24} />}
                    color="green"
                />
                <StatCard
                    title="Lignes Actives"
                    value={activeLineCount}
                    icon={<Network size={24} />}
                    color="blue"
                />
                <StatCard
                    title="Personnel"
                    value={personnelCount - 1}
                    icon={<Users size={24} />}
                    color="purple"
                />
            </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 chart-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-lg font-bold text-slate-800">Recettes par Jour</h4>
              <p className="text-slate-500 text-sm">Données hebdomadaires (Base vide)</p>
            </div>
          </div>
          <div className="h-[300px] w-full border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center">
            <p className="text-slate-300 font-medium">Aucune donnée disponible pour le moment</p>
          </div>
        </div>

        <div className="chart-container">
          <h4 className="text-lg font-bold text-slate-800 mb-2">Répartition des Passagers</h4>
          <p className="text-slate-500 text-sm mb-8">Base de données vide</p>

          <div className="space-y-6">
            {dataBar.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-600">{item.name}</span>
                  <span className="text-sm font-bold text-slate-400">0 passagers</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `0%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-10 pt-8 border-t border-slate-100">
            <div className="text-center">
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Total Passagers</p>
              <h5 className="text-xl font-black text-slate-300 mt-1">0</h5>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Prix Moyen</p>
              <h5 className="text-xl font-black text-slate-300 mt-1">0.000</h5>
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-3 gap-6">
        <div className="stat-card opacity-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <MapPin size={20} />
            </div>
            <h5 className="font-bold text-slate-800">Ligne la plus fréquentée</h5>
          </div>
          <p className="text-slate-400 text-sm mb-2 italic">Aucune donnée</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-300">0 km</span>
            <span className="badge bg-slate-100 text-slate-400">0 tickets</span>
          </div>
        </div>

        <div className="stat-card opacity-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Zap size={20} />
            </div>
            <h5 className="font-bold text-slate-800">Taux de remplissage moyen</h5>
          </div>
          <div className="flex items-end justify-between">
            <h4 className="text-3xl font-black text-slate-300">0%</h4>
            <div className="w-2/3 mb-2">
              <div className="progress-bar-container">
                <div className="progress-bar-fill bg-slate-200" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card opacity-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock size={20} />
            </div>
            <h5 className="font-bold text-slate-800">Horaire le plus demandé</h5>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-3xl font-black text-slate-300">--:--</h4>
              <p className="text-slate-400 text-xs mt-1">Aucune pointe</p>
            </div>
            <div className="text-slate-200">
              <TrendingUp size={32} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

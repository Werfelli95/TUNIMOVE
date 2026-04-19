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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

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

const dataBarDefault = [
  { name: 'Normal', value: 0, color: '#6366f1' },
  { name: 'Étudiant', value: 0, color: '#818cf8' },
  { name: 'Militaire', value: 0, color: '#c7d2fe' },
];

const Dashboard = () => {
  const [personnelCount, setPersonnelCount] = useState(0);
  const [activeBusCount, setActiveBusCount] = useState(0);
  const [activeLineCount, setActiveLineCount] = useState(0);
  const [activeGuichetCount, setActiveGuichetCount] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [passengerData, setPassengerData] = useState(dataBarDefault);
  const [totalTickets, setTotalTickets] = useState(0);
  const [rolesData, setRolesData] = useState(null);
  const [avgPrice, setAvgPrice] = useState(0);
  const [advancedStats, setAdvancedStats] = useState({
    topLine: null,
    avgOccupancy: 0,
    peakHour: null
  });
  const [period, setPeriod] = useState('week'); // 'week' ou 'month'

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [userRes, busRes, lineRes, guichetRes, revenueRes, passengerRes, rolesRes] = await Promise.all([
          fetch('http://localhost:5000/api/users/count'),
          fetch('http://localhost:5000/api/buses/active-count'),
          fetch('http://localhost:5000/api/network/count'),
          fetch('http://localhost:5000/api/guichets/stats'),
          fetch(`http://localhost:5000/api/sales/stats/revenue?period=${period}`),
          fetch('http://localhost:5000/api/sales/stats/passengers'),
          fetch('http://localhost:5000/api/admin/roles-overview')
        ]);

        const userData = await userRes.json();
        const busData = await busRes.json();
        const lineData = await lineRes.json();
        const guichetData = await guichetRes.json();
        const revData = await revenueRes.json();
        const passData = await passengerRes.json();
        if (rolesRes.ok) {
          const rData = await rolesRes.json();
          setRolesData(rData);
        }

        setPersonnelCount(userData.count);
        setActiveBusCount(busData.count);
        setActiveLineCount(lineData.count);
        setActiveGuichetCount(guichetData.activeCount);
        
        if (Array.isArray(revData)) {
          setRevenueData(revData);
        }

        if (passData && passData.length > 0) {
          setPassengerData(passData);
          const total = passData.reduce((acc, curr) => acc + curr.value, 0);
          setTotalTickets(total);
          const totalRev = revData.reduce((acc, curr) => acc + parseFloat(curr.value), 0);
          setAvgPrice(total > 0 ? totalRev / total : 0);
        }

        // CHARGEMENT DES STATS AVANCÉES
        try {
          const advRes = await fetch('http://localhost:5000/api/sales/stats/advanced');
          if (advRes.ok) {
            const advData = await advRes.json();
            setAdvancedStats(advData);
          }
        } catch (err) {
          console.error("Erreur stats avancées:", err);
        }

      } catch (error) {
        console.error("Erreur stats dashboard:", error);
      }
    };
    fetchCounts();
  }, [period]);

  const downloadPDF = () => {
    const doc = new jsPDF();

    // Titre
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.text('TUNIMOVE - Rapport de Recettes', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Période : ${period === 'week' ? 'Dernière Semaine' : 'Dernier Mois'}`, 14, 30);
    doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 14, 37);

    // Tableau des données
    const tableData = revenueData.map(row => [
      row.full_date,
      row.name,
      `${row.value.toFixed(3)} TND`
    ]);

    autoTable(doc, {
      head: [['Date', 'Jour', 'Recette']],
      body: tableData,
      startY: 45,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
    });

    // Total
    const total = revenueData.reduce((acc, curr) => acc + curr.value, 0);
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`Total des Recettes : ${total.toFixed(3)} TND`, 14, finalY);

    doc.save(`TuniMove_Recettes_${period}.pdf`);
  };

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

      {rolesData && (
        <div className="mb-8">
          <h4 className="text-xl font-black text-slate-800 mb-4">Vue d'ensemble Opérationnelle (Rôles)</h4>
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
              <p className="text-indigo-600 font-bold mb-2">Agents de Guichet</p>
              <h3 className="text-3xl font-black text-indigo-900">{rolesData.agents?.total || 0}</h3>
              <p className="text-indigo-500 text-xs mt-1 font-medium">Vente en agence</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
              <p className="text-blue-600 font-bold mb-2">Receveurs</p>
              <h3 className="text-3xl font-black text-blue-900">{rolesData.receveurs?.total || 0}</h3>
              <p className="text-blue-500 text-xs mt-1 font-medium">{rolesData.receveurs?.activeServices || 0} en service actuellement</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
              <p className="text-emerald-600 font-bold mb-2">Contrôleurs</p>
              <h3 className="text-3xl font-black text-emerald-900">{rolesData.controleurs?.total || 0}</h3>
              <p className="text-emerald-500 text-xs mt-1 font-medium">Validation mobile</p>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 shadow-sm">
              <p className="text-rose-600 font-bold mb-2">Incidents (Dernières 24h)</p>
              <h3 className="text-3xl font-black text-rose-900">{rolesData.incidents?.last24h || 0}</h3>
              <p className="text-rose-500 text-xs mt-1 font-medium">Signalés terrain</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 chart-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-lg font-bold text-slate-800">Recettes par Jour</h4>
              <p className="text-slate-500 text-sm">{period === 'week' ? '7 derniers jours (TND)' : '30 derniers jours (TND)'}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={downloadPDF}
                className="btn-pdf"
              >
                <Download size={16} />
                PDF
              </button>
              <div className="period-toggle-container">
                <button
                  onClick={() => setPeriod('week')}
                  className={`btn-period ${period === 'week' ? 'active' : ''}`}
                >
                  Semaine
                </button>
                <button
                  onClick={() => setPeriod('month')}
                  className={`btn-period ${period === 'month' ? 'active' : ''}`}
                >
                  Mois
                </button>
              </div>
            </div>
          </div>

          <div style={{ height: '400px', width: '100%' }} id="revenue-chart-parent">
            {Array.isArray(revenueData) && revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" key={period}>
                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '400px', width: '100%' }} className="border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center">
                <p className="text-slate-300 font-medium">Chargement des données...</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-container">
          <h4 className="text-lg font-bold text-slate-800 mb-2">Répartition des Passagers</h4>
          <p className="text-slate-500 text-sm mb-8">Types de tarifs vendus</p>

          <div className="space-y-6">
            {passengerData.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-600">{item.name}</span>
                  <span className="text-sm font-bold text-slate-800">{item.value} tickets</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${totalTickets > 0 ? (item.value / totalTickets) * 100 : 0}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-10 pt-8 border-t border-slate-100">
            <div className="text-center">
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Total Passagers</p>
              <h5 className="text-xl font-black text-slate-800 mt-1">{totalTickets}</h5>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Prix Moyen</p>
              <h5 className="text-xl font-black text-slate-800 mt-1">{avgPrice.toFixed(3)}</h5>
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <MapPin size={20} />
            </div>
            <h5 className="font-bold text-slate-800">Ligne la plus fréquentée</h5>
          </div>
          {advancedStats.topLine ? (
              <>
                <p className="text-slate-700 font-bold mb-1">{advancedStats.topLine.name}</p>
                <p className="text-slate-500 text-xs mb-3 truncate">{advancedStats.topLine.route}</p>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">{advancedStats.topLine.distance} km</span>
                    <span className="badge bg-blue-50 text-blue-600 font-bold">{advancedStats.topLine.count} tickets</span>
                </div>
              </>
          ) : (
              <p className="text-slate-400 text-sm mb-2 italic">Aucune donnée</p>
          )}
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Zap size={20} />
            </div>
            <h5 className="font-bold text-slate-800">Taux de remplissage moyen</h5>
          </div>
          <div className="flex items-end justify-between">
            <h4 className="text-3xl font-black text-slate-800">{advancedStats.avgOccupancy}%</h4>
            <div className="w-2/3 mb-2">
              <div className="progress-bar-container">
                <div 
                    className="progress-bar-fill bg-green-500" 
                    style={{ width: `${advancedStats.avgOccupancy}%`, transition: 'width 1.5s ease-in-out' }} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock size={20} />
            </div>
            <h5 className="font-bold text-slate-800">Horaire le plus demandé</h5>
          </div>
          <div className="flex items-center justify-between">
            {advancedStats.peakHour ? (
                <>
                    <div>
                        <h4 className="text-3xl font-black text-slate-800">{advancedStats.peakHour.time}</h4>
                        <p className="text-slate-500 text-xs mt-1 font-medium">{advancedStats.peakHour.count} ventes aujourd'hui</p>
                    </div>
                    <div className="text-indigo-600 bg-indigo-50 p-3 rounded-2xl animate-pulse">
                        <TrendingUp size={32} />
                    </div>
                </>
            ) : (
                <h4 className="text-3xl font-black text-slate-300">--:--</h4>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

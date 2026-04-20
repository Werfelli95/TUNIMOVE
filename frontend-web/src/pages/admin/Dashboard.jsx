import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Bus, Network, Users, TrendingUp, MapPin, Clock, Zap, Store,
  AlertTriangle, Download, ShieldCheck, User, Eye, ArrowRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Users.css'; // Use the new premium shared design system

// Helper to generate gradient colors based on base color
const getColorPalette = (color) => {
  const palettes = {
    indigo: { bg: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', text: '#4338CA', dot: '#6366F1' },
    green:  { bg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', text: '#047857', dot: '#10B981' },
    blue:   { bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', text: '#1D4ED8', dot: '#3B82F6' },
    purple: { bg: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)', text: '#7E22CE', dot: '#A855F7' },
    rose:   { bg: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)', text: '#BE123C', dot: '#F43F5E' },
    amber:  { bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', text: '#B45309', dot: '#F59E0B' },
  };
  return palettes[color] || palettes.indigo;
};

const PremiumStatCard = ({ title, value, subtext, icon, color, trend, onClick }) => {
  const palette = getColorPalette(color);
  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)',
      display: 'flex', flexDirection: 'column', gap: '16px',
      border: '1px solid #F1F5F9',
      transition: 'all 0.2s',
      cursor: onClick ? 'pointer' : 'default'
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      if (onClick) e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.06)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      if (onClick) e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)';
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '18px',
          background: palette.bg, color: palette.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${palette.dot}20`
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: '#ECFDF5', color: '#059669',
            padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 800
          }}>
            <TrendingUp size={14} /> {trend}
          </div>
        )}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
        <h3 style={{ margin: '4px 0 0', fontSize: '32px', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{value}</h3>
        {subtext && <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>{subtext}</p>}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'white', padding: '16px', borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9', minWidth: '150px'
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#4338CA' }}>
          {Number(payload[0].value).toFixed(2)} <span style={{ fontSize: '14px', color: '#64748B' }}>TND</span>
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [personnelCount, setPersonnelCount] = useState(0);
  const [activeBusCount, setActiveBusCount] = useState(0);
  const [activeLineCount, setActiveLineCount] = useState(0);
  const [activeGuichetCount, setActiveGuichetCount] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [passengerData, setPassengerData] = useState([{ name: 'Normal', value: 0, color: '#6366f1' }]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [rolesData, setRolesData] = useState(null);
  const [avgPrice, setAvgPrice] = useState(0);
  const [advancedStats, setAdvancedStats] = useState({ topLine: null, avgOccupancy: 0, peakHour: null });
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [userRes, busRes, lineRes, guichetRes, revenueRes, passRes, rolesRes, advRes] = await Promise.all([
          fetch('http://localhost:5000/api/users/count'),
          fetch('http://localhost:5000/api/buses/active-count'),
          fetch('http://localhost:5000/api/network/count'),
          fetch('http://localhost:5000/api/guichets/stats'),
          fetch(`http://localhost:5000/api/sales/stats/revenue?period=${period}`),
          fetch('http://localhost:5000/api/sales/stats/passengers'),
          fetch('http://localhost:5000/api/admin/roles-overview'),
          fetch('http://localhost:5000/api/sales/stats/advanced').catch(() => null)
        ]);

        if (userRes.ok) setPersonnelCount((await userRes.json()).count);
        if (busRes.ok) setActiveBusCount((await busRes.json()).count);
        if (lineRes.ok) setActiveLineCount((await lineRes.json()).count);
        if (guichetRes.ok) setActiveGuichetCount((await guichetRes.json()).activeCount);
        
        if (rolesRes.ok) setRolesData(await rolesRes.json());
        if (advRes && advRes.ok) setAdvancedStats(await advRes.json());

        if (revenueRes.ok) {
          const revData = await revenueRes.json();
          if (Array.isArray(revData)) setRevenueData(revData);
        }

        if (passRes.ok) {
          const passData = await passRes.json();
          if (passData && passData.length > 0) {
            setPassengerData(passData);
            const total = passData.reduce((acc, curr) => acc + curr.value, 0);
            setTotalTickets(total);
            const totalRev = revenueData.reduce((acc, curr) => acc + parseFloat(curr.value || 0), 0) || 0;
            setAvgPrice(total > 0 ? (totalRev / total) : 0);
          }
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };
    fetchCounts();
  }, [period]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(67, 56, 202);
    doc.text('TUNIMOVE - Tableau de Bord Exécutif', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Période : ${period === 'week' ? '7 derniers jours' : '30 derniers jours'}`, 14, 32);
    doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 14, 38);

    autoTable(doc, {
      head: [['Date', 'Jour', 'Recette (TND)']],
      body: revenueData.map(row => [row.full_date, row.name, Number(row.value).toFixed(3)]),
      startY: 48,
      theme: 'grid',
      headStyles: { fillColor: [67, 56, 202], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 6 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const total = revenueData.reduce((acc, curr) => acc + Number(curr.value), 0);
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`Total des Recettes générées : ${total.toFixed(3)} TND`, 14, finalY);
    doc.save(`TuniMove_Rapport_${period}.pdf`);
  };

  return (
    <div className="users-container" style={{ paddingBottom: '40px' }}>
      
      {/* PREMIUM HEADER CARD */}
      <div className="users-header-card" style={{ marginBottom: '32px' }}>
        <div className="header-titles">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp size={28} color="white" /> Vue d'Ensemble
          </h1>
          <p>Indicateurs de performance et statistiques en temps réel de votre réseau TuniMove.</p>
        </div>
        <div className="header-actions">
          <button className="btn-add-user" onClick={downloadPDF} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
            <Download size={16} />
            <span>Exporter PDF</span>
          </button>
        </div>
      </div>

      {/* TOP 4 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <PremiumStatCard title="Guichets actifs" value={activeGuichetCount} subtext="Stations ouvertes à la vente" icon={<Store size={28} />} color="indigo" onClick={() => navigate('/admin-dashboard/assignments')} />
        <PremiumStatCard title="Flotte Active" value={activeBusCount} subtext="Véhicules en service" icon={<Bus size={28} />} color="green" onClick={() => navigate('/admin-dashboard/fleet')} />
        <PremiumStatCard title="Réseau" value={activeLineCount} subtext="Lignes couvertes" icon={<Network size={28} />} color="blue" onClick={() => navigate('/admin-dashboard/network')} />
        <PremiumStatCard title="Équipe" value={personnelCount > 0 ? personnelCount - 1 : 0} subtext="Collaborateurs sur le terrain" icon={<Users size={28} />} color="purple" onClick={() => navigate('/admin-dashboard/users')} />
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
        {/* MAIN CHART */}
        <div style={{ flex: 2, background: 'white', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>Historique des Recettes</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Évolution des ventes (TND)</p>
            </div>
            <div style={{ display: 'flex', background: '#F8FAFC', padding: '6px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <button onClick={() => setPeriod('week')} style={{
                border: 'none', background: period === 'week' ? 'white' : 'transparent',
                padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 800,
                color: period === 'week' ? '#4338CA' : '#64748B', cursor: 'pointer',
                boxShadow: period === 'week' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s'
              }}>7 derniers jours</button>
              <button onClick={() => setPeriod('month')} style={{
                border: 'none', background: period === 'month' ? 'white' : 'transparent',
                padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 800,
                color: period === 'month' ? '#4338CA' : '#64748B', cursor: 'pointer',
                boxShadow: period === 'month' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s'
              }}>30 derniers jours</button>
            </div>
          </div>
          
          <div style={{ height: '320px', width: '100%' }}>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: '16px' }}>
                <p style={{ color: '#94A3B8', fontWeight: 600 }}>Collecte des données...</p>
              </div>
            )}
          </div>
        </div>

        {/* DISTRIBUTION TICKET CARD */}
        <div style={{ flex: 1, background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', borderRadius: '24px', padding: '30px', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', opacity: 0.05, transform: 'rotate(-10deg)' }}>
            <Users size={250} color="white" />
          </div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Volume Passagers</h2>
          <p style={{ margin: '4px 0 30px', fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>Mix tarifaire actuel</p>
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {passengerData.map((item, idx) => {
              const bgColors = ['#818CF8', '#34D399', '#FBBF24', '#F87171'];
              const col = item.color !== '#6366f1' ? item.color : bgColors[idx % bgColors.length];
              const pct = totalTickets > 0 ? (item.value / totalTickets) * 100 : 0;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0' }}>{item.name}</span>
                    <span style={{ fontSize: '14px', fontWeight: 900 }}>{item.value}</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: col, width: `${pct}%`, borderRadius: '99px', transition: 'width 1s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', minHeight: '90px' }}>
            <p style={{ margin: '0 0 5px', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tickets émis (Période)</p>
            <h3 style={{ margin: 0, fontSize: '36px', fontWeight: 900 }}>{totalTickets}</h3>
          </div>
        </div>
      </div>

      {rolesData && (
        <>
          <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 900, color: '#0F172A', width: '100%' }}>Supervision des Équipes</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
            <div 
              onClick={() => navigate('/admin-dashboard/users')}
              style={{ background: 'white', border: '1px solid #E0E7FF', padding: '20px', borderRadius: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 15px rgba(99,102,241,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.05)'; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#6366F1' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, color: '#6366F1', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase' }}>Guichetiers</p>
                  <h3 style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 900, color: '#1E1B4B' }}>{rolesData.agents?.total || 0}</h3>
                </div>
                <div style={{ width: '40px', height: '40px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Store size={20} color="#6366F1" /></div>
              </div>
            </div>
            
            <div 
              onClick={() => navigate('/admin-dashboard/users')}
              style={{ background: 'white', border: '1px solid #DBEAFE', padding: '20px', borderRadius: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 15px rgba(59,130,246,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(59,130,246,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(59,130,246,0.05)'; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#3B82F6' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, color: '#3B82F6', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase' }}>Receveurs Bus</p>
                  <h3 style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 900, color: '#1E3A8A' }}>{rolesData.receveurs?.total || 0}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{rolesData.receveurs?.activeServices || 0} en service actuellement</p>
                </div>
                <div style={{ width: '40px', height: '40px', background: '#EFF6FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bus size={20} color="#3B82F6" /></div>
              </div>
            </div>

            <div 
              onClick={() => navigate('/admin-dashboard/users')}
              style={{ background: 'white', border: '1px solid #D1FAE5', padding: '20px', borderRadius: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 15px rgba(16,185,129,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(16,185,129,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.05)'; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10B981' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, color: '#10B981', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase' }}>Contrôleurs</p>
                  <h3 style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 900, color: '#064E3B' }}>{rolesData.controleurs?.total || 0}</h3>
                </div>
                <div style={{ width: '40px', height: '40px', background: '#ECFDF5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={20} color="#10B981" /></div>
              </div>
            </div>

            <div 
              onClick={() => navigate('/admin-dashboard/incidents')}
              style={{ background: '#FFF1F2', border: '1px solid #FFE4E6', padding: '20px', borderRadius: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 15px rgba(244,63,94,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(244,63,94,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(244,63,94,0.05)'; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#F43F5E' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, color: '#F43F5E', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase' }}>Incidents (24H)</p>
                  <h3 style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 900, color: '#881337' }}>{rolesData.incidents?.last24h || 0}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#F43F5E', fontWeight: 600, opacity: 0.8 }}>Signalés sur le terrain</p>
                </div>
                <div style={{ width: '40px', height: '40px', background: 'rgba(244,63,94,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={20} color="#F43F5E" /></div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* RECENT INCIDENTS TABLE */}
      {rolesData && rolesData.incidents?.recent && rolesData.incidents.recent.length > 0 && (
        <div>
          <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>Alerte Terrain Récents</h2>
          <div className="users-table-card">
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Date & Heure</th>
                    <th>Véhicule</th>
                    <th>Catégorie</th>
                    <th>Gravité</th>
                    <th>Description</th>
                    <th>Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {rolesData.incidents.recent.map((inc) => (
                    <tr 
                      key={inc.id_incident} 
                      onClick={() => navigate('/admin-dashboard/incidents')}
                      style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ fontWeight: 600, color: '#334155' }}>
                        {new Date(inc.date_incident).toLocaleString('fr-FR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '4px 10px', borderRadius: '8px' }}>
                          <Bus size={14} /> N° {inc.numero_bus}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#64748B', fontSize: '13px' }}>{inc.categorie}</span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                          background: inc.gravite === 'critique' ? '#FEF2F2' : inc.gravite === 'moyenne' ? '#FFFBEB' : '#F0FDF4',
                          color: inc.gravite === 'critique' ? '#DC2626' : inc.gravite === 'moyenne' ? '#D97706' : '#16A34A',
                          border: `1px solid ${inc.gravite === 'critique' ? '#FECACA' : inc.gravite === 'moyenne' ? '#FDE68A' : '#BBF7D0'}`
                        }}>
                          {inc.gravite}
                        </span>
                      </td>
                      <td style={{ maxWidth: '250px' }}>
                        <p style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px', color: '#64748B' }}>
                          {inc.description}
                        </p>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={14} color="#64748B" />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{inc.signale_par}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

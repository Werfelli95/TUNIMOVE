import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Bus, GitPullRequest, Network, CircleDollarSign,
  History, LogOut, Bell, Search, User, Mail, Phone, Hash, Shield, X, Loader2, ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileModal from '../components/ProfileModal';
import '../components/Navbar.css';

const AdminLayout = () => {
  const navigate = useNavigate();

  // État de l'utilisateur connecté
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { nom: 'Admin', prenom: 'TuniMove' };
  });

  const [pendingResets, setPendingResets] = useState(0);

  // Charger le nombre de demandes en attente
  React.useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/password-reset/pending');
        const data = await res.json();
        setPendingResets(data.length);
      } catch (error) {
        console.error("Erreur notifications:", error);
      }
    };
    fetchPendingCount();
    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(fetchPendingCount, 300000);
    return () => clearInterval(interval);
  }, []);

  // État pour la modal de profil
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleOpenProfile = () => {
    setIsProfileOpen(true);
  };

  const navItems = [
    { icon: <LayoutDashboard />, label: 'Tableau de bord', path: '/admin-dashboard' },
    { icon: <Users />, label: 'Utilisateurs', path: '/admin-dashboard/users' },
    { icon: <Bus />, label: 'Flotte', path: '/admin-dashboard/fleet' },
    { 
      icon: (
        <div className="relative">
          <Shield />
          {pendingResets > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
          )}
        </div>
      ), 
      label: 'Réinitialisations', 
      path: '/admin-dashboard/password-resets' 
    },
    { icon: <GitPullRequest />, label: 'Affectations', path: '/admin-dashboard/assignments' },
    { icon: <Network />, label: 'Réseau', path: '/admin-dashboard/network' },
    { icon: <CircleDollarSign />, label: 'Tarifs', path: '/admin-dashboard/tarifs' },
    { icon: <History />, label: 'Audit', path: '/admin-dashboard/audit' },
    { icon: <ShoppingCart />, label: 'Historique des Ventes', path: '/admin-dashboard/sales-history' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/admin-secure-portal');
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="flex items-center justify-center mb-10 px-2">
          <img src="/images/tunimovebus.png" alt="TuniMove Logo" style={{ height: '100px', width: 'auto' }} />
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              end={item.path === '/admin-dashboard'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <button onClick={handleLogout} className="nav-item w-full text-red-500 hover:bg-red-50">
            <LogOut />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="main-wrapper">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Administration</h1>
            <p className="text-slate-500 text-sm">Bienvenue, {user.prenom} {user.nom}</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* BOUTON PROFIL CORRIGÉ */}
            <div
              className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 border border-indigo-200 cursor-pointer hover:bg-indigo-200 transition-all"
              onClick={handleOpenProfile}
            >
              <User size={24} />
            </div>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>

      {/* MODAL DE PROFIL REUTILISABLE */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={user.id}
      />
    </div>
  );
};

export default AdminLayout;

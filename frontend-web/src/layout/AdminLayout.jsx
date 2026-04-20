import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  PieChart, Users, Bus, Key, ClipboardList, Route, Tags, FileCheck, Receipt, Siren,
  LogOut, Bell, Search, User, Mail, Phone, Hash, Shield, X, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileModal from '../components/ProfileModal';
import '../components/Navbar.css';

const AdminLayout = () => {
  const navigate = useNavigate();

  // État de l'utilisateur connecté
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { nom: 'Admin', prenom: 'TuniMove', image_url: null };
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

    // Rafraîchir les informations de l'utilisateur pour avoir la photo à jour
    const refreshUserInfo = async () => {
      if (user && user.id) {
        try {
          const res = await fetch(`http://localhost:5000/api/users/${user.id}`);
          if (res.ok) {
            const data = await res.json();
            const updated = {
              id: data.id_utilisateur,
              nom: data.nom,
              prenom: data.prenom,
              role: data.role,
              matricule: data.matricule,
              image_url: data.image_url
            };
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));
          }
        } catch (error) {
          console.error("Erreur sync admin profile:", error);
        }
      }
    };

    fetchPendingCount();
    refreshUserInfo();
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
    { icon: <PieChart />, label: 'Tableau de bord', path: '/admin-dashboard' },
    { icon: <Users />, label: 'Utilisateurs', path: '/admin-dashboard/users' },
    { icon: <Bus />, label: 'Flotte', path: '/admin-dashboard/fleet' },
    {
      icon: (
        <div className="relative">
          <Key />
          {pendingResets > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
          )}
        </div>
      ),
      label: 'Réinitialisations',
      path: '/admin-dashboard/password-resets'
    },
    { icon: <ClipboardList />, label: 'Affectations', path: '/admin-dashboard/assignments' },
    { icon: <Route />, label: 'Réseau', path: '/admin-dashboard/network' },
    { icon: <Tags />, label: 'Tarifs', path: '/admin-dashboard/tarifs' },
    { icon: <FileCheck />, label: 'Audit', path: '/admin-dashboard/audit' },
    { icon: <Receipt />, label: 'Historique des Ventes', path: '/admin-dashboard/sales-history' },
    { icon: <Siren />, label: 'Incidents', path: '/admin-dashboard/incidents' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/admin-secure-portal');
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="flex items-center justify-center mb-10 px-2 mt-4">
          <NavLink to="/admin-dashboard" className="cursor-pointer transition-transform hover:scale-105 inline-block">
            <img src="/images/tunimovebus.png" alt="TuniMove Logo" style={{ height: '140px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
          </NavLink>
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


            {/* BOUTON PROFIL CORRIGÉ */}
            <div
              className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 border border-indigo-200 cursor-pointer hover:bg-indigo-200 shadow-sm transition-all hover:shadow-md overflow-hidden"
              onClick={handleOpenProfile}
            >
              {user.image_url ? (
                <img
                  src={`http://localhost:5000/${user.image_url}`}
                  alt="Avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User size={28} />
              )}
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
        onUpdate={(updatedUser) => {
          const updated = {
            id: updatedUser.id_utilisateur || updatedUser.id,
            nom: updatedUser.nom,
            prenom: updatedUser.prenom,
            role: updatedUser.role,
            matricule: updatedUser.matricule,
            image_url: updatedUser.image_url
          };
          setUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
        }}
      />
    </div>
  );
};

export default AdminLayout;

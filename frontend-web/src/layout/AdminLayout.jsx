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


  const [notifs, setNotifs] = useState({ resets: 0, incidents: 0, audits: 0, total: 0 });
  const prevTotalRef = React.useRef(0);

  // Charger les notifications
  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/notifications');
        if (res.ok) {
          const data = await res.json();
          // Si le nombre total augmente
          if (data.total > prevTotalRef.current) {
            // Notification logic here if needed (e.g. visual toast)
          }
          setNotifs(data);
          prevTotalRef.current = data.total;
        }
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

    fetchNotifications();
    refreshUserInfo();
    // Rafraîchir toutes les 30 secondes pour les notifications
    const interval = setInterval(fetchNotifications, 30000);
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
    { icon: <Key />, label: 'Réinitialisations', path: '/admin-dashboard/password-resets' },
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

  const [isNotifOpen, setIsNotifOpen] = useState(false);

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

          <div className="flex items-center gap-6">
            {/* CLOCHE DE NOTIFICATION */}
            <div className="relative" style={{ zIndex: 1001, height: '52px', width: '52px' }}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`transition-all flex items-center justify-center`}
                style={{ 
                  height: '52px', 
                  width: '52px', 
                  borderRadius: '50%',
                  position: 'relative',
                  backgroundColor: isNotifOpen ? '#eef2ff' : '#fff',
                  color: isNotifOpen ? '#4f46e5' : '#94a3b8',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <Bell size={28} />
                {notifs.total > 0 && (
                  <span className="notif-badge">
                    {notifs.total}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <div key="notif-portal-fix">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 10, transformOrigin: 'top right' }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="notif-dropdown"
                      style={{ 
                        position: 'absolute',
                        top: '60px',
                        right: '0',
                        display: 'block'
                      }}
                    >
                      <div className="notif-header">
                        <h3>Notifications</h3>
                        <span className="notif-status-tag">Action requise</span>
                      </div>
                      
                      <div className="notif-list">
                        {notifs.total === 0 ? (
                          <div className="notif-empty">
                            <div className="notif-empty-icon">
                              <Bell size={28} />
                            </div>
                            <p className="notif-empty-text">Aucune notification en attente</p>
                          </div>
                        ) : (
                          <>
                            {notifs.resets > 0 && (
                              <button 
                                onClick={() => { navigate('/admin-dashboard/password-resets'); setIsNotifOpen(false); }}
                                className="notif-item"
                              >
                                <div className="notif-icon-box" style={{ background: '#fef2f2', color: '#ef4444' }}>
                                  <Key size={22} />
                                </div>
                                <div className="notif-content">
                                  <span className="notif-title">Réinitialisations</span>
                                  <span className="notif-desc">{notifs.resets} demande{notifs.resets > 1 ? 's' : ''} en attente</span>
                                </div>
                                <div className="notif-dot" style={{ backgroundColor: '#ef4444' }}></div>
                              </button>
                            )}

                            {notifs.audits > 0 && (
                              <button 
                                onClick={() => { navigate('/admin-dashboard/audit'); setIsNotifOpen(false); }}
                                className="notif-item"
                              >
                                <div className="notif-icon-box" style={{ background: '#eef2ff', color: '#6366f1' }}>
                                  <FileCheck size={22} />
                                </div>
                                <div className="notif-content">
                                  <span className="notif-title">Audits & Fiches</span>
                                  <span className="notif-desc">{notifs.audits} fiche{notifs.audits > 1 ? 's' : ''} à valider</span>
                                </div>
                                <div className="notif-dot" style={{ backgroundColor: '#6366f1' }}></div>
                              </button>
                            )}

                            {notifs.incidents > 0 && (
                              <button 
                                onClick={() => { navigate('/admin-dashboard/incidents'); setIsNotifOpen(false); }}
                                className="notif-item"
                              >
                                <div className="notif-icon-box" style={{ background: '#fff7ed', color: '#f97316' }}>
                                  <Siren size={22} />
                                </div>
                                <div className="notif-content">
                                  <span className="notif-title">Incidents</span>
                                  <span className="notif-desc">{notifs.incidents} incident{notifs.incidents > 1 ? 's' : ''} non résolu{notifs.incidents > 1 ? 's' : ''}</span>
                                </div>
                                <div className="notif-dot" style={{ backgroundColor: '#f97316' }}></div>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      
                      {notifs.total > 0 && (
                        <div className="notif-footer">
                          <span className="notif-total-label">Total: {notifs.total} alertes</span>
                        </div>
                      )}
                    </motion.div>
                    
                    <div 
                      className="fixed inset-0 z-40 bg-black/5" 
                      onClick={() => setIsNotifOpen(false)}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>

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

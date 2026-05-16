import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  PieChart, Users, Bus, Key, ClipboardList, Route, Tags, FileCheck, Receipt, Siren,
  LogOut, Bell, Search, User, Mail, Phone, Hash, Shield, X, Loader2, RefreshCw, CheckCheck
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


  const [notifs, setNotifs] = useState({ resets: 0, incidents: 0, audits: 0, total: 0, items: [], generatedAt: null });
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('adminDismissedNotifications') || '{}');
    } catch {
      return {};
    }
  });
  const [isNotifLoading, setIsNotifLoading] = useState(false);
  const prevNotifsRef = React.useRef({ resets: 0, incidents: 0, audits: 0 });

  const fetchNotifications = React.useCallback(async () => {
    setIsNotifLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();

        setDismissed(prev => {
          const next = { ...prev };
          ['resets', 'incidents', 'audits'].forEach(type => {
            if ((data[type] || 0) > (prevNotifsRef.current[type] || 0)) {
              delete next[type];
            }
          });
          localStorage.setItem('adminDismissedNotifications', JSON.stringify(next));
          return next;
        });

        setNotifs({ ...data, items: data.items || [] });
        prevNotifsRef.current = { resets: data.resets, incidents: data.incidents, audits: data.audits };
      }
    } catch (error) {
      console.error("Erreur notifications:", error);
    } finally {
      setIsNotifLoading(false);
    }
  }, []);

  // Charger les notifications
  React.useEffect(() => {

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
  }, [fetchNotifications, user?.id]);

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
    { icon: <FileCheck />, label: 'Fiches de Service', path: '/admin-dashboard/audit' },
    { icon: <Receipt />, label: 'Historique des Ventes', path: '/admin-dashboard/sales-history' },
    { icon: <Siren />, label: 'Incidents', path: '/admin-dashboard/incidents' },
    { icon: <Route />, label: 'Suivi en Direct', path: '/admin-dashboard/tracking' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/admin-secure-portal');
  };

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleDismiss = (e, type) => {
    e.stopPropagation();
    setDismissed(prev => {
      const next = { ...prev, [type]: true };
      localStorage.setItem('adminDismissedNotifications', JSON.stringify(next));
      return next;
    });
  };

  const handleDismissAll = () => {
    const next = notificationItems.reduce((acc, item) => ({ ...acc, [item.type]: true }), {});
    localStorage.setItem('adminDismissedNotifications', JSON.stringify(next));
    setDismissed(next);
  };

  const notificationItems = (notifs.items && notifs.items.length > 0) ? notifs.items : [
    { id: 'resets', type: 'resets', count: notifs.resets, path: '/admin-dashboard/password-resets' },
    { id: 'audits', type: 'audits', count: notifs.audits, path: '/admin-dashboard/audit' },
    { id: 'incidents', type: 'incidents', count: notifs.incidents, path: '/admin-dashboard/incidents' }
  ].filter(item => item.count > 0);
  const visibleNotifItems = notificationItems.filter(item => item.count > 0 && !dismissed[item.type]);
  const visibleNotifsCount = visibleNotifItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="flex items-center justify-center mb-4 px-2 mt-1">
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
                {visibleNotifsCount > 0 && (
                  <span className="notif-badge">
                    {visibleNotifsCount > 99 ? '99+' : visibleNotifsCount}
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
                        <div>
                          <h3>Notifications</h3>
                          <span className="notif-status-tag">
                            {visibleNotifsCount > 0 ? `${visibleNotifsCount} en attente` : 'A jour'}
                          </span>
                        </div>
                        <div className="notif-header-actions">
                          <button className="notif-tool-btn" onClick={fetchNotifications} title="Actualiser" disabled={isNotifLoading}>
                            {isNotifLoading ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
                          </button>
                          {visibleNotifItems.length > 0 && (
                            <button className="notif-tool-btn" onClick={handleDismissAll} title="Tout masquer">
                              <CheckCheck size={15} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="notif-list">
                        {visibleNotifsCount === 0 ? (
                          <div className="notif-empty">
                            <div className="notif-empty-icon">
                              <Bell size={28} />
                            </div>
                            <p className="notif-empty-text">Aucune notification en attente</p>
                          </div>
                        ) : (
                          <>
                            {notifs.resets > 0 && !dismissed.resets && (
                              <div className="notif-item-wrapper">
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
                                </button>
                                <button className="notif-delete-btn" onClick={(e) => handleDismiss(e, 'resets')} title="Supprimer">
                                  <X size={14} />
                                </button>
                                <div className="notif-dot" style={{ backgroundColor: '#ef4444' }}></div>
                              </div>
                            )}

                            {notifs.audits > 0 && !dismissed.audits && (
                              <div className="notif-item-wrapper">
                                <button
                                  onClick={() => { navigate('/admin-dashboard/audit'); setIsNotifOpen(false); }}
                                  className="notif-item"
                                >
                                  <div className="notif-icon-box" style={{ background: '#eef2ff', color: '#6366f1' }}>
                                    <FileCheck size={22} />
                                  </div>
                                  <div className="notif-content">
                                    <span className="notif-title">Fiches de Service</span>
                                    <span className="notif-desc">{notifs.audits} nouvelle{notifs.audits > 1 ? 's' : ''} fiche{notifs.audits > 1 ? 's' : ''} reçue{notifs.audits > 1 ? 's' : ''}</span>
                                  </div>
                                </button>
                                <button className="notif-delete-btn" onClick={(e) => handleDismiss(e, 'audits')} title="Supprimer">
                                  <X size={14} />
                                </button>
                                <div className="notif-dot" style={{ backgroundColor: '#6366f1' }}></div>
                              </div>
                            )}

                            {notifs.incidents > 0 && !dismissed.incidents && (
                              <div className="notif-item-wrapper">
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
                                </button>
                                <button className="notif-delete-btn" onClick={(e) => handleDismiss(e, 'incidents')} title="Supprimer">
                                  <X size={14} />
                                </button>
                                <div className="notif-dot" style={{ backgroundColor: '#f97316' }}></div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {visibleNotifsCount > 0 && (
                        <div className="notif-footer">
                          <span className="notif-total-label">Dernière vérification: {notifs.generatedAt ? new Date(notifs.generatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
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

      {/* MODAL DE PROFIL REUTILISABLE */}
    </div>
  );
};

export default AdminLayout;

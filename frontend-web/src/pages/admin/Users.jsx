import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2, Trash2, UserPlus, Loader2, Search, Lock, Unlock, X,
  ShieldCheck, User, Users as UsersIcon, Store, Eye,
  Mail, Phone, Hash, ChevronRight
} from 'lucide-react';
import './Users.css';

/* ─── Role config ─────────────────────────────────────────── */
const ROLE_CFG = {
  ADMIN:      { bg: 'rgba(59,130,246,0.1)',  color: '#1D4ED8', dot: '#3B82F6', icon: ShieldCheck, label: 'Administrateur' },
  AGENT:      { bg: 'rgba(16,185,129,0.1)',  color: '#065F46', dot: '#10B981', icon: Store,       label: 'Agent de Guichet' },
  RECEVEUR:   { bg: 'rgba(245,158,11,0.12)', color: '#92400E', dot: '#F59E0B', icon: User,        label: 'Receveur'        },
  CONTROLEUR: { bg: 'rgba(139,92,246,0.12)', color: '#5B21B6', dot: '#8B5CF6', icon: Eye,         label: 'Contrôleur'      },
};

const getRoleCfg = (role = '') => ROLE_CFG[role.toUpperCase()] || ROLE_CFG.AGENT;

const RoleBadge = ({ role }) => {
  const cfg = getRoleCfg(role);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: cfg.bg, color: cfg.color,
      padding: '4px 12px', borderRadius: 99, fontSize: 11,
      fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
      border: `1.5px solid ${cfg.dot}40`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
};

/* ─── InfoRow for the detail panel ───────────────────────── */
const InfoRow = ({ icon: Icon, label, value, color = '#6366F1' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={16} color={color} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</p>
    </div>
  </div>
);

/* ══════════════ MAIN COMPONENT ═══════════════════════════════ */
const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null); 
  const [newUser, setNewUser] = useState({
    nom: '', prenom: '', email: '', matricule: '', num_tel: '', role: 'AGENT', mot_de_passe: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: '', prenom: '', email: '', matricule: '', num_tel: '', role: '', image_url: null
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = () => setIsAddModalOpen(true);
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setFormError(null);
    setNewUser({ nom: '', prenom: '', email: '', matricule: '', num_tel: '', role: 'AGENT', mot_de_passe: '' });
    setSelectedUser(null);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditForm({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      matricule: user.matricule,
      num_tel: user.num_tel,
      role: user.role,
      image_url: user.image_url
    });
    setImagePreview(user.image_url ? `http://localhost:5000/${user.image_url}` : null);
    setIsEditModalOpen(true);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(newUser).forEach(key => {
        formData.append(key, newUser[key]);
      });
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur lors de la création');
      }
      const createdUser = await response.json();
      setUsers(prev => [...prev, createdUser]);
      handleCloseModal();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(editForm).forEach(key => {
        if (editForm[key] !== null) {
          formData.append(key, editForm[key]);
        }
      });
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch(`http://localhost:5000/api/users/${selectedUser.id_utilisateur}`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        const updated = await response.json();
        setUsers(prev => prev.map(u => u.id_utilisateur === selectedUser.id_utilisateur ? updated.user : u));
        handleCloseModal();
        alert("Utilisateur mis à jour avec succès !");
      } else {
        const data = await response.json();
        setFormError(data.message || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      setFormError("Erreur serveur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id_utilisateur) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) return;
    try {
      await fetch(`http://localhost:5000/api/users/${id_utilisateur}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id_utilisateur !== id_utilisateur));
      if (selectedUser?.id_utilisateur === id_utilisateur) setSelectedUser(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleBlock = async (id_utilisateur, estBloqueActuellement) => {
    const action = estBloqueActuellement ? 'débloquer' : 'bloquer';
    if (!window.confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) return;
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id_utilisateur}/block`, { method: 'PUT' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Erreur lors de l'action`);
      }
      setUsers(prev => prev.map(u => u.id_utilisateur === id_utilisateur ? { ...u, est_bloque: !estBloqueActuellement } : u));
      if (selectedUser?.id_utilisateur === id_utilisateur) setSelectedUser(prev => ({ ...prev, est_bloque: !estBloqueActuellement }));
    } catch (err) { alert(err.message); }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (err) { 
      setError(err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.nom} ${user.prenom} ${user.email} ${user.num_tel} ${user.matricule} ${user.role}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || user.role.toUpperCase() === selectedRole;
    return matchesSearch && matchesRole;
  });

  const roleTabs = [
    { id: 'ALL', label: 'Tous', icon: <UsersIcon size={14} />, count: users.length },
    { id: 'ADMIN', label: 'Admins', icon: <ShieldCheck size={14} />, count: users.filter(u => u.role?.toUpperCase() === 'ADMIN').length },
    { id: 'RECEVEUR', label: 'Receveurs', icon: <User size={14} />, count: users.filter(u => u.role?.toUpperCase() === 'RECEVEUR').length },
    { id: 'AGENT', label: 'Agents', icon: <Store size={14} />, count: users.filter(u => u.role?.toUpperCase() === 'AGENT').length },
    { id: 'CONTROLEUR', label: 'Contrôleurs', icon: <Eye size={14} />, count: users.filter(u => u.role?.toUpperCase() === 'CONTROLEUR').length },
  ];

  return (
    <>
      <style>{`
        @keyframes slideInPanel { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .user-row-item { cursor:pointer; transition:background 0.15s; }
        .user-row-item:hover td { background:#F0F4FF !important; }
        .user-row-item.selected td { background:#EEF2FF !important; }
      `}</style>

      <div className="users-container">
        {/* PREMIUM HEADER */}
        <div className="users-header-card">
          <div className="header-titles">
            <h1>Gestion des Collaborateurs</h1>
            <p>Interface d'administration des accès et profils utilisateurs</p>
          </div>
          <div className="header-actions">
            <div className="search-wrapper">
              <Search className="search-icon" size={16} />
              <input type="text" placeholder="Rechercher par nom, email, matricule..." className="search-input"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button className="btn-add-user" onClick={handleOpenModal}>
              <UserPlus size={16} />
              <span>Ajouter</span>
            </button>
          </div>
        </div>

        {/* ROLE FILTER TABS */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {roleTabs.map(tab => {
            const active = selectedRole === tab.id;
            return (
              <button key={tab.id} onClick={() => setSelectedRole(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
                borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: active ? '1.5px solid #6366F1' : '1.5px solid #E2E8F0',
                background: active ? '#6366F1' : 'white',
                color: active ? 'white' : '#64748B',
                boxShadow: active ? '0 4px 12px rgba(99,102,241,0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.18s',
              }}>
                {tab.icon}
                {tab.label}
                <span style={{
                  background: active ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                  color: active ? 'white' : '#64748B',
                  fontSize: 11, fontWeight: 800,
                  padding: '1px 7px', borderRadius: 99,
                }}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* TABLE + SIDE PANEL */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="users-table-card">
              {loading ? (
                <div className="loading-state">
                  <Loader2 className="animate-spin" size={36} color="#6366F1" />
                  <p style={{ color: '#94A3B8', fontWeight: 600 }}>Synchronisation en cours...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="enterprise-table">
                    <thead>
                      <tr>
                        <th>Collaborateur</th>
                        <th>Contact</th>
                        <th>Matricule</th>
                        <th>Rôle</th>
                        <th>Statut</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {filteredUsers.length > 0 ? filteredUsers.map((user, idx) => {
                          const cfg = getRoleCfg(user.role);
                          const isSelected = selectedUser?.id_utilisateur === user.id_utilisateur;
                          return (
                            <motion.tr
                              key={user.id_utilisateur}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className={`user-row-item${isSelected ? ' selected' : ''}`}
                              onClick={() => setSelectedUser(isSelected ? null : user)}
                            >
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: user.image_url ? `url(http://localhost:5000/${user.image_url})` : `linear-gradient(135deg, ${cfg.dot}30, ${cfg.dot}15)`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    border: `1.5px solid ${cfg.dot}40`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 800, color: cfg.color, flexShrink: 0,
                                  }}>
                                    {!user.image_url && `${user.nom?.charAt(0)}${user.prenom?.charAt(0)}`}
                                  </div>
                                  <div>
                                    <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                                      {user.nom} {user.prenom}
                                    </p>
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                                      {user.email || 'Email non renseigné'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                                {user.num_tel || '—'}
                              </td>
                              <td>
                                <code style={{
                                  fontSize: 12, background: '#F1F5F9', color: '#475569',
                                  padding: '3px 8px', borderRadius: 6, fontFamily: 'monospace', fontWeight: 700,
                                  border: '1px solid #E2E8F0',
                                }}>
                                  {user.matricule || 'N/A'}
                                </code>
                              </td>
                              <td>
                                <RoleBadge role={user.role} />
                              </td>
                              <td>
                                {user.est_bloque ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FEF2F2', color: '#DC2626', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, border: '1px solid #FECACA' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />Bloqué
                                  </span>
                                ) : (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDF4', color: '#15803D', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, border: '1px solid #BBF7D0' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />Actif
                                  </span>
                                )}
                              </td>
                              <td onClick={e => e.stopPropagation()}>
                                <div className="row-actions" style={{ opacity: 1 }}>
                                  <button title="Modifier" className="action-btn btn-edit" onClick={() => handleEditClick(user)}>
                                    <Edit2 size={15} />
                                  </button>
                                  <button title={user.est_bloque ? 'Débloquer' : 'Restreindre'}
                                    className="action-btn btn-lock"
                                    onClick={() => handleToggleBlock(user.id_utilisateur, user.est_bloque)}>
                                    {user.est_bloque ? <Unlock size={15} color="#EF4444" /> : <Lock size={15} />}
                                  </button>
                                  <button title="Supprimer" className="action-btn btn-trash"
                                    onClick={() => handleDeleteUser(user.id_utilisateur)}>
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan="6" className="empty-state">
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '3rem 0' }}>
                                <div style={{ width: 60, height: 60, borderRadius: 18, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Search size={28} color="#CBD5E1" />
                                </div>
                                <p style={{ fontWeight: 700, color: '#64748B', margin: 0 }}>Aucun utilisateur trouvé</p>
                                <p style={{ fontSize: 13, color: '#CBD5E1', margin: 0 }}>Ajustez votre recherche ou filtre</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ─── DETAIL PANEL ─────────────────────────────── */}
          <AnimatePresence>
            {selectedUser && !isEditModalOpen && (
              <motion.div
                key={selectedUser.id_utilisateur}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                style={{
                  width: 300, flexShrink: 0,
                  background: 'white', borderRadius: 24,
                  boxShadow: '0 4px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)',
                  overflow: 'hidden', position: 'sticky', top: 24,
                }}
              >
                {/* Panel header */}
                <div style={{
                  background: `linear-gradient(135deg, ${getRoleCfg(selectedUser.role).dot}22, ${getRoleCfg(selectedUser.role).dot}08)`,
                  borderBottom: `1px solid ${getRoleCfg(selectedUser.role).dot}20`,
                  padding: '20px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 16,
                        background: selectedUser.image_url ? `url(http://localhost:5000/${selectedUser.image_url})` : `linear-gradient(135deg, ${getRoleCfg(selectedUser.role).dot}40, ${getRoleCfg(selectedUser.role).dot}20)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: `2px solid ${getRoleCfg(selectedUser.role).dot}50`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 900, color: getRoleCfg(selectedUser.role).color,
                      }}>
                        {!selectedUser.image_url && `${selectedUser.nom?.charAt(0)}${selectedUser.prenom?.charAt(0)}`}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: '#0F172A' }}>
                          {selectedUser.prenom} {selectedUser.nom}
                        </p>
                        <RoleBadge role={selectedUser.role} />
                      </div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} style={{
                      width: 28, height: 28, borderRadius: '50%', background: '#F1F5F9',
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <X size={14} color="#64748B" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <InfoRow icon={Mail} label="Email" value={selectedUser.email} color="#6366F1" />
                  <InfoRow icon={Phone} label="Téléphone" value={selectedUser.num_tel} color="#10B981" />
                  <InfoRow icon={Hash} label="Matricule" value={selectedUser.matricule} color="#F59E0B" />
                  <InfoRow icon={User} label="Identifiant système" value={`#${selectedUser.id_utilisateur}`} color="#94A3B8" />

                  {/* Statut actuel */}
                  <div style={{
                    padding: '14px 16px', borderRadius: 14,
                    background: selectedUser.est_bloque ? '#FEF2F2' : '#F0FDF4',
                    border: `1px solid ${selectedUser.est_bloque ? '#FECACA' : '#BBF7D0'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: selectedUser.est_bloque ? '#DC2626' : '#15803D' }}>
                      {selectedUser.est_bloque ? '🔒 Compte bloqué' : '✅ Compte actif'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                    <button
                      onClick={() => handleToggleBlock(selectedUser.id_utilisateur, selectedUser.est_bloque)}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', border: '1.5px solid #E2E8F0',
                        background: selectedUser.est_bloque ? '#FEF2F2' : '#FFFBEB',
                        color: selectedUser.est_bloque ? '#DC2626' : '#D97706',
                        transition: 'all 0.15s',
                      }}
                    >
                      {selectedUser.est_bloque ? '🔓 Débloquer' : '🔒 Bloquer'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(selectedUser.id_utilisateur)}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', border: '1.5px solid #FECACA',
                        background: '#FEF2F2', color: '#DC2626', transition: 'all 0.15s',
                      }}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ADD USER MODAL */}
        <AnimatePresence>
          {isAddModalOpen && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onPointerDown={handleCloseModal}>
              <motion.div className="modal-content" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }} onPointerDown={e => e.stopPropagation()}>
                <div className="modal-header" style={{
                  background: 'linear-gradient(135deg,#1E1B4B,#4338CA)',
                  borderBottom: 'none', padding: '20px 24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserPlus size={18} color="white" />
                    </div>
                    <h2 style={{ color: 'white', margin: 0, fontSize: 16, fontWeight: 900 }}>Nouveau collaborateur</h2>
                  </div>
                  <button type="button" className="btn-close" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }} onClick={handleCloseModal}>
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleAddUser}>
                  <div className="modal-body">
                    {formError && <div className="form-error">{formError}</div>}
                    {[
                      { label: 'Nom', name: 'nom', type: 'text' },
                      { label: 'Prénom', name: 'prenom', type: 'text' },
                      { label: 'Email', name: 'email', type: 'email' },
                      { label: 'Matricule', name: 'matricule', type: 'text' },
                      { label: 'Téléphone', name: 'num_tel', type: 'tel' },
                    ].map(f => (
                      <div className="form-group" key={f.name}>
                        <label>{f.label}</label>
                        <input type={f.type} name={f.name} required className="form-input"
                          value={newUser[f.name]} onChange={handleInputChange} />
                      </div>
                    ))}
                    <div className="form-group">
                      <label>Rôle</label>
                      <select name="role" className="form-select" value={newUser.role} onChange={handleInputChange}>
                        <option value="ADMIN">Administrateur</option>
                        <option value="AGENT">Agent de Guichet</option>
                        <option value="RECEVEUR">Receveur</option>
                        <option value="CONTROLEUR">Contrôleur</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Mot de passe</label>
                      <input type="password" name="mot_de_passe" required className="form-input"
                        value={newUser.mot_de_passe} onChange={handleInputChange} minLength="6" />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Photo de profil</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <div style={{
                          width: '60px', height: '60px', borderRadius: '50%', background: '#f1f5f9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden', border: '2px solid #e2e8f0'
                        }}>
                          {imagePreview ? (
                            <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <User size={30} color="#94a3b8" />
                          )}
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '0.875rem' }} />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={isSubmitting}>Annuler</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Créer le compte'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EDIT USER MODAL */}
        <AnimatePresence>
          {isEditModalOpen && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onPointerDown={handleCloseModal}>
              <motion.div className="modal-content" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }} onPointerDown={e => e.stopPropagation()}>
                <div className="modal-header" style={{
                  background: 'linear-gradient(135deg,#1E1B4B,#4338CA)',
                  borderBottom: 'none', padding: '20px 24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit2 size={18} color="white" />
                    </div>
                    <h2 style={{ color: 'white', margin: 0, fontSize: 16, fontWeight: 900 }}>Modifier Collaborateur</h2>
                  </div>
                  <button type="button" className="btn-close" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }} onClick={handleCloseModal}>
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleUpdateUser}>
                  <div className="modal-body">
                    {formError && <div className="form-error">{formError}</div>}
                    {[
                      { label: 'Nom', name: 'nom', type: 'text' },
                      { label: 'Prénom', name: 'prenom', type: 'text' },
                      { label: 'Email', name: 'email', type: 'email' },
                      { label: 'Matricule', name: 'matricule', type: 'text' },
                      { label: 'Téléphone', name: 'num_tel', type: 'tel' },
                    ].map(f => (
                      <div className="form-group" key={f.name}>
                        <label>{f.label}</label>
                        <input type={f.type} name={f.name} required className="form-input"
                          value={editForm[f.name]} onChange={handleEditInputChange} />
                      </div>
                    ))}
                    <div className="form-group">
                      <label>Rôle</label>
                      <select name="role" className="form-select" value={editForm.role} onChange={handleEditInputChange}>
                        <option value="ADMIN">Administrateur</option>
                        <option value="AGENT">Agent de Guichet</option>
                        <option value="RECEVEUR">Receveur</option>
                        <option value="CONTROLEUR">Contrôleur</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Photo de profil</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <div style={{
                          width: '60px', height: '60px', borderRadius: '50%', background: '#f1f5f9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden', border: '2px solid #e2e8f0'
                        }}>
                          {imagePreview ? (
                            <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <User size={30} color="#94a3b8" />
                          )}
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '0.875rem' }} />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={isSubmitting}>Annuler</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Users;

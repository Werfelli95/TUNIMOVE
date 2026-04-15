import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, UserPlus, Loader2, Search, Lock, Unlock, X, ShieldCheck, User, Users as UsersIcon, Store, Eye } from 'lucide-react';
import './Users.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [newUser, setNewUser] = useState({
        nom: '', prenom: '', email: '', matricule: '', num_tel: '', role: 'AGENT', mot_de_passe: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenModal = () => setIsAddModalOpen(true);
    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setFormError(null);
        setNewUser({ nom: '', prenom: '', email: '', matricule: '', num_tel: '', role: 'AGENT', mot_de_passe: '' });
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setFormError(null);
        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:5000/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
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

    const handleDeleteUser = async (id_utilisateur) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/users/${id_utilisateur}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Erreur lors de la suppression');
            }

            setUsers(prevUsers => prevUsers.filter(user => user.id_utilisateur !== id_utilisateur));

        } catch (err) {
            alert(err.message);
        }
    };

    const handleToggleBlock = async (id_utilisateur, estBloqueActuellement) => {
        const actionText = estBloqueActuellement ? "débloquer" : "bloquer";
        if (!window.confirm(`Êtes-vous sûr de vouloir ${actionText} cet utilisateur ?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/users/${id_utilisateur}/block`, {
                method: 'PUT',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Erreur lors du ${actionText} de l'utilisateur`);
            }

            const data = await response.json();

            // Mettre à jour la liste des utilisateurs pour refléter le nouveau statut
            setUsers(prevUsers => prevUsers.map(user =>
                user.id_utilisateur === id_utilisateur ? { ...user, est_bloque: !estBloqueActuellement } : user
            ));

            alert(data.message);

        } catch (err) {
            alert(err.message);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/users');
            if (!response.ok) throw new Error('Erreur de chargement');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const getRoleBadge = (role) => {
        const r = role.toLowerCase();
        const roleClass = r === 'admin' ? 'badge-admin' : r === 'agent' ? 'badge-agent' : 'badge-receveur';
        return (
            <span className={`role-badge ${roleClass}`}>
                {r}
            </span>
        );
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = `${user.nom} ${user.prenom} ${user.email} ${user.num_tel} ${user.matricule} ${user.role}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRole === 'ALL' || user.role.toUpperCase() === selectedRole.toUpperCase();
        return matchesSearch && matchesRole;
    });

    return (
        <>
            <div className="users-container">
                {/* Header Section */}
                <div className="users-header-card">
                    <div className="header-titles">
                        <h1>Gestion des Collaborateurs</h1>
                        <p>Interface d'administration des accès et profils utilisateurs</p>
                    </div>

                    <div className="header-actions">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, email..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                        </div>
                        <button className="btn-add-user" onClick={handleOpenModal}>
                            <UserPlus size={18} />
                            <span>Ajouter un compte</span>
                        </button>

                    </div>
                </div>

                {/* Filter Buttons Section */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    {[
                        { id: 'ALL', label: 'Tous', icon: <UsersIcon size={16} /> },
                        { id: 'ADMIN', label: 'Administrateurs', icon: <ShieldCheck size={16} /> },
                        { id: 'RECEVEUR', label: 'Receveurs', icon: <User size={16} /> },
                        { id: 'AGENT', label: 'Agents de guichet', icon: <Store size={16} /> },
                        { id: 'CONTROLEUR', label: 'Contrôleurs', icon: <Eye size={16} /> }
                    ].map((btn) => (
                        <button
                            key={btn.id}
                            onClick={() => setSelectedRole(btn.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: selectedRole === btn.id ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                                background: selectedRole === btn.id ? '#4f46e5' : '#ffffff',
                                color: selectedRole === btn.id ? '#ffffff' : '#64748b',
                                boxShadow: selectedRole === btn.id ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none'
                            }}
                            onMouseOver={(e) => {
                                if (selectedRole !== btn.id) e.currentTarget.style.background = '#f8fafc';
                            }}
                            onMouseOut={(e) => {
                                if (selectedRole !== btn.id) e.currentTarget.style.background = '#ffffff';
                            }}
                        >
                            {btn.icon}
                            {btn.label}
                        </button>
                    ))}
                </div>

                {/* Table Section */}
                <div className="users-table-card">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 className="animate-spin" size={40} />
                            <p>Synchronisation en cours...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="enterprise-table">
                                <thead>
                                    <tr>
                                        <th>nom</th>
                                        <th>Prénom</th>
                                        <th>Email</th>
                                        <th>Matricule</th>
                                        <th>Téléphone</th>
                                        <th>Rôle système</th>
                                        <th style={{ textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="popLayout">
                                        {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                            <motion.tr
                                                key={user.id_utilisateur}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <td>
                                                    <div className="user-info-cell">
                                                        <div className="user-avatar">
                                                            {user.nom.charAt(0)}{user.prenom.charAt(0)}
                                                        </div>
                                                        <span className="user-name">{user.nom}</span>
                                                    </div>
                                                </td>
                                                <td className="user-name" style={{ color: '#64748b', fontWeight: 500 }}>
                                                    {user.prenom}
                                                    {user.est_bloque && (
                                                        <span style={{ marginLeft: '8px', color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                            (Bloqué)
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="user-email">{user.email || '—'}</span>
                                                </td>
                                                <td>
                                                    <span className="user-matricule">
                                                        {user.matricule || 'N/A'}
                                                    </span>
                                                </td>
                                                <td> {user.num_tel}</td>
                                                <td>
                                                    {getRoleBadge(user.role)}
                                                </td>
                                                <td>
                                                    <div className="row-actions">
                                                        <button
                                                            title={user.est_bloque ? "Débloquer" : "Restreindre"}
                                                            className={`action-btn btn-lock ${user.est_bloque ? 'is-blocked' : ''}`}
                                                            onClick={() => handleToggleBlock(user.id_utilisateur, user.est_bloque)}
                                                        >
                                                            {user.est_bloque ? <Unlock size={16} color="#ef4444" /> : <Lock size={16} />}
                                                        </button>

                                                        <button title="Supprimer" className="action-btn btn-trash" onClick={() => handleDeleteUser(user.id_utilisateur)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className="empty-state">
                                                    <div className="flex flex-col items-center opacity-40">
                                                        <Search size={40} className="mb-3" />
                                                        <p className="font-semibold">Aucun utilisateur correspondant</p>
                                                        <p className="text-sm">Veuillez ajuster vos critères de recherche.</p>
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

                <AnimatePresence>
                    {isAddModalOpen && (
                        <motion.div
                            className="modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onPointerDown={handleCloseModal}
                            key="modal-overlay"
                        >
                            <motion.div
                                className="modal-content"
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                onPointerDown={e => e.stopPropagation()}
                                onClick={e => e.stopPropagation()}
                                key="modal-content"
                            >
                                <div className="modal-header">
                                    <h2>Ajouter un nouvel utilisateur</h2>
                                    <button type="button" className="btn-close" onClick={handleCloseModal}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleAddUser}>
                                    <div className="modal-body">
                                        {formError && <div className="form-error">{formError}</div>}
                                        <div className="form-group">
                                            <label>Nom</label>
                                            <input type="text" name="nom" required className="form-input" value={newUser.nom} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Prénom</label>
                                            <input type="text" name="prenom" required className="form-input" value={newUser.prenom} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input type="email" name="email" required className="form-input" value={newUser.email} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Matricule</label>
                                            <input type="text" name="matricule" required className="form-input" value={newUser.matricule} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Téléphone</label>
                                            <input type="tel" name="num_tel" required className="form-input" value={newUser.num_tel} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Rôle</label>
                                            <select name="role" className="form-select" value={newUser.role} onChange={handleInputChange}>
                                                <option value="ADMIN">Admin</option>
                                                <option value="AGENT">Agent</option>
                                                <option value="RECEVEUR">Receveur</option>
                                                <option value="Controleur">Controleur</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Mot de passe</label>
                                            <input type="password" name="mot_de_passe" required className="form-input" value={newUser.mot_de_passe} onChange={handleInputChange} minLength="6" />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={isSubmitting}>Annuler</button>
                                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Créer le compte'}
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

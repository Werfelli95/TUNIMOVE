import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Hash, Mail, Phone, Shield, UserCircle, Edit2, Check, RotateCcw } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, userId, canEditNames = true }) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        num_tel: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen, userId]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const id = userId || localStorage.getItem('userId') || JSON.parse(localStorage.getItem('user'))?.id || 1;
            const res = await fetch(`http://localhost:5000/api/users/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProfileData(data);
                setFormData({
                    nom: data.nom,
                    prenom: data.prenom,
                    email: data.email,
                    num_tel: data.num_tel || ''
                });
            }
        } catch (error) {
            console.error("Erreur chargement profil:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const id = profileData.id_utilisateur;
            const response = await fetch(`http://localhost:5000/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updated = await response.json();
                setProfileData(updated.user);
                
                // Mettre à jour localStorage aussi pour rester synchro
                const currentLocal = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ 
                    ...currentLocal, 
                    nom: updated.user.nom, 
                    prenom: updated.user.prenom 
                }));
                
                setIsEditing(false);
                alert("Profil mis à jour !");
            } else {
                alert("Erreur lors de la mise à jour");
            }
        } catch (error) {
            console.error("Erreur save:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="profile-overlay" onClick={onClose}>
                    <motion.div
                        className="profile-modal"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="profile-header">
                            <div className="profile-header-content">
                                <div className="profile-avatar-large">
                                    {profileData ? (profileData.nom[0] + profileData.prenom[0]) : <UserCircle size={40} />}
                                </div>
                                <h2>{isEditing ? 'Modifier Profil' : 'Mon Profil'}</h2>
                                <p>Informations personnelles et de contact</p>
                            </div>
                            <div className="profile-header-actions">
                                {!isEditing && (
                                    <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                                        <Edit2 size={16} />
                                    </button>
                                )}
                                <button className="close-profile" onClick={onClose}><X size={20} /></button>
                            </div>
                        </div>

                        <div className="profile-body">
                            {loading ? (
                                <div className="profile-loader">
                                    <Loader2 className="animate-spin" size={30} />
                                    <p>Chargement des informations...</p>
                                </div>
                            ) : profileData && (
                                <form onSubmit={handleSave} className="profile-info-grid">
                                    <div className="info-item">
                                        <div className="info-icon"><Hash size={18} /></div>
                                        <div className="info-content">
                                            <label>Matricule</label>
                                            <p className="read-only">{profileData.matricule}</p>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-icon"><UserCircle size={18} /></div>
                                        <div className="info-content">
                                            <label>Prénom & Nom</label>
                                            {isEditing && canEditNames ? (
                                                <div className="edit-name-inputs">
                                                    <input required className="profile-input" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} />
                                                    <input required className="profile-input" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
                                                </div>
                                            ) : <p className={!canEditNames && isEditing ? "read-only" : ""}>{profileData.prenom} {profileData.nom}</p>}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-icon"><Mail size={18} /></div>
                                        <div className="info-content">
                                            <label>Email professionnel</label>
                                            {isEditing ? (
                                                <input type="email" required className="profile-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                            ) : <p>{profileData.email}</p>}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-icon"><Phone size={18} /></div>
                                        <div className="info-content">
                                            <label>Téléphone</label>
                                            {isEditing ? (
                                                <input className="profile-input" value={formData.num_tel} onChange={(e) => setFormData({ ...formData, num_tel: e.target.value })} />
                                            ) : <p>{profileData.num_tel || "Non renseigné"}</p>}
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-icon"><Shield size={18} /></div>
                                        <div className="info-content">
                                            <label>Rôle Système</label>
                                            <span className="role-tag">{profileData.role}</span>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="profile-edit-footer">
                                            <button type="button" className="btn-cancel-profile" onClick={() => setIsEditing(false)}>
                                                <RotateCcw size={16} /> Annuler
                                            </button>
                                            <button type="submit" className="btn-save-profile" disabled={isSaving}>
                                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                                                <span>Enregistrer</span>
                                            </button>
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProfileModal;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Hash, Mail, Phone, Shield, UserCircle } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, userId }) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen, userId]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            // Utilise l'ID passé en prop, sinon récupère l'ID du localStorage
            const id = userId || localStorage.getItem('userId') || JSON.parse(localStorage.getItem('user'))?.id || 1;

            const res = await fetch(`http://localhost:5000/api/users/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProfileData(data);
            }
        } catch (error) {
            console.error("Erreur chargement profil:", error);
        } finally {
            setLoading(false);
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
                                    {profileData ? (
                                        profileData.nom[0] + profileData.prenom[0]
                                    ) : (
                                        <UserCircle size={40} />
                                    )}
                                </div>
                                <h2>Profil Administrateur</h2>
                                <p>Gestionnaire de la plateforme TuniMove</p>
                            </div>
                            <button className="close-profile" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="profile-body">
                            {loading ? (
                                <div className="profile-loader">
                                    <Loader2 className="animate-spin" size={30} />
                                    <p>Chargement des informations...</p>
                                </div>
                            ) : profileData && (
                                <div className="profile-info-grid">
                                    <div className="info-item">
                                        <div className="info-icon"><Hash size={18} /></div>
                                        <div className="info-content">
                                            <label>Matricule</label>
                                            <p>{profileData.matricule}</p>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-icon"><UserCircle size={18} /></div>
                                        <div className="info-content">
                                            <label>Nom complet</label>
                                            <p>{profileData.prenom} {profileData.nom}</p>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-icon"><Mail size={18} /></div>
                                        <div className="info-content">
                                            <label>Email professionnel</label>
                                            <p>{profileData.email}</p>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-icon"><Phone size={18} /></div>
                                        <div className="info-content">
                                            <label>Téléphone</label>
                                            <p>{profileData.num_tel || "Non renseigné"}</p>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-icon"><Shield size={18} /></div>
                                        <div className="info-content">
                                            <label>Rôle Système</label>
                                            <span className="role-tag">{profileData.role}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProfileModal;

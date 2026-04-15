import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, UserCircle } from 'lucide-react';
import ProfileModal from './ProfileModal';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();

    // État pour le profil
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // LOGIQUE DES PAGES
    const isLoginPage = location.pathname === '/admin-secure-portal';
    const isInAdminDash = location.pathname.startsWith('/admin') && !isLoginPage;

    const handleOpenProfile = () => {
        setIsProfileOpen(true);
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-left">
                    <Link to="/" className="navbar-brand-wrapper">
                        <span className="navbar-brand">TuniMove</span>
                    </Link>
                </div>

                <div className="navbar-right">
                    {/* CAS 1 : Page de Login Admin -> On affiche "Espace Agent" */}
                    {isLoginPage ? (
                        <Link to="/login" className="admin-link">
                            <UserCircle size={18} />
                            <span>Espace Agent</span>
                        </Link>
                    )
                        /* CAS 2 : Dans le Dashboard Admin -> On affiche "Mon Profil" */
                        : isInAdminDash ? (
                            <div className="admin-profile-trigger" onClick={handleOpenProfile}>
                                <div className="admin-avatar">
                                    <UserCircle size={22} />
                                </div>
                                <span>Mon Profil</span>
                            </div>
                        )
                            /* CAS 3 : Partout ailleurs -> On affiche "Administration" */
                            : (
                                <Link to="/admin-secure-portal" className="admin-link">
                                    <ShieldCheck size={18} />
                                    <span>Administration</span>
                                </Link>
                            )}
                </div>
            </nav>

            {/* MODAL DE PROFIL REUTILISABLE */}
            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
        </>
    );
};

export default Navbar;

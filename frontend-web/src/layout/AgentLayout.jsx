import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Ticket, UserCircle, Calendar, History } from 'lucide-react';
import ProfileModal from '../components/ProfileModal';

const AgentLayout = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('Vente Directe'); // Vente Directe, Réservations, Historique
    const [agentInfo, setAgentInfo] = useState({ nom: 'Agent', prenom: '', matricule: '' });
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed.nom) {
                    setAgentInfo({
                        nom: parsed.nom,
                        prenom: parsed.prenom || '',
                        matricule: parsed.matricule || 'Inconnu'
                    });
                }
            } catch(e) {}
        }
    }, []);

    const handleLogout = () => {
        navigate('/login');
    };

    const getBtnStyle = (isActive) => ({
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 20px',
        borderRadius: '12px',
        color: 'white',
        textDecoration: 'none',
        backgroundColor: isActive ? '#4318FF' : 'transparent',
        fontWeight: isActive ? '600' : '500',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isActive ? 1 : 0.8,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '15px'
    });

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f7fe', fontFamily: "'Inter', sans-serif" }}>
            {/* Sidebar */}
            <aside style={{ 
                width: '280px', 
                backgroundColor: '#1B2559', 
                color: 'white', 
                display: 'flex', 
                flexDirection: 'column',
                boxShadow: '4px 0 24px rgba(112, 144, 176, 0.15)',
                zIndex: 10,
                position: 'relative'
            }}>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <img src="/images/tunimovebus3.png" alt="TuniMove Logo" style={{ height: '80px', width: 'auto' }} />
                    <span style={{ 
                        fontSize: '13px', 
                        opacity: 0.8, 
                        fontWeight: '600',
                        letterSpacing: '1px',
                        display: 'block',
                        marginTop: '8px',
                        color: 'white'
                    }}>ESPACE GUICHET</span>
                </div>

                <div 
                    onClick={() => setIsProfileModalOpen(true)}
                    style={{ 
                        padding: '24px', 
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <UserCircle size={24} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Connecté en tant que</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'capitalize', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {agentInfo.prenom} {agentInfo.nom}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.6 }}>Matricule: {agentInfo.matricule}</div>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '24px 16px' }}>
                    <ul style={{ padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li style={{ listStyle: 'none' }}>
                            <button onClick={() => setMode('Vente Directe')} style={getBtnStyle(mode === 'Vente Directe')}>
                                <Ticket size={20} /> Vente Directe
                            </button>
                        </li>
                        <li style={{ listStyle: 'none' }}>
                            <button onClick={() => setMode('Réservations')} style={getBtnStyle(mode === 'Réservations')}>
                                <Calendar size={20} /> Réservations
                            </button>
                        </li>
                        <li style={{ listStyle: 'none' }}>
                            <button onClick={() => setMode('Historique')} style={getBtnStyle(mode === 'Historique')}>
                                <History size={20} /> Historique
                            </button>
                        </li>
                    </ul>
                </nav>

                <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button 
                        onClick={handleLogout} 
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '14px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                    >
                        <LogOut size={18} />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <Outlet context={{ mode, setMode }} />
            </main>

            {/* Modal Profil */}
            <ProfileModal 
                isOpen={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)}
                canEditNames={false}
            />
        </div>
    );
};

export default AgentLayout;

import React, { useState } from 'react';
import axios from 'axios';
import { User, Lock, Ticket, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AgentLogin = () => {
    const [matricule, setMatricule] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Forgot password states
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetMatricule, setResetMatricule] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState({ type: '', text: '' });
    const [isSubmittingReset, setIsSubmittingReset] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        // Exact 5 digits validation
        if (!/^\d{5}$/.test(matricule)) {
            setError('Le matricule doit contenir exactement 5 chiffres.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login/agent', { matricule, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', 'agent');
            localStorage.setItem('user', JSON.stringify({
                id: res.data.user.id,
                nom: res.data.user.nom,
                prenom: res.data.user.prenom,
                matricule: matricule
            }));
            window.location.href = '/agent-dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Identifiants invalides');
            setIsSubmitting(false);
        }
    };

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setIsSubmittingReset(true);
        setResetMessage({ type: '', text: '' });
        try {
            const res = await axios.post('http://localhost:5000/api/password-reset/request', {
                matricule: resetMatricule,
                email: resetEmail
            });
            setResetMessage({ type: 'success', text: res.data.message });
            setTimeout(() => {
                setShowResetModal(false);
                setResetMatricule('');
                setResetEmail('');
                setResetMessage({ type: '', text: '' });
            }, 3000);
        } catch (err) {
            setResetMessage({
                type: 'error',
                text: err.response?.data?.message || "Erreur lors de l'envoi de la demande."
            });
        } finally {
            setIsSubmittingReset(false);
        }
    };

    const handleMatriculeChange = (e) => {
        // Allow only numbers
        const val = e.target.value.replace(/\D/g, '');
        if (val.length <= 5) {
            setMatricule(val);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Inter", sans-serif', overflow: 'hidden' }}>
            <style>{`
                .auth-input:focus { border-color: #163A59 !important; outline: none; box-shadow: 0 0 0 4px rgba(22,58,89,0.1); }
                .auth-btn:hover:not(:disabled) { background-color: #1F4B6E; }
                .auth-btn:disabled { opacity: 0.7; cursor: not-allowed; }
            `}</style>

            {/* LÈFT PANEL - IMAGE & BRANDING */}
            <div style={{ flex: 1, position: 'relative', background: '#163A59', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10%', color: 'white' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/images/login_bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(22,58,89,0.95), rgba(22,58,89,0.7))' }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
                    <a href="/login" style={{ display: 'inline-block', background: 'white', padding: '16px 28px', borderRadius: '20px', marginBottom: '48px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <img src="/images/tunimovebus.png" alt="TuniMove Logo" style={{ height: '80px', width: 'auto', display: 'block' }} />
                    </a>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '24px', letterSpacing: '-0.02em' }}
                    >
                        Plateforme intelligente de gestion du transport public
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={{ fontSize: '1.1rem', color: '#94A3B8', fontWeight: 500, lineHeight: 1.6 }}
                    >
                        Réseau, affectations, billetterie et supervision en temps réel.
                    </motion.p>
                </div>
            </div>

            {/* RIGHT PANEL - LOGIN CARD */}
            <div style={{ flex: 1, background: '#F4F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                    style={{ width: '100%', maxWidth: '440px', background: 'white', borderRadius: '20px', padding: '48px', boxShadow: '0 10px 40px rgba(22,58,89,0.08)' }}
                >


                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#163A59', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Espace Agent de Guichet</h2>
                    <p style={{ margin: '0 0 32px', color: '#64748B', fontSize: '0.95rem', lineHeight: 1.5 }}>Accès à la vente directe, aux réservations et à l’historique des tickets.</p>

                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '24px' }}>
                                    {error}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Matricule Agent (5 chiffres)</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    className="auth-input"
                                    placeholder="Ex: 84729"
                                    value={matricule}
                                    onChange={handleMatriculeChange}
                                    required
                                    pattern="\d{5}"
                                    maxLength="5"
                                    style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.95rem', color: '#0F172A', transition: 'all 0.2s', boxSizing: 'border-box', letterSpacing: '0.1em', fontWeight: 600 }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Mot de passe</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '14px 44px 14px 44px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.95rem', color: '#0F172A', transition: 'all 0.2s', boxSizing: 'border-box' }}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>

                            <button
                                type="button"
                                onClick={() => setShowResetModal(true)}
                                style={{ background: 'none', border: 'none', color: '#163A59', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700, padding: 0 }}
                            >
                                Mot de passe oublié ?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="auth-btn"
                            style={{
                                width: '100%', padding: '16px', background: '#163A59', color: 'white', border: 'none', borderRadius: '12px',
                                fontSize: '1rem', fontWeight: 700, marginTop: '8px', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Connexion au système'}
                        </button>
                    </form>
                </motion.div>

                <p style={{ position: 'absolute', bottom: '24px', right: '40px', margin: 0, fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500 }}>
                    © 2026 TuniMove — Tous droits réservés
                </p>
            </div>

            {/* Modal de réinitialisation */}
            <AnimatePresence>
                {showResetModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                        >
                            <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Réinitialisation</h2>
                            <p style={{ margin: '0 0 24px', fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5 }}>
                                Une demande sera envoyée à l'administrateur qui vous enverra un nouveau mot de passe par e-mail.
                            </p>

                            {resetMessage.text && (
                                <div style={{
                                    background: resetMessage.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                                    color: resetMessage.type === 'success' ? '#15803D' : '#DC2626',
                                    padding: '12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '20px',
                                    border: `1px solid ${resetMessage.type === 'success' ? '#BBF7D0' : '#FECACA'}`
                                }}>
                                    {resetMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Matricule Agent</label>
                                    <input
                                        type="text"
                                        className="auth-input"
                                        placeholder="Ex: 84729"
                                        value={resetMatricule}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 5) setResetMatricule(val);
                                        }}
                                        required
                                        maxLength="5"
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Adresse Email</label>
                                    <input
                                        type="email"
                                        className="auth-input"
                                        placeholder="exemple@tunimove.tn"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowResetModal(false)}
                                        style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingReset}
                                        className="auth-btn"
                                        style={{ flex: 1, padding: '12px', background: '#163A59', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, display: 'flex', justifyContent: 'center' }}
                                    >
                                        {isSubmittingReset ? <Loader2 size={18} className="animate-spin" /> : 'Envoyer'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AgentLogin;

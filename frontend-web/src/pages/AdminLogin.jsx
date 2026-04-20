import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, ShieldCheck, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login/admin', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', 'admin');
            localStorage.setItem('user', JSON.stringify({
                id: res.data.user.id,
                nom: res.data.user.nom,
                prenom: res.data.user.prenom
            }));
            window.location.href = '/admin-dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Identifiants invalides');
            setIsSubmitting(false);
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
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(22,58,89,0.08)', borderRadius: '99px', color: '#163A59', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px' }}>
                        <ShieldCheck size={16} color="#163A59" /> Espace Sécurisé
                    </div>

                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#163A59', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Espace Administrateur</h2>
                    <p style={{ margin: '0 0 32px', color: '#64748B', fontSize: '0.95rem', lineHeight: 1.5 }}>Accès sécurisé à la gestion du réseau, des affectations et de la tarification.</p>

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
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Email Professionnel</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="email"
                                    className="auth-input"
                                    placeholder="admin@tunimove.tn"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.95rem', color: '#0F172A', transition: 'all 0.2s', boxSizing: 'border-box' }}
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <input type="checkbox" id="remember" style={{ width: '16px', height: '16px', accentColor: '#163A59', cursor: 'pointer' }} />
                            <label htmlFor="remember" style={{ fontSize: '0.85rem', color: '#64748B', cursor: 'pointer', userSelect: 'none' }}>Se souvenir de moi</label>
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
                            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Accès Administrateur'}
                        </button>
                    </form>

                    <div style={{ marginTop: '32px', textAlign: 'center' }}>
                        <a href="/login" style={{ fontSize: '0.85rem', color: '#64748B', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <ArrowLeft size={14} /> Retour à l'espace agent
                        </a>
                    </div>
                </motion.div>

                <p style={{ position: 'absolute', bottom: '24px', right: '40px', margin: 0, fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500 }}>
                    © 2026 TuniMove — Tous droits réservés
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;

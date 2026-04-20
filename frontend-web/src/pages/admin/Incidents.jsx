import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Bus, MapPin, User, Clock, CheckCircle,
  Loader2, RefreshCw, Search, Filter, ArrowUpDown,
  AlertCircle, ShieldCheck, Zap, FileText, X, ChevronRight,
  TrendingUp, Activity
} from 'lucide-react';

const BASE = 'http://localhost:5000/api/incidents';

/* ─── Status config ────────────────────────────────────────────────── */
const STATUS = {
  'En attente': {
    label: 'En attente',
    bg: 'rgba(251,191,36,0.12)', color: '#92400E',
    dot: '#F59E0B', ring: 'rgba(251,191,36,0.4)',
    btnBg: '#FEF3C7', btnHover: '#FDE68A',
  },
  'En cours de traitement': {
    label: 'En traitement',
    bg: 'rgba(59,130,246,0.09)', color: '#1E40AF',
    dot: '#3B82F6', ring: 'rgba(59,130,246,0.3)',
    btnBg: '#DBEAFE', btnHover: '#BFDBFE',
  },
  'Résolu': {
    label: 'Résolu',
    bg: 'rgba(16,185,129,0.10)', color: '#065F46',
    dot: '#10B981', ring: 'rgba(16,185,129,0.3)',
    btnBg: '#D1FAE5', btnHover: '#A7F3D0',
  },
};
const STATUS_ORDER = ['En attente', 'En cours de traitement', 'Résolu'];

/* ─── Helpers ───────────────────────────────────────────────────────── */
const typeConfig = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('panne') || t.includes('mécan')) return { icon: Zap, color: '#F97316', bg: '#FFF7ED' };
  if (t.includes('accident')) return { icon: AlertCircle, color: '#EF4444', bg: '#FEF2F2' };
  return { icon: AlertTriangle, color: '#EAB308', bg: '#FEFCE8' };
};

const fmtDate = (d) =>
  new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

const fmtDateLong = (d) =>
  new Date(d).toLocaleString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

/* ─── StatusBadge ───────────────────────────────────────────────────── */
const StatusBadge = ({ statut, size = 'md' }) => {
  const cfg = STATUS[statut] || STATUS['En attente'];
  const px = size === 'sm' ? '8px 12px' : '6px 14px';
  const fs = size === 'sm' ? '11px' : '12px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: cfg.bg, color: cfg.color,
      padding: px, borderRadius: '99px',
      fontSize: fs, fontWeight: 700,
      border: `1.5px solid ${cfg.ring}`,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: cfg.dot,
        boxShadow: `0 0 0 2px ${cfg.ring}`,
        display: 'inline-block',
        animation: statut === 'En attente' ? 'pulse 2s infinite' : 'none',
      }} />
      {cfg.label}
    </span>
  );
};

/* ─── KPI Card ──────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, icon: Icon, iconColor, iconBg, accent, onClick, active }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? accent : 'white',
      border: active ? `2px solid ${iconColor}40` : '2px solid transparent',
      borderRadius: '20px',
      padding: '22px 20px',
      display: 'flex', alignItems: 'center', gap: '16px',
      cursor: 'pointer', width: '100%', textAlign: 'left',
      boxShadow: active
        ? `0 4px 24px ${iconColor}22`
        : '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'all 0.2s ease',
    }}
  >
    <div style={{
      width: 52, height: 52, borderRadius: '14px',
      background: iconBg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={24} color={iconColor} />
    </div>
    <div>
      <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
        {label}
      </p>
      <h3 style={{ fontSize: 28, fontWeight: 900, color: active ? iconColor : '#1E293B', margin: '2px 0 0', lineHeight: 1 }}>
        {value}
      </h3>
    </div>
  </button>
);

/* ══════════ MAIN ══════════════════════════════════════════════════════ */
const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortDir, setSortDir] = useState('desc');
  const [updating, setUpdating] = useState(null);
  const [selected, setSelected] = useState(null);

  /* fetch */
  const fetchIncidents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await fetch(BASE);
      const data = await res.json();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  /* status update */
  const updateStatus = async (id, statut) => {
    setUpdating(id);
    try {
      const res = await fetch(`${BASE}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      });
      if (res.ok) {
        setIncidents(p => p.map(i => i.id_incident === id ? { ...i, statut } : i));
        if (selected?.id_incident === id) setSelected(p => ({ ...p, statut }));
      }
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  };

  /* filter + sort */
  const filtered = incidents
    .filter(inc => {
      if (filterStatus !== 'all' && inc.statut !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return ['type_incident', 'description', 'numero_bus', 'ligne', 'rapporte_par']
          .some(k => (inc[k] || '').toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => {
      const d = new Date(a.date_incident) - new Date(b.date_incident);
      return sortDir === 'desc' ? -d : d;
    });

  /* stats */
  const total    = incidents.length;
  const pending  = incidents.filter(i => i.statut === 'En attente').length;
  const inProg   = incidents.filter(i => i.statut === 'En cours de traitement').length;
  const resolved = incidents.filter(i => i.statut === 'Résolu').length;
  const last24h  = incidents.filter(i => Date.now() - new Date(i.date_incident) < 86400000).length;

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="#EF4444" className="animate-spin" />
      </div>
      <p style={{ color: '#94A3B8', fontWeight: 600, fontSize: 14 }}>Chargement des incidents...</p>
    </div>
  );

  /* ── Page ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .inc-row:hover { background: #F8FAFF !important; }
        .inc-row.selected { background: #EEF2FF !important; }
        .filter-pill:hover { opacity: 0.85; }
        .refresh-btn:hover { background: #F1F5F9 !important; }
        .sort-btn:hover { background: #EEF2FF !important; color: #6366F1 !important; }
        .update-btn:hover { filter: brightness(0.93); }
      `}</style>

      {/* ═══ HEADER ════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
        borderRadius: '24px',
        padding: '32px 36px',
        marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 8px 32px rgba(67,56,202,0.35)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, left: 200,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '16px',
            background: 'rgba(239,68,68,0.25)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid rgba(239,68,68,0.4)',
          }}>
            <AlertTriangle size={26} color="#FCA5A5" />
          </div>
          <div>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0 }}>
              Gestion des Incidents
            </h2>
            <p style={{ color: 'rgba(196,181,253,0.8)', fontSize: 13, margin: '4px 0 0', fontWeight: 500 }}>
              {total} incident{total !== 1 ? 's' : ''} au total · {last24h} dans les dernières 24h
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchIncidents(true)}
          disabled={refreshing}
          className="refresh-btn"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            color: 'white', padding: '10px 20px', borderRadius: '12px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </div>

      {/* ═══ KPI CARDS ═════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <KpiCard
          label="Dernières 24h" value={last24h}
          icon={Activity} iconColor="#EF4444" iconBg="#FEF2F2"
          accent="rgba(239,68,68,0.06)"
          onClick={() => setFilterStatus('all')}
          active={false}
        />
        <KpiCard
          label="En attente" value={pending}
          icon={Clock} iconColor="#F59E0B" iconBg="#FFFBEB"
          accent="rgba(245,158,11,0.07)"
          onClick={() => setFilterStatus('En attente')}
          active={filterStatus === 'En attente'}
        />
        <KpiCard
          label="En traitement" value={inProg}
          icon={Loader2} iconColor="#3B82F6" iconBg="#EFF6FF"
          accent="rgba(59,130,246,0.07)"
          onClick={() => setFilterStatus('En cours de traitement')}
          active={filterStatus === 'En cours de traitement'}
        />
        <KpiCard
          label="Résolus" value={resolved}
          icon={CheckCircle} iconColor="#10B981" iconBg="#ECFDF5"
          accent="rgba(16,185,129,0.07)"
          onClick={() => setFilterStatus('Résolu')}
          active={filterStatus === 'Résolu'}
        />
      </div>

      {/* ═══ CONTENT AREA ══════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── TABLE CARD ────────────────────────────────────────────── */}
        <div style={{
          flex: 1, minWidth: 0,
          background: 'white', borderRadius: '24px',
          boxShadow: '0 1px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          animation: 'fadeUp 0.4s ease',
        }}>

          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '18px 20px',
            borderBottom: '1px solid #F1F5F9',
            background: '#FAFBFF',
          }}>
            {/* Search */}
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Rechercher type, bus, ligne, signaleur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', paddingLeft: 36, paddingRight: 16,
                  paddingTop: 9, paddingBottom: 9,
                  fontSize: 13, border: '1.5px solid #E2E8F0',
                  borderRadius: '12px', background: 'white',
                  outline: 'none', color: '#334155', fontWeight: 500,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ key: 'all', label: 'Tous', color: '#6366F1', bg: '#EEF2FF' }, ...STATUS_ORDER.map(s => ({
                key: s, label: STATUS[s].label, color: STATUS[s].color, bg: STATUS[s].bg
              }))].map(({ key, label, color, bg }) => {
                const active = filterStatus === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilterStatus(key)}
                    className="filter-pill"
                    style={{
                      padding: '6px 14px', borderRadius: '99px', fontSize: 12,
                      fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                      background: active ? color : '#F1F5F9',
                      color: active ? 'white' : '#64748B',
                      border: 'none',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <button
              onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
              className="sort-btn"
              title={`Trier ${sortDir === 'desc' ? 'croissant' : 'décroissant'}`}
              style={{
                padding: '8px 12px', borderRadius: '12px',
                border: '1.5px solid #E2E8F0', background: 'white',
                color: '#64748B', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12,
              }}
            >
              <ArrowUpDown size={14} />
              {sortDir === 'desc' ? 'Récents' : 'Anciens'}
            </button>
          </div>

          {/* Result count */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid #F8FAFC', background: '#FAFBFF' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
              {search && <> pour "<span style={{ color: '#6366F1' }}>{search}</span>"</>}
            </p>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div style={{ padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: '20px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={36} color="#CBD5E1" />
              </div>
              <p style={{ color: '#64748B', fontWeight: 700, fontSize: 15, margin: 0 }}>Aucun incident trouvé</p>
              <p style={{ color: '#CBD5E1', fontSize: 13, margin: 0, textAlign: 'center' }}>
                {search ? 'Essayez un autre terme de recherche' : 'Tout est calme sur le terrain 👍'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAFBFF' }}>
                    {['Date & Heure', 'Type d\'incident', 'Bus / Ligne', 'Signalé par', 'Statut', 'Action'].map(h => (
                      <th key={h} style={{
                        padding: '12px 20px', textAlign: 'left',
                        fontSize: 11, fontWeight: 800, color: '#94A3B8',
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                        borderBottom: '1px solid #F1F5F9',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inc, idx) => {
                    const tc = typeConfig(inc.type_incident);
                    const TypeIcon = tc.icon;
                    const isSelected = selected?.id_incident === inc.id_incident;
                    return (
                      <tr
                        key={inc.id_incident}
                        onClick={() => setSelected(isSelected ? null : inc)}
                        className={`inc-row${isSelected ? ' selected' : ''}`}
                        style={{
                          cursor: 'pointer', transition: 'background 0.15s',
                          background: isSelected ? '#EEF2FF' : 'white',
                          borderBottom: '1px solid #F8FAFC',
                          animation: `fadeUp 0.3s ease ${idx * 0.04}s both`,
                        }}
                      >
                        {/* Date */}
                        <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                            {new Date(inc.date_incident).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                            {new Date(inc.date_incident).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Type */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '10px',
                              background: tc.bg, display: 'flex',
                              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <TypeIcon size={16} color={tc.color} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', maxWidth: 160 }}>
                              {inc.type_incident || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Bus / Ligne */}
                        <td style={{ padding: '16px 20px' }}>
                          {inc.numero_bus ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: '#4F46E5' }}>
                                <Bus size={12} />Bus N° {inc.numero_bus}
                              </span>
                              {inc.ligne && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                                  <MapPin size={11} />{inc.ligne}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#CBD5E1', fontSize: 13 }}>—</span>
                          )}
                        </td>

                        {/* Signalé par */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: '#F1F5F9', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <User size={13} color="#64748B" />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                              {inc.rapporte_par || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Statut */}
                        <td style={{ padding: '16px 20px' }}>
                          <StatusBadge statut={inc.statut} />
                        </td>

                        {/* Action */}
                        <td style={{ padding: '16px 20px' }} onClick={e => e.stopPropagation()}>
                          {updating === inc.id_incident ? (
                            <Loader2 size={16} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <select
                              value={inc.statut || 'En attente'}
                              onChange={e => updateStatus(inc.id_incident, e.target.value)}
                              style={{
                                fontSize: 12, fontWeight: 700, padding: '6px 10px',
                                border: '1.5px solid #E2E8F0', borderRadius: '10px',
                                background: 'white', color: '#475569',
                                cursor: 'pointer', outline: 'none',
                              }}
                            >
                              {STATUS_ORDER.map(s => (
                                <option key={s} value={s}>{STATUS[s].label}</option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── DETAIL PANEL ──────────────────────────────────────────── */}
        {selected ? (
          <div style={{
            width: '320px', flexShrink: 0,
            background: 'white', borderRadius: '24px',
            boxShadow: '0 4px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            animation: 'slideIn 0.25s ease',
            position: 'sticky', top: 24,
          }}>
            {/* Panel header */}
            <div style={{
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              padding: '20px 20px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={18} color="white" />
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Détail de l'incident</p>
                  <p style={{ color: 'white', fontSize: 14, fontWeight: 900, margin: '2px 0 0' }}>#{selected.id_incident}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none', cursor: 'pointer', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Status banner */}
            <div style={{
              background: STATUS[selected.statut]?.bg || '#FEF3C7',
              padding: '12px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid rgba(0,0,0,0.04)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: STATUS[selected.statut]?.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Statut actuel
              </span>
              <StatusBadge statut={selected.statut} size="sm" />
            </div>

            <div style={{ padding: '20px' }}>

              {/* Type + description */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  {(() => {
                    const tc = typeConfig(selected.type_incident);
                    const Icon = tc.icon;
                    return (
                      <div style={{ width: 38, height: 38, borderRadius: '11px', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} color={tc.color} />
                      </div>
                    );
                  })()}
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#1E293B', lineHeight: 1.3 }}>
                    {selected.type_incident || 'Type inconnu'}
                  </h4>
                </div>
                <div style={{
                  background: '#F8FAFC', borderRadius: '14px',
                  padding: '14px 16px', fontSize: 13,
                  color: '#475569', lineHeight: 1.6, fontWeight: 500,
                  border: '1px solid #F1F5F9',
                }}>
                  {selected.description || <em style={{ color: '#CBD5E1' }}>Aucune description</em>}
                </div>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Bus', value: selected.numero_bus ? `N° ${selected.numero_bus}` : '—', icon: Bus, color: '#4F46E5' },
                  { label: 'Ligne', value: selected.ligne || '—', icon: MapPin, color: '#F97316' },
                  { label: 'Signalé par', value: selected.rapporte_par || '—', icon: User, color: '#10B981' },
                  { label: 'Heure', value: new Date(selected.date_incident).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), icon: Clock, color: '#6366F1' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} style={{ background: '#F8FAFC', borderRadius: '14px', padding: '12px 14px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Icon size={12} color={color} />
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Full date */}
              <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#64748B', fontWeight: 600, border: '1px solid #F1F5F9' }}>
                📅 {fmtDateLong(selected.date_incident)}
              </div>

              {/* Update status */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Changer le statut
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {STATUS_ORDER.filter(s => s !== selected.statut).map(s => {
                    const cfg = STATUS[s];
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(selected.id_incident, s)}
                        disabled={updating === selected.id_incident}
                        className="update-btn"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '11px 14px',
                          borderRadius: '12px', border: `1.5px solid ${cfg.ring}`,
                          background: cfg.btnBg, color: cfg.color,
                          fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {updating === selected.id_incident
                            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            : <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                          }
                          {cfg.label}
                        </span>
                        <ChevronRight size={14} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            width: '280px', flexShrink: 0,
            background: 'white', borderRadius: '24px',
            border: '2px dashed #E2E8F0',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', textAlign: 'center', gap: 12,
            position: 'sticky', top: 24,
          }}>
            <div style={{ width: 60, height: 60, borderRadius: '18px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Filter size={28} color="#CBD5E1" />
            </div>
            <p style={{ color: '#94A3B8', fontWeight: 700, fontSize: 14, margin: 0 }}>Sélectionnez un incident</p>
            <p style={{ color: '#CBD5E1', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              Cliquez sur une ligne du tableau pour afficher les détails complets
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Incidents;

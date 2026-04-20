import React, { useState, useEffect } from 'react';
import { Bus, Plus, Edit2, Trash2, Loader2, X, Search, Eye, MapPin, Clock, ShieldCheck, ChevronRight, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Users.css';

/* ─── State badge ─────────────────────────────────────────── */
const STATE_CFG = {
  'en service':   { bg: 'rgba(16,185,129,0.1)',  color: '#065F46', dot: '#10B981', label: 'En service'  },
  'maintenance':  { bg: 'rgba(245,158,11,0.12)', color: '#92400E', dot: '#F59E0B', label: 'Maintenance' },
  'en panne':     { bg: 'rgba(239,68,68,0.1)',   color: '#991B1B', dot: '#EF4444', label: 'En panne'    },
};

const getStateCfg = (etat = '') => STATE_CFG[etat.toLowerCase()] || STATE_CFG['en service'];

const StateBadge = ({ etat }) => {
  const cfg = getStateCfg(etat);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: cfg.bg, color: cfg.color,
      padding: '4px 12px', borderRadius: 99, fontSize: 11,
      fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
      border: `1.5px solid ${cfg.dot}40`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, animation: etat?.toLowerCase() === 'en service' ? 'pulse 2s infinite' : 'none', display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
};

/* ─── InfoRow ─────────────────────────────────────────────── */
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
const Fleet = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [lines, setLines] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({ numero_bus: '', capacite: '', etat: 'En service', num_ligne: '', horaire_affecte: '' });

  const fetchLines = async () => {
    try { const r = await fetch('http://localhost:5000/api/network'); setLines(await r.json()); } catch {}
  };
  const fetchBuses = async () => {
    try {
      setLoading(true);
      const r = await fetch('http://localhost:5000/api/buses');
      setBuses(Array.isArray(await r.json()) ? await (await fetch('http://localhost:5000/api/buses')).json() : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchBuses(); fetchLines(); }, []);

  const filteredBuses = buses.filter(b =>
    b.numero_bus?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.etat?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingBus(null);
    setFormData({ numero_bus: '', capacite: '', etat: 'En service', num_ligne: '', horaire_affecte: '' });
    setImageFile(null); setImagePreview(null);
    setIsModalOpen(true);
  };
  const handleOpenEdit = (bus) => {
    setEditingBus(bus);
    setFormData({ numero_bus: bus.numero_bus, capacite: bus.capacite, etat: bus.etat, num_ligne: bus.num_ligne || '', horaire_affecte: bus.horaire_affecte || '' });
    setImageFile(null);
    setImagePreview(bus.image_url ? `http://localhost:5000/${bus.image_url}` : null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    const url = editingBus ? `http://localhost:5000/api/buses/${editingBus.id_bus}` : 'http://localhost:5000/api/buses';
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));
      if (imageFile) data.append('image', imageFile);
      else if (editingBus?.image_url) data.append('image_url', editingBus.image_url);
      const r = await fetch(url, { method: editingBus ? 'PUT' : 'POST', body: data });
      if (r.ok) { await fetchBuses(); setIsModalOpen(false); }
      else { const err = await r.json(); alert(err.message || 'Erreur'); }
    } catch { alert('Erreur de connexion'); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('🗑️ Supprimer ce bus ?')) return;
    const r = await fetch(`http://localhost:5000/api/buses/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setBuses(prev => prev.filter(b => b.id_bus !== id));
      if (selectedBus?.id_bus === id) setSelectedBus(null);
    }
  };

  const stat = { total: buses.length, active: buses.filter(b => b.etat?.toLowerCase() === 'en service').length, maintenance: buses.filter(b => b.etat?.toLowerCase() === 'maintenance').length };

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .bus-row { cursor:pointer; transition:background 0.15s; }
        .bus-row:hover td { background:#F0F4FF !important; }
        .bus-row.sel td { background:#EEF2FF !important; }
      `}</style>

      <div className="users-container">
        {/* HEADER */}
        <div className="users-header-card">
          <div className="header-titles">
            <h1>🚌 Gestion de la Flotte</h1>
            <p>{stat.total} véhicules · {stat.active} en service · {stat.maintenance} en maintenance</p>
          </div>
          <div className="header-actions">
            <div className="search-wrapper">
              <Search className="search-icon" size={16} />
              <input type="text" placeholder="Rechercher numéro ou état..." className="search-input"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <button className="btn-add-user" onClick={handleOpenAdd}>
              <Plus size={16} />
              <span>Ajouter Bus</span>
            </button>
          </div>
        </div>

        {/* TABLE + PANEL */}
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
                        <th>Véhicule</th>
                        <th>Capacité</th>
                        <th>Ligne Assignée</th>
                        <th>Horaire</th>
                        <th>État</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {filteredBuses.length > 0 ? filteredBuses.map((bus, idx) => {
                          const cfg = getStateCfg(bus.etat);
                          const isSel = selectedBus?.id_bus === bus.id_bus;
                          return (
                            <motion.tr key={bus.id_bus}
                              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className={`bus-row${isSel ? ' sel' : ''}`}
                              onClick={() => setSelectedBus(isSel ? null : bus)}
                            >
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{
                                    width: 42, height: 42, borderRadius: 12,
                                    background: `linear-gradient(135deg, ${cfg.dot}25, ${cfg.dot}10)`,
                                    border: `1.5px solid ${cfg.dot}35`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                  }}>
                                    <Bus size={20} color={cfg.color} />
                                  </div>
                                  <div>
                                    <p style={{ margin: 0, fontWeight: 900, fontSize: 18, color: '#0F172A' }}>N° {bus.numero_bus}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: 14, color: '#94A3B8', fontWeight: 600 }}>ID #{bus.id_bus}</p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Users size={14} color="#94A3B8" />
                                  <span style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>{bus.capacite} places</span>
                                </div>
                              </td>
                              <td>
                                {bus.ville_depart ? (
                                  <div>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: '#4F46E5' }}>L{bus.num_ligne} </span>
                                    <span style={{ fontSize: 15, color: '#475569', fontWeight: 700 }}>{bus.ville_depart} → {bus.ville_arrivee}</span>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: 12, color: '#CBD5E1', fontStyle: 'italic' }}>Non assigné</span>
                                )}
                              </td>
                              <td>
                                {bus.horaire_affecte ? (
                                  <span style={{ padding: '3px 10px', background: '#EEF2FF', color: '#4338CA', borderRadius: 8, fontSize: 14, fontWeight: 800, border: '1px solid #C7D2FE' }}>
                                    🕒 {bus.horaire_affecte}
                                  </span>
                                ) : <span style={{ color: '#CBD5E1', fontSize: 14 }}>—</span>}
                              </td>
                              <td><StateBadge etat={bus.etat} /></td>
                              <td onClick={e => e.stopPropagation()}>
                                <div className="row-actions" style={{ opacity: 1 }}>
                                  <button title="Éditer" className="action-btn btn-edit" onClick={() => handleOpenEdit(bus)}><Edit2 size={15} /></button>
                                  <button title="Supprimer" className="action-btn btn-trash" onClick={() => handleDelete(bus.id_bus)}><Trash2 size={15} /></button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan="6" className="empty-state">
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '3rem 0' }}>
                                <div style={{ width: 60, height: 60, borderRadius: 18, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Bus size={28} color="#CBD5E1" />
                                </div>
                                <p style={{ fontWeight: 700, color: '#64748B', margin: 0 }}>Aucun bus trouvé</p>
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

          {/* ─── DETAIL SIDE PANEL ──────────────────────── */}
          <AnimatePresence>
            {selectedBus && (
              <motion.div
                key={selectedBus.id_bus}
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                style={{ width: 300, flexShrink: 0, background: 'white', borderRadius: 24, boxShadow: '0 4px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)', overflow: 'hidden', position: 'sticky', top: 24 }}
              >
                {/* Top image or gradient header */}
                <div style={{ position: 'relative', height: selectedBus.image_url ? 160 : 100, overflow: 'hidden' }}>
                  {selectedBus.image_url ? (
                    <img src={`http://localhost:5000/${selectedBus.image_url}`} alt="Bus"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1E1B4B,#4338CA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bus size={48} color="rgba(255,255,255,0.3)" />
                    </div>
                  )}
                  {/* Close button overlay */}
                  <button onClick={() => setSelectedBus(null)} style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X size={14} color="white" />
                  </button>
                  {/* State badge overlay */}
                  <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                    <StateBadge etat={selectedBus.etat} />
                  </div>
                </div>

                {/* Bus title */}
                <div style={{ padding: '16px 20px 0' }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Numéro de Véhicule</p>
                  <h3 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: '#0F172A' }}>N° {selectedBus.numero_bus}</h3>
                  <p style={{ margin: '2px 0 12px', fontSize: 12, color: '#94A3B8' }}>ID interne #{selectedBus.id_bus}</p>
                </div>

                {/* Info rows */}
                <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <InfoRow icon={Users} label="Capacité" value={`${selectedBus.capacite} passagers`} color="#6366F1" />
                  <InfoRow icon={Clock} label="Horaire assigné" value={selectedBus.horaire_affecte || 'Non planifié'} color="#F59E0B" />

                  {selectedBus.num_ligne && (
                    <div style={{ padding: '14px 16px', borderRadius: 14, background: 'linear-gradient(135deg,#1E1B4B,#4338CA)', border: 'none' }}>
                      <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: 'rgba(196,181,253,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Itinéraire Actif</p>
                      <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 900, color: 'white' }}>Ligne {selectedBus.num_ligne}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{selectedBus.ville_depart}</span>
                        <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 99, position: 'relative' }}>
                          <div style={{ position: 'absolute', right: 0, top: -3, width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{selectedBus.ville_arrivee}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                    <button onClick={() => { setSelectedBus(null); handleOpenEdit(selectedBus); }}
                      style={{ flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1.5px solid #C7D2FE', background: '#EEF2FF', color: '#4338CA', transition: 'all 0.15s' }}>
                      ✏️ Modifier
                    </button>
                    <button onClick={() => handleDelete(selectedBus.id_bus)}
                      style={{ flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#DC2626', transition: 'all 0.15s' }}>
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ADD/EDIT MODAL */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="modal-content" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
                <div className="modal-header" style={{ background: 'linear-gradient(135deg,#1E1B4B,#4338CA)', borderBottom: 'none', padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bus size={18} color="white" />
                    </div>
                    <h2 style={{ color: 'white', margin: 0, fontSize: 16, fontWeight: 900 }}>
                      {editingBus ? `Modifier Bus ${editingBus.numero_bus}` : 'Nouveau Bus'}
                    </h2>
                  </div>
                  <button className="btn-close" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }} onClick={() => setIsModalOpen(false)}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Numéro du Bus</label>
                      <input type="text" required className="form-input" value={formData.numero_bus} onChange={e => setFormData({ ...formData, numero_bus: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Capacité (Places)</label>
                      <input type="number" required className="form-input" value={formData.capacite} onChange={e => setFormData({ ...formData, capacite: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Ligne Assignée</label>
                      <select className="form-select" value={formData.num_ligne} onChange={e => setFormData({ ...formData, num_ligne: e.target.value, horaire_affecte: '' })}>
                        <option value="">-- Aucune ligne --</option>
                        {lines.map(l => <option key={l.num_ligne} value={l.num_ligne}>Ligne {l.num_ligne} : {l.ville_depart} → {l.ville_arrivee}</option>)}
                      </select>
                    </div>
                    {formData.num_ligne && (
                      <div className="form-group">
                        <label>Horaire Assigné</label>
                        <select className="form-select" value={formData.horaire_affecte} onChange={e => setFormData({ ...formData, horaire_affecte: e.target.value })}>
                          <option value="">-- Sélectionner l'horaire --</option>
                          {(() => {
                            const found = lines.find(l => String(l.num_ligne) === String(formData.num_ligne));
                            const list = found?.horaires?.filter(Boolean) || (found?.horaire ? [found.horaire] : []);
                            return list.map((h, i) => <option key={i} value={h}>{h}</option>);
                          })()}
                        </select>
                      </div>
                    )}
                    <div className="form-group">
                      <label>État</label>
                      <select className="form-select" value={formData.etat} onChange={e => setFormData({ ...formData, etat: e.target.value })}>
                        <option value="En service">En service</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="En panne">En panne</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Photo du Bus</label>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 72, height: 54, borderRadius: 12, background: '#F8FAFC', border: '2px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {imagePreview ? <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Bus size={22} color="#CBD5E1" />}
                        </div>
                        <label htmlFor="bus-photo" style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer', background: '#EEF2FF', color: '#4338CA', borderRadius: 10, border: '1px solid #C7D2FE', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Plus size={14} />{imagePreview ? 'Changer' : 'Choisir'}
                        </label>
                        <input id="bus-photo" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Annuler</button>
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

export default Fleet;

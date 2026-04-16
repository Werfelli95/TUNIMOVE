import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MapPin, Clock, Ticket, Printer, User, X, CheckCircle, ChevronDown
} from 'lucide-react-native';
import axios from 'axios';

const BASE = 'http://localhost:5000/api';
const { width } = Dimensions.get('window');

// ── Types ────────────────────────────────────────────────────────────────────
interface Station { arret: string; distance_km: number; }
interface Ligne {
  num_ligne: number | string;
  ville_depart: string; ville_arrivee: string;
  horaires: string[]; horaire?: string;
  stations: Station[];
}
interface TarifConfig {
  prix_par_km: number; frais_fixes: number;
  red_etudiant: number; red_handicape: number;
}
interface TicketData {
  id_ticket?: number; code_ticket: string;
  siege: string; type_tarif: string; montant_total: number;
  station_depart: string; station_arrivee: string;
  heure_depart: string; date_emission: string;
  numero_bus: string; num_ligne: string | number;
}

const SEAT_ROWS = ['A','B','C','D','E','F','G','H','I','J','K','L','M'];
const TARIFS = [
  { key: 'Tarif Plein', label: 'Plein', reduc: 0, color: '#1a3a52' },
  { key: 'Étudiant',    label: 'Étudiant', reduc: 25, color: '#059669' },
  { key: 'Handicapé',   label: 'Handicapé', reduc: 50, color: '#d97706' },
];

export default function VenteScreen() {
  const params = useLocalSearchParams();
  const router  = useRouter();

  const numero_bus  = params.numero_bus as string;
  const service_id  = params.service_id as string;
  const num_ligne   = params.num_ligne as string;
  const ville_dep   = params.ville_depart as string;
  const ville_arr   = params.ville_arrivee as string;
  const nom         = params.nom as string;
  const prenom      = params.prenom as string;

  // Data
  const [ligne, setLigne] = useState<Ligne | null>(null);
  const [tarifCfg, setTarifCfg] = useState<TarifConfig | null>(null);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [horaire, setHoraire] = useState('');
  const [showHoraire, setShowHoraire] = useState(false);
  const [arretDepart, setArretDepart] = useState('');
  const [showDepart, setShowDepart] = useState(false);
  const [arretArrivee, setArretArrivee] = useState('');
  const [showArrivee, setShowArrivee] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [typeTarif, setTypeTarif] = useState('Tarif Plein');

  // Ticket modal
  const [ticketModal, setTicketModal] = useState(false);
  const [lastTicket, setLastTicket] = useState<TicketData | null>(null);
  const [selling, setSelling] = useState(false);

  // ── Load line + tarif ─────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [netRes, tarifRes] = await Promise.all([
          axios.get<Ligne[]>(`${BASE}/network`),
          axios.get<TarifConfig>(`${BASE}/tarifs`),
        ]);
        const found = netRes.data.find(l => String(l.num_ligne) === String(num_ligne));
        setLigne(found || null);
        setTarifCfg(tarifRes.data);
      } catch { /* silent */ }
      finally { setLoadingData(false); }
    };
    if (num_ligne) load(); else setLoadingData(false);
  }, [num_ligne]);

  // ── Reload occupied seats when horaire changes ────────────────────────────
  useEffect(() => {
    const fetchOccupied = async () => {
      if (!horaire || !num_ligne) return;
      try {
        const today = new Date().toISOString().split('T')[0];
        const r = await axios.get<string[]>(
          `${BASE}/sales/tickets/occupied-seats?num_ligne=${num_ligne}&date=${today}&heure=${horaire}`
        );
        setOccupiedSeats(r.data);
      } catch { setOccupiedSeats([]); }
    };
    fetchOccupied();
    setSelectedSeat(null);
  }, [horaire]);

  // ── Stations list ─────────────────────────────────────────────────────────
  const stations = useMemo<Station[]>(() => {
    if (!ligne) return [];
    const list = [...(ligne.stations || [])];
    const hasStart = list.some(s => s.distance_km === 0 || s.arret.toLowerCase() === ligne.ville_depart.toLowerCase());
    if (!hasStart) list.push({ arret: ligne.ville_depart, distance_km: 0 });
    return list.sort((a, b) => a.distance_km - b.distance_km);
  }, [ligne]);


  const deptSt  = stations.find(s => s.arret === arretDepart);
  const arrivSt = stations.find(s => s.arret === arretArrivee);
  const distance = (deptSt && arrivSt) ? Math.abs(arrivSt.distance_km - deptSt.distance_km) : 0;

  // Stations available as arrival (must be AFTER selected departure)
  const stationsArrivee = arretDepart
    ? stations.filter(s => {
        const depKm = deptSt?.distance_km ?? -1;
        return s.arret !== arretDepart && s.distance_km > depKm;
      })
    : [];

  // Reset arrivee if departure changes and arrivee no longer valid
  const handleSetDepart = (arret: string) => {
    setArretDepart(arret);
    setShowDepart(false);
    setArretArrivee(''); // reset arrivée
  };

  const prix = useMemo(() => {
    if (!tarifCfg || distance <= 0) return 0;
    let p = distance * tarifCfg.prix_par_km + tarifCfg.frais_fixes;
    if (typeTarif === 'Étudiant')  p *= (1 - tarifCfg.red_etudiant / 100);
    if (typeTarif === 'Handicapé') p *= (1 - tarifCfg.red_handicape / 100);
    return p;
  }, [tarifCfg, distance, typeTarif]);

  // ── Seat grid ─────────────────────────────────────────────────────────────
  const capacite = 50; // default; ideally from bus data
  const numRows  = Math.ceil(capacite / 5);

  const renderSeats = () => {
    const rows = [];
    for (let i = 0; i < Math.min(numRows, SEAT_ROWS.length); i++) {
      const rowLabel = SEAT_ROWS[i];
      const cols = Math.min(5, capacite - i * 5);
      const cells = [];
      for (let c = 1; c <= cols; c++) {
        const seatId = `${rowLabel}${c}`;
        const isOcc = occupiedSeats.includes(seatId);
        const isSel = selectedSeat === seatId;
        cells.push(
          <TouchableOpacity
            key={seatId}
            style={[styles.seat, isOcc ? styles.seatOcc : isSel ? styles.seatSel : styles.seatFree]}
            onPress={() => !isOcc && setSelectedSeat(isSel ? null : seatId)}
            disabled={isOcc}
          >
            <Text style={[styles.seatTxt, isOcc ? styles.seatOccTxt : isSel ? styles.seatSelTxt : styles.seatFreeTxt]}>
              {seatId}
            </Text>
          </TouchableOpacity>
        );
      }
      rows.push(<View key={rowLabel} style={styles.seatRow}>{cells}</View>);
    }
    return rows;
  };

  // ── Horaire options ───────────────────────────────────────────────────────
  const horaires: string[] = ligne?.horaires?.filter(Boolean) ?? (ligne?.horaire ? [ligne.horaire] : []);

  // ── Sell ticket ───────────────────────────────────────────────────────────
  const canSell = !!selectedSeat && !!arretDepart && !!arretArrivee && !!horaire && prix > 0;

  const handleSell = async () => {
    if (!canSell) return;
    setSelling(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      const body = {
        num_ligne,
        bus: numero_bus,
        date_voyage: today,
        heure: horaire,
        siege: selectedSeat,
        prix,
        arret_depart: arretDepart,
        arret_arrivee: arretArrivee,
        agent_id: null,
        type_tarif: typeTarif,
        id_service: service_id ? parseInt(service_id) : null,
      };
      await axios.post(`${BASE}/sales/tickets/vendre`, body);

      // Mark seat as occupied locally
      setOccupiedSeats(prev => [...prev, selectedSeat!]);

      const code = 'TKT' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      setLastTicket({
        code_ticket: code,
        siege: selectedSeat!,
        type_tarif: typeTarif,
        montant_total: prix,
        station_depart: arretDepart,
        station_arrivee: arretArrivee,
        heure_depart: horaire,
        date_emission: new Date().toISOString(),
        numero_bus,
        num_ligne,
      });

      setSelectedSeat(null);
      setTicketModal(true);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Erreur lors de la vente');
    } finally {
      setSelling(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingData) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1a3a52" /></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Service banner */}
        <View style={styles.serviceBanner}>
          <Text style={styles.serviceBannerText}>🟢 Service #{service_id} · Bus {numero_bus}</Text>
          <Text style={styles.serviceBannerSub}>{ville_dep} → {ville_arr}</Text>
        </View>

        {/* 1. Horaire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}><Clock size={16} color="#334155" /> Horaire de départ *</Text>
          {horaires.length > 0 ? (
            <>
              <TouchableOpacity style={styles.picker} onPress={() => setShowHoraire(!showHoraire)}>
                <Text style={horaire ? styles.pickerVal : styles.pickerPlaceholder}>{horaire || 'Choisir un horaire...'}</Text>
                <ChevronDown color="#64748b" size={18} />
              </TouchableOpacity>
              {showHoraire && (
                <View style={styles.dropdown}>
                  {horaires.map(h => (
                    <TouchableOpacity key={h} style={[styles.dropItem, horaire === h && styles.dropItemActive]}
                      onPress={() => { setHoraire(h); setShowHoraire(false); }}>
                      <Text style={[styles.dropItemTxt, horaire === h && styles.dropItemActiveTxt]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.picker, { opacity: 0.6 }]}>
              <Text style={styles.pickerPlaceholder}>Aucun horaire défini pour cette ligne</Text>
            </View>
          )}
        </View>

        {/* 2. Arrêt de départ — sélectionnable (le receveur est dans le bus) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}><MapPin size={16} color="#334155" /> Point de montée (Départ) *</Text>
          <TouchableOpacity style={styles.picker} onPress={() => { setShowDepart(!showDepart); setShowArrivee(false); }}>
            <Text style={arretDepart ? styles.pickerVal : styles.pickerPlaceholder}>
              {arretDepart || 'Choisir la station de départ...'}
            </Text>
            <ChevronDown color="#64748b" size={18} />
          </TouchableOpacity>
          {showDepart && (
            <View style={styles.dropdown}>
              {stations.map(s => (
                <TouchableOpacity key={s.arret}
                  style={[styles.dropItem, arretDepart === s.arret && styles.dropItemActive]}
                  onPress={() => handleSetDepart(s.arret)}>
                  <Text style={[styles.dropItemTxt, arretDepart === s.arret && styles.dropItemActiveTxt]}>
                    {s.arret} <Text style={{ color: '#94a3b8' }}>({s.distance_km} km)</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 3. Arrêt d'arrivée */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}><MapPin size={16} color="#dc2626" /> Destination (Arrivée) *</Text>
          {!arretDepart ? (
            <View style={[styles.picker, { opacity: 0.5 }]}>
              <Text style={styles.pickerPlaceholder}>Choisissez d'abord le départ</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.picker} onPress={() => { setShowArrivee(!showArrivee); setShowDepart(false); }}>
                <Text style={arretArrivee ? styles.pickerVal : styles.pickerPlaceholder}>
                  {arretArrivee || 'Choisir la destination...'}
                </Text>
                <ChevronDown color="#64748b" size={18} />
              </TouchableOpacity>
              {showArrivee && (
                <View style={styles.dropdown}>
                  {stationsArrivee.length === 0 ? (
                    <View style={styles.dropItem}><Text style={{ color: '#94a3b8', fontSize: 13 }}>Aucune station disponible après ce départ</Text></View>
                  ) : stationsArrivee.map(s => (
                    <TouchableOpacity key={s.arret}
                      style={[styles.dropItem, arretArrivee === s.arret && styles.dropItemActive]}
                      onPress={() => { setArretArrivee(s.arret); setShowArrivee(false); }}>
                      <Text style={[styles.dropItemTxt, arretArrivee === s.arret && styles.dropItemActiveTxt]}>
                        {s.arret} <Text style={{ color: '#94a3b8' }}>({s.distance_km} km)</Text>
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
          {distance > 0 && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceTxt}>
                {arretDepart} → {arretArrivee} · {distance.toFixed(1)} km
              </Text>
            </View>
          )}
        </View>

        {/* 3. Type de tarif */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}><User size={16} color="#334155" /> Type de tarif</Text>
          <View style={styles.tarifRow}>
            {TARIFS.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tarifCard, typeTarif === t.key && { ...styles.tarifCardActive, borderColor: t.color, backgroundColor: t.color + '15' }]}
                onPress={() => setTypeTarif(t.key)}
              >
                <Text style={[styles.tarifLabel, typeTarif === t.key && { color: t.color }]}>{t.label}</Text>
                {t.reduc > 0 && <Text style={[styles.tarifReduc, { color: t.color }]}>-{t.reduc}%</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Sièges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}><Ticket size={16} color="#334155" /> Sélection du siège *</Text>
          <View style={styles.seatLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#e2e8f0' }]} /><Text style={styles.legendTxt}>Libre</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#1a3a52' }]} /><Text style={styles.legendTxt}>Sélectionné</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#fca5a5' }]} /><Text style={styles.legendTxt}>Occupé</Text></View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.seatGrid}>{renderSeats()}</View>
          </ScrollView>
        </View>

        {/* 5. Récapitulatif + bouton */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Siège</Text><Text style={styles.summaryVal}>{selectedSeat || '—'}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Départ</Text><Text style={styles.summaryVal}>{arretDepart || '—'}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Arrivée</Text><Text style={styles.summaryVal}>{arretArrivee || '—'}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Horaire</Text><Text style={styles.summaryVal}>{horaire || '—'}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Tarif</Text><Text style={styles.summaryVal}>{typeTarif}</Text></View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>TOTAL</Text>
            <Text style={styles.summaryTotalVal}>{prix.toFixed(3)} TND</Text>
          </View>

          <TouchableOpacity
            style={[styles.sellBtn, (!canSell || selling) && styles.btnDisabled]}
            onPress={handleSell}
            disabled={!canSell || selling}
          >
            {selling ? <ActivityIndicator color="#1a3a52" /> : (
              <>
                <Printer color="#1a3a52" size={20} />
                <Text style={styles.sellBtnTxt}>Émettre le billet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Ticket Modal ─────────────────────────────────────────────────── */}
      <Modal visible={ticketModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.ticketModal}>
            {/* Header */}
            <View style={styles.ticketHeader}>
              <CheckCircle color="#16a34a" size={32} />
              <Text style={styles.ticketHeaderTxt}>Billet émis !</Text>
              <TouchableOpacity onPress={() => setTicketModal(false)} style={styles.closeBtn}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            {/* Ticket body */}
            {lastTicket && (
              <View style={styles.ticketBody}>
                {/* Logo */}
                <Text style={styles.ticketLogo}>🚌 TuniMove</Text>
                <Text style={styles.ticketSubtitle}>Transport Interurbain</Text>

                <View style={styles.sep} />

                <View style={styles.ticketGrid}>
                  <View style={styles.ticketField}><Text style={styles.ticketKey}>Bus</Text><Text style={styles.ticketValue}>N° {lastTicket.numero_bus}</Text></View>
                  <View style={styles.ticketField}><Text style={styles.ticketKey}>Siège</Text><Text style={[styles.ticketValue, { fontSize: 22, color: '#1a3a52' }]}>{lastTicket.siege}</Text></View>
                  <View style={styles.ticketField}><Text style={styles.ticketKey}>Départ</Text><Text style={styles.ticketValue}>{lastTicket.station_depart}</Text></View>
                  <View style={styles.ticketField}><Text style={styles.ticketKey}>Arrivée</Text><Text style={styles.ticketValue}>{lastTicket.station_arrivee}</Text></View>
                  <View style={styles.ticketField}><Text style={styles.ticketKey}>Heure</Text><Text style={styles.ticketValue}>{lastTicket.heure_depart}</Text></View>
                  <View style={styles.ticketField}><Text style={styles.ticketKey}>Tarif</Text><Text style={styles.ticketValue}>{lastTicket.type_tarif}</Text></View>
                </View>

                <View style={styles.sep} />

                {/* Code QR / Ticket */}
                <View style={styles.qrBox}>
                  <Text style={styles.qrLabel}>Code de validation</Text>
                  <Text style={styles.qrCode}>{lastTicket.code_ticket}</Text>
                  <Text style={styles.qrHint}>À présenter au contrôleur</Text>
                </View>

                <View style={styles.sep} />

                <Text style={styles.ticketTotal}>{lastTicket.montant_total.toFixed(3)} TND</Text>
                <Text style={styles.ticketFooter}>Receveur : {prenom} {nom} · {new Date(lastTicket.date_emission).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.newTicketBtn} onPress={() => { setTicketModal(false); }}>
              <Ticket color="#1a3a52" size={18} />
              <Text style={styles.newTicketBtnTxt}>Émettre un nouveau billet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SEAT_SIZE = Math.min(42, (width - 80) / 5);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  serviceBanner: {
    backgroundColor: '#1a3a52', borderRadius: 14, padding: 14, marginBottom: 16,
  },
  serviceBannerText: { color: '#fbbf24', fontWeight: '700', fontSize: 14 },
  serviceBannerSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },

  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 12 },

  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    height: 48, paddingHorizontal: 14, backgroundColor: '#f8fafc',
  },
  pickerVal: { fontSize: 15, color: '#0f172a' },
  pickerPlaceholder: { fontSize: 15, color: '#94a3b8' },
  dropdown: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    marginTop: 4, overflow: 'hidden', maxHeight: 220,
  },
  dropItem: { padding: 13, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropItemActive: { backgroundColor: '#eff6ff' },
  dropItemTxt: { fontSize: 14, color: '#334155' },
  dropItemActiveTxt: { color: '#1a3a52', fontWeight: '700' },

  routeRow: { gap: 8 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  routeLabel: { fontSize: 15, color: '#1e293b', fontWeight: '600' },
  routeLine: { width: 2, height: 16, backgroundColor: '#e2e8f0', marginLeft: 5 },
  distanceBadge: {
    backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: 'flex-start', marginTop: 10,
  },
  distanceTxt: { color: '#16a34a', fontWeight: '700', fontSize: 13 },

  tarifRow: { flexDirection: 'row', gap: 10 },
  tarifCard: {
    flex: 1, alignItems: 'center', padding: 12,
    borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  tarifCardActive: { borderWidth: 2 },
  tarifLabel: { fontSize: 13, fontWeight: '700', color: '#334155' },
  tarifReduc: { fontSize: 12, fontWeight: '600', marginTop: 4 },

  seatLegend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  legendTxt: { fontSize: 12, color: '#64748b' },
  seatGrid: { gap: 4 },
  seatRow: { flexDirection: 'row', gap: 4 },
  seat: {
    width: SEAT_SIZE, height: SEAT_SIZE, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  seatFree: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  seatSel:  { backgroundColor: '#1a3a52', borderColor: '#1a3a52' },
  seatOcc:  { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  seatTxt:  { fontSize: 10, fontWeight: '700' },
  seatFreeTxt: { color: '#475569' },
  seatSelTxt:  { color: '#ffffff' },
  seatOccTxt:  { color: '#dc2626' },

  summaryCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  summaryLabel: { fontSize: 13, color: '#64748b' },
  summaryVal: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  summaryTotal: { borderBottomWidth: 0, marginTop: 8 },
  summaryTotalLabel: { fontSize: 16, fontWeight: '800', color: '#1a3a52' },
  summaryTotalVal: { fontSize: 22, fontWeight: '900', color: '#1a3a52' },

  sellBtn: {
    backgroundColor: '#fbbf24', height: 56, borderRadius: 14, marginTop: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  sellBtnTxt: { fontSize: 16, fontWeight: '800', color: '#1a3a52' },
  btnDisabled: { opacity: 0.45 },

  // ── Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  ticketModal: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '90%',
  },
  ticketHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  ticketHeaderTxt: { flex: 1, fontSize: 20, fontWeight: '800', color: '#1e293b' },
  closeBtn: { padding: 4 },

  ticketBody: { alignItems: 'center' },
  ticketLogo: { fontSize: 22, fontWeight: '900', color: '#1a3a52' },
  ticketSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  sep: { width: '100%', height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 },

  ticketGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', gap: 8 },
  ticketField: {
    width: '48%', backgroundColor: '#f8fafc', borderRadius: 10, padding: 10,
  },
  ticketKey: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' },
  ticketValue: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginTop: 2 },

  qrBox: { alignItems: 'center', width: '100%' },
  qrLabel: { fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: '600' },
  qrCode: {
    fontFamily: 'monospace', fontSize: 20, fontWeight: '900',
    color: '#1a3a52', letterSpacing: 4,
    backgroundColor: '#f0f9ff', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, borderWidth: 2, borderColor: '#bae6fd',
    textAlign: 'center',
  },
  qrHint: { fontSize: 11, color: '#94a3b8', marginTop: 6 },

  ticketTotal: { fontSize: 30, fontWeight: '900', color: '#1a3a52', marginBottom: 4 },
  ticketFooter: { fontSize: 11, color: '#94a3b8', textAlign: 'center' },

  newTicketBtn: {
    backgroundColor: '#fbbf24', height: 52, borderRadius: 14, marginTop: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  newTicketBtnTxt: { fontSize: 15, fontWeight: '800', color: '#1a3a52' },
});

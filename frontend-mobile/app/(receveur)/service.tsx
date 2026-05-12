import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, RefreshControl, Platform, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Play, Square, Ticket, ClipboardList, AlertTriangle, X,
  Clock, TrendingUp, Bus, Navigation, MapPin, ChevronRight,
  ChevronDown, CheckCircle, ArrowUpDown
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme';

import { RECEVEUR_SERVICE_API, NETWORK_API } from '../../constants/api';

const { width } = Dimensions.get('window');
const BASE = RECEVEUR_SERVICE_API;
const NET = NETWORK_API;

interface ActiveService {
  id_service: number;
  num_ligne: string | number;
  date_debut: string;
  station_actuelle: string | null;
  horaire: string | null;
  voyage_complet: boolean;
  numero_bus: string;
  ville_depart: string;
  ville_arrivee: string;
  nb_tickets: number;
  recette: number;
}

export default function ServiceScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const numero_bus  = params.numero_bus as string;
  const nom         = params.nom as string;
  const prenom      = params.prenom as string;
  const userId      = params.userId as string;
  const ville_dep   = params.ville_depart as string;
  const ville_arr   = params.ville_arrivee as string;
  const num_ligne   = params.num_ligne as string;

  const [svc, setSvc]           = useState<ActiveService | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRef]    = useState(false);
  const [starting, setStarting] = useState(false);
  const [advancing, setAdv]     = useState(false);
  const [stations, setStations] = useState<string[]>([]);
  const [horaires, setHoraires] = useState<string[]>([]);
  const [selHoraire, setSelHoraire] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [isReversed, setIsReversed] = useState(params.isReversed === 'true');
  const [showPicker, setShowPicker] = useState(false);

  const load = async () => {
    if (!numero_bus) { setLoading(false); return; }
    try {
      const r = await axios.get<ActiveService | null>(`${BASE}/active/${encodeURIComponent(numero_bus)}`);
      setSvc(r.data);
      
      const targetLigne = r.data?.num_ligne || num_ligne;
      if (targetLigne) {
        try {
          const net = await axios.get<any[]>(NET);
          const ligne = net.data.find((l: any) => String(l.num_ligne) === String(targetLigne));
          if (ligne) {
            setHoraires(ligne.horaires || []);
            let list = [...(ligne.stations || [])].sort((a: any, b: any) => a.distance_km - b.distance_km);
            const startName = (ligne.ville_depart || '').trim().toLowerCase();
            const endName = (ligne.ville_arrivee || '').trim().toLowerCase();

            if (!list.some((s: any) => (s.arret || '').trim().toLowerCase() === startName)) {
              list.unshift({ arret: ligne.ville_depart, distance_km: 0 });
            }
            if (!list.some((s: any) => (s.arret || '').trim().toLowerCase() === endName)) {
              list.push({ arret: ligne.ville_arrivee, distance_km: list.length > 0 ? list[list.length-1].distance_km + 1 : 1 });
            }

            const uniqueList: any[] = [];
            const seen = new Set();
            for (const s of list) {
              const name = (s.arret || '').trim().toLowerCase();
              if (!seen.has(name)) {
                seen.add(name);
                uniqueList.push(s);
              }
            }
            setStations(uniqueList.map((s: any) => s.arret.trim()));
          }
        } catch { /**/ }
      }
    } catch { setSvc(null); }
    finally { setLoading(false); setRef(false); }
  };

  useFocusEffect(useCallback(() => { 
    setLoading(true); 
    // Forcer l'heure système actuelle à chaque fois qu'on arrive sur l'écran
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setSelHoraire(timeStr);
    load(); 
  }, []));

  const elapsedMin = svc
    ? Math.max(0, Math.floor((Date.now() - new Date(svc.date_debut).getTime()) / 60000))
    : 0;
  const durLabel = elapsedMin >= 60
    ? `${Math.floor(elapsedMin / 60)}h ${elapsedMin % 60}m`
    : `${elapsedMin}m`;

  const displayStations = isReversed ? [...stations].reverse() : stations;
  const currentIdx = displayStations.findIndex(s => s.toLowerCase().trim() === (svc?.station_actuelle ?? '').toLowerCase().trim());
  let nextStation: string | null = null;
  let isLastStop = false;

  if (!svc?.voyage_complet) {
    if (currentIdx >= 0 && currentIdx < displayStations.length - 1) {
      nextStation = displayStations[currentIdx + 1];
      isLastStop = (currentIdx === displayStations.length - 2);
    } else if (currentIdx === -1 && displayStations.length > 0) {
      nextStation = displayStations[0];
      isLastStop = (displayStations.length === 1);
    }
  }

  const handleStart = () => {
    if (!selHoraire && horaires.length > 0) {
        Alert.alert('Horaire requis', 'Veuillez sélectionner un horaire de départ.');
        return;
    }
    const msg = `Lancer le service pour le bus N° ${numero_bus} ?`;
    
    const proceed = async () => {
      setStarting(true);
      try {
        const r = await axios.post<any>(`${BASE}/start`, { 
          numero_bus, 
          horaire: selHoraire,
          id_receveur: userId 
        });
        const s = r.data.service as ActiveService;
        setSvc({ ...s, nb_tickets: 0, recette: 0 });
      } catch (e: any) {
        Alert.alert('Erreur', e.response?.data?.message ?? 'Impossible de démarrer');
      } finally { setStarting(false); }
    };

    if (Platform.OS === 'web') {
      if (confirm(msg)) proceed();
    } else {
      Alert.alert('🚌 Démarrer le service', msg, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Démarrer', onPress: proceed }
      ]);
    }
  };

  const handleAvancer = () => {
    if (!nextStation || !svc) return;
    const title = isLastStop ? '🏁 Destination finale' : '➡️ Prochaine station';
    const msg = `Confirmer l'arrivée à ${nextStation} ?`;
    
    const proceed = async () => {
      setAdv(true);
      try {
        const r = await axios.post<any>(`${BASE}/${svc.id_service}/avancer`, {
          prochaine_station: nextStation,
          est_derniere: isLastStop,
        });
        const up = r.data.service;
        setSvc(prev => prev ? { ...prev, station_actuelle: up.station_actuelle, voyage_complet: up.voyage_complet } : null);
      } catch (e: any) {
        Alert.alert('Erreur', e.response?.data?.message ?? 'Erreur mise à jour');
      } finally { setAdv(false); }
    };

    if (Platform.OS === 'web') {
      if (confirm(`${title}\n\n${msg}`)) proceed();
    } else {
      Alert.alert(title, msg, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: proceed }
      ]);
    }
  };

  const handleStartReturn = async () => {
    if (!svc) return;
    setAdv(true);
    try {
      // On inverse le sens
      const nextIsReversed = !isReversed;
      setIsReversed(nextIsReversed);
      
      // On calcule la nouvelle station de départ (celle où on est actuellement)
      // On demande au backend de remettre voyage_complet à false
      await axios.post<any>(`${BASE}/${svc.id_service}/avancer`, {
        prochaine_station: svc.station_actuelle,
        est_derniere: false,
      });
      
      await load();
      Alert.alert('Bon voyage !', 'Le trajet de retour a été initialisé.');
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible de relancer le trajet de retour');
    } finally { setAdv(false); }
  };


  const navParams = {
    nom, prenom, numero_bus,
    ville_depart: isReversed ? (svc?.ville_arrivee || ville_arr) : (svc?.ville_depart || ville_dep),
    ville_arrivee: isReversed ? (svc?.ville_depart || ville_dep) : (svc?.ville_arrivee || ville_arr),
    station_actuelle: svc?.station_actuelle || '',
    num_ligne: svc ? String(svc.num_ligne) : num_ligne,
    service_id: svc ? String(svc.id_service) : '',
    horaire: svc?.horaire || '',
    isReversed: isReversed ? 'true' : 'false'
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRef(true); load(); }} />}
        showsVerticalScrollIndicator={false}
      >
        {svc ? (
          <>
            {/* ── Ultra-Premium Service Card ── */}
            <View style={styles.serviceHeader}>
              <View style={styles.headerTop}>
                <View style={styles.statusPill}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.statusPillText}>SERVICE ACTIF</Text>
                </View>
              </View>
              
              <View style={styles.headerMain}>
                <View style={styles.unitBadge}>
                  <Bus color={Colors.white} size={24} strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={styles.unitLabel}>BUS UNITÉ</Text>
                  <Text style={styles.unitNum}>N° {svc.numero_bus}</Text>
                </View>
                <View>
                  <Text style={styles.unitLabel}>LIGNE</Text>
                  <Text style={styles.unitNum}>{svc.num_ligne}</Text>
                </View>
              </View>

              <View style={styles.headerDirection}>
                <Navigation color={Colors.accent} size={16} strokeWidth={2.5} />
                <Text style={styles.directionLabel}>
                  {isReversed ? svc.ville_arrivee : svc.ville_depart} 
                  {' ➔ '}
                  {isReversed ? svc.ville_depart : svc.ville_arrivee}
                </Text>
                <View style={styles.sensBadge}>
                   <Text style={styles.sensBadgeText}>{isReversed ? 'RETOUR' : 'ALLER'}</Text>
                </View>
              </View>
            </View>

            {/* ── Premium KPI Row ── */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: Colors.info + '12' }]}>
                  <Clock color={Colors.info} size={18} strokeWidth={2.5} />
                </View>
                <Text style={styles.kpiVal}>{durLabel}</Text>
                <Text style={styles.kpiLbl}>DURÉE</Text>
              </View>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: Colors.warning + '12' }]}>
                  <Ticket color={Colors.warning} size={18} strokeWidth={2.5} />
                </View>
                <Text style={styles.kpiVal}>{svc.nb_tickets}</Text>
                <Text style={styles.kpiLbl}>BILLETS</Text>
              </View>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: Colors.success + '12' }]}>
                  <TrendingUp color={Colors.success} size={18} strokeWidth={2.5} />
                </View>
                <Text style={styles.kpiVal}>{parseFloat(String(svc.recette)).toFixed(1)}</Text>
                <Text style={styles.kpiLbl}>TND</Text>
              </View>
            </View>

            {/* ── Flight-Track Timeline ── */}
            <View style={styles.timelineCard}>
              <View style={styles.cardHeader}>
                <MapPin color={Colors.primary} size={20} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>Itinéraire en temps réel</Text>
                <View style={{ flex: 1 }} />
                <View style={[styles.directionMiniBadge, { backgroundColor: isReversed ? Colors.info + '15' : Colors.success + '15' }]}>
                  <ArrowUpDown color={isReversed ? Colors.info : Colors.success} size={12} strokeWidth={3} />
                  <Text style={[styles.directionMiniText, { color: isReversed ? Colors.info : Colors.success }]}>
                    {isReversed ? 'RETOUR' : 'ALLER'}
                  </Text>
                </View>
                {svc.voyage_complet && (
                  <View style={styles.finishedBadge}>
                    <Text style={styles.finishedText}>TERMINÉ</Text>
                  </View>
                )}
              </View>

              <View style={styles.timeline}>
                {displayStations.map((st, i) => {
                  const isPast = (currentIdx >= 0 && i < currentIdx) || svc.voyage_complet;
                  const isCur = st.toLowerCase().trim() === (svc?.station_actuelle ?? '').toLowerCase().trim() && !svc.voyage_complet;
                  const isLast = i === displayStations.length - 1;

                  return (
                    <View key={st + i} style={styles.tlItem}>
                      <View style={styles.tlLeft}>
                        <View style={[
                          styles.tlDot,
                          isPast && !isCur && styles.dotPast,
                          isCur && styles.dotCurrent,
                        ]} />
                        {!isLast && <View style={[styles.tlLine, isPast && styles.linePast]} />}
                      </View>
                      <View style={styles.tlRight}>
                        <Text style={[
                          styles.tlStation,
                          isCur && styles.tlStationCur,
                          isPast && !isCur && styles.tlStationPast,
                        ]}>
                          {st}
                        </Text>
                        {isCur && <Text style={styles.curLabel}>Station Actuelle</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>

              {!svc.voyage_complet && nextStation && (
                <TouchableOpacity
                  style={[styles.advanceBtn, advancing && styles.btnDis]}
                  onPress={handleAvancer}
                  disabled={advancing}
                >
                  <Text style={styles.advanceBtnText}>
                    {isLastStop ? 'Arriver au terminus' : `Prochain arrêt : ${nextStation}`}
                  </Text>
                  <ChevronRight color={Colors.white} size={20} strokeWidth={3} />
                </TouchableOpacity>
              )}

              {(svc.voyage_complet || (currentIdx === displayStations.length - 1 && displayStations.length > 1)) && (
                <TouchableOpacity
                  style={[styles.advanceBtn, advancing && styles.btnDis, { backgroundColor: Colors.info }]}
                  onPress={handleStartReturn}
                  disabled={advancing}
                >
                  {advancing 
                    ? <ActivityIndicator color={Colors.white} />
                    : <>
                        <Text style={styles.advanceBtnText}>Démarrer le trajet de retour</Text>
                        <ArrowUpDown color={Colors.white} size={20} strokeWidth={3} />
                      </>
                  }
                </TouchableOpacity>
              )}
            </View>

            {/* ── Additional Actions ── */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push({ pathname: '/(receveur)/manifeste', params: navParams })}
              >
                <View style={[styles.actionIconBtn, { backgroundColor: Colors.info + '12' }]}>
                  <ClipboardList color={Colors.info} size={20} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionBtnText}>Manifeste des passagers</Text>
                <View style={styles.badgeCount}>
                   <Text style={styles.badgeText}>{svc.nb_tickets}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, !(svc.voyage_complet || currentIdx === displayStations.length - 1 || currentIdx <= 0) && { opacity: 0.5 }]}
                onPress={() => setIsReversed(!isReversed)}
                disabled={!(svc.voyage_complet || currentIdx === displayStations.length - 1 || currentIdx <= 0)}
              >
                <View style={[styles.actionIconBtn, { backgroundColor: Colors.primary + '12' }]}>
                  <ArrowUpDown color={Colors.primary} size={20} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionBtnText}>Inverser le sens du trajet</Text>
                <Text style={styles.sensLabel}>{isReversed ? 'RETOUR' : 'ALLER'}</Text>
              </TouchableOpacity>


            </View>
          </>
        ) : (
          /* ══════════ IDLE STATE ══════════ */
          <>
            <View style={styles.idleContainer}>
              <View style={styles.idleIconWrap}>
                <Bus color={Colors.textLight} size={64} strokeWidth={1.5} />
              </View>
              <Text style={styles.idleTitle}>Prêt pour le service</Text>
              <Text style={styles.idleSub}>BUS N° {numero_bus} · LIGNE {num_ligne}</Text>
              
              <View style={styles.idleRouteCard}>
                <View style={styles.routeRow}>
                  <MapPin color={Colors.success} size={18} strokeWidth={2.5} />
                  <Text style={styles.routeCity}>{isReversed ? ville_arr : ville_dep}</Text>
                </View>
                <View style={styles.routeDivider} />
                <View style={styles.routeRow}>
                  <MapPin color={Colors.danger} size={18} strokeWidth={2.5} />
                  <Text style={styles.routeCity}>{isReversed ? ville_dep : ville_arr}</Text>
                </View>
                
                <TouchableOpacity style={styles.swapBtn} onPress={() => setIsReversed(!isReversed)}>
                  <ArrowUpDown color={Colors.primary} size={18} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>HORAIRE DE DÉPART</Text>
                <TouchableOpacity style={styles.timePicker} onPress={() => setShowPicker(!showPicker)}>
                  <Clock color={Colors.primary} size={20} strokeWidth={2.5} />
                  <Text style={styles.timeValue}>{selHoraire || 'Choisir l\'horaire'}</Text>
                  <ChevronDown color={Colors.textMuted} size={20} />
                </TouchableOpacity>
                
                {showPicker && (
                  <View style={styles.timeDropdown}>
                    {horaires.map(h => (
                      <TouchableOpacity 
                        key={h} 
                        style={[styles.timeItem, selHoraire === h && styles.timeItemActive]}
                        onPress={() => { setSelHoraire(h); setShowPicker(false); }}
                      >
                        <Text style={[styles.timeItemText, selHoraire === h && styles.timeItemTextActive]}>{h}</Text>
                        {selHoraire === h && <CheckCircle color={Colors.primary} size={16} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.startBtn, (starting || !selHoraire) && styles.btnDis]}
                onPress={handleStart}
                disabled={starting || !selHoraire}
              >
                {starting 
                  ? <ActivityIndicator color={Colors.primary} />
                  : <><Play color={Colors.primary} size={24} strokeWidth={3} /><Text style={styles.startBtnText}>Démarrer la mission</Text></>
                }
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  content: { padding: Spacing.xl, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgLight },

  // Service Header
  serviceHeader: {
    backgroundColor: Colors.primary, borderRadius: Radius.xxl,
    padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadow.strong,
  },
  headerDirection: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  directionLabel: { fontSize: 16, fontWeight: '800', color: Colors.white, flex: 1 },
  sensBadge: { backgroundColor: Colors.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  sensBadgeText: { fontSize: 10, fontWeight: '900', color: Colors.primary },

  directionMiniBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  directionMiniText: { fontSize: 10, fontWeight: '900' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill,
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  statusPillText: { fontSize: 11, fontWeight: '900', color: Colors.success, letterSpacing: 1.5 },
  serviceId: { fontSize: 20, fontWeight: '900', color: 'rgba(255, 255, 255, 0.3)', letterSpacing: -0.5 },
  
  headerMain: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  unitBadge: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  unitLabel: { fontSize: 10, color: Colors.accent, fontWeight: '900', letterSpacing: 1.5 },
  unitNum: { fontSize: 22, fontWeight: '900', color: Colors.white, letterSpacing: -0.5, marginTop: 2 },
  headerLine: { width: 1.5, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.15)', marginHorizontal: Spacing.sm },

  // KPI Row
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xl },
  kpiCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, alignItems: 'center', gap: 6, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.bgMid,
  },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  kpiVal: { fontSize: 20, fontWeight: '900', color: Colors.textDark, letterSpacing: -0.5 },
  kpiLbl: { fontSize: 10, color: Colors.textLight, fontWeight: '900', letterSpacing: 1 },

  // Timeline Card
  timelineCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    padding: Spacing.xl, marginBottom: Spacing.xl, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.bgMid,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.xxl },
  cardTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: Colors.textDark, letterSpacing: -0.5 },
  finishedBadge: { backgroundColor: Colors.success + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  finishedText: { fontSize: 10, fontWeight: '900', color: Colors.success, letterSpacing: 1 },

  timeline: { paddingLeft: 4, marginBottom: Spacing.xl },
  tlItem: { flexDirection: 'row', gap: 20 },
  tlLeft: { alignItems: 'center', width: 20 },
  tlDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.white, borderWidth: 3, borderColor: Colors.bgMid, zIndex: 2, marginTop: 6 },
  dotPast: { backgroundColor: Colors.success, borderColor: Colors.success },
  dotCurrent: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, borderColor: Colors.accent, borderWidth: 5, marginTop: 1, ...Shadow.accent },
  tlLine: { width: 3, flex: 1, backgroundColor: Colors.bgMid, marginVertical: -4, zIndex: 1, borderRadius: 1.5 },
  linePast: { backgroundColor: Colors.success },
  tlRight: { flex: 1, paddingBottom: 28 },
  tlStation: { fontSize: 16, color: Colors.textLight, fontWeight: '700' },
  tlStationCur: { color: Colors.textDark, fontWeight: '900', fontSize: 18 },
  tlStationPast: { color: Colors.textMid, fontWeight: '800' },
  curLabel: { fontSize: 12, color: Colors.primary, fontWeight: '900', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  advanceBtn: {
    backgroundColor: Colors.primary, height: 60, borderRadius: Radius.xl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, ...Shadow.strong,
  },
  advanceBtnText: { color: Colors.white, fontWeight: '900', fontSize: 17, letterSpacing: -0.3 },

  // Actions
  actionSection: { gap: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    padding: Spacing.base, borderRadius: Radius.xl, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.bgMid,
  },
  actionIconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  actionBtnText: { flex: 1, fontSize: 16, fontWeight: '800', color: Colors.textDark },
  badgeCount: { backgroundColor: Colors.info, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  badgeText: { color: Colors.white, fontWeight: '900', fontSize: 12 },
  sensLabel: { fontSize: 12, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
  dangerActionBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.danger + '30',
  },
  dangerBtnText: { flex: 1, fontSize: 16, fontWeight: '800', color: Colors.danger },

  // Idle
  idleContainer: { flex: 1, alignItems: 'center', paddingTop: 20 },
  idleIconWrap: { width: 120, height: 120, borderRadius: 32, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, ...Shadow.card, borderWidth: 1, borderColor: Colors.bgMid },
  idleTitle: { fontSize: 26, fontWeight: '900', color: Colors.textDark, letterSpacing: -0.8 },
  idleSub: { fontSize: 14, color: Colors.textLight, fontWeight: '800', marginTop: 4, letterSpacing: 1 },
  
  idleRouteCard: {
    width: '100%', backgroundColor: Colors.white, borderRadius: Radius.xxl,
    padding: Spacing.xl, marginTop: Spacing.xxl, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.bgMid,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  routeCity: { fontSize: 18, fontWeight: '900', color: Colors.textDark },
  routeDivider: { width: 2, height: 32, backgroundColor: Colors.bgMid, marginLeft: 8, marginVertical: 4 },
  swapBtn: { position: 'absolute', right: 24, top: '50%', marginTop: -20, width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgMid, alignItems: 'center', justifyContent: 'center' },

  pickerSection: { width: '100%', marginTop: Spacing.xxl, gap: 12 },
  pickerLabel: { fontSize: 12, fontWeight: '900', color: Colors.textLight, letterSpacing: 1.5 },
  timePicker: { height: 60, borderRadius: Radius.xl, backgroundColor: Colors.bgMid, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl },
  timeValue: { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.textDark, marginLeft: 12 },
  timeDropdown: { marginTop: 8, backgroundColor: Colors.white, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.strong, borderWidth: 1, borderColor: Colors.bgMid },
  timeItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: Colors.bgMid },
  timeItemActive: { backgroundColor: Colors.primary + '05' },
  timeItemText: { fontSize: 17, color: Colors.textMid, fontWeight: '700' },
  timeItemTextActive: { color: Colors.primary, fontWeight: '900' },

  startBtn: {
    backgroundColor: Colors.accent, height: 68, borderRadius: Radius.xxl, width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14,
    marginTop: Spacing.xxxl, ...Shadow.accent,
  },
  startBtnText: { fontSize: 20, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5 },
  btnDis: { opacity: 0.6 },
});

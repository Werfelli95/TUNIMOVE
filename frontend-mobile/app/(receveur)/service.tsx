import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, RefreshControl, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Play, Square, Ticket, ClipboardList, AlertTriangle, X,
  Clock, TrendingUp, Bus, Navigation, MapPin, ChevronRight,
  ChevronDown, CheckCircle
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow } from '../../constants/theme';

const BASE = 'http://localhost:5000/api/receveur-service';
const NET = 'http://localhost:5000/api/network';

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
  const ville_dep   = params.ville_depart as string;
  const ville_arr   = params.ville_arrivee as string;
  const num_ligne   = params.num_ligne as string;

  const [svc, setSvc]           = useState<ActiveService | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRef]    = useState(false);
  const [starting, setStarting] = useState(false);
  const [advancing, setAdv]     = useState(false);
  const [closing, setClosing]   = useState(false);
  const [stations, setStations] = useState<string[]>([]);
  const [horaires, setHoraires] = useState<string[]>([]);
  const [selHoraire, setSelHoraire] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [incModal, setIncModal] = useState(false);
  const [incRaison, setIncRaison] = useState('');

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
            // Hours
            setHoraires(ligne.horaires || []);
            if (!selHoraire && ligne.horaires?.length > 0) setSelHoraire(ligne.horaires[0]);

            // Stations
            const list = [...(ligne.stations || [])].sort((a: any, b: any) => a.distance_km - b.distance_km);
            if (!list.some((s: any) => s.arret.toLowerCase() === ligne.ville_depart.toLowerCase()))
              list.unshift({ arret: ligne.ville_depart, distance_km: 0 });
            if (!list.some((s: any) => s.arret.toLowerCase() === ligne.ville_arrivee.toLowerCase()))
              list.push({ arret: ligne.ville_arrivee, distance_km: 9999 });
            setStations(list.map((s: any) => s.arret));
          }
        } catch { /**/ }
      }
    } catch { setSvc(null); }
    finally { setLoading(false); setRef(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  // ── Duration ──
  const elapsedMin = svc
    ? Math.max(0, Math.floor((Date.now() - new Date(svc.date_debut).getTime()) / 60000))
    : 0;
  const durLabel = elapsedMin >= 60
    ? `${Math.floor(elapsedMin / 60)}h ${elapsedMin % 60}min`
    : `${elapsedMin}min`;

  // ── Station progress ──
  const currentIdx = stations.findIndex(s => s.toLowerCase().trim() === (svc?.station_actuelle ?? '').toLowerCase().trim());
  let nextStation: string | null = null;
  let isLastStop = false;

  if (!svc?.voyage_complet) {
    if (currentIdx >= 0 && currentIdx < stations.length - 1) {
      nextStation = stations[currentIdx + 1];
      isLastStop = (currentIdx === stations.length - 2);
    } else if (currentIdx === -1 && stations.length > 0) {
      nextStation = stations[0];
      isLastStop = (stations.length === 1);
    }
  }

  // ── Handlers ──
  const handleStart = () => {
    if (!selHoraire && horaires.length > 0) {
        Alert.alert('Horaire requis', 'Veuillez sélectionner un horaire de départ.');
        return;
    }
    const msg = `Démarrer le service de ${selHoraire || 'votre choix'} pour le Bus N° ${numero_bus} ?`;
    const proceed = async () => {
      setStarting(true);
      try {
        const r = await axios.post<any>(`${BASE}/start`, { numero_bus, horaire: selHoraire });
        const s = r.data.service as ActiveService;
        setSvc({ ...s, nb_tickets: 0, recette: 0 });
        if (Platform.OS === 'web') window.alert(`✅ Service #${s.id_service} démarré.`);
        else Alert.alert('✅ Service démarré', `Service #${s.id_service} démarré.`);
      } catch (e: any) {
        if (Platform.OS === 'web') window.alert('Erreur: ' + (e.response?.data?.message ?? 'Impossible de démarrer'));
        else Alert.alert('Erreur', e.response?.data?.message ?? 'Impossible de démarrer');
      } finally { setStarting(false); }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(msg)) proceed();
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
    const msg = `Confirmer l'arrivée à ${nextStation} ?${isLastStop ? '\nLe voyage sera marqué comme terminé.' : ''}`;
    
    const proceed = async () => {
      setAdv(true);
      try {
        const r = await axios.post<any>(`${BASE}/${svc.id_service}/avancer`, {
          prochaine_station: nextStation,
          est_derniere: isLastStop,
        });
        const up = r.data.service;
        setSvc(prev => prev ? { ...prev, station_actuelle: up.station_actuelle, voyage_complet: up.voyage_complet } : null);
        if (isLastStop) {
          const m = `🏁 Voyage terminé ! Vous êtes à ${nextStation}. Vous pouvez clôturer le service.`;
          if (Platform.OS === 'web') window.alert(m);
          else Alert.alert('🏁 Voyage terminé !', m);
        }
      } catch (e: any) {
        if (Platform.OS === 'web') window.alert('Erreur: ' + (e.response?.data?.message ?? 'Erreur mise à jour'));
        else Alert.alert('Erreur', e.response?.data?.message ?? 'Erreur mise à jour');
      } finally { setAdv(false); }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(title + '\n\n' + msg)) proceed();
    } else {
      Alert.alert(title, msg, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: proceed }
      ]);
    }
  };

  const handleClose = async (raison?: string) => {
    if (!svc) return;
    setClosing(true);
    try {
      const r = await axios.post<any>(`${BASE}/${svc.id_service}/close`, raison ? { raison_incident: raison } : {});
      setSvc(null);
      setIncModal(false);
      if (Platform.OS === 'web') window.alert('✅ Service clôturé: ' + r.data.message);
      else Alert.alert('✅ Service clôturé', r.data.message);
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert('Erreur: ' + (e.response?.data?.message ?? 'Impossible de clôturer'));
      else Alert.alert('Erreur', e.response?.data?.message ?? 'Impossible de clôturer');
    } finally { setClosing(false); }
  };

  const navParams = {
    nom, prenom, numero_bus,
    ville_depart: svc?.station_actuelle || svc?.ville_depart || ville_dep,
    ville_arrivee: svc?.ville_arrivee || ville_arr,
    num_ligne: svc ? String(svc.num_ligne) : num_ligne,
    service_id: svc ? String(svc.id_service) : '',
    horaire: svc?.horaire || '',
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
          /* ══════════ ACTIVE SERVICE ══════════ */
          <>
            {/* ── Service Header ── */}
            <View style={styles.serviceHeader}>
              <View style={styles.serviceHeaderTop}>
                <View style={styles.activePill}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activePillText}>EN SERVICE</Text>
                </View>
                <Text style={styles.serviceNum}>#{svc.id_service}</Text>
              </View>
              <View style={styles.serviceHeaderInfo}>
                <View style={styles.sInfoItem}>
                  <Bus color={Colors.accent} size={14} />
                  <Text style={styles.sInfoText}>Bus {svc.numero_bus}</Text>
                </View>
                <View style={styles.sInfoDot} />
                <View style={styles.sInfoItem}>
                  <Navigation color={Colors.accent} size={14} />
                  <Text style={styles.sInfoText}>Ligne {svc.num_ligne}</Text>
                </View>
                <View style={styles.sInfoDot} />
                <View style={styles.sInfoItem}>
                  <Clock color={Colors.accent} size={14} />
                  <Text style={styles.sInfoText}>
                    {new Date(svc.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── KPI Cards ── */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Clock color={Colors.primary} size={18} />
                <Text style={styles.kpiVal}>{durLabel}</Text>
                <Text style={styles.kpiLbl}>Durée</Text>
              </View>
              <View style={styles.kpiCard}>
                <Ticket color={Colors.warning} size={18} />
                <Text style={styles.kpiVal}>{svc.nb_tickets}</Text>
                <Text style={styles.kpiLbl}>Billets</Text>
              </View>
              <View style={styles.kpiCard}>
                <TrendingUp color={Colors.success} size={18} />
                <Text style={styles.kpiVal}>{parseFloat(String(svc.recette)).toFixed(1)}</Text>
                <Text style={styles.kpiLbl}>TND</Text>
              </View>
            </View>

            {/* ── Route Progress ── */}
            <View style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <MapPin color={Colors.primary} size={16} />
                <Text style={styles.routeTitle}>Progression du trajet</Text>
                {svc.voyage_complet && (
                  <View style={styles.doneBadge}>
                    <CheckCircle color={Colors.success} size={12} />
                    <Text style={styles.doneBadgeText}>Terminé</Text>
                  </View>
                )}
              </View>



              {stations.length > 0 && (
                <View style={styles.timeline}>
                  {stations.map((st, i) => {
                    const isPast = (currentIdx >= 0 && i < currentIdx) || svc.voyage_complet;
                    const isCur = st === svc.station_actuelle && !svc.voyage_complet;
                    const isNext = i === currentIdx + 1 && !svc.voyage_complet;
                    const isLast = i === stations.length - 1;

                    return (
                      <View key={st} style={styles.tlItem}>
                        <View style={styles.tlLeft}>
                          <View style={[
                            styles.tlDot,
                            isPast && !isCur && styles.dotDone,
                            isCur && styles.dotCur,
                            isNext && styles.dotNext,
                          ]} />
                          {!isLast && <View style={[styles.tlLine, (isPast && !isCur) && styles.lineDone]} />}
                        </View>
                        <View style={styles.tlContent}>
                          <Text style={[
                            styles.tlStation,
                            isCur && styles.tlCur,
                            isPast && !isCur && styles.tlPast,
                            isNext && styles.tlNext,
                          ]}>
                            {st}
                            {isCur ? ' ← ici' : ''}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Avancer Button */}
              {!svc.voyage_complet && nextStation && (
                <TouchableOpacity
                  style={[styles.avancerBtn, advancing && styles.btnDisabled]}
                  onPress={handleAvancer}
                  disabled={advancing}
                >
                  {advancing
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <><ChevronRight color={Colors.white} size={18} /><Text style={styles.avancerBtnText}>
                        {isLastStop ? '🏁 Arriver à destination' : `Prochaine : ${nextStation}`}
                      </Text></>
                  }
                </TouchableOpacity>
              )}
            </View>

            {/* ── Action Buttons ── */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push({ pathname: '/(receveur)/manifeste', params: navParams })}
            >
              <ClipboardList color={Colors.info} size={20} />
              <Text style={styles.secondaryBtnText}>Manifeste ({svc.nb_tickets} passager{svc.nb_tickets !== 1 ? 's' : ''})</Text>
              <ChevronRight color={Colors.info} size={16} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            {/* Close / Incident */}
            {svc.voyage_complet ? (
              <TouchableOpacity
                style={[styles.closeBtn, closing && styles.btnDisabled]}
                onPress={() => handleClose()}
                disabled={closing}
              >
                {closing
                  ? <ActivityIndicator color={Colors.white} />
                  : <><Square color={Colors.white} size={18} /><Text style={styles.closeBtnText}>Clôturer le service</Text></>
                }
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.incidentBtn}
                onPress={() => setIncModal(true)}
              >
                <AlertTriangle color={Colors.danger} size={18} />
                <Text style={styles.incidentBtnText}>Terminer pour incident</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          /* ══════════ NO SERVICE ══════════ */
          <>
            <View style={styles.idleCard}>
              <View style={styles.idleIconWrap}>
                <Bus color={Colors.textLight} size={48} />
              </View>
              <Text style={styles.idleTitle}>Aucun service actif</Text>
              <Text style={styles.idleSub}>Bus N° {numero_bus}</Text>
              <Text style={styles.idleRoute}>{ville_dep} → {ville_arr}</Text>
              
              <View style={{ width: '100%', marginTop: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>
                    Horaire de départ
                </Text>
                <TouchableOpacity 
                    style={[styles.picker, { borderColor: Colors.primary }]} 
                    onPress={() => setShowPicker(!showPicker)}
                >
                    <Clock size={18} color={Colors.primary} />
                    <Text style={{ flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '700', color: Colors.textDark }}>
                        {selHoraire || 'Sélectionner l\'heure...'}
                    </Text>
                    <ChevronDown size={20} color={Colors.textMuted} />
                </TouchableOpacity>
                {showPicker && (
                    <View style={styles.horairesDropdown}>
                        {horaires.map(h => (
                            <TouchableOpacity 
                                key={h} 
                                style={[styles.hStep, selHoraire === h && styles.hStepActive]}
                                onPress={() => { setSelHoraire(h); setShowPicker(false); }}
                            >
                                <Text style={[styles.hStepText, selHoraire === h && styles.hStepTextActive]}>{h}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
              </View>

              <Text style={[styles.idleHint, { marginTop: 20 }]}>
                Démarrez un service pour commencer à vendre des billets et suivre les passagers.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.startBtn, (starting || !selHoraire) && styles.btnDisabled]}
              onPress={handleStart}
              disabled={starting || !selHoraire}
            >
              {starting
                ? <ActivityIndicator color={Colors.primary} />
                : <><Play color={Colors.primary} size={22} /><Text style={styles.startBtnText}>Démarrer le service</Text></>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── Incident Close Modal ── */}
      <Modal visible={incModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeaderRow}>
              <AlertTriangle color={Colors.danger} size={22} />
              <Text style={styles.modalTitle}>Clôture pour incident</Text>
              <TouchableOpacity onPress={() => setIncModal(false)} style={styles.modalClose}>
                <X color={Colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Décrivez l'incident pour autoriser la clôture anticipée du service :
            </Text>
            <TextInput
              style={styles.incidentInput}
              placeholder="Ex: panne moteur, accident, malaise passager..."
              value={incRaison}
              onChangeText={setIncRaison}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={Colors.textLight}
            />
            <TouchableOpacity
              style={[styles.modalConfirm, (!incRaison.trim() || closing) && styles.btnDisabled]}
              onPress={() => handleClose(incRaison.trim())}
              disabled={!incRaison.trim() || closing}
            >
              {closing
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.modalConfirmText}>Clôturer pour incident</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  content: { padding: Spacing.base, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgLight },

  // Service Header
  serviceHeader: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.strong,
  },
  serviceHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.success + '30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  activePillText: { fontSize: 12, fontWeight: '800', color: Colors.success, letterSpacing: 1 },
  serviceNum: { fontSize: 24, fontWeight: '900', color: Colors.white },
  serviceHeaderInfo: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm },
  sInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sInfoText: { fontSize: 14, color: Colors.white + 'CC', fontWeight: '700' },
  sInfoDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.white + '50' },

  // KPI
  kpiRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  kpiCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 4, ...Shadow.card,
  },
  kpiVal: { fontSize: 20, fontWeight: '900', color: Colors.textDark },
  kpiLbl: { fontSize: 12, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Route
  routeCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.card,
  },
  routeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  routeTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: Colors.textDark },
  doneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill,
  },
  doneBadgeText: { fontSize: 13, fontWeight: '800', color: Colors.success },
  dirRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  dirFrom: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  dirTo: { fontSize: 15, fontWeight: '800', color: Colors.danger },

  // Timeline
  timeline: { gap: 0 },
  tlItem: { flexDirection: 'row', gap: 10 },
  tlLeft: { alignItems: 'center', width: 18 },
  tlDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.bgMid, borderWidth: 2, borderColor: Colors.border, marginTop: 2,
  },
  dotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  dotCur: { backgroundColor: Colors.primary, borderColor: Colors.primary, width: 18, height: 18, borderRadius: 9, marginTop: 0 },
  dotNext: { borderColor: Colors.primary, borderStyle: 'dashed' },
  tlLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginTop: 2, marginBottom: 2 },
  lineDone: { backgroundColor: Colors.success },
  tlContent: { flex: 1, paddingBottom: 16, paddingTop: 0 },
  tlStation: { fontSize: 15, color: Colors.textMuted, fontWeight: '600' },
  tlCur: { color: Colors.primary, fontWeight: '800', fontSize: 16 },
  tlPast: { color: Colors.success, fontWeight: '700' },
  tlNext: { color: Colors.primary, fontWeight: '700' },

  avancerBtn: {
    backgroundColor: Colors.primary, height: 44, borderRadius: Radius.md, marginTop: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  avancerBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },

  // Action Buttons
  primaryBtn: {
    backgroundColor: Colors.accent, height: 56, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base,
    gap: 10, marginBottom: Spacing.sm, ...Shadow.accent,
  },
  primaryBtnText: { fontSize: 17, fontWeight: '800', color: Colors.primary, flex: 1 },

  secondaryBtn: {
    backgroundColor: Colors.white, height: 52, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base,
    gap: 10, marginBottom: Spacing.md, ...Shadow.card,
    borderWidth: 1.5, borderColor: Colors.infoLight,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '800', color: Colors.info, flex: 1 },

  closeBtn: {
    backgroundColor: Colors.success, height: 50, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginBottom: Spacing.sm,
  },
  closeBtnText: { fontSize: 17, fontWeight: '800', color: Colors.white },

  incidentBtn: {
    height: 48, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.danger + '50',
    backgroundColor: Colors.dangerLight,
  },
  incidentBtnText: { fontSize: 15, fontWeight: '800', color: Colors.danger },

  btnDisabled: { opacity: 0.5 },

  // Idle
  idleCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg, ...Shadow.card,
  },
  idleIconWrap: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: Colors.bgMid, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  idleTitle: { fontSize: 22, fontWeight: '800', color: Colors.textMid, marginBottom: 4 },
  idleSub: { fontSize: 16, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  idleRoute: { fontSize: 15, color: Colors.textMuted, marginBottom: Spacing.md },
  idleHint: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  startBtn: {
    backgroundColor: Colors.accent, height: 60, borderRadius: Radius.xl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, ...Shadow.accent,
  },
  startBtnText: { fontSize: 19, fontWeight: '800', color: Colors.primary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, paddingBottom: 40,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.base },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.sm },
  modalTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: Colors.textDark },
  modalClose: { padding: 4 },
  modalSub: { fontSize: 15, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 20 },
  incidentInput: {
    borderWidth: 1.5, borderColor: Colors.danger + '50', borderRadius: Radius.md,
    padding: Spacing.md, fontSize: 16, color: Colors.textDark,
    backgroundColor: Colors.dangerLight + '30', minHeight: 90, marginBottom: Spacing.base,
  },
  modalConfirm: {
    backgroundColor: Colors.danger, height: 52, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  modalConfirmText: { color: Colors.white, fontWeight: '800', fontSize: 17 },
  
  // Custom horaires picker styles
  picker: {
    height: 52, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
  },
  horairesDropdown: {
    marginTop: 8, backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.primary + '30', overflow: 'hidden',
  },
  hStep: { padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  hStepActive: { backgroundColor: Colors.primary + '10' },
  hStepText: { fontSize: 15, color: Colors.textMid, fontWeight: '600' },
  hStepTextActive: { color: Colors.primary, fontWeight: '800' },
});

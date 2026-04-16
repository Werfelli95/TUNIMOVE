import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, RefreshControl, Modal, TextInput
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Play, Square, Ticket, ClipboardList, Clock, Bus, TrendingUp, MapPin, ChevronRight, AlertTriangle, X } from 'lucide-react-native';
import axios from 'axios';

const BASE = 'http://localhost:5000/api/receveur-service';

interface ActiveService {
  id_service: number;
  num_ligne: string | number;
  date_service: string;
  statut: string;
  date_debut: string;
  station_actuelle: string | null;
  voyage_complet: boolean;
  numero_bus: string;
  capacite: number;
  ville_depart: string;
  ville_arrivee: string;
  nb_tickets: number;
  recette: number;
}

export default function ServiceScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const numero_bus = params.numero_bus as string;
  const nom = params.nom as string;
  const prenom = params.prenom as string;
  const ville_depart = params.ville_depart as string;
  const ville_arrivee = params.ville_arrivee as string;

  const [activeService, setActiveService] = useState<ActiveService | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stations, setStations] = useState<string[]>([]);
  const [incidentModal, setIncidentModal] = useState(false);
  const [incidentRaison, setIncidentRaison] = useState('');

  const fetchActiveService = async () => {
    try {
      const res = await axios.get<ActiveService | null>(`${BASE}/active/${encodeURIComponent(numero_bus)}`);
      setActiveService(res.data);
      // Load stations from network if service is active
      if (res.data?.num_ligne) {
        try {
          const netRes = await axios.get<any[]>('http://localhost:5000/api/network');
          const ligne = netRes.data.find((l: any) => String(l.num_ligne) === String(res.data!.num_ligne));
          if (ligne) {
            const list = [...(ligne.stations || [])].sort((a: any, b: any) => a.distance_km - b.distance_km);
            const hasStart = list.some((s: any) => s.arret.toLowerCase() === ligne.ville_depart.toLowerCase());
            if (!hasStart) list.unshift({ arret: ligne.ville_depart, distance_km: 0 });
            setStations(list.map((s: any) => s.arret));
          }
        } catch { /* ignore */ }
      }
    } catch {
      setActiveService(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchActiveService(); }, []));

  const handleStart = async () => {
    Alert.alert(
      '🚌 Démarrer le service',
      `Démarrer un nouveau service pour le Bus Nº ${numero_bus} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Démarrer', onPress: async () => {
            setStarting(true);
            try {
              const res = await axios.post(`${BASE}/start`, { numero_bus });
              const { service } = res.data as { service: ActiveService };
              setActiveService({ ...service, nb_tickets: 0, recette: 0 });
              Alert.alert('✅ Service démarré', `Service #${service.id_service} démarré avec succès !`);
            } catch (err: any) {
              Alert.alert('Erreur', err.response?.data?.message || 'Impossible de démarrer le service');
            } finally {
              setStarting(false);
            }
          }
        }
      ]
    );
  };

  const handleClose = async (raison_incident?: string) => {
    if (!activeService) return;
    setClosing(true);
    try {
      const body = raison_incident ? { raison_incident } : {};
      const res = await axios.post(`${BASE}/${activeService.id_service}/close`, body);
      setActiveService(null);
      setIncidentModal(false);
      Alert.alert('✅ Service clôturé', (res.data as any).message);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Impossible de clôturer';
      Alert.alert('Erreur', msg);
    } finally {
      setClosing(false);
    }
  };

  const handleAvancer = async () => {
    if (!activeService || stations.length === 0) return;
    const idx = stations.indexOf(activeService.station_actuelle || '');
    const nextIdx = idx + 1;
    if (nextIdx >= stations.length) return;
    const prochaine = stations[nextIdx];
    const estDerniere = nextIdx === stations.length - 1;

    Alert.alert(
      estDerniere ? '🏁 Destination finale' : '➡️ Prochaine station',
      `Marquer l'arrivée à ${prochaine} ?${estDerniere ? '\nLe voyage sera terminé.' : ''}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer', onPress: async () => {
            setAdvancing(true);
            try {
              const res = await axios.post(`${BASE}/${activeService.id_service}/avancer`,
                { prochaine_station: prochaine, est_derniere: estDerniere }
              );
              const updated = (res.data as any).service;
              setActiveService(prev => prev ? {
                ...prev,
                station_actuelle: updated.station_actuelle,
                voyage_complet: updated.voyage_complet
              } : null);
              if (estDerniere) {
                Alert.alert('🏁 Voyage terminé !', `Le bus est arrivé à ${prochaine}.\nVous pouvez maintenant clôturer le service.`);
              }
            } catch (err: any) {
              Alert.alert('Erreur', err.response?.data?.message || 'Erreur mise à jour station');
            } finally {
              setAdvancing(false);
            }
          }
        }
      ]
    );
  };

  const navParams = {
    nom, prenom, numero_bus,
    ville_depart, ville_arrivee,
    service_id: activeService ? String(activeService.id_service) : '',
    num_ligne: activeService ? String(activeService.num_ligne) : '',
  };

  const elapsed = activeService
    ? Math.floor((Date.now() - new Date(activeService.date_debut).getTime()) / 60000)
    : 0;
  const hours = Math.floor(elapsed / 60);
  const mins = elapsed % 60;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3a52" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchActiveService(); }} />}
      >
        {activeService ? (
          /* ── ACTIVE SERVICE VIEW ── */
          <>
            <View style={styles.activeBanner}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBannerText}>Service en cours</Text>
              <Text style={styles.serviceId}>#{activeService.id_service}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Clock color="#1a3a52" size={22} />
                <Text style={styles.statValue}>{hours > 0 ? `${hours}h ` : ''}{mins}min</Text>
                <Text style={styles.statLabel}>Durée</Text>
              </View>
              <View style={styles.statBox}>
                <Ticket color="#d97706" size={22} />
                <Text style={styles.statValue}>{activeService.nb_tickets}</Text>
                <Text style={styles.statLabel}>Billets</Text>
              </View>
              <View style={styles.statBox}>
                <TrendingUp color="#16a34a" size={22} />
                <Text style={styles.statValue}>{parseFloat(String(activeService.recette)).toFixed(0)}</Text>
                <Text style={styles.statLabel}>TND</Text>
              </View>
            </View>

            {/* Station progress */}
            <View style={styles.stationCard}>
              <View style={styles.stationHeader}>
                <MapPin color="#1a3a52" size={18} />
                <Text style={styles.stationTitle}>Progression du voyage</Text>
                {activeService.voyage_complet && (
                  <View style={styles.voyageBadge}>
                    <Text style={styles.voyageBadgeTxt}>✅ Terminé</Text>
                  </View>
                )}
              </View>

              {/* Station list */}
              {stations.map((st, i) => {
                const isCurrent = st === activeService.station_actuelle;
                const isPast = stations.indexOf(activeService.station_actuelle || '') > i || activeService.voyage_complet;
                const isLast = i === stations.length - 1;
                return (
                  <View key={st} style={styles.stationItem}>
                    <View style={styles.stationDotCol}>
                      <View style={[styles.stationDot,
                        isCurrent && styles.dotCurrent,
                        isPast && !isCurrent && styles.dotPast
                      ]} />
                      {!isLast && <View style={[styles.stationLine, isPast && styles.linePast]} />}
                    </View>
                    <Text style={[styles.stationName,
                      isCurrent && styles.stationNameCurrent,
                      isPast && !isCurrent && styles.stationNamePast
                    ]}>{st}{isCurrent ? ' ← (ici)' : ''}</Text>
                  </View>
                );
              })}

              {/* Avancer button */}
              {!activeService.voyage_complet && stations.length > 0 && (
                <TouchableOpacity
                  style={[styles.avancerBtn, advancing && styles.btnDisabled]}
                  onPress={handleAvancer}
                  disabled={advancing}
                >
                  {advancing ? <ActivityIndicator color="#fff" size="small" /> : (
                    <>
                      <ChevronRight color="#fff" size={20} />
                      <Text style={styles.avancerBtnTxt}>
                        {activeService.station_actuelle === stations[stations.length - 2]
                          ? '🏁 Arriver à destination'
                          : 'Prochaine station'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Action buttons */}
            <TouchableOpacity
              style={styles.sellBtn}
              onPress={() => router.push({ pathname: '/(receveur)/vente', params: navParams })}
            >
              <Ticket color="#1a3a52" size={22} />
              <Text style={styles.sellBtnText}>Vendre un billet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manifesteBtn}
              onPress={() => router.push({ pathname: '/(receveur)/manifeste', params: { ...navParams, service_id: String(activeService.id_service) } })}
            >
              <ClipboardList color="#0284c7" size={22} />
              <Text style={styles.manifesteBtnText}>Voir le manifeste ({activeService.nb_tickets})</Text>
            </TouchableOpacity>

            {/* Close — only if voyage complete */}
            {activeService.voyage_complet ? (
              <TouchableOpacity
                style={[styles.closeBtn, closing && styles.btnDisabled]}
                onPress={() => handleClose()}
                disabled={closing}
              >
                {closing ? <ActivityIndicator color="#fff" /> : (
                  <><Square color="#fff" size={20} /><Text style={styles.closeBtnText}>Clôturer le service</Text></>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.incidentBtn}
                onPress={() => setIncidentModal(true)}
              >
                <AlertTriangle color="#dc2626" size={20} />
                <Text style={styles.incidentBtnTxt}>Terminer pour incident</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          /* ── NO ACTIVE SERVICE ── */
          <>
            <View style={styles.idleCard}>
              <Bus color="#cbd5e1" size={72} />
              <Text style={styles.idleTitle}>Aucun service en cours</Text>
              <Text style={styles.idleSub}>Bus Nº {numero_bus} · {ville_depart} → {ville_arrivee}</Text>
              <Text style={styles.idleHint}>Démarrez un service pour commencer la vente de billets.</Text>
            </View>

            <TouchableOpacity
              style={[styles.startBtn, starting && styles.btnDisabled]}
              onPress={handleStart}
              disabled={starting}
            >
              {starting ? <ActivityIndicator color="#1a3a52" /> : (
                <>
                  <Play color="#1a3a52" size={24} />
                  <Text style={styles.startBtnText}>Démarrer le service</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── Incident Modal ── */}
      <Modal visible={incidentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <AlertTriangle color="#dc2626" size={26} />
              <Text style={styles.modalTitle}>Signaler un incident</Text>
              <TouchableOpacity onPress={() => setIncidentModal(false)} style={{ marginLeft: 'auto' }}>
                <X color="#64748b" size={22} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtext}>Décrivez l'incident pour autoriser la clôture anticipée du service :</Text>

            <TextInput
              style={styles.incidentInput}
              placeholder="Ex: panne moteur, accident, passager malaise..."
              placeholderTextColor="#94a3b8"
              value={incidentRaison}
              onChangeText={setIncidentRaison}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.modalConfirmBtn, (!incidentRaison.trim() || closing) && styles.btnDisabled]}
              disabled={!incidentRaison.trim() || closing}
              onPress={() => handleClose(incidentRaison.trim())}
            >
              {closing ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.modalConfirmTxt}>Clôturer pour incident</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  activeBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#dcfce7', borderRadius: 16,
    padding: 14, marginBottom: 16,
  },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#16a34a', marginRight: 10 },
  activeBannerText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#15803d' },
  serviceId: { fontSize: 18, fontWeight: '900', color: '#166534' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },

  // Station tracker
  stationCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  stationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  stationTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#334155' },
  voyageBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  voyageBadgeTxt: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  stationItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 2 },
  stationDotCol: { alignItems: 'center', width: 20 },
  stationDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#e2e8f0', borderWidth: 2, borderColor: '#cbd5e1' },
  dotCurrent: { backgroundColor: '#1a3a52', borderColor: '#1a3a52', width: 18, height: 18, borderRadius: 9 },
  dotPast: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  stationLine: { width: 2, height: 22, backgroundColor: '#e2e8f0', marginTop: 2 },
  linePast: { backgroundColor: '#16a34a' },
  stationName: { fontSize: 13, color: '#94a3b8', paddingTop: 1, paddingBottom: 22 },
  stationNameCurrent: { color: '#1a3a52', fontWeight: '800', fontSize: 14 },
  stationNamePast: { color: '#16a34a', fontWeight: '600' },

  avancerBtn: {
    backgroundColor: '#1a3a52', height: 46, borderRadius: 12, marginTop: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  avancerBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  infoCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { fontSize: 14, color: '#475569', marginLeft: 10 },
  infoBold: { fontWeight: '700', color: '#1e293b' },

  sellBtn: {
    backgroundColor: '#fbbf24', height: 60, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12,
    shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  sellBtnText: { fontSize: 17, fontWeight: '800', color: '#1a3a52' },

  manifesteBtn: {
    backgroundColor: '#e0f2fe', height: 52, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16,
    borderWidth: 1, borderColor: '#bae6fd',
  },
  manifesteBtnText: { fontSize: 15, fontWeight: '700', color: '#0284c7' },

  closeBtn: {
    backgroundColor: '#16a34a', height: 52, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  closeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  incidentBtn: {
    height: 48, borderRadius: 16, borderWidth: 2, borderColor: '#fca5a5',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff5f5',
  },
  incidentBtnTxt: { fontSize: 14, fontWeight: '700', color: '#dc2626' },

  btnDisabled: { opacity: 0.6 },

  idleCard: {
    alignItems: 'center', backgroundColor: '#fff', borderRadius: 24,
    padding: 40, marginBottom: 24,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  idleTitle: { fontSize: 20, fontWeight: '700', color: '#334155', marginTop: 20 },
  idleSub: { fontSize: 14, color: '#64748b', marginTop: 6 },
  idleHint: { fontSize: 13, color: '#94a3b8', marginTop: 12, textAlign: 'center', lineHeight: 20 },

  startBtn: {
    backgroundColor: '#fbbf24', height: 64, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14,
    shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  startBtnText: { fontSize: 18, fontWeight: '800', color: '#1a3a52' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24,
  },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#1e293b', marginLeft: 10 },
  modalSubtext: { fontSize: 14, color: '#64748b', marginBottom: 12, lineHeight: 20 },
  incidentInput: {
    borderWidth: 1, borderColor: '#fca5a5', borderRadius: 12, padding: 14,
    fontSize: 14, color: '#1e293b', backgroundColor: '#fff5f5',
    minHeight: 100, marginBottom: 16,
  },
  modalConfirmBtn: {
    backgroundColor: '#dc2626', height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  modalConfirmTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Play, Ticket, Users, AlertTriangle, Square, LogOut,
  Bus, MapPin, Clock, TrendingUp, ChevronRight, Navigation
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme';

const BASE = 'http://localhost:5000/api/receveur-service';

interface ActiveService {
  id_service: number;
  num_ligne: string;
  station_actuelle: string | null;
  voyage_complet: boolean;
  date_debut: string;
  ville_depart: string;
  ville_arrivee: string;
  nb_tickets: number;
  recette: number;
}

export default function ReceveurDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const nom = params.nom as string;
  const prenom = params.prenom as string;
  const numero_bus = params.numero_bus as string;
  const ville_depart = params.ville_depart as string;
  const ville_arrivee = params.ville_arrivee as string;
  const num_ligne = params.num_ligne as string;

  const [activeService, setActiveService] = useState<ActiveService | null>(null);
  const [loadingSvc, setLoadingSvc] = useState(true);

  const navParams = {
    nom, prenom, numero_bus, ville_depart, ville_arrivee, num_ligne,
    service_id: activeService ? String(activeService.id_service) : '',
  };

  const fetchService = async () => {
    if (!numero_bus) { setLoadingSvc(false); return; }
    try {
      const r = await axios.get<ActiveService | null>(`${BASE}/active/${encodeURIComponent(numero_bus)}`);
      setActiveService(r.data);
    } catch { setActiveService(null); }
    finally { setLoadingSvc(false); }
  };

  useFocusEffect(useCallback(() => { setLoadingSvc(true); fetchService(); }, []));

  const elapsed = activeService
    ? Math.floor((Date.now() - new Date(activeService.date_debut).getTime()) / 60000)
    : 0;
  const elapsedLabel = elapsed >= 60
    ? `${Math.floor(elapsed / 60)}h ${elapsed % 60}min`
    : `${elapsed}min`;

  const handleLogout = () => {
    const logoutAction = () => {
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      if (confirm('Voulez-vous vous déconnecter ?')) {
        logoutAction();
      }
    } else {
      Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: logoutAction },
      ]);
    }
  };

  const goService = () => router.push({ pathname: '/(receveur)/service', params: navParams });
  const goVente = () => {
    if (!activeService) {
      Alert.alert('Service inactif', 'Démarrez un service avant d\'émettre un billet.');
      return;
    }
    router.push({ pathname: '/(receveur)/vente', params: { ...navParams, service_id: String(activeService.id_service) } });
  };
  const goManifeste = () => {
    if (!activeService) {
      Alert.alert('Service inactif', 'Il n\'y a pas de service actif.');
      return;
    }
    router.push({ pathname: '/(receveur)/manifeste', params: { ...navParams, service_id: String(activeService.id_service) } });
  };

  const hasAssignment = !!numero_bus;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.topAvatar}>
            <Text style={styles.topAvatarText}>{(prenom?.[0] ?? 'R').toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.topGreeting}>Bonjour,</Text>
            <Text style={styles.topName}>{prenom} {nom}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={handleLogout}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <LogOut color={Colors.textMuted} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Assignment Card ── */}
        {hasAssignment ? (
          <View style={styles.assignCard}>
            <View style={styles.assignTop}>
              <View style={styles.assignIcon}>
                <Bus color={Colors.white} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.assignBusLabel}>BUS AFFECTÉ</Text>
                <Text style={styles.assignBus}>N° {numero_bus}</Text>
              </View>
              <View style={[styles.statusBadge, activeService ? styles.statusActive : styles.statusIdle]}>
                <View style={[styles.statusDot, { backgroundColor: activeService ? Colors.success : Colors.textMuted }]} />
                <Text style={[styles.statusText, { color: activeService ? Colors.success : Colors.textMuted }]}>
                  {activeService ? 'En service' : 'Inactif'}
                </Text>
              </View>
            </View>
            <View style={styles.assignDivider} />
            <View style={styles.assignRow}>
              <View style={styles.assignItem}>
                <Navigation color={Colors.primaryLight} size={14} />
                <Text style={styles.assignItemLabel}>Ligne</Text>
                <Text style={styles.assignItemValue}>{num_ligne || '—'}</Text>
              </View>
              <View style={styles.assignSep} />
              <View style={styles.assignItem}>
                <MapPin color={Colors.primaryLight} size={14} />
                <Text style={styles.assignItemLabel}>Trajet</Text>
                <Text style={styles.assignItemValue} numberOfLines={1}>
                  {ville_depart || '—'} → {ville_arrivee || '—'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noAssignCard}>
            <Bus color={Colors.textLight} size={40} />
            <Text style={styles.noAssignTitle}>Aucune affectation</Text>
            <Text style={styles.noAssignSub}>Contactez votre responsable pour être affecté à une ligne.</Text>
          </View>
        )}

        {/* ── Service KPIs (only when active) ── */}
        {activeService && (
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Clock color={Colors.primary} size={18} />
              <Text style={styles.kpiValue}>{elapsedLabel}</Text>
              <Text style={styles.kpiLabel}>Durée</Text>
            </View>
            <View style={styles.kpiCard}>
              <Ticket color={Colors.warning} size={18} />
              <Text style={styles.kpiValue}>{activeService.nb_tickets}</Text>
              <Text style={styles.kpiLabel}>Billets</Text>
            </View>
            <View style={styles.kpiCard}>
              <TrendingUp color={Colors.success} size={18} />
              <Text style={styles.kpiValue}>{parseFloat(String(activeService.recette)).toFixed(1)}</Text>
              <Text style={styles.kpiLabel}>TND</Text>
            </View>
          </View>
        )}

        {/* ── Current Stop Banner (active service) ── */}
        {activeService?.station_actuelle && (
          <View style={styles.stopBanner}>
            <MapPin color={Colors.accent} size={16} />
            <Text style={styles.stopBannerText}>
              Station actuelle : <Text style={{ fontWeight: '800' }}>{activeService.station_actuelle}</Text>
            </Text>
            {activeService.voyage_complet && (
              <View style={styles.completeBadge}>
                <Text style={styles.completeBadgeTxt}>✅ Terminé</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Section Title ── */}
        <Text style={styles.sectionLabel}>Actions opérationnelles</Text>

        {/* ── Primary CTA: Start/Manage Service ── */}
        <TouchableOpacity style={styles.primaryCTA} onPress={goService} activeOpacity={0.85}>
          <View style={styles.primaryCTAIcon}>
            {activeService
              ? <Navigation color={Colors.primary} size={24} />
              : <Play color={Colors.primary} size={24} />
            }
          </View>
          <View style={styles.primaryCTAContent}>
            <Text style={styles.primaryCTATitle}>
              {activeService ? 'Gérer le service en cours' : 'Démarrer un service'}
            </Text>
            <Text style={styles.primaryCTASub}>
              {activeService
                ? `Service #${activeService.id_service} · ${activeService.station_actuelle ?? 'En cours'}`
                : 'Aucun service actif pour ce bus'
              }
            </Text>
          </View>
          <ChevronRight color={Colors.primary} size={20} />
        </TouchableOpacity>

        {/* ── Action Grid ── */}
        <View style={styles.actionGrid}>
          {/* Émettre un billet */}
          <TouchableOpacity
            style={[styles.actionCard, !activeService && styles.actionCardDisabled]}
            onPress={goVente}
            activeOpacity={activeService ? 0.8 : 1}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.warningLight }]}>
              <Ticket color={activeService ? Colors.warning : Colors.textLight} size={24} />
            </View>
            <Text style={[styles.actionTitle, !activeService && styles.actionTitleDisabled]}>Émettre un billet</Text>
            <Text style={styles.actionSub}>{activeService ? 'Nouvelle vente à bord' : 'Service requis'}</Text>
          </TouchableOpacity>

          {/* Manifeste */}
          <TouchableOpacity
            style={[styles.actionCard, !activeService && styles.actionCardDisabled]}
            onPress={goManifeste}
            activeOpacity={activeService ? 0.8 : 1}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.infoLight }]}>
              <Users color={activeService ? Colors.info : Colors.textLight} size={24} />
            </View>
            <Text style={[styles.actionTitle, !activeService && styles.actionTitleDisabled]}>Manifeste</Text>
            <Text style={styles.actionSub}>
              {activeService ? `${activeService.nb_tickets} passager(s)` : 'Service requis'}
            </Text>
          </TouchableOpacity>

          {/* Incident */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push({ pathname: '/(receveur)/incident', params: navParams })}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.dangerLight }]}>
              <AlertTriangle color={Colors.danger} size={24} />
            </View>
            <Text style={styles.actionTitle}>Incident</Text>
            <Text style={styles.actionSub}>Signaler un problème</Text>
          </TouchableOpacity>

          {/* Clôturer */}
          <TouchableOpacity
            style={[styles.actionCard, !activeService && styles.actionCardDisabled]}
            onPress={activeService ? goService : undefined}
            activeOpacity={activeService ? 0.8 : 1}
          >
            <View style={[styles.actionIcon, { backgroundColor: activeService ? Colors.dangerLight : Colors.bgMid }]}>
              <Square color={activeService ? Colors.danger : Colors.textLight} size={24} />
            </View>
            <Text style={[styles.actionTitle, !activeService && styles.actionTitleDisabled]}>Clôturer</Text>
            <Text style={styles.actionSub}>{activeService ? 'Fermer le service' : 'Service requis'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── No assignment helper ── */}
        {!hasAssignment && (
          <View style={styles.helperBox}>
            <AlertTriangle color={Colors.warning} size={16} />
            <Text style={styles.helperText}>
              Vous n'avez pas d'affectation active. Les fonctions de service sont désactivées.
            </Text>
          </View>
        )}

        {loadingSvc && (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: 40 },

  // Top Bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topAvatar: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  topAvatarText: { color: Colors.white, fontWeight: '800', fontSize: 18 },
  topGreeting: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  topName: { fontSize: 17, fontWeight: '800', color: Colors.textDark },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.bgMid, alignItems: 'center', justifyContent: 'center',
  },

  // Assignment Card
  assignCard: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.strong,
  },
  assignTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  assignIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.white + '20', alignItems: 'center', justifyContent: 'center',
  },
  assignBusLabel: { fontSize: 12, color: Colors.accent, fontWeight: '800', letterSpacing: 1 },
  assignBus: { fontSize: 22, fontWeight: '900', color: Colors.white },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill,
    backgroundColor: Colors.white + '15',
  },
  statusActive: {},
  statusIdle: {},
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '800' },
  assignDivider: { height: 1, backgroundColor: Colors.white + '20', marginVertical: Spacing.md },
  assignRow: { flexDirection: 'row', alignItems: 'center' },
  assignItem: { flex: 1, gap: 3, alignItems: 'center' },
  assignItemLabel: { fontSize: 12, color: Colors.accent, fontWeight: '800', letterSpacing: 0.5, marginTop: 2 },
  assignItemValue: { fontSize: 15, color: Colors.white, fontWeight: '800' },
  assignSep: { width: 1, height: 32, backgroundColor: Colors.white + '25', marginHorizontal: Spacing.md },

  noAssignCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl,
    alignItems: 'center', marginBottom: Spacing.md, ...Shadow.card,
  },
  noAssignTitle: { fontSize: 18, fontWeight: '800', color: Colors.textMid, marginTop: 12 },
  noAssignSub: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18 },

  // KPI Row
  kpiRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  kpiCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 4, ...Shadow.card,
  },
  kpiValue: { fontSize: 22, fontWeight: '900', color: Colors.textDark },
  kpiLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  stopBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary + '12', borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary + '20',
  },
  stopBannerText: { flex: 1, fontSize: 15, color: Colors.primary, fontWeight: '700' },
  completeBadge: { backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  completeBadgeTxt: { fontSize: 13, fontWeight: '800', color: Colors.success },

  // Section
  sectionLabel: { ...Typography.label, marginBottom: Spacing.md, marginTop: 4 },

  // Primary CTA
  primaryCTA: {
    backgroundColor: Colors.accent, borderRadius: Radius.xl,
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.accent,
  },
  primaryCTAIcon: {
    width: 48, height: 48, borderRadius: Radius.md,
    backgroundColor: Colors.white + '30', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  primaryCTAContent: { flex: 1 },
  primaryCTATitle: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  primaryCTASub: { fontSize: 14, color: Colors.primary + 'AA', marginTop: 2, fontWeight: '600' },

  // Action Grid
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  actionCard: {
    width: '48%', backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.base, gap: 6, ...Shadow.card,
  },
  actionCardDisabled: { opacity: 0.45 },
  actionIcon: {
    width: 46, height: 46, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  actionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  actionTitleDisabled: { color: Colors.textMuted },
  actionSub: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  // Helper
  helperBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.warningLight, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.warning + '40',
  },
  helperText: { flex: 1, fontSize: 14, color: Colors.warning, fontWeight: '700', lineHeight: 18 },
});

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, Image, Modal, TextInput, KeyboardAvoidingView, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Play, Ticket, Users, AlertTriangle, Square, LogOut,
  Bus, MapPin, Clock, TrendingUp, ChevronRight, Navigation, Menu
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme';
import { RECEVEUR_SERVICE_API, API_IP, API_PORT } from '../../constants/api';
import SideDrawer from '../../components/SideDrawer';

const { width } = Dimensions.get('window');
const BASE = RECEVEUR_SERVICE_API;

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

// Helper for Changing Bus icon (Rotated Navigation)
const CustomRefreshIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ transform: [{ rotate: '45deg' }] }}>
    <Navigation color={color} size={size} strokeWidth={3} />
  </View>
);

export default function ReceveurDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const nom = params.nom as string;
  const prenom = params.prenom as string;
  const numero_bus = params.numero_bus as string;
  const ville_depart = params.ville_depart as string;
  const ville_arrivee = params.ville_arrivee as string;
  const num_ligne = params.num_ligne as string;
  const login_time = params.login_time as string;
  const matricule = params.matricule as string;

  const [currentBus, setCurrentBus] = useState(numero_bus || '');
  const [showBusModal, setShowBusModal] = useState(!numero_bus);
  const [busInput, setBusInput] = useState('');
  const [busError, setBusError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [activeService, setActiveService] = useState<ActiveService | null>(null);
  const [busDetails, setBusDetails] = useState<any>(null);
  const [loadingSvc, setLoadingSvc] = useState(true);
  const [closing, setClosing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const userId = params.userId as string;

  const displayLigne = activeService?.num_ligne || busDetails?.num_ligne || num_ligne || '';
  const displayDepart = activeService?.ville_depart || busDetails?.ville_depart || ville_depart || '';
  const displayArrivee = activeService?.ville_arrivee || busDetails?.ville_arrivee || ville_arrivee || '';

  const navParams = {
    userId, nom, prenom, matricule, numero_bus: currentBus, 
    ville_depart: displayDepart, ville_arrivee: displayArrivee, num_ligne: displayLigne,
    service_id: activeService ? String(activeService.id_service) : '',
    login_time: login_time || '',
  };

  const fetchService = async () => {
    if (!currentBus) { setLoadingSvc(false); return; }
    try {
      setLoadingSvc(true);
      const r = await axios.get<ActiveService | null>(`${BASE}/active/${encodeURIComponent(currentBus)}`);
      setActiveService(r.data);
      
      try {
        const busRes = await axios.get(`${BASE.replace('/receveur-service', '/buses')}/details/${encodeURIComponent(currentBus)}`);
        setBusDetails(busRes.data);
      } catch (err) {
        setBusDetails(null);
      }
    } catch { 
      setActiveService(null); 
    } finally { 
      setLoadingSvc(false); 
    }
  };

  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${RECEVEUR_SERVICE_API.replace('/receveur-service', '/users')}/${userId}`);
        setUserData(res.data);
      } catch (err) {
        console.error('Fetch user error:', err);
      }
    };
    if (userId) fetchUser();
  }, [userId]);

  const imageUrl = userData?.image_url || params.image_url;

  useFocusEffect(useCallback(() => { setLoadingSvc(true); fetchService(); }, [currentBus]));

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const elapsed = activeService
    ? Math.floor((now - new Date(activeService.date_debut).getTime()) / 60000)
    : 0;
  const elapsedLabel = elapsed >= 60
    ? `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`
    : `${elapsed}m`;

  const handleLogout = () => {
    const logoutAction = () => router.replace('/');
    if (Platform.OS === 'web') {
      if (confirm('Voulez-vous vous déconnecter ?')) logoutAction();
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
    router.push({ 
      pathname: '/(receveur)/vente', 
      params: { ...navParams, service_id: String(activeService.id_service), station_actuelle: activeService.station_actuelle || '' } 
    });
  };
  const goManifeste = () => {
    if (!activeService) {
      Alert.alert('Service inactif', 'Il n\'y a pas de service actif.');
      return;
    }
    router.push({ pathname: '/(receveur)/manifeste', params: { ...navParams, service_id: String(activeService.id_service) } });
  };
  
  const handleCloseService = () => {
    if (!activeService) return;
    const proceed = async () => {
      setClosing(true);
      try {
        await axios.post(`${RECEVEUR_SERVICE_API}/${activeService.id_service}/close`, {});
        setActiveService(null);
        Alert.alert('Succès', 'Mission clôturée avec succès.', [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
        if (Platform.OS === 'web') router.replace('/');
      } catch (e: any) {
        Alert.alert('Erreur', e.response?.data?.message ?? 'Impossible de clôturer');
      } finally {
        setClosing(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Voulez-vous vraiment terminer cette mission ?')) proceed();
    } else {
      Alert.alert('Clôturer le service', 'Voulez-vous terminer cette mission ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Clôturer', style: 'destructive', onPress: proceed }
      ]);
    }
  };

  const handleBusSubmit = async () => {
    const input = busInput.trim();
    if (input.length === 0) return;

    setVerifying(true);
    setBusError('');

    try {
      // 1. Check if bus exists and get details
      const busRes = await axios.get(`${BASE.replace('/receveur-service', '/buses')}/details/${encodeURIComponent(input)}`);
      const busData = busRes.data;

      // 2. Check if assigned to a line
      if (!busData.num_ligne) {
        setBusError("bus n'est pas affecté à aucune ligne");
        return;
      }

      // Success
      setCurrentBus(input);
      setShowBusModal(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setBusError("bus inexistante");
      } else {
        setBusError("Erreur lors de la vérification du bus");
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <SideDrawer 
          visible={drawerOpen} onClose={() => setDrawerOpen(false)} 
          nom={nom} prenom={prenom} matricule={matricule} role="receveur"
          userId={userId} imageUrl={imageUrl as string} onLogout={handleLogout}
        />
        
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => setDrawerOpen(true)} activeOpacity={0.7}>
              <Menu color={Colors.primary} size={22} strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Bonjour,</Text>
              <Text style={styles.userName}>{prenom} {nom}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setDrawerOpen(true)} activeOpacity={0.8}>
              {imageUrl ? (
                <Image source={{ uri: `http://${API_IP}:${API_PORT}/${imageUrl}` }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{(prenom?.[0] ?? 'R').toUpperCase()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrapper}>
            {currentBus ? (
              <View style={styles.heroCard}>
                <View style={styles.heroMain}>
                  <View style={styles.heroBusBadge}>
                    <Bus color={Colors.white} size={22} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroBusLabel}>VOTRE BUS</Text>
                    <Text style={styles.heroBusNum}>BUS N° {currentBus}</Text>
                  </View>
                  <View style={[styles.statusTag, activeService ? styles.statusActive : styles.statusIdle]}>
                    <Text style={styles.statusTagText}>{activeService ? 'EN SERVICE' : 'INACTIF'}</Text>
                  </View>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroFooter}>
                  <View style={styles.heroStat}><Navigation color={Colors.accent} size={14} strokeWidth={2.5} /><Text style={styles.heroStatVal}>{displayLigne || '—'}</Text><Text style={styles.heroStatLabel}>LIGNE</Text></View>
                  <View style={styles.heroStatSep} />
                  <View style={styles.heroStat}><MapPin color={Colors.accent} size={14} strokeWidth={2.5} /><Text style={styles.heroStatVal} numberOfLines={1}>{displayDepart || '—'}</Text><Text style={styles.heroStatLabel}>DÉPART</Text></View>
                  <View style={styles.heroStatSep} />
                  <View style={styles.heroStat}><MapPin color={Colors.accent} size={14} strokeWidth={2.5} /><Text style={styles.heroStatVal} numberOfLines={1}>{displayArrivee || '—'}</Text><Text style={styles.heroStatLabel}>ARRIVÉE</Text></View>
                </View>
                <TouchableOpacity style={styles.heroChangeBtn} onPress={() => setShowBusModal(true)} activeOpacity={0.7}>
                  <CustomRefreshIcon color={Colors.white} size={14} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.heroEmpty} onPress={() => setShowBusModal(true)}>
                <Bus color={Colors.textLight} size={48} strokeWidth={1.5} />
                <Text style={styles.heroEmptyTitle}>Aucune affectation</Text>
                <Text style={styles.heroEmptySub}>Touchez ici pour choisir votre bus</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiBox}><View style={[styles.kpiIconWrap, { backgroundColor: Colors.infoLight }]}><Clock color={Colors.info} size={18} strokeWidth={2.5} /></View><Text style={styles.kpiValue}>{elapsedLabel}</Text><Text style={styles.kpiLabel}>DURÉE</Text></View>
            <View style={styles.kpiBox}><View style={[styles.kpiIconWrap, { backgroundColor: Colors.warningLight }]}><Ticket color={Colors.warning} size={18} strokeWidth={2.5} /></View><Text style={styles.kpiValue}>{activeService ? activeService.nb_tickets : 0}</Text><Text style={styles.kpiLabel}>BILLETS</Text></View>
            <View style={styles.kpiBox}><View style={[styles.kpiIconWrap, { backgroundColor: Colors.successLight }]}><TrendingUp color={Colors.success} size={18} strokeWidth={2.5} /></View><Text style={styles.kpiValue}>{activeService ? parseFloat(String(activeService.recette)).toFixed(1) : '0.0'}</Text><Text style={styles.kpiLabel}>TND</Text></View>
          </View>

          <Text style={styles.sectionHeading}>OPÉRATIONS TERRAIN</Text>
          <TouchableOpacity style={[styles.primaryAction, activeService ? styles.primaryActionActive : styles.primaryActionIdle]} onPress={goService} activeOpacity={0.9}>
            <View style={styles.primaryActionLeft}><View style={styles.primaryActionIcon}>{activeService ? <Navigation color={Colors.primary} size={28} strokeWidth={2.5} /> : <Play color={Colors.primary} size={28} strokeWidth={2.5} />}</View><View><Text style={styles.primaryActionTitle}>{activeService ? 'Gérer le service' : 'Lancer un service'}</Text><Text style={styles.primaryActionSub}>{activeService ? `Station: ${activeService.station_actuelle || 'En route'}` : 'Prêt à démarrer le trajet'}</Text></View></View>
            <ChevronRight color={Colors.primary} size={24} strokeWidth={3} />
          </TouchableOpacity>

          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionCard, !activeService && styles.actionCardDisabled]} onPress={goVente} disabled={!activeService} activeOpacity={0.8}><View style={[styles.actionCardIcon, { backgroundColor: Colors.warning + '12' }]}><Ticket color={activeService ? Colors.warning : Colors.textLight} size={24} strokeWidth={2.5} /></View><Text style={styles.actionCardTitle}>Émettre un billet</Text><Text style={styles.actionCardSub}>Vente directe à bord</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, !activeService && styles.actionCardDisabled]} onPress={goManifeste} disabled={!activeService} activeOpacity={0.8}><View style={[styles.actionCardIcon, { backgroundColor: Colors.info + '12' }]}><Users color={activeService ? Colors.info : Colors.textLight} size={24} strokeWidth={2.5} /></View><Text style={styles.actionCardTitle}>Manifeste</Text><Text style={styles.actionCardSub}>Liste des passagers</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push({ pathname: '/(receveur)/incident', params: navParams })} activeOpacity={0.8}><View style={[styles.actionCardIcon, { backgroundColor: Colors.danger + '12' }]}><AlertTriangle color={Colors.danger} size={24} strokeWidth={2.5} /></View><Text style={styles.actionCardTitle}>Signaler Incident</Text><Text style={styles.actionCardSub}>Problème technique</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, !activeService && styles.actionCardDisabled]} onPress={activeService ? handleCloseService : undefined} disabled={!activeService || closing} activeOpacity={0.8}>
              <View style={[styles.actionCardIcon, { backgroundColor: activeService ? Colors.primary + '12' : Colors.bgMid }]}>
                {closing ? <ActivityIndicator size="small" color={Colors.primary} /> : <Square color={activeService ? Colors.primary : Colors.textLight} size={24} strokeWidth={2.5} />}
              </View>
              <Text style={styles.actionCardTitle}>Clôturer</Text>
              <Text style={styles.actionCardSub}>Terminer la mission</Text>
            </TouchableOpacity>
          </View>
          {loadingSvc && <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showBusModal} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}><View style={styles.modalIconWrap}><Bus color={Colors.primary} size={24} /></View><View><Text style={styles.modalTitle}>Affectation Bus</Text><Text style={styles.modalSub}>Saisissez le numéro du bus actuel</Text></View></View>
            <View style={styles.modalInputWrap}><Bus color={Colors.textLight} size={20} /><TextInput style={styles.modalTextInput} placeholder="Ex: 1045" value={busInput} onChangeText={v => { setBusInput(v); setBusError(''); }} placeholderTextColor={Colors.textLight} autoCapitalize="characters" onSubmitEditing={handleBusSubmit} /></View>
            {busError ? <Text style={styles.busErrorText}>{busError}</Text> : null}
            <TouchableOpacity 
              style={[styles.modalSubmit, (!busInput.trim() || verifying) && styles.modalSubmitDisabled]} 
              onPress={handleBusSubmit} 
              disabled={!busInput.trim() || verifying}
            >
              {verifying ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.modalSubmitText}>Confirmer affectation</Text>}
            </TouchableOpacity>
            {currentBus ? <TouchableOpacity style={styles.modalCancel} onPress={() => setShowBusModal(false)}><Text style={styles.modalCancelText}>Annuler</Text></TouchableOpacity> : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.white },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIconBtn: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.bgMid, alignItems: 'center', justifyContent: 'center' },
  userInfo: { gap: 2 },
  greeting: { fontSize: 13, color: Colors.textLight, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  userName: { fontSize: 18, fontWeight: '900', color: Colors.textDark, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  avatarPlaceholder: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: Colors.bgMid },
  avatarText: { color: Colors.white, fontWeight: '900', fontSize: 18 },
  heroWrapper: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base },
  heroCard: { backgroundColor: Colors.primary, borderRadius: Radius.xxl, padding: Spacing.xl, ...Shadow.strong, overflow: 'hidden' },
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroBusBadge: { width: 56, height: 56, borderRadius: Radius.lg, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  heroBusLabel: { fontSize: 11, color: Colors.accent, fontWeight: '900', letterSpacing: 2 },
  heroBusNum: { fontSize: 28, fontWeight: '900', color: Colors.white, letterSpacing: -0.5, marginTop: 2 },
  statusTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  statusActive: { backgroundColor: Colors.success + '20' },
  statusIdle: { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  statusTagText: { fontSize: 11, fontWeight: '900', color: Colors.white, letterSpacing: 0.5 },
  heroDivider: { height: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginVertical: Spacing.xl },
  heroFooter: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center', gap: 4 },
  heroStatVal: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: -0.3 },
  heroStatLabel: { fontSize: 10, color: 'rgba(255, 255, 255, 0.4)', fontWeight: '900', letterSpacing: 1 },
  heroStatSep: { width: 1, height: 32, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginHorizontal: Spacing.sm },
  heroChangeBtn: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.15)', alignItems: 'center', justifyContent: 'center' },
  heroEmpty: { height: 180, borderRadius: Radius.xxl, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.bgMid, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 12 },
  heroEmptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textMid },
  heroEmptySub: { fontSize: 14, color: Colors.textLight, fontWeight: '600' },
  kpiGrid: { flexDirection: 'row', gap: 12, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  kpiBox: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, alignItems: 'center', gap: 8, ...Shadow.card, borderWidth: 1, borderColor: Colors.bgMid },
  kpiIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 20, fontWeight: '900', color: Colors.textDark, letterSpacing: -0.5 },
  kpiLabel: { fontSize: 10, color: Colors.textLight, fontWeight: '900', letterSpacing: 1 },
  sectionHeading: { fontSize: 12, fontWeight: '900', color: Colors.textLight, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md, letterSpacing: 1.5 },
  primaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: Spacing.xl, padding: Spacing.xl, borderRadius: Radius.xxl, marginBottom: Spacing.xl, ...Shadow.strong },
  primaryActionActive: { backgroundColor: Colors.accent, ...Shadow.accent },
  primaryActionIdle: { backgroundColor: Colors.bgMid, borderWidth: 1, borderColor: Colors.divider },
  primaryActionLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  primaryActionIcon: { width: 56, height: 56, borderRadius: Radius.lg, backgroundColor: 'rgba(255, 255, 255, 0.4)', alignItems: 'center', justifyContent: 'center' },
  primaryActionTitle: { fontSize: 20, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  primaryActionSub: { fontSize: 14, color: Colors.primary + '70', fontWeight: '700', marginTop: 2 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: Spacing.xl },
  actionCard: { width: (width - Spacing.xl * 2 - 12) / 2, backgroundColor: Colors.white, borderRadius: Radius.xxl, padding: Spacing.xl, gap: 12, ...Shadow.card, borderWidth: 1, borderColor: Colors.bgMid },
  actionCardDisabled: { opacity: 0.5 },
  actionCardIcon: { width: 52, height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  actionCardTitle: { fontSize: 16, fontWeight: '900', color: Colors.textDark, letterSpacing: -0.3 },
  actionCardSub: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, ...Shadow.strong },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  modalIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.bgMid, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: Colors.textDark, letterSpacing: -0.5 },
  modalSub: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  modalInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgLight, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.bgMid, height: 60, paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  modalTextInput: { flex: 1, fontSize: 18, color: Colors.textDark, fontWeight: '700' },
  modalSubmit: { backgroundColor: Colors.primary, height: 60, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', ...Shadow.strong },
  modalSubmitDisabled: { opacity: 0.5 },
  modalSubmitText: { fontSize: 17, fontWeight: '900', color: Colors.white },
  modalCancel: { height: 50, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  modalCancelText: { fontSize: 15, fontWeight: '800', color: Colors.textMuted },
  busErrorText: { color: Colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.md },
});

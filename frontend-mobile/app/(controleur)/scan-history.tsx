import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, RefreshControl,
  FlatList
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, Ticket, Calendar, Clock, MapPin, 
  ChevronRight, Search, CheckCircle, XCircle
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme';
import { API_IP, API_PORT } from '../../constants/api';

const API_BASE_URL = `http://${API_IP}:${API_PORT}/api`;

interface Scan {
  id_ticket: number;
  num_ligne: string;
  numero_bus: string;
  heure: string;
  siege: string;
  prix: number;
  arret_depart: string;
  arret_arrivee: string;
  type_tarif: string;
  date_scan: string;
  qr_code: string;
  ligne_depart: string;
  ligne_arrivee: string;
}

export default function ScanHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string;

  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScans = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/sales/controleur/${userId}/daily`);
      setScans(res.data);
    } catch (err) {
      console.error('Fetch scans error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) fetchScans();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchScans();
  };

  const renderScanItem = ({ item }: { item: Scan }) => (
    <View style={styles.scanCard}>
      <View style={styles.scanHeader}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.info + '15' }]}>
          <Search color={Colors.info} size={20} />
        </View>
        <View style={styles.scanHeaderInfo}>
          <Text style={styles.ticketCode}>Ticket #{item.id_ticket}</Text>
          <Text style={styles.scanTime}>Scanné à {new Date(item.date_scan).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <View style={styles.statusBadge}>
          <CheckCircle color={Colors.success} size={16} />
          <Text style={styles.statusText}>Valide</Text>
        </View>
      </View>

      <View style={styles.scanBody}>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <MapPin color={Colors.textMuted} size={14} />
            <Text style={styles.infoLabel}>Ligne {item.num_ligne}</Text>
          </View>
          <View style={styles.infoItem}>
            <Clock color={Colors.textMuted} size={14} />
            <Text style={styles.infoLabel}>Siège {item.siege}</Text>
          </View>
        </View>
        
        <View style={styles.routeRow}>
           <Text style={styles.routeText} numberOfLines={1}>
            {item.arret_depart} → {item.arret_arrivee}
          </Text>
        </View>

        <View style={styles.divider} />
        
        <View style={styles.footerRow}>
          <Text style={styles.tarifText}>{item.type_tarif}</Text>
          <Text style={styles.priceText}>{parseFloat(item.prix.toString()).toFixed(3)} DT</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft color={Colors.white} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique des scans</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Stats Summary ── */}
      <View style={styles.summaryBox}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{scans.length}</Text>
          <Text style={styles.statLabel}>Tickets Scannés</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</Text>
          <Text style={styles.statLabel}>Aujourd'hui</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.info} size="large" />
          <Text style={styles.loadingText}>Récupération des données...</Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item.id_ticket.toString()}
          renderItem={renderScanItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.info]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Search color={Colors.textMuted} size={40} />
              </View>
              <Text style={styles.emptyTitle}>Aucun scan aujourd'hui</Text>
              <Text style={styles.emptySub}>Les billets que vous validerez apparaîtront ici.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.info,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    paddingTop: Spacing.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },

  summaryBox: {
    flexDirection: 'row', backgroundColor: Colors.info,
    paddingBottom: Spacing.xl, borderBottomLeftRadius: Radius.xxl, borderBottomRightRadius: Radius.xxl,
    ...Shadow.strong,
  },
  statItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontSize: 28, fontWeight: '900', color: Colors.white },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center' },

  listContent: { padding: Spacing.base, paddingTop: Spacing.lg, paddingBottom: 40 },
  scanCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    marginBottom: Spacing.md, ...Shadow.card,
    overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: Colors.info,
  },
  scanHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  iconContainer: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  scanHeaderInfo: { flex: 1, marginLeft: Spacing.sm },
  ticketCode: { fontSize: 14, fontWeight: '800', color: Colors.textDark },
  scanTime: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  statusText: { color: Colors.success, fontWeight: '800', fontSize: 11 },

  scanBody: { padding: Spacing.md },
  infoGrid: { flexDirection: 'row', gap: Spacing.lg, marginBottom: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMid },
  routeRow: { marginBottom: 12 },
  routeText: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: 10 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tarifText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  priceText: { fontSize: 15, fontWeight: '800', color: Colors.info },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, color: Colors.textMuted, fontWeight: '600' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIcon: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: Colors.bgMid, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});

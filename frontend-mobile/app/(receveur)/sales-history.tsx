import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, RefreshControl,
  FlatList
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, Ticket, Calendar, Clock, MapPin, 
  ChevronRight, TrendingUp, DollarSign
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme';
import { API_IP, API_PORT } from '../../constants/api';

const API_BASE_URL = `http://${API_IP}:${API_PORT}/api`;

interface Sale {
  id_ticket: number;
  num_ligne: string;
  numero_bus: string;
  heure: string;
  siege: string;
  prix: number;
  arret_depart: string;
  arret_arrivee: string;
  type_tarif: string;
  date_emission: string;
  ligne_depart: string;
  ligne_arrivee: string;
}

export default function SalesHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string;

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/sales/agent/${userId}/daily`);
      setSales(res.data);
    } catch (err) {
      console.error('Fetch sales error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) fetchSales();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const totalRevenue = sales.reduce((acc, sale) => acc + parseFloat(sale.prix.toString()), 0);
  const totalTickets = sales.length;

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <View style={styles.saleCard}>
      <View style={styles.saleHeader}>
        <View style={styles.ticketIconContainer}>
          <Ticket color={Colors.primary} size={20} />
        </View>
        <View style={styles.saleHeaderInfo}>
          <Text style={styles.ticketCode}>#TKT-{item.id_ticket}</Text>
          <Text style={styles.saleTime}>{new Date(item.date_emission).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{parseFloat(item.prix.toString()).toFixed(3)} DT</Text>
        </View>
      </View>

      <View style={styles.saleBody}>
        <View style={styles.routeRow}>
          <MapPin color={Colors.textMuted} size={14} />
          <Text style={styles.routeText} numberOfLines={1}>
            {item.arret_depart} → {item.arret_arrivee}
          </Text>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <View style={styles.dot} />
            <Text style={styles.detailLabel}>Ligne: </Text>
            <Text style={styles.detailValue}>{item.num_ligne}</Text>
          </View>
          <View style={styles.detailItem}>
            <View style={[styles.dot, { backgroundColor: Colors.info }]} />
            <Text style={styles.detailLabel}>Tarif: </Text>
            <Text style={styles.detailValue}>{item.type_tarif}</Text>
          </View>
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
        <Text style={styles.headerTitle}>Ventes du jour</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Summary Stats ── */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <View style={[styles.statIcon, { backgroundColor: Colors.success + '20' }]}>
            <DollarSign color={Colors.success} size={22} />
          </View>
          <View>
            <Text style={styles.statLabel}>Total Recette</Text>
            <Text style={styles.statValue}>{totalRevenue.toFixed(3)} DT</Text>
          </View>
        </View>
        <View style={styles.statBox}>
          <View style={[styles.statIcon, { backgroundColor: Colors.info + '20' }]}>
            <Ticket color={Colors.info} size={22} />
          </View>
          <View>
            <Text style={styles.statLabel}>Tickets Vendus</Text>
            <Text style={styles.statValue}>{totalTickets}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Chargement des ventes...</Text>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id_ticket.toString()}
          renderItem={renderSaleItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ticket color={Colors.textMuted} size={48} />
              </View>
              <Text style={styles.emptyTitle}>Aucune vente aujourd'hui</Text>
              <Text style={styles.emptySub}>Les tickets que vous vendrez apparaîtront ici.</Text>
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
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    paddingTop: Spacing.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  
  statsContainer: {
    flexDirection: 'row', gap: Spacing.md,
    padding: Spacing.base,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
    paddingBottom: Spacing.xl,
    ...Shadow.strong,
  },
  statBox: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  statIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  statLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.textDark },

  listContent: { padding: Spacing.base, paddingTop: Spacing.lg, paddingBottom: 40 },
  saleCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    marginBottom: Spacing.md, ...Shadow.card,
    overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: Colors.primary,
  },
  saleHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  ticketIconContainer: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.bgLight, alignItems: 'center', justifyContent: 'center',
  },
  saleHeaderInfo: { flex: 1, marginLeft: Spacing.sm },
  ticketCode: { fontSize: 14, fontWeight: '800', color: Colors.textDark },
  saleTime: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  priceTag: {
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  priceText: { color: Colors.success, fontWeight: '800', fontSize: 14 },

  saleBody: { padding: Spacing.md },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  routeText: { fontSize: 14, fontWeight: '700', color: Colors.textDark, flex: 1 },
  detailsRow: { flexDirection: 'row', gap: Spacing.lg },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  detailLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  detailValue: { fontSize: 13, fontWeight: '700', color: Colors.textDark },

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

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, RefreshControl, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Users, Ticket, MapPin, Clock, Search, RefreshCw,
  TrendingUp, ArrowRight, AlertCircle, Plus, ChevronLeft
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme';
import { RECEVEUR_SERVICE_API, SALES_API } from '../../constants/api';

const { width } = Dimensions.get('window');

interface TicketItem {
  id_ticket: number;
  code_ticket: string;
  siege: string;
  type_tarif: string;
  montant_total: number;
  heure_depart: string;
  station_depart: string;
  station_arrivee: string;
  date_emission: string;
}

const TARIF_COLOR: Record<string, string> = {
  'Tarif Plein': Colors.primary,
  'Étudiant': Colors.success,
  'Handicapé': Colors.warning,
};

export default function ManifesteScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const numero_bus = params.numero_bus as string;
  const ville_depart = params.ville_depart as string;
  const ville_arrivee = params.ville_arrivee as string;
  const service_id = params.service_id as string;
  const num_ligne = params.num_ligne as string;
  const nom = params.nom as string;
  const prenom = params.prenom as string;
  const station_actuelle = params.station_actuelle as string;

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [filtered, setFiltered] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchManifeste = async () => {
    try {
      let url = service_id
        ? `${RECEVEUR_SERVICE_API}/${service_id}/tickets`
        : `${SALES_API}/bus/${encodeURIComponent(numero_bus)}/manifeste`;
      const res = await axios.get<TicketItem[]>(url);
      
      let fetchedTickets = res.data;
      if (station_actuelle) {
        fetchedTickets = fetchedTickets.filter(t => t.station_depart === station_actuelle);
      }

      setTickets(fetchedTickets);
      setFiltered(fetchedTickets);
    } catch {
      setTickets([]);
      setFiltered([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchManifeste(); }, []));

  const handleSearch = (q: string) => {
    setSearch(q);
    if (!q.trim()) { setFiltered(tickets); return; }
    const lower = q.toLowerCase();
    setFiltered(tickets.filter(t =>
      t.siege?.toLowerCase().includes(lower) ||
      t.station_depart?.toLowerCase().includes(lower) ||
      t.station_arrivee?.toLowerCase().includes(lower) ||
      t.type_tarif?.toLowerCase().includes(lower) ||
      t.code_ticket?.toLowerCase().includes(lower)
    ));
  };

  const totalRevenue = tickets.reduce((s, t) => s + parseFloat(String(t.montant_total || 0)), 0);

  const renderTicket = ({ item, index }: { item: TicketItem; index: number }) => {
    const tarifColor = TARIF_COLOR[item.type_tarif] || Colors.primary;
    const emissionTime = item.date_emission
      ? new Date(item.date_emission).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '—';
    return (
      <View style={styles.ticketCard}>
        <View style={styles.ticketTop}>
          <View style={[styles.ticketIndex, { backgroundColor: Colors.primary + '10' }]}>
            <Text style={styles.ticketIndexTxt}>{index + 1}</Text>
          </View>
          <View style={styles.ticketRoute}>
            <Text style={styles.ticketStation} numberOfLines={1}>{item.station_depart || '—'}</Text>
            <ArrowRight color={Colors.textLight} size={14} strokeWidth={2.5} />
            <Text style={styles.ticketStation} numberOfLines={1}>{item.station_arrivee || '—'}</Text>
          </View>
          <Text style={styles.ticketPrice}>{parseFloat(String(item.montant_total || 0)).toFixed(3)}</Text>
        </View>

        <View style={styles.ticketMeta}>
          <View style={styles.seatBadge}>
            <Text style={styles.seatText}>SIÈGE {item.siege || '—'}</Text>
          </View>
          <View style={[styles.tarifBadge, { backgroundColor: tarifColor + '12' }]}>
            <View style={[styles.tarifDot, { backgroundColor: tarifColor }]} />
            <Text style={[styles.tarifText, { color: tarifColor }]}>{item.type_tarif}</Text>
          </View>
          <View style={styles.timeInfo}>
            <Clock color={Colors.textMuted} size={12} strokeWidth={2.5} />
            <Text style={styles.timeText}>{item.heure_depart || emissionTime}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* ── Ultra-Premium Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color={Colors.white} size={24} strokeWidth={3} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Manifeste Voyageurs</Text>
            <Text style={styles.headerSub}>Bus {numero_bus} · Station: {station_actuelle || ville_depart}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => { setRefreshing(true); fetchManifeste(); }}>
             <RefreshCw color={Colors.white} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* ── Luxury Summary Card ── */}
        <View style={styles.summaryCard}>
          <View style={styles.statBox}>
             <Users color={Colors.accent} size={20} strokeWidth={2.5} />
             <Text style={styles.statVal}>{tickets.length}</Text>
             <Text style={styles.statLbl}>PASSAGERS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
             <TrendingUp color={Colors.success} size={20} strokeWidth={2.5} />
             <Text style={styles.statVal}>{totalRevenue.toFixed(2)}</Text>
             <Text style={styles.statLbl}>RECETTE TND</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
             <Ticket color={Colors.info} size={20} strokeWidth={2.5} />
             <Text style={styles.statVal}>{service_id || '—'}</Text>
             <Text style={styles.statLbl}>SERVICE</Text>
          </View>
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search color={Colors.textMuted} size={18} strokeWidth={2.5} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un siège, station ou tarif..."
              value={search}
              onChangeText={handleSearch}
              placeholderTextColor={Colors.textLight}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <X color={Colors.textMuted} size={18} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Tickets List ── */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Users color={Colors.bgMid} size={64} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Liste vide</Text>
            <Text style={styles.emptySub}>Aucun passager ne correspond à votre recherche actuelle.</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderTicket}
            keyExtractor={t => String(t.id_ticket)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchManifeste(); }} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// Add X icon helper if not imported
const X = ({ color, size }: { color: string; size: number }) => (
  <View style={{ transform: [{ rotate: '45deg' }] }}>
    <Plus color={color} size={size} strokeWidth={3} />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  container: { flex: 1, backgroundColor: Colors.bgLight },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgLight },

  header: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, 
    paddingTop: Spacing.lg, paddingBottom: Spacing.xl,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.white, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', fontWeight: '700', letterSpacing: 0.5 },
  refreshBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },

  summaryCard: {
    flexDirection: 'row', backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl, marginTop: -Spacing.xl,
    borderRadius: Radius.xxl, padding: Spacing.xl, ...Shadow.strong,
    borderWidth: 1, borderColor: Colors.bgMid,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 18, fontWeight: '900', color: Colors.primary, letterSpacing: -0.3 },
  statLbl: { fontSize: 9, fontWeight: '900', color: Colors.textLight, letterSpacing: 1 },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.bgMid, alignSelf: 'center' },

  searchSection: { padding: Spacing.xl },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    height: 54, paddingHorizontal: Spacing.lg, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.bgMid,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textDark, fontWeight: '700' },

  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40, gap: 12 },
  ticketCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadow.subtle, borderWidth: 1, borderColor: Colors.bgMid,
  },
  ticketTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  ticketIndex: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ticketIndexTxt: { fontSize: 14, fontWeight: '900', color: Colors.primary },
  ticketRoute: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  ticketStation: { fontSize: 15, fontWeight: '900', color: Colors.textDark, flexShrink: 1 },
  ticketPrice: { fontSize: 17, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  seatBadge: { backgroundColor: Colors.bgMid, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill },
  seatText: { fontSize: 11, fontWeight: '900', color: Colors.textDark, letterSpacing: 0.5 },
  tarifBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill },
  tarifDot: { width: 6, height: 6, borderRadius: 3 },
  tarifText: { fontSize: 11, fontWeight: '900' },
  timeInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  timeText: { fontSize: 12, fontWeight: '800', color: Colors.textMuted },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyIcon: { width: 100, height: 100, borderRadius: 32, backgroundColor: Colors.bgMid + '30', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: Colors.textMid, marginBottom: 8 },
  emptySub: { fontSize: 15, color: Colors.textLight, textAlign: 'center', fontWeight: '600', lineHeight: 22 },
});

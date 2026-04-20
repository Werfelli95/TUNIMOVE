import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Users, Ticket, MapPin, Clock, Search, RefreshCw,
  TrendingUp, ArrowRight, AlertCircle, Plus
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme';

import { RECEVEUR_SERVICE_API, SALES_API } from '../../constants/api';

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
      setTickets(res.data);
      setFiltered(res.data);
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
    const tarifColor = TARIF_COLOR[item.type_tarif] || Colors.primaryLight;
    const emissionTime = item.date_emission
      ? new Date(item.date_emission).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '—';
    return (
      <View style={styles.ticketCard}>
        <View style={styles.ticketTop}>
          <View style={[styles.ticketIndex, { backgroundColor: Colors.primary + '12' }]}>
            <Text style={styles.ticketIndexTxt}>{index + 1}</Text>
          </View>
          <View style={styles.ticketRoute}>
            <Text style={styles.ticketStation}>{item.station_depart || '—'}</Text>
            <View style={styles.ticketArrow}>
              <View style={styles.ticketLine} />
              <ArrowRight color={Colors.textMuted} size={12} />
            </View>
            <Text style={styles.ticketStation}>{item.station_arrivee || '—'}</Text>
          </View>
          <Text style={styles.ticketPrice}>{parseFloat(String(item.montant_total || 0)).toFixed(3)} TND</Text>
        </View>

        <View style={styles.ticketMeta}>
          <View style={styles.ticketBadge}>
            <Text style={styles.ticketSiege}>Siège {item.siege || '—'}</Text>
          </View>
          <View style={[styles.ticketTarifBadge, { backgroundColor: tarifColor + '18' }]}>
            <Text style={[styles.ticketTarifText, { color: tarifColor }]}>{item.type_tarif}</Text>
          </View>
          <View style={styles.ticketTimeBadge}>
            <Clock color={Colors.textMuted} size={11} />
            <Text style={styles.ticketTime}>{item.heure_depart || emissionTime}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        {/* ── Summary Card ── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryTitle}>Manifeste du service</Text>
              {service_id
                ? <Text style={styles.summarySubtitle}>Service #{service_id} · Bus {numero_bus}</Text>
                : <Text style={styles.summarySubtitle}>Bus {numero_bus} · Aujourd'hui</Text>
              }
              {ville_depart && (
                <Text style={styles.summaryRoute}>{ville_depart} → {ville_arrivee}</Text>
              )}
            </View>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Users color={Colors.primary} size={18} />
              <Text style={styles.summaryStatVal}>{tickets.length}</Text>
              <Text style={styles.summaryStatLabel}>Passagers</Text>
            </View>
            <View style={styles.summaryStatDiv} />
            <View style={styles.summaryStat}>
              <TrendingUp color={Colors.success} size={18} />
              <Text style={styles.summaryStatVal}>{totalRevenue.toFixed(2)}</Text>
              <Text style={styles.summaryStatLabel}>TND</Text>
            </View>
            <View style={styles.summaryStatDiv} />
            <View style={styles.summaryStat}>
              <Ticket color={Colors.warning} size={18} />
              <Text style={styles.summaryStatVal}>{num_ligne || '—'}</Text>
              <Text style={styles.summaryStatLabel}>Ligne</Text>
            </View>
          </View>
        </View>

        {/* ── Search + Refresh ── */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search color={Colors.textMuted} size={16} />
            <TextInput
              style={styles.searchInput}
              placeholder="Siège, station, tarif..."
              value={search}
              onChangeText={handleSearch}
              placeholderTextColor={Colors.textLight}
            />
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => { setRefreshing(true); fetchManifeste(); }}
          >
            <RefreshCw color={Colors.primary} size={18} />
          </TouchableOpacity>
        </View>

        {/* ── List ── */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Users color={Colors.textLight} size={40} />
            </View>
            <Text style={styles.emptyTitle}>Aucun passager</Text>
            <Text style={styles.emptySub}>
              {search
                ? 'Aucun résultat pour cette recherche.'
                : 'Le manifeste est vide. Émettez le premier billet.'}
            </Text>
            {!search && service_id && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push({
                  pathname: '/(receveur)/vente',
                  params: { nom, prenom, numero_bus, ville_depart, ville_arrivee, num_ligne, service_id }
                })}
              >
                <Plus color={Colors.white} size={16} />
                <Text style={styles.emptyBtnText}>Émettre un premier billet</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderTicket}
            keyExtractor={t => String(t.id_ticket)}
            contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 40 }}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchManifeste(); }} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgLight },

  // Summary Card
  summaryCard: {
    backgroundColor: Colors.primary, margin: Spacing.base,
    borderRadius: Radius.xl, padding: Spacing.base, ...Shadow.strong,
  },
  summaryTop: { marginBottom: Spacing.md },
  summaryTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  summarySubtitle: { fontSize: 14, color: Colors.white + '80', marginTop: 2 },
  summaryRoute: { fontSize: 14, color: Colors.accent, fontWeight: '700', marginTop: 4 },
  summaryStats: {
    flexDirection: 'row', backgroundColor: Colors.white + '12',
    borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center',
  },
  summaryStat: { flex: 1, alignItems: 'center', gap: 3 },
  summaryStatVal: { fontSize: 20, fontWeight: '900', color: Colors.white },
  summaryStatLabel: { fontSize: 12, color: Colors.white + '70', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryStatDiv: { width: 1, height: 32, backgroundColor: Colors.white + '25', marginHorizontal: Spacing.md },

  // Search
  searchRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, marginBottom: Spacing.sm,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, height: 44, ...Shadow.card,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textDark },
  refreshBtn: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.card,
  },

  // Ticket Card
  ticketCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.base, ...Shadow.card,
  },
  ticketTop: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  ticketIndex: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  ticketIndexTxt: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  ticketRoute: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ticketStation: { fontSize: 15, fontWeight: '800', color: Colors.textDark, flexShrink: 1 },
  ticketArrow: { flexDirection: 'row', alignItems: 'center' },
  ticketLine: { width: 16, height: 1.5, backgroundColor: Colors.border },
  ticketPrice: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  ticketMeta: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', alignItems: 'center' },
  ticketBadge: {
    backgroundColor: Colors.bgMid, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill,
  },
  ticketSiege: { fontSize: 13, fontWeight: '800', color: Colors.textMid },
  ticketTarifBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  ticketTarifText: { fontSize: 13, fontWeight: '800' },
  ticketTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ticketTime: { fontSize: 13, color: Colors.textMuted, fontWeight: '700' },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: Colors.bgMid, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.textMid, marginBottom: 8 },
  emptySub: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.lg,
  },
  emptyBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
});

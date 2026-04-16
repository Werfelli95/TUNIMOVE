import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, RefreshControl
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Users, RefreshCw, Ticket } from 'lucide-react-native';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/sales/bus';

interface TicketItem {
  id_ticket: number;
  siege: string;
  type_tarif: string;
  montant_total: string;
  heure_depart: string;
  station_depart: string;
  station_arrivee: string;
  date_emission: string;
}

export default function ManifesteScreen() {
  const params = useLocalSearchParams();
  const numero_bus = params.numero_bus as string;
  const ville_depart = params.ville_depart as string;
  const ville_arrivee = params.ville_arrivee as string;
  const service_id = params.service_id as string;

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchManifeste = async () => {
    try {
      let url: string;
      if (service_id) {
        // Fetch tickets for the specific service (more accurate)
        url = `http://localhost:5000/api/receveur-service/${service_id}/tickets`;
      } else {
        // Fallback: all tickets for this bus today
        url = `http://localhost:5000/api/sales/bus/${encodeURIComponent(numero_bus)}/manifeste`;
      }
      const res = await axios.get<TicketItem[]>(url);
      setTickets(res.data);
    } catch (err) {
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchManifeste(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchManifeste(); };

  const TARIF_COLORS: Record<string, string> = {
    'Normal': '#6366f1',
    'Étudiant': '#059669',
    'Militaire': '#d97706',
  };

  const renderItem = ({ item, index }: { item: TicketItem; index: number }) => (
    <View style={styles.ticketCard}>
      <View style={styles.ticketLeft}>
        <Text style={styles.ticketNum}>#{index + 1}</Text>
        <View style={[styles.tarifBadge, { backgroundColor: TARIF_COLORS[item.type_tarif] || '#94a3b8' }]}>
          <Text style={styles.tarifText}>{item.type_tarif}</Text>
        </View>
      </View>
      <View style={styles.ticketInfo}>
        <Text style={styles.ticketSiege}>Siège {item.siege || '—'}</Text>
        <Text style={styles.ticketHeure}>{item.heure_depart ? String(item.heure_depart).substring(0, 5) : '—'}</Text>
        <Text style={styles.ticketDate}>
          {new Date(item.date_emission).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={styles.ticketPrix}>{parseFloat(item.montant_total || '0').toFixed(3)} TND</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Users color="#fbbf24" size={22} />
          <Text style={styles.headerTitle}>Bus Nº {numero_bus}</Text>
        </View>
        {ville_depart && ville_arrivee && (
          <Text style={styles.headerRoute}>{ville_depart} → {ville_arrivee}</Text>
        )}
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{tickets.length}</Text>
          <Text style={styles.statLabel}>Passagers</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {tickets.reduce((sum, t) => sum + parseFloat(t.montant_total || '0'), 0).toFixed(3)}
          </Text>
          <Text style={styles.statLabel}>TND encaissés</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1a3a52" style={{ marginTop: 40 }} />
      ) : tickets.length === 0 ? (
        <View style={styles.emptyState}>
          <Ticket color="#cbd5e1" size={64} />
          <Text style={styles.emptyText}>Aucun passager enregistré aujourd'hui</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => String(item.id_ticket)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
        <RefreshCw color="#fff" size={18} />
        <Text style={styles.refreshText}>Actualiser</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#1a3a52', padding: 20, paddingTop: 24,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
  headerRoute: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  headerDate: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statsRow: {
    flexDirection: 'row', padding: 16, gap: 12,
  },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    alignItems: 'center',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  statValue: { fontSize: 26, fontWeight: 'bold', color: '#1a3a52' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  list: { padding: 16, paddingBottom: 80 },
  ticketCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  ticketLeft: { alignItems: 'center', width: 56 },
  ticketNum: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  tarifBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, marginTop: 6 },
  tarifText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  ticketInfo: { flex: 1, marginLeft: 12 },
  ticketSiege: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  ticketHeure: { fontSize: 13, color: '#64748b', marginTop: 2 },
  ticketDate: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  ticketPrix: { fontSize: 14, fontWeight: '700', color: '#1a3a52' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#94a3b8', marginTop: 16, textAlign: 'center' },
  refreshBtn: {
    position: 'absolute', bottom: 20, alignSelf: 'center',
    backgroundColor: '#1a3a52', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30,
    gap: 8, elevation: 4,
  },
  refreshText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

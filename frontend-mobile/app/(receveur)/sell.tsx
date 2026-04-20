import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/sales/tickets/vendre';
const TARIF_OPTIONS = ['Normal', 'Étudiant', 'Militaire'];

export default function SellScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const numero_bus = params.numero_bus as string;
  const ville_depart = params.ville_depart as string;
  const ville_arrivee = params.ville_arrivee as string;

  const [siege, setSiege] = useState('');
  const [prix, setPrix] = useState('');
  const [heure, setHeure] = useState('');
  const [tarif, setTarif] = useState('Normal');
  const [showTarif, setShowTarif] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSell = async () => {
    if (!siege || !prix || !heure) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(API_URL, {
        num_ligne: null,
        bus: numero_bus,
        date_voyage: today,
        heure,
        siege,
        prix: parseFloat(prix),
        arret_depart: ville_depart || '',
        arret_arrivee: ville_arrivee || '',
        agent_id: null,
        type_tarif: tarif,
      });
      Alert.alert('✅ Succès', 'Billet vendu avec succès !', [
        { text: 'Nouveau billet', onPress: () => { setSiege(''); setPrix(''); setHeure(''); } },
        { text: 'Retour', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de la vente';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Info bus */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoLabel}>Bus Nº {numero_bus || '—'}</Text>
        {ville_depart && ville_arrivee && (
          <Text style={styles.infoRoute}>{ville_depart} → {ville_arrivee}</Text>
        )}
        <Text style={styles.infoDate}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>

      <Text style={styles.sectionTitle}>Informations du billet</Text>

      {/* Siège */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Siège *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: A1, 12, B3"
          value={siege}
          onChangeText={setSiege}
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
        />
      </View>

      {/* Heure */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Heure de départ *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 08:30"
          value={heure}
          onChangeText={setHeure}
          placeholderTextColor="#94a3b8"
          keyboardType="numbers-and-punctuation"
        />
      </View>

      {/* Prix */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Prix (TND) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 12.500"
          value={prix}
          onChangeText={setPrix}
          placeholderTextColor="#94a3b8"
          keyboardType="decimal-pad"
        />
      </View>

      {/* Type de tarif */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Type de tarif</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowTarif(!showTarif)}>
          <Text style={styles.dropdownText}>{tarif}</Text>
          <ChevronDown color="#64748b" size={20} />
        </TouchableOpacity>
        {showTarif && (
          <View style={styles.dropdownMenu}>
            {TARIF_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.dropdownItem, tarif === opt && styles.dropdownItemActive]}
                onPress={() => { setTarif(opt); setShowTarif(false); }}
              >
                <Text style={[styles.dropdownItemText, tarif === opt && styles.dropdownItemTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Bouton vendre */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSell}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#1a3a52" />
        ) : (
          <Text style={styles.buttonText}>Émettre le billet</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  infoBanner: {
    backgroundColor: '#1a3a52',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoLabel: { fontSize: 24, fontWeight: 'bold', color: '#fbbf24' },
  infoRoute: { fontSize: 16, color: '#94a3b8', marginTop: 4 },
  infoDate: { fontSize: 14, color: '#64748b', marginTop: 4 },
  sectionTitle: {
    fontSize: 18, fontWeight: '800', color: '#334155',
    marginBottom: 16,
  },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 15, fontWeight: '700', color: '#475569', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, height: 52,
    paddingHorizontal: 16, fontSize: 18, color: '#0f172a',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dropdownText: { fontSize: 18, color: '#0f172a' },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemActive: { backgroundColor: '#eff6ff' },
  dropdownItemText: { fontSize: 17, color: '#334155' },
  dropdownItemTextActive: { color: '#1a3a52', fontWeight: '800' },
  button: {
    backgroundColor: '#fbbf24', height: 56,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0, elevation: 0 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#1a3a52' },
});

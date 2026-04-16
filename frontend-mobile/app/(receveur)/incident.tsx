import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, AlertTriangle } from 'lucide-react-native';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/incidents';

const TYPE_OPTIONS = [
  'Panne mécanique',
  'Accident de la route',
  'Passager indiscipliné',
  'Problème de billet',
  'Retard',
  'Autre',
];

export default function IncidentScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const numero_bus = params.numero_bus as string;
  const ville_depart = params.ville_depart as string;
  const ville_arrivee = params.ville_arrivee as string;
  const nom = params.nom as string;
  const prenom = params.prenom as string;

  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [showType, setShowType] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Erreur', 'Veuillez décrire l\'incident.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(API_URL, {
        type_incident: type,
        description: description.trim(),
        numero_bus,
        ligne: ville_depart && ville_arrivee ? `${ville_depart} - ${ville_arrivee}` : null,
        rapporte_par: `${prenom} ${nom}`,
        date_incident: new Date().toISOString(),
      });
      Alert.alert('✅ Incident signalé', 'Votre rapport a été transmis au dispatch.', [
        { text: 'OK', onPress: () => { setDescription(''); setType(TYPE_OPTIONS[0]); router.back(); } }
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'envoi du rapport';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.alertBanner}>
        <AlertTriangle color="#dc2626" size={28} />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.alertTitle}>Rapport d'incident</Text>
          <Text style={styles.alertSub}>Bus Nº {numero_bus} · {ville_depart} → {ville_arrivee}</Text>
        </View>
      </View>

      {/* Type */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Type d'incident *</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowType(!showType)}>
          <Text style={styles.dropdownText}>{type}</Text>
          <ChevronDown color="#64748b" size={20} />
        </TouchableOpacity>
        {showType && (
          <View style={styles.dropdownMenu}>
            {TYPE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.dropdownItem, type === opt && styles.dropdownItemActive]}
                onPress={() => { setType(opt); setShowType(false); }}
              >
                <Text style={[styles.dropdownItemText, type === opt && styles.dropdownItemTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Décrivez l'incident en détail…"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Rapporté par */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Signalé par</Text>
        <View style={styles.readonlyField}>
          <Text style={styles.readonlyText}>{prenom} {nom}</Text>
        </View>
      </View>

      {/* Date */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Date et heure</Text>
        <View style={styles.readonlyField}>
          <Text style={styles.readonlyText}>
            {new Date().toLocaleString('fr-FR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Envoyer le rapport</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5',
    borderRadius: 16, padding: 16, marginBottom: 24,
  },
  alertTitle: { fontSize: 17, fontWeight: '700', color: '#dc2626' },
  alertSub: { fontSize: 13, color: '#b91c1c', marginTop: 2 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  dropdown: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, height: 52, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dropdownText: { fontSize: 15, color: '#0f172a' },
  dropdownMenu: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemActive: { backgroundColor: '#fef2f2' },
  dropdownItemText: { fontSize: 14, color: '#334155' },
  dropdownItemTextActive: { color: '#dc2626', fontWeight: '700' },
  textarea: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, padding: 14, fontSize: 15, color: '#0f172a',
    minHeight: 130,
  },
  readonlyField: {
    backgroundColor: '#f1f5f9', borderRadius: 12, height: 52,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  readonlyText: { fontSize: 15, color: '#64748b' },
  button: {
    backgroundColor: '#dc2626', height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
    shadowColor: '#dc2626', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { backgroundColor: '#fca5a5', shadowOpacity: 0, elevation: 0 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});

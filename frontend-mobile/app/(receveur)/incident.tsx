import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Alert, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle, Wrench, Car, Heart, Shield, HelpCircle,
  CheckCircle, X, Bus, Navigation, Clock, User, ChevronRight
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow } from '../../constants/theme';
import { INCIDENTS_API, RECEVEUR_SERVICE_API } from '../../constants/api';

const CATEGORIES = [
  { key: 'panne_mecanique',    label: 'Panne mécanique',   icon: Wrench,        color: Colors.warning },
  { key: 'accident',           label: 'Accident',          icon: Car,           color: Colors.danger  },
  { key: 'malaise_passager',   label: 'Malaise passager',  icon: Heart,         color: '#E11D48'      },
  { key: 'probleme_securite',  label: 'Problème sécurité', icon: Shield,        color: '#7C3AED'      },
  { key: 'retard',             label: 'Retard',            icon: Clock,         color: Colors.info    },
  { key: 'autre',              label: 'Autre',             icon: HelpCircle,    color: Colors.textMuted },
];

const SEVERITY = [
  { key: 'faible',   label: 'Faible',    sub: 'Signalement informatif',   color: Colors.success },
  { key: 'moyenne',  label: 'Moyenne',   sub: 'Intervention recommandée', color: Colors.warning },
  { key: 'critique', label: 'Critique',  sub: 'Intervention immédiate',   color: Colors.danger  },
];

export default function IncidentScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const numero_bus = params.numero_bus as string;
  const ville_depart = params.ville_depart as string;
  const ville_arrivee = params.ville_arrivee as string;
  const num_ligne = params.num_ligne as string;
  const service_id = params.service_id as string;
  const nom = params.nom as string;
  const prenom = params.prenom as string;

  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const isValid = category && severity && description.trim().length >= 10;
  const isCritical = severity === 'critique';

  const handleSubmit = () => {
    if (!isValid) return;
    setConfirmModal(true);
  };

  const confirmSubmit = async (closeService = false) => {
    setConfirmModal(false);
    setSubmitting(true);
    try {
      await axios.post(INCIDENTS_API, {
        type_incident: `${category} [${severity}]`,
        description: description.trim(),
        numero_bus,
        ligne: num_ligne,
        rapporte_par: `${prenom} ${nom}`,
      });

      if (closeService && service_id) {
        await axios.post(`${RECEVEUR_SERVICE_API}/${service_id}/close`, {
          raison_incident: `${category} — ${severity}: ${description.trim()}`,
        });
      }

      setSuccessModal(true);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Service Context ── */}
        {numero_bus && (
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>Contexte du rapport</Text>
            <View style={styles.contextGrid}>
              <View style={styles.contextItem}>
                <Bus color={Colors.primaryLight} size={14} />
                <Text style={styles.contextLabel}>Bus</Text>
                <Text style={styles.contextValue}>N° {numero_bus}</Text>
              </View>
              <View style={styles.contextItem}>
                <Navigation color={Colors.primaryLight} size={14} />
                <Text style={styles.contextLabel}>Ligne</Text>
                <Text style={styles.contextValue}>{num_ligne || '—'}</Text>
              </View>
              <View style={styles.contextItem}>
                <User color={Colors.primaryLight} size={14} />
                <Text style={styles.contextLabel}>Agent</Text>
                <Text style={styles.contextValue}>{prenom} {nom}</Text>
              </View>
              {service_id && (
                <View style={styles.contextItem}>
                  <Clock color={Colors.primaryLight} size={14} />
                  <Text style={styles.contextLabel}>Service</Text>
                  <Text style={styles.contextValue}>#{service_id}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Step 1: Category ── */}
        <Text style={styles.stepLabel}>1 — Catégorie d'incident *</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const active = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catCard, active && { borderColor: cat.color, backgroundColor: cat.color + '12' }]}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Icon color={active ? cat.color : Colors.textMuted} size={22} />
                <Text style={[styles.catLabel, active && { color: cat.color, fontWeight: '800' }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Step 2: Severity ── */}
        <Text style={styles.stepLabel}>2 — Gravité *</Text>
        <View style={styles.sevList}>
          {SEVERITY.map(sev => {
            const active = severity === sev.key;
            return (
              <TouchableOpacity
                key={sev.key}
                style={[styles.sevCard, active && { borderColor: sev.color, backgroundColor: sev.color + '10' }]}
                onPress={() => setSeverity(sev.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.sevDot, { backgroundColor: active ? sev.color : Colors.border }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sevLabel, active && { color: sev.color }]}>{sev.label}</Text>
                  <Text style={styles.sevSub}>{sev.sub}</Text>
                </View>
                {active && <ChevronRight color={sev.color} size={16} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Step 3: Description ── */}
        <Text style={styles.stepLabel}>3 — Description *</Text>
        <View style={styles.descWrap}>
          <TextInput
            style={styles.descInput}
            placeholder="Décrivez l'incident en détail (minimum 10 caractères)..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            placeholderTextColor={Colors.textLight}
          />
          <Text style={styles.descCount}>{description.length} / 500</Text>
        </View>

        {/* ── Critical Warning ── */}
        {isCritical && (
          <View style={styles.criticalBanner}>
            <AlertTriangle color={Colors.danger} size={18} />
            <Text style={styles.criticalText}>
              Incident critique — Une demande d'intervention immédiate sera transmise.
              {service_id ? ' La clôture anticipée du service sera proposée.' : ''}
            </Text>
          </View>
        )}

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color={Colors.white} />
            : <><AlertTriangle color={Colors.white} size={18} /><Text style={styles.submitBtnText}>Envoyer le rapport</Text></>
          }
        </TouchableOpacity>
      </ScrollView>

      {/* ── Confirm Modal ── */}
      <Modal visible={confirmModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Confirmer le rapport</Text>

            <View style={styles.modalSummary}>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Catégorie</Text>
                <Text style={styles.modalSummaryValue}>
                  {CATEGORIES.find(c => c.key === category)?.label}
                </Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Gravité</Text>
                <Text style={[styles.modalSummaryValue, {
                  color: SEVERITY.find(s => s.key === severity)?.color
                }]}>
                  {SEVERITY.find(s => s.key === severity)?.label}
                </Text>
              </View>
            </View>

            {isCritical && service_id && (
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: Colors.danger + '40' }]}
                onPress={() => confirmSubmit(true)}
              >
                <AlertTriangle color={Colors.danger} size={16} />
                <Text style={[styles.modalBtnText, { color: Colors.danger }]}>
                  Signaler et clôturer le service
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: Colors.primary }]}
              onPress={() => confirmSubmit(false)}
            >
              <Text style={[styles.modalBtnText, { color: Colors.white }]}>
                {isCritical ? 'Signaler sans fermer le service' : 'Confirmer l\'envoi'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: Colors.bgMid }]}
              onPress={() => setConfirmModal(false)}
            >
              <Text style={[styles.modalBtnText, { color: Colors.textMuted }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Success Modal ── */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <CheckCircle color={Colors.success} size={48} />
            </View>
            <Text style={styles.successTitle}>Rapport envoyé</Text>
            <Text style={styles.successSub}>
              L'incident a été signalé et transmis à votre responsable.
            </Text>
            <TouchableOpacity style={styles.successBtn} onPress={() => { setSuccessModal(false); router.replace('/(receveur)/dashboard'); }}>
              <Text style={styles.successBtnText}>Retour au tableau de bord</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { flex: 1 },
  content: { padding: Spacing.base, paddingBottom: 40 },

  // Context Card
  contextCard: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    padding: Spacing.base, marginBottom: Spacing.base, ...Shadow.strong,
  },
  contextTitle: { fontSize: 13, color: Colors.accent, fontWeight: '800', letterSpacing: 1, marginBottom: Spacing.sm },
  contextGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  contextItem: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.white + '12',
    borderRadius: Radius.md, padding: 10, gap: 2, alignItems: 'center',
  },
  contextLabel: { fontSize: 12, color: Colors.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  contextValue: { fontSize: 15, color: Colors.white, fontWeight: '800' },

  // Steps
  stepLabel: {
    fontSize: 14, fontWeight: '800', color: Colors.textMid,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: Spacing.sm, marginTop: Spacing.base,
  },

  // Category Grid
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: 4 },
  catCard: {
    width: '31%', backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 6,
    borderWidth: 2, borderColor: 'transparent', ...Shadow.card,
  },
  catLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' },

  // Severity
  sevList: { gap: Spacing.sm, marginBottom: 4 },
  sevCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.base,
    borderWidth: 2, borderColor: 'transparent', ...Shadow.card,
  },
  sevDot: { width: 14, height: 14, borderRadius: 7 },
  sevLabel: { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  sevSub: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },

  // Description
  descWrap: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, ...Shadow.card, marginBottom: 4,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  descInput: {
    fontSize: 16, color: Colors.textDark, minHeight: 100, lineHeight: 22,
  },
  descCount: { fontSize: 13, color: Colors.textLight, textAlign: 'right', marginTop: 4 },

  // Critical
  criticalBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.dangerLight, borderRadius: Radius.md,
    padding: Spacing.md, marginTop: Spacing.md,
    borderWidth: 1, borderColor: Colors.danger + '30',
  },
  criticalText: { flex: 1, fontSize: 14, color: Colors.danger, fontWeight: '700', lineHeight: 18 },

  // Submit
  submitBtn: {
    backgroundColor: Colors.danger, height: 56, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: Spacing.lg,
    ...Platform.select({
      web: { boxShadow: '0px 4px 8px rgba(220, 38, 38, 0.25)' },
      default: { shadowColor: Colors.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
    }),
  },
  submitBtnDisabled: { backgroundColor: Colors.bgMid, ...Platform.select({ web: { boxShadow: 'none' }, default: { shadowOpacity: 0, elevation: 0 } }) },
  submitBtnText: { color: Colors.white, fontWeight: '800', fontSize: 17 },

  // Confirm Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, paddingBottom: 40, gap: Spacing.sm,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: Spacing.sm,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textDark, marginBottom: Spacing.md },
  modalSummary: {
    backgroundColor: Colors.bgLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  modalSummaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  modalSummaryLabel: { fontSize: 15, color: Colors.textMuted },
  modalSummaryValue: { fontSize: 15, fontWeight: '800', color: Colors.textDark },
  modalBtn: {
    height: 50, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  modalBtnText: { fontSize: 16, fontWeight: '800' },

  // Success
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 40 },
  successBox: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    padding: Spacing.xl, alignItems: 'center', width: '100%', ...Shadow.strong,
  },
  successIcon: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.textDark, marginBottom: 8 },
  successSub: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },
  successBtn: {
    backgroundColor: Colors.primary, height: 50, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center', width: '100%',
  },
  successBtnText: { color: Colors.white, fontWeight: '800', fontSize: 17 },
});

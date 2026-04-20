import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, ActivityIndicator, Alert, Dimensions, Vibration
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CheckCircle, XCircle, AlertCircle, Clock, Zap, ZapOff,
  LogOut, ChevronDown, Ticket, MapPin, Calendar, History
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow } from '../../constants/theme';

const { width, height } = Dimensions.get('window');
const FRAME_SIZE = width * 0.68;
const BASE = 'http://localhost:5000/api/sales/tickets';

type ScanStatus = 'valid' | 'invalid' | 'expired' | 'used';

interface ScanResult {
  status: ScanStatus;
  code: string;
  ticket?: {
    id_ticket: number;
    code_ticket: string;
    siege: string;
    type_tarif: string;
    montant_total: number;
    station_depart: string;
    station_arrivee: string;
    heure_depart: string;
    date_emission: string;
    date_scan?: string;
    num_ligne?: string;
  };
  message: string;
  scanned_at: string;
}

const STATUS_CONFIG: Record<ScanStatus, { color: string; bg: string; icon: any; label: string }> = {
  valid:   { color: Colors.success, bg: Colors.successLight, icon: CheckCircle, label: 'VALIDE' },
  invalid: { color: Colors.danger,  bg: Colors.dangerLight,  icon: XCircle,    label: 'INVALIDE' },
  expired: { color: Colors.warning, bg: Colors.warningLight, icon: AlertCircle, label: 'EXPIRÉ' },
  used:    { color: Colors.warning, bg: Colors.warningLight, icon: AlertCircle, label: 'DÉJÀ UTILISÉ' },
};

export default function ScannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const nom = params.nom as string;
  const prenom = params.prenom as string;

  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const lastScanned = useRef<string>('');
  const cooldown = useRef(false);

  const handleBarCode = async ({ data }: { data: string }) => {
    if (!scanning || processing || cooldown.current || data === lastScanned.current) return;
    cooldown.current = true;
    lastScanned.current = data;
    setScanning(false);
    setProcessing(true);

    try {
      const res = await axios.post<any>(`${BASE}/scan`, { code_ticket: data });
      const result: ScanResult = {
        status: 'valid',
        code: data,
        ticket: res.data.ticket,
        message: res.data.message || 'Ticket valide',
        scanned_at: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      Vibration.vibrate(100);
      setLastResult(result);
      setHistory(prev => [result, ...prev.slice(0, 9)]);
      setResultModal(true);
    } catch (err: any) {
      const msg: string = err.response?.data?.message || 'Ticket invalide';
      let status: ScanStatus = 'invalid';
      if (msg.toLowerCase().includes('déjà') || msg.toLowerCase().includes('utilisé')) status = 'used';
      if (msg.toLowerCase().includes('expiré')) status = 'expired';

      Vibration.vibrate([0, 100, 100, 100]);
      const result: ScanResult = {
        status,
        code: data,
        ticket: err.response?.data?.ticket,
        message: msg,
        scanned_at: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setLastResult(result);
      setHistory(prev => [result, ...prev.slice(0, 9)]);
      setResultModal(true);
    } finally {
      setProcessing(false);
      setTimeout(() => { cooldown.current = false; }, 2000);
    }
  };

  const closeResult = () => {
    setResultModal(false);
    setLastResult(null);
    setScanning(true);
    lastScanned.current = '';
  };

  const handleLogout = () =>
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: () => router.replace('/') },
    ]);

  // ── Permission not granted ──
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors.bgLight }]}>
        <View style={styles.permBox}>
          <View style={styles.permIcon}>
            <Ticket color={Colors.primary} size={40} />
          </View>
          <Text style={styles.permTitle}>Accès caméra requis</Text>
          <Text style={styles.permSub}>
            TuniMove a besoin d'accéder à votre caméra pour scanner les QR codes des billets.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Autoriser l'accès</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.permBackBtn} onPress={() => router.replace('/')}>
            <Text style={styles.permBackBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Camera Full Screen ── */}
      {!showHistory && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torch}
          onBarcodeScanned={scanning && !processing ? handleBarCode : undefined}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
      )}

      {showHistory ? (
        <SafeAreaView style={styles.historyContainer}>
          {/* History Top Bar */}
          <View style={styles.histTopBar}>
            <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.histBackBtn}>
              <ChevronDown color={Colors.textDark} size={22} />
            </TouchableOpacity>
            <Text style={styles.histTitle}>Historique des scans</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: Spacing.base, paddingBottom: 40 }}>
            {history.length === 0 ? (
              <View style={styles.emptyHist}>
                <History color={Colors.textLight} size={40} />
                <Text style={styles.emptyHistText}>Aucun scan effectué</Text>
              </View>
            ) : history.map((item, i) => {
              const cfg = STATUS_CONFIG[item.status];
              const Icon = cfg.icon;
              return (
                <View key={i} style={[styles.histCard, { borderLeftColor: cfg.color }]}>
                  <View style={styles.histCardLeft}>
                    <Icon color={cfg.color} size={20} />
                    <View>
                      <Text style={[styles.histStatus, { color: cfg.color }]}>{cfg.label}</Text>
                      <Text style={styles.histCode} numberOfLines={1}>{item.code.slice(0, 20)}…</Text>
                    </View>
                  </View>
                  <Text style={styles.histTime}>{item.scanned_at}</Text>
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      ) : (
        <>
          {/* ── Overlay Top Bar ── */}
          <SafeAreaView style={styles.overlayTop}>
            <View style={styles.scanTopBar}>
              <View>
                <Text style={styles.scanTitle}>Contrôle Billets</Text>
                <Text style={styles.scanAgent}>{prenom} {nom}</Text>
              </View>
              <View style={styles.scanTopActions}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setShowHistory(true)}
                >
                  <History color={Colors.white} size={20} />
                  {history.length > 0 && (
                    <View style={styles.histBadge}>
                      <Text style={styles.histBadgeText}>{history.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
                  <LogOut color={Colors.white} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          {/* ── Scan Frame ── */}
          <View style={styles.frameContainer}>
            {/* Darken corners */}
            <View style={styles.darkTop} />
            <View style={styles.frameRow}>
              <View style={styles.darkSide} />
              {/* The actual frame */}
              <View style={styles.frame}>
                {/* Corners */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                {/* Processing indicator */}
                {processing && (
                  <View style={styles.processingOverlay}>
                    <ActivityIndicator color={Colors.accent} size="large" />
                  </View>
                )}
              </View>
              <View style={styles.darkSide} />
            </View>
            <View style={styles.darkBottom} />
          </View>

          {/* ── Bottom Instruction ── */}
          <View style={styles.overlayBottom}>
            <Text style={styles.scanInstruction}>
              {processing
                ? 'Vérification en cours...'
                : 'Placez le QR code dans le cadre'
              }
            </Text>
            <TouchableOpacity
              style={[styles.torchBtn, torch && styles.torchBtnActive]}
              onPress={() => setTorch(t => !t)}
            >
              {torch
                ? <ZapOff color={Colors.primary} size={22} />
                : <Zap color={Colors.white} size={22} />
              }
              <Text style={[styles.torchText, torch && { color: Colors.primary }]}>
                {torch ? 'Torche ON' : 'Torche'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Result Bottom Sheet ── */}
      <Modal visible={resultModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={closeResult} />
          <View style={styles.sheet}>
            {lastResult && (() => {
              const cfg = STATUS_CONFIG[lastResult.status];
              const Icon = cfg.icon;
              return (
                <>
                  {/* Handle */}
                  <View style={styles.sheetHandle} />

                  {/* Status Header */}
                  <View style={[styles.sheetStatus, { backgroundColor: cfg.bg }]}>
                    <Icon color={cfg.color} size={36} strokeWidth={2} />
                    <View>
                      <Text style={[styles.sheetStatusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                      <Text style={styles.sheetMessage}>{lastResult.message}</Text>
                    </View>
                  </View>

                  {/* Ticket Details */}
                  {lastResult.ticket && (
                    <View style={styles.sheetDetails}>
                      <View style={styles.detailRow}>
                        <Ticket color={Colors.textMuted} size={15} />
                        <Text style={styles.detailLabel}>N° Billet</Text>
                        <Text style={styles.detailValue}>#{lastResult.ticket.id_ticket}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MapPin color={Colors.textMuted} size={15} />
                        <Text style={styles.detailLabel}>Trajet</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                          {lastResult.ticket.station_depart} → {lastResult.ticket.station_arrivee}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Clock color={Colors.textMuted} size={15} />
                        <Text style={styles.detailLabel}>Heure</Text>
                        <Text style={styles.detailValue}>{lastResult.ticket.heure_depart}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Calendar color={Colors.textMuted} size={15} />
                        <Text style={styles.detailLabel}>Tarif</Text>
                        <Text style={styles.detailValue}>{lastResult.ticket.type_tarif}</Text>
                      </View>
                      <View style={[styles.detailRow, styles.detailRowTotal]}>
                        <Text style={styles.detailTotalLabel}>Montant</Text>
                        <Text style={styles.detailTotalValue}>
                          {parseFloat(String(lastResult.ticket.montant_total)).toFixed(3)} TND
                        </Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity style={styles.sheetClose} onPress={closeResult}>
                    <Text style={styles.sheetCloseText}>Scanner un autre billet</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const DARK = 'rgba(0,0,0,0.65)';
const CORNER_SIZE = 28;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgLight },

  // Permission
  permBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl,
  },
  permIcon: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: Colors.bgMid, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  permTitle: { fontSize: 20, fontWeight: '800', color: Colors.textDark, marginBottom: 8 },
  permSub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },
  permBtn: {
    backgroundColor: Colors.primary, height: 52, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
    marginBottom: Spacing.md,
  },
  permBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  permBackBtn: { padding: Spacing.md },
  permBackBtnText: { color: Colors.textMuted, fontSize: 14 },

  // Overlay top
  overlayTop: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  scanTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanTitle: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  scanAgent: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 },
  scanTopActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  histBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  histBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary },

  // Frame (dark corners)
  frameContainer: { flex: 1, justifyContent: 'center' },
  darkTop: { backgroundColor: DARK, height: '20%' },
  frameRow: { flexDirection: 'row', height: FRAME_SIZE },
  darkSide: { flex: 1, backgroundColor: DARK },
  darkBottom: { backgroundColor: DARK, flex: 1 },
  frame: {
    width: FRAME_SIZE, height: FRAME_SIZE,
    alignItems: 'center', justifyContent: 'center',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: Colors.accent,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 6 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Bottom
  overlayBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingBottom: 40, paddingTop: Spacing.lg,
    alignItems: 'center', gap: Spacing.base,
    zIndex: 10,
  },
  scanInstruction: { color: Colors.white, fontSize: 14, fontWeight: '600', opacity: 0.9 },
  torchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.pill,
  },
  torchBtnActive: { backgroundColor: Colors.accent },
  torchText: { color: Colors.white, fontSize: 13, fontWeight: '700' },

  // History
  historyContainer: { flex: 1, backgroundColor: Colors.bgLight },
  histTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  histBackBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.bgMid, alignItems: 'center', justifyContent: 'center',
  },
  histTitle: { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  histCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.base,
    marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderLeftWidth: 4, ...Shadow.card,
  },
  histCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  histStatus: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  histCode: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  histTime: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  emptyHist: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyHistText: { fontSize: 14, color: Colors.textMuted },

  // Result Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 40, overflow: 'hidden',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  sheetStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    margin: Spacing.base, padding: Spacing.base, borderRadius: Radius.lg,
  },
  sheetStatusLabel: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  sheetMessage: { fontSize: 13, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
  sheetDetails: {
    marginHorizontal: Spacing.base, borderRadius: Radius.lg,
    backgroundColor: Colors.bgLight, overflow: 'hidden', marginBottom: Spacing.base,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.base, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  detailRowTotal: { borderBottomWidth: 0, borderTopWidth: 1, borderTopColor: Colors.divider },
  detailLabel: { flex: 1, fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  detailValue: { fontSize: 13, color: Colors.textDark, fontWeight: '700', maxWidth: '55%' },
  detailTotalLabel: { flex: 1, fontSize: 14, color: Colors.textDark, fontWeight: '800' },
  detailTotalValue: { fontSize: 18, color: Colors.success, fontWeight: '900' },
  sheetClose: {
    backgroundColor: Colors.primary, height: 52, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: Spacing.base,
  },
  sheetCloseText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
});

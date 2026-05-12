import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Image, Modal, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bus, ScanLine, User, Lock, Eye, EyeOff, ChevronRight, AlertCircle, Mail, X, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme';
import { AUTH_API, API_IP, API_PORT } from '../constants/api';

const { width } = Dimensions.get('window');
const PASSWORD_RESET_API = AUTH_API.replace('/auth', '/password-reset');

export default function LoginScreen() {
  const router = useRouter();
  const [role, setRole] = useState<'receveur' | 'controleur' | null>(null);
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matriculeError, setMatriculeError] = useState('');

  // Forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [forgotMatricule, setForgotMatricule] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const isMatriculeValid = matricule.trim().length >= 3;
  const isPasswordValid = password.length >= 1;
  const canSubmit = role !== null && (role === 'controleur' || (isMatriculeValid && isPasswordValid));

  const handleMatriculeChange = (val: string) => {
    setMatricule(val);
    setError('');
    if (val && val.length < 3) {
      setMatriculeError('Matricule trop court');
    } else {
      setMatriculeError('');
    }
  };

  const handleLogin = async () => {
    if (!canSubmit) return;
    setError('');
    setLoading(true);

    try {
      if (role === 'receveur') {
        const res = await axios.post<any>(`${AUTH_API}/login/receveur`, { matricule: matricule.trim(), password });
        const { user } = res.data;
        router.replace({
          pathname: '/(receveur)/dashboard',
          params: {
            userId: user.id, nom: user.nom, prenom: user.prenom, matricule: user.matricule,
            numero_bus: '', ville_depart: '', ville_arrivee: '', num_ligne: '',
            login_time: Date.now().toString(),
          }
        });
      } else {
        const res = await axios.post<any>(`${AUTH_API}/login/controleur`, { matricule: matricule.trim(), password });
        const { user, affectation } = res.data;
        router.replace({
          pathname: '/(controleur)/scanner',
          params: {
            userId: user.id, nom: user.nom, prenom: user.prenom, matricule: user.matricule,
            image_url: user.image_url || '', numero_bus: affectation?.numero_bus ?? '',
            login_time: Date.now().toString(),
          }
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Échec de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Immersive Brand ── */}
            <View style={styles.brandContainer}>
              <View style={styles.logoWrapper}>
                <Image 
                  source={require('../assets/images/tunimovebus.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandTitle}>TUNIMOVE <Text style={styles.brandAccent}>FIELD</Text></Text>
              <View style={styles.brandLine} />
              <Text style={styles.brandSubtitle}>GESTION DU RÉSEAU SNTRI</Text>
            </View>

            {/* ── Role Selection (Premium Horizontal Cards) ── */}
            <Text style={styles.sectionLabel}>SÉLECTIONNER VOTRE RÔLE</Text>
            <View style={styles.roleGrid}>
              <TouchableOpacity
                style={[styles.roleCard, role === 'receveur' && styles.roleCardActive]}
                onPress={() => { setRole('receveur'); setError(''); }}
                activeOpacity={0.8}
              >
                <View style={[styles.roleIconWrap, role === 'receveur' && styles.roleIconActive]}>
                  <User color={role === 'receveur' ? Colors.white : Colors.primary} size={28} strokeWidth={2.5} />
                </View>
                <Text style={[styles.roleName, role === 'receveur' && styles.roleNameActive]}>Receveur</Text>
                {role === 'receveur' && <View style={styles.checkDot} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleCard, role === 'controleur' && styles.roleCardActive]}
                onPress={() => { setRole('controleur'); setError(''); }}
                activeOpacity={0.8}
              >
                <View style={[styles.roleIconWrap, role === 'controleur' && styles.roleIconActive]}>
                  <ScanLine color={role === 'controleur' ? Colors.white : Colors.primary} size={28} strokeWidth={2.5} />
                </View>
                <Text style={[styles.roleName, role === 'controleur' && styles.roleNameActive]}>Contrôleur</Text>
                {role === 'controleur' && <View style={styles.checkDot} />}
              </TouchableOpacity>
            </View>

            {/* ── Immersive Form ── */}
            {role && (
              <View style={styles.formCard}>
                <View style={styles.field}>
                  <Text style={styles.label}>MATRICULE</Text>
                  <View style={[styles.inputWrap, !!matriculeError && styles.inputError]}>
                    <User color={Colors.textMuted} size={18} strokeWidth={2.5} />
                    <TextInput
                      style={styles.input}
                      placeholder="REC001"
                      value={matricule}
                      onChangeText={handleMatriculeChange}
                      placeholderTextColor={Colors.textLight}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>MOT DE PASSE</Text>
                  <View style={styles.inputWrap}>
                    <Lock color={Colors.textMuted} size={18} strokeWidth={2.5} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      value={password}
                      onChangeText={v => { setPassword(v); setError(''); }}
                      secureTextEntry={!showPwd}
                      placeholderTextColor={Colors.textLight}
                    />
                    <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
                      {showPwd ? <EyeOff color={Colors.textMuted} size={18} /> : <Eye color={Colors.textMuted} size={18} />}
                    </TouchableOpacity>
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <AlertCircle color={Colors.danger} size={18} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity 
                  style={styles.forgotLink} 
                  onPress={() => setShowForgot(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.loginBtn, !canSubmit && styles.loginBtnDisabled]}
                  onPress={handleLogin}
                  disabled={!canSubmit || loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.primary} />
                  ) : (
                    <>
                      <Text style={styles.loginBtnText}>Se connecter</Text>
                      <ChevronRight color={Colors.primary} size={20} strokeWidth={3} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.footer}>© 2026 SNTRI · UNITÉ DE GESTION DIGITALE</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Forgot Password Modal (Simplified Luxury) ── */}
      <Modal visible={showForgot} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Récupération</Text>
              <TouchableOpacity onPress={() => setShowForgot(false)}>
                <X color={Colors.textDark} size={24} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>Contactez votre administrateur réseau ou saisissez vos identifiants pour une demande de réinitialisation.</Text>
            
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>MATRICULE AGENT</Text>
              <View style={styles.modalInput}>
                <User color={Colors.textMuted} size={18} />
                <TextInput 
                  style={styles.modalTextInput} 
                  placeholder="Ex: REC001" 
                  value={forgotMatricule}
                  onChangeText={setForgotMatricule}
                  autoCapitalize="characters" 
                />
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>ADRESSE E-MAIL AGENT</Text>
              <View style={styles.modalInput}>
                <Mail color={Colors.textMuted} size={18} />
                <TextInput 
                  style={styles.modalTextInput} 
                  placeholder="agent@sntri.com.tn" 
                  keyboardType="email-address" 
                  autoCapitalize="none"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                />
              </View>
            </View>

            {forgotError ? <Text style={styles.modalError}>{forgotError}</Text> : null}
            {forgotSuccess ? <Text style={styles.modalSuccess}>Demande envoyée ! Vérifiez vos e-mails.</Text> : null}

            <TouchableOpacity 
              style={[styles.modalSubmit, forgotLoading && { opacity: 0.7 }]} 
              onPress={async () => {
                if (!forgotMatricule || !forgotEmail) {
                  setForgotError('Veuillez remplir tous les champs');
                  return;
                }
                setForgotLoading(true);
                setForgotError('');
                try {
                  await axios.post(`${PASSWORD_RESET_API}/request`, { matricule: forgotMatricule, email: forgotEmail });
                  setForgotSuccess(true);
                } catch (err: any) {
                  setForgotError(err.response?.data?.message || 'Une erreur est survenue');
                } finally {
                  setForgotLoading(false);
                }
              }}
              disabled={forgotLoading}
            >
              {forgotLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.modalSubmitText}>ENVOYER LA DEMANDE</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl, paddingBottom: Spacing.xxxl },

  brandContainer: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logoWrapper: {
    width: 130, height: 130, borderRadius: 36,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl, ...Shadow.strong,
  },
  logo: { width: 110, height: 110 },
  brandTitle: { fontSize: 32, fontWeight: '900', color: Colors.primary, letterSpacing: -1 },
  brandAccent: { color: Colors.accent },
  brandLine: { width: 40, height: 4, backgroundColor: Colors.accent, marginVertical: 12, borderRadius: 2 },
  brandSubtitle: { fontSize: 13, color: Colors.textLight, fontWeight: '800', letterSpacing: 2 },

  sectionLabel: { fontSize: 11, fontWeight: '900', color: Colors.textMuted, textAlign: 'center', letterSpacing: 2, marginBottom: Spacing.lg },
  
  roleGrid: { flexDirection: 'row', gap: 14, marginBottom: Spacing.xxl },
  roleCard: {
    flex: 1, height: 120, borderRadius: Radius.xxl,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card, borderWidth: 2, borderColor: Colors.bgMid, gap: 10,
  },
  roleCardActive: {
    backgroundColor: Colors.primary, borderColor: Colors.primary, ...Shadow.strong,
  },
  roleIconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.bgMid, alignItems: 'center', justifyContent: 'center' },
  roleIconActive: { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  roleName: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  roleNameActive: { color: Colors.white },
  checkDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },

  formCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    padding: Spacing.xl, ...Shadow.strong, borderWidth: 1, borderColor: Colors.bgMid,
  },
  field: { marginBottom: Spacing.lg },
  label: { fontSize: 12, fontWeight: '900', color: Colors.textDark, marginBottom: 8, letterSpacing: 1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgLight, borderRadius: Radius.xl,
    borderWidth: 2, borderColor: Colors.bgMid, height: 60, paddingHorizontal: Spacing.lg,
  },
  inputError: { borderColor: Colors.danger + '40' },
  input: { flex: 1, fontSize: 18, color: Colors.textDark, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.danger + '10', padding: 16, borderRadius: Radius.lg,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.danger + '20',
  },
  errorText: { flex: 1, fontSize: 14, color: Colors.danger, fontWeight: '800' },
  
  forgotLink: { alignSelf: 'flex-end', marginBottom: Spacing.xl },
  forgotText: { fontSize: 14, color: Colors.primary, fontWeight: '900' },

  loginBtn: {
    backgroundColor: Colors.accent, height: 68, borderRadius: Radius.xl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, ...Shadow.accent,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: 17, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },

  footer: { textAlign: 'center', fontSize: 11, color: Colors.textLight, fontWeight: '800', letterSpacing: 1, marginTop: Spacing.xxxl },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', padding: Spacing.xl },
  modalCard: { backgroundColor: Colors.white, borderRadius: Radius.xxl, padding: Spacing.xxl, ...Shadow.strong },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  modalTitle: { fontSize: 24, fontWeight: '900', color: Colors.textDark, letterSpacing: -0.5 },
  modalDesc: { fontSize: 15, color: Colors.textMuted, lineHeight: 22, marginBottom: Spacing.xl, fontWeight: '600' },
  modalField: { marginBottom: Spacing.xl },
  modalLabel: { fontSize: 12, fontWeight: '900', color: Colors.textDark, marginBottom: 8, letterSpacing: 1 },
  modalInput: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgLight, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.bgMid, height: 60, paddingHorizontal: Spacing.lg },
  modalTextInput: { flex: 1, fontSize: 17, color: Colors.textDark, fontWeight: '700' },
  modalSubmit: { backgroundColor: Colors.primary, height: 64, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', ...Shadow.strong },
  modalSubmitText: { fontSize: 16, fontWeight: '900', color: Colors.white, letterSpacing: 1.5 },
  modalError: { color: Colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.md },
  modalSuccess: { color: Colors.success, fontSize: 14, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.md },
});

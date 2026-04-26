import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Image, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bus, ScanLine, User, Lock, Eye, EyeOff, ChevronRight, AlertCircle, Mail, X, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { AUTH_API, API_IP, API_PORT } from '../constants/api';

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
      setMatriculeError('Le matricule doit comporter au moins 3 caractères');
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
        const { user, affectation } = res.data;
        router.replace({
          pathname: '/(receveur)/dashboard',
          params: {
            userId: user.id,
            nom: user.nom,
            prenom: user.prenom,
            matricule: user.matricule,
            numero_bus: affectation?.numero_bus ?? '',
            ville_depart: affectation?.ville_depart ?? '',
            ville_arrivee: affectation?.ville_arrivee ?? '',
            num_ligne: affectation?.num_ligne ?? '',
            login_time: Date.now().toString(),
          }
        });
      } else {
        // Contrôleur
        const res = await axios.post<any>(`${AUTH_API}/login/controleur`, { matricule: matricule.trim(), password });
        const { user, affectation } = res.data;
        router.replace({
          pathname: '/(controleur)/scanner',
          params: {
            userId: user.id,
            nom: user.nom,
            prenom: user.prenom,
            matricule: user.matricule,
            image_url: user.image_url || '',
            numero_bus: affectation?.numero_bus ?? '',
            login_time: Date.now().toString(),
          }
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotOpen = () => {
    setForgotMatricule(matricule || '');
    setForgotEmail('');
    setForgotError('');
    setForgotSuccess(false);
    setShowForgot(true);
  };

  const handleForgotSubmit = async () => {
    if (!forgotMatricule.trim() || !forgotEmail.trim()) {
      setForgotError('Veuillez remplir tous les champs.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      await axios.post(`${PASSWORD_RESET_API}/request`, {
        matricule: forgotMatricule.trim(),
        email: forgotEmail.trim().toLowerCase(),
        role: role 
      });
      setForgotSuccess(true);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Erreur lors de la demande. Réessayez.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo + Brand ── */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Image 
                source={require('../assets/images/tunimovebus.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* ── Login Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Connexion agent</Text>
            <Text style={styles.cardSub}>Sélectionnez votre rôle pour continuer</Text>

            {/* ── Role Selector ── */}
            <View style={styles.roleGrid}>
              {/* Receveur */}
              <TouchableOpacity
                style={[styles.roleCard, role === 'receveur' && styles.roleCardActive]}
                onPress={() => { setRole('receveur'); setError(''); }}
                activeOpacity={0.75}
              >
                <View style={[styles.roleIcon, role === 'receveur' && styles.roleIconActive]}>
                  <User color={role === 'receveur' ? Colors.white : Colors.primary} size={28} strokeWidth={2} />
                </View>
                <Text style={[styles.roleTitle, role === 'receveur' && styles.roleTitleActive]}>Receveur</Text>
                <Text style={[styles.roleHelper, role === 'receveur' && { color: Colors.accent }]}>
                  Vente billets · Service bus
                </Text>
                {role === 'receveur' && (
                  <View style={styles.roleCheck}>
                    <ChevronRight color={Colors.accent} size={14} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Contrôleur */}
              <TouchableOpacity
                style={[styles.roleCard, role === 'controleur' && styles.roleCardActive]}
                onPress={() => { setRole('controleur'); setError(''); }}
                activeOpacity={0.75}
              >
                <View style={[styles.roleIcon, role === 'controleur' && styles.roleIconActive]}>
                  <ScanLine color={role === 'controleur' ? Colors.white : Colors.primary} size={28} strokeWidth={2} />
                </View>
                <Text style={[styles.roleTitle, role === 'controleur' && styles.roleTitleActive]}>Contrôleur</Text>
                <Text style={[styles.roleHelper, role === 'controleur' && { color: Colors.accent }]}>
                  Scan QR · Validation billets
                </Text>
                {role === 'controleur' && (
                  <View style={styles.roleCheck}>
                    <ChevronRight color={Colors.accent} size={14} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Credentials ── */}
            {role !== null && (
              <View style={styles.fields}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Identifiants</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Matricule */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Matricule</Text>
                  <View style={[styles.fieldWrap, matriculeError ? styles.fieldError : null]}>
                    <User color={matriculeError ? Colors.danger : Colors.textMuted} size={18} />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Ex: REC001"
                      value={matricule}
                      onChangeText={handleMatriculeChange}
                      placeholderTextColor={Colors.textLight}
                      autoCapitalize="characters"
                      returnKeyType="next"
                    />
                  </View>
                  {matriculeError ? (
                    <View style={styles.errRow}>
                      <AlertCircle color={Colors.danger} size={12} />
                      <Text style={styles.errText}>{matriculeError}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Mot de passe</Text>
                  <View style={styles.fieldWrap}>
                    <Lock color={Colors.textMuted} size={18} />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="••••••••"
                      value={password}
                      onChangeText={(v) => { setPassword(v); setError(''); }}
                      placeholderTextColor={Colors.textLight}
                      secureTextEntry={!showPwd}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity onPress={() => setShowPwd(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      {showPwd
                        ? <EyeOff color={Colors.textMuted} size={18} />
                        : <Eye color={Colors.textMuted} size={18} />
                      }
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Global Error */}
                {error ? (
                  <View style={styles.globalErr}>
                    <AlertCircle color={Colors.danger} size={14} />
                    <Text style={styles.globalErrText}>{error}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* ── Forgot Password Link ── */}
            {role !== null && (
              <TouchableOpacity
                style={styles.forgotLink}
                onPress={handleForgotOpen}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            )}

            {/* ── Login Button ── */}
            <TouchableOpacity
              style={[styles.loginBtn, !canSubmit && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <>
                  <Text style={[styles.loginBtnText, !canSubmit && styles.loginBtnTextDisabled]}>
                    Se connecter
                  </Text>
                  {canSubmit && <ChevronRight color={Colors.primary} size={20} strokeWidth={3} />}
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <Text style={styles.version}>TuniMove Field v2.0 · SNTRI</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Forgot Password Modal ── */}
      <Modal
        visible={showForgot}
        animationType="slide"
        transparent
        onRequestClose={() => setShowForgot(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconWrap}>
                  <Lock color={Colors.primary} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Mot de passe oublié</Text>
                  <Text style={styles.modalSub}>Demande de réinitialisation</Text>
                </View>
                <TouchableOpacity onPress={() => setShowForgot(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X color={Colors.textMuted} size={22} />
                </TouchableOpacity>
              </View>

              {forgotSuccess ? (
                <View style={styles.successBox}>
                  <CheckCircle color={Colors.success} size={44} />
                  <Text style={styles.successTitle}>Demande envoyée !</Text>
                  <Text style={styles.successSub}>
                    Votre demande a été transmise à l'administrateur.{`\n`}Un nouveau mot de passe vous sera envoyé par e-mail dès qu'elle sera traitée.
                  </Text>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setShowForgot(false)}>
                    <Text style={styles.closeBtnText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.modalDesc}>
                    Saisissez votre matricule et votre adresse e-mail. L'administrateur générera un nouveau mot de passe et vous l'enverra par e-mail.
                  </Text>

                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Matricule</Text>
                    <View style={styles.modalInput}>
                      <User color={Colors.textMuted} size={16} />
                      <TextInput
                        style={styles.modalTextInput}
                        placeholder="Ex: REC001"
                        value={forgotMatricule}
                        onChangeText={v => { setForgotMatricule(v); setForgotError(''); }}
                        placeholderTextColor={Colors.textLight}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>

                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Adresse e-mail</Text>
                    <View style={styles.modalInput}>
                      <Mail color={Colors.textMuted} size={16} />
                      <TextInput
                        style={styles.modalTextInput}
                        placeholder="votre@email.com"
                        value={forgotEmail}
                        onChangeText={v => { setForgotEmail(v); setForgotError(''); }}
                        placeholderTextColor={Colors.textLight}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  {forgotError ? (
                    <View style={styles.forgotErr}>
                      <AlertCircle color={Colors.danger} size={14} />
                      <Text style={styles.forgotErrText}>{forgotError}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.submitBtn, (!forgotMatricule || !forgotEmail) && styles.submitBtnDisabled]}
                    onPress={handleForgotSubmit}
                    disabled={forgotLoading || !forgotMatricule || !forgotEmail}
                    activeOpacity={0.85}
                  >
                    {forgotLoading
                      ? <ActivityIndicator color={Colors.white} size="small" />
                      : <Text style={styles.submitBtnText}>Envoyer la demande</Text>
                    }
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },

  // Brand
  brand: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.md },
  logoWrap: {
    width: 120, height: 120, borderRadius: 24,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    marginBottom: 0, ...Shadow.strong, overflow: 'hidden',
  },
  logoImage: { width: 110, height: 110 },

  // Card
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    padding: Spacing.xl, ...Shadow.card,
  },
  cardHeading: { fontSize: 22, fontWeight: '800', color: Colors.textDark, marginBottom: 4 },
  cardSub: { fontSize: 15, color: Colors.textMuted, marginBottom: Spacing.xl },

  // Roles
  roleGrid: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  roleCard: {
    flex: 1, borderRadius: Radius.lg, padding: Spacing.md,
    backgroundColor: Colors.bgMid, borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center', minHeight: 120, justifyContent: 'center', gap: 6,
  },
  roleCardActive: {
    backgroundColor: Colors.primary, borderColor: Colors.accent,
    ...Shadow.strong,
  },
  roleIcon: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: Colors.white + '25', alignItems: 'center', justifyContent: 'center',
  },
  roleIconActive: { backgroundColor: Colors.white + '25' },
  roleTitle: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  roleTitleActive: { color: Colors.white },
  roleHelper: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', fontWeight: '600' },
  roleCheck: { position: 'absolute', top: 8, right: 8 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: { fontSize: 13, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  // Fields
  fields: {},
  fieldGroup: { marginBottom: Spacing.base },
  fieldLabel: { fontSize: 14, fontWeight: '800', color: Colors.textMid, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.bgLight, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    height: 52, paddingHorizontal: 14,
  },
  fieldError: { borderColor: Colors.danger, backgroundColor: Colors.dangerLight + '40' },
  fieldInput: { flex: 1, fontSize: 17, color: Colors.textDark, fontWeight: '600' },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errText: { fontSize: 13, color: Colors.danger, fontWeight: '600' },
  globalErr: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.dangerLight, borderRadius: Radius.md,
    padding: Spacing.md, marginTop: 4, marginBottom: 4,
    borderWidth: 1, borderColor: Colors.danger + '30',
  },
  globalErrText: { flex: 1, fontSize: 15, color: Colors.danger, fontWeight: '700' },

  // Button
  loginBtn: {
    backgroundColor: Colors.accent, height: 56, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: Spacing.lg, ...Shadow.accent,
  },
  loginBtnDisabled: { backgroundColor: Colors.bgMid, ...Platform.select({ web: { boxShadow: 'none' }, default: { shadowOpacity: 0, elevation: 0 } }) },
  loginBtnText: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  loginBtnTextDisabled: { color: Colors.textMuted },

  // Footer
  version: { textAlign: 'center', fontSize: 13, color: Colors.textLight, marginTop: Spacing.lg, fontWeight: '600' },

  // Forgot link
  forgotLink: { alignSelf: 'flex-end', marginTop: 6, marginBottom: 2, paddingVertical: 4 },
  forgotText: { fontSize: 14, color: Colors.primary, fontWeight: '700' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end', alignItems: 'center',
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, width: '100%',
    ...Shadow.strong,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, marginBottom: Spacing.lg,
  },
  modalIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  modalSub: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  modalDesc: { fontSize: 14, color: Colors.textMid, lineHeight: 20, marginBottom: Spacing.lg },
  modalField: { marginBottom: Spacing.base },
  modalLabel: {
    fontSize: 13, fontWeight: '800', color: Colors.textMid,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  modalInput: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.bgLight, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    height: 50, paddingHorizontal: 14,
  },
  modalTextInput: { flex: 1, fontSize: 16, color: Colors.textDark, fontWeight: '600' },
  forgotErr: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.dangerLight, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.danger + '30',
  },
  forgotErrText: { flex: 1, fontSize: 14, color: Colors.danger, fontWeight: '700' },
  submitBtn: {
    backgroundColor: Colors.primary, height: 52, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.md, ...Shadow.strong,
  },
  submitBtnDisabled: { backgroundColor: Colors.bgMid, shadowOpacity: 0, elevation: 0 },
  submitBtnText: { fontSize: 17, fontWeight: '800', color: Colors.white },
  successBox: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 12 },
  successTitle: { fontSize: 22, fontWeight: '900', color: Colors.textDark },
  successSub: { fontSize: 15, color: Colors.textMid, textAlign: 'center', lineHeight: 22 },
  closeBtn: {
    marginTop: Spacing.md, backgroundColor: Colors.primary,
    paddingHorizontal: 32, paddingVertical: 12, borderRadius: Radius.lg,
  },
  closeBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
});

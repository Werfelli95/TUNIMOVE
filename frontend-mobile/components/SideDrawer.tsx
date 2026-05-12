import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, Dimensions, Image, TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, LogOut, X, ChevronRight, Shield, Bus, TrendingUp, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { API_IP, API_PORT } from '../constants/api';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.82;

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
  nom: string;
  prenom: string;
  matricule: string;
  role: 'receveur' | 'controleur';
  userId?: string;
  imageUrl?: string;
  onLogout: () => void;
  onCloseService?: () => void;
}

const ROLE_CONFIG = {
  receveur: { label: 'Receveur', icon: Bus,    color: Colors.accent },
  controleur:{ label: 'Contrôleur', icon: Shield, color: Colors.info },
};

export default function SideDrawer({
  visible, onClose, nom, prenom, matricule, role, userId, imageUrl, onLogout, onCloseService
}: SideDrawerProps) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const goProfile = () => {
    onClose();
    setTimeout(() => {
      router.push({
        pathname: '/profile',
        params: { userId: userId || '', nom, prenom, matricule, role }
      });
    }, 250);
  };

  const cfg = ROLE_CONFIG[role];
  const RoleIcon = cfg.icon;
  const initials = `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

          {/* ── Ultra-Premium Header ── */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.avatarWrapper}>
                {imageUrl ? (
                  <Image 
                    source={{ uri: `http://${API_IP}:${API_PORT}/${imageUrl}` }} 
                    style={styles.avatarImg} 
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.roleDot} />
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X color={Colors.white} size={20} strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name} numberOfLines={1}>{prenom} {nom}</Text>
              <Text style={styles.matricule}>MATRICULE: {matricule}</Text>
              <View style={[styles.roleBadge, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                <RoleIcon color={cfg.color} size={14} strokeWidth={2.5} />
                <Text style={styles.roleText}>{cfg.label}</Text>
              </View>
            </View>
          </View>

          {/* ── Immersive Menu ── */}
          <View style={styles.menuContainer}>
            <Text style={styles.sectionTitle}>Opérations</Text>

            <TouchableOpacity style={styles.menuItem} onPress={goProfile} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '10' }]}>
                <User color={Colors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.menuBody}>
                <Text style={styles.menuLabel}>Profil & Sécurité</Text>
                <Text style={styles.menuSub}>Gérer vos informations</Text>
              </View>
              <ChevronRight color={Colors.textLight} size={18} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                onClose();
                if (role === 'receveur' || role === 'RECEVEUR') {
                  router.push({ pathname: '/(receveur)/sales-history', params: { userId } });
                } else {
                  router.push({ pathname: '/(controleur)/scan-history', params: { userId } });
                }
              }} 
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: (role === 'receveur' || role === 'RECEVEUR' ? Colors.success : Colors.info) + '10' }]}>
                {role === 'receveur' || role === 'RECEVEUR' ? (
                  <TrendingUp color={Colors.success} size={20} strokeWidth={2.5} />
                ) : (
                  <Search color={Colors.info} size={20} strokeWidth={2.5} />
                )}
              </View>
              <View style={styles.menuBody}>
                <Text style={styles.menuLabel}>
                  {role === 'receveur' || role === 'RECEVEUR' ? 'Journal des ventes' : 'Audit des scans'}
                </Text>
                <Text style={styles.menuSub}>Consulter vos activités</Text>
              </View>
              <ChevronRight color={Colors.textLight} size={18} strokeWidth={2} />
            </TouchableOpacity>

            {role === 'controleur' && onCloseService && (
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  onClose();
                  onCloseService();
                }} 
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: Colors.danger + '10' }]}>
                  <Shield color={Colors.danger} size={20} strokeWidth={2.5} />
                </View>
                <View style={styles.menuBody}>
                  <Text style={[styles.menuLabel, { color: Colors.danger }]}>Clôturer Service</Text>
                  <Text style={styles.menuSub}>Envoyer le rapport final</Text>
                </View>
                <ChevronRight color={Colors.danger} size={18} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Premium Footer ── */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
              <LogOut color={Colors.danger} size={20} strokeWidth={2.5} />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
            <Text style={styles.copyright}>TuniMove Field v2.1.0 · SNTRI</Text>
          </View>

        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  drawer: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.bgLight,
    ...Shadow.strong,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.xxl,
    ...Shadow.strong,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
    ...Shadow.strong,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarImg: {
    width: 72, height: 72, borderRadius: 24,
    borderWidth: 3, borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: { fontSize: 26, fontWeight: '900', color: Colors.primary },
  roleDot: { 
    position: 'absolute', bottom: -2, right: -2, 
    width: 18, height: 18, borderRadius: 9, 
    backgroundColor: Colors.success, borderWidth: 3, borderColor: Colors.primary 
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { gap: 4 },
  name: { fontSize: 22, fontWeight: '900', color: Colors.white, letterSpacing: -0.5 },
  matricule: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: 1 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill,
    alignSelf: 'flex-start', marginTop: 8,
  },
  roleText: { fontSize: 12, fontWeight: '900', color: Colors.white, textTransform: 'uppercase', letterSpacing: 1 },

  // Menu
  menuContainer: { flex: 1, padding: Spacing.xl, paddingTop: Spacing.xxl },
  sectionTitle: {
    fontSize: 11, fontWeight: '900', color: Colors.textLight,
    letterSpacing: 2, textTransform: 'uppercase',
    marginBottom: Spacing.xl,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    paddingVertical: Spacing.base, paddingHorizontal: Spacing.base,
    borderRadius: Radius.xl, backgroundColor: Colors.white,
    marginBottom: Spacing.base, ...Shadow.subtle,
    borderWidth: 1, borderColor: Colors.bgMid,
  },
  menuIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  menuBody: { flex: 1, gap: 2 },
  menuLabel: { fontSize: 16, fontWeight: '900', color: Colors.textDark, letterSpacing: -0.3 },
  menuSub: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  // Footer
  footer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    alignItems: 'center', gap: 16,
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.danger + '10',
    paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: Radius.pill, width: '100%',
    justifyContent: 'center', borderWidth: 1, borderColor: Colors.danger + '20',
  },
  logoutText: { fontSize: 16, fontWeight: '900', color: Colors.danger, letterSpacing: 0.3 },
  copyright: { fontSize: 11, color: Colors.textLight, fontWeight: '700', letterSpacing: 0.5 },
});

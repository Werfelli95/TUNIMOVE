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
const DRAWER_WIDTH = width * 0.78;

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
}

const ROLE_CONFIG = {
  receveur: { label: 'Receveur', icon: Bus,    color: Colors.primary },
  controleur:{ label: 'Contrôleur', icon: Shield, color: Colors.info },
};

export default function SideDrawer({
  visible, onClose, nom, prenom, matricule, role, userId, imageUrl, onLogout
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

          {/* ── Header ── */}
          <View style={styles.header}>
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
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{prenom} {nom}</Text>
              <Text style={styles.matricule}>Matricule: {matricule}</Text>
              <View style={[styles.roleBadge, { backgroundColor: cfg.color + '20' }]}>
                <RoleIcon color={cfg.color} size={12} />
                <Text style={[styles.roleText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color={Colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* ── Menu Items ── */}
          <View style={styles.menu}>
            <Text style={styles.menuSection}>MON COMPTE</Text>

            <TouchableOpacity style={styles.menuItem} onPress={goProfile} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '15' }]}>
                <User color={Colors.primary} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>Mon profil</Text>
                <Text style={styles.menuSub}>Informations personnelles</Text>
              </View>
              <ChevronRight color={Colors.textLight} size={18} />
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
              <View style={[styles.menuIcon, { backgroundColor: (role === 'receveur' || role === 'RECEVEUR' ? Colors.success : Colors.info) + '15' }]}>
                {role === 'receveur' || role === 'RECEVEUR' ? (
                  <TrendingUp color={Colors.success} size={20} />
                ) : (
                  <Search color={Colors.info} size={20} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>
                  {role === 'receveur' || role === 'RECEVEUR' ? 'Historique des ventes' : 'Historique des scans'}
                </Text>
                <Text style={styles.menuSub}>
                  {role === 'receveur' || role === 'RECEVEUR' ? 'Tickets vendus aujourd\'hui' : 'Tickets scannés aujourd\'hui'}
                </Text>
              </View>
              <ChevronRight color={Colors.textLight} size={18} />
            </TouchableOpacity>
          </View>

          {/* ── Logout ── */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
              <LogOut color={Colors.danger} size={20} />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.white,
    ...Shadow.strong,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: Spacing.xl, gap: Spacing.md,
    backgroundColor: Colors.primary,
    paddingTop: Spacing.xxl,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  avatarImg: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, borderColor: Colors.accent,
  },
  name: { fontSize: 17, fontWeight: '800', color: Colors.white, marginBottom: 2 },
  matricule: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginBottom: 6 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill,
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)',
  },
  roleText: { fontSize: 12, fontWeight: '800', color: Colors.white },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  divider: { height: 1, backgroundColor: Colors.divider },

  // Menu
  menu: { flex: 1, padding: Spacing.base, paddingTop: Spacing.lg },
  menuSection: {
    fontSize: 11, fontWeight: '800', color: Colors.textLight,
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: Spacing.md, marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg, backgroundColor: Colors.bgLight,
    marginBottom: Spacing.sm,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  menuSub: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },

  // Footer
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.base, paddingVertical: 14,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.danger + '30',
  },
  logoutText: { fontSize: 16, fontWeight: '800', color: Colors.danger },
});

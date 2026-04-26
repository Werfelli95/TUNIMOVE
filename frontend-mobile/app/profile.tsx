import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Image, TouchableOpacity, Alert, TextInput, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  User, Mail, CreditCard, Phone, Shield, Bus,
  ArrowLeft, Calendar, MapPin
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme';
import { API_BASE_URL, API_IP, API_PORT } from '../constants/api';

interface UserProfile {
  id_utilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  matricule: string;
  role: string;
  telephone?: string;
  image_url?: string;
  date_creation?: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  receveur:   { label: 'Receveur',   color: Colors.primary },
  controleur: { label: 'Contrôleur', color: Colors.info    },
  RECEVEUR:   { label: 'Receveur',   color: Colors.primary },
  CONTROLEUR: { label: 'Contrôleur', color: Colors.info    },
};

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId   = params.userId as string;
  const nomParam = params.nom as string;
  const prenomParam = params.prenom as string;
  const matriculeParam = params.matricule as string;
  const roleParam = params.role as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [numTel, setNumTel] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = () => {
    if (userId) {
      axios.get<any>(`${API_BASE_URL}/users/${userId}`)
        .then(res => {
          const data = res.data;
          setProfile(data);
          setEmail(data.email || '');
          setNumTel(data.num_tel || '');
          setNom(data.nom || '');
          setPrenom(data.prenom || '');
        })
        .catch(() => {
          // Fallback to params
          setProfile({
            id_utilisateur: parseInt(userId) || 0,
            nom: nomParam || '',
            prenom: prenomParam || '',
            email: '',
            matricule: matriculeParam || '',
            role: roleParam || '',
          });
        })
        .finally(() => setLoading(false));
    } else {
      setProfile({
        id_utilisateur: 0,
        nom: nomParam || '',
        prenom: prenomParam || '',
        email: '',
        matricule: matriculeParam || '',
        role: roleParam || '',
      });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/users/${profile.id_utilisateur}`, {
        nom,
        prenom,
        email,
        num_tel: numTel,
        matricule: profile.matricule,
        role: profile.role,
        image_url: profile.image_url
      });
      setIsEditing(false);
      fetchProfile();
      if (Platform.OS === 'web') window.alert("✅ Profil mis à jour !");
      else {
        Alert.alert('Succès', 'Profil mis à jour');
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') window.alert("❌ Erreur lors de la mise à jour");
      else Alert.alert('Erreur', 'Impossible de mettre à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à vos photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setIsSaving(true);
      const formData = new FormData();
      
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      // @ts-ignore
      formData.append('image', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      });

      formData.append('nom', nom);
      formData.append('prenom', prenom);
      formData.append('email', email);
      formData.append('num_tel', numTel);
      formData.append('matricule', profile?.matricule || '');
      formData.append('role', profile?.role || '');

      await axios.put(`${API_BASE_URL}/users/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      fetchProfile();
      Alert.alert('Succès', 'Photo mise à jour');
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Erreur', 'Impossible de télécharger la photo');
    } finally {
      setIsSaving(false);
    }
  };

  const roleCfg = ROLE_LABELS[profile?.role || roleParam] || { label: profile?.role || roleParam, color: Colors.primary };
  const initials = profile
    ? `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase()
    : '--';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft color={Colors.white} size={22} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Mon Profil</Text>
        <TouchableOpacity 
          style={styles.editHeaderBtn}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.editText}>{isEditing ? 'Sauver' : 'Modifier'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero Card ── */}
          <View style={styles.heroCard}>
            {profile?.image_url ? (
              <TouchableOpacity onPress={pickImage} style={styles.avatarBtn} activeOpacity={0.8}>
                <Image
                  source={{ uri: `http://${API_IP}:${API_PORT}/${profile.image_url}` }}
                  style={styles.avatarImg}
                />
                <View style={styles.editBadge}>
                   <MapPin color={Colors.white} size={14} />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={pickImage} style={styles.avatarBtn} activeOpacity={0.8}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
                <View style={styles.editBadge}>
                   <MapPin color={Colors.white} size={14} />
                </View>
              </TouchableOpacity>
            )}
            <Text style={styles.heroName}>{prenom} {nom}</Text>
            <Text style={styles.heroMatricule}>{profile?.matricule}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleCfg.color + '20' }]}>
              <Text style={[styles.roleText, { color: roleCfg.color }]}>{roleCfg.label}</Text>
            </View>
          </View>

          {/* ── Info Section ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>

            <InfoRow 
              icon={<User color={Colors.primary} size={18} />} 
              label="Prénom" 
              value={prenom} 
              isEditing={false} // Verrouillé
            />
            <InfoRow 
              icon={<User color={Colors.primary} size={18} />} 
              label="Nom" 
              value={nom} 
              isEditing={false} // Verrouillé
            />
            <InfoRow 
              icon={<CreditCard color={Colors.info} size={18} />} 
              label="Matricule" 
              value={profile?.matricule || '—'} 
              isEditing={false} // Verrouillé
            />
            <InfoRow 
              icon={<Mail color={Colors.success} size={18} />} 
              label="Email" 
              value={email} 
              isEditing={isEditing}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <InfoRow 
              icon={<Phone color={Colors.warning} size={18} />} 
              label="Téléphone" 
              value={numTel} 
              isEditing={isEditing}
              onChangeText={setNumTel}
              keyboardType="phone-pad"
            />
          </View>

          {isEditing && (
             <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                <Text style={styles.cancelText}>Annuler les modifications</Text>
             </TouchableOpacity>
          )}

          {/* ── Role Section ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rôle & Accès</Text>
            <View style={[styles.roleCard, { borderLeftColor: roleCfg.color }]}>
              <Text style={[styles.roleCardTitle, { color: roleCfg.color }]}>{roleCfg.label}</Text>
              <Text style={styles.roleCardDesc}>
                {profile?.role === 'receveur' || profile?.role === 'RECEVEUR'
                  ? 'Responsable de la vente de billets et de la gestion du service à bord du bus.'
                  : 'Responsable de la validation des billets et du contrôle des voyageurs.'}
              </Text>
            </View>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}


function InfoRow({ 
  icon, label, value, isEditing, onChangeText, keyboardType = 'default' 
}: { 
  icon: React.ReactNode; label: string; value: string; isEditing?: boolean; onChangeText?: (t: string) => void; keyboardType?: any 
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        {isEditing && onChangeText ? (
          <TextInput
            style={styles.infoInput}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholder={`Saisir ${label.toLowerCase()}...`}
          />
        ) : (
          <Text style={styles.infoValue}>{value || '—'}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 40 },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    paddingTop: Spacing.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  editHeaderBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  editText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  // Hero
  heroCard: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.lg,
  },
  avatarImg: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: Colors.accent,
    marginBottom: Spacing.md,
  },
  avatarBtn: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  editBadge: {
    position: 'absolute', bottom: 10, right: 0,
    backgroundColor: Colors.accent,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarInitials: { fontSize: 36, fontWeight: '900', color: Colors.primary },
  heroName: { fontSize: 24, fontWeight: '900', color: Colors.white, marginBottom: 4 },
  heroMatricule: { fontSize: 15, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginBottom: Spacing.md },
  roleBadge: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  roleText: { fontSize: 14, fontWeight: '800', color: Colors.white },

  // Section
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base, marginTop: Spacing.base,
    borderRadius: Radius.xl, ...Shadow.card, overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '800', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing.md,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.base, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  infoIcon: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: Colors.bgLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginTop: 1 },
  infoInput: { 
    fontSize: 16, fontWeight: '700', color: Colors.primary, 
    marginTop: 2, padding: 0, borderBottomWidth: 1, borderBottomColor: Colors.primary + '30'
  },

  // Role card
  roleCard: {
    margin: Spacing.base, padding: Spacing.base,
    backgroundColor: Colors.bgLight, borderRadius: Radius.lg,
    borderLeftWidth: 4,
  },
  roleCardTitle: { fontSize: 17, fontWeight: '900', marginBottom: 6 },
  roleCardDesc: { fontSize: 14, color: Colors.textMid, lineHeight: 20 },

  cancelBtn: {
    marginTop: Spacing.md, alignSelf: 'center',
    padding: Spacing.sm,
  },
  cancelText: { color: Colors.danger, fontWeight: '700', fontSize: 14 },
});

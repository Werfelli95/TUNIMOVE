import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Bus, ScanLine, User, KeyRound } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

interface LoginUser {
  nom: string;
  prenom: string;
}

interface LoginAffectation {
  numero_bus: string;
  ville_depart: string;
  ville_arrivee: string;
}

interface LoginResponse {
  user: LoginUser;
  affectation: LoginAffectation | null;
}

// IMPORTANT: Puisque nous sommes sur le web localhost:8081, l'URL est localhost. 
// Pour android emulator on utiliserait 10.0.2.2.
const API_URL = 'http://localhost:5000/api/auth/login/receveur';

export default function LoginScreen() {
  const router = useRouter();
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'receveur' | 'controleur' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!role) return;
    
    if (role === 'receveur') {
      if (!matricule || !password) {
        Alert.alert("Erreur", "Veuillez entrer votre matricule et mot de passe");
        return;
      }
      
      setLoading(true);
      try {
        const response = await axios.post<LoginResponse>(API_URL, {
          matricule,
          password
        });
        
        const { user, affectation } = response.data;
        
        // On passe les données utilisateur via Expo Router context/params
        // Comme objet simple
        router.replace({
          pathname: '/(receveur)/dashboard',
          params: {
            nom: user.nom,
            prenom: user.prenom,
            numero_bus: affectation ? affectation.numero_bus : '',
            ville_depart: affectation ? affectation.ville_depart : '',
            ville_arrivee: affectation ? affectation.ville_arrivee : ''
          }
        });
      } catch (err: any) {
        setLoading(false);
        const msg = err.response?.data?.message || "Erreur de connexion serveur";
        Alert.alert("Échec de connexion", msg);
      }
    } else {
      router.replace('/(controleur)/scanner');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Bus color="#fbbf24" size={40} />
            </View>
            <Text style={styles.title}>TuniMove</Text>
            <Text style={styles.subtitle}>Transport Interurbain</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sélectionnez votre rôle</Text>
            
            <View style={styles.rolesContainer}>
              <TouchableOpacity 
                style={[styles.roleCard, role === 'receveur' && styles.roleCardActive]} 
                onPress={() => setRole('receveur')}
              >
                <User color={role === 'receveur' ? "#fff" : "#1a3a52"} size={32} />
                <Text style={[styles.roleText, role === 'receveur' && styles.roleTextActive]}>Receveur</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.roleCard, role === 'controleur' && styles.roleCardActive]} 
                onPress={() => setRole('controleur')}
              >
                <ScanLine color={role === 'controleur' ? "#fff" : "#1a3a52"} size={32} />
                <Text style={[styles.roleText, role === 'controleur' && styles.roleTextActive]}>Contrôleur</Text>
              </TouchableOpacity>
            </View>

            {role === 'receveur' && (
              <View style={styles.inputsSection}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Matricule</Text>
                  <View style={styles.inputWrapper}>
                    <User color="#94a3b8" size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Entrez votre matricule"
                      value={matricule}
                      onChangeText={setMatricule}
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Mot de passe</Text>
                  <View style={styles.inputWrapper}>
                    <KeyRound color="#94a3b8" size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Entrez votre mot de passe"
                      value={password}
                      onChangeText={setPassword}
                      placeholderTextColor="#94a3b8"
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[
                styles.button, 
                (!role || (role === 'receveur' && (!matricule || !password))) && styles.buttonDisabled
              ]} 
              onPress={handleLogin}
              disabled={(!role || (role === 'receveur' && (!matricule || !password))) || loading}
            >
              {loading ? (
                <ActivityIndicator color="#1a3a52" />
              ) : (
                <Text style={styles.buttonText}>Se Connecter</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#1a3a52',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1a3a52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a3a52',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 24,
  },
  rolesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardActive: {
    backgroundColor: '#1a3a52',
    borderColor: '#1a3a52',
    shadowColor: '#1a3a52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  roleText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a3a52',
  },
  roleTextActive: {
    color: '#ffffff',
  },
  inputsSection: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#fbbf24',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a3a52',
  },
});


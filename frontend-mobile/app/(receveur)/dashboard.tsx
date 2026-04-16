import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Play, Ticket, Users, FileWarning, LogOut, Info } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function Dashboard() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Paramètres passés lors du login
  const { nom, prenom, numero_bus, ville_depart, ville_arrivee } = params;

  const handleLogout = () => {
    router.replace('/');
  };

  const navParams = {
    nom: nom as string,
    prenom: prenom as string,
    numero_bus: numero_bus as string,
    ville_depart: ville_depart as string,
    ville_arrivee: ville_arrivee as string,
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>Bonjour, {prenom || 'Agent'} {nom || ''}</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut color="#fff" size={24} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Que souhaitez-vous faire aujourd'hui ?</Text>
      </View>

      <View style={styles.contentPad}>
        {/* Affichage de l'affectation actuelle */}
        {numero_bus ? (
          <View style={styles.assignmentBanner}>
            <View style={styles.assignmentHeader}>
              <Info color="#1a3a52" size={20} />
              <Text style={styles.assignmentTitle}>Affectation Actuelle</Text>
            </View>
            <Text style={styles.assignmentText}>
              <Text style={{fontWeight: 'bold'}}>Bus Nº :</Text> {numero_bus}
            </Text>
            {ville_depart && ville_arrivee && (
              <Text style={styles.assignmentText}>
                <Text style={{fontWeight: 'bold'}}>Ligne :</Text> {ville_depart} - {ville_arrivee}
              </Text>
            )}
          </View>
        ) : (
          <View style={[styles.assignmentBanner, { backgroundColor: '#fef2f2', borderColor: '#f87171' }]}>
            <View style={styles.assignmentHeader}>
              <FileWarning color="#dc2626" size={20} />
              <Text style={[styles.assignmentTitle, { color: '#dc2626' }]}>Aucune Affectation</Text>
            </View>
            <Text style={[styles.assignmentText, { color: '#b91c1c' }]}>
              Aucun bus ne vous a été affecté pour le moment. Veuillez contacter le dispatch.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/(receveur)/service', params: navParams })}>
          <View style={[styles.iconContainer, { backgroundColor: '#e0f2fe' }]}>
            <Play color="#0284c7" size={32} />
          </View>
          <Text style={styles.cardTitle}>Démarrer un service</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/(receveur)/service', params: navParams })}>
          <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
            <Ticket color="#d97706" size={32} />
          </View>
          <Text style={styles.cardTitle}>Vente de billets à bord</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/(receveur)/manifeste', params: navParams })}>
          <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
            <Users color="#16a34a" size={32} />
          </View>
          <Text style={styles.cardTitle}>Consulter Manifeste</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/(receveur)/incident', params: navParams })}>
          <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
            <FileWarning color="#dc2626" size={32} />
          </View>
          <Text style={styles.cardTitle}>Signaler un incident</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    backgroundColor: '#1a3a52',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    paddingTop: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
  },
  contentPad: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  assignmentBanner: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 16,
    padding: 16,
  },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a3a52',
    marginLeft: 8,
  },
  assignmentText: {
    fontSize: 14,
    color: '#334155',
    marginTop: 4,
  },
  grid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  }
});

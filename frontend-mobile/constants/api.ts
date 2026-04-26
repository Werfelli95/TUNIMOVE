import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Automatically detect the IP address of your computer (the Expo server)
const getHostIp = () => {
  if (Platform.OS === 'web') return 'localhost';
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }
  // Fallback if not using Expo Go
  return 'localhost';
};

export const API_IP = getHostIp();
export const API_PORT = '5000';
export const API_BASE_URL = `http://${API_IP}:${API_PORT}/api`;

export const AUTH_API = `${API_BASE_URL}/auth`;
export const RECEVEUR_SERVICE_API = `${API_BASE_URL}/receveur-service`;
export const SALES_API = `${API_BASE_URL}/sales`;
export const NETWORK_API = `${API_BASE_URL}/network`;
export const INCIDENTS_API = `${API_BASE_URL}/incidents`;
export const TARIFS_API = `${API_BASE_URL}/tarifs`;
export const TARIFICATION_API = `${API_BASE_URL}/tarification`;

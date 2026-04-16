import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

interface ScanResponse {
  message: string;
}
import { FileWarning, CheckCircle, XCircle } from 'lucide-react-native';

const API_URL = 'http://10.0.2.2:5000/api/sales/tickets/scan'; // URL pour android emulator

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<{ status: 'success' | 'already' | 'invalid' | null, message: string }>({ status: null, message: '' });

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Nous avons besoin de votre permission pour utiliser la caméra</Text>
        <Button onPress={requestPermission} title="Accorder la permission" />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    
    try {
      // Dans un cas réel, utiliser l'IP locale ou le domaine
      const response = await axios.post<ScanResponse>(API_URL, { qr_code: data });
      
      setScanResult({
        status: 'success',
        message: response.data.message
      });
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        setScanResult({
          status: 'already',
          message: `Ticket déjà scanné le ${new Date(err.response.data.date_scan).toLocaleString('fr-FR')}`
        });
      } else {
        setScanResult({
          status: 'invalid',
          message: "Ticket introuvable ou invalide"
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
        </View>
      </CameraView>

      {scanned && (
        <View style={styles.resultContainer}>
          {scanResult.status === 'success' && <CheckCircle color="#10b981" size={48} />}
          {scanResult.status === 'already' && <FileWarning color="#f59e0b" size={48} />}
          {scanResult.status === 'invalid' && <XCircle color="#ef4444" size={48} />}
          
          <Text style={[
            styles.resultText,
            scanResult.status === 'success' && { color: '#10b981' },
            scanResult.status === 'already' && { color: '#f59e0b' },
            scanResult.status === 'invalid' && { color: '#ef4444' }
          ]}>
            {scanResult.message}
          </Text>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              setScanned(false);
              setScanResult({ status: null, message: '' });
            }}
          >
            <Text style={styles.buttonText}>Scanner un autre billet</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fbbf24',
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  resultContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1a3a52',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

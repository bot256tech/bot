import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import api from '../services/api';
import { COLORS, SHADOWS } from '../utils/constants';

// Scans a passport QR code (or types a batch number) and opens the
// verification screen. QR codes contain e.g. https://<host>/passport/AGR-XXXX
export default function ScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [manual, setManual] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (e) {
        setHasPermission(false);
      }
    })();
  }, []);

  const handleScan = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    let batch = data.trim();
    const match = batch.match(/([A-Z]+(?:-\d{4})?-[A-Z0-9-]+)/i) || batch.match(/(AGR-[A-Za-z0-9-]+)/);
    if (match) batch = match[1].toUpperCase();
    navigation.navigate('Passport', { batchNumber: batch });
    setTimeout(() => setScanned(false), 1200);
  };

  const openManual = () => {
    const b = manual.trim().toUpperCase();
    if (!b) return;
    navigation.navigate('Passport', { batchNumber: b });
    setManual('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Passport</Text>
        <Text style={styles.subtitle}>Point the camera at a batch QR code, or type the batch number below.</Text>
      </View>

      {hasPermission === null ? (
        <ActivityIndicator size="large" color={COLORS.green} style={{ marginTop: 40 }} />
      ) : hasPermission ? (
        <View style={styles.scannerWrap}>
          <BarCodeScanner
            onBarCodeScanned={handleScan}
            barCodeTypes={[BarCodeScanner.Constants.BarCodeTypes.qr]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} /><View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} /><View style={[styles.corner, styles.br]} />
          </View>
          {scanned ? <View style={styles.scanBadge}><Text style={styles.scanBadgeText}>Batch recognised — opening…</Text></View> : null}
        </View>
      ) : (
        <View style={styles.noCam}>
          <Ionicons name="camera-off-outline" size={30} color={COLORS.gray300} />
          <Text style={styles.noCamTitle}>Camera unavailable</Text>
          <Text style={styles.noCamText}>Allow camera access or type the batch number below instead.</Text>
        </View>
      )}

      <View style={styles.manualRow}>
        <TextInput
          style={styles.manualInput}
          placeholder="Batch number e.g. AGR-DEMO-001"
          value={manual}
          onChangeText={setManual}
          autoCapitalize="characters"
          onSubmitEditing={openManual}
          returnKeyType="go"
          placeholderTextColor={COLORS.gray300}
        />
        <TouchableOpacity style={styles.manualBtn} onPress={openManual}>
          <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  title: { fontSize: 21, fontWeight: '800', color: COLORS.charcoal },
  subtitle: { fontSize: 12.5, color: COLORS.gray500, marginTop: 2 },
  scannerWrap: { flex: 1, marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', marginBottom: 12 },
  frame: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: COLORS.gold, borderWidth: 4 },
  tl: { top: '32%', left: '18%', borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10 },
  tr: { top: '32%', right: '18%', borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10 },
  bl: { bottom: '32%', left: '18%', borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10 },
  br: { bottom: '32%', right: '18%', borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10 },
  scanBadge: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: COLORS.green, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
  scanBadgeText: { color: COLORS.white, fontSize: 12.5, fontWeight: '700' },
  noCam: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  noCamTitle: { fontSize: 15.5, fontWeight: '700', color: COLORS.charcoal, marginTop: 10 },
  noCamText: { fontSize: 12.5, color: COLORS.gray500, marginTop: 4, textAlign: 'center' },
  manualRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  manualInput: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14.5, color: COLORS.charcoal },
  manualBtn: { width: 50, borderRadius: 14, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center' },
});

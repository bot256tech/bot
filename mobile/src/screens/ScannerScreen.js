import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SHADOWS } from '../utils/constants';

// ── Error boundary: if the native camera view fails on a device, the app
// keeps running and falls back to manual batch entry instead of freezing. ──
class CameraBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { /* native camera unavailable on this device */ }
  render() {
    if (this.state.failed) {
      return (
        <View style={styles.cameraFail}>
          <Ionicons name="camera-off-outline" size={26} color={COLORS.goldDark} />
          <Text style={styles.cameraFailTitle}>Camera scanner unavailable on this device</Text>
          <Text style={styles.cameraFailText}>Use the batch number entry below instead — it works exactly the same.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function ScannerScreen({ navigation }) {
  const [manual, setManual] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | opening | denied

  const openCamera = async () => {
    setStatus('opening');
    try {
      const { BarCodeScanner } = require('expo-barcode-scanner');
      // Permission with a timeout — if the OS dialog never resolves we fall
      // back to manual entry rather than hanging on a spinner forever.
      const perm = await Promise.race([
        BarCodeScanner.requestPermissionsAsync(),
        new Promise((resolve) => setTimeout(() => resolve({ status: 'timeout' }), 8000))
      ]);
      if (perm && perm.status === 'granted') {
        setCameraOpen(true);
        setStatus('idle');
      } else {
        setStatus('denied');
      }
    } catch (e) {
      // module missing or native failure
      setStatus('denied');
    }
  };

  const closeCamera = () => { setCameraOpen(false); setScanned(false); };

  const handleScan = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    let batch = String(data || '').trim();
    const match = batch.match(/(AGR-[A-Za-z0-9-]+)/);
    if (match) batch = match[1].toUpperCase();
    closeCamera();
    navigation.navigate('Passport', { batchNumber: batch });
  };

  const openManual = () => {
    const b = manual.trim().toUpperCase();
    if (!b) return;
    navigation.navigate('Passport', { batchNumber: b });
    setManual('');
  };

  // ── The camera view is only mounted AFTER the user explicitly asks for it
  // and permission is granted. A failure inside it is contained. ──
  let cameraSection = null;
  if (cameraOpen) {
    let ScannerView = null;
    try {
      // eslint-disable-next-line global-require
      const { BarCodeScanner } = require('expo-barcode-scanner');
      ScannerView = BarCodeScanner;
    } catch (e) {
      ScannerView = null;
    }
    cameraSection = (
      <View style={styles.scannerWrap}>
        {ScannerView ? (
          <CameraBoundary>
            <ScannerView
              onBarCodeScanned={handleScan}
              barCodeTypes={[ScannerView.Constants.BarCodeTypes.qr]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.frame}>
              <View style={[styles.corner, styles.tl]} /><View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} /><View style={[styles.corner, styles.br]} />
            </View>
          </CameraBoundary>
        ) : (
          <View style={styles.cameraFail}>
            <Ionicons name="camera-off-outline" size={26} color={COLORS.goldDark} />
            <Text style={styles.cameraFailTitle}>Camera scanner not available</Text>
            <Text style={styles.cameraFailText}>Use the batch number entry below.</Text>
          </View>
        )}
        <TouchableOpacity style={styles.closeCamBtn} onPress={closeCamera}>
          <Ionicons name="close" size={16} color={COLORS.white} />
          <Text style={styles.closeCamText}>Close camera</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    cameraSection = (
      <TouchableOpacity style={styles.openCamBtn} onPress={openCamera} disabled={status === 'opening'}>
        {status === 'opening' ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="camera-outline" size={19} color={COLORS.white} />
            <Text style={styles.openCamText}>Open Camera Scanner</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verify a Passport</Text>
        <Text style={styles.subtitle}>Scan a batch QR code, or simply type the batch number — both open the verified passport.</Text>
      </View>

      {status === 'denied' ? (
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.goldDark} />
          <Text style={styles.noteText}>Camera permission was not granted (or the camera is unavailable). Batch entry below works the same.</Text>
        </View>
      ) : null}

      {cameraSection}

      <View style={styles.manualCard}>
        <Text style={styles.cardTitle}>Enter batch number</Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="e.g. AGR-DEMO-001"
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
        <TouchableOpacity onPress={() => { setManual('AGR-DEMO-001'); }}>
          <Text style={styles.hint}>Tap to try a demo batch: AGR-DEMO-001</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  title: { fontSize: 21, fontWeight: '800', color: COLORS.charcoal },
  subtitle: { fontSize: 12.5, color: COLORS.gray500, marginTop: 3, lineHeight: 17 },
  noteBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 10, backgroundColor: '#FFF8E1', borderRadius: 12, padding: 12 },
  noteText: { flex: 1, fontSize: 12, color: COLORS.goldDark, lineHeight: 16 },
  openCamBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: COLORS.green, marginHorizontal: 16, borderRadius: 15, paddingVertical: 16 },
  openCamText: { color: COLORS.white, fontWeight: '700', fontSize: 14.5 },
  scannerWrap: { height: 320, marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', backgroundColor: '#1a1a1a' },
  frame: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: COLORS.gold, borderWidth: 4 },
  tl: { top: '30%', left: '16%', borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10 },
  tr: { top: '30%', right: '16%', borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10 },
  bl: { bottom: '30%', left: '16%', borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10 },
  br: { bottom: '30%', right: '16%', borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10 },
  closeCamBtn: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  closeCamText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  cameraFail: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORS.white },
  cameraFailTitle: { fontSize: 14, fontWeight: '700', color: COLORS.charcoal, marginTop: 10, textAlign: 'center' },
  cameraFailText: { fontSize: 12, color: COLORS.gray500, marginTop: 4, textAlign: 'center', lineHeight: 16 },
  manualCard: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 16, ...SHADOWS.sm },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: COLORS.charcoal, marginBottom: 10 },
  manualRow: { flexDirection: 'row', gap: 10 },
  manualInput: { flex: 1, backgroundColor: COLORS.gray50, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14.5, color: COLORS.charcoal },
  manualBtn: { width: 50, borderRadius: 13, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center' },
  hint: { fontSize: 11.5, color: COLORS.green, fontWeight: '600', marginTop: 10, textAlign: 'center' },
});

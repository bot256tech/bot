import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../utils/constants';

/**
 * Verify a Quality Passport by batch number.
 *
 * Deliberately hardware-free: no camera, no native modules — nothing that can
 * crash or freeze on any device. Passports are looked up directly in the
 * platform database via the API, exactly like the website's /verify page.
 */
const DEMO_BATCHES = ['AGR-DEMO-001', 'AGR-DEMO-002', 'AGR-DEMO-005'];

export default function ScannerScreen({ navigation }) {
  const [manual, setManual] = useState('');

  const openBatch = (b) => {
    const clean = String(b || '').trim().toUpperCase();
    if (!clean) return;
    navigation.navigate('Passport', { batchNumber: clean });
    setManual('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verify a Passport</Text>
        <Text style={styles.subtitle}>
          Enter a batch number to open its verified Digital Quality Passport —
          straight from the platform database, on any device.
        </Text>
      </View>

      <View style={styles.manualCard}>
        <Text style={styles.cardTitle}>Batch number</Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="e.g. AGR-DEMO-001"
            value={manual}
            onChangeText={setManual}
            autoCapitalize="characters"
            onSubmitEditing={() => openBatch(manual)}
            returnKeyType="go"
            placeholderTextColor={COLORS.gray300}
          />
          <TouchableOpacity style={styles.manualBtn} onPress={() => openBatch(manual)}>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Batch numbers appear on every listing, passport and farmer dashboard.</Text>
      </View>

      <Text style={styles.sectionLabel}>Try a demonstration batch</Text>
      <View style={styles.demoWrap}>
        {DEMO_BATCHES.map((b) => (
          <TouchableOpacity key={b} style={styles.demoChip} onPress={() => openBatch(b)}>
            <Ionicons name="document-text-outline" size={14} color={COLORS.green} />
            <Text style={styles.demoText}>{b}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.noteCard}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.green} />
        <Text style={styles.noteText}>
          The same batch numbers work on the website at /verify. Camera QR scanning
          will return in a future release once it passes device testing.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  title: { fontSize: 21, fontWeight: '800', color: COLORS.charcoal },
  subtitle: { fontSize: 12.5, color: COLORS.gray500, marginTop: 4, lineHeight: 17 },
  manualCard: { backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 16, padding: 16, ...SHADOWS.sm },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: COLORS.charcoal, marginBottom: 10 },
  manualRow: { flexDirection: 'row', gap: 10 },
  manualInput: { flex: 1, backgroundColor: COLORS.gray50, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14.5, color: COLORS.charcoal },
  manualBtn: { width: 50, borderRadius: 13, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center' },
  hint: { fontSize: 11, color: COLORS.gray400, marginTop: 10, textAlign: 'center' },
  sectionLabel: { fontSize: 13.5, fontWeight: '700', color: COLORS.charcoal, marginHorizontal: 20, marginTop: 20, marginBottom: 10 },
  demoWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
  demoChip: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: COLORS.greenPale, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(27,94,32,0.18)' },
  demoText: { fontSize: 12.5, fontWeight: '700', color: COLORS.green, letterSpacing: 0.3 },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 22, borderRadius: 14, padding: 14, ...SHADOWS.sm },
  noteText: { flex: 1, fontSize: 11.5, color: COLORS.gray500, lineHeight: 16 },
});

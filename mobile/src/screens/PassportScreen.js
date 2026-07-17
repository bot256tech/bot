import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../utils/constants';

export default function PassportScreen({ route }) {
  const { passport } = route.params || {};
  const batchId = passport || 'AGR-2026-A12345';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>AGRICHAIN 360™</Text>
          <Text style={styles.headerTitle}>Digital Quality Passport</Text>
          <Text style={styles.headerSub}>Verified Agricultural Produce Certificate</Text>
        </View>
        <View style={styles.verifiedBadge}>
          <Text style={{ fontSize: 32 }}>✅</Text>
          <Text style={styles.verifiedText}>VERIFIED</Text>
          <Text style={styles.verifiedDate}>Verified on July 16, 2026</Text>
        </View>
        <View style={styles.gradeCircle}><Text style={styles.gradeLetter}>A</Text></View>
        <Text style={styles.gradeLabel}>Quality Grade</Text>
        <View style={styles.batchBox}><Text style={styles.batchId}>{batchId}</Text></View>
        <View style={styles.grid}>
          <View style={styles.gridItem}><Text style={styles.gridLabel}>CROP</Text><Text style={styles.gridValue}>Maize</Text></View>
          <View style={styles.gridItem}><Text style={styles.gridLabel}>QUANTITY</Text><Text style={styles.gridValue}>2,000 kg</Text></View>
          <View style={styles.gridItem}><Text style={styles.gridLabel}>MOISTURE</Text><Text style={[styles.gridValue, { color: COLORS.green }]}>12.5%</Text></View>
          <View style={styles.gridItem}><Text style={styles.gridLabel}>AFLATOXIN</Text><Text style={[styles.gridValue, { color: COLORS.green }]}>4.2 ppb ✓ Safe</Text></View>
        </View>
        <View style={styles.traceCard}>
          <Text style={styles.traceTitle}>📋 Traceability Information</Text>
          <View style={styles.traceRow}><Text style={styles.traceLabel}>Issued:</Text><Text style={styles.traceValue}>July 16, 2026</Text></View>
          <View style={styles.traceRow}><Text style={styles.traceLabel}>Testing Lab:</Text><Text style={styles.traceValue}>Verified Partner Lab</Text></View>
          <View style={styles.traceRow}><Text style={styles.traceLabel}>Origin:</Text><Text style={styles.traceValue}>Mayuge District, Uganda</Text></View>
          <View style={styles.traceRow}><Text style={styles.traceLabel}>Platform:</Text><Text style={styles.traceValue}>AGRICHAIN 360™</Text></View>
        </View>
        <View style={styles.standards}>
          <Text style={styles.standardsTitle}>Grading Standards</Text>
          <Text style={styles.standardsText}>Grade A: Moisture ≤ 13% & Aflatoxin ≤ 5 ppb{'\n'}Grade B: Moisture ≤ 14% & Aflatoxin ≤ 10 ppb{'\n'}Grade C: Moisture ≤ 15% & Aflatoxin ≤ 20 ppb</Text>
        </View>
        <View style={styles.qrSection}>
          <View style={styles.qrBox}><Ionicons name="qr-code" size={80} color={COLORS.green} /></View>
          <Text style={styles.qrText}>Scan to verify authenticity</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { alignItems: 'center', paddingVertical: 32, borderBottomWidth: 3, borderBottomColor: COLORS.green },
  headerLabel: { fontSize: 12, letterSpacing: 3, color: COLORS.gray500, textTransform: 'uppercase', fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.green, marginTop: 8 },
  headerSub: { fontSize: 13, color: COLORS.gray500, marginTop: 4 },
  verifiedBadge: { alignItems: 'center', marginVertical: 24, padding: 16, backgroundColor: COLORS.greenPale, borderRadius: 16, marginHorizontal: 20, borderWidth: 2, borderColor: COLORS.greenLight },
  verifiedText: { fontSize: 18, fontWeight: '700', color: COLORS.green, marginTop: 4 },
  verifiedDate: { fontSize: 12, color: COLORS.gray500, marginTop: 4 },
  gradeCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', ...SHADOWS.md },
  gradeLetter: { fontSize: 36, fontWeight: '900', color: COLORS.white },
  gradeLabel: { textAlign: 'center', fontSize: 13, color: COLORS.gray500, marginTop: 8, marginBottom: 20 },
  batchBox: { alignItems: 'center', marginBottom: 24 },
  batchId: { fontFamily: 'monospace', fontSize: 15, letterSpacing: 1, color: COLORS.charcoal, backgroundColor: COLORS.gray50, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 20, gap: 12 },
  gridItem: { width: '47%', backgroundColor: COLORS.white, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.gray200 },
  gridLabel: { fontSize: 10, color: COLORS.gray500, letterSpacing: 1, fontWeight: '600' },
  gridValue: { fontSize: 16, fontWeight: '700', color: COLORS.charcoal, marginTop: 4 },
  traceCard: { margin: 20, padding: 20, backgroundColor: '#E3F2FD', borderRadius: 16, borderWidth: 1, borderColor: '#90CAF9' },
  traceTitle: { fontSize: 14, fontWeight: '700', color: '#1565C0', marginBottom: 12 },
  traceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  traceLabel: { fontSize: 13, color: COLORS.gray500 },
  traceValue: { fontSize: 13, fontWeight: '600', color: COLORS.charcoal },
  standards: { marginHorizontal: 20, padding: 16, backgroundColor: COLORS.gray50, borderRadius: 12, marginBottom: 20 },
  standardsTitle: { fontSize: 12, fontWeight: '700', color: COLORS.gray500, marginBottom: 8 },
  standardsText: { fontSize: 12, color: COLORS.gray500, lineHeight: 20 },
  qrSection: { alignItems: 'center', marginVertical: 20 },
  qrBox: { width: 120, height: 120, backgroundColor: COLORS.white, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm },
  qrText: { fontSize: 12, color: COLORS.gray500, marginTop: 8 },
});

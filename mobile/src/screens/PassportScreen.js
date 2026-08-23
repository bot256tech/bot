import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SHADOWS } from '../utils/constants';

export default function PassportScreen({ route, navigation }) {
  const initialBatch = route.params && route.params.batchNumber ? route.params.batchNumber : '';
  const [batch, setBatch] = useState(initialBatch);
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verify = async (batchNo) => {
    const b = (batchNo || batch).trim();
    if (!b) return;
    setLoading(true);
    setError('');
    setPassport(null);
    try {
      const r = await api.verifyPassport(b);
      setPassport(r.data);
    } catch (e) {
      setError(e.message || 'Passport not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialBatch) verify(initialBatch);
  }, [initialBatch]); /* eslint-disable-line */

  const gradeColor = (g) => {
    if (g === 'A') return COLORS.green;
    if (g === 'B') return '#1565C0';
    if (g === 'C') return COLORS.goldDark;
    if (g === 'REJECTED') return COLORS.red;
    return COLORS.gray400;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={34} color={COLORS.green} />
          <Text style={styles.title}>Quality Passport Verification</Text>
          <Text style={styles.subtitle}>Enter a batch number to inspect its recorded quality information and grade.</Text>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. AGR-DEMO-001"
              value={batch}
              onChangeText={setBatch}
              onSubmitEditing={() => verify()}
              returnKeyType="search"
              autoCapitalize="characters"
              placeholderTextColor={COLORS.gray300}
            />
            <TouchableOpacity style={styles.btn} onPress={() => verify()} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Ionicons name="search" size={18} color={COLORS.white} />}
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.resultCard}>
            <Ionicons name="alert-circle-outline" size={34} color={COLORS.goldDark} />
            <Text style={styles.errorTitle}>Passport not found</Text>
            <Text style={styles.errorText}>{error} Check the batch number and try again.</Text>
          </View>
        ) : null}

        {passport ? (
          <View style={styles.resultCard}>
            <Text style={styles.batchNo}>{passport.batch_number}</Text>
            <View style={[styles.gradeRow, { backgroundColor: gradeColor(passport.quality_grade) }]}>
              <Text style={styles.gradeLetter}>{passport.quality_grade || 'P'}</Text>
              <View>
                <Text style={styles.gradeLabel}>{passport.quality_grade === 'REJECTED' ? 'Rejected' : passport.quality_grade ? `Grade ${passport.quality_grade}` : 'Pending grade'}</Text>
                <Text style={styles.gradeSub}>{passport.verified_at ? 'Verified on platform records' : 'Awaiting verification'}</Text>
              </View>
            </View>

            <Row label="Crop" value={passport.crop_type} />
            <Row label="Quantity" value={`${parseFloat(passport.quantity).toLocaleString()} kg`} />
            <Row label="Moisture" value={passport.moisture_level != null ? passport.moisture_level + '%' : 'Not recorded'} />
            <Row label="Aflatoxin" value={passport.aflatoxin_result != null ? passport.aflatoxin_result + ' ppb' : 'Not recorded'} />
            <Row label="Drying centre" value={passport.drying_center || '—'} />
            <Row label="Data source" value={passport.record_source === 'demo' ? 'Demonstration record' : passport.record_source === 'partner' ? 'Partner-entered' : 'Farmer-entered'} />
            <Row label="Issued" value={new Date(passport.created_at).toLocaleDateString()} />

            <Text style={styles.rules}>Grading: A ≤13% & ≤5 ppb · B ≤14% & ≤10 ppb · C ≤15% & ≤20 ppb — otherwise rejected.</Text>
          </View>
        ) : null}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 14 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.charcoal, marginTop: 8, textAlign: 'center' },
  subtitle: { fontSize: 12.5, color: COLORS.gray500, marginTop: 4, textAlign: 'center', lineHeight: 17 },
  searchCard: { backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 16, padding: 14, ...SHADOWS.sm },
  searchRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: COLORS.gray50, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14.5, color: COLORS.charcoal },
  btn: { width: 48, borderRadius: 12, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center' },
  resultCard: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 18, ...SHADOWS.sm, alignItems: 'center' },
  errorTitle: { fontSize: 15.5, fontWeight: '700', color: COLORS.charcoal, marginTop: 10 },
  errorText: { fontSize: 12.5, color: COLORS.gray500, marginTop: 4, textAlign: 'center' },
  batchNo: { fontSize: 15, fontWeight: '800', color: COLORS.charcoal, letterSpacing: 0.4, marginBottom: 12 },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', borderRadius: 14, padding: 14, marginBottom: 8 },
  gradeLetter: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  gradeLabel: { fontSize: 14.5, fontWeight: '800', color: COLORS.white },
  gradeSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  rowLabel: { fontSize: 12.5, color: COLORS.gray500 },
  rowValue: { fontSize: 12.5, fontWeight: '700', color: COLORS.charcoal, maxWidth: '60%', textAlign: 'right' },
  rules: { fontSize: 10.5, color: COLORS.gray400, marginTop: 12, textAlign: 'center', lineHeight: 15 },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SHADOWS } from '../utils/constants';

const CROPS = ['Coffee', 'Maize', 'Beans', 'Rice', 'Cassava', 'Soybeans', 'Groundnuts', 'Banana'];
const DRYING_CENTRES = ['', 'Mayuge Drying Hub', 'Bugiri Drying Hub'];

export default function MyProduceScreen({ navigation }) {
  const [tab, setTab] = useState('batches'); // batches | quality | passports
  const [products, setProducts] = useState([]);
  const [passports, setPassports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Add produce form
  const [crop, setCrop] = useState('Coffee');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [price, setPrice] = useState('');

  // Record quality form
  const [qProduct, setQProduct] = useState(null);
  const [moisture, setMoisture] = useState('');
  const [aflatoxin, setAflatoxin] = useState('');
  const [dryingCenter, setDryingCenter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [l, p] = await Promise.all([api.getMyListings(), api.getMyPassports()]);
      setProducts(l.data || []);
      setPassports(p.data || []);
      if (!qProduct && (l.data || []).length) setQProduct(l.data[0]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [qProduct]);

  useEffect(() => { load(); /* eslint-disable-line */ }, []);

  const addProduce = async () => {
    if (!quantity || parseFloat(quantity) <= 0 || !price || parseFloat(price) <= 0) {
      Alert.alert('Check the form', 'Enter a valid quantity and price per unit.');
      return;
    }
    setSaving(true);
    try {
      await api.createListing({ crop, quantity: parseFloat(quantity), unit, price_per_unit: parseFloat(price) });
      setQuantity(''); setPrice('');
      Alert.alert('Batch registered', `${quantity} ${unit} of ${crop} is now registered.`);
      load();
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveQuality = async () => {
    if (!qProduct) { Alert.alert('Select a batch', 'Choose which batch the readings belong to.'); return; }
    setSaving(true);
    try {
      const r = await api.recordQuality({
        product_id: qProduct.id,
        moisture_level: moisture === '' ? null : parseFloat(moisture),
        aflatoxin_result: aflatoxin === '' ? null : parseFloat(aflatoxin),
        drying_center: dryingCenter || null
      });
      const grade = r.data && r.data.grade ? r.data.grade : '';
      const batch = r.data && r.data.passport ? r.data.passport.batch_number : '';
      Alert.alert(
        'Quality recorded',
        `Batch ${batch}\nAssigned grade: ${grade}\n\nThe Digital Quality Passport has been updated and is visible to buyers.`,
        [{ text: 'OK', onPress: () => load() }]
      );
      setMoisture(''); setAflatoxin('');
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (p) => {
    try {
      await api.toggleListingAvailability(p.id, !p.available);
      load();
    } catch (e) {
      Alert.alert('Could not update', e.message);
    }
  };

  const gradeColor = (g) => g === 'A' ? COLORS.green : g === 'B' ? '#1565C0' : g === 'REJECTED' ? COLORS.red : COLORS.goldDark;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.charcoal} />
        </TouchableOpacity>
        <Text style={styles.title}>My Produce</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.tabRow}>
        {[['batches', 'Batches'], ['quality', 'Quality'], ['passports', 'Passports']].map(([k, label]) => (
          <TouchableOpacity key={k} style={[styles.tab, tab === k && styles.tabActive]} onPress={() => setTab(k)}>
            <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.green} />} keyboardShouldPersistTaps="handled">
        {tab === 'batches' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Register a new batch</Text>
              <Text style={styles.pillLabel}>Crop</Text>
              <View style={styles.pillWrap}>
                {CROPS.map((c) => (
                  <TouchableOpacity key={c} style={[styles.pill, crop === c && styles.pillActive]} onPress={() => setCrop(c)}>
                    <Text style={[styles.pillText, crop === c && styles.pillTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pillLabel}>Quantity</Text>
                  <TextInput style={styles.input} placeholder="e.g. 500" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholderTextColor={COLORS.gray300} />
                </View>
                <View style={{ width: 100 }}>
                  <Text style={styles.pillLabel}>Unit</Text>
                  <View style={styles.unitRow}>
                    {['kg', 'bags', 'bunches'].map((u) => (
                      <TouchableOpacity key={u} onPress={() => setUnit(u)} style={[styles.unitBtn, unit === u && styles.pillActive]}>
                        <Text style={[styles.unitText, unit === u && styles.pillTextActive]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              <Text style={styles.pillLabel}>Price per {unit} (UGX)</Text>
              <TextInput style={styles.input} placeholder="e.g. 1800" value={price} onChangeText={setPrice} keyboardType="numeric" placeholderTextColor={COLORS.gray300} />
              <TouchableOpacity style={styles.saveBtn} onPress={addProduce} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.white} /> : <><Ionicons name="add-circle" size={17} color={COLORS.white} /><Text style={styles.saveBtnText}>Register Batch</Text></>}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Registered batches ({products.length})</Text>
            {products.length === 0 && !loading ? <Text style={styles.empty}>No batches yet. Register your first batch above.</Text> : null}
            {products.map((p) => (
              <View key={p.id} style={styles.listCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cropName}>{p.crop}</Text>
                  <Text style={styles.cropMeta}>{parseFloat(p.quantity).toLocaleString()} {p.unit} · UGX {parseFloat(p.price_per_unit).toLocaleString()}/{p.unit}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'center' }}>
                    <View style={[styles.tag, { backgroundColor: p.quality_status === 'APPROVED' ? COLORS.greenPale : p.quality_status === 'REJECTED' ? COLORS.redLight : '#FFF8E1' }]}>
                      <Text style={[styles.tagText, { color: p.quality_status === 'APPROVED' ? COLORS.green : p.quality_status === 'REJECTED' ? COLORS.red : COLORS.goldDark }]}>
                        {p.quality_status === 'APPROVED' ? 'Approved' : p.quality_status === 'REJECTED' ? 'Rejected' : 'Pending'}
                      </Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: COLORS.gray50 }]}>
                      <Text style={[styles.tagText, { color: COLORS.gray500 }]}>{p.available ? 'Listed' : 'Unlisted'}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={[styles.smallBtn, { backgroundColor: p.available ? COLORS.gray100 : COLORS.green }]} onPress={() => toggleAvailability(p)}>
                  <Text style={[styles.smallBtnText, { color: p.available ? COLORS.gray500 : COLORS.white }]}>{p.available ? 'Unlist' : 'Re-list'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : null}

        {tab === 'quality' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Record quality information</Text>
            <Text style={styles.cardNote}>Moisture and aflatoxin readings generate or update the batch's Digital Quality Passport. Grade A requires ≤13% moisture and ≤5 ppb aflatoxin.</Text>
            <Text style={styles.pillLabel}>Batch</Text>
            {products.length === 0 ? <Text style={styles.empty}>Register a batch first (Batches tab).</Text> : (
              <View style={styles.pillWrap}>
                {products.map((p) => (
                  <TouchableOpacity key={p.id} style={[styles.pill, qProduct && qProduct.id === p.id && styles.pillActive]} onPress={() => setQProduct(p)}>
                    <Text style={[styles.pillText, qProduct && qProduct.id === p.id && styles.pillTextActive]}>{p.crop} · {parseFloat(p.quantity).toLocaleString()} {p.unit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pillLabel}>Moisture (%)</Text>
                <TextInput style={styles.input} placeholder="e.g. 12.4" value={moisture} onChangeText={setMoisture} keyboardType="decimal-pad" placeholderTextColor={COLORS.gray300} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pillLabel}>Aflatoxin (ppb)</Text>
                <TextInput style={styles.input} placeholder="e.g. 3.0" value={aflatoxin} onChangeText={setAflatoxin} keyboardType="decimal-pad" placeholderTextColor={COLORS.gray300} />
              </View>
            </View>
            <Text style={styles.pillLabel}>Drying centre (optional)</Text>
            <View style={styles.pillWrap}>
              {DRYING_CENTRES.map((d) => (
                <TouchableOpacity key={d || 'none'} style={[styles.pill, dryingCenter === d && styles.pillActive]} onPress={() => setDryingCenter(d)}>
                  <Text style={[styles.pillText, dryingCenter === d && styles.pillTextActive]}>{d || 'None'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveQuality} disabled={saving || products.length === 0}>
              {saving ? <ActivityIndicator color={COLORS.white} /> : <><Ionicons name="clipboard" size={17} color={COLORS.white} /><Text style={styles.saveBtnText}>Save Quality Record</Text></>}
            </TouchableOpacity>
          </View>
        ) : null}

        {tab === 'passports' ? (
          <>
            <Text style={styles.sectionLabel}>My Digital Quality Passports ({passports.length})</Text>
            {passports.length === 0 && !loading ? <Text style={styles.empty}>No passports yet. Record quality information to issue one.</Text> : null}
            {passports.map((pp) => (
              <TouchableOpacity key={pp.id} style={styles.listCard} onPress={() => navigation.navigate('Passport', { batchNumber: pp.batch_number })}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.batchNo}>{pp.batch_number}</Text>
                  <Text style={styles.cropMeta}>{pp.crop_type} · {parseFloat(pp.quantity).toLocaleString()} kg</Text>
                  <Text style={styles.cropMeta}>Moisture {pp.moisture_level != null ? pp.moisture_level + '%' : '—'} · Aflatoxin {pp.aflatoxin_result != null ? pp.aflatoxin_result + ' ppb' : '—'}</Text>
                </View>
                <View style={[styles.gradeBadge, { backgroundColor: gradeColor(pp.quality_grade) }]}>
                  <Text style={styles.gradeText}>{pp.quality_grade || '?'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },
  title: { fontSize: 19, fontWeight: '800', color: COLORS.charcoal },
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.gray50, borderRadius: 12, padding: 4, marginHorizontal: 20, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.white, ...SHADOWS.sm },
  tabText: { fontSize: 12.5, fontWeight: '600', color: COLORS.gray400 },
  tabTextActive: { color: COLORS.green },
  errorBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, backgroundColor: COLORS.redLight, borderRadius: 10, padding: 12, gap: 10 },
  errorText: { flex: 1, fontSize: 12.5, color: COLORS.red },
  retryText: { fontSize: 12.5, fontWeight: '700', color: COLORS.red },
  card: { backgroundColor: COLORS.white, marginHorizontal: 20, borderRadius: 18, padding: 18, ...SHADOWS.sm },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.charcoal, marginBottom: 6 },
  cardNote: { fontSize: 11.5, color: COLORS.gray500, marginBottom: 12, lineHeight: 16 },
  pillLabel: { fontSize: 12, fontWeight: '600', color: COLORS.charcoal, marginTop: 12, marginBottom: 7 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 },
  pillActive: { backgroundColor: COLORS.greenPale, borderColor: COLORS.green },
  pillText: { fontSize: 12, color: COLORS.gray500, fontWeight: '500' },
  pillTextActive: { color: COLORS.green, fontWeight: '700' },
  input: { backgroundColor: COLORS.gray50, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: COLORS.charcoal },
  unitRow: { flexDirection: 'row', gap: 6 },
  unitBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 12, backgroundColor: COLORS.gray50 },
  unitText: { fontSize: 11.5, color: COLORS.gray500, fontWeight: '600' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.green, borderRadius: 13, paddingVertical: 14, marginTop: 18 },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14.5 },
  sectionLabel: { fontSize: 14.5, fontWeight: '700', color: COLORS.charcoal, marginHorizontal: 20, marginTop: 20, marginBottom: 10 },
  empty: { marginHorizontal: 20, fontSize: 12.5, color: COLORS.gray400, backgroundColor: COLORS.white, borderRadius: 14, padding: 18, textAlign: 'center' },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 20, marginBottom: 10, borderRadius: 16, padding: 15, ...SHADOWS.sm },
  cropName: { fontSize: 15, fontWeight: '700', color: COLORS.charcoal },
  cropMeta: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  tag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12 },
  tagText: { fontSize: 10, fontWeight: '700' },
  smallBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  smallBtnText: { fontSize: 11.5, fontWeight: '700' },
  batchNo: { fontSize: 13.5, fontWeight: '800', color: COLORS.charcoal, letterSpacing: 0.3 },
  gradeBadge: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  gradeText: { color: COLORS.white, fontWeight: '900', fontSize: 16 },
});

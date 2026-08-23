import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SHADOWS } from '../utils/constants';

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState('');
  const [ordering, setOrdering] = useState(false);

  const user = api.user || {};
  const isBuyer = (user.role || '').toUpperCase() === 'BUYER';

  useEffect(() => {
    (async () => {
      try {
        const r = await api.getProduct(productId);
        setProduct(r.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const placeOrder = async () => {
    const q = parseFloat(qty);
    if (!Number.isFinite(q) || q <= 0) { Alert.alert('Enter a quantity', 'Quantity must be a positive number.'); return; }
    setOrdering(true);
    try {
      const r = await api.placeOrder(product.id, q);
      Alert.alert('Order request placed', `Your request for ${q} ${product.unit} of ${product.crop} was sent to the farmer. Total ${Math.round(q * parseFloat(product.price_per_unit)).toLocaleString()} UGX.`);
      setQty('');
    } catch (e) {
      Alert.alert('Could not place order', e.message);
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={COLORS.green} /></SafeAreaView>;

  if (error || !product) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={COLORS.gray300} />
        <Text style={styles.errorTitle}>Could not load this listing</Text>
        <Text style={styles.errorText}>{error || 'Unknown error'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryBtnText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const passport = product.passport;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.crop}>{product.crop}</Text>
              <Text style={styles.meta}>Listed by {product.farmer_name}{product.district ? ` · ${product.district}${product.village ? ', ' + product.village : ''}` : ''}</Text>
            </View>
            {product.quality_status === 'APPROVED' ? (
              <View style={[styles.tag, { backgroundColor: COLORS.greenPale }]}><Text style={[styles.tagText, { color: COLORS.green }]}>Approved</Text></View>
            ) : product.quality_status === 'REJECTED' ? (
              <View style={[styles.tag, { backgroundColor: COLORS.redLight }]}><Text style={[styles.tagText, { color: COLORS.red }]}>Rejected</Text></View>
            ) : (
              <View style={[styles.tag, { backgroundColor: '#FFF8E1' }]}><Text style={[styles.tagText, { color: COLORS.goldDark }]}>Pending</Text></View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{parseFloat(product.quantity).toLocaleString()}</Text>
              <Text style={styles.statLabel}>{product.unit} available</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: COLORS.green }]}>UGX {parseFloat(product.price_per_unit).toLocaleString()}</Text>
              <Text style={styles.statLabel}>per {product.unit}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: COLORS.goldDark }]}>UGX {Math.round(parseFloat(product.quantity) * parseFloat(product.price_per_unit)).toLocaleString()}</Text>
              <Text style={styles.statLabel}>full batch</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Digital Quality Passport</Text>
          {passport ? (
            <>
              <View style={styles.passRow}>
                <Text style={styles.passLabel}>Batch number</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Passport', { batchNumber: passport.batch_number })}>
                  <Text style={styles.passLink}>{passport.batch_number}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passRow}>
                <Text style={styles.passLabel}>Grade</Text>
                <Text style={[styles.passValue, { color: passport.quality_grade === 'A' || passport.quality_grade === 'B' ? COLORS.green : COLORS.red }]}>
                  {passport.quality_grade || 'Pending'}{passport.quality_grade === 'A' || passport.quality_grade === 'B' ? ' — passing' : ''}
                </Text>
              </View>
              <View style={styles.passRow}>
                <Text style={styles.passLabel}>Moisture</Text>
                <Text style={styles.passValue}>{passport.moisture_level != null ? passport.moisture_level + '%' : 'Not recorded'}</Text>
              </View>
              <View style={styles.passRow}>
                <Text style={styles.passLabel}>Aflatoxin</Text>
                <Text style={styles.passValue}>{passport.aflatoxin_result != null ? passport.aflatoxin_result + ' ppb' : 'Not recorded'}</Text>
              </View>
              <View style={styles.passRow}>
                <Text style={styles.passLabel}>Data source</Text>
                <Text style={styles.passValue}>
                  {passport.record_source === 'demo' ? 'Demonstration record' : passport.record_source === 'partner' ? 'Partner-entered' : 'Farmer-entered'}
                </Text>
              </View>
              <TouchableOpacity style={styles.passBtn} onPress={() => navigation.navigate('Passport', { batchNumber: passport.batch_number })}>
                <Ionicons name="certificate" size={16} color={COLORS.white} />
                <Text style={styles.passBtnText}>Open Verifiable Passport</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noPassport}>No passport issued yet — moisture and test results will appear once recorded by the farmer or a testing partner.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Place an order request</Text>
          {isBuyer ? (
            product.available ? (
              <>
                <Text style={styles.pillLabel}>Quantity ({product.unit})</Text>
                <TextInput style={styles.input} placeholder={`1 – ${parseFloat(product.quantity)}`} value={qty} onChangeText={setQty} keyboardType="numeric" placeholderTextColor={COLORS.gray300} />
                <TouchableOpacity style={styles.orderBtn} onPress={placeOrder} disabled={ordering}>
                  {ordering ? <ActivityIndicator color={COLORS.white} /> : <><Ionicons name="paper-plane" size={16} color={COLORS.white} /><Text style={styles.orderBtnText}>Request Order</Text></>}
                </TouchableOpacity>
                <Text style={styles.note}>The farmer receives your request with your contact details. Payment is settled via mobile money on confirmation.</Text>
              </>
            ) : (
              <Text style={styles.note}>This listing is currently unavailable.</Text>
            )
          ) : (
            <Text style={styles.note}>
              {api.isLoggedIn()
                ? 'Order requests are placed by buyer accounts.'
                : 'Log in as a buyer to place order requests.'}
            </Text>
          )}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  center: { flex: 1, backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center', padding: 30 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: COLORS.charcoal, marginTop: 12 },
  errorText: { fontSize: 12.5, color: COLORS.gray500, marginTop: 4, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: COLORS.green, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 11 },
  retryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13.5 },
  card: { backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 14, borderRadius: 16, padding: 17, ...SHADOWS.sm },
  crop: { fontSize: 20, fontWeight: '800', color: COLORS.charcoal },
  meta: { fontSize: 12.5, color: COLORS.gray500, marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  stat: { flex: 1, backgroundColor: COLORS.gray50, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 13.5, fontWeight: '800', color: COLORS.charcoal },
  statLabel: { fontSize: 10, color: COLORS.gray500, marginTop: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.charcoal, marginBottom: 10 },
  passRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  passLabel: { fontSize: 12.5, color: COLORS.gray500 },
  passValue: { fontSize: 12.5, fontWeight: '700', color: COLORS.charcoal },
  passLink: { fontSize: 12.5, fontWeight: '800', color: COLORS.green },
  noPassport: { fontSize: 12.5, color: COLORS.gray500, lineHeight: 18 },
  passBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.green, borderRadius: 12, paddingVertical: 13, marginTop: 14 },
  passBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13.5 },
  pillLabel: { fontSize: 12, fontWeight: '600', color: COLORS.charcoal, marginBottom: 7 },
  input: { backgroundColor: COLORS.gray50, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: COLORS.charcoal },
  orderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.green, borderRadius: 12, paddingVertical: 13, marginTop: 12 },
  orderBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  note: { fontSize: 11.5, color: COLORS.gray400, marginTop: 10, lineHeight: 16 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagText: { fontSize: 10.5, fontWeight: '700' },
});

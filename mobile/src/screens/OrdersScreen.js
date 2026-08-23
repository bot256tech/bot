import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SHADOWS } from '../utils/constants';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.getMyOrders();
      setOrders(r.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cancel = (o) => {
    Alert.alert('Cancel order', `Cancel your request for ${o.crop}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          try { await api.cancelOrder(o.id); load(); }
          catch (e) { Alert.alert('Could not cancel', e.message); }
        }
      }
    ]);
  };

  const statusColor = (s) => s === 'completed' ? COLORS.green : s === 'confirmed' ? '#1565C0' : s === 'cancelled' ? COLORS.red : COLORS.goldDark;

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.crop}>{item.crop}</Text>
          <Text style={styles.meta}>{item.farmer_name}{item.district ? ` · ${item.district}` : ''}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: item.status === 'pending' ? '#FFF8E1' : item.status === 'cancelled' ? COLORS.redLight : COLORS.greenPale }]}>
          <Text style={[styles.tagText, { color: statusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowItem}>{parseFloat(item.quantity).toLocaleString()} {item.unit} @ UGX {parseFloat(item.price_per_unit).toLocaleString()}</Text>
        <Text style={styles.total}>UGX {parseFloat(item.total_amount).toLocaleString()}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        {item.status === 'pending' ? (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => cancel(item)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.charcoal} />
        </TouchableOpacity>
        <Text style={styles.title}>My Orders</Text>
        <View style={{ width: 22 }} />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.retry}>Retry</Text></TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={!error ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={26} color={COLORS.gray300} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>Browse the marketplace and place an order request on a verified batch.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Market')}>
              <Text style={styles.emptyBtnText}>Browse Marketplace</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  title: { fontSize: 19, fontWeight: '800', color: COLORS.charcoal },
  errorBox: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, backgroundColor: COLORS.redLight, borderRadius: 12, padding: 12, alignItems: 'center', gap: 10 },
  errorText: { flex: 1, fontSize: 12.5, color: COLORS.red },
  retry: { fontSize: 12.5, fontWeight: '700', color: COLORS.red },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 15, marginBottom: 12, ...SHADOWS.sm },
  crop: { fontSize: 15.5, fontWeight: '800', color: COLORS.charcoal },
  meta: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagText: { fontSize: 10.5, fontWeight: '700', textTransform: 'capitalize' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  rowItem: { fontSize: 12.5, color: COLORS.gray500 },
  total: { fontSize: 13.5, fontWeight: '800', color: COLORS.green },
  date: { fontSize: 11, color: COLORS.gray400, marginTop: 8 },
  cancelBtn: { backgroundColor: COLORS.gray100, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7, marginTop: 6 },
  cancelBtnText: { fontSize: 11.5, fontWeight: '700', color: COLORS.red },
  empty: { alignItems: 'center', padding: 36, backgroundColor: COLORS.white, borderRadius: 16, marginTop: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.charcoal, marginTop: 10 },
  emptyText: { fontSize: 12.5, color: COLORS.gray500, marginTop: 4, textAlign: 'center', lineHeight: 17 },
  emptyBtn: { marginTop: 14, backgroundColor: COLORS.green, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
});

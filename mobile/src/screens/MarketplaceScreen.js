import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SHADOWS } from '../utils/constants';

export default function MarketplaceScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (q) => {
    setLoading(true);
    setError('');
    try {
      const r = await api.getProducts(q ? { q } : {});
      setProducts(r.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSearchSubmit = () => load(search.trim());

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}>
      <View style={styles.cardTop}>
        <View style={styles.cropIcon}>
          <Ionicons name="leaf" size={18} color={COLORS.green} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.crop}>{item.crop}</Text>
            <Text style={styles.price}>UGX {parseFloat(item.price_per_unit).toLocaleString()}<Text style={styles.perUnit}>/{item.unit}</Text></Text>
          </View>
          <Text style={styles.meta}>{parseFloat(item.quantity).toLocaleString()} {item.unit} available · {item.district || item.location || '—'}</Text>
          <Text style={styles.farmer}>{item.farmer_name || item.farmer}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'center' }}>
            {item.quality_status === 'APPROVED' ? (
              <View style={[styles.tag, { backgroundColor: COLORS.greenPale }]}><Text style={[styles.tagText, { color: COLORS.green }]}>Approved</Text></View>
            ) : item.quality_status === 'REJECTED' ? (
              <View style={[styles.tag, { backgroundColor: COLORS.redLight }]}><Text style={[styles.tagText, { color: COLORS.red }]}>Rejected</Text></View>
            ) : (
              <View style={[styles.tag, { backgroundColor: '#FFF8E1' }]}><Text style={[styles.tagText, { color: COLORS.goldDark }]}>Pending</Text></View>
            )}
            {item.quality_grade ? <View style={[styles.tag, { backgroundColor: '#E3F2FD' }]}><Text style={[styles.tagText, { color: '#1565C0' }]}>Grade {item.quality_grade}</Text></View> : null}
            {item.moisture_level != null ? <Text style={styles.moisture}>{item.moisture_level}% moisture</Text> : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Verified produce from registered farmers</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={COLORS.gray400} />
          <TextInput style={styles.searchInput} placeholder="Search crop or district" value={search} onChangeText={setSearch} onSubmitEditing={onSearchSubmit} returnKeyType="search" placeholderTextColor={COLORS.gray300} />
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={onSearchSubmit}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load(search.trim())}><Text style={styles.retry}>Retry</Text></TouchableOpacity>
        </View>
      ) : null}

      {loading && products.length === 0 ? (
        <ActivityIndicator size="large" color={COLORS.green} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshing={loading}
          onRefresh={() => load(search.trim())}
          ListEmptyComponent={
            !error ? (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={26} color={COLORS.gray300} />
                <Text style={styles.emptyTitle}>No listings found</Text>
                <Text style={styles.emptyText}>Try a different crop or district, or clear the search.</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  title: { fontSize: 21, fontWeight: '800', color: COLORS.charcoal },
  subtitle: { fontSize: 12.5, color: COLORS.gray500, marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.white, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.gray200 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14.5, color: COLORS.charcoal },
  searchBtn: { backgroundColor: COLORS.green, borderRadius: 14, paddingHorizontal: 18, justifyContent: 'center' },
  searchBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13.5 },
  errorBox: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, backgroundColor: COLORS.redLight, borderRadius: 12, padding: 12, alignItems: 'center', gap: 10 },
  errorText: { flex: 1, fontSize: 12.5, color: COLORS.red },
  retry: { fontSize: 12.5, fontWeight: '700', color: COLORS.red },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 15, marginBottom: 12, ...SHADOWS.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cropIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: COLORS.greenPale, justifyContent: 'center', alignItems: 'center' },
  crop: { fontSize: 15.5, fontWeight: '800', color: COLORS.charcoal },
  price: { fontSize: 13.5, fontWeight: '800', color: COLORS.green },
  perUnit: { fontSize: 11, color: COLORS.gray400, fontWeight: '600' },
  meta: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  farmer: { fontSize: 11.5, color: COLORS.gray400, marginTop: 1 },
  tag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  tagText: { fontSize: 10, fontWeight: '700' },
  moisture: { fontSize: 10.5, color: COLORS.gray400, fontWeight: '600' },
  empty: { alignItems: 'center', padding: 40, backgroundColor: COLORS.white, borderRadius: 16, marginTop: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.charcoal, marginTop: 10 },
  emptyText: { fontSize: 12.5, color: COLORS.gray500, marginTop: 4, textAlign: 'center' },
});

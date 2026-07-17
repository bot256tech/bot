import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/constants';

const { width } = Dimensions.get('window');

const SAMPLE_PRODUCTS = [
  { id: 1, crop: 'Maize', grade: 'A', price: 1800, quantity: 2000, unit: 'kg', district: 'Mayuge', farmer: 'John Mukasa', passport: 'AGR-2026-A12345' },
  { id: 2, crop: 'Coffee', grade: 'A', price: 12000, quantity: 500, unit: 'kg', district: 'Jinja', farmer: 'Grace Namutebi', passport: 'AGR-2026-B67890' },
  { id: 3, crop: 'Groundnuts', grade: 'B', price: 3500, quantity: 800, unit: 'kg', district: 'Kamuli', farmer: 'Moses Waiswa', passport: 'AGR-2026-C11223' },
  { id: 4, crop: 'Beans', grade: 'A', price: 3200, quantity: 1200, unit: 'kg', district: 'Iganga', farmer: 'Sarah Babirye', passport: 'AGR-2026-D44556' },
  { id: 5, crop: 'Maize', grade: 'A', price: 1650, quantity: 3000, unit: 'kg', district: 'Mayuge', farmer: 'Peter Oundo', passport: 'AGR-2026-E78901' },
  { id: 6, crop: 'Cocoa', grade: 'A', price: 7000, quantity: 300, unit: 'kg', district: 'Jinja', farmer: 'Fatuma Nakato', passport: 'AGR-2026-F38291' },
];

const CROPS = ['All', 'Maize', 'Coffee', 'Cocoa', 'Groundnuts', 'Beans'];

export default function MarketplaceScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [loading, setLoading] = useState(false);

  const filtered = SAMPLE_PRODUCTS.filter(p => {
    const matchCrop = selectedCrop === 'All' || p.crop === selectedCrop;
    const matchSearch = !search || p.crop.toLowerCase().includes(search.toLowerCase()) || p.farmer.toLowerCase().includes(search.toLowerCase()) || p.district.toLowerCase().includes(search.toLowerCase());
    return matchCrop && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Verified produce from certified farmers</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search crops, farmers, districts..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={COLORS.gray300}
        />
      </View>

      {/* Crop Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {CROPS.map(crop => (
          <TouchableOpacity
            key={crop}
            style={[styles.filterChip, selectedCrop === crop && styles.filterChipActive]}
            onPress={() => setSelectedCrop(crop)}
          >
            <Text style={[styles.filterText, selectedCrop === crop && styles.filterTextActive]}>{crop}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      <Text style={styles.resultCount}>{filtered.length} listings found</Text>

      {/* Product List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
            activeOpacity={0.7}
          >
            <View style={styles.productTop}>
              <View style={styles.cropBadge}>
                <Text style={styles.cropEmoji}>{item.crop === 'Maize' ? '🌽' : item.crop === 'Coffee' ? '☕' : item.crop === 'Cocoa' ? '🌰' : item.crop === 'Groundnuts' ? '🥜' : item.crop === 'Beans' ? '🌱' : '🌾'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.productCrop}>{item.crop}</Text>
                <Text style={styles.productFarmer}>{item.farmer} • {item.district}</Text>
              </View>
              <View style={[styles.gradeBadge, item.grade === 'A' ? styles.gradeA : styles.gradeB]}>
                <Text style={styles.gradeText}>Grade {item.grade}</Text>
              </View>
            </View>

            <View style={styles.productDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={styles.detailValue}>{item.quantity.toLocaleString()} {item.unit}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={[styles.detailValue, styles.price]}>UGX {item.price.toLocaleString()}/kg</Text>
              </View>
            </View>

            <View style={styles.productFooter}>
              <View style={styles.passportBadge}>
                <Ionicons name="document-text" size={12} color={COLORS.green} />
                <Text style={styles.passportText}>{item.passport}</Text>
              </View>
              <TouchableOpacity style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>View Details</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.green} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.charcoal },
  subtitle: { fontSize: 14, color: COLORS.gray500, marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 20, marginVertical: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.gray200, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.charcoal },
  filterRow: { paddingLeft: 20, marginBottom: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50, backgroundColor: COLORS.white, marginRight: 8, borderWidth: 1, borderColor: COLORS.gray200 },
  filterChipActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  filterTextActive: { color: COLORS.white },
  resultCount: { fontSize: 13, color: COLORS.gray500, paddingHorizontal: 20, marginBottom: 8, fontWeight: '500' },
  productCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 18, marginBottom: 14, ...SHADOWS.sm },
  productTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cropBadge: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.greenPale, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cropEmoji: { fontSize: 22 },
  productCrop: { fontSize: 16, fontWeight: '700', color: COLORS.charcoal },
  productFarmer: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  gradeA: { backgroundColor: COLORS.greenPale },
  gradeB: { backgroundColor: COLORS.goldLight },
  gradeText: { fontSize: 11, fontWeight: '700', color: COLORS.green },
  productDetails: { flexDirection: 'row', backgroundColor: COLORS.gray50, borderRadius: 12, padding: 12, marginBottom: 14 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, color: COLORS.gray500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 15, fontWeight: '700', color: COLORS.charcoal },
  price: { color: COLORS.green },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  passportBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  passportText: { fontSize: 11, color: COLORS.green, fontWeight: '600' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.green },
});

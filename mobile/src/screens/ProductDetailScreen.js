import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../utils/constants';

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params || {};
  if (!product) return <View style={{ flex: 1, backgroundColor: COLORS.cream }} />;
  const emoji = product.crop === 'Maize' ? '🌽' : product.crop === 'Coffee' ? '☕' : product.crop === 'Cocoa' ? '🌰' : product.crop === 'Groundnuts' ? '🥜' : product.crop === 'Beans' ? '🌱' : '🌾';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroEmoji}><Text style={{ fontSize: 48 }}>{emoji}</Text></View>
          <Text style={styles.cropName}>{product.crop}</Text>
          <View style={[styles.gradeBadge, product.grade === 'A' ? styles.gradeA : styles.gradeB]}>
            <Text style={styles.gradeText}>Grade {product.grade}</Text>
          </View>
        </View>
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Product Details</Text>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Farmer</Text><Text style={styles.detailValue}>{product.farmer}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>District</Text><Text style={styles.detailValue}>{product.district}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Quantity</Text><Text style={styles.detailValue}>{product.quantity.toLocaleString()} {product.unit}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Price</Text><Text style={[styles.detailValue, { color: COLORS.green, fontSize: 18 }]}>UGX {product.price.toLocaleString()}/kg</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Total Value</Text><Text style={[styles.detailValue, { color: COLORS.goldDark }]}>UGX {(product.price * product.quantity).toLocaleString()}</Text></View>
        </View>
        <TouchableOpacity style={styles.passportCard} onPress={() => navigation.navigate('Passport', { passport: product.passport })}>
          <View style={styles.passportIcon}><Ionicons name="document-text" size={24} color={COLORS.green} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.passportTitle}>Digital Quality Passport</Text>
            <Text style={styles.passportId}>{product.passport}</Text>
            <Text style={styles.passportSub}>QR-verified certificate</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.gray300} />
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.buyBtn}><Ionicons name="cart" size={20} color="#fff" /><Text style={styles.buyBtnText}>Purchase This Batch</Text></TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn}><Ionicons name="chatbubble" size={20} color={COLORS.green} /><Text style={styles.contactBtnText}>Contact Farmer</Text></TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  hero: { alignItems: 'center', paddingVertical: 40, backgroundColor: COLORS.white },
  heroEmoji: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.greenPale, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cropName: { fontSize: 28, fontWeight: '800', color: COLORS.charcoal },
  gradeBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 50, marginTop: 8 },
  gradeA: { backgroundColor: COLORS.greenPale },
  gradeB: { backgroundColor: COLORS.goldLight },
  gradeText: { fontSize: 13, fontWeight: '700', color: COLORS.green },
  detailsCard: { margin: 20, padding: 24, backgroundColor: COLORS.white, borderRadius: 24, ...SHADOWS.sm },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.charcoal, marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  detailLabel: { fontSize: 14, color: COLORS.gray500 },
  detailValue: { fontSize: 14, fontWeight: '700', color: COLORS.charcoal },
  passportCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 20, backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1, borderColor: COLORS.greenPale, ...SHADOWS.sm },
  passportIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.greenPale, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  passportTitle: { fontSize: 15, fontWeight: '700', color: COLORS.charcoal },
  passportId: { fontSize: 13, fontWeight: '600', color: COLORS.green, marginTop: 2 },
  passportSub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  actions: { padding: 20, gap: 12 },
  buyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: COLORS.green, borderRadius: 16, ...SHADOWS.md },
  buyBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 2, borderColor: COLORS.green },
  contactBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.green },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SHADOWS } from '../utils/constants';

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const user = api.user || {};
  const isFarmer = (user.role || '').toUpperCase() === 'FARMER';
  const isBuyer = (user.role || '').toUpperCase() === 'BUYER';

  const load = useCallback(async () => {
    setLoading(true);
    setOffline(false);
    try {
      const s = await api.getMarketplaceStats();
      setStats(s.data);
      if (isFarmer) {
        try { const l = await api.getMyListings(); setMyListings(l.data || []); } catch (e) { /* non-fatal */ }
      }
      if (isBuyer) {
        try { const o = await api.getMyOrders(); setMyOrders(o.data || []); } catch (e) { /* non-fatal */ }
      }
    } catch (e) {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [isFarmer, isBuyer]);

  useEffect(() => { load(); }, [load]);

  const quickActions = isFarmer
    ? [
        { icon: 'add-circle', title: 'Register Produce', desc: 'List a new batch', color: COLORS.greenPale, iconColor: COLORS.green, screen: 'MyProduce' },
        { icon: 'clipboard', title: 'Record Quality', desc: 'Moisture & aflatoxin', color: '#E3F2FD', iconColor: '#1565C0', screen: 'MyProduce' },
        { icon: 'document-text', title: 'My Passports', desc: 'Batch certificates', color: '#FFF8E1', iconColor: COLORS.goldDark, screen: 'MyProduce' },
        { icon: 'storefront', title: 'Marketplace', desc: 'See demand & prices', color: '#F3E5F5', iconColor: '#6A1B9A', screen: 'Market' },
      ]
    : [
        { icon: 'storefront', title: 'Browse Produce', desc: 'Verified listings', color: COLORS.greenPale, iconColor: COLORS.green, screen: 'Market' },
        { icon: 'receipt', title: 'My Orders', desc: `${myOrders.length} request${myOrders.length === 1 ? '' : 's'}`, color: '#FFF8E1', iconColor: COLORS.goldDark, screen: 'Orders' },
        { icon: 'qr-scanner', title: 'Verify Passport', desc: 'Scan or type batch no.', color: '#E3F2FD', iconColor: '#1565C0', screen: 'Scan' },
        { icon: 'chatbubbles', title: 'AI Advisor', desc: 'Decisions from your data', color: '#F3E5F5', iconColor: '#6A1B9A', screen: 'Advisor' },
      ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.green} />}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user.name || 'AGRICHAIN user'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{(user.role || 'USER') + (isFarmer ? ' · Busoga pilot' : '')}</Text>
            </View>
          </View>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={22} color={COLORS.white} />
          </View>
        </View>

        {offline ? (
          <View style={styles.offlineBar}>
            <Ionicons name="cloud-offline-outline" size={15} color={COLORS.goldDark} />
            <Text style={styles.offlineText}>Cannot reach the server. Pull down to retry.</Text>
          </View>
        ) : null}

        {/* Role summary */}
        {isFarmer ? (
          <View style={styles.roleCard}>
            <View style={styles.roleCardLeft}>
              <Text style={styles.roleCardValue}>{myListings.length}</Text>
              <Text style={styles.roleCardLabel}>registered batches</Text>
            </View>
            <TouchableOpacity style={styles.roleCardBtn} onPress={() => navigation.navigate('MyProduce')}>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.featuresGrid}>
          {quickActions.map((f, i) => (
            <TouchableOpacity key={i} style={styles.featureCard} onPress={() => navigation.navigate(f.screen)} activeOpacity={0.7}>
              <View style={[styles.featureIcon, { backgroundColor: f.color }]}>
                <Ionicons name={f.icon} size={21} color={f.iconColor} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Live platform stats */}
        <Text style={styles.sectionTitle}>Platform (live)</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.green }]}>{stats ? stats.active_listings : '—'}</Text>
            <Text style={styles.statLabel}>Active listings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.goldDark }]}>{stats ? (Math.round((stats.available_kg || 0))).toLocaleString() : '—'}</Text>
            <Text style={styles.statLabel}>Kg available</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.green }]}>{stats ? stats.quality_passports : '—'}</Text>
            <Text style={styles.statLabel}>Passports</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#1565C0' }]}>{stats ? stats.orders : '—'}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  greeting: { fontSize: 13, color: COLORS.gray500 },
  userName: { fontSize: 21, fontWeight: '800', color: COLORS.charcoal },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.greenPale, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  roleText: { fontSize: 10.5, fontWeight: '700', color: COLORS.green, letterSpacing: 0.4 },
  logoCircle: { width: 44, height: 44, borderRadius: 16, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center' },
  offlineBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 8, backgroundColor: '#FFF8E1', borderRadius: 10, padding: 10 },
  offlineText: { fontSize: 12, color: COLORS.goldDark, flex: 1 },
  roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.green, marginHorizontal: 20, borderRadius: 18, padding: 18, ...SHADOWS.md, marginTop: 8 },
  roleCardLeft: { flex: 1 },
  roleCardValue: { fontSize: 28, fontWeight: '800', color: COLORS.white },
  roleCardLabel: { fontSize: 12.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  roleCardBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16.5, fontWeight: '700', color: COLORS.charcoal, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12 },
  featureCard: { width: '46%', backgroundColor: COLORS.white, borderRadius: 18, padding: 16, ...SHADOWS.sm },
  featureIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featureTitle: { fontSize: 13.5, fontWeight: '700', color: COLORS.charcoal, marginBottom: 3 },
  featureDesc: { fontSize: 11.5, color: COLORS.gray500 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 10 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 12, alignItems: 'center', ...SHADOWS.sm },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, color: COLORS.gray500, marginTop: 3, textAlign: 'center' },
});

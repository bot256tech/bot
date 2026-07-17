import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/constants';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const features = [
    { icon: 'leaf', title: 'AI Crop Advisor', desc: 'Disease detection & advice', color: COLORS.greenPale, iconColor: COLORS.green, screen: 'Advisor' },
    { icon: 'storefront', title: 'Marketplace', desc: 'Buy & sell produce', color: COLORS.goldLight, iconColor: COLORS.goldDark, screen: 'Market' },
    { icon: 'scan', title: 'Scan Disease', desc: 'Photo analysis', color: '#E3F2FD', iconColor: '#1565C0', screen: 'Scan' },
    { icon: 'sunny', title: 'Solar Drying', desc: 'Book drying service', color: '#FFF8E1', iconColor: COLORS.goldDark, screen: null },
  ];

  const stats = [
    { value: '847', label: 'Farmers', icon: 'people', color: COLORS.green },
    { value: '4', label: 'Districts', icon: 'location', color: COLORS.goldDark },
    { value: '156', label: 'Passports', icon: 'document', color: COLORS.green },
    { value: '42T', label: 'Processed', icon: 'sunny', color: COLORS.goldDark },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome to</Text>
            <Text style={styles.brand}>AGRICHAIN 360</Text>
          </View>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={24} color={COLORS.white} />
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>The Digital Infrastructure Powering Agriculture</Text>
          <Text style={styles.heroSub}>Connect farmers, buyers, and service providers through one intelligent platform.</Text>
          <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.navigate('Market')}>
            <Text style={styles.heroBtnText}>Explore Marketplace</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.featuresGrid}>
          {features.map((f, i) => (
            <TouchableOpacity
              key={i}
              style={styles.featureCard}
              onPress={() => f.screen && navigation.navigate(f.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.featureIcon, { backgroundColor: f.color }]}>
                <Ionicons name={f.icon} size={22} color={f.iconColor} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Platform Impact</Text>
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '15' }]}>
                <Ionicons name={s.icon} size={16} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Links */}
        <Text style={styles.sectionTitle}>Tools</Text>
        <View style={styles.toolsList}>
          {[
            { icon: 'document-text', title: 'Quality Passport', desc: 'Verify crop certificates', screen: 'Market', color: COLORS.green },
            { icon: 'cloud', title: 'Weather', desc: 'Forecast for your area', screen: 'Advisor', color: '#1565C0' },
            { icon: 'wallet', title: 'Finance', desc: 'Payments & credit', screen: 'Profile', color: COLORS.goldDark },
            { icon: 'chatbubbles', title: 'Community', desc: 'Connect with farmers', screen: 'Advisor', color: '#6A1B9A' },
          ].map((t, i) => (
            <TouchableOpacity
              key={i}
              style={styles.toolItem}
              onPress={() => navigation.navigate(t.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIcon, { backgroundColor: t.color + '15' }]}>
                <Ionicons name={t.icon} size={20} color={t.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toolTitle}>{t.title}</Text>
                <Text style={styles.toolDesc}>{t.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray300} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 14, color: COLORS.gray500, fontWeight: '500' },
  brand: { fontSize: 24, fontWeight: '800', color: COLORS.green, fontFamily: 'System' },
  logoCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center' },
  heroCard: { margin: 20, padding: 24, backgroundColor: COLORS.green, borderRadius: 24, ...SHADOWS.lg },
  heroTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, lineHeight: 28, marginBottom: 12 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginBottom: 20 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gold, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignSelf: 'flex-start', gap: 8 },
  heroBtnText: { color: '#3E2723', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.charcoal, paddingHorizontal: 20, marginTop: 24, marginBottom: 16 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12 },
  featureCard: { width: (width - 52) / 2, backgroundColor: COLORS.white, borderRadius: 20, padding: 18, ...SHADOWS.sm },
  featureIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: COLORS.charcoal, marginBottom: 4 },
  featureDesc: { fontSize: 12, color: COLORS.gray500 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 10 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 14, alignItems: 'center', ...SHADOWS.sm },
  statIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.gray500, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  toolsList: { paddingHorizontal: 20 },
  toolItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 10, ...SHADOWS.sm },
  toolIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  toolTitle: { fontSize: 15, fontWeight: '600', color: COLORS.charcoal },
  toolDesc: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
});

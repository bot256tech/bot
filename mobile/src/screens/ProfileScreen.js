import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../utils/constants';

export default function ProfileScreen({ navigation }) {
  const menuItems = [
    { icon: 'person', title: 'My Account', desc: 'Name, phone, location', color: COLORS.green },
    { icon: 'leaf', title: 'My Farm', desc: 'Crops, fields, GPS maps', color: COLORS.greenLight },
    { icon: 'document-text', title: 'Quality Passports', desc: 'View your certificates', color: COLORS.goldDark },
    { icon: 'cart', title: 'My Orders', desc: 'Purchase history', color: '#1565C0' },
    { icon: 'wallet', title: 'Finance & Wallet', desc: 'Payments, credit, savings', color: COLORS.goldDark },
    { icon: 'people', title: 'My Cooperative', desc: 'Members, savings, loans', color: '#6A1B9A' },
    { icon: 'notifications', title: 'Notifications', desc: 'Alerts & updates', color: '#E65100' },
    { icon: 'settings', title: 'Settings', desc: 'Language, theme, preferences', color: COLORS.gray500 },
    { icon: 'help-circle', title: 'Help & Support', desc: 'FAQ, contact support', color: '#1565C0' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color={COLORS.white} />
          </View>
          <Text style={styles.name}>Welcome, Farmer</Text>
          <Text style={styles.phone}>+256 7XX XXX XXX</Text>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={16} color={COLORS.green} />
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.quickStat}>
            <Text style={[styles.quickVal, { color: COLORS.green }]}>0</Text>
            <Text style={styles.quickLabel}>Listings</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={[styles.quickVal, { color: COLORS.goldDark }]}>0</Text>
            <Text style={styles.quickLabel}>Passports</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={[styles.quickVal, { color: COLORS.green }]}>UGX 0</Text>
            <Text style={styles.quickLabel}>Earnings</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray300} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AGRICHAIN 360 v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { alignItems: 'center', paddingVertical: 32, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.charcoal },
  phone: { fontSize: 14, color: COLORS.gray500, marginTop: 4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 50, backgroundColor: COLORS.greenPale },
  editText: { fontSize: 13, fontWeight: '600', color: COLORS.green },
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.white, marginVertical: 16, marginHorizontal: 20, borderRadius: 20, paddingVertical: 20, ...SHADOWS.sm },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatDivider: { width: 1, backgroundColor: COLORS.gray200 },
  quickVal: { fontSize: 20, fontWeight: '800' },
  quickLabel: { fontSize: 11, color: COLORS.gray500, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuSection: { paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 10, ...SHADOWS.sm },
  menuIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: COLORS.charcoal },
  menuDesc: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 20, padding: 16, borderRadius: 16, backgroundColor: COLORS.redLight },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.red },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.gray400, marginTop: 20 },
});

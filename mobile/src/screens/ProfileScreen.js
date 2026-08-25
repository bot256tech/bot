import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SHADOWS } from '../utils/constants';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setProfile(await api.getProfile()); } catch (e) { setProfile(api.user); }
      setHealth(await api.health());
      setLoading(false);
    })();
  }, []);

  const deleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account, produce listings, quality passports and orders. This cannot be undone.\n\nType your password to confirm:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.request('/auth/delete-account', { method: 'POST', body: JSON.stringify({}) });
              await api.clearSession();
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (e) {
              Alert.alert('Could not delete', e.message);
            }
          }
        }
      ]
    );
  };

  const logout = () => {
    Alert.alert('Log out', 'End your session on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await api.logout();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  const user = profile || api.user || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user.name || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          {loading ? <ActivityIndicator color={COLORS.green} /> : (
            <>
              <Text style={styles.name}>{user.name || 'AGRICHAIN user'}</Text>
              <Text style={styles.phone}>{user.phone || ''}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user.role || 'USER'}</Text>
              </View>
            </>
          )}
        </View>

        {(user.role || '').toUpperCase() === 'FARMER' ? (
          <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('MyProduce')}>
            <View style={[styles.linkIcon, { backgroundColor: COLORS.greenPale }]}>
              <Ionicons name="leaf" size={19} color={COLORS.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>My Produce & Passports</Text>
              <Text style={styles.linkDesc}>Register batches, record quality, view passports</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={COLORS.gray300} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('Passport', {})}>
          <View style={[styles.linkIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="shield-checkmark" size={19} color="#1565C0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>Verify a Quality Passport</Text>
            <Text style={styles.linkDesc}>Check any batch by number</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={COLORS.gray300} />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>System</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Server</Text>
            <Text style={[styles.infoValue, { color: health && health.services && health.services.database === 'connected' ? COLORS.green : COLORS.goldDark }]}>
              {health && health.services ? `Online · database ${health.services.database}` : 'Checking…'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App version</Text>
            <Text style={styles.infoValue}>AGRICHAIN 360 v1.1.0</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Data</Text>
            <Text style={styles.infoValue}>Same database as the web platform</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logoutBtn, { marginTop: 8, borderColor: '#FFCDD2' }]} onPress={deleteAccount}>
          <Ionicons name="trash-outline" size={16} color={COLORS.red} />
          <Text style={[styles.logoutText, { fontSize: 12 }]}>Delete My Account</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { alignItems: 'center', paddingTop: 22, paddingBottom: 18 },
  avatar: { width: 78, height: 78, borderRadius: 26, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center', ...SHADOWS.md },
  avatarText: { fontSize: 30, fontWeight: '800', color: COLORS.white },
  name: { fontSize: 19, fontWeight: '800', color: COLORS.charcoal, marginTop: 12 },
  phone: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  roleBadge: { backgroundColor: COLORS.greenPale, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  roleText: { fontSize: 10.5, fontWeight: '800', color: COLORS.green, letterSpacing: 0.4 },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 16, padding: 15, marginBottom: 10, ...SHADOWS.sm },
  linkIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  linkTitle: { fontSize: 14.5, fontWeight: '700', color: COLORS.charcoal },
  linkDesc: { fontSize: 11.5, color: COLORS.gray500, marginTop: 2 },
  infoCard: { backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 16, padding: 16, marginTop: 6, ...SHADOWS.sm },
  infoTitle: { fontSize: 13, fontWeight: '700', color: COLORS.gray500, marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  infoLabel: { fontSize: 12.5, color: COLORS.gray500 },
  infoValue: { fontSize: 12.5, fontWeight: '700', color: COLORS.charcoal },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 14, paddingVertical: 14, marginTop: 14, borderWidth: 1, borderColor: '#FFCDD2' },
  logoutText: { fontSize: 14, fontWeight: '700', color: COLORS.red },
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SHADOWS } from '../utils/constants';

const ROLES = [
  { key: 'FARMER', label: 'Farmer', icon: 'leaf' },
  { key: 'BUYER', label: 'Buyer', icon: 'storefront' },
  { key: 'PARTNER', label: 'Partner', icon: 'business' },
];

const DISTRICTS = ['Mayuge', 'Bugiri', 'Iganga', 'Jinja', 'Kamuli', 'Other'];

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('+256');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('Mayuge');
  const [role, setRole] = useState('FARMER');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');
    if (!phone || phone.replace(/\D/g, '').length < 9) { setError('Enter a valid phone number (e.g. +256 7XX XXX XXX).'); return; }
    if (!isLogin) {
      const strong = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) &&
                     /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password);
      if (!strong) {
        setError('Password needs 8+ characters with an uppercase letter, a lowercase letter, a number and a special character.');
        return;
      }
    } else if (!password) { setError('Enter your password.'); return; }
    if (!isLogin && (!name || name.trim().length < 2)) { setError('Enter your full name.'); return; }

    setLoading(true);
    try {
      if (isLogin) {
        await api.login(phone.trim(), password);
      } else {
        await api.register({
          name: name.trim(),
          phone: phone.trim(),
          password,
          role,
          profile: role === 'FARMER' ? { district } : undefined
        });
      }
      navigation.replace('Main');
    } catch (e) {
      setError(e.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={34} color={COLORS.white} />
            </View>
            <Text style={styles.appName}>AGRICHAIN 360</Text>
            <Text style={styles.tagline}>Marketplace · Quality Passports · Advisory</Text>
          </View>

          <View style={styles.authCard}>
            <View style={styles.tabRow}>
              <TouchableOpacity style={[styles.tab, isLogin && styles.tabActive]} onPress={() => { setIsLogin(true); setError(''); }}>
                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, !isLogin && styles.tabActive]} onPress={() => { setIsLogin(false); setError(''); }}>
                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!isLogin ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full name</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={18} color={COLORS.gray400} />
                  <TextInput style={styles.input} placeholder="Your full name" value={name} onChangeText={setName} placeholderTextColor={COLORS.gray300} />
                </View>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone number</Text>
              <View style={styles.inputBox}>
                <Ionicons name="call-outline" size={18} color={COLORS.gray400} />
                <TextInput style={styles.input} placeholder="+256 7XX XXX XXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={COLORS.gray300} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.gray400} />
                <TextInput style={styles.input} placeholder={isLogin ? 'Your password' : 'Choose a password (min 6 characters)'} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={COLORS.gray300} />
              </View>
            </View>

            {!isLogin ? (
              <>
                <Text style={styles.label}>I am a…</Text>
                <View style={styles.roleRow}>
                  {ROLES.map((r) => (
                    <TouchableOpacity key={r.key} style={[styles.roleCard, role === r.key && styles.roleCardActive]} onPress={() => setRole(r.key)}>
                      <Ionicons name={r.icon} size={20} color={role === r.key ? COLORS.green : COLORS.gray400} />
                      <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>{r.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {role === 'FARMER' ? (
                  <View style={[styles.inputGroup, { marginTop: 14 }]}>
                    <Text style={styles.label}>District</Text>
                    <View style={styles.pickerBox}>
                      {DISTRICTS.map((d) => (
                        <TouchableOpacity key={d} style={[styles.pill, district === d && styles.pillActive]} onPress={() => setDistrict(d)}>
                          <Text style={[styles.pillText, district === d && styles.pillTextActive]}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null}
              </>
            ) : null}

            <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.authBtnText}>{isLogin ? 'Log In' : 'Create Account'}</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>
              The same account works on the website and this app — data is synchronized through one platform database.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { alignItems: 'center', paddingTop: 36, paddingBottom: 22 },
  logoCircle: { width: 76, height: 76, borderRadius: 26, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center', marginBottom: 14, ...SHADOWS.md },
  appName: { fontSize: 26, fontWeight: '800', color: COLORS.green },
  tagline: { fontSize: 12.5, color: COLORS.gray500, marginTop: 4 },
  authCard: { backgroundColor: COLORS.white, marginHorizontal: 18, borderRadius: 24, padding: 24, ...SHADOWS.lg },
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.gray50, borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.white, ...SHADOWS.sm },
  tabText: { fontSize: 13.5, fontWeight: '600', color: COLORS.gray400 },
  tabTextActive: { color: COLORS.green },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.redLight, borderRadius: 10, padding: 10, marginBottom: 16 },
  errorText: { flex: 1, fontSize: 12.5, color: COLORS.red, fontWeight: '500' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12.5, fontWeight: '600', color: COLORS.charcoal, marginBottom: 7 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray50, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.gray200 },
  input: { flex: 1, paddingVertical: 11, paddingHorizontal: 10, fontSize: 15, color: COLORS.charcoal },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleCard: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 12, borderWidth: 2, borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 },
  roleCardActive: { borderColor: COLORS.green, backgroundColor: COLORS.greenPale },
  roleLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray400, marginTop: 4 },
  roleLabelActive: { color: COLORS.green },
  pickerBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 },
  pillActive: { backgroundColor: COLORS.greenPale, borderColor: COLORS.green },
  pillText: { fontSize: 12.5, color: COLORS.gray500, fontWeight: '500' },
  pillTextActive: { color: COLORS.green, fontWeight: '700' },
  authBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, backgroundColor: COLORS.green, borderRadius: 14, marginTop: 14, ...SHADOWS.md },
  authBtnText: { fontSize: 15.5, fontWeight: '700', color: COLORS.white },
  note: { fontSize: 11, color: COLORS.gray400, textAlign: 'center', marginTop: 14, lineHeight: 15 },
});

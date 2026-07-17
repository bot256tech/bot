import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../utils/constants';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('+256');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [role, setRole] = useState('farmer');

  const handleAuth = () => {
    if (!phone || phone.length < 10) { Alert.alert('Error', 'Please enter a valid phone number'); return; }
    if (!password || password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    if (!isLogin && !name) { Alert.alert('Error', 'Please enter your name'); return; }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Main');
    }, 1500);
  };

  const roles = [
    { key: 'farmer', label: 'Farmer', icon: 'leaf' },
    { key: 'buyer', label: 'Buyer', icon: 'storefront' },
    { key: 'agent', label: 'Agent', icon: 'people' },
    { key: 'partner', label: 'Partner', icon: 'business' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={36} color={COLORS.white} />
            </View>
            <Text style={styles.appName}>AGRICHAIN 360</Text>
            <Text style={styles.tagline}>Smart Agriculture Platform</Text>
          </View>

          {/* Auth Card */}
          <View style={styles.authCard}>
            {/* Tab Toggle */}
            <View style={styles.tabRow}>
              <TouchableOpacity style={[styles.tab, isLogin && styles.tabActive]} onPress={() => setIsLogin(true)}>
                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, !isLogin && styles.tabActive]} onPress={() => setIsLogin(false)}>
                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Name (Sign Up only) */}
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={18} color={COLORS.gray400} />
                  <TextInput style={styles.input} placeholder="Your full name" value={name} onChangeText={setName} placeholderTextColor={COLORS.gray300} />
                </View>
              </View>
            )}

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputBox}>
                <Ionicons name="call-outline" size={18} color={COLORS.gray400} />
                <TextInput style={styles.input} placeholder="+256 7XX XXX XXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={COLORS.gray300} />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.gray400} />
                <TextInput style={styles.input} placeholder="Enter password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={COLORS.gray300} />
              </View>
            </View>

            {/* Role Selection (Sign Up only) */}
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>I am a...</Text>
                <View style={styles.roleGrid}>
                  {roles.map(r => (
                    <TouchableOpacity key={r.key} style={[styles.roleCard, role === r.key && styles.roleCardActive]} onPress={() => setRole(r.key)}>
                      <Ionicons name={r.icon} size={20} color={role === r.key ? COLORS.green : COLORS.gray400} />
                      <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>{r.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Auth Button */}
            <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading}>
              {loading ? (
                <Text style={styles.authBtnText}>Please wait...</Text>
              ) : (
                <>
                  <Text style={styles.authBtnText}>{isLogin ? 'Login' : 'Create Account'}</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>

            {!isLogin && (
              <Text style={styles.terms}>By signing up, you agree to our Terms of Service and Privacy Policy</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 24 },
  logoCircle: { width: 80, height: 80, borderRadius: 28, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center', marginBottom: 16, ...SHADOWS.md },
  appName: { fontSize: 28, fontWeight: '800', color: COLORS.green },
  tagline: { fontSize: 13, color: COLORS.gray500, marginTop: 4, letterSpacing: 0.5 },
  authCard: { backgroundColor: COLORS.white, marginHorizontal: 20, borderRadius: 28, padding: 28, ...SHADOWS.lg },
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.gray50, borderRadius: 14, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.white, ...SHADOWS.sm },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.gray400 },
  tabTextActive: { color: COLORS.green },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.charcoal, marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray50, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.gray200 },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: COLORS.charcoal },
  roleGrid: { flexDirection: 'row', gap: 10 },
  roleCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 },
  roleCardActive: { borderColor: COLORS.green, backgroundColor: COLORS.greenPale },
  roleLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray400, marginTop: 4 },
  roleLabelActive: { color: COLORS.green },
  authBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: COLORS.green, borderRadius: 16, marginTop: 8, ...SHADOWS.md },
  authBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  terms: { fontSize: 11, color: COLORS.gray400, textAlign: 'center', marginTop: 16, lineHeight: 16 },
});

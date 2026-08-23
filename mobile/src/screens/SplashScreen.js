import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SHADOWS } from '../utils/constants';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { token } = await api.restoreSession();
      if (!mounted) return;
      if (token) {
        // Verify the stored session is still valid against the backend
        try {
          await api.getProfile();
          navigation.replace('Main');
          return;
        } catch (e) {
          // token expired or server unreachable-for-auth → fall through to login
          await api.clearSession();
        }
      }
      navigation.replace('Login');
    })();
    return () => { mounted = false; };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoCircle}>
        <Ionicons name="leaf" size={40} color={COLORS.white} />
      </View>
      <Text style={styles.name}>AGRICHAIN 360</Text>
      <Text style={styles.tagline}>Post-harvest platform · Uganda</Text>
      <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 32 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  logoCircle: { width: 96, height: 96, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.14)', justifyContent: 'center', alignItems: 'center', ...SHADOWS.lg },
  name: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginTop: 20, letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
});

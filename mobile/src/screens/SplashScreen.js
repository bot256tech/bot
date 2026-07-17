import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      navigation.replace('Main');
    }, 2500);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconCircle}>
          <Ionicons name="leaf" size={56} color={COLORS.white} />
        </View>
        <Text style={styles.appName}>AGRICHAIN 360</Text>
        <Text style={styles.tagline}>Smart Agriculture Platform</Text>
        <View style={styles.loadingBar}>
          <Animated.View style={[styles.loadingFill, { width: '100%' }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  bgCircle1: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.05)' },
  bgCircle2: { position: 'absolute', bottom: -80, left: -80, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(212,175,55,0.08)' },
  content: { alignItems: 'center' },
  iconCircle: { width: 120, height: 120, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  appName: { fontSize: 32, fontWeight: '800', color: 'white', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8, letterSpacing: 1, textTransform: 'uppercase' },
  loadingBar: { width: 200, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 32, overflow: 'hidden' },
  loadingFill: { height: '100%', backgroundColor: '#D4AF37', borderRadius: 2 },
});

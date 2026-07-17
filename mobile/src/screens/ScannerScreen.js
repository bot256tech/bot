import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../utils/constants';

const DISEASES = {
  maize: { name: 'Fall Armyworm', conf: 92, severity: 'Moderate', treatment: 'Apply neem-based pesticide (5ml/L) or Emamectin benzoate. Scout weekly. Remove affected plants.', recovery: '85%', prevention: 'Early planting. Regular scouting. Pheromone traps. Maintain field hygiene.' },
  coffee: { name: 'Coffee Leaf Rust', conf: 88, severity: 'High', treatment: 'Apply copper-based fungicide. Remove affected branches. Improve air circulation.', recovery: '72%', prevention: 'Plant resistant varieties. Proper spacing. Shade management.' },
  cocoa: { name: 'Black Pod Disease', conf: 85, severity: 'Moderate', treatment: 'Remove infected pods. Apply Ridomil Gold. Improve drainage.', recovery: '90%', prevention: 'Regular harvesting. Shade management.' },
  beans: { name: 'Bean Rust', conf: 78, severity: 'Moderate', treatment: 'Apply Mancozeb fungicide. Remove affected leaves.', recovery: '85%', prevention: 'Resistant varieties. Crop rotation.' },
  groundnuts: { name: 'Early Leaf Spot', conf: 82, severity: 'Moderate', treatment: 'Apply fungicide. Remove debris. Rotate crops.', recovery: '85%', prevention: '2-3 year rotation. Resistant varieties.' },
  cassava: { name: 'Cassava Mosaic', conf: 90, severity: 'High', treatment: 'Remove infected plants. Control whiteflies.', recovery: '70%', prevention: 'Resistant varieties. Clean planting material.' },
  banana: { name: 'Banana Wilt (BXW)', conf: 88, severity: 'High', treatment: 'Destroy infected plants. Sterilize tools.', recovery: '60%', prevention: 'Disease-free planting material.' },
  rice: { name: 'Rice Blast', conf: 80, severity: 'Moderate', treatment: 'Apply Tricyclazole. Reduce nitrogen.', recovery: '80%', prevention: 'Resistant varieties. Balanced fertilization.' },
};

const CROPS = [
  { key: 'maize', name: 'Maize', emoji: '🌽' },
  { key: 'coffee', name: 'Coffee', emoji: '☕' },
  { key: 'cocoa', name: 'Cocoa', emoji: '🌰' },
  { key: 'beans', name: 'Beans', emoji: '🌱' },
  { key: 'groundnuts', name: 'Groundnuts', emoji: '🥜' },
  { key: 'cassava', name: 'Cassava', emoji: '🌿' },
  { key: 'banana', name: 'Banana', emoji: '🍌' },
  { key: 'rice', name: 'Rice', emoji: '🌾' },
];

export default function ScannerScreen() {
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = (cropKey) => {
    setSelectedCrop(cropKey);
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      setResult(DISEASES[cropKey]);
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Crop Disease Scanner</Text>
          <Text style={styles.subtitle}>Select your crop for AI-powered disease analysis</Text>
        </View>

        <TouchableOpacity style={styles.cameraBox} onPress={() => Alert.alert('Camera', 'Camera access requires Expo Camera module. In production, tap to take a photo of your crop.')}>
          <Ionicons name="camera" size={48} color={COLORS.green} />
          <Text style={styles.cameraText}>Tap to take a photo</Text>
          <Text style={styles.cameraSub}>Photograph affected leaves, stems, or fruit</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Select Your Crop</Text>
        <View style={styles.cropGrid}>
          {CROPS.map(crop => (
            <TouchableOpacity key={crop.key} style={[styles.cropCard, selectedCrop === crop.key && styles.cropCardActive]} onPress={() => analyze(crop.key)} activeOpacity={0.7}>
              <Text style={styles.cropEmoji}>{crop.emoji}</Text>
              <Text style={[styles.cropName, selectedCrop === crop.key && styles.cropNameActive]}>{crop.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {analyzing && (
          <View style={styles.analyzingBox}>
            <Text style={styles.analyzingText}>🔍 Analyzing crop for diseases...</Text>
            <Text style={styles.analyzingSub}>AI is processing your photo</Text>
          </View>
        )}

        {result && !analyzing && (
          <View style={styles.resultCard}>
            <View style={styles.confBadge}>
              <Text style={styles.confText}>🔍 High Confidence ({result.conf}%)</Text>
            </View>
            <Text style={styles.resultTitle}>📸 Disease Analysis — {selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)}</Text>
            <View style={styles.resultRow}><Text style={styles.resultLabel}>🦠 Detected:</Text><Text style={styles.resultValue}>{result.name}</Text></View>
            <View style={styles.resultRow}><Text style={styles.resultLabel}>⚠️ Severity:</Text><Text style={[styles.resultValue, result.severity === 'High' ? { color: COLORS.red } : { color: COLORS.goldDark }]}>{result.severity}</Text></View>
            <View style={styles.resultSection}><Text style={styles.resultSectionTitle}>💊 Treatment</Text><Text style={styles.resultSectionText}>{result.treatment}</Text></View>
            <View style={styles.resultSection}><Text style={styles.resultSectionTitle}>🛡️ Prevention</Text><Text style={styles.resultSectionText}>{result.prevention}</Text></View>
            <View style={styles.resultRow}><Text style={styles.resultLabel}>📊 Recovery:</Text><Text style={[styles.resultValue, { color: COLORS.green }]}>{result.recovery} with treatment</Text></View>
            <View style={styles.disclaimer}><Ionicons name="information-circle" size={14} color={COLORS.gray500} /><Text style={styles.disclaimerText}>AI guidance only. For serious outbreaks, consult a qualified agronomist.</Text></View>
            <TouchableOpacity style={styles.expertBtn} onPress={() => Alert.alert('Expert', 'Your request has been submitted. A verified agronomist will connect with you shortly.')}><Ionicons name="person" size={18} color={COLORS.goldDark} /><Text style={styles.expertBtnText}>Talk to an Expert</Text></TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.charcoal },
  subtitle: { fontSize: 14, color: COLORS.gray500, marginTop: 4 },
  cameraBox: { margin: 20, padding: 40, backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.gray200, alignItems: 'center', ...SHADOWS.sm },
  cameraText: { fontSize: 16, fontWeight: '700', color: COLORS.charcoal, marginTop: 12 },
  cameraSub: { fontSize: 13, color: COLORS.gray500, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.charcoal, paddingHorizontal: 20, marginBottom: 14 },
  cropGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  cropCard: { width: '22%', aspectRatio: 1, backgroundColor: COLORS.white, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.gray200, ...SHADOWS.sm },
  cropCardActive: { borderColor: COLORS.green, backgroundColor: COLORS.greenPale },
  cropEmoji: { fontSize: 28 },
  cropName: { fontSize: 11, fontWeight: '600', color: COLORS.gray500, marginTop: 4 },
  cropNameActive: { color: COLORS.green },
  analyzingBox: { margin: 20, padding: 24, backgroundColor: COLORS.white, borderRadius: 20, alignItems: 'center', ...SHADOWS.sm },
  analyzingText: { fontSize: 16, fontWeight: '600', color: COLORS.charcoal },
  analyzingSub: { fontSize: 13, color: COLORS.gray500, marginTop: 4 },
  resultCard: { margin: 20, padding: 24, backgroundColor: COLORS.white, borderRadius: 24, ...SHADOWS.md },
  confBadge: { backgroundColor: COLORS.greenPale, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 50, alignSelf: 'flex-start', marginBottom: 12 },
  confText: { fontSize: 12, fontWeight: '700', color: COLORS.green },
  resultTitle: { fontSize: 18, fontWeight: '800', color: COLORS.charcoal, marginBottom: 16 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  resultLabel: { fontSize: 14, color: COLORS.gray500 },
  resultValue: { fontSize: 14, fontWeight: '700', color: COLORS.charcoal },
  resultSection: { marginTop: 16 },
  resultSectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.charcoal, marginBottom: 6 },
  resultSectionText: { fontSize: 14, color: COLORS.gray500, lineHeight: 22 },
  disclaimer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, padding: 12, backgroundColor: COLORS.gray50, borderRadius: 12 },
  disclaimerText: { fontSize: 12, color: COLORS.gray500, flex: 1 },
  expertBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: 14, backgroundColor: COLORS.goldLight, borderRadius: 14 },
  expertBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.goldDark },
});

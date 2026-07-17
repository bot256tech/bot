import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../utils/constants';

const SUGGESTIONS = [
  { icon: 'leaf-outline', text: 'What should I plant this season?' },
  { icon: 'trending-up-outline', text: 'What are current market prices?' },
  { icon: 'camera-outline', text: 'Scan crop disease' },
  { icon: 'sunny-outline', text: 'How much does solar drying cost?' },
  { icon: 'document-text-outline', text: 'Tell me about quality passports' },
  { icon: 'cloud-outline', text: 'Weather forecast for my area' },
];

const WELCOME_MSG = {
  text: "👋 Hello! I'm AgriIntel AI — your personal agricultural advisor.\n\nI can help you with crop production, disease identification, market prices, drying & storage, quality standards, and weather impact.\n\nTap a topic below or type your question.",
  isBot: true,
};

export default function AIAdvisorScreen() {
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const sendMessage = async (text) => {
    const q = text || input.trim();
    if (!q || loading) return;

    // Add user message
    setMessages(prev => [...prev, { text: q, isBot: false }]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const response = getAIResponse(q.toLowerCase());
      setMessages(prev => [...prev, { text: response, isBot: true }]);
      setLoading(false);
    }, 1200);
  };

  const getAIResponse = (q) => {
    if (q.includes('harvest') || q.includes('when to'))
      return '🌾 Harvest Advisory — Mayuge District\n\nCurrent: 28°C, 65% humidity.\n\n📋 Recommendations:\n• Harvest maize at 18-22% moisture\n• Schedule solar drying within 48 hours\n• Cost: UGX 200/kg for maize\n• Target: ≤13% for Grade A\n\n💡 Book your drying slot now →';
    if (q.includes('disease') || q.includes('pest'))
      return '🦠 Crop Health — Mayuge\n\n• Fall armyworm: LOW risk\n• Maize streak virus: LOW risk\n• Aflatoxin: MONITOR\n\n📸 Upload a photo for AI disease analysis.';
    if (q.includes('market') || q.includes('price'))
      return '📈 Current Prices:\n• Maize (A): UGX 1,500–1,800/kg\n• Coffee: UGX 8,000–12,000/kg\n• Groundnuts: UGX 3,200–3,500/kg\n• Beans: UGX 2,800–3,200/kg\n\nCertified produce earns 20-40% premium.';
    if (q.includes('dry') || q.includes('cost'))
      return '☀️ Drying Costs:\n• Maize/Rice: UGX 200/kg\n• Beans: UGX 250/kg\n• Groundnuts: UGX 350/kg\n• Coffee: UGX 400/kg\n• Cocoa: UGX 500/kg\n\n6-12 hours. Target: 13% moisture.';
    if (q.includes('quality') || q.includes('passport'))
      return '📜 Quality Passport includes:\n• Crop type & variety\n• GPS-verified farmer identity\n• Moisture & aflatoxin results\n• Quality grade (A/B/C)\n• QR code for verification\n\nExporters pay 20-40% premium for certified produce.';
    if (q.includes('weather') || q.includes('rain'))
      return '🌤️ Mayuge Weather:\n• 28°C, Partly cloudy\n• Humidity: 65%\n• Rain: 30% (24h)\n\nDrying: GOOD • Disease: LOW';
    if (q.includes('plant') || q.includes('season'))
      return '🌱 Planting — Mayuge:\n• Maize — plant within 2 weeks\n• Beans — intercrop with maize\n• Groundnuts — good rotation\n\n3.5 acres maize: 87.5kg seed, 175kg DAP, 105kg Urea';
    return '🌾 I can help with:\n\n🌽 Crop production advice\n🦠 Disease identification\n📈 Market prices\n☀️ Drying & storage\n📜 Quality certification\n🌤️ Weather impact\n\nAsk me anything!';
  };

  const renderMessage = ({ item, index }) => (
    <View style={[styles.msgRow, item.isBot ? styles.botRow : styles.userRow]}>
      {item.isBot && (
        <View style={styles.botAvatar}>
          <Ionicons name="leaf" size={16} color={COLORS.green} />
        </View>
      )}
      <View style={{ maxWidth: '80%' }}>
        {item.isBot && (
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>🤖 AI Advice</Text>
          </View>
        )}
        <View style={[styles.bubble, item.isBot ? styles.botBubble : styles.userBubble]}>
          <Text style={[styles.msgText, item.isBot ? styles.botText : styles.userText]}>{item.text}</Text>
        </View>
      </View>
      {!item.isBot && (
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={14} color={COLORS.white} />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={20} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AgriIntel AI</Text>
            <View style={styles.statusRow}>
              <View style={styles.liveDot} />
              <Text style={styles.statusText}>Online — 24/7 farming companion</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={loading ? (
            <View style={styles.typingRow}>
              <View style={styles.botAvatar}>
                <Ionicons name="leaf" size={16} color={COLORS.green} />
              </View>
              <View style={styles.typingBubble}>
                <View style={styles.dot} />
                <View style={[styles.dot, { animationDelay: '0.2s' }]} />
                <View style={[styles.dot, { animationDelay: '0.4s' }]} />
              </View>
            </View>
          ) : null}
        />

        {/* Suggestions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestRow}>
          {SUGGESTIONS.map((s, i) => (
            <TouchableOpacity key={i} style={styles.suggestChip} onPress={() => sendMessage(s.text)}>
              <Ionicons name={s.icon} size={14} color={COLORS.green} />
              <Text style={styles.suggestText} numberOfLines={1}>{s.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Ask about crops, markets, diseases..."
            value={input}
            onChangeText={setInput}
            placeholderTextColor={COLORS.gray300}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage()} disabled={loading}>
            <Ionicons name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray200, backgroundColor: COLORS.white },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.charcoal },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.greenLight },
  statusText: { fontSize: 12, color: COLORS.gray500 },
  msgRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  botRow: { flexDirection: 'row' },
  userRow: { flexDirection: 'row-reverse' },
  botAvatar: { width: 32, height: 32, borderRadius: 12, backgroundColor: COLORS.greenPale, justifyContent: 'center', alignItems: 'center' },
  userAvatar: { width: 32, height: 32, borderRadius: 12, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center' },
  aiBadge: { backgroundColor: COLORS.greenPale, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 50, alignSelf: 'flex-start', marginBottom: 6 },
  aiBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.green },
  bubble: { padding: 16, borderRadius: 18 },
  botBubble: { backgroundColor: COLORS.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.gray200 },
  userBubble: { backgroundColor: COLORS.green, borderBottomRightRadius: 4 },
  msgText: { fontSize: 14, lineHeight: 22 },
  botText: { color: COLORS.charcoal },
  userText: { color: COLORS.white },
  typingRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typingBubble: { flexDirection: 'row', gap: 5, backgroundColor: COLORS.white, padding: 16, borderRadius: 18, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.gray200 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.gray300 },
  suggestRow: { paddingLeft: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.gray100, backgroundColor: COLORS.white },
  suggestChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.gray50, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, marginRight: 8, borderWidth: 1, borderColor: COLORS.gray200, maxWidth: 200 },
  suggestText: { fontSize: 12, fontWeight: '500', color: COLORS.gray500, flexShrink: 1 },
  inputArea: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray200, gap: 10 },
  input: { flex: 1, backgroundColor: COLORS.gray50, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, fontSize: 15, color: COLORS.charcoal, borderWidth: 1, borderColor: COLORS.gray200 },
  sendBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center' },
});

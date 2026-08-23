import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SHADOWS } from '../utils/constants';

export default function AIAdvisorScreen() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello. I am the AGRICHAIN Decision Advisor — a rules-based engine that answers from your stored platform records. Ask me about listing readiness, market prices, drying costs, quality grades or disease risk.' }
  ]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    api.getSuggestions()
      .then((r) => setSuggestions((r.data || []).map((s) => s.q).slice(0, 4)))
      .catch(() => setSuggestions(['Can I list this coffee for sale?', 'What are current market prices?', 'How much does solar drying cost?']));
  }, []);

  const stripHtml = (html) => String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(strong|b)>/gi, '')
    .replace(/<(strong|b)>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();

  const send = async (question) => {
    const q = (question !== undefined ? question : input).trim();
    if (!q || sending) return;

    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setSending(true);
    setTimeout(() => { try { listRef.current && listRef.current.scrollToEnd({ animated: true }); } catch (e) {} }, 100);

    try {
      const r = await api.askAdvisor(q);
      const answer = r.data && r.data.answer ? stripHtml(r.data.answer) : 'I could not process that question. Please try rephrasing it.';
      setMessages((m) => [...m, { role: 'bot', text: answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'bot', text: 'The advisor service is unavailable right now (' + (e.message || 'network error') + '). The rest of the app still works — try again in a moment.', error: true }]);
    } finally {
      setSending(false);
      setTimeout(() => { try { listRef.current && listRef.current.scrollToEnd({ animated: true }); } catch (e) {} }, 100);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.msgRow, item.role === 'user' ? styles.msgRowUser : styles.msgRowBot]}>
      <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : (item.error ? styles.bubbleError : styles.bubbleBot)]}>
        <Text style={item.role === 'user' ? styles.bubbleUserText : styles.bubbleText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="analytics" size={18} color={COLORS.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Decision Advisor</Text>
          <Text style={styles.headerSub}>Answers from your stored platform records — no external AI service required</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12 }}
        onContentSizeChange={() => { try { listRef.current && listRef.current.scrollToEnd({ animated: true }); } catch (e) {} }}
      />

      {sending ? (
        <View style={[styles.msgRow, styles.msgRowBot]}>
          <View style={[styles.bubble, styles.bubbleBot, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
            <ActivityIndicator size="small" color={COLORS.green} />
            <Text style={styles.bubbleText}>Checking your records…</Text>
          </View>
        </View>
      ) : null}

      {suggestions.length ? (
        <View style={styles.suggestionRow}>
          {suggestions.map((s) => (
            <TouchableOpacity key={s} style={styles.suggestion} onPress={() => send(s)}>
              <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask about your batches, prices, quality…"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            returnKeyType="send"
            multiline={false}
            placeholderTextColor={COLORS.gray300}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => send()} disabled={sending || !input.trim()}>
            {sending ? <ActivityIndicator color={COLORS.white} size="small" /> : <Ionicons name="arrow-up" size={20} color={input.trim() ? COLORS.white : COLORS.gray300} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  headerIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.charcoal },
  headerSub: { fontSize: 10.5, color: COLORS.gray500, marginTop: 1 },
  msgRow: { flexDirection: 'row', marginBottom: 10 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 12 },
  bubbleBot: { backgroundColor: COLORS.white, ...SHADOWS.sm },
  bubbleUser: { backgroundColor: COLORS.green },
  bubbleError: { backgroundColor: '#FFF8E1' },
  bubbleText: { fontSize: 13.5, color: COLORS.charcoal, lineHeight: 19 },
  bubbleUserText: { fontSize: 13.5, color: COLORS.white, lineHeight: 19, fontWeight: '600' },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 8 },
  suggestion: { backgroundColor: COLORS.greenPale, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(27,94,32,0.15)' },
  suggestionText: { fontSize: 11.5, color: COLORS.green, fontWeight: '600', maxWidth: 180 },
  inputRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  input: { flex: 1, backgroundColor: COLORS.gray50, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.charcoal, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center' },
});

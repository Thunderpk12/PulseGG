import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useAuthStore } from '../store/authStore';
import { useQuestStore } from '../store/questStore';
import { usePlayerStore } from '../store/playerStore';
import { defaultXpReward, defaultCoinReward } from '../utils/gamification';
import { scheduleHabitReminder } from '../utils/notificationService';

const CATEGORIES = ['Health', 'Study', 'Exercise', 'Work', 'Wellness', 'Hygiene', 'Sleep', 'Custom'];
const DIFFICULTIES = [
  { value: 'easy',   label: 'Easy',   icon: '💧', color: Colors.tertiary,  bg: Colors.tertiaryContainer + '33'  },
  { value: 'medium', label: 'Medium', icon: '📖', color: Colors.secondary, bg: Colors.secondaryContainer + '33' },
  { value: 'hard',   label: 'Hard',   icon: '🏋️', color: Colors.error,     bg: Colors.errorContainer + '33'     },
];
const FREQUENCIES = [
  { value: 'daily',  label: 'Daily',  icon: '📅' },
  { value: 'weekly', label: 'Weekly', icon: '🗓️' },
];

export default function NewQuestModal() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createQuest } = useQuestStore();
  const { loadProfile } = usePlayerStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Health');
  const [difficulty, setDifficulty] = useState('easy');
  const [frequency, setFrequency] = useState('daily');
  const [reminderTime, setReminderTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [reminderFocused, setReminderFocused] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please give your quest a name.');
      return;
    }
    if (!user?.id) return;

    setLoading(true);
    const success = await createQuest(user.id, {
      name: name.trim(),
      category,
      difficulty,
      frequency,
      xp_reward: defaultXpReward(difficulty),
      coin_reward: defaultCoinReward(difficulty),
      reminder_time: reminderTime || undefined,
    });

    if (success && reminderTime) {
      await scheduleHabitReminder(name.trim(), reminderTime);
    }

    if (success && user.id) {
      await loadProfile(user.id);
    }

    setLoading(false);
    if (success) {
      router.back();
    } else {
      Alert.alert('Error', 'Failed to create quest. Please try again.');
    }
  };

  const selectedDiff = DIFFICULTIES.find(d => d.value === difficulty)!;
  const xpPreview = defaultXpReward(difficulty);
  const gpPreview = defaultCoinReward(difficulty);

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      {/* ── TITLE BAR ──────────────────────────────── */}
      <View style={s.titleBar}>
        <View>
          <Text style={s.titleText}>New Quest</Text>
          <Text style={s.titleSub}>What will you conquer today?</Text>
        </View>
        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={s.cancelText}>✕ Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── QUEST NAME ────────────────────────────── */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>📝  QUEST NAME</Text>
          <TextInput
            style={[s.textInput, nameFocused && s.textInputFocused]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Drink 2L of water"
            placeholderTextColor={Colors.outline}
            maxLength={80}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
          />
        </View>

        {/* ── CATEGORY ──────────────────────────────── */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>🏷️  CATEGORY</Text>
          <View style={s.pillWrap}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.pill, category === c && s.pillActive]}
                onPress={() => setCategory(c)}
                activeOpacity={0.8}
              >
                <Text style={[s.pillText, category === c && s.pillTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── DIFFICULTY ────────────────────────────── */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>⚔️  DIFFICULTY</Text>
          <View style={s.diffRow}>
            {DIFFICULTIES.map(d => (
              <TouchableOpacity
                key={d.value}
                style={[
                  s.diffCard,
                  difficulty === d.value && { borderColor: d.color, backgroundColor: d.bg },
                ]}
                onPress={() => setDifficulty(d.value)}
                activeOpacity={0.85}
              >
                <Text style={s.diffIcon}>{d.icon}</Text>
                <Text style={[s.diffLabel, difficulty === d.value && { color: d.color }]}>
                  {d.label}
                </Text>
                {difficulty === d.value && (
                  <View style={[s.diffSelected, { backgroundColor: d.color }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── REWARD PREVIEW ────────────────────────── */}
        <View style={s.rewardCard}>
          <Text style={s.rewardTitle}>⚡ Rewards on Completion</Text>
          <View style={s.rewardRow}>
            <View style={s.rewardItem}>
              <Text style={s.rewardIcon}>⭐</Text>
              <Text style={s.rewardAmount}>{xpPreview}</Text>
              <Text style={s.rewardSub}>XP</Text>
            </View>
            <View style={s.rewardDivider} />
            <View style={s.rewardItem}>
              <Text style={s.rewardIcon}>🪙</Text>
              <Text style={s.rewardAmount}>{gpPreview}</Text>
              <Text style={s.rewardSub}>GP</Text>
            </View>
            <View style={s.rewardDivider} />
            <View style={s.rewardItem}>
              <Text style={s.rewardIcon}>{selectedDiff.icon}</Text>
              <Text style={[s.rewardAmount, { color: selectedDiff.color }]}>{selectedDiff.label}</Text>
              <Text style={s.rewardSub}>Difficulty</Text>
            </View>
          </View>
        </View>

        {/* ── FREQUENCY ─────────────────────────────── */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>🔁  FREQUENCY</Text>
          <View style={s.freqRow}>
            {FREQUENCIES.map(f => (
              <TouchableOpacity
                key={f.value}
                style={[s.freqCard, frequency === f.value && s.freqCardActive]}
                onPress={() => setFrequency(f.value)}
                activeOpacity={0.85}
              >
                <Text style={s.freqIcon}>{f.icon}</Text>
                <Text style={[s.freqLabel, frequency === f.value && s.freqLabelActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── REMINDER ──────────────────────────────── */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>⏰  REMINDER TIME (optional, 24h HH:MM)</Text>
          <TextInput
            style={[s.textInput, reminderFocused && s.textInputFocused]}
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="e.g. 08:00"
            placeholderTextColor={Colors.outline}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            onFocus={() => setReminderFocused(true)}
            onBlur={() => setReminderFocused(false)}
          />
        </View>
      </ScrollView>

      {/* ── CREATE BUTTON ──────────────────────────── */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.createBtn, loading && s.createBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <Text style={s.createBtnText}>CREATE QUEST</Text>
              <Text style={{ fontSize: 18 }}>⚔️</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },

  titleBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 4, borderBottomColor: Colors.surfaceContainerLow,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
  },
  titleText: { fontFamily: 'FredokaOne_400Regular', fontSize: 26, color: Colors.onSurface },
  titleSub:  { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  cancelBtn: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 2, borderColor: Colors.surfaceVariant,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  cancelText: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: Colors.onSurfaceVariant },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },

  fieldGroup: { marginBottom: 24 },
  fieldLabel: {
    fontFamily: 'BeVietnamPro_700Bold', fontSize: 10,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5,
    textTransform: 'uppercase', marginBottom: 10,
  },

  textInput: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 4, borderColor: Colors.surfaceContainerHighest,
    borderRadius: 10, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontFamily: 'BeVietnamPro_400Regular', fontSize: 15, color: Colors.onSurface,
  },
  textInputFocused: { borderColor: Colors.primaryContainer },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 99, borderWidth: 2, borderColor: Colors.surfaceVariant,
  },
  pillActive: { backgroundColor: Colors.primaryContainer, borderColor: Colors.onPrimaryFixedVariant },
  pillText: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: Colors.onSurfaceVariant },
  pillTextActive: { color: Colors.primary },

  diffRow: { flexDirection: 'row', gap: 10 },
  diffCard: {
    flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14, borderWidth: 2, borderColor: Colors.surfaceVariant,
    position: 'relative', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 2,
  },
  diffIcon:     { fontSize: 28, marginBottom: 6 },
  diffLabel:    { fontFamily: 'FredokaOne_400Regular', fontSize: 14, color: Colors.onSurfaceVariant },
  diffSelected: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 },

  rewardCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14, borderWidth: 2, borderColor: Colors.surfaceVariant,
    padding: 18, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 3,
  },
  rewardTitle: { fontFamily: 'FredokaOne_400Regular', fontSize: 16, color: Colors.onSurface, marginBottom: 16 },
  rewardRow:   { flexDirection: 'row', alignItems: 'center' },
  rewardItem:  { flex: 1, alignItems: 'center', gap: 4 },
  rewardIcon:  { fontSize: 24 },
  rewardAmount: { fontFamily: 'FredokaOne_400Regular', fontSize: 20, color: Colors.onSurface },
  rewardSub:   { fontFamily: 'BeVietnamPro_700Bold', fontSize: 9, color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  rewardDivider: { width: 2, height: 48, backgroundColor: Colors.surfaceVariant },

  freqRow: { flexDirection: 'row', gap: 10 },
  freqCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12, borderWidth: 2, borderColor: Colors.surfaceVariant,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 2,
  },
  freqCardActive: { backgroundColor: Colors.primaryContainer, borderColor: Colors.onPrimaryFixedVariant },
  freqIcon:  { fontSize: 20 },
  freqLabel: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 14, color: Colors.onSurfaceVariant },
  freqLabelActive: { color: Colors.primary },

  footer: {
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 4, borderTopColor: Colors.surfaceContainerLow,
  },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 12, paddingVertical: 16,
    borderWidth: 2, borderColor: Colors.onPrimaryFixed,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 5,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16,
    color: Colors.primary, letterSpacing: 1, textTransform: 'uppercase',
  },
});

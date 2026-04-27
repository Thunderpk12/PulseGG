import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuestStore } from '../../store/questStore';
import { usePlayerStore } from '../../store/playerStore';
import { useAuthStore } from '../../store/authStore';
import { useBossStore } from '../../store/bossStore';
import { Colors } from '../../constants/Colors';
import { Habit } from '../../utils/habitService';
import QuestCompleteToast from '../../components/QuestCompleteToast';

type Filter = 'all' | 'active' | 'completed';

const RARITY = {
  easy:   { label: 'COMMON', color: Colors.tertiary,   border: Colors.tertiaryContainer  },
  medium: { label: 'RARE',   color: Colors.primary,    border: Colors.primaryContainer   },
  hard:   { label: 'EPIC',   color: Colors.secondary,  border: Colors.secondaryContainer },
};

const DIFF_ICONS: Record<string, string> = {
  easy: '💧', medium: '📖', hard: '🏋️',
};

export default function QuestsScreen() {
  const { user } = useAuthStore();
  const { profile } = usePlayerStore();
  const { boss } = useBossStore();
  const { habits, isLoading, loadTodayHabits, completeQuest } = useQuestStore();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [toast, setToast] = useState<{ visible: boolean; xp: number; gp: number }>({ visible: false, xp: 0, gp: 0 });

  useEffect(() => {
    if (user?.id) loadTodayHabits(user.id);
  }, [user?.id]);

  const handleComplete = async (habitId: string) => {
    if (!user?.id || !profile) return;
    const habit = habits.find(h => h.id === habitId);
    await completeQuest(habitId, user.id, profile, boss?.id ?? null);
    // loadProfile + level-up detection handled inside questStore.completeQuest
    if (habit) {
      setToast({ visible: true, xp: habit.xp_reward, gp: habit.coin_reward });
    }
  };

  const handleEdit = (habit: Habit) => {
    router.push({
      pathname: '/edit-quest',
      params: {
        id: habit.id,
        name: habit.name,
        category: habit.category,
        difficulty: habit.difficulty,
        frequency: habit.frequency,
        reminder_time: habit.reminder_time ?? '',
      },
    } as any);
  };

  const filtered = habits.filter((h) => {
    if (filter === 'active') return !h.isCompletedToday;
    if (filter === 'completed') return h.isCompletedToday;
    return true;
  });

  const completed = habits.filter(h => h.isCompletedToday).length;
  const total = habits.length;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* ── QUEST COMPLETE TOAST ─────────────────────── */}
      <QuestCompleteToast
        visible={toast.visible}
        xp={toast.xp}
        gp={toast.gp}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
      {/* ── HEADER ─────────────────────────────────── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>My Quests</Text>
          <Text style={s.headerSub}>{completed}/{total} completed today · Hold to edit</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => router.push({ pathname: '/new-quest' } as any)}
          activeOpacity={0.85}
        >
          <Text style={s.addBtnText}>＋ NEW</Text>
        </TouchableOpacity>
      </View>

      {/* ── PROGRESS BAR ───────────────────────────── */}
      {total > 0 && (
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${Math.round((completed / total) * 100)}%` }]} />
          </View>
          <Text style={s.progressLabel}>{Math.round((completed / total) * 100)}%</Text>
        </View>
      )}

      {/* ── FILTER PILLS ────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.filterContent}
      >
        {(['all', 'active', 'completed'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterPill, filter === f && s.filterPillActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[s.filterPillText, filter === f && s.filterPillTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'active' && habits.filter(h => !h.isCompletedToday).length > 0
                ? ` (${habits.filter(h => !h.isCompletedToday).length})`
                : ''}
              {f === 'completed' && completed > 0 ? ` (${completed})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── QUEST LIST ──────────────────────────────── */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => user?.id && loadTodayHabits(user.id)}
            tintColor={Colors.primaryContainer}
          />
        }
      >
        {isLoading && filtered.length === 0 ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primaryContainer} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🗺️</Text>
            <Text style={s.emptyTitle}>
              {filter === 'completed' ? 'No completed quests' : 'No quests here'}
            </Text>
            <Text style={s.emptySub}>
              {filter === 'completed'
                ? 'Complete some habits to see them here.'
                : filter === 'active'
                ? 'All quests are done for today! 🎉'
                : 'Tap NEW to create your first quest!'}
            </Text>
          </View>
        ) : (
          filtered.map((habit) => {
            const diff = habit.difficulty.toLowerCase() as keyof typeof RARITY;
            const rarity = RARITY[diff] ?? RARITY.easy;
            const icon = DIFF_ICONS[diff] ?? '⭐';
            return (
              <TouchableOpacity
                key={habit.id}
                onLongPress={() => handleEdit(habit)}
                delayLongPress={400}
                activeOpacity={1}
              >
                <View style={[s.cardOuter, habit.isCompletedToday && s.cardOuterDone]}>
                  <View style={[s.cardInner, habit.isCompletedToday && s.cardInnerDone]}>
                    {/* Icon box */}
                    <View style={s.cardIconBox}>
                      <Text style={s.cardIconText}>{icon}</Text>
                    </View>

                    {/* Info */}
                    <View style={s.cardInfo}>
                      <View style={s.nameRow}>
                        <Text style={[s.cardName, habit.isCompletedToday && s.cardNameDone]} numberOfLines={1}>
                          {habit.name}
                        </Text>
                        <View style={[s.rarityBadge, { borderColor: rarity.border + '55' }]}>
                          <Text style={[s.rarityText, { color: rarity.color }]}>{rarity.label}</Text>
                        </View>
                      </View>
                      <Text style={s.cardSub} numberOfLines={1}>
                        {habit.category} · {habit.difficulty}
                      </Text>
                      <View style={s.rewardsRow}>
                        <View style={s.xpBadge}>
                          <Text style={s.xpBadgeText}>+{habit.xp_reward} XP</Text>
                        </View>
                        <View style={s.gpBadge}>
                          <Text style={s.gpBadgeText}>+{habit.coin_reward} GP</Text>
                        </View>
                      </View>
                    </View>

                    {/* Check */}
                    {habit.isCompletedToday ? (
                      <View style={s.doneCircle}>
                        <Text style={s.doneCheck}>✓</Text>
                      </View>
                    ) : (
                      <BounceCheckBtn onPress={() => handleComplete(habit.id)} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── BounceCheckBtn ───────────────────────────────────────────────────────────
function BounceCheckBtn({ onPress }: { onPress: () => void }) {
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    bounceAnim.setValue(1);
    Animated.sequence([
      Animated.spring(bounceAnim, { toValue: 0.7, useNativeDriver: true, tension: 300, friction: 5 }),
      Animated.spring(bounceAnim, { toValue: 1.3, useNativeDriver: true, tension: 300, friction: 5 }),
      Animated.spring(bounceAnim, { toValue: 1,   useNativeDriver: true, tension: 200, friction: 6 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
      <TouchableOpacity style={s.checkBtn} onPress={handlePress} activeOpacity={0.75}>
        <Text style={s.checkBtnText}>✓</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 4, borderBottomColor: Colors.surfaceContainerLow,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
  },
  headerTitle: {
    fontFamily: 'FredokaOne_400Regular', fontSize: 26, color: Colors.onSurface,
  },
  headerSub: {
    fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2,
  },
  addBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, borderWidth: 2, borderColor: Colors.onPrimaryFixedVariant,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
  },
  addBtnText: {
    fontFamily: 'FredokaOne_400Regular', fontSize: 14, color: Colors.primary, letterSpacing: 0.5,
  },

  progressWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: Colors.surfaceContainerLow,
  },
  progressTrack: {
    flex: 1, height: 8, backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.tertiary, borderRadius: 4 },
  progressLabel: {
    fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: Colors.tertiary, width: 36, textAlign: 'right',
  },

  filterScroll: { flexGrow: 0 },
  filterContent: {
    paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 18, paddingVertical: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 99, borderWidth: 2, borderColor: Colors.surfaceVariant,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.onPrimaryFixedVariant,
  },
  filterPillText: {
    fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: Colors.onSurfaceVariant,
  },
  filterPillTextActive: { color: Colors.primary },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },

  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontFamily: 'FredokaOne_400Regular', fontSize: 22, color: Colors.onSurface, marginBottom: 8 },
  emptySub:   { fontFamily: 'BeVietnamPro_400Regular', fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 24 },

  cardOuter: {
    marginBottom: 12, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.surfaceVariant,
    padding: 3, backgroundColor: Colors.surfaceContainerLow,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 3,
  },
  cardOuterDone: { opacity: 0.55 },
  cardInner: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 10, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  cardInnerDone: { backgroundColor: Colors.surfaceContainerLowest },
  cardIconBox: {
    width: 52, height: 52, backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12, borderWidth: 2, borderColor: Colors.surfaceVariant,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIconText: { fontSize: 26 },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' },
  cardName: { fontFamily: 'FredokaOne_400Regular', fontSize: 16, color: Colors.onSurface },
  cardNameDone: { textDecorationLine: 'line-through', color: Colors.onSurfaceVariant },
  rarityBadge: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 1,
    backgroundColor: Colors.surfaceContainer,
  },
  rarityText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 },
  cardSub: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, color: Colors.onSurfaceVariant, marginBottom: 6 },
  rewardsRow: { flexDirection: 'row', gap: 4 },
  xpBadge: { backgroundColor: Colors.secondary + '33', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  xpBadgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: Colors.secondary },
  gpBadge: { backgroundColor: Colors.tertiary + '33', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  gpBadgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: Colors.tertiary },
  checkBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 2, borderColor: Colors.surfaceVariant,
    alignItems: 'center', justifyContent: 'center',
  },
  checkBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: Colors.onSurfaceVariant },
  doneCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.tertiaryContainer + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  doneCheck: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.tertiary },
});

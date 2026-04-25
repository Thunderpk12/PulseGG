import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Alert, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { usePlayerStore } from '../../store/playerStore';
import { useQuestStore } from '../../store/questStore';
import { useBossStore } from '../../store/bossStore';
import {
  xpThresholdForLevel, xpWithinCurrentLevel, xpForNextLevel, getTitleForLevel,
} from '../../utils/gamification';

const AVATAR_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHVZxbBAw1MZDO54u_X6P655WRbDFzfgp5haeDsIbXuMOo_B5pIwBH_W2b9cFNtigxWRF2yCx1IMSdbzZ1BJ7MpqtIlDNrWOp0xXsHZY4dTD_EatPQSwIk_06fzfWInCfG9eBiSlxYoR28eAXQHLOYYlPEth4BQTG3Odsdp068woiYSFRaER5xvBtjJKnvi6-Z34kIbzZWNi9M7EwW8xbHpsfLxLAPn-biEeZk-6CeONewjkdoXn1_-kBaeHY_OCHb0qPtK0bBT3c';
const BANNER_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSpGqsTIqWdtC7YsEyDncvMOlQ5er3JAf5lUYXHNI4lVPkr96YNS9Qdaq7p4Aq4jCGCvVp8EDhskyz2gjYoyhre2NjfGV43yf6a148TNXTsM4IJHk2FjKlWpFNjzsIEaG1ZZhr46qr3vRCNvDn_QTAvdfqTXHptUVjVeRUPiZvg23t2KSvZ7YSyO6_7lgUZbqv6qqzgZ9CTGm-RqTcOD6HpfmdUpWvNshXmT90Gb21DsTbLGChL_JHlX35iBZAF1_PxYT8GsuxHzg';

const RARITY = {
  easy:   { label: 'COMMON',    color: Colors.tertiary,         border: Colors.tertiaryContainer },
  medium: { label: 'RARE',      color: Colors.primary,          border: Colors.primaryContainer  },
  hard:   { label: 'EPIC',      color: Colors.secondary,        border: Colors.secondaryContainer},
};

const DIFF_ICONS: Record<string, string> = {
  easy: '💧', medium: '📖', hard: '🏋️',
};

export default function HomeScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const { profile, title, currentLevelXp, maxLevelXp, justLeveledUp, newLevel, clearLevelUpFlag } = usePlayerStore();
  const { habits, isLoading, loadTodayHabits, completeQuest, subscribeToCompletions } = useQuestStore();
  const { boss } = useBossStore();

  useEffect(() => {
    if (!user?.id) return;
    loadTodayHabits(user.id);
    const unsub = subscribeToCompletions(user.id);
    return () => unsub();
  }, [user?.id]);

  useEffect(() => {
    if (justLeveledUp) {
      Alert.alert('🎉 LEVEL UP!', `You reached Level ${newLevel}!\n${getTitleForLevel(newLevel)}`);
      clearLevelUpFlag();
    }
  }, [justLeveledUp]);

  const handleComplete = async (habitId: string) => {
    if (!user?.id || !profile) return;
    const result = await completeQuest(habitId, user.id, profile, boss?.id ?? null);
    if (result.success) {
      const { loadProfile } = usePlayerStore.getState();
      await loadProfile(user.id);
    }
  };

  // Derived stats
  const level      = profile?.level ?? 1;
  const xpCurrent  = currentLevelXp;
  const xpMax      = maxLevelXp || 1;
  const xpPct      = Math.min(xpCurrent / xpMax, 1);
  const coins      = profile?.coins ?? 0;
  const streak     = profile?.streak ?? 0;
  const username   = profile?.username ?? user?.email?.split('@')[0] ?? 'Adventurer';

  const completed  = habits.filter(h => h.isCompletedToday).length;
  const remaining  = habits.filter(h => !h.isCompletedToday).length;

  // Health / Mana / Strength / Intellect derived from game state
  const healthMax  = 20;
  const healthCur  = Math.min(streak, healthMax);
  const manaMax    = 100;
  const manaCur    = habits.length ? Math.round((completed / habits.length) * 100) : 84;
  const strength   = Math.min(level, 99);
  const intellect  = Math.min(profile?.xp ? Math.floor(profile.xp / 100) : 15, 99);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* ── TOP HEADER ─────────────────────────────── */}
      <View style={s.topBar}>
        <Text style={s.brandName}>Adventurer</Text>
        <View style={s.topRight}>
          <View style={s.gpPill}>
            <Text style={s.gpIcon}>🪙</Text>
            <Text style={s.gpText}>{coins.toLocaleString()} GP</Text>
          </View>
          <View style={s.avatarRing}>
            <Image source={{ uri: AVATAR_URL }} style={s.avatarImg} />
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* ── PROFILE CARD ──────────────────────────── */}
        <View style={s.profileCard}>
          {/* Banner */}
          <View style={s.banner}>
            <Image source={{ uri: BANNER_URL }} style={s.bannerImg} />
            <View style={s.bannerOverlay} />
          </View>
          {/* Avatar overlapping banner */}
          <View style={s.profileAvatarWrap}>
            <Image source={{ uri: AVATAR_URL }} style={s.profileAvatar} />
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{username}</Text>
            <Text style={s.profileSub}>Level {level} · {title}</Text>
            {/* XP Bar */}
            <View style={s.xpRow}>
              <Text style={s.xpLabel}>Experience</Text>
              <Text style={s.xpValue}>{xpCurrent.toLocaleString()} / {xpMax.toLocaleString()} XP</Text>
            </View>
            <View style={s.xpTrack}>
              <View style={[s.xpFill, { width: `${Math.round(xpPct * 100)}%` }]} />
            </View>
          </View>
        </View>

        {/* ── STATS GRID ────────────────────────────── */}
        <View style={s.statsGrid}>
          <StatBox icon="❤️" label="Health"    value={`${healthCur}/${healthMax}`} color={Colors.error}     />
          <StatBox icon="⚡" label="Mana"      value={`${manaCur}/100`}           color={Colors.primary}   />
          <StatBox icon="💪" label="Strength"  value={String(strength)}             color={Colors.secondary} />
          <StatBox icon="📚" label="Intellect" value={String(intellect)}            color={Colors.tertiary}  />
        </View>

        {/* ── STREAK WIDGET ─────────────────────────── */}
        <View style={s.streakCard}>
          <View style={s.streakGlow} />
          <Text style={s.streakFlame}>🔥</Text>
          <Text style={s.streakNum}>{streak}</Text>
          <Text style={s.streakLabel}>DAY STREAK</Text>
          {/* 7-day bar */}
          <View style={s.weekBars}>
            {Array.from({ length: 7 }).map((_, i) => (
              <View key={i} style={[s.dayBar, i < Math.min(streak % 7 || (streak > 0 ? 7 : 0), 7) ? s.dayBarActive : s.dayBarInactive]} />
            ))}
          </View>
          <Text style={s.weekSubtext}>{Math.min(streak, 7)}/7 days this week</Text>
        </View>

        {/* ── WEEKLY BOSS ───────────────────────────── */}
        {boss ? (
          <View style={s.bossCard}>
            <View style={s.bossGlow} />
            <View style={s.bossHeader}>
              <View>
                <Text style={s.bossLabel}>👹 WEEKLY BOSS</Text>
                <Text style={s.bossName}>{boss.name}</Text>
              </View>
              <View style={boss.is_defeated ? s.bossDefeatedBadge : s.bossAliveBadge}>
                <Text style={boss.is_defeated ? s.bossDefeatedText : s.bossAliveText}>
                  {boss.is_defeated ? '💀 SLAIN' : '⚔️ ACTIVE'}
                </Text>
              </View>
            </View>
            {/* HP Bar */}
            <View style={s.bossHpRow}>
              <Text style={s.bossHpLabel}>❤️ HP</Text>
              <Text style={s.bossHpValue}>
                {boss.current_hp.toLocaleString()} / {boss.max_hp.toLocaleString()}
              </Text>
            </View>
            <View style={s.bossHpTrack}>
              <View
                style={[
                  s.bossHpFill,
                  { width: `${Math.max(0, Math.round((boss.current_hp / boss.max_hp) * 100))}%` },
                  boss.is_defeated && { backgroundColor: Colors.outline },
                ]}
              />
            </View>
            {!boss.is_defeated && (
              <Text style={s.bossTip}>Complete quests to deal damage! 🗡️</Text>
            )}
          </View>
        ) : null}

        {/* ── ACTIVE BUFFS ──────────────────────────── */}
        <View style={s.buffsCard}>
          <Text style={s.buffsTitle}>⚡ Active Buffs</Text>
          <BuffRow icon="⏩" label="Morning Haste"  sub="2x XP on morning quests" color={Colors.primary}   />
          <BuffRow icon="🛡️" label="Quest Guard"    sub="Protect streak from 1 miss" color={Colors.secondary} />
        </View>

        {/* ── TODAY'S QUESTS ───────────────────────── */}
        <View style={s.questsSection}>
          <View style={s.questsHeader}>
            <View>
              <Text style={s.questsTitle}>Today's Quests</Text>
              <Text style={s.questsSub}>{remaining} task{remaining !== 1 ? 's' : ''} remaining for the day</Text>
            </View>
            <TouchableOpacity
              style={s.newQuestBtn}
              onPress={() => router.push({ pathname: '/new-quest' } as any)}
              activeOpacity={0.85}
            >
              <Text style={s.newQuestText}>NEW QUEST</Text>
            </TouchableOpacity>
          </View>

          {habits.length === 0 && !isLoading ? (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>🗺️</Text>
              <Text style={s.emptyTitle}>No quests yet</Text>
              <Text style={s.emptySub}>Tap NEW QUEST to begin your adventure!</Text>
            </View>
          ) : (
            habits.map(habit => (
              <QuestCardRow
                key={habit.id}
                title={habit.name}
                subtitle={`${habit.category} · ${habit.difficulty}`}
                difficulty={habit.difficulty}
                xpReward={habit.xp_reward}
                gpReward={habit.coin_reward}
                isCompleted={habit.isCompletedToday ?? false}
                onComplete={() => handleComplete(habit.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── FAB ──────────────────────────────────────── */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => router.push({ pathname: '/new-quest' } as any)}
        activeOpacity={0.85}
      >
        <Text style={s.fabIcon}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatBox({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={s.statBox}>
      <Text style={[s.statIcon, { color }]}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

function BuffRow({ icon, label, sub, color }: { icon: string; label: string; sub: string; color: string }) {
  return (
    <View style={s.buffRow}>
      <View style={[s.buffIconBox, { backgroundColor: color + '33' }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View>
        <Text style={s.buffLabel}>{label}</Text>
        <Text style={s.buffSub}>{sub}</Text>
      </View>
    </View>
  );
}

function QuestCardRow({
  title, subtitle, difficulty, xpReward, gpReward, isCompleted, onComplete,
}: {
  title: string; subtitle: string; difficulty: string; xpReward: number;
  gpReward: number; isCompleted: boolean; onComplete: () => void;
}) {
  const diff  = difficulty.toLowerCase() as keyof typeof RARITY;
  const rarity = RARITY[diff] ?? RARITY.easy;
  const icon   = DIFF_ICONS[diff] ?? '⭐';

  return (
    <View style={[s.questOuter, isCompleted && s.questOuterDone]}>
      <View style={[s.questInner, isCompleted && s.questInnerDone]}>
        {/* Icon */}
        <View style={s.questIconBox}>
          <Text style={s.questIconText}>{icon}</Text>
        </View>

        {/* Info */}
        <View style={s.questInfo}>
          <View style={s.questNameRow}>
            <Text style={[s.questName, isCompleted && s.questNameDone]} numberOfLines={1}>
              {title}
            </Text>
            <View style={[s.rarityBadge, { borderColor: rarity.border + '55' }]}>
              <Text style={[s.rarityText, { color: rarity.color }]}>{rarity.label}</Text>
            </View>
          </View>
          <Text style={s.questSub} numberOfLines={1}>{subtitle}</Text>
        </View>

        {/* Rewards + check */}
        <View style={s.questRight}>
          <View style={s.rewardsRow}>
            <View style={s.xpBadge}>
              <Text style={s.xpBadgeText}>+{xpReward} XP</Text>
            </View>
            <View style={s.gpBadge}>
              <Text style={s.gpBadgeText}>+{gpReward} GP</Text>
            </View>
          </View>
          {isCompleted ? (
            <View style={s.doneCircle}>
              <Text style={s.doneCheck}>✓</Text>
            </View>
          ) : (
            <TouchableOpacity style={s.checkBtn} onPress={onComplete} activeOpacity={0.75}>
              <Text style={s.checkBtnText}>✓</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 4, borderBottomColor: Colors.surfaceContainerLow,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
  },
  brandName: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 22,
    color: Colors.primaryContainer, letterSpacing: -0.5,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gpPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 2, borderColor: Colors.surfaceVariant,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 3,
  },
  gpIcon: { fontSize: 16 },
  gpText: { fontFamily: 'FredokaOne_400Regular', fontSize: 15, color: Colors.secondary, letterSpacing: 0.5 },
  avatarRing: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: Colors.primary, overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },

  // Profile card
  profileCard: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, borderWidth: 2, borderColor: Colors.surfaceVariant,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 8, height: 8 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6,
  },
  banner: { height: 100, backgroundColor: Colors.primaryContainer, position: 'relative' },
  bannerImg: { width: '100%', height: '100%', opacity: 0.4 },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.primaryContainer + '66' },
  profileAvatarWrap: {
    position: 'absolute', top: 56, left: 20,
    width: 72, height: 72, borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 4, borderColor: Colors.primary,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
  },
  profileAvatar: { width: '100%', height: '100%' },
  profileInfo: { paddingTop: 44, paddingHorizontal: 20, paddingBottom: 20 },
  profileName: { fontFamily: 'FredokaOne_400Regular', fontSize: 22, color: Colors.onSurface },
  profileSub:  { fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: 14 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5 },
  xpValue: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: Colors.primary },
  xpTrack: {
    height: 14, backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 7, overflow: 'hidden',
    borderWidth: 2, borderColor: Colors.surfaceVariant,
  },
  xpFill: { height: '100%', backgroundColor: Colors.tertiary, borderRadius: 7 },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: 16, marginTop: 16, gap: 10,
  },
  statBox: {
    width: '47%', backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14, borderWidth: 2, borderColor: Colors.surfaceVariant,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 3,
  },
  statIcon: { fontSize: 28, marginBottom: 4 },
  statValue: { fontFamily: 'FredokaOne_400Regular', fontSize: 20, color: Colors.onSurface },
  statLabel: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 9, color: Colors.onSurfaceVariant, letterSpacing: 1.2, marginTop: 2 },

  // Boss card
  bossCard: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, borderWidth: 2, borderColor: Colors.error + '55',
    padding: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 8, height: 8 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6,
  },
  bossGlow: {
    position: 'absolute', top: -20, right: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.error + '15',
  },
  bossHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  bossLabel: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 10, color: Colors.error, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  bossName: { fontFamily: 'FredokaOne_400Regular', fontSize: 22, color: Colors.onSurface },
  bossAliveBadge: { backgroundColor: Colors.error + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.error + '55' },
  bossAliveText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: Colors.error, letterSpacing: 0.5 },
  bossDefeatedBadge: { backgroundColor: Colors.outline + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.outline + '55' },
  bossDefeatedText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: Colors.outline, letterSpacing: 0.5 },
  bossHpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bossHpLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: Colors.error },
  bossHpValue: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: Colors.onSurfaceVariant },
  bossHpTrack: { height: 16, backgroundColor: Colors.surfaceContainerLowest, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: Colors.surfaceVariant },
  bossHpFill: { height: '100%', backgroundColor: Colors.error, borderRadius: 8 },
  bossTip: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 10, textAlign: 'center' },

  // Streak card
  streakCard: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, borderWidth: 2, borderColor: Colors.surfaceVariant,
    padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 8, height: 8 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6,
    overflow: 'hidden',
  },
  streakGlow: {
    position: 'absolute', top: -16, right: -16,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.secondary + '22',
  },
  streakFlame: { fontSize: 44, marginBottom: 4 },
  streakNum: { fontFamily: 'FredokaOne_400Regular', fontSize: 56, color: Colors.onSurface, lineHeight: 60 },
  streakLabel: { fontFamily: 'FredokaOne_400Regular', fontSize: 13, color: Colors.secondary, letterSpacing: 3, marginTop: 4 },
  weekBars: { flexDirection: 'row', gap: 6, marginTop: 20, width: '100%' },
  dayBar: { flex: 1, height: 4, borderRadius: 2 },
  dayBarActive: { backgroundColor: Colors.tertiary },
  dayBarInactive: { backgroundColor: Colors.surfaceContainer },
  weekSubtext: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 9, color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },

  // Buffs
  buffsCard: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, borderWidth: 2, borderColor: Colors.surfaceVariant,
    padding: 20,
    shadowColor: '#000', shadowOffset: { width: 8, height: 8 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6,
  },
  buffsTitle: { fontFamily: 'FredokaOne_400Regular', fontSize: 18, color: Colors.onSurface, marginBottom: 16 },
  buffRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  buffIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buffLabel: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: Colors.onSurface },
  buffSub:   { fontFamily: 'BeVietnamPro_400Regular', fontSize: 10, color: Colors.onSurfaceVariant, marginTop: 1 },

  // Quests section
  questsSection: { marginHorizontal: 16, marginTop: 24 },
  questsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  questsTitle: { fontFamily: 'FredokaOne_400Regular', fontSize: 28, color: Colors.onSurface, letterSpacing: -0.5 },
  questsSub:   { fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 2 },
  newQuestBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 10, borderWidth: 2, borderColor: Colors.onPrimaryFixedVariant,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
  },
  newQuestText: { fontFamily: 'FredokaOne_400Regular', fontSize: 14, color: Colors.primary, letterSpacing: 0.5 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontFamily: 'FredokaOne_400Regular', fontSize: 20, color: Colors.onSurface, marginBottom: 6 },
  emptySub:   { fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center' },

  // Quest card
  questOuter: {
    marginBottom: 12, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.surfaceVariant,
    padding: 3,
    backgroundColor: Colors.surfaceContainerLow,
  },
  questOuterDone: { opacity: 0.55 },
  questInner: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 10, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  questInnerDone: { backgroundColor: Colors.surfaceContainerLowest },
  questIconBox: {
    width: 56, height: 56, backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12, borderWidth: 2, borderColor: Colors.surfaceVariant,
    alignItems: 'center', justifyContent: 'center',
  },
  questIconText: { fontSize: 28 },
  questInfo: { flex: 1 },
  questNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  questName: { fontFamily: 'FredokaOne_400Regular', fontSize: 17, color: Colors.onSurface },
  questNameDone: { textDecorationLine: 'line-through', color: Colors.onSurfaceVariant },
  rarityBadge: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 1,
    backgroundColor: Colors.surfaceContainer,
  },
  rarityText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 8, letterSpacing: 0.5 },
  questSub: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, color: Colors.onSurfaceVariant },
  questRight: { alignItems: 'flex-end', gap: 8 },
  rewardsRow: { flexDirection: 'row', gap: 4 },
  xpBadge: { backgroundColor: Colors.secondary + '33', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  xpBadgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: Colors.secondary },
  gpBadge: { backgroundColor: Colors.tertiary + '33', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
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

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 14,
    backgroundColor: Colors.primaryContainer,
    borderWidth: 4, borderColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 8,
  },
  fabIcon: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 28, color: Colors.primary, lineHeight: 32 },
});

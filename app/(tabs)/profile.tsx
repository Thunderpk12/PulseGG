import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert,
  TextInput, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useAuthStore } from '../../store/authStore';
import { usePlayerStore } from '../../store/playerStore';
import { useQuestStore } from '../../store/questStore';
import { useBossStore } from '../../store/bossStore';
import { Colors } from '../../constants/Colors';
import { ACHIEVEMENT_DEFS } from '../../utils/achievementService';

const FALLBACK_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHVZxbBAw1MZDO54u_X6P655WRbDFzfgp5haeDsIbXuMOo_B5pIwBH_W2b9cFNtigxWRF2yCx1IMSdbzZ1BJ7MpqtIlDNrWOp0xXsHZY4dTD_EatPQSwIk_06fzfWInCfG9eBiSlxYoR28eAXQHLOYYlPEth4BQTG3Odsdp068woiYSFRaER5xvBtjJKnvi6-Z34kIbzZWNi9M7EwW8xbHpsfLxLAPn-biEeZk-6CeONewjkdoXn1_-kBaeHY_OCHb0qPtK0bBT3c';
const BANNER_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSpGqsTIqWdtC7YsEyDncvMOlQ5er3JAf5lUYXHNI4lVPkr96YNS9Qdaq7p4Aq4jCGCvVp8EDhskyz2gjYoyhre2NjfGV43yf6a148TNXTsM4IJHk2FjKlWpFNjzsIEaG1ZZhr46qr3vRCNvDn_QTAvdfqTXHptUVjVeRUPiZvg23t2KSvZ7YSyO6_7lgUZbqv6qqzgZ9CTGm-RqTcOD6HpfmdUpWvNshXmT90Gb21DsTbLGChL_JHlX35iBZAF1_PxYT8GsuxHzg';

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <View style={s.statCard}>
      <Text style={[s.statIcon, { color }]}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function AchievementRow({ icon, title, desc, earned }: { icon: string; title: string; desc: string; earned: boolean }) {
  return (
    <View style={[s.achievRow, !earned && s.achievRowLocked]}>
      <View style={[s.achievIconBox, { backgroundColor: earned ? Colors.primaryContainer + '33' : Colors.surfaceContainer }]}>
        <Text style={{ fontSize: 20, opacity: earned ? 1 : 0.4 }}>{icon}</Text>
      </View>
      <View style={s.achievInfo}>
        <Text style={[s.achievTitle, !earned && { opacity: 0.5 }]}>{title}</Text>
        <Text style={s.achievDesc}>{desc}</Text>
      </View>
      {earned && (
        <View style={s.achievBadge}>
          <Text style={s.achievBadgeText}>✓</Text>
        </View>
      )}
    </View>
  );
}

// ── Edit Username Modal ────────────────────────────────────────────────────────

function EditUsernameModal({
  visible,
  current,
  onSave,
  onCancel,
}: {
  visible: boolean;
  current: string;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      Alert.alert('Invalid', 'Username cannot be empty.');
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 24) {
      Alert.alert('Invalid', 'Username must be 3–24 characters.');
      return;
    }
    setSaving(true);
    await onSave(trimmed);
    setSaving(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.modalBackdrop}>
        <View style={s.modalCard}>
          <Text style={s.modalTitle}>✏️ Edit Username</Text>
          <TextInput
            style={s.modalInput}
            value={value}
            onChangeText={setValue}
            placeholder="Enter new username"
            placeholderTextColor={Colors.outline}
            maxLength={24}
            autoFocus
            selectTextOnFocus
          />
          <Text style={s.modalHint}>{value.length}/24 characters · min 3</Text>
          <View style={s.modalBtns}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalSaveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <Text style={s.modalSaveText}>SAVE</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const {
    profile, title, currentLevelXp, maxLevelXp,
    earnedAchievements, updateProfileField,
    reset: resetPlayer,
  } = usePlayerStore();
  const { reset: resetQuests } = useQuestStore();
  const { reset: resetBoss } = useBossStore();
  const router = useRouter();

  const [editingUsername, setEditingUsername] = useState(false);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            resetPlayer();
            resetQuests();
            resetBoss();
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          } catch (e) {
            console.error('[SignOut] error:', e);
            router.replace('/(auth)/login');
          }
        },
      },
    ]);
  };

  const handleSaveUsername = async (newName: string) => {
    if (!user?.id) return;
    const ok = await updateProfileField(user.id, { username: newName });
    if (ok) {
      setEditingUsername(false);
    } else {
      Alert.alert('Error', 'Failed to update username. Please try again.');
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={s.loadingText}>Loading profile…</Text>
      </SafeAreaView>
    );
  }

  const username = profile.username ?? user?.email?.split('@')[0] ?? 'Adventurer';
  const avatarUri = profile.avatar_url ?? FALLBACK_AVATAR;
  const completedToday = useQuestStore.getState().habits.filter(h => h.isCompletedToday).length;
  const totalHabits = useQuestStore.getState().habits.length;
  const xpPct = maxLevelXp > 0 ? Math.min(currentLevelXp / maxLevelXp, 1) : 0;

  // Build achievement list from canonical definitions
  const earnedCount = earnedAchievements.size;
  const totalCount = ACHIEVEMENT_DEFS.length;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* ── Edit Username Modal ─────────────────────── */}
      <EditUsernameModal
        visible={editingUsername}
        current={username}
        onSave={handleSaveUsername}
        onCancel={() => setEditingUsername(false)}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* ── PROFILE CARD ──────────────────────────── */}
        <View style={s.profileCard}>
          {/* Banner */}
          <View style={s.banner}>
            <Image source={{ uri: BANNER_URL }} style={s.bannerImg} />
            <View style={s.bannerOverlay} />
          </View>
          {/* Avatar */}
          <View style={s.avatarWrap}>
            <Image source={{ uri: avatarUri }} style={s.avatarImg} />
          </View>
          <View style={s.profileInfo}>
            <View style={s.nameRow}>
              <Text style={s.profileName}>{username}</Text>
              <TouchableOpacity
                style={s.editNameBtn}
                onPress={() => setEditingUsername(true)}
                activeOpacity={0.8}
              >
                <Text style={s.editNameBtnText}>✏️</Text>
              </TouchableOpacity>
            </View>
            <View style={s.titleBadge}>
              <Text style={s.titleBadgeText}>{title}</Text>
            </View>
            <Text style={s.emailText}>{user?.email}</Text>

            {/* XP Bar */}
            <View style={s.xpRow}>
              <Text style={s.xpLabel}>Level {profile.level} · Experience</Text>
              <Text style={s.xpValue}>{currentLevelXp.toLocaleString()} / {maxLevelXp.toLocaleString()} XP</Text>
            </View>
            <View style={s.xpTrack}>
              <View style={[s.xpFill, { width: `${Math.round(xpPct * 100)}%` }]} />
            </View>
          </View>
        </View>

        {/* ── STATS GRID ────────────────────────────── */}
        <View style={s.statsGrid}>
          <StatCard icon="🎯" label="Today"   value={`${completedToday}/${totalHabits}`} color={Colors.primary}   />
          <StatCard icon="⭐" label="Total XP" value={profile.xp.toLocaleString()}        color={Colors.secondary} />
          <StatCard icon="🏆" label="Level"    value={profile.level}                      color={Colors.tertiary}  />
          <StatCard icon="🔥" label="Streak"   value={`${profile.streak}d`}               color={Colors.error}     />
        </View>

        {/* ── GP ROW ────────────────────────────────── */}
        <View style={s.gpRow}>
          <View style={s.gpPill}>
            <Text style={{ fontSize: 20 }}>🪙</Text>
            <View>
              <Text style={s.gpAmount}>{profile.coins.toLocaleString()} GP</Text>
              <Text style={s.gpSub}>Gold earned</Text>
            </View>
          </View>
        </View>

        {/* ── ACHIEVEMENTS ─────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>🏅 Achievements</Text>
            <View style={s.achievProgress}>
              <Text style={s.achievProgressText}>{earnedCount}/{totalCount}</Text>
            </View>
          </View>
          {ACHIEVEMENT_DEFS.map((a) => (
            <AchievementRow
              key={a.key}
              icon={a.icon}
              title={a.title}
              desc={a.desc}
              earned={earnedAchievements.has(a.key)}
            />
          ))}
        </View>

        {/* ── ACCOUNT ───────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>⚙️ Account</Text>
          <View style={s.accountCard}>
            <View style={s.accountRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.accountLabel}>USERNAME</Text>
                <Text style={s.accountValue}>{username}</Text>
              </View>
              <TouchableOpacity
                style={s.accountEditBtn}
                onPress={() => setEditingUsername(true)}
                activeOpacity={0.8}
              >
                <Text style={s.accountEditBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={s.accountDivider} />
            <View>
              <Text style={s.accountLabel}>EMAIL</Text>
              <Text style={s.accountValue}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* ── SIGN OUT ──────────────────────────────── */}
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  loadingText: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 14, color: Colors.onSurfaceVariant },

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
  avatarWrap: {
    position: 'absolute', top: 56, left: 20,
    width: 72, height: 72, borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 4, borderColor: Colors.primary,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
  },
  avatarImg: { width: '100%', height: '100%' },
  profileInfo: { paddingTop: 44, paddingHorizontal: 20, paddingBottom: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName: { fontFamily: 'FredokaOne_400Regular', fontSize: 22, color: Colors.onSurface },
  editNameBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 2, borderColor: Colors.surfaceVariant,
    alignItems: 'center', justifyContent: 'center',
  },
  editNameBtnText: { fontSize: 14 },
  titleBadge: {
    alignSelf: 'flex-start',
    marginTop: 4, marginBottom: 4,
    backgroundColor: Colors.primaryContainer + '33',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.primaryContainer + '77',
  },
  titleBadgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: Colors.primary, letterSpacing: 0.5 },
  emailText: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, color: Colors.onSurfaceVariant, marginBottom: 16 },
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
  statCard: {
    width: '47%', backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14, borderWidth: 2, borderColor: Colors.surfaceVariant,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 3,
  },
  statIcon:  { fontSize: 26, marginBottom: 4 },
  statValue: { fontFamily: 'FredokaOne_400Regular', fontSize: 20, color: Colors.onSurface },
  statLabel: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 9, color: Colors.onSurfaceVariant, letterSpacing: 1.2, marginTop: 2, textTransform: 'uppercase' },

  // GP row
  gpRow: { marginHorizontal: 16, marginTop: 16 },
  gpPill: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14, borderWidth: 2, borderColor: Colors.surfaceVariant,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 3,
  },
  gpAmount: { fontFamily: 'FredokaOne_400Regular', fontSize: 22, color: Colors.secondary },
  gpSub:    { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, color: Colors.onSurfaceVariant },

  // Section
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontFamily: 'FredokaOne_400Regular', fontSize: 20, color: Colors.onSurface },
  achievProgress: {
    backgroundColor: Colors.primaryContainer + '44',
    borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primaryContainer + '77',
  },
  achievProgressText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: Colors.primary },

  // Achievements
  achievRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12, borderWidth: 2, borderColor: Colors.surfaceVariant,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 2,
  },
  achievRowLocked: { borderColor: Colors.surfaceContainer },
  achievIconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  achievInfo: { flex: 1 },
  achievTitle: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 14, color: Colors.onSurface },
  achievDesc:  { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  achievBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.tertiary + '33',
    alignItems: 'center', justifyContent: 'center',
  },
  achievBadgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: Colors.tertiary },

  // Account
  accountCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12, borderWidth: 2, borderColor: Colors.surfaceVariant,
    padding: 16,
  },
  accountRow: { flexDirection: 'row', alignItems: 'center' },
  accountDivider: { height: 2, backgroundColor: Colors.surfaceVariant, marginVertical: 12 },
  accountLabel: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 10, color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  accountValue: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 14, color: Colors.onSurface },
  accountEditBtn: {
    backgroundColor: Colors.primaryContainer + '44',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.primaryContainer + '88',
  },
  accountEditBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: Colors.primary },

  // Edit username modal
  modalBackdrop: {
    flex: 1, backgroundColor: '#00000088',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20, borderWidth: 2, borderColor: Colors.surfaceVariant,
    padding: 24,
    shadowColor: '#000', shadowOffset: { width: 8, height: 8 }, shadowOpacity: 0.6, shadowRadius: 0, elevation: 12,
  },
  modalTitle: {
    fontFamily: 'FredokaOne_400Regular', fontSize: 22, color: Colors.onSurface, marginBottom: 20,
  },
  modalInput: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 3, borderColor: Colors.primaryContainer,
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12,
    fontFamily: 'BeVietnamPro_400Regular', fontSize: 16, color: Colors.onSurface,
  },
  modalHint: {
    fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, color: Colors.onSurfaceVariant,
    marginTop: 6, marginBottom: 20,
  },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 10, borderWidth: 2, borderColor: Colors.surfaceVariant,
    alignItems: 'center',
  },
  modalCancelText: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 14, color: Colors.onSurfaceVariant },
  modalSaveBtn: {
    flex: 1, paddingVertical: 14,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 10, borderWidth: 2, borderColor: Colors.onPrimaryFixed,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
  },
  modalSaveText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 14, color: Colors.primary, letterSpacing: 1 },

  // Sign out
  signOutBtn: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: Colors.errorContainer,
    borderRadius: 12, borderWidth: 2, borderColor: Colors.error + '55',
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 3,
  },
  signOutText: { fontFamily: 'FredokaOne_400Regular', fontSize: 16, color: Colors.error, letterSpacing: 0.5 },
});

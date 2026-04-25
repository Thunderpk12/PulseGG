import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, FlatList, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { usePlayerStore } from '../../store/playerStore';
import { fetchShopItems, fetchUserInventory, purchaseItem, ShopItem } from '../../utils/habitService';

// ─── Level requirement by rarity ─────────────────────────────────────────────
const RARITY_LEVEL_REQ: Record<string, number> = {
  common: 1, rare: 5, epic: 10, legendary: 20,
};

// ─── Icon + accent per item type × rarity ────────────────────────────────────
const TYPE_ICON: Record<string, string> = {
  icon: '🛡️', title: '📜', theme: '🎨',
};
const RARITY_ACCENT: Record<string, string> = {
  common:    Colors.onSurfaceVariant,
  rare:      Colors.primary,
  epic:      Colors.tertiary,
  legendary: Colors.secondary,
};
const RARITY_BADGE_BG: Record<string, string> = {
  common:    Colors.surfaceVariant,
  rare:      Colors.primaryContainer + '44',
  epic:      Colors.tertiaryContainer + '44',
  legendary: Colors.secondaryContainer + '44',
};

type TypeFilter = 'all' | 'icon' | 'title' | 'theme';

const CATEGORIES: { label: string; value: TypeFilter; icon: string }[] = [
  { label: 'Icons',   value: 'icon',  icon: '🛡️' },
  { label: 'Titles',  value: 'title', icon: '📜' },
  { label: 'Themes',  value: 'theme', icon: '🎨' },
  { label: 'All',     value: 'all',   icon: '✨' },
];

// Feature banner item — hardcoded (slot for a seasonal hero item)
const FEATURED = {
  name: 'Aether Vanguard Set',
  sub: 'Exclusive seasonal bundle. New legendary cosmetics arrive every Sunday.',
  tag: '🌟 Limited Edition',
  price: 5000,
  imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaI_qQAkTnH9ygILgZgu0VH4uPeNYclUK3ZWwRKMJWuLJ3FR-jP2Hsia6jUr-TLExEFd4Lbjpi9038pK7kUHPOb6BLGV3QSMYfZJlzN4rRB1zlZ2UNYwR5GKeKayQ5x-e5UBGCS0_Yczf5G-GhuCCQp8VuI4niA6k7ZU0qS85Lg2WrVz_8fr9hE_ky-0lAiy1O_ylUhPTQ2opbjl25rmIvDiYG0pyrNx1gyDXtrH58GQUK4Fm_HR4ISu976Bdrg5zOkBO0C1RqlWk',
};

// ─── Item card (3-column compact) ────────────────────────────────────────────
function ItemCard({
  item, owned, equipped, locked, levelReq, onBuy, buying, userCoins,
}: {
  item: ShopItem;
  owned: boolean;
  equipped: boolean;
  locked: boolean;
  levelReq: number;
  onBuy: () => void;
  buying: boolean;
  userCoins: number;
}) {
  const accent = RARITY_ACCENT[item.rarity] ?? Colors.onSurfaceVariant;
  const canAfford = userCoins >= item.price_coins;

  return (
    <View style={[s.card, locked && s.cardLocked, equipped && { borderColor: Colors.tertiary }]}>
      {/* Equipped badge */}
      {equipped && (
        <View style={s.equippedBadge}>
          <Text style={s.equippedBadgeText}>✓ ON</Text>
        </View>
      )}
      {/* Lock icon */}
      {locked && (
        <View style={s.lockIcon}>
          <Text style={{ fontSize: 14 }}>🔒</Text>
        </View>
      )}

      {/* Icon box */}
      <View style={[s.iconBox, locked && { backgroundColor: Colors.surfaceContainerLowest }]}>
        <Text style={[s.iconEmoji, locked && { opacity: 0.3 }]}>
          {TYPE_ICON[item.type] ?? '✨'}
        </Text>
      </View>

      {/* Name */}
      <Text style={[s.cardName, locked && { opacity: 0.5 }]} numberOfLines={2}>
        {item.name}
      </Text>

      {/* Rarity badge */}
      <View style={[s.rarityPill, { backgroundColor: RARITY_BADGE_BG[item.rarity] }]}>
        <Text style={[s.rarityPillText, { color: accent }]}>
          {item.rarity.toUpperCase()}
        </Text>
      </View>

      {/* Action button */}
      {owned || equipped ? (
        <View style={s.ownedBtn}>
          <Text style={s.ownedBtnText}>{equipped ? 'Equipped' : 'Owned'}</Text>
        </View>
      ) : locked ? (
        <View style={s.lockedBtn}>
          <Text style={s.lockedBtnText}>Lvl {levelReq} Req.</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[s.buyBtn, !canAfford && s.buyBtnNoFunds]}
          onPress={onBuy}
          disabled={buying || !canAfford}
          activeOpacity={0.85}
        >
          {buying ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <Text style={{ fontSize: 11 }}>🪙</Text>
              <Text style={s.buyBtnText}>{item.price_coins.toLocaleString()}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function ShopScreen() {
  const { user } = useAuthStore();
  const { profile, loadProfile } = usePlayerStore();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [filter, setFilter] = useState<TypeFilter>('icon');

  useEffect(() => {
    async function load() {
      const [shopItems, inv] = await Promise.all([
        fetchShopItems(),
        user?.id ? fetchUserInventory(user.id) : Promise.resolve(new Set<string>()),
      ]);
      setItems(shopItems);
      setOwnedIds(inv);
      setLoading(false);
    }
    load();
  }, [user?.id]);

  const handleBuy = async (item: ShopItem) => {
    if (!user?.id || !profile) return;
    if (profile.coins < item.price_coins) {
      Alert.alert('⚠️ Not enough GP', `You need ${(item.price_coins - profile.coins).toLocaleString()} more GP.`);
      return;
    }
    setBuying(item.id);
    const result = await purchaseItem(user.id, item, profile.coins);
    if (result.success) {
      setOwnedIds(prev => new Set([...prev, item.id]));
      await loadProfile(user.id);
      Alert.alert('🎉 Purchased!', `"${item.name}" added to your collection!`);
    } else {
      Alert.alert('Purchase failed', result.message);
    }
    setBuying(null);
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);
  const userLevel = profile?.level ?? 1;
  const userCoins = profile?.coins ?? 0;
  const equippedIds = new Set([
    profile?.equipped_icon_id,
    profile?.equipped_title_id,
  ].filter(Boolean) as string[]);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* ── HEADER ─────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={{ fontSize: 20 }}>🛒</Text>
          <Text style={s.headerTitle}>Hero's Shop</Text>
        </View>
        <View style={s.gpPill}>
          <Text style={{ fontSize: 16 }}>🪙</Text>
          <Text style={s.gpText}>{userCoins.toLocaleString()} GP</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* ── FEATURED BANNER ─────────────────────────── */}
        <View style={s.featuredWrap}>
          <View style={s.featured}>
            <Image source={{ uri: FEATURED.imageUrl }} style={s.featuredImg} />
            {/* Gradient overlay via layered Views */}
            <View style={s.featuredOverlayDark} />
            <View style={s.featuredOverlayGrad} />
            <View style={s.featuredContent}>
              <View style={s.featuredTagRow}>
                <Text style={s.featuredTag}>{FEATURED.tag}</Text>
              </View>
              <Text style={s.featuredName}>{FEATURED.name}</Text>
              <Text style={s.featuredSub} numberOfLines={2}>{FEATURED.sub}</Text>
            </View>
          </View>
          <View style={s.featuredFooter}>
            <View style={s.featuredPriceRow}>
              <Text style={{ fontSize: 18 }}>🪙</Text>
              <Text style={s.featuredPrice}>{FEATURED.price.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={s.featuredBtn} activeOpacity={0.85}>
              <Text style={s.featuredBtnText}>UNLOCK NOW</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── CATEGORY TABS (sticky) ───────────────────── */}
        <View style={s.tabsBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tabsContent}
          >
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[s.tab, filter === cat.value && s.tabActive]}
                onPress={() => setFilter(cat.value)}
                activeOpacity={0.8}
              >
                <Text style={s.tabIcon}>{cat.icon}</Text>
                <Text style={[s.tabText, filter === cat.value && s.tabTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── GRID ─────────────────────────────────────── */}
        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={Colors.primaryContainer} />
            <Text style={s.loadingText}>Loading the market…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.centered}>
            <Text style={{ fontSize: 48 }}>🛒</Text>
            <Text style={s.emptyTitle}>Nothing here yet</Text>
            <Text style={s.emptySub}>Check back during seasonal events!</Text>
          </View>
        ) : (
          <View style={s.grid}>
            {filtered.map(item => {
              const levelReq = RARITY_LEVEL_REQ[item.rarity] ?? 1;
              const isOwned    = ownedIds.has(item.id);
              const isEquipped = equippedIds.has(item.id);
              const isLocked   = !isOwned && userLevel < levelReq;
              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  owned={isOwned}
                  equipped={isEquipped}
                  locked={isLocked}
                  levelReq={levelReq}
                  onBuy={() => handleBuy(item)}
                  buying={buying === item.id}
                  userCoins={userCoins}
                />
              );
            })}
          </View>
        )}

        {/* Fallback sample items when DB is empty (for demo) */}
        {!loading && items.length === 0 && (
          <View style={s.emptyDBNote}>
            <Text style={s.emptyDBText}>
              💡 No items in the database yet. Seed your Supabase `shop_items` table to populate the shop.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const CARD_GAP = 10;
const CARD_W = '31.5%';

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 4, borderBottomColor: Colors.surfaceContainerLow,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: {
    fontFamily: 'FredokaOne_400Regular', fontSize: 24, color: Colors.primaryContainer,
    letterSpacing: -0.5,
  },
  gpPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 2, borderColor: Colors.surfaceVariant,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 3,
  },
  gpText: { fontFamily: 'FredokaOne_400Regular', fontSize: 16, color: Colors.secondary, letterSpacing: 0.5 },

  // Featured banner
  featuredWrap: {
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 2, borderColor: Colors.primaryContainer,
    shadowColor: '#000', shadowOffset: { width: 8, height: 8 }, shadowOpacity: 0.5, shadowRadius: 0, elevation: 8,
  },
  featured: { height: 160, position: 'relative' },
  featuredImg: { width: '100%', height: '100%', opacity: 0.65 },
  featuredOverlayDark: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,19,38,0.35)' },
  featuredOverlayGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
    backgroundColor: Colors.surfaceContainerLowest + 'cc',
  },
  featuredContent: { position: 'absolute', bottom: 12, left: 14, right: 14 },
  featuredTagRow: { flexDirection: 'row', marginBottom: 4 },
  featuredTag: {
    fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9,
    color: Colors.onPrimaryFixed, backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, letterSpacing: 1,
    textTransform: 'uppercase',
  },
  featuredName: {
    fontFamily: 'FredokaOne_400Regular', fontSize: 22, color: Colors.onSurface,
    textShadowColor: Colors.surfaceContainerLowest, textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0,
  },
  featuredSub: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, color: Colors.onSurfaceVariant },
  featuredFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow, paddingHorizontal: 14, paddingVertical: 12,
  },
  featuredPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featuredPrice: { fontFamily: 'FredokaOne_400Regular', fontSize: 22, color: Colors.secondary },
  featuredBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.onPrimaryFixed,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
  },
  featuredBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 13, color: Colors.primary, letterSpacing: 1,
  },

  // Category tabs bar
  tabsBar: { backgroundColor: Colors.surface, paddingTop: 8, paddingBottom: 4 },
  tabsContent: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 99, borderWidth: 2, borderColor: Colors.surfaceVariant,
  },
  tabActive: { backgroundColor: Colors.primaryContainer, borderColor: Colors.onPrimaryFixed },
  tabIcon: { fontSize: 14 },
  tabText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  tabTextActive: { color: Colors.primary },

  // Grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP,
    paddingHorizontal: 16, paddingTop: 14,
  },

  // Item card (compact 3-col)
  card: {
    width: CARD_W,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14, borderWidth: 2, borderColor: Colors.surfaceVariant,
    alignItems: 'center', padding: 10,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.35, shadowRadius: 0, elevation: 3,
    position: 'relative',
  },
  cardLocked: { opacity: 0.7 },
  equippedBadge: {
    position: 'absolute', top: 0, left: 0,
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 6, paddingVertical: 2,
    borderTopLeftRadius: 12, borderBottomRightRadius: 8,
  },
  equippedBadgeText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 7, color: Colors.onTertiary, letterSpacing: 0.5 },
  lockIcon: { position: 'absolute', top: 6, right: 6 },
  iconBox: {
    width: 56, height: 56,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginTop: 8, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.3, shadowRadius: 0,
  },
  iconEmoji: { fontSize: 28 },
  cardName: {
    fontFamily: 'BeVietnamPro_700Bold', fontSize: 10, color: Colors.onSurface,
    textAlign: 'center', lineHeight: 14, marginBottom: 6,
    minHeight: 28,
  },
  rarityPill: {
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 8,
  },
  rarityPillText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 7, letterSpacing: 0.5 },

  // Buttons
  buyBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 8, paddingVertical: 7,
    borderWidth: 2, borderColor: Colors.onPrimaryFixed,
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 2,
  },
  buyBtnNoFunds: { backgroundColor: Colors.surfaceContainerHigh, borderColor: Colors.surfaceVariant },
  buyBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: Colors.primary },
  ownedBtn: {
    width: '100%', backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 8, paddingVertical: 7, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.surfaceVariant,
  },
  ownedBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: Colors.onSurfaceVariant, textTransform: 'uppercase' },
  lockedBtn: {
    width: '100%', backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 8, paddingVertical: 7, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.surfaceVariant,
  },
  lockedBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9, color: Colors.error, textTransform: 'uppercase', letterSpacing: 0.3 },

  // States
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: Colors.onSurfaceVariant },
  emptyTitle: { fontFamily: 'FredokaOne_400Regular', fontSize: 20, color: Colors.onSurface },
  emptySub:   { fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 32 },
  emptyDBNote: {
    marginHorizontal: 16, marginTop: 12, padding: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  emptyDBText: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 18 },
});

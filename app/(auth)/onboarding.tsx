/**
 * onboarding.tsx
 * 3-step intro carousel shown after first login.
 * Matches the "Welcome Hero" bento mockup, adapted for mobile.
 * Each step is a full-screen card with hero image, gradient, content
 * and a step-progress bar. Bottom CTA: Skip Intro + Next/Start Quest.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, Image,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { requestNotificationPermission } from '../../utils/notificationService';

const { width: SCREEN_W } = Dimensions.get('window');

const SLIDES = [
  {
    step: 1,
    badge: '📋 LVL 01 QUEST',
    title: 'Accept Your\nQuests',
    titleAccent: null,
    body: 'Browse the daily board for habits that challenge you. From "Meditation Rituals" to "Iron Workouts", every action is a step toward glory.',
    progressPct: '33%',
    progressColor: Colors.primaryContainer,
    stepLabel: '01/03',
    stepColor: Colors.primary,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADxaOn9eghgGhTYMsn3IZ8peGz9cog6kuJMH6LpiSWZjbN_gnGk0uItj0UE0rJTeItPOyTA133pmy4jYuhjjrui5vWQ02nW2WyTn8-nFglaX1jIZdafO8QbnJM4VWMErF8AmchSk45F4JWYyY7Zk-CllFlBaSSTlvXQ2G-k5byM7X9gGHDeBUm26qYGyJ1RAqjOpvIeYApEvkD2N9q7DUiYrgECdoSAzqGdv73MG8B-99ay05qtLAv9AscIwTZ4bZCOw0t9TJXqqE',
  },
  {
    step: 2,
    badge: '⭐ XP & LOOT',
    title: 'Level Up &',
    titleAccent: 'Loot',
    body: 'Watch your XP bar grow as you complete tasks. Accumulate Gold Pieces to spend in the armory and unlock rare titles for your profile.',
    progressPct: '66%',
    progressColor: Colors.secondary,
    stepLabel: '02/03',
    stepColor: Colors.secondary,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDo2as0Df-E8f4uqJn0CWKOFu5HaaG6vFok3G_J9qarDlgrAm4nK7-Ql6zI10Yi2s-HB9YMe557qf1N0UEK61BKIj0JNbCZLyC3Vt8tyARI8yKKBJku6B7fe_yVzc62s_RgnMUVOvZ2BnX1FvUSbIvIukzzzk5weGw4etDpNb1NfNAwn0TgBiLlDOmDPiqTm1aEP-5pNbfE4h_e-gXIvMyVqtddET5mbTiERhWuTEd418yXOL1smbQs60vYw5PUOl36KDhWFyC1IBE',
  },
  {
    step: 3,
    badge: '🔥 ON SALE',
    title: 'Visit the',
    titleAccent: 'Armory',
    body: 'Use your hard-earned GP to buy cosmetic upgrades. Equip dragon-scale armor or a flaming sword to show off your dedication.',
    progressPct: '100%',
    progressColor: Colors.tertiary,
    stepLabel: '03/03',
    stepColor: Colors.primary,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbBIENhyMolPaRQQ9Z1avBX9dpZEgng3QuPVLbS7Q0sAf5TzdZ3cc8xzrEM-r_q2sX8fBkkGomPOI1Xf8NXO01Fd1LV3XiZSZ_0PuC9KWBLkb1a2C0WDnWaQeIG-5zVxiRFO7UgaGJkHCWdfhiYMenifRscBykEtvfveUR-ScsOuaFYe136HFgyswTwE0BPufig_HHP60FA4xerMOTRifCE3hI3XosCHGRo13-U8C7Zg982t5eHV0EB6MD2kHdrDI_vd7zTQ7WzfQ',
  },
];

export default function OnboardingScreen() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const finish = async () => {
    await requestNotificationPermission().catch(() => {});
    router.replace('/(tabs)');
  };

  const handleNext = async () => {
    if (isLast) { await finish(); }
    else { setCurrent(c => c + 1); }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>

      {/* ── HEADER ─────────────────────────────────── */}
      <View style={s.header}>
        <Text style={s.headerBrand}>Adventurer</Text>
        <View style={s.gpBadge}>
          <Text style={{ fontSize: 14 }}>🪙</Text>
          <Text style={s.gpText}>100 GP</Text>
        </View>
      </View>

      {/* ── HERO INTRO (only on first visit, slide 0) ── */}
      {current === 0 && (
        <Animated.View entering={FadeIn.duration(500)} style={s.heroIntro}>
          <View style={s.welcomeBadge}>
            <Text style={s.welcomeBadgeText}>⚔️ Welcome Hero</Text>
          </View>
          <Text style={s.heroTitle}>
            Master Your Daily{' '}
            <Text style={s.heroTitleAccent}>Quests</Text>
          </Text>
          <Text style={s.heroSub}>
            Turn your daily habits into a high-stakes adventure. Earn XP, collect gold, and customize your legend.
          </Text>
        </Animated.View>
      )}

      {/* ── SLIDE CARD ───────────────────────────────── */}
      <Animated.View
        key={current}
        entering={SlideInRight.duration(320)}
        exiting={SlideOutLeft.duration(220)}
        style={s.card}
      >
        {/* Image section */}
        <View style={s.imageWrap}>
          <Image source={{ uri: slide.image }} style={s.image} resizeMode="cover" />
          {/* Bottom gradient overlay */}
          <View style={s.imageOverlay} />
          {/* Bottom row inside image */}
          <View style={s.imageFooter}>
            <View style={s.imageBadge}>
              <Text style={s.imageBadgeText}>{slide.badge}</Text>
            </View>
          </View>
        </View>

        {/* Content section */}
        <View style={s.cardContent}>
          <Text style={s.cardTitle}>
            {slide.title}
            {slide.titleAccent
              ? <Text style={[s.cardTitle, { color: slide.progressColor }]}>{' '}{slide.titleAccent}</Text>
              : null
            }
          </Text>
          <Text style={s.cardBody}>{slide.body}</Text>

          {/* Step progress bar */}
          <View style={s.stepRow}>
            <View style={s.stepTrack}>
              <View style={[s.stepFill, { width: slide.progressPct, backgroundColor: slide.progressColor }]} />
            </View>
            <Text style={[s.stepLabel, { color: slide.stepColor }]}>{slide.stepLabel}</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── BOTTOM CTA ───────────────────────────────── */}
      <View style={s.cta}>
        {/* Navigation dots */}
        <View style={s.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setCurrent(i)} activeOpacity={0.8}>
              <View style={[s.dot, i === current && s.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.ctaHint}>Ready to begin your journey, Adventurer?</Text>

        <View style={s.ctaButtons}>
          <TouchableOpacity style={s.skipBtn} onPress={finish} activeOpacity={0.8}>
            <Text style={s.skipBtnText}>Skip Intro</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.startBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={s.startBtnText}>
              {isLast ? 'START THE QUEST' : `NEXT →`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 4,
    borderBottomColor: Colors.surfaceContainerLow,
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
  },
  headerBrand: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22,
    color: Colors.primaryContainer,
    letterSpacing: -0.5,
  },
  gpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 2, borderColor: Colors.outlineVariant,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  gpText: { fontFamily: 'FredokaOne_400Regular', fontSize: 15, color: Colors.onSurface },

  // Hero intro (slide 0 only)
  heroIntro: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  welcomeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 3,
  },
  welcomeBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11,
    color: Colors.onPrimaryFixed, textTransform: 'uppercase', letterSpacing: 1.5,
  },
  heroTitle: {
    fontFamily: 'FredokaOne_400Regular', fontSize: 30, color: Colors.onSurface, lineHeight: 38, marginBottom: 8,
  },
  heroTitleAccent: { color: Colors.secondary },
  heroSub: {
    fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 20,
  },

  // Card
  card: {
    flex: 1,
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, borderWidth: 2, borderColor: Colors.outlineVariant,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 8, height: 8 }, shadowOpacity: 0.5, shadowRadius: 0, elevation: 6,
  },
  imageWrap: { height: '55%', position: 'relative', backgroundColor: Colors.surfaceContainerHighest },
  image: { width: '100%', height: '100%', opacity: 0.85 },
  imageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
    backgroundColor: Colors.surfaceContainerLow + 'cc',
  },
  imageFooter: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center',
  },
  imageBadge: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  imageBadgeText: { fontFamily: 'FredokaOne_400Regular', fontSize: 12, color: Colors.tertiary },

  cardContent: { flex: 1, padding: 18, justifyContent: 'space-between' },
  cardTitle: {
    fontFamily: 'FredokaOne_400Regular', fontSize: 28, color: Colors.onSurface, lineHeight: 34, marginBottom: 8,
  },
  cardBody: {
    fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 20, flex: 1,
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12,
  },
  stepTrack: {
    flex: 1, height: 6, backgroundColor: Colors.surfaceContainerLowest, borderRadius: 3, overflow: 'hidden',
  },
  stepFill: { height: '100%', borderRadius: 3 },
  stepLabel: { fontFamily: 'FredokaOne_400Regular', fontSize: 11 },

  // CTA
  cta: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
    borderTopWidth: 4, borderTopColor: Colors.surfaceContainerHighest,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 4,
    gap: 12,
  },
  dotsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  dotActive: { width: 28, borderRadius: 5, backgroundColor: Colors.primaryContainer },
  ctaHint: {
    fontFamily: 'BeVietnamPro_400Regular', fontSize: 12,
    color: Colors.onSurfaceVariant, textAlign: 'center',
  },
  ctaButtons: { flexDirection: 'row', gap: 10 },
  skipBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12, borderWidth: 2, borderColor: Colors.outlineVariant,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 2,
  },
  skipBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: Colors.onSurface,
  },
  startBtn: {
    flex: 2, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryContainer,
    borderRadius: 12, borderWidth: 2, borderColor: Colors.onPrimaryFixed,
    shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 0.5, shadowRadius: 0, elevation: 5,
  },
  startBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 14,
    color: Colors.primary, letterSpacing: 1, textTransform: 'uppercase',
  },
});

/**
 * GameSplash.tsx
 * Animated splash/loading screen shown while fonts & auth load.
 * Matches the QuestHabit splash mockup:
 *  - Ambient glow
 *  - Shield icon with pixel border
 *  - Animated segmented XP bar
 *  - "LOADING QUEST..." label
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
} from 'react-native';
import { Colors } from '../constants/Colors';

const SEGMENTS = 8;

export default function GameSplash() {
  // Glow pulse
  const glowAnim   = useRef(new Animated.Value(0)).current;
  // Icon scale entrance
  const iconScale  = useRef(new Animated.Value(0.7)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  // Title / subtitle entrance
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(12)).current;
  // XP bar progress (0 → ~0.84)
  const barProgress = useRef(new Animated.Value(0)).current;
  // Status text flicker
  const statusOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();

    // Icon entrance
    Animated.parallel([
      Animated.spring(iconScale,   { toValue: 1,    useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(iconOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Title entrance (delayed)
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    // XP bar fill (delayed, slow for cinematic feel)
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(barProgress, {
        toValue: 0.84,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,  // width animation needs JS driver
      }),
    ]).start();

    // Status text flicker loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(statusOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(statusOpacity, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.22] });
  const barPct      = barProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const barPercText = barProgress.interpolate({
    inputRange: [0, 0.84],
    outputRange: ['0%', '84%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={s.root}>

      {/* ── AMBIENT GLOW ────────────────────────────── */}
      <Animated.View style={[s.glow, { opacity: glowOpacity }]} />
      <View style={[s.glowSecondary]} />

      {/* ── ICON ─────────────────────────────────────── */}
      <Animated.View style={{ transform: [{ scale: iconScale }], opacity: iconOpacity, marginBottom: 24 }}>
        <View style={s.iconGlow} />
        <View style={s.iconBox}>
          <Text style={s.iconEmoji}>🛡️</Text>
          <View style={s.iconInnerBadge}>
            <Text style={s.iconCheck}>✓</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── TITLE / SUBTITLE ─────────────────────────── */}
      <Animated.View style={[s.titleWrap, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
        <Text style={s.title}>QuestHabit</Text>
        <Text style={s.subtitle}>LEVEL UP YOUR LIFE</Text>
      </Animated.View>

      {/* ── XP LOADING BAR ───────────────────────────── */}
      <View style={s.barSection}>
        <Animated.View style={s.barLabelRow}>
          <Animated.Text style={[s.barLabel, { opacity: statusOpacity }]}>
            LOADING QUEST...
          </Animated.Text>
          <Text style={s.barPct}>84%</Text>
        </Animated.View>

        {/* Segmented bar */}
        <View style={s.barTrack}>
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <View key={i} style={s.barSegmentGap}>
              <Animated.View
                style={[
                  s.barSegment,
                  {
                    width: barPct,
                    opacity: barProgress.interpolate({
                      inputRange: [i / SEGMENTS, (i + 0.5) / SEGMENTS],
                      outputRange: [0, 1],
                      extrapolate: 'clamp',
                    }),
                    backgroundColor: i >= 6 ? Colors.tertiary + '88' : Colors.tertiary,
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <Animated.Text style={[s.statusText, { opacity: statusOpacity }]}>
          Initializing world parameters • Fetching player stats
        </Animated.Text>
      </View>

      {/* ── CORNER ACCENTS ───────────────────────────── */}
      <View style={s.versionBox}>
        <Text style={s.versionLabel}>BUILD VERSION</Text>
        <Text style={s.versionValue}>v2.4.0-LEGENDARY</Text>
      </View>

      <View style={s.seedBox}>
        <Text style={s.seedLabel}>WORLD SEED</Text>
        <Text style={s.seedValue}>0x7C3AED_X_0B1326</Text>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Ambient glows
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: Colors.primaryContainer,
    alignSelf: 'center',
  },
  glowSecondary: {
    position: 'absolute',
    top: '20%',
    left: '15%',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.secondary + '08',
  },

  // Icon
  iconGlow: {
    position: 'absolute',
    inset: 0,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryContainer,
    opacity: 0.3,
    alignSelf: 'center',
    top: 0,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 4,
    borderColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 0,
    elevation: 8,
    position: 'relative',
  },
  iconEmoji: { fontSize: 52 },
  iconInnerBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  iconCheck: { fontSize: 12, color: Colors.onTertiary, fontWeight: '900' },

  // Title
  titleWrap: { alignItems: 'center', marginBottom: 40 },
  title: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 52,
    color: Colors.onSurface,
    letterSpacing: 0.5,
    textShadowColor: Colors.primaryContainer,
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: Colors.secondary,
    letterSpacing: 4,
    marginTop: 6,
    opacity: 0.85,
  },

  // XP Bar
  barSection: { width: '100%', maxWidth: 380, gap: 10 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barLabel: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 16,
    color: Colors.tertiary,
    letterSpacing: 1,
  },
  barPct: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  barTrack: {
    height: 36,
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 4,
    borderColor: Colors.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 4,
    overflow: 'hidden',
  },
  barSegmentGap: {
    flex: 1,
    borderRightWidth: 3,
    borderRightColor: Colors.surfaceContainerLowest,
    overflow: 'hidden',
  },
  barSegment: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  statusText: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 9,
    color: Colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 4,
  },

  // Corner accents
  versionBox: {
    position: 'absolute',
    bottom: 40,
    left: 28,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
    paddingLeft: 10,
  },
  versionLabel: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 8, color: Colors.secondaryFixedDim, textTransform: 'uppercase', letterSpacing: 1 },
  versionValue: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  seedBox: { position: 'absolute', bottom: 40, right: 28, alignItems: 'flex-end' },
  seedLabel: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 8, color: Colors.onSurfaceVariant + '55', textTransform: 'uppercase', letterSpacing: 1.5 },
  seedValue: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, color: Colors.onSurfaceVariant + '55', marginTop: 2 },
});

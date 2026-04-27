import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface Props {
  visible: boolean;
  xp: number;
  gp: number;
  onHide: () => void;
}

/**
 * QuestCompleteToast
 * Slides up from the bottom of the screen and fades out after 2s,
 * showing the XP and GP earned from completing a quest.
 */
export default function QuestCompleteToast({ visible, xp, gp, onHide }: Props) {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Reset
    translateY.setValue(80);
    opacity.setValue(0);

    Animated.sequence([
      // Slide up + fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      // Hold
      Animated.delay(1600),
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        s.toast,
        { transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <View style={s.inner}>
        <Text style={s.icon}>⚔️</Text>
        <View>
          <Text style={s.title}>Quest Complete!</Text>
          <View style={s.rewards}>
            <View style={s.xpBadge}>
              <Text style={s.xpText}>+{xp} XP</Text>
            </View>
            <View style={s.gpBadge}>
              <Text style={s.gpText}>+{gp} GP</Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    zIndex: 999,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.tertiary + '88',
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 10,
  },
  icon: { fontSize: 26 },
  title: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 16,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  rewards: { flexDirection: 'row', gap: 6 },
  xpBadge: {
    backgroundColor: Colors.secondary + '33',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  xpText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: Colors.secondary,
  },
  gpBadge: {
    backgroundColor: Colors.tertiary + '33',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  gpText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: Colors.tertiary,
  },
});

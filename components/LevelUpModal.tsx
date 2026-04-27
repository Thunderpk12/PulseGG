import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Easing, Dimensions,
} from 'react-native';
import { Colors } from '../constants/Colors';

interface LevelUpModalProps {
  visible: boolean;
  newLevel: number;
  title: string;
  onClose: () => void;
}

const { width } = Dimensions.get('window');
const NUM_RAYS = 12;

export default function LevelUpModal({ visible, newLevel, title, onClose }: LevelUpModalProps) {
  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim    = useRef(new Animated.Value(0)).current;
  const starAnim    = useRef(new Animated.Value(0)).current;
  const rayAnim     = useRef(new Animated.Value(0)).current;
  const raysOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset all
      [scaleAnim, opacityAnim, glowAnim, starAnim, rayAnim, raysOpacity].forEach(a => a.setValue(0));

      // Main entrance sequence
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim,   { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      ]).start();

      // Rays: fade in then spin forever
      Animated.timing(raysOpacity, { toValue: 1, duration: 400, delay: 300, useNativeDriver: true }).start();
      Animated.loop(
        Animated.timing(rayAnim, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
      ).start();

      // Glow pulse loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

      // Stars spin (dot ring)
      Animated.loop(
        Animated.timing(starAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
      ).start();
    }
  }, [visible]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] });
  const starRotate  = starAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rayRotate   = rayAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.backdrop, { opacity: opacityAnim }]}>
        <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* ── Light Rays ── */}
          <Animated.View
            style={[
              s.raysContainer,
              { opacity: raysOpacity, transform: [{ rotate: rayRotate }] },
            ]}
            pointerEvents="none"
          >
            {Array.from({ length: NUM_RAYS }).map((_, i) => (
              <View
                key={i}
                style={[
                  s.ray,
                  {
                    transform: [
                      { rotate: `${(360 / NUM_RAYS) * i}deg` },
                      { translateY: -90 },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* Pulsing glow ring */}
          <Animated.View style={[s.glowRing, { opacity: glowOpacity }]} />

          {/* Spinning star dot ring */}
          <Animated.View style={[s.starRing, { transform: [{ rotate: starRotate }] }]}>
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  s.starDot,
                  { transform: [{ rotate: `${i * 45}deg` }, { translateY: -60 }] },
                ]}
              />
            ))}
          </Animated.View>

          {/* Content */}
          <Text style={s.badge}>LEVEL UP!</Text>

          <View style={s.levelCircle}>
            <Text style={s.levelNumber}>{newLevel}</Text>
          </View>

          <Text style={s.titleText}>{title}</Text>
          <Text style={s.subText}>
            You've reached Level {newLevel} and earned a new title!
          </Text>

          <TouchableOpacity style={s.btn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.btnText}>CONTINUE ADVENTURE</Text>
          </TouchableOpacity>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}


const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  card: {
    width: Math.min(width - 48, 360),
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.secondary,
    padding: 32,
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
    overflow: 'visible',
  },

  glowRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.secondary,
  },

  starRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },

  badge: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 12,
    color: Colors.secondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 16,
    backgroundColor: Colors.secondary + '22',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.secondary + '55',
    overflow: 'hidden',
  },

  levelCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryContainer,
    borderWidth: 4,
    borderColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  levelNumber: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 48,
    color: Colors.secondary,
    lineHeight: 56,
  },

  titleText: {
    fontFamily: 'FredokaOne_400Regular',
    fontSize: 22,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },

  subText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },

  btn: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: Colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 5,
  },
  btnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13,
    color: Colors.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

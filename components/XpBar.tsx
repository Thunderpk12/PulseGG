import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface XpBarProps {
  currentXp: number;
  maxXp: number;
}

export function XpBar({ currentXp, maxXp }: XpBarProps) {
  const progress = maxXp === 0 ? 0 : Math.min(Math.max(currentXp / maxXp, 0), 1) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={styles.label}>XP</Text>
        <Text style={styles.value}>{currentXp} / {maxXp}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    color: Colors.onSurface,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  track: {
    height: 10,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primaryContainer,
    borderRadius: 5,
  },
});

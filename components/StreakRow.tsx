import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface StreakRowProps {
  streakDays: number;
}

export function StreakRow({ streakDays }: StreakRowProps) {
  const isActive = streakDays > 0;
  return (
    <View style={styles.row}>
      <Text style={[styles.flame, !isActive && styles.inactive]}>🔥</Text>
      <Text style={[styles.count, isActive ? styles.active : styles.muted]}>
        {streakDays} Days
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flame: { fontSize: 18 },
  inactive: { opacity: 0.4 },
  count: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  active: { color: Colors.error },
  muted: { color: Colors.onSurfaceVariant },
});

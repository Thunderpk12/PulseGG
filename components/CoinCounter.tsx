import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface CoinCounterProps {
  coins: number;
}

export function CoinCounter({ coins }: CoinCounterProps) {
  return (
    <View style={styles.pill}>
      <Text style={styles.icon}>💰</Text>
      <Text style={styles.count}>{coins}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: Colors.secondary,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: Colors.surfaceContainerLowest,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 2,
  },
  icon: { fontSize: 16 },
  count: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: Colors.secondary,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface QuestCardProps {
  title: string;
  category: string;
  difficulty: string;
  xpReward: number;
  coinReward: number;
  isCompleted: boolean;
  onComplete: () => void;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  easy: { bg: Colors.tertiaryContainer, text: Colors.tertiary, border: Colors.tertiary },
  medium: { bg: Colors.secondaryContainer, text: Colors.onSecondaryFixed, border: Colors.secondary },
  hard: { bg: Colors.errorContainer, text: Colors.error, border: Colors.error },
};

const DIFFICULTY_ICONS: Record<string, string> = {
  easy: '🌿',
  medium: '⚡',
  hard: '💀',
};

export function QuestCard({ title, category, difficulty, xpReward, coinReward, isCompleted, onComplete }: QuestCardProps) {
  const diff = difficulty.toLowerCase();
  const theme = DIFFICULTY_COLORS[diff] ?? DIFFICULTY_COLORS.easy;
  const icon = DIFFICULTY_ICONS[diff] ?? '⭐';

  return (
    <View style={[styles.card, isCompleted && styles.cardDone]}>
      {/* Difficulty icon box */}
      <View style={[styles.iconBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, isCompleted && styles.titleDone]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.category}>{category.toUpperCase()}</Text>
          <View style={styles.reward}>
            <Text style={styles.xpText}>⭐ {xpReward} XP</Text>
          </View>
          <View style={styles.reward}>
            <Text style={styles.coinText}>💰 {coinReward}</Text>
          </View>
        </View>
      </View>

      {/* Complete button */}
      <TouchableOpacity
        onPress={isCompleted ? undefined : onComplete}
        disabled={isCompleted}
        style={[styles.completeBtn, isCompleted && styles.completeBtnDone]}
        activeOpacity={0.75}
      >
        <Text style={styles.completeBtnText}>
          {isCompleted ? '✓' : '○'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.surfaceContainerHighest,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    shadowColor: Colors.surfaceContainerLowest,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 4,
  },
  cardDone: {
    opacity: 0.55,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: { fontSize: 22 },
  content: { flex: 1 },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: Colors.onSurfaceVariant,
  },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  category: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    color: Colors.outline,
    letterSpacing: 1,
  },
  reward: { flexDirection: 'row', alignItems: 'center' },
  xpText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.primary,
  },
  coinText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.secondary,
  },
  completeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  completeBtnDone: {
    backgroundColor: Colors.tertiaryContainer,
    borderColor: Colors.tertiary,
  },
  completeBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: Colors.tertiary,
  },
});

/**
 * gamification.ts
 * Pure business-logic functions — no UI, no Supabase calls.
 * All functions are deterministic and easily testable.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

// ──────────────────────────────────────────────
// XP / Levelling
// ──────────────────────────────────────────────

/**
 * Returns the total XP required to reach `level` from level 1.
 * Formula: 100 * level^1.5 (rounded)
 */
export function xpThresholdForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

/**
 * Returns the XP needed to advance from the current level to the next.
 */
export function xpForNextLevel(currentLevel: number): number {
  return xpThresholdForLevel(currentLevel + 1) - xpThresholdForLevel(currentLevel);
}

/**
 * Returns the XP the player has within their current level band
 * (i.e. progress toward the next level, not cumulative).
 */
export function xpWithinCurrentLevel(totalXp: number, currentLevel: number): number {
  return totalXp - xpThresholdForLevel(currentLevel);
}

export interface XpGainResult {
  newTotalXp: number;
  newLevel: number;
  leveledUp: boolean;
  /** Level-ups that happened in one go (e.g. caught up after offline period) */
  levelsGained: number;
}

/**
 * Applies an XP gain to a player's current state.
 * Handles multi-level-ups correctly.
 */
export function applyXpGain(
  currentTotalXp: number,
  currentLevel: number,
  xpGained: number
): XpGainResult {
  const newTotalXp = currentTotalXp + xpGained;
  let newLevel = currentLevel;

  while (newTotalXp >= xpThresholdForLevel(newLevel + 1)) {
    newLevel += 1;
  }

  const levelsGained = newLevel - currentLevel;
  return {
    newTotalXp,
    newLevel,
    leveledUp: levelsGained > 0,
    levelsGained,
  };
}

// ──────────────────────────────────────────────
// Streaks
// ──────────────────────────────────────────────

export interface StreakUpdateResult {
  newStreak: number;
  streakBroken: boolean;
  streakExtended: boolean;
}

/**
 * Calculates the new streak given the last active date and today's date.
 * - Same day → no change (already counted)
 * - Yesterday → streak continues (+1)
 * - Before yesterday → streak reset to 1
 */
export function calculateStreakUpdate(
  lastActive: Date | null,
  today: Date = new Date()
): StreakUpdateResult {
  if (!lastActive) {
    return { newStreak: 1, streakBroken: false, streakExtended: true };
  }

  // Normalise to midnight UTC to avoid timezone edge cases
  const todayMidnight = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const lastMidnight = new Date(
    Date.UTC(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate())
  );

  const diffDays = Math.round(
    (todayMidnight.getTime() - lastMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    // Already active today
    return { newStreak: 0, streakBroken: false, streakExtended: false };
  } else if (diffDays === 1) {
    // Consecutive day
    return { newStreak: 1, streakBroken: false, streakExtended: true };
  } else {
    // Streak broken
    return { newStreak: 1, streakBroken: true, streakExtended: false };
  }
}

// ──────────────────────────────────────────────
// Boss Damage
// ──────────────────────────────────────────────

const BOSS_DAMAGE_MAP: Record<Difficulty, number> = {
  easy: 5,
  medium: 15,
  hard: 30,
};

/**
 * Returns the amount of damage a habit completion deals to the weekly boss.
 */
export function getBossDamage(difficulty: string): number {
  return BOSS_DAMAGE_MAP[(difficulty.toLowerCase() as Difficulty)] ?? 5;
}

// ──────────────────────────────────────────────
// Rewards
// ──────────────────────────────────────────────

const XP_REWARD_MAP: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
};

const COIN_REWARD_MAP: Record<Difficulty, number> = {
  easy: 3,
  medium: 7,
  hard: 15,
};

export function defaultXpReward(difficulty: string): number {
  return XP_REWARD_MAP[(difficulty.toLowerCase() as Difficulty)] ?? 10;
}

export function defaultCoinReward(difficulty: string): number {
  return COIN_REWARD_MAP[(difficulty.toLowerCase() as Difficulty)] ?? 3;
}

// ──────────────────────────────────────────────
// Level Titles
// ──────────────────────────────────────────────

const LEVEL_TITLES: Array<{ minLevel: number; title: string }> = [
  { minLevel: 1, title: 'Novice Explorer' },
  { minLevel: 5, title: 'Apprentice Adventurer' },
  { minLevel: 10, title: 'Seasoned Wanderer' },
  { minLevel: 15, title: 'Veteran Quester' },
  { minLevel: 20, title: 'Elite Champion' },
  { minLevel: 30, title: 'Legendary Hero' },
  { minLevel: 50, title: 'Mythic Ascendant' },
];

export function getTitleForLevel(level: number): string {
  let title = LEVEL_TITLES[0].title;
  for (const entry of LEVEL_TITLES) {
    if (level >= entry.minLevel) {
      title = entry.title;
    }
  }
  return title;
}

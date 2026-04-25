# QuestHabit — Gamified Habit Tracker

> A mobile and web application that transforms daily habits into a role-playing game experience. Users complete quests, earn XP and gold, progress through character levels, and engage with weekly boss encounters.

---

## Overview

QuestHabit is a gamified habit tracker built with React Native and Expo. Every habit is represented as a quest with configurable difficulty, XP rewards, and gold coin payouts. Consistent daily completion grows a streak counter, levels up the user's character, and contributes damage to a shared weekly boss.

### Core Features

| Feature | Description |
|---|---|
| **Quest Board** | Create and complete daily or weekly habits with Easy, Medium, or Hard difficulty |
| **Hero Profile** | XP bar, level, streak counter, title badge, and GP balance — all driven by live data |
| **Weekly Boss** | A shared boss with real-time HP that decreases as quests are completed |
| **Hero's Shop** | Spend GP on icons, titles, and profile themes across rarity tiers |
| **Achievements** | Unlock badges based on measurable progress (level, streak, GP earned) |
| **Reminders** | Schedule local push notifications for individual quests |
| **Authentication** | Email and Google OAuth via Supabase, with automatic profile creation on signup |

---

## Tech Stack

### Frontend

| Technology | Role |
|---|---|
| **React Native** (0.81) | Core mobile framework |
| **Expo** (SDK 52) + **Expo Router** | File-based navigation targeting web, iOS, and Android |
| **TypeScript** | Type safety across all layers |
| **React Native StyleSheet** | Application styling (migrated away from NativeWind for web compatibility) |
| **Reanimated 3** | Entrance animations and slide transitions |
| **React Native Animated** | Splash screen XP bar and glow pulse animations |
| **Expo Google Fonts** | Plus Jakarta Sans, Fredoka One, Be Vietnam Pro, Nunito |
| **Safe Area Context** | Correct insets across all device sizes |

### Backend and Data

| Technology | Role |
|---|---|
| **Supabase** | PostgreSQL database, authentication, and real-time subscriptions |
| **Supabase Auth** | Email/password and Google OAuth |
| **PostgreSQL Triggers** | `handle_new_user` — automatically creates a profile row on signup (SECURITY DEFINER) |
| **Supabase RLS** | Row-level security policies applied per table |
| **Supabase Realtime** | Live boss HP updates and quest completion sync |

### State Management

| Technology | Role |
|---|---|
| **Zustand** | Lightweight stores: `authStore`, `playerStore`, `questStore`, `bossStore` |

### Notifications

| Technology | Role |
|---|---|
| **Expo Notifications** | Local push notifications for habit reminders |

---

## Project Structure

```
AdventurerApp/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx          # Login and registration screen
│   │   └── onboarding.tsx     # 3-step intro carousel (shown post-login)
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Custom gamified tab bar with FAB
│   │   ├── index.tsx          # Home / Dashboard
│   │   ├── quests.tsx         # Quest board with filters
│   │   ├── shop.tsx           # Hero's Shop (3-column grid)
│   │   └── profile.tsx        # Player profile and achievements
│   ├── _layout.tsx            # Root layout: font loading and auth routing
│   └── new-quest.tsx          # New Quest modal
├── components/
│   └── GameSplash.tsx         # Animated loading splash screen
├── constants/
│   └── Colors.ts              # Design token system (Material You dark theme)
├── store/
│   ├── authStore.ts           # Session state
│   ├── playerStore.ts         # XP, level, coins, and streak
│   ├── questStore.ts          # Habits and real-time completions
│   └── bossStore.ts           # Weekly boss HP and real-time subscription
├── utils/
│   ├── habitService.ts        # Supabase data access layer
│   ├── gamification.ts        # XP, level, streak, and boss damage logic
│   ├── notificationService.ts # Local notification helpers
│   └── supabase.ts            # Supabase client configuration
├── supabase_setup.sql         # Full database setup: tables, RLS, trigger, and seed data
└── run_migrations.js          # Script to apply migrations via the Supabase API
```

---

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo>
cd AdventurerApp
npm install
```

### 2. Configure Environment

Create a `.env` file at the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Set Up the Database

Open the [Supabase SQL Editor](https://supabase.com/dashboard) for your project and paste the contents of `supabase_setup.sql`. This creates:

- All tables (`profiles`, `habits`, `habit_completions`, `shop_items`, etc.)
- RLS policies
- Auto-profile trigger (`handle_new_user`)
- `complete_habit` RPC function
- Shop item seed data (24 items)
- A weekly boss for the current week

> **Note:** In the Supabase dashboard, navigate to **Authentication > Providers > Email** and disable **"Confirm email"** for local development.

### 4. Run the App

```bash
# Web
node node_modules/@expo/cli/build/bin/cli start --web

# iOS
npx expo run:ios

# Android
npx expo run:android
```

---

## Design System

All colors are defined in a Material You dark theme in `constants/Colors.ts`:

| Token | Value | Usage |
|---|---|---|
| `surface` | `#0b1326` | Application background |
| `primaryContainer` | `#7c3aed` | Buttons and active states |
| `primary` | `#d2bbff` | Text on dark surfaces |
| `secondary` | `#ffe083` | Gold and XP indicators |
| `tertiary` | `#4de082` | Success states |
| `error` | `#ffb4ab` | Boss HP bar and warnings |

UI components use pixel-style shadows (`shadowOffset: { width: 4, height: 4 }, shadowRadius: 0`) to reinforce the retro RPG aesthetic.

---

## License

MIT

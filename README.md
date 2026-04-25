# ⚔️ QuestHabit — Level Up Your Life

> Turn your daily habits into an epic RPG adventure. Complete quests, earn XP and gold, fight weekly bosses, and customize your hero.

---

## 📖 What is QuestHabit?

QuestHabit is a **gamified habit tracker** built for mobile and web. Instead of boring checkboxes, every habit becomes a **quest** with difficulty levels, XP rewards, and gold coins. As you complete quests daily, your character levels up, your streak grows, and you deal damage to a shared **weekly boss**.

### Core Features

| Feature | Description |
|---|---|
| ⚔️ **Quest Board** | Create and complete daily/weekly habits with Easy / Medium / Hard difficulty |
| 🧙 **Hero Profile** | XP bar, level, streak, title badge, and GP balance — all driven by real data |
| 🐉 **Weekly Boss** | A shared boss with real-time HP — completing quests deals damage |
| 🛒 **Hero's Shop** | Spend GP on icons, titles, and profile themes — with rarity tiers |
| 🏅 **Achievements** | Unlock badges based on real progress (level, streak, GP earned) |
| 🔔 **Reminders** | Schedule local notifications for any quest |
| 🔐 **Auth** | Email + Google OAuth via Supabase — auto-profile creation on signup |

---

## 🛠 Tech Stack

### Frontend
| Technology | Role |
|---|---|
| **React Native** (0.81) | Core mobile framework |
| **Expo** (SDK 52) + **Expo Router** | File-based navigation, web + iOS + Android |
| **TypeScript** | Type safety across all layers |
| **React Native StyleSheet** | All styling (migrated away from NativeWind for web compatibility) |
| **Reanimated 3** | Entrance animations, slide transitions |
| **React Native Animated** | Splash screen XP bar, glow pulse animations |
| **Expo Google Fonts** | Plus Jakarta Sans · Fredoka One · Be Vietnam Pro · Nunito |
| **Safe Area Context** | Proper insets on all devices |

### Backend & Data
| Technology | Role |
|---|---|
| **Supabase** | PostgreSQL database, Auth, real-time subscriptions |
| **Supabase Auth** | Email/password + Google OAuth |
| **PostgreSQL Triggers** | `handle_new_user` — auto-creates profile row on signup (SECURITY DEFINER) |
| **Supabase RLS** | Row-level security policies per table |
| **Supabase Realtime** | Live boss HP updates + quest completion sync |

### State Management
| Technology | Role |
|---|---|
| **Zustand** | Lightweight stores: `authStore`, `playerStore`, `questStore`, `bossStore` |

### Notifications
| Technology | Role |
|---|---|
| **Expo Notifications** | Local push notifications for habit reminders |

---

## 📁 Project Structure

```
AdventurerApp/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx          # Login + Register screen
│   │   └── onboarding.tsx     # 3-step intro carousel (post-login)
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Custom gamified tab bar + FAB
│   │   ├── index.tsx          # Home / Dashboard
│   │   ├── quests.tsx         # Quest board with filters
│   │   ├── shop.tsx           # Hero's Shop (3-column grid)
│   │   └── profile.tsx        # Player profile + achievements
│   ├── _layout.tsx            # Root layout, font loading, auth routing
│   └── new-quest.tsx          # New Quest modal
├── components/
│   └── GameSplash.tsx         # Animated loading splash screen
├── constants/
│   └── Colors.ts              # Design token system (Material You dark theme)
├── store/
│   ├── authStore.ts           # Session state
│   ├── playerStore.ts         # XP, level, coins, streak
│   ├── questStore.ts          # Habits + real-time completions
│   └── bossStore.ts           # Weekly boss HP + real-time subscription
├── utils/
│   ├── habitService.ts        # Supabase data access layer
│   ├── gamification.ts        # XP/level/streak/boss damage logic
│   ├── notificationService.ts # Local notification helpers
│   └── supabase.ts            # Supabase client
├── supabase_setup.sql         # Full DB setup: tables, RLS, trigger, seed data
└── run_migrations.js          # Script to apply migrations via Supabase API
```

---

## 🚀 Getting Started

### 1. Clone & Install

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

Open the **[Supabase SQL Editor](https://supabase.com/dashboard)** for your project and paste the contents of `supabase_setup.sql`. This creates:

- All tables (`profiles`, `habits`, `habit_completions`, `shop_items`, etc.)
- RLS policies
- Auto-profile trigger (`handle_new_user`)
- `complete_habit` RPC function
- Shop item seed data (24 items)
- A weekly boss for the current week

> ⚠️ Also go to **Authentication → Providers → Email** and disable **"Confirm email"** for development.

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

## 🎨 Design System

All colors come from a **Material You** dark theme defined in `constants/Colors.ts`:

| Token | Value | Use |
|---|---|---|
| `surface` | `#0b1326` | App background |
| `primaryContainer` | `#7c3aed` | Buttons, active states |
| `primary` | `#d2bbff` | Text on dark surfaces |
| `secondary` | `#ffe083` | Gold / XP indicators |
| `tertiary` | `#4de082` | Green / success states |
| `error` | `#ffb4ab` | Boss HP, warnings |

All UI uses **pixel-style shadows** (`shadowOffset: { width: 4, height: 4 }, shadowRadius: 0`) to match the retro RPG aesthetic.

---

## 📄 License

MIT — build your own adventure.

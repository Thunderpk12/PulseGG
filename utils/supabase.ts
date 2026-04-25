import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key';

/**
 * A no-op storage adapter used during Node.js SSR/static rendering.
 * Supabase initialises auth synchronously at module-load time, which triggers
 * AsyncStorage.getItem → window.localStorage → crashes in Node.js.
 * Returning null from getItem means "no stored session", which is correct for SSR.
 */
const SSR_NO_OP_STORAGE = {
  getItem: (_key: string): Promise<string | null> => Promise.resolve(null),
  setItem: (_key: string, _value: string): Promise<void> => Promise.resolve(),
  removeItem: (_key: string): Promise<void> => Promise.resolve(),
};

/**
 * Returns the right storage adapter depending on environment:
 * - Node.js SSR  → no-op (window does not exist)
 * - Web browser  → undefined (Supabase defaults to localStorage, which is safe)
 * - Native       → AsyncStorage (dynamic require avoids SSR evaluation)
 */
function getStorage() {
  // typeof window check detects SSR / Node.js render
  if (typeof window === 'undefined') {
    return SSR_NO_OP_STORAGE;
  }
  if (Platform.OS === 'web') {
    // Running in a real browser — let Supabase use localStorage by default
    return undefined;
  }
  // Native (iOS / Android)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@react-native-async-storage/async-storage').default;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

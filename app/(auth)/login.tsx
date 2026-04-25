import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');
const isWide = width >= 768;

const HERO_WARRIOR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDW8FoBrNjC7PEXLdk6ZLV1VrokZeiki_gwUQHm-dd0fFEwcOq7Nr3VHOLRXSUFXWPe1LtGKUAZaSOB7atAWxke-YYI2_Q-PEZhr1apIIqLkxmGiXyELgn43a2hvtdfoLuvgRO1veRz199fZybmV3jHi_3_Ed_Tfevv3CaZH38JbTFsK7_pNrzGUwzagUmviQjiHFV6zInVQb7WPdXX_YxZJgNmpwuUfD6bKomOgd0UXALXiC1kqXiq90rj57ue81Pbo1I77gztXu4';
const GOOGLE_LOGO = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDleNRLWuD625PSeTqo6JYrATKWedsETM5uDoptRyqZVhJaDFX89lmorskzNpcnENd4rkyT8rbWs7_HGdZlUsb7e9gQX5FPq_rkw4sNrArlP3H6YwTVGlZTSDo4Q69oG-3QuSwIiXm9j-_M0MZVoE1rN9ga7HNYsui2etNWI_rl_SJNGY9V2kboDS6ZQo9gueDa6q3ZYpJA3OBQ0MFDjuwgrEULqr_Bgbws4zcYedTKfISRQzikxMA9e2J05wRUdUwPhJz-uwH-a14';

type Tab = 'login' | 'register';

export default function LoginScreen() {
  const [tab, setTab]           = useState<Tab>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const clearMessages = () => { setError(null); setSuccessMsg(null); };

  const handleLogin = async () => {
    clearMessages();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (authError) {
      // Map common Supabase error codes to friendly messages
      if (authError.message.includes('Invalid login credentials')) {
        setError('Email or password is incorrect. Did you register yet?');
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Please check your email and confirm your account first.');
      } else {
        setError(authError.message);
      }
    }
    // On success the _layout.tsx auth listener redirects automatically
  };

  const handleRegister = async () => {
    clearMessages();
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);

    // Create the auth user.
    // The database trigger (handle_new_user) automatically creates the
    // profile row server-side — no client INSERT needed, no RLS issues.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: username.trim() } },
    });

    setLoading(false);

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('This email is already registered. Try logging in instead.');
      } else {
        setError(signUpError.message);
      }
      return;
    }

    if (data.session) {
      // Email confirmation disabled — user is immediately signed in
      router.replace('/(auth)/onboarding');
    } else if (data.user) {
      // Email confirmation enabled — ask user to confirm
      setSuccessMsg('✅ Account created! Check your email to confirm, then come back and log in.');
      setTab('login');
    } else {
      setError('Something went wrong. Please try again.');
    }
  };


  return (
    <View style={styles.root}>
      {isWide ? (
        <View style={styles.card}>
          <LeftPanel />
          <View style={styles.rightPanel}>
            <AuthForm
              tab={tab} setTab={(t) => { setTab(t); clearMessages(); }}
              username={username} setUsername={setUsername}
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              loading={loading}
              error={error}
              successMsg={successMsg}
              onLogin={handleLogin}
              onRegister={handleRegister}
            />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.narrowScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}><Text style={styles.brandIconText}>⚔️</Text></View>
            <Text style={styles.brandName}>Adventurer</Text>
          </View>
          <AuthForm
            tab={tab} setTab={(t) => { setTab(t); clearMessages(); }}
            username={username} setUsername={setUsername}
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            loading={loading}
            error={error}
            successMsg={successMsg}
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Left panel ───────────────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <View style={styles.leftPanel}>
      <View style={[styles.corner, { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 }]} />
      <View style={[styles.corner, { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 }]} />
      <View style={[styles.floatingBadge, { top: 32, left: 24, transform: [{ rotate: '-6deg' }] }]}>
        <Text style={{ color: Colors.secondary, fontSize: 22 }}>★</Text>
      </View>
      <View style={[styles.floatingBadge, { bottom: 32, right: 24, transform: [{ rotate: '12deg' }] }]}>
        <Text style={{ color: Colors.tertiary, fontSize: 22 }}>⚡</Text>
      </View>
      <View style={styles.leftCenter}>
        <View style={styles.charFrame}>
          <View style={[styles.frameBracket, { top: -8, left: -8, borderTopWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[styles.frameBracket, { bottom: -8, right: -8, borderBottomWidth: 3, borderRightWidth: 3 }]} />
          <Image source={{ uri: HERO_WARRIOR }} style={styles.heroImage} resizeMode="contain" />
        </View>
        <Text style={styles.heroTitle}>{'BEGIN YOUR\nADVENTURE!'}</Text>
        <Text style={styles.heroSub}>Join thousands of heroes mastering their daily habits.</Text>
      </View>
    </View>
  );
}

// ─── Auth form ────────────────────────────────────────────────────────────────
interface AuthFormProps {
  tab: Tab; setTab: (t: Tab) => void;
  username: string; setUsername: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  loading: boolean;
  error: string | null;
  successMsg: string | null;
  onLogin: () => void;
  onRegister: () => void;
}

function AuthForm({ tab, setTab, username, setUsername, email, setEmail, password, setPassword, loading, error, successMsg, onLogin, onRegister }: AuthFormProps) {
  const isRegister = tab === 'register';

  return (
    <View style={styles.formOuter}>
      {isWide && (
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}><Text style={styles.brandIconText}>⚔️</Text></View>
          <Text style={styles.brandName}>Adventurer</Text>
        </View>
      )}

      <View style={styles.authCard}>
        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]} onPress={() => setTab('login')} activeOpacity={0.8}>
            <Text style={[styles.tabLabel, tab === 'login' && styles.tabLabelActive]}>Login</Text>
            {tab === 'login' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]} onPress={() => setTab('register')} activeOpacity={0.8}>
            <Text style={[styles.tabLabel, tab === 'register' && styles.tabLabelActive]}>Register</Text>
            {tab === 'register' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Form body */}
        <View style={styles.formInner}>
          {/* ── Inline error banner ── */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}
          {/* ── Success banner ── */}
          {successMsg && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          )}

          {isRegister && (
            <Field icon="👤" label="Adventurer Name" placeholder="e.g. HeroPlayer1" value={username} onChangeText={setUsername} autoCapitalize="none" />
          )}
          <Field icon="✉️" label="Email Address" placeholder="hero@quest.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field icon="🔒" label={isRegister ? 'Secret Key' : 'Password'} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />

          <TouchableOpacity style={styles.ctaButton} onPress={isRegister ? onRegister : onLogin} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={Colors.onPrimaryFixed} />
              : <>
                  <Text style={styles.ctaText}>{isRegister ? 'Start the Quest' : 'Enter the Dungeon'}</Text>
                  <Text style={styles.ctaArrow}>→</Text>
                </>
            }
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SUMMON WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}>
            <Image source={{ uri: GOOGLE_LOGO }} style={styles.googleLogo} />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footerText}>
        {isRegister
          ? 'By registering, you agree to our Terms of Service and Privacy Policy.'
          : 'New hero? Switch to Register to create your account.'}
      </Text>
    </View>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
interface FieldProps {
  icon: string; label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void; secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address'; autoCapitalize?: 'none' | 'sentences';
}

function Field({ icon, label, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabel}>
        <Text style={styles.fieldIcon}>{icon}</Text>
        <Text style={styles.fieldLabelText}>{label.toUpperCase()}</Text>
      </View>
      <TextInput
        style={[styles.fieldInput, focused && styles.fieldInputFocused]}
        placeholder={placeholder}
        placeholderTextColor={Colors.outline}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const isWideBool = width >= 768;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    width: '100%', maxWidth: 1024,
    height: isWideBool ? 720 : undefined,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, borderWidth: 4, borderColor: Colors.surfaceContainerHighest,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 24,
  },
  leftPanel: {
    width: '40%', backgroundColor: Colors.surfaceContainer,
    borderRightWidth: 4, borderRightColor: Colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative',
  },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: Colors.secondary },
  floatingBadge: {
    position: 'absolute', padding: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 2, borderColor: Colors.outlineVariant, borderRadius: 8,
    shadowColor: Colors.surfaceContainerLowest, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.6, shadowRadius: 0, elevation: 4,
  },
  leftCenter: { alignItems: 'center', paddingHorizontal: 24, zIndex: 1 },
  charFrame: { position: 'relative', marginBottom: 28 },
  frameBracket: { position: 'absolute', width: 36, height: 36, borderColor: Colors.secondary },
  heroImage: { width: 200, height: 200 },
  heroTitle: { fontFamily: 'FredokaOne_400Regular', fontSize: 32, color: Colors.primary, textAlign: 'center', lineHeight: 40 },
  heroSub: { marginTop: 12, color: Colors.onSurfaceVariant, fontFamily: 'BeVietnamPro_400Regular', textAlign: 'center', fontSize: 13, letterSpacing: 0.4 },
  rightPanel: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: Colors.surface },
  narrowScroll: { width: '100%', paddingVertical: 40, paddingHorizontal: 16, alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32, alignSelf: isWideBool ? 'flex-start' : 'center' },
  brandIcon: {
    width: 48, height: 48, backgroundColor: Colors.primaryContainer,
    borderRadius: 10, borderWidth: 2, borderColor: Colors.onPrimaryFixedVariant,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.surfaceContainerLowest, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.6, shadowRadius: 0, elevation: 4,
  },
  brandIconText: { fontSize: 24 },
  brandName: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 28, color: Colors.onSurface, letterSpacing: -0.5 },
  formOuter: { width: '100%', maxWidth: 440 },
  authCard: {
    backgroundColor: Colors.surfaceContainerHigh, borderRadius: 16,
    borderWidth: 4, borderColor: Colors.surfaceContainerHighest, overflow: 'hidden',
    shadowColor: Colors.surfaceContainerLowest, shadowOffset: { width: 8, height: 8 }, shadowOpacity: 0.8, shadowRadius: 0, elevation: 8,
  },
  tabBar: { flexDirection: 'row', borderBottomWidth: 4, borderBottomColor: Colors.surfaceContainerHighest },
  tabBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', position: 'relative' },
  tabBtnActive: { backgroundColor: Colors.surfaceContainerHighest },
  tabLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: Colors.onSurfaceVariant },
  tabLabelActive: { color: Colors.secondary },
  tabIndicator: { position: 'absolute', bottom: -2, left: 0, right: 0, height: 4, backgroundColor: Colors.secondary },
  formInner: { padding: 28, gap: 18 },

  // ── Error / success banners ──
  errorBanner: {
    backgroundColor: Colors.errorContainer,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.error,
    padding: 12,
  },
  errorText: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 13, color: Colors.onErrorContainer, lineHeight: 20 },
  successBanner: {
    backgroundColor: Colors.tertiaryContainer,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.tertiary,
    padding: 12,
  },
  successText: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 13, color: Colors.onTertiaryContainer, lineHeight: 20 },

  field: { gap: 8 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldIcon: { fontSize: 12 },
  fieldLabelText: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 11, color: Colors.onSurfaceVariant, letterSpacing: 1.5, textTransform: 'uppercase' },
  fieldInput: {
    backgroundColor: Colors.surfaceContainerLowest, borderWidth: 4, borderColor: Colors.surfaceContainerHighest,
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontFamily: 'BeVietnamPro_500Medium', fontSize: 15, color: Colors.onSurface,
  },
  fieldInputFocused: { borderColor: Colors.primaryContainer },
  ctaButton: {
    borderRadius: 10, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: Colors.onPrimaryFixed,
    shadowColor: Colors.surfaceContainerLowest, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.6, shadowRadius: 0, elevation: 4,
    backgroundColor: Colors.primaryContainer,
  },
  ctaText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16, color: Colors.primary, letterSpacing: 1, textTransform: 'uppercase' },
  ctaArrow: { fontSize: 18, color: Colors.primary, fontFamily: 'BeVietnamPro_700Bold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 2, backgroundColor: Colors.surfaceContainerHighest },
  dividerText: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 10, color: Colors.outline, letterSpacing: 1, textTransform: 'uppercase' },
  googleBtn: {
    paddingVertical: 14, backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 2, borderColor: Colors.surfaceContainerHighest, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  googleLogo: { width: 20, height: 20 },
  googleText: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 14, color: Colors.onSurface },
  footerText: { marginTop: 24, textAlign: 'center', fontSize: 12, color: Colors.onSurfaceVariant, fontFamily: 'BeVietnamPro_400Regular', lineHeight: 18, paddingHorizontal: 8 },
});

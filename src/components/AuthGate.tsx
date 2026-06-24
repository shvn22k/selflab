import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { AppState } from 'react-native';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';
import { useSettings } from '@/stores/settings';
import { authenticate } from '@/lib/biometric';
import { seedDemoData } from '@/lib/demoSeed';
import { palette } from '@/theme/tokens';

/**
 * Drives top-level routing:
 *  - not signed in (and backend configured) → (auth) welcome
 *  - signed in / demo, but not onboarded     → (auth)/onboarding
 *  - onboarded                                → (tabs)
 * Also enforces the optional biometric app-lock when returning to foreground.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { session, initializing, demo, init } = useAuthStore();
  const onboarded = useProfileStore((s) => s.onboarded);
  const hydrated = useProfileStore((s) => s.hydrated);
  const biometricLock = useSettings((s) => s.biometricLock);

  const [locked, setLocked] = useState(biometricLock);

  useEffect(() => init(), [init]);

  // Seed believable demo data the first time we run without a backend.
  useEffect(() => {
    if (demo) seedDemoData();
  }, [demo]);

  // Biometric lock on cold start + when app returns to foreground.
  useEffect(() => {
    if (!biometricLock) {
      setLocked(false);
      return;
    }
    let active = true;
    authenticate().then((ok) => active && setLocked(!ok));
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && biometricLock) authenticate().then((ok) => setLocked(!ok));
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [biometricLock]);

  const authed = !!session || demo;
  const ready = !initializing && hydrated;
  const navigated = useRef(false);

  useEffect(() => {
    if (!ready) return;
    const seg = segments as string[];
    const inAuthGroup = seg[0] === '(auth)';

    if (!authed) {
      if (!inAuthGroup) router.replace('/(auth)/welcome');
      return;
    }
    if (!onboarded) {
      if (seg[1] !== 'onboarding') router.replace('/(auth)/onboarding');
      return;
    }
    if (inAuthGroup) router.replace('/(tabs)');
    navigated.current = true;
  }, [ready, authed, onboarded, segments, router]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: palette.bg }} />;
  if (locked) return <View style={{ flex: 1, backgroundColor: palette.bg }} />;

  return <>{children}</>;
}

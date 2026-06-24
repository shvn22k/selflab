import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/constants/env';

// Fall back to a syntactically-valid placeholder so the client constructs even
// before the user adds credentials. Network calls simply fail and are handled
// gracefully by TanStack Query / the local-first layer.
const url = isSupabaseConfigured ? env.supabaseUrl : 'https://placeholder.supabase.co';
const anonKey = isSupabaseConfigured ? env.supabaseAnonKey : 'public-anon-placeholder';

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Keep the session token fresh while the app is foregrounded.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

export { isSupabaseConfigured };

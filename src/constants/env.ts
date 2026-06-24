/**
 * Typed access to public environment configuration.
 * EXPO_PUBLIC_* vars are inlined at build time by Expo.
 */
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  weatherApiKey: process.env.EXPO_PUBLIC_WEATHER_API_KEY ?? '',
};

/** Whether the Supabase backend is configured. When false the app runs in a
 * local-only/demo mode so it never hard-crashes without credentials. */
export const isSupabaseConfigured =
  env.supabaseUrl.startsWith('http') && env.supabaseAnonKey.length > 20;

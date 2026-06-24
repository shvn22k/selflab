import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  /** demo mode: backend not configured, run the UI locally */
  demo: boolean;
  init: () => () => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initializing: true,
  demo: !isSupabaseConfigured,

  init: () => {
    if (!isSupabaseConfigured) {
      set({ initializing: false, demo: true });
      return () => {};
    }
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, user: data.session?.user ?? null, initializing: false });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
    return () => sub.subscription.unsubscribe();
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { error: error?.message };
  },

  signUp: async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name } },
    });
    return { error: error?.message };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));

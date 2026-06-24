import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile } from '@/lib/types';

export type ProfileDraft = Partial<Profile>;

interface ProfileState {
  profile: ProfileDraft | null;
  onboarded: boolean;
  hydrated: boolean;
  setProfile: (p: ProfileDraft) => void;
  patch: (p: ProfileDraft) => void;
  completeOnboarding: (p: ProfileDraft) => void;
  reset: () => void;
}

/**
 * Local-first profile cache. Onboarding writes here immediately (so the UI is
 * instant and works in demo/offline mode) and also upserts to Supabase when
 * configured. On login we hydrate this from the server row.
 */
export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      onboarded: false,
      hydrated: false,
      setProfile: (p) => set({ profile: p, onboarded: !!p.onboarded }),
      patch: (p) => set({ profile: { ...(get().profile ?? {}), ...p } }),
      completeOnboarding: (p) => set({ profile: { ...(get().profile ?? {}), ...p, onboarded: true }, onboarded: true }),
      reset: () => set({ profile: null, onboarded: false }),
    }),
    {
      name: 'selflab-profile',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useProfileStore.setState({ hydrated: true });
      },
    },
  ),
);

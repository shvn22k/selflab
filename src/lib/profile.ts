import { supabase, isSupabaseConfigured } from './supabase';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore, type ProfileDraft } from '@/stores/profile';

/**
 * Persist the profile. Always writes the local-first store (instant, offline,
 * demo) and best-effort upserts to Supabase when a real session exists.
 */
export async function saveProfile(draft: ProfileDraft): Promise<void> {
  useProfileStore.getState().patch(draft);

  const userId = useAuthStore.getState().user?.id;
  if (!isSupabaseConfigured || !userId) return;

  const { error } = await supabase
    .from('profile')
    .upsert({ ...draft, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) console.warn('[profile] upsert failed:', error.message);
}

/** Pull the server profile into the local store (called after login). */
export async function hydrateProfileFromServer(): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!isSupabaseConfigured || !userId) return;
  const { data, error } = await supabase.from('profile').select('*').eq('user_id', userId).maybeSingle();
  if (error || !data) return;
  useProfileStore.getState().setProfile(data);
}

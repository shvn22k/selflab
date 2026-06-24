import { supabase } from './supabase';
import { backendActive } from './data';
import { useAuthStore } from '@/stores/auth';

/**
 * Persist a picked image. With a backend, upload to the private `media` bucket
 * (under the user's folder) and return a long-lived signed URL. In demo/offline
 * mode, just keep the local device URI so photos still display immediately.
 */
export async function uploadProgressPhoto(uri: string): Promise<string> {
  if (!backendActive()) return uri;
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return uri;
    const res = await fetch(uri);
    const bytes = await res.arrayBuffer();
    const path = `${userId}/progress/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('media').upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) {
      console.warn('[photos] upload failed:', error.message);
      return uri;
    }
    const { data } = await supabase.storage.from('media').createSignedUrl(path, 60 * 60 * 24 * 365);
    return data?.signedUrl ?? uri;
  } catch (e) {
    console.warn('[photos]', (e as Error).message);
    return uri;
  }
}

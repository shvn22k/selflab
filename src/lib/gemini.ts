import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Client for the Gemini-backed Supabase Edge Functions. The API key lives only
 * as a server-side secret (`supabase secrets set GEMINI_API_KEY=...`), never in
 * the app bundle. Each call invokes a deployed function.
 */

export interface EstimatedFood {
  name: string;
  servings: number;
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
}

export interface CoachMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIUnavailableError extends Error {
  constructor() {
    super('AI features need Supabase + a Gemini key. Connect them in setup.');
    this.name = 'AIUnavailableError';
  }
}

async function invoke<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured) throw new AIUnavailableError();
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw new Error(error.message);
  return data as T;
}

/** Estimate macros for a free-text meal description ("2 eggs and toast"). */
export function estimateMealFromText(description: string): Promise<{ foods: EstimatedFood[] }> {
  return invoke('estimate-meal', { mode: 'text', description });
}

/** Estimate macros from a base64 photo of a meal. */
export function estimateMealFromPhoto(imageBase64: string): Promise<{ foods: EstimatedFood[] }> {
  return invoke('estimate-meal', { mode: 'photo', imageBase64 });
}

/** Chat with the coach. `context` is a compact snapshot of today's data. */
export function coachChat(messages: CoachMessage[], context: Record<string, unknown>): Promise<{ reply: string }> {
  return invoke('ai-coach', { messages, context });
}

/** Generate a morning briefing or evening recap. */
export function generateBriefing(kind: 'morning' | 'evening', context: Record<string, unknown>): Promise<{ content: string }> {
  return invoke('ai-coach', { mode: kind, context });
}

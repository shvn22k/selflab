import { supabase, isSupabaseConfigured } from './supabase';
import { localDb, type Row } from './localDb';
import { useAuthStore } from '@/stores/auth';

/** True when a real Supabase session is available; otherwise use the local store. */
export function backendActive(): boolean {
  return isSupabaseConfigured && !!useAuthStore.getState().user;
}

function userId(): string {
  return useAuthStore.getState().user?.id ?? 'local';
}

export interface ListOptions {
  eq?: Record<string, string | number | boolean>;
  /** inclusive lower bound on `column` */
  gte?: { column: string; value: string | number };
  /** inclusive upper bound on `column` */
  lte?: { column: string; value: string | number };
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

export async function listRows<T>(table: string, opts: ListOptions = {}): Promise<T[]> {
  if (backendActive()) {
    let q = supabase.from(table).select('*');
    if (opts.eq) for (const [k, v] of Object.entries(opts.eq)) q = q.eq(k, v);
    if (opts.gte) q = q.gte(opts.gte.column, opts.gte.value);
    if (opts.lte) q = q.lte(opts.lte.column, opts.lte.value);
    if (opts.order) q = q.order(opts.order.column, { ascending: opts.order.ascending ?? true });
    if (opts.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as T[];
  }

  // local
  let rows = await localDb.list<Row>(table, opts.eq as Partial<Row>);
  if (opts.gte) rows = rows.filter((r) => (r as Record<string, any>)[opts.gte!.column] >= opts.gte!.value);
  if (opts.lte) rows = rows.filter((r) => (r as Record<string, any>)[opts.lte!.column] <= opts.lte!.value);
  if (opts.order) {
    const { column, ascending = true } = opts.order;
    rows = [...rows].sort((a, b) => {
      const av = (a as Record<string, any>)[column];
      const bv = (b as Record<string, any>)[column];
      return ascending ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });
  }
  if (opts.limit) rows = rows.slice(0, opts.limit);
  return rows as unknown as T[];
}

export async function insertRow<T>(table: string, values: Record<string, any>): Promise<T> {
  if (backendActive()) {
    const { data, error } = await supabase
      .from(table)
      .insert({ ...values, user_id: userId() })
      .select()
      .single();
    if (error) throw error;
    return data as T;
  }
  return (await localDb.insert<Row>(table, { ...values, user_id: userId() })) as unknown as T;
}

export async function upsertRow<T>(table: string, values: Record<string, any>, onConflict: string[]): Promise<T> {
  if (backendActive()) {
    const { data, error } = await supabase
      .from(table)
      .upsert({ ...values, user_id: userId() }, { onConflict: onConflict.join(',') })
      .select()
      .single();
    if (error) throw error;
    return data as T;
  }
  return (await localDb.upsert<Row>(table, { ...values, user_id: userId() }, onConflict)) as unknown as T;
}

export async function updateRow(table: string, id: string, values: Record<string, any>): Promise<void> {
  if (backendActive()) {
    const { error } = await supabase.from(table).update(values).eq('id', id);
    if (error) throw error;
    return;
  }
  await localDb.update<Row>(table, id, values);
}

export async function deleteRow(table: string, id: string): Promise<void> {
  if (backendActive()) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return;
  }
  await localDb.remove(table, id);
}

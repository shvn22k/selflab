import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Minimal AsyncStorage-backed collection store. Powers demo/offline mode and
 * mirrors the shape of Supabase table rows so the repository layer can swap
 * between them transparently.
 */

const KEY = (collection: string) => `selflab:db:${collection}`;

export interface Row {
  id: string;
  created_at?: string;
  [k: string]: unknown;
}

function uid(): string {
  return 'loc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function readAll<T extends Row>(collection: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(KEY(collection));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeAll<T extends Row>(collection: string, rows: T[]): Promise<void> {
  await AsyncStorage.setItem(KEY(collection), JSON.stringify(rows));
}

export const localDb = {
  async list<T extends Row>(collection: string, filter?: Partial<T>): Promise<T[]> {
    const rows = await readAll<T>(collection);
    if (!filter) return rows;
    return rows.filter((r) => Object.entries(filter).every(([k, v]) => (r as Row)[k] === v));
  },

  async insert<T extends Row>(collection: string, values: Partial<T>): Promise<T> {
    const rows = await readAll<T>(collection);
    const row = { id: uid(), created_at: new Date().toISOString(), ...values } as T;
    rows.push(row);
    await writeAll(collection, rows);
    return row;
  },

  async upsert<T extends Row>(collection: string, values: Partial<T>, conflictKeys: string[]): Promise<T> {
    const rows = await readAll<T>(collection);
    const idx = rows.findIndex((r) => conflictKeys.every((k) => (r as Row)[k] === (values as Row)[k]));
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...values };
      await writeAll(collection, rows);
      return rows[idx];
    }
    return this.insert(collection, values);
  },

  async update<T extends Row>(collection: string, id: string, values: Partial<T>): Promise<void> {
    const rows = await readAll<T>(collection);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...values };
      await writeAll(collection, rows);
    }
  },

  async remove(collection: string, id: string): Promise<void> {
    const rows = await readAll<Row>(collection);
    await writeAll(
      collection,
      rows.filter((r) => r.id !== id),
    );
  },

  async clear(collection: string): Promise<void> {
    await AsyncStorage.removeItem(KEY(collection));
  },
};

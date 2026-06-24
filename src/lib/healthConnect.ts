import { Platform } from 'react-native';
import {
  initialize,
  getSdkStatus,
  requestPermission,
  readRecords,
  getGrantedPermissions,
} from 'react-native-health-connect';
import { upsertRow, listRows, insertRow } from './data';
import { todayISO } from './date';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import type { BodyMetric, DailySteps, SleepLog } from './types';

const READ_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
  { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'Weight' },
] as const;

export const isHealthConnectSupported = () => Platform.OS === 'android';

/** SDK status: 3 = available. Returns false if unsupported or unavailable. */
export async function initHealthConnect(): Promise<boolean> {
  if (!isHealthConnectSupported()) return false;
  try {
    const ok = await initialize();
    if (!ok) return false;
    const status = await getSdkStatus();
    return status === 3;
  } catch {
    return false;
  }
}

export async function requestHealthPermissions(): Promise<boolean> {
  if (!(await initHealthConnect())) return false;
  try {
    const granted = await requestPermission(READ_PERMISSIONS as any);
    return granted.length > 0;
  } catch {
    return false;
  }
}

export async function hasHealthPermissions(): Promise<boolean> {
  if (!isHealthConnectSupported()) return false;
  try {
    const granted = await getGrantedPermissions();
    return granted.length > 0;
  } catch {
    return false;
  }
}

function range(start: Date, end: Date) {
  return { operator: 'between' as const, startTime: start.toISOString(), endTime: end.toISOString() };
}

/** Pull today's metrics from Health Connect into the local/Supabase store. */
export async function syncHealthData(): Promise<{ steps: number; weight?: number; sleepMin?: number } | null> {
  if (!(await initHealthConnect())) return null;
  const today = todayISO();
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  let steps = 0;
  let distance = 0;
  try {
    const res: any = await readRecords('Steps', { timeRangeFilter: range(dayStart, dayEnd) });
    steps = (res.records ?? []).reduce((a: number, r: any) => a + (r.count ?? 0), 0);
  } catch {}
  try {
    const res: any = await readRecords('Distance', { timeRangeFilter: range(dayStart, dayEnd) });
    distance = (res.records ?? []).reduce((a: number, r: any) => a + (r.distance?.inMeters ?? 0), 0);
  } catch {}

  await upsertRow<DailySteps>('daily_steps', { date: today, steps, distance_m: Math.round(distance), source: 'health_connect' }, ['user_id', 'date']);

  // Resting HR + HRV + weight → today's body_metric
  let restingHr: number | undefined;
  let hrv: number | undefined;
  let weight: number | undefined;
  try {
    const res: any = await readRecords('RestingHeartRate', { timeRangeFilter: range(subDays(now, 1), dayEnd) });
    restingHr = res.records?.at(-1)?.beatsPerMinute;
  } catch {}
  try {
    const res: any = await readRecords('HeartRateVariabilityRmssd', { timeRangeFilter: range(subDays(now, 1), dayEnd) });
    hrv = res.records?.at(-1)?.heartRateVariabilityMillis;
  } catch {}
  try {
    const res: any = await readRecords('Weight', { timeRangeFilter: range(subDays(now, 30), dayEnd) });
    weight = res.records?.at(-1)?.weight?.inKilograms;
  } catch {}

  if (restingHr != null || hrv != null || weight != null) {
    const existing = await listRows<BodyMetric>('body_metrics', { eq: { date: today } });
    const patch = { date: today, resting_hr: restingHr ?? null, hrv_ms: hrv ?? null, weight_kg: weight ?? null };
    if (existing.length) {
      // keep existing weight if HC has none
      await upsertRow<BodyMetric>('body_metrics', { ...existing[0], ...patch }, ['id']).catch(() => {});
    } else {
      await insertRow<BodyMetric>('body_metrics', patch);
    }
  }

  // Last night's sleep
  let sleepMin: number | undefined;
  try {
    const res: any = await readRecords('SleepSession', { timeRangeFilter: range(subDays(now, 1), dayEnd) });
    const session = res.records?.at(-1);
    if (session) {
      sleepMin = Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000);
      await upsertRow<SleepLog>(
        'sleep_logs',
        { date: today, bedtime: session.startTime, wake_time: session.endTime, duration_minutes: sleepMin, source: 'health_connect' },
        ['user_id', 'date'],
      );
    }
  } catch {}

  return { steps, weight, sleepMin };
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDb, type Row } from './localDb';
import { todayISO, isoDate } from './date';
import { subDays } from 'date-fns';

const FLAG = 'selflab:demo-seeded:v1';

/** Populate the local store with a believable week+ of data so demo mode looks
 * alive. Runs once (guarded by a flag). No-op if already seeded. */
export async function seedDemoData(): Promise<void> {
  if (await AsyncStorage.getItem(FLAG)) return;

  const today = todayISO();
  const now = new Date();
  const day = (n: number) => isoDate(subDays(now, n));

  // Weight trend (gentle fat-loss decline) + resting HR / HRV for readiness
  let w = 82.4;
  for (let i = 29; i >= 0; i--) {
    w -= Math.random() * 0.12;
    await localDb.insert('body_metrics', {
      user_id: 'local',
      date: day(i),
      weight_kg: Math.round(w * 10) / 10,
      resting_hr: 56 + Math.round(Math.random() * 6),
      hrv_ms: 62 + Math.round(Math.random() * 18),
    });
  }

  // Steps for the last 14 days
  for (let i = 13; i >= 0; i--) {
    await localDb.insert('daily_steps', {
      user_id: 'local',
      date: day(i),
      steps: 5200 + Math.round(Math.random() * 7000),
      distance_m: 4200 + Math.round(Math.random() * 4000),
      active_minutes: 30 + Math.round(Math.random() * 50),
    });
  }

  // Sleep last 7 nights
  for (let i = 6; i >= 0; i--) {
    const dur = 380 + Math.round(Math.random() * 110);
    await localDb.insert('sleep_logs', {
      user_id: 'local',
      date: day(i),
      duration_minutes: dur,
      deep_minutes: Math.round(dur * 0.2),
      rem_minutes: Math.round(dur * 0.23),
      quality: 64 + Math.round(Math.random() * 28),
      source: 'manual',
    });
  }

  // Today's food logs
  const meals = [
    { meal: 'breakfast', name: 'Oats + Whey + Banana', kcal: 420, protein_g: 34, carb_g: 58, fat_g: 7 },
    { meal: 'lunch', name: 'Chicken, Rice & Broccoli', kcal: 560, protein_g: 48, carb_g: 62, fat_g: 12 },
    { meal: 'snack', name: 'Greek Yogurt + Almonds', kcal: 240, protein_g: 20, carb_g: 12, fat_g: 11 },
  ];
  for (const m of meals) {
    await localDb.insert('food_logs', { user_id: 'local', date: today, source: 'manual', servings: 1, ...m });
  }

  // Water today
  await localDb.insert('water_logs', { user_id: 'local', date: today, ml: 1500 });

  // Habits
  const habits = [
    { name: 'Drink 3L water', icon: 'droplet', color: '#3DD6F5' },
    { name: '10k steps', icon: 'footprints', color: '#36D6C8' },
    { name: 'Sleep by 11pm', icon: 'moon', color: '#7C82F6' },
    { name: 'No sugar', icon: 'candy-off', color: '#FF6B6B' },
  ];
  const created: Row[] = [];
  for (const h of habits) {
    const row = await localDb.insert<Row>('habits', {
      user_id: 'local',
      archived: false,
      schedule: 'daily',
      target_per_day: 1,
      ...h,
    });
    created.push(row);
  }
  // mark a couple done today
  await localDb.insert('habit_logs', { user_id: 'local', habit_id: created[0].id, date: today, count: 1 });
  await localDb.insert('habit_logs', { user_id: 'local', habit_id: created[1].id, date: today, count: 1 });

  // Today's schedule
  await localDb.insert('schedule_blocks', {
    user_id: 'local',
    title: 'Push Day — Chest & Shoulders',
    kind: 'workout',
    date: today,
    time: '18:00',
    done: false,
  });

  // A recent activity (run)
  await localDb.insert('activities', {
    user_id: 'local',
    type: 'run',
    started_at: subDays(now, 1).toISOString(),
    duration_seconds: 1684,
    distance_m: 5020,
    avg_pace_s_per_km: 335,
    elevation_gain_m: 32,
    calories: 410,
    source: 'app',
  });

  await AsyncStorage.setItem(FLAG, '1');
}

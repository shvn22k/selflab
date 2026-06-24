import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDb, type Row } from './localDb';
import { todayISO, isoDate } from './date';
import { subDays } from 'date-fns';

const FLAG = 'selflab:demo-seeded:v2';

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

  // Reference foods so search works in demo mode.
  const foods = [
    { name: 'Chicken Breast (cooked)', serving_label: '100 g', kcal: 165, protein_g: 31, carb_g: 0, fat_g: 3.6 },
    { name: 'Whole Egg', serving_label: '1 large', kcal: 78, protein_g: 6.3, carb_g: 0.6, fat_g: 5.3 },
    { name: 'White Rice (cooked)', serving_label: '100 g', kcal: 130, protein_g: 2.7, carb_g: 28, fat_g: 0.3 },
    { name: 'Rolled Oats (dry)', serving_label: '40 g', kcal: 152, protein_g: 5.3, carb_g: 27, fat_g: 2.6 },
    { name: 'Banana', serving_label: '1 medium', kcal: 105, protein_g: 1.3, carb_g: 27, fat_g: 0.4 },
    { name: 'Greek Yogurt (non-fat)', serving_label: '170 g', kcal: 100, protein_g: 17, carb_g: 6, fat_g: 0.7 },
    { name: 'Whey Protein Scoop', serving_label: '1 scoop', kcal: 120, protein_g: 24, carb_g: 3, fat_g: 1.5 },
    { name: 'Almonds', serving_label: '28 g', kcal: 164, protein_g: 6, carb_g: 6, fat_g: 14 },
    { name: 'Salmon (cooked)', serving_label: '100 g', kcal: 208, protein_g: 20, carb_g: 0, fat_g: 13 },
    { name: 'Sweet Potato (cooked)', serving_label: '100 g', kcal: 86, protein_g: 1.6, carb_g: 20, fat_g: 0.1 },
    { name: 'Broccoli', serving_label: '100 g', kcal: 34, protein_g: 2.8, carb_g: 7, fat_g: 0.4 },
    { name: 'Paneer', serving_label: '100 g', kcal: 265, protein_g: 18, carb_g: 1.2, fat_g: 21 },
    { name: 'Roti / Chapati', serving_label: '1', kcal: 120, protein_g: 3, carb_g: 18, fat_g: 3.7 },
    { name: 'Dal (cooked)', serving_label: '150 g', kcal: 150, protein_g: 9, carb_g: 20, fat_g: 4 },
    { name: 'Peanut Butter', serving_label: '1 tbsp', kcal: 94, protein_g: 4, carb_g: 3, fat_g: 8 },
    { name: 'Protein Bar', serving_label: '1 bar', kcal: 220, protein_g: 20, carb_g: 22, fat_g: 7 },
  ];
  for (const f of foods) {
    await localDb.insert('foods', { user_id: 'local', serving_grams: 100, ...f });
  }

  // Reference exercises so the library & logging work in demo mode.
  const exercises = [
    { name: 'Barbell Bench Press', muscle_group: 'Chest', equipment: 'Barbell', category: 'strength', is_compound: true, met: 5 },
    { name: 'Incline Dumbbell Press', muscle_group: 'Chest', equipment: 'Dumbbell', category: 'strength', is_compound: true, met: 5 },
    { name: 'Overhead Press', muscle_group: 'Shoulders', equipment: 'Barbell', category: 'strength', is_compound: true, met: 5 },
    { name: 'Lateral Raise', muscle_group: 'Shoulders', equipment: 'Dumbbell', category: 'strength', is_compound: false, met: 3.5 },
    { name: 'Barbell Back Squat', muscle_group: 'Legs', equipment: 'Barbell', category: 'strength', is_compound: true, met: 5 },
    { name: 'Romanian Deadlift', muscle_group: 'Legs', equipment: 'Barbell', category: 'strength', is_compound: true, met: 5.5 },
    { name: 'Leg Press', muscle_group: 'Legs', equipment: 'Machine', category: 'strength', is_compound: true, met: 5 },
    { name: 'Deadlift', muscle_group: 'Back', equipment: 'Barbell', category: 'strength', is_compound: true, met: 6 },
    { name: 'Pull-up', muscle_group: 'Back', equipment: 'Bodyweight', category: 'strength', is_compound: true, met: 5 },
    { name: 'Lat Pulldown', muscle_group: 'Back', equipment: 'Cable', category: 'strength', is_compound: true, met: 4.5 },
    { name: 'Seated Cable Row', muscle_group: 'Back', equipment: 'Cable', category: 'strength', is_compound: true, met: 4.5 },
    { name: 'Bicep Curl', muscle_group: 'Arms', equipment: 'Dumbbell', category: 'strength', is_compound: false, met: 3.5 },
    { name: 'Tricep Pushdown', muscle_group: 'Arms', equipment: 'Cable', category: 'strength', is_compound: false, met: 3.5 },
    { name: 'Plank', muscle_group: 'Core', equipment: 'Bodyweight', category: 'core', is_compound: false, met: 3 },
    { name: 'Hanging Leg Raise', muscle_group: 'Core', equipment: 'Bodyweight', category: 'core', is_compound: false, met: 4 },
    { name: 'Treadmill Run', muscle_group: 'Legs', equipment: 'Machine', category: 'cardio', is_compound: true, met: 9.8 },
    { name: 'Rowing Machine', muscle_group: 'Full Body', equipment: 'Machine', category: 'cardio', is_compound: true, met: 8.5 },
    { name: 'Jump Rope', muscle_group: 'Full Body', equipment: 'Rope', category: 'cardio', is_compound: true, met: 11 },
  ];
  for (const e of exercises) {
    await localDb.insert('exercises', { user_id: 'local', ...e });
  }

  await AsyncStorage.setItem(FLAG, '1');
}

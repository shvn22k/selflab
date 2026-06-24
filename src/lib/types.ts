/** Domain row types mirroring supabase/migrations. Kept hand-written and lean
 * so the app has precise types without a generated 2k-line file. */

export type Sex = 'male' | 'female' | 'other';
export type Goal = 'lose_fat' | 'build_muscle' | 'maintain' | 'performance';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Units = 'metric' | 'imperial';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type CoachProactivity = 'high' | 'balanced' | 'minimal';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  sex: Sex | null;
  dob: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  target_weight_kg: number | null;
  activity_level: ActivityLevel;
  goal: Goal;
  units: Units;
  bmr: number | null;
  tdee: number | null;
  calorie_target: number | null;
  protein_target_g: number | null;
  carb_target_g: number | null;
  fat_target_g: number | null;
  water_target_ml: number;
  step_target: number;
  coach_name: string;
  coach_proactivity: CoachProactivity;
  integrations: Record<string, unknown>;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  category: 'strength' | 'cardio' | 'mobility' | 'core';
  is_compound: boolean;
  instructions: string | null;
  met: number | null;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  focus: string | null;
  day_of_week: number | null;
  color: string | null;
  created_at: string;
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string | null;
  exercise_name: string;
  target_sets: number;
  target_reps: number;
  target_weight_kg: number | null;
  rest_seconds: number;
  position: number;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  total_volume_kg: number | null;
  calories: number | null;
  notes: string | null;
}

export interface SessionSet {
  id: string;
  session_id: string;
  exercise_id: string | null;
  exercise_name: string;
  set_index: number;
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  is_warmup: boolean;
  is_pr: boolean;
  completed: boolean;
}

export interface ScheduleBlock {
  id: string;
  title: string;
  kind: 'workout' | 'cardio' | 'rest' | 'meal' | 'habit' | 'custom';
  date: string;
  time: string | null;
  template_id: string | null;
  reminder_minutes: number | null;
  done: boolean;
  color: string | null;
}

export interface Activity {
  id: string;
  type: 'run' | 'walk' | 'ride' | 'hike' | 'other';
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  distance_m: number | null;
  avg_pace_s_per_km: number | null;
  elevation_gain_m: number | null;
  calories: number | null;
  avg_hr: number | null;
  route: RoutePoint[] | null;
  source: 'app' | 'health_connect' | 'manual';
  created_at: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  t: number;
  alt?: number;
}

export interface DailySteps {
  id: string;
  date: string;
  steps: number;
  distance_m: number;
  floors: number;
  active_minutes: number;
  source: string;
}

export interface Food {
  id: string;
  user_id: string | null;
  name: string;
  brand: string | null;
  serving_label: string;
  serving_grams: number | null;
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  barcode: string | null;
}

export interface FoodLog {
  id: string;
  date: string;
  meal: MealType;
  food_id: string | null;
  name: string;
  servings: number;
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  source: 'manual' | 'search' | 'barcode' | 'ai_photo' | 'ai_text';
  created_at: string;
}

export interface WaterLog {
  id: string;
  date: string;
  ml: number;
  created_at: string;
}

export interface Supplement {
  id: string;
  name: string;
  dose: string | null;
  schedule_times: string[] | null;
  active: boolean;
}

export interface BodyMetric {
  id: string;
  date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  resting_hr: number | null;
  hrv_ms: number | null;
  notes: string | null;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  storage_path: string;
  pose: 'front' | 'side' | 'back';
}

export interface SleepLog {
  id: string;
  date: string;
  bedtime: string | null;
  wake_time: string | null;
  duration_minutes: number | null;
  deep_minutes: number | null;
  rem_minutes: number | null;
  light_minutes: number | null;
  awake_minutes: number | null;
  quality: number | null;
  source: string;
}

export interface ReadinessScore {
  id: string;
  date: string;
  score: number;
  recommendation: string | null;
  factors: Record<string, number> | null;
}

export interface Habit {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  schedule: string;
  target_per_day: number;
  reminder_time: string | null;
  archived: boolean;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  count: number;
}

export interface MoodLog {
  id: string;
  date: string;
  mood: number | null;
  energy: number | null;
  stress: number | null;
  note: string | null;
}

export interface Checkin {
  id: string;
  date: string;
  mood: number | null;
  energy: number | null;
  stress: number | null;
  soreness: number | null;
  note: string | null;
}

export interface MeditationSession {
  id: string;
  kind: 'meditation' | 'breathwork';
  minutes: number | null;
  preset: string | null;
  created_at: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Briefing {
  id: string;
  date: string;
  kind: 'morning' | 'evening';
  content: string | null;
  data: Record<string, unknown> | null;
}

export interface HealthScore {
  id: string;
  date: string;
  score: number;
  breakdown: Record<string, number> | null;
}

export interface Goal_ {
  id: string;
  title: string;
  metric: string | null;
  target_value: number | null;
  current_value: number;
  due_date: string | null;
  achieved: boolean;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  unlocked_at: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string | null;
  body: string | null;
  voice_path: string | null;
  created_at: string;
}

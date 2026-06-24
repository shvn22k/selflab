import type { ActivityLevel, Goal, Sex } from './types';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Mostly sitting',
  light: 'Light (1–2 days/wk)',
  moderate: 'Moderate (3–5 days/wk)',
  active: 'Active (6–7 days/wk)',
  very_active: 'Athlete / physical job',
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose_fat: 'Lose fat',
  build_muscle: 'Build muscle',
  maintain: 'Maintain',
  performance: 'Performance',
};

/** Calorie adjustment vs maintenance for each goal. */
const GOAL_CALORIE_DELTA: Record<Goal, number> = {
  lose_fat: -0.2, // ~20% deficit
  build_muscle: 0.1, // ~10% surplus
  maintain: 0,
  performance: 0.05,
};

/** Protein target in grams per kg of bodyweight. */
const GOAL_PROTEIN_PER_KG: Record<Goal, number> = {
  lose_fat: 2.2, // protein high to preserve lean mass in a deficit
  build_muscle: 2.0,
  maintain: 1.8,
  performance: 1.9,
};

export interface MacroTargets {
  bmr: number;
  tdee: number;
  calorieTarget: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}

export function ageFromDob(dob: string | Date): number {
  const d = typeof dob === 'string' ? new Date(dob) : dob;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

/** Mifflin–St Jeor BMR. */
export function calcBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') return base + 5;
  if (sex === 'female') return base - 161;
  return base - 78; // 'other' → average of the two constants
}

export function calcTargets(params: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activity: ActivityLevel;
  goal: Goal;
}): MacroTargets {
  const { sex, weightKg, heightCm, age, activity, goal } = params;
  const bmr = calcBMR(sex, weightKg, heightCm, age);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activity];
  const calorieTarget = Math.round(tdee * (1 + GOAL_CALORIE_DELTA[goal]));

  const proteinG = Math.round(weightKg * GOAL_PROTEIN_PER_KG[goal]);
  const fatG = Math.round((calorieTarget * 0.27) / 9); // ~27% kcal from fat
  const remaining = calorieTarget - proteinG * 4 - fatG * 9;
  const carbG = Math.max(Math.round(remaining / 4), 0);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTarget,
    proteinG,
    carbG,
    fatG,
  };
}

/** Water target heuristic: 35 ml per kg, rounded to nearest 100, min 2000. */
export function waterTargetMl(weightKg: number): number {
  return Math.max(2000, Math.round((weightKg * 35) / 100) * 100);
}

/** Calories burned for an activity using MET: kcal = MET * weightKg * hours. */
export function caloriesFromMet(met: number, weightKg: number, minutes: number): number {
  return Math.round(met * weightKg * (minutes / 60));
}

export const kcalOfMacros = (p: number, c: number, f: number) => Math.round(p * 4 + c * 4 + f * 9);

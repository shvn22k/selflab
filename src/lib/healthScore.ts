/**
 * Health Score — one composite 0..100 number for the day, blending movement,
 * nutrition, sleep, recovery and habits. The single glanceable "how am I doing".
 */
export interface HealthScoreInput {
  steps?: number;
  stepTarget?: number;
  caloriesConsumed?: number;
  calorieTarget?: number;
  proteinG?: number;
  proteinTargetG?: number;
  waterMl?: number;
  waterTargetMl?: number;
  sleepMinutes?: number;
  readiness?: number; // 0..100
  habitsDone?: number;
  habitsTotal?: number;
  workoutDone?: boolean;
}

export interface HealthScoreResult {
  score: number;
  breakdown: Record<string, number>;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Adherence score that penalises going far over a target (e.g. calories). */
function adherence(value: number, target: number, overPenalty = true): number {
  if (!target) return 0;
  const ratio = value / target;
  if (ratio <= 1) return clamp(ratio * 100);
  return overPenalty ? clamp(100 - (ratio - 1) * 120) : 100;
}

export function computeHealthScore(input: HealthScoreInput): HealthScoreResult {
  const parts: { key: string; value: number; weight: number }[] = [];

  if (input.stepTarget) {
    parts.push({ key: 'movement', value: adherence(input.steps ?? 0, input.stepTarget, false), weight: 0.2 });
  }
  if (input.calorieTarget) {
    parts.push({ key: 'nutrition', value: adherence(input.caloriesConsumed ?? 0, input.calorieTarget, true), weight: 0.2 });
  }
  if (input.proteinTargetG) {
    parts.push({ key: 'protein', value: adherence(input.proteinG ?? 0, input.proteinTargetG, false), weight: 0.12 });
  }
  if (input.waterTargetMl) {
    parts.push({ key: 'hydration', value: adherence(input.waterMl ?? 0, input.waterTargetMl, false), weight: 0.08 });
  }
  if (input.sleepMinutes != null) {
    parts.push({ key: 'sleep', value: clamp((input.sleepMinutes / 480) * 100), weight: 0.18 });
  }
  if (input.readiness != null) {
    parts.push({ key: 'recovery', value: input.readiness, weight: 0.12 });
  }
  if (input.habitsTotal) {
    parts.push({ key: 'habits', value: clamp(((input.habitsDone ?? 0) / input.habitsTotal) * 100), weight: 0.1 });
  }

  const totalWeight = parts.reduce((a, b) => a + b.weight, 0);
  const score = totalWeight > 0 ? Math.round(parts.reduce((a, b) => a + b.value * b.weight, 0) / totalWeight) : 0;

  const breakdown: Record<string, number> = {};
  parts.forEach((p) => (breakdown[p.key] = Math.round(p.value)));

  return { score, breakdown };
}

export function healthScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Strong';
  if (score >= 50) return 'Decent';
  if (score >= 30) return 'Needs work';
  return 'Low';
}

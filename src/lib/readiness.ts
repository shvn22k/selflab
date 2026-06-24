/**
 * Recovery readiness — a 0..100 "push or rest" signal derived from sleep,
 * resting HR and HRV relative to the user's recent baseline. Designed to
 * degrade gracefully when only some inputs are present.
 */
export interface ReadinessInput {
  sleepMinutes?: number | null;
  sleepQuality?: number | null; // 0..100
  restingHr?: number | null;
  restingHrBaseline?: number | null;
  hrv?: number | null;
  hrvBaseline?: number | null;
  sorenessLevel?: number | null; // 1..5 (5 = very sore)
}

export interface ReadinessResult {
  score: number;
  recommendation: string;
  label: string;
  factors: Record<string, number>;
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const factors: Record<string, number> = {};
  const weighted: { value: number; weight: number }[] = [];

  // Sleep duration → ideal ~480 min
  if (input.sleepMinutes != null) {
    const s = clamp((input.sleepMinutes / 480) * 100);
    factors.sleep = Math.round(s);
    weighted.push({ value: s, weight: 0.35 });
  }
  if (input.sleepQuality != null) {
    factors.sleepQuality = Math.round(input.sleepQuality);
    weighted.push({ value: input.sleepQuality, weight: 0.15 });
  }
  // Resting HR: lower-than-baseline is good
  if (input.restingHr != null && input.restingHrBaseline) {
    const delta = input.restingHr - input.restingHrBaseline;
    const s = clamp(100 - delta * 6); // each bpm above baseline ≈ -6
    factors.restingHr = Math.round(s);
    weighted.push({ value: s, weight: 0.2 });
  }
  // HRV: higher-than-baseline is good
  if (input.hrv != null && input.hrvBaseline) {
    const ratio = input.hrv / input.hrvBaseline;
    const s = clamp(ratio * 80);
    factors.hrv = Math.round(s);
    weighted.push({ value: s, weight: 0.25 });
  }
  // Soreness penalty
  if (input.sorenessLevel != null) {
    const s = clamp(100 - (input.sorenessLevel - 1) * 22);
    factors.soreness = Math.round(s);
    weighted.push({ value: s, weight: 0.15 });
  }

  const totalWeight = weighted.reduce((a, b) => a + b.weight, 0);
  const score = totalWeight > 0 ? Math.round(weighted.reduce((a, b) => a + b.value * b.weight, 0) / totalWeight) : 65;

  let label: string;
  let recommendation: string;
  if (score >= 80) {
    label = 'Primed';
    recommendation = "You're well recovered — a great day to push hard or chase a PR.";
  } else if (score >= 60) {
    label = 'Ready';
    recommendation = 'Solid recovery. Train as planned and stay on your nutrition.';
  } else if (score >= 40) {
    label = 'Moderate';
    recommendation = 'Recovery is middling — keep intensity moderate and prioritise sleep tonight.';
  } else {
    label = 'Low';
    recommendation = 'Your body needs recovery. Go light, walk, hydrate, and ease the deficit today.';
  }

  return { score, recommendation, label, factors };
}

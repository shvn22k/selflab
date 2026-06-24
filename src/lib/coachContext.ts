import type { useToday } from '@/features/today';

type Today = ReturnType<typeof useToday>;

/** Compact snapshot of the user's day passed to the coach so replies are
 * grounded in real numbers rather than generic advice. */
export function buildCoachContext(t: Today): Record<string, unknown> {
  return {
    coachName: t.profile?.coach_name ?? 'Atlas',
    goal: t.profile?.goal ?? 'lose_fat',
    name: t.profile?.display_name ?? 'there',
    weightKg: t.latestWeight,
    targetWeightKg: t.profile?.target_weight_kg ?? null,
    calories: { consumed: Math.round(t.macros.kcal), target: t.targets.calorie, left: Math.round(t.targets.calorie - t.macros.kcal) },
    protein: { consumed: Math.round(t.macros.protein), target: t.targets.protein },
    carbs: { consumed: Math.round(t.macros.carb), target: t.targets.carb },
    fat: { consumed: Math.round(t.macros.fat), target: t.targets.fat },
    water: { ml: t.waterMl, target: t.targets.water },
    steps: { today: t.stepsToday, target: t.targets.steps },
    sleepMinutes: t.sleepToday?.duration_minutes ?? null,
    readiness: { score: t.readiness.score, label: t.readiness.label },
    healthScore: t.healthScore.score,
    habits: t.habitsDone,
    workoutDoneToday: (t.sessions ?? []).some((s) => s.ended_at),
  };
}

/** A local, offline fallback "coach" reply built purely from the snapshot, used
 * when Gemini isn't configured so the chat still feels alive in demo mode. */
export function localCoachReply(ctx: Record<string, unknown>): string {
  const c = ctx as any;
  const left = c.calories?.left ?? 0;
  const proteinGap = (c.protein?.target ?? 0) - (c.protein?.consumed ?? 0);
  const lines = [
    `Here's your read, ${c.name}:`,
    left > 0 ? `• ${left} kcal left today — keep protein high.` : `• You're at your calorie target — nice control.`,
    proteinGap > 0 ? `• ${Math.round(proteinGap)}g protein to go.` : `• Protein target hit 💪`,
    `• Readiness ${c.readiness?.score ?? '–'} (${c.readiness?.label ?? '–'}) · ${c.steps?.today ?? 0}/${c.steps?.target ?? 0} steps.`,
    `(Connect your Gemini key in setup to unlock full AI coaching.)`,
  ];
  return lines.join('\n');
}

import { useMemo } from 'react';
import { useList } from '@/lib/hooks';
import { todayISO, lastNDays } from '@/lib/date';
import { useProfileStore } from '@/stores/profile';
import { computeHealthScore } from '@/lib/healthScore';
import { computeReadiness } from '@/lib/readiness';
import type {
  FoodLog,
  WaterLog,
  DailySteps,
  BodyMetric,
  ScheduleBlock,
  Habit,
  HabitLog,
  SleepLog,
  WorkoutSession,
} from '@/lib/types';

export interface MacroTotals {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}

export function useToday() {
  const today = todayISO();
  const profile = useProfileStore((s) => s.profile);

  const foodLogs = useList<FoodLog>('food_logs', { eq: { date: today } });
  const waterLogs = useList<WaterLog>('water_logs', { eq: { date: today } });
  const steps = useList<DailySteps>('daily_steps', { eq: { date: today } });
  const body = useList<BodyMetric>('body_metrics', { order: { column: 'date', ascending: true }, limit: 60 });
  const schedule = useList<ScheduleBlock>('schedule_blocks', { eq: { date: today } });
  const habits = useList<Habit>('habits', { eq: { archived: false } });
  const habitLogs = useList<HabitLog>('habit_logs', { eq: { date: today } });
  const sleep = useList<SleepLog>('sleep_logs', { eq: { date: today } });
  const sessions = useList<WorkoutSession>('workout_sessions', { gte: { column: 'started_at', value: today } });

  const macros: MacroTotals = useMemo(() => {
    const logs = foodLogs.data ?? [];
    return logs.reduce(
      (acc, l) => ({
        kcal: acc.kcal + (l.kcal ?? 0),
        protein: acc.protein + (l.protein_g ?? 0),
        carb: acc.carb + (l.carb_g ?? 0),
        fat: acc.fat + (l.fat_g ?? 0),
      }),
      { kcal: 0, protein: 0, carb: 0, fat: 0 },
    );
  }, [foodLogs.data]);

  const waterMl = useMemo(() => (waterLogs.data ?? []).reduce((a, w) => a + (w.ml ?? 0), 0), [waterLogs.data]);
  const stepsToday = steps.data?.[0]?.steps ?? 0;

  const weightSeries = useMemo(
    () => (body.data ?? []).filter((b) => b.weight_kg != null).map((b) => ({ date: b.date, value: b.weight_kg as number })),
    [body.data],
  );
  const latestWeight = weightSeries.length ? weightSeries[weightSeries.length - 1].value : profile?.weight_kg ?? null;

  const habitsDone = useMemo(() => {
    const doneIds = new Set((habitLogs.data ?? []).map((l) => l.habit_id));
    return { done: doneIds.size, total: (habits.data ?? []).length };
  }, [habitLogs.data, habits.data]);

  const sleepToday = sleep.data?.[0] ?? null;

  const readiness = useMemo(() => {
    const recentBody = body.data ?? [];
    const restingHrs = recentBody.filter((b) => b.resting_hr != null).map((b) => b.resting_hr as number);
    const hrvs = recentBody.filter((b) => b.hrv_ms != null).map((b) => b.hrv_ms as number);
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    return computeReadiness({
      sleepMinutes: sleepToday?.duration_minutes ?? null,
      sleepQuality: sleepToday?.quality ?? null,
      restingHr: restingHrs.at(-1) ?? null,
      restingHrBaseline: avg(restingHrs),
      hrv: hrvs.at(-1) ?? null,
      hrvBaseline: avg(hrvs),
    });
  }, [body.data, sleepToday]);

  const calorieTarget = profile?.calorie_target ?? 2200;
  const proteinTarget = profile?.protein_target_g ?? 150;
  const carbTarget = profile?.carb_target_g ?? 200;
  const fatTarget = profile?.fat_target_g ?? 70;
  const waterTarget = profile?.water_target_ml ?? 3000;
  const stepTarget = profile?.step_target ?? 9000;

  const healthScore = useMemo(
    () =>
      computeHealthScore({
        steps: stepsToday,
        stepTarget,
        caloriesConsumed: macros.kcal,
        calorieTarget,
        proteinG: macros.protein,
        proteinTargetG: proteinTarget,
        waterMl,
        waterTargetMl: waterTarget,
        sleepMinutes: sleepToday?.duration_minutes ?? undefined,
        readiness: readiness.score,
        habitsDone: habitsDone.done,
        habitsTotal: habitsDone.total,
        workoutDone: (sessions.data ?? []).some((s) => s.ended_at),
      }),
    [stepsToday, macros, waterMl, sleepToday, readiness.score, habitsDone, sessions.data, stepTarget, calorieTarget, proteinTarget, waterTarget],
  );

  return {
    today,
    profile,
    macros,
    waterMl,
    stepsToday,
    weightSeries,
    latestWeight,
    habits: habits.data ?? [],
    habitsDone,
    sleepToday,
    readiness,
    healthScore,
    schedule: schedule.data ?? [],
    sessions: sessions.data ?? [],
    targets: {
      calorie: calorieTarget,
      protein: proteinTarget,
      carb: carbTarget,
      fat: fatTarget,
      water: waterTarget,
      steps: stepTarget,
    },
    isLoading: foodLogs.isLoading || body.isLoading || habits.isLoading,
    refetch: () => {
      foodLogs.refetch();
      waterLogs.refetch();
      steps.refetch();
      body.refetch();
      schedule.refetch();
      habits.refetch();
      habitLogs.refetch();
      sleep.refetch();
      sessions.refetch();
    },
  };
}

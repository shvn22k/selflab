import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Plus, Play, Clock, Flame, TrendingUp, Library, ChevronRight, CalendarDays } from 'lucide-react-native';
import { Screen, Text, Card, EmptyState } from '@/components/ui';
import { useList, useInsert } from '@/lib/hooks';
import { formatDuration, prettyDate } from '@/lib/date';
import { palette, spacing, radius, gradients } from '@/theme/tokens';
import type { WorkoutSession, WorkoutTemplate } from '@/lib/types';

const RECOMMENDATIONS = [
  { name: 'Full-Body Strength', focus: 'Compound lifts · fat-loss friendly', color: palette.primary },
  { name: 'Push — Chest & Shoulders', focus: 'Hypertrophy · 45–60 min', color: palette.cyan },
  { name: 'Pull — Back & Biceps', focus: 'Hypertrophy · 45–60 min', color: palette.violet },
  { name: 'HIIT Conditioning', focus: '20 min · high burn', color: palette.pink },
];

export default function WorkoutsScreen() {
  const router = useRouter();
  const sessions = useList<WorkoutSession>('workout_sessions', { order: { column: 'started_at', ascending: false }, limit: 12 });
  const templates = useList<WorkoutTemplate>('workout_templates', { order: { column: 'created_at', ascending: true } });
  const startSession = useInsert<WorkoutSession>('workout_sessions');

  const begin = async (name?: string, templateId?: string) => {
    const s = await startSession.mutateAsync({ name: name ?? 'Workout', started_at: new Date().toISOString(), template_id: templateId });
    router.push({ pathname: '/workout/active', params: { id: (s as WorkoutSession).id, ...(templateId ? { templateId } : {}) } });
  };

  const completed = (sessions.data ?? []).filter((s) => s.ended_at);

  return (
    <Screen
      onRefresh={() => {
        sessions.refetch();
        templates.refetch();
      }}
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="h1">Train</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            <Pressable onPress={() => router.push('/schedule')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={16} color={palette.textSecondary} />
              <Text variant="label" color="textSecondary">
                Plan
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push('/workout/library')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Library size={16} color={palette.textSecondary} />
              <Text variant="label" color="textSecondary">
                Library
              </Text>
            </Pressable>
          </View>
        </View>
      }
    >
      {/* Start */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Pressable onPress={() => begin('Workout')}>
          <View style={{ borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.lg }}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={24} color={palette.textInverse} fill={palette.textInverse} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h3" color={palette.textInverse}>
                  Start an empty workout
                </Text>
                <Text variant="caption" color="rgba(10,11,14,0.7)">
                  Log sets, reps and rest in real time
                </Text>
              </View>
            </LinearGradient>
          </View>
        </Pressable>
      </Animated.View>

      {/* Templates */}
      {(templates.data ?? []).length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <Text variant="h3" style={{ marginBottom: spacing.md }}>
            Your splits
          </Text>
          {(templates.data ?? []).map((tpl) => (
            <Pressable key={tpl.id} onPress={() => begin(tpl.name, tpl.id)}>
              <Card style={{ marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Dumbbell size={20} color={palette.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodySemibold">{tpl.name}</Text>
                  {tpl.focus ? (
                    <Text variant="caption" color="textTertiary">
                      {tpl.focus}
                    </Text>
                  ) : null}
                </View>
                <Play size={18} color={palette.primary} />
              </Card>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* Recommendations */}
      <Animated.View entering={FadeInDown.duration(400).delay(120)}>
        <Text variant="h3" style={{ marginBottom: spacing.md, marginTop: spacing.xs }}>
          Recommended for you
        </Text>
        <View style={{ gap: spacing.md }}>
          {RECOMMENDATIONS.map((r) => (
            <Pressable key={r.name} onPress={() => begin(r.name)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 8, height: 40, borderRadius: 4, backgroundColor: r.color }} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodySemibold">{r.name}</Text>
                  <Text variant="caption" color="textTertiary">
                    {r.focus}
                  </Text>
                </View>
                <Plus size={18} color={palette.textTertiary} />
              </Card>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* History */}
      <Animated.View entering={FadeInDown.duration(400).delay(180)}>
        <Text variant="h3" style={{ marginBottom: spacing.md, marginTop: spacing.lg }}>
          Recent sessions
        </Text>
        {completed.length === 0 ? (
          <EmptyState icon={<Dumbbell size={24} color={palette.primary} />} title="No sessions yet" description="Your logged workouts will show here with volume and PRs." />
        ) : (
          completed.map((s) => (
            <Pressable key={s.id} onPress={() => router.push({ pathname: '/workout/active', params: { id: s.id } })}>
              <Card style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                  <Text variant="bodySemibold">{s.name ?? 'Workout'}</Text>
                  <ChevronRight size={16} color={palette.textTertiary} />
                </View>
                <Text variant="caption" color="textTertiary" style={{ marginBottom: spacing.md }}>
                  {prettyDate(s.started_at.slice(0, 10))}
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.xl }}>
                  <Metric icon={<Clock size={14} color={palette.textTertiary} />} label={formatDuration(s.duration_seconds ?? 0)} />
                  <Metric icon={<TrendingUp size={14} color={palette.textTertiary} />} label={`${Math.round(s.total_volume_kg ?? 0)} kg`} />
                  <Metric icon={<Flame size={14} color={palette.textTertiary} />} label={`${Math.round(s.calories ?? 0)} kcal`} />
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </Animated.View>
    </Screen>
  );
}

function Metric({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      {icon}
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Flame,
  Footprints,
  Droplet,
  Moon,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Dumbbell,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import { Screen, Text, Card, Ring, ProgressBar } from '@/components/ui';
import { LineChart } from '@/components/charts/LineChart';
import { useToday } from '@/features/today';
import { useProfileStore } from '@/stores/profile';
import { greeting, prettyDate, todayISO } from '@/lib/date';
import { healthScoreLabel } from '@/lib/healthScore';
import { palette, spacing, radius, gradients } from '@/theme/tokens';

export default function Dashboard() {
  const router = useRouter();
  const t = useToday();
  const name = useProfileStore((s) => s.profile?.display_name) ?? 'there';

  const caloriesLeft = Math.max(t.targets.calorie - t.macros.kcal, 0);
  const weightDelta =
    t.weightSeries.length > 1 ? t.weightSeries[t.weightSeries.length - 1].value - t.weightSeries[0].value : 0;

  return (
    <Screen
      onRefresh={t.refetch}
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text variant="caption" color="textTertiary" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              {greeting()}
            </Text>
            <Text variant="h1">{name}</Text>
            <Text variant="caption" color="textTertiary" style={{ marginTop: 2 }}>
              {prettyDate(todayISO())}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/coach')}>
            <LinearGradient colors={gradients.lime} style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={22} color={palette.textInverse} />
            </LinearGradient>
          </Pressable>
        </View>
      }
    >
      {/* Coach briefing */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Pressable onPress={() => router.push('/(tabs)/coach')}>
          <Card sheen glow={palette.primary} style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
              <Sparkles size={15} color={palette.primary} />
              <Text variant="label" color={palette.primary}>
                {t.profile?.coach_name ?? 'Atlas'} · Today's read
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
              {t.readiness.recommendation}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md }}>
              <Text variant="caption" color={palette.primary}>
                Open coach
              </Text>
              <ChevronRight size={14} color={palette.primary} />
            </View>
          </Card>
        </Pressable>
      </Animated.View>

      {/* Health score + readiness */}
      <Animated.View entering={FadeInDown.duration(400).delay(60)}>
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xl }}>
            <Ring progress={t.healthScore.score / 100} size={108} stroke={11} color={palette.primary} colorTo={palette.teal}>
              <Text variant="display" style={{ fontSize: 30 }}>
                {t.healthScore.score}
              </Text>
              <Text variant="caption" color="textTertiary">
                / 100
              </Text>
            </Ring>
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Text variant="caption" color="textTertiary" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                Health Score
              </Text>
              <Text variant="h2">{healthScoreLabel(t.healthScore.score)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: readinessColor(t.readiness.score) }} />
                <Text variant="caption" color="textSecondary">
                  Recovery {t.readiness.label} · {t.readiness.score}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Nutrition */}
      <Animated.View entering={FadeInDown.duration(400).delay(120)}>
        <Pressable onPress={() => router.push('/(tabs)/nutrition')}>
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Flame size={18} color={palette.calories} />
                <Text variant="h3">Fuel</Text>
              </View>
              <Text variant="caption" color="textTertiary">
                {Math.round(caloriesLeft)} kcal left
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xl }}>
              <Ring progress={t.macros.kcal / t.targets.calorie} size={92} stroke={10} color={palette.calories} colorTo={palette.amber}>
                <Text variant="h3" style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
                  {Math.round(t.macros.kcal)}
                </Text>
                <Text variant="caption" color="textTertiary">
                  / {t.targets.calorie}
                </Text>
              </Ring>
              <View style={{ flex: 1, gap: spacing.md }}>
                <MacroBar label="Protein" value={t.macros.protein} target={t.targets.protein} color={palette.protein} />
                <MacroBar label="Carbs" value={t.macros.carb} target={t.targets.carb} color={palette.carbs} />
                <MacroBar label="Fat" value={t.macros.fat} target={t.targets.fat} color={palette.fat} />
              </View>
            </View>
          </Card>
        </Pressable>
      </Animated.View>

      {/* Rings row: steps / water / sleep */}
      <Animated.View entering={FadeInDown.duration(400).delay(180)} style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <MiniRingStat
          icon={<Footprints size={16} color={palette.steps} />}
          label="Steps"
          value={t.stepsToday.toLocaleString()}
          progress={t.stepsToday / t.targets.steps}
          color={palette.steps}
          onPress={() => router.push('/(tabs)/activity')}
        />
        <MiniRingStat
          icon={<Droplet size={16} color={palette.water} />}
          label="Water"
          value={`${(t.waterMl / 1000).toFixed(1)}L`}
          progress={t.waterMl / t.targets.water}
          color={palette.water}
          onPress={() => router.push('/(tabs)/nutrition')}
        />
        <MiniRingStat
          icon={<Moon size={16} color={palette.sleep} />}
          label="Sleep"
          value={t.sleepToday ? `${Math.floor((t.sleepToday.duration_minutes ?? 0) / 60)}h ${(t.sleepToday.duration_minutes ?? 0) % 60}m` : '--'}
          progress={(t.sleepToday?.duration_minutes ?? 0) / 480}
          color={palette.sleep}
        />
      </Animated.View>

      {/* Weight trend */}
      {t.weightSeries.length > 1 && (
        <Animated.View entering={FadeInDown.duration(400).delay(240)}>
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <View>
                <Text variant="caption" color="textTertiary" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                  Weight · 30 days
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: 4 }}>
                  <Text variant="h1">{t.latestWeight?.toFixed(1)}</Text>
                  <Text variant="caption" color="textSecondary">
                    kg
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: spacing.sm }}>
                    {weightDelta <= 0 ? (
                      <TrendingDown size={14} color={palette.success} />
                    ) : (
                      <TrendingUp size={14} color={palette.warning} />
                    )}
                    <Text variant="caption" color={weightDelta <= 0 ? palette.success : palette.warning}>
                      {weightDelta > 0 ? '+' : ''}
                      {weightDelta.toFixed(1)} kg
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <LineChart data={t.weightSeries.map((p) => p.value)} width={300} height={90} color={palette.primary} />
          </Card>
        </Animated.View>
      )}

      {/* Today's plan */}
      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <Card style={{ marginBottom: spacing.lg }}>
          <Text variant="h3" style={{ marginBottom: spacing.md }}>
            Today's plan
          </Text>
          {t.schedule.length === 0 ? (
            <Pressable onPress={() => router.push('/(tabs)/workouts')} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
              <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} color={palette.primary} />
              </View>
              <Text variant="bodyMedium" color="textSecondary">
                Plan a workout or rest day
              </Text>
            </Pressable>
          ) : (
            t.schedule.map((s) => (
              <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
                <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Dumbbell size={18} color={palette.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{s.title}</Text>
                  <Text variant="caption" color="textTertiary">
                    {s.time ? s.time.slice(0, 5) : 'Anytime'} · {s.kind}
                  </Text>
                </View>
                <ChevronRight size={18} color={palette.textTertiary} />
              </View>
            ))
          )}
          {/* habits summary */}
          {t.habitsDone.total > 0 && (
            <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: palette.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text variant="bodyMedium" color="textSecondary">
                  Habits
                </Text>
                <Text variant="label" color={palette.primary}>
                  {t.habitsDone.done}/{t.habitsDone.total} done
                </Text>
              </View>
              <ProgressBar progress={t.habitsDone.done / Math.max(t.habitsDone.total, 1)} style={{ marginTop: spacing.sm }} />
            </View>
          )}
        </Card>
      </Animated.View>
    </Screen>
  );
}

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
        <Text variant="caption" color="textTertiary">
          {Math.round(value)} / {target}g
        </Text>
      </View>
      <ProgressBar progress={value / target} color={color} height={6} />
    </View>
  );
}

function MiniRingStat({
  icon,
  label,
  value,
  progress,
  color,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  progress: number;
  color: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Card padded={false} style={{ padding: spacing.md, alignItems: 'center', gap: spacing.sm }}>
        <Ring progress={progress} size={56} stroke={6} color={color}>
          {icon}
        </Ring>
        <View style={{ alignItems: 'center' }}>
          <Text variant="bodySemibold">{value}</Text>
          <Text variant="caption" color="textTertiary">
            {label}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

function readinessColor(score: number): string {
  if (score >= 80) return palette.success;
  if (score >= 60) return palette.primary;
  if (score >= 40) return palette.warning;
  return palette.danger;
}

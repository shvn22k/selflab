import { useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Flame,
  Droplet,
  Plus,
  Trash2,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Sparkles,
} from 'lucide-react-native';
import { Screen, Text, Card, Ring, ProgressBar } from '@/components/ui';
import { useToday } from '@/features/today';
import { useList, useInsert, useDelete } from '@/lib/hooks';
import { todayISO } from '@/lib/date';
import { palette, spacing, radius } from '@/theme/tokens';
import type { FoodLog, MealType } from '@/lib/types';

const MEALS: { key: MealType; label: string; icon: any }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: Coffee },
  { key: 'lunch', label: 'Lunch', icon: Sun },
  { key: 'dinner', label: 'Dinner', icon: Moon },
  { key: 'snack', label: 'Snacks', icon: Cookie },
];

export default function NutritionScreen() {
  const router = useRouter();
  const today = todayISO();
  const t = useToday();
  const logs = useList<FoodLog>('food_logs', { eq: { date: today } });
  const addWater = useInsert('water_logs');
  const delLog = useDelete('food_logs');

  const byMeal = useMemo(() => {
    const map: Record<MealType, FoodLog[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    (logs.data ?? []).forEach((l) => map[l.meal]?.push(l));
    return map;
  }, [logs.data]);

  const caloriesLeft = Math.round(t.targets.calorie - t.macros.kcal);
  const logWater = (ml: number) => addWater.mutate({ date: today, ml });

  return (
    <Screen
      onRefresh={() => {
        logs.refetch();
        t.refetch();
      }}
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="h1">Fuel</Text>
          <Pressable
            onPress={() => router.push('/meal/log')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: palette.primary }}
          >
            <Plus size={16} color={palette.textInverse} />
            <Text variant="label" color={palette.textInverse}>
              Log food
            </Text>
          </Pressable>
        </View>
      }
    >
      {/* Calorie + macros hero */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Card sheen style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xl }}>
            <Ring progress={t.macros.kcal / t.targets.calorie} size={116} stroke={12} color={palette.calories} colorTo={palette.amber}>
              <Text variant="display" style={{ fontSize: 26 }}>
                {Math.round(t.macros.kcal)}
              </Text>
              <Text variant="caption" color="textTertiary">
                / {t.targets.calorie}
              </Text>
            </Ring>
            <View style={{ flex: 1, gap: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Flame size={16} color={palette.calories} />
                <Text variant="bodySemibold" color={caloriesLeft >= 0 ? palette.text : palette.danger}>
                  {caloriesLeft >= 0 ? `${caloriesLeft} kcal left` : `${Math.abs(caloriesLeft)} kcal over`}
                </Text>
              </View>
              <MacroBar label="Protein" value={t.macros.protein} target={t.targets.protein} color={palette.protein} />
              <MacroBar label="Carbs" value={t.macros.carb} target={t.targets.carb} color={palette.carbs} />
              <MacroBar label="Fat" value={t.macros.fat} target={t.targets.fat} color={palette.fat} />
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Water */}
      <Animated.View entering={FadeInDown.duration(400).delay(60)}>
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Droplet size={18} color={palette.water} />
              <Text variant="h3">Water</Text>
            </View>
            <Text variant="bodyMedium" color="textSecondary">
              {(t.waterMl / 1000).toFixed(1)} / {(t.targets.water / 1000).toFixed(1)} L
            </Text>
          </View>
          <ProgressBar progress={t.waterMl / t.targets.water} color={palette.water} height={10} />
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            {[250, 500, 750].map((ml) => (
              <Pressable
                key={ml}
                onPress={() => logWater(ml)}
                style={{ flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: palette.surfaceElevated, alignItems: 'center', borderWidth: 1, borderColor: palette.border }}
              >
                <Text variant="label" color={palette.water}>
                  +{ml}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </Animated.View>

      {/* Meals */}
      {MEALS.map((meal, i) => {
        const items = byMeal[meal.key];
        const total = items.reduce((a, l) => a + (l.kcal ?? 0), 0);
        const Icon = meal.icon;
        return (
          <Animated.View key={meal.key} entering={FadeInDown.duration(400).delay(120 + i * 50)}>
            <Card style={{ marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: items.length ? spacing.md : 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon size={17} color={palette.textSecondary} />
                  <Text variant="h3">{meal.label}</Text>
                  {total > 0 ? (
                    <Text variant="caption" color="textTertiary">
                      {Math.round(total)} kcal
                    </Text>
                  ) : null}
                </View>
                <Pressable onPress={() => router.push({ pathname: '/meal/log', params: { meal: meal.key } })} hitSlop={8}>
                  <Plus size={20} color={palette.primary} />
                </Pressable>
              </View>
              {items.map((l) => (
                <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {l.name}
                    </Text>
                    <Text variant="caption" color="textTertiary">
                      {Math.round(l.kcal)} kcal · P{Math.round(l.protein_g)} C{Math.round(l.carb_g)} F{Math.round(l.fat_g)}
                      {l.source.startsWith('ai') ? '  · AI' : ''}
                    </Text>
                  </View>
                  <Pressable onPress={() => delLog.mutate(l.id)} hitSlop={8}>
                    <Trash2 size={16} color={palette.textTertiary} />
                  </Pressable>
                </View>
              ))}
              {items.length === 0 ? (
                <Pressable
                  onPress={() => router.push({ pathname: '/meal/log', params: { meal: meal.key } })}
                  style={{ paddingVertical: spacing.sm }}
                >
                  <Text variant="caption" color="textTertiary">
                    Nothing logged yet — tap + to add.
                  </Text>
                </Pressable>
              ) : null}
            </Card>
          </Animated.View>
        );
      })}

      {/* AI hint */}
      <Animated.View entering={FadeInDown.duration(400).delay(340)}>
        <Pressable onPress={() => router.push({ pathname: '/meal/log', params: { tab: 'ai' } })}>
          <Card glow={palette.primary} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Sparkles size={20} color={palette.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodySemibold">Describe a meal, let AI log it</Text>
              <Text variant="caption" color="textTertiary">
                “2 eggs, toast and a coffee” → instant calories & macros.
              </Text>
            </View>
          </Card>
        </Pressable>
      </Animated.View>
    </Screen>
  );
}

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
        <Text variant="caption" color="textTertiary">
          {Math.round(value)} / {Math.round(target)}g
        </Text>
      </View>
      <ProgressBar progress={value / target} color={color} height={6} />
    </View>
  );
}

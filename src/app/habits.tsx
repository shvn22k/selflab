import { useMemo, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { subDays } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { X, Plus, Check, Flame, Droplet, Footprints, Moon, CandyOff, Dumbbell, BookOpen, Target, CircleDot } from 'lucide-react-native';
import { Text, Card, Input, Button, Sheet, EmptyState } from '@/components/ui';
import { useList, useInsert, useDelete } from '@/lib/hooks';
import { todayISO, isoDate } from '@/lib/date';
import { palette, spacing, radius } from '@/theme/tokens';
import type { Habit, HabitLog } from '@/lib/types';

const ICONS: Record<string, any> = {
  droplet: Droplet,
  footprints: Footprints,
  moon: Moon,
  'candy-off': CandyOff,
  dumbbell: Dumbbell,
  book: BookOpen,
  target: Target,
};
const ICON_CHOICES = ['target', 'droplet', 'footprints', 'moon', 'dumbbell', 'candy-off', 'book'];
const COLORS = [palette.primary, palette.water, palette.steps, palette.sleep, palette.coral, palette.amber, palette.violet];

function streakFor(dates: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  // allow today not yet done — start from today; if today missing, start yesterday
  if (!dates.has(isoDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(isoDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function Habits() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = todayISO();
  const since = isoDate(subDays(new Date(), 90));

  const habits = useList<Habit>('habits', { eq: { archived: false } });
  const logs = useList<HabitLog>('habit_logs', { gte: { column: 'date', value: since } });
  const addLog = useInsert('habit_logs');
  const delLog = useDelete('habit_logs');
  const [adding, setAdding] = useState(false);

  const byHabit = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    (logs.data ?? []).forEach((l) => (m[l.habit_id] ??= new Set()).add(l.date));
    return m;
  }, [logs.data]);
  const todayLogId = useMemo(() => {
    const m: Record<string, string> = {};
    (logs.data ?? []).forEach((l) => {
      if (l.date === today) m[l.habit_id] = l.id;
    });
    return m;
  }, [logs.data, today]);

  const toggle = (habit: Habit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const existing = todayLogId[habit.id];
    if (existing) delLog.mutate(existing);
    else addLog.mutate({ habit_id: habit.id, date: today, count: 1 });
  };

  const list = habits.data ?? [];
  const doneToday = list.filter((h) => byHabit[h.id]?.has(today)).length;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <View>
          <Text variant="h2">Habits</Text>
          <Text variant="caption" color="textTertiary">
            {doneToday}/{list.length} done today
          </Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={palette.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}>
        {list.length === 0 ? (
          <EmptyState icon={<CircleDot size={24} color={palette.primary} />} title="No habits yet" description="Build your daily streaks — water, steps, sleep, anything." />
        ) : (
          list.map((h) => {
            const dates = byHabit[h.id] ?? new Set<string>();
            const done = dates.has(today);
            const streak = streakFor(dates);
            const Icon = ICONS[h.icon ?? 'target'] ?? Target;
            const color = h.color ?? palette.primary;
            return (
              <Card key={h.id} style={{ marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodySemibold">{h.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Flame size={13} color={streak > 0 ? palette.amber : palette.textTertiary} />
                    <Text variant="caption" color={streak > 0 ? palette.amber : 'textTertiary'}>
                      {streak} day{streak === 1 ? '' : 's'} streak
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => toggle(h)}
                  style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? color : palette.surfaceElevated, borderWidth: 1, borderColor: done ? color : palette.border }}
                >
                  <Check size={20} color={done ? palette.textInverse : palette.textTertiary} />
                </Pressable>
              </Card>
            );
          })
        )}
        <Button variant="secondary" label="New habit" onPress={() => setAdding(true)} icon={<Plus size={18} color={palette.text} />} style={{ marginTop: spacing.sm }} />
      </ScrollView>

      <AddHabitSheet visible={adding} onClose={() => setAdding(false)} />
    </View>
  );
}

function AddHabitSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('target');
  const [color, setColor] = useState<string>(palette.primary);
  const insert = useInsert('habits');

  const submit = () => {
    if (!name.trim()) return;
    insert.mutate({ name: name.trim(), icon, color, archived: false, schedule: 'daily', target_per_day: 1 });
    setName('');
    setIcon('target');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="New habit">
      <Input placeholder="Habit name (e.g. 10k steps)" value={name} onChangeText={setName} containerStyle={{ marginBottom: spacing.lg }} autoFocus />
      <Text variant="label" color="textSecondary" style={{ marginBottom: spacing.sm }}>
        Icon
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' }}>
        {ICON_CHOICES.map((ic) => {
          const Icon = ICONS[ic] ?? Target;
          const active = icon === ic;
          return (
            <Pressable key={ic} onPress={() => setIcon(ic)} style={{ width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? palette.primarySoft : palette.surfaceElevated, borderWidth: 1, borderColor: active ? palette.primary : palette.border }}>
              <Icon size={20} color={active ? palette.primary : palette.textSecondary} />
            </Pressable>
          );
        })}
      </View>
      <Text variant="label" color="textSecondary" style={{ marginBottom: spacing.sm }}>
        Colour
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        {COLORS.map((c) => (
          <Pressable key={c} onPress={() => setColor(c)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: 3, borderColor: color === c ? palette.text : 'transparent' }} />
        ))}
      </View>
      <Button label="Create habit" onPress={submit} disabled={!name.trim()} />
    </Sheet>
  );
}

import { useMemo, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { addDays, format } from 'date-fns';
import { X, Plus, Check, Dumbbell, Footprints, Coffee, Bed, CalendarDays } from 'lucide-react-native';
import { Text, Card, Input, Button, Sheet, EmptyState } from '@/components/ui';
import { useList, useInsert, useUpdate, useDelete } from '@/lib/hooks';
import { isoDate, todayISO } from '@/lib/date';
import { palette, spacing, radius } from '@/theme/tokens';
import type { ScheduleBlock } from '@/lib/types';

const KINDS = [
  { key: 'workout', label: 'Workout', icon: Dumbbell, color: palette.primary },
  { key: 'cardio', label: 'Cardio', icon: Footprints, color: palette.cyan },
  { key: 'rest', label: 'Rest', icon: Bed, color: palette.violet },
  { key: 'meal', label: 'Meal', icon: Coffee, color: palette.amber },
  { key: 'custom', label: 'Custom', icon: CalendarDays, color: palette.textSecondary },
] as const;

export default function Schedule() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)), []);
  const [selected, setSelected] = useState(todayISO());
  const [adding, setAdding] = useState(false);

  const weekStart = isoDate(days[0]);
  const weekEnd = isoDate(days[days.length - 1]);
  const blocks = useList<ScheduleBlock>('schedule_blocks', { gte: { column: 'date', value: weekStart }, lte: { column: 'date', value: weekEnd } });
  const toggle = useUpdate('schedule_blocks');
  const remove = useDelete('schedule_blocks');

  const dayBlocks = useMemo(
    () => (blocks.data ?? []).filter((b) => b.date === selected).sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99')),
    [blocks.data, selected],
  );
  const countByDay = useMemo(() => {
    const m: Record<string, number> = {};
    (blocks.data ?? []).forEach((b) => (m[b.date] = (m[b.date] ?? 0) + 1));
    return m;
  }, [blocks.data]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <Text variant="h2">Plan</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={palette.text} />
        </Pressable>
      </View>

      {/* day strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }} style={{ flexGrow: 0, marginBottom: spacing.lg }}>
        {days.map((d) => {
          const iso = isoDate(d);
          const active = iso === selected;
          return (
            <Pressable
              key={iso}
              onPress={() => setSelected(iso)}
              style={{ width: 52, paddingVertical: spacing.md, borderRadius: radius.lg, alignItems: 'center', gap: 4, backgroundColor: active ? palette.primary : palette.surface, borderWidth: 1, borderColor: active ? palette.primary : palette.border }}
            >
              <Text variant="caption" color={active ? palette.textInverse : palette.textTertiary}>
                {format(d, 'EEE')}
              </Text>
              <Text variant="bodySemibold" color={active ? palette.textInverse : palette.text}>
                {format(d, 'd')}
              </Text>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: countByDay[iso] ? (active ? palette.textInverse : palette.primary) : 'transparent' }} />
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}>
        {dayBlocks.length === 0 ? (
          <EmptyState icon={<CalendarDays size={24} color={palette.primary} />} title="Nothing planned" description="Add a workout, cardio or rest day to build your week." />
        ) : (
          dayBlocks.map((b) => {
            const kind = KINDS.find((k) => k.key === b.kind) ?? KINDS[4];
            const Icon = kind.icon;
            return (
              <Card key={b.id} style={{ marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: `${kind.color}22`, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={kind.color} />
                </View>
                <Pressable style={{ flex: 1 }} onLongPress={() => remove.mutate(b.id)}>
                  <Text variant="bodySemibold" style={{ textDecorationLine: b.done ? 'line-through' : 'none' }} color={b.done ? 'textTertiary' : 'text'}>
                    {b.title}
                  </Text>
                  <Text variant="caption" color="textTertiary">
                    {b.time ? b.time.slice(0, 5) : 'Anytime'} · {b.kind}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => toggle.mutate({ id: b.id, values: { done: !b.done } })}
                  style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: b.done ? palette.primary : palette.surfaceElevated, borderWidth: 1, borderColor: b.done ? palette.primary : palette.border }}
                >
                  <Check size={16} color={b.done ? palette.textInverse : palette.textTertiary} />
                </Pressable>
              </Card>
            );
          })
        )}
        <Button variant="secondary" label="Add to this day" onPress={() => setAdding(true)} icon={<Plus size={18} color={palette.text} />} style={{ marginTop: spacing.sm }} />
      </ScrollView>

      <AddBlockSheet visible={adding} date={selected} onClose={() => setAdding(false)} />
    </View>
  );
}

function AddBlockSheet({ visible, date, onClose }: { visible: boolean; date: string; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<(typeof KINDS)[number]['key']>('workout');
  const [time, setTime] = useState('');
  const insert = useInsert('schedule_blocks');

  const submit = () => {
    insert.mutate({ title: title.trim() || KINDS.find((k) => k.key === kind)?.label, kind, date, time: time.trim() || null, done: false });
    setTitle('');
    setTime('');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Add to plan">
      <Input placeholder="Title (e.g. Push day)" value={title} onChangeText={setTitle} containerStyle={{ marginBottom: spacing.md }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }} style={{ marginBottom: spacing.md }}>
        {KINDS.map((k) => {
          const Icon = k.icon;
          const active = kind === k.key;
          return (
            <Pressable
              key={k.key}
              onPress={() => setKind(k.key)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: active ? k.color : palette.surfaceElevated, borderWidth: 1, borderColor: active ? k.color : palette.border }}
            >
              <Icon size={15} color={active ? palette.textInverse : palette.textSecondary} />
              <Text variant="label" color={active ? palette.textInverse : palette.textSecondary}>
                {k.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Input placeholder="Time (e.g. 18:00) — optional" value={time} onChangeText={setTime} containerStyle={{ marginBottom: spacing.lg }} />
      <Button label="Add" onPress={submit} />
    </Sheet>
  );
}

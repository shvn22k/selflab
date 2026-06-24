import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, Plus, X, Timer, Search, Dumbbell, ChevronRight } from 'lucide-react-native';
import { Text, Button, Card, Input, Sheet } from '@/components/ui';
import { useList } from '@/lib/hooks';
import { insertRow, updateRow } from '@/lib/data';
import { queryClient } from '@/lib/queryClient';
import { formatDuration } from '@/lib/date';
import { useProfileStore } from '@/stores/profile';
import { palette, spacing, radius } from '@/theme/tokens';
import type { Exercise, TemplateExercise } from '@/lib/types';

interface WSet {
  weight: string;
  reps: string;
  done: boolean;
}
interface WEx {
  key: string;
  exerciseId?: string;
  name: string;
  muscle?: string;
  sets: WSet[];
}

const REST_DEFAULT = 90;

export default function ActiveWorkout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, templateId } = useLocalSearchParams<{ id: string; templateId?: string }>();
  const weight = useProfileStore((s) => s.profile?.weight_kg) ?? 75;

  const startMs = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [exs, setExs] = useState<WEx[]>([]);
  const [picker, setPicker] = useState(false);
  const [rest, setRest] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);

  const tplExercises = useList<TemplateExercise>('template_exercises', templateId ? { eq: { template_id: templateId } } : { eq: { template_id: '__none__' } });

  // Prefill from a template once.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !templateId) return;
    const list = tplExercises.data ?? [];
    if (!list.length) return;
    prefilled.current = true;
    setExs(
      list.map((te) => ({
        key: te.id,
        exerciseId: te.exercise_id ?? undefined,
        name: te.exercise_name,
        sets: Array.from({ length: te.target_sets || 3 }, () => ({
          weight: te.target_weight_kg ? String(te.target_weight_kg) : '',
          reps: te.target_reps ? String(te.target_reps) : '',
          done: false,
        })),
      })),
    );
  }, [tplExercises.data, templateId]);

  // Elapsed timer.
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startMs.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // Rest countdown.
  useEffect(() => {
    if (rest == null) return;
    if (rest <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRest(null);
      return;
    }
    const t = setTimeout(() => setRest((r) => (r != null ? r - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const volume = useMemo(
    () =>
      exs.reduce(
        (a, ex) => a + ex.sets.reduce((s, set) => s + (set.done ? (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0) : 0), 0),
        0,
      ),
    [exs],
  );
  const doneSets = useMemo(() => exs.reduce((a, ex) => a + ex.sets.filter((s) => s.done).length, 0), [exs]);

  const addExercise = (ex: Exercise) => {
    setExs((prev) => [...prev, { key: `${ex.id}-${Date.now()}`, exerciseId: ex.id, name: ex.name, muscle: ex.muscle_group ?? undefined, sets: [{ weight: '', reps: '', done: false }] }]);
    setPicker(false);
  };
  const addSet = (i: number) =>
    setExs((prev) => prev.map((ex, idx) => (idx === i ? { ...ex, sets: [...ex.sets, { ...(ex.sets.at(-1) ?? { weight: '', reps: '' }), done: false }] } : ex)));
  const patchSet = (i: number, j: number, field: 'weight' | 'reps', val: string) =>
    setExs((prev) => prev.map((ex, idx) => (idx === i ? { ...ex, sets: ex.sets.map((s, k) => (k === j ? { ...s, [field]: val } : s)) } : ex)));
  const toggleDone = (i: number, j: number) =>
    setExs((prev) =>
      prev.map((ex, idx) => {
        if (idx !== i) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, k) => {
            if (k !== j) return s;
            const next = !s.done;
            if (next) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setRest(REST_DEFAULT);
            }
            return { ...s, done: next };
          }),
        };
      }),
    );

  const finish = async () => {
    setFinishing(true);
    const ended = new Date();
    const duration = Math.floor((Date.now() - startMs.current) / 1000);
    const calories = Math.round(5 * weight * (duration / 3600));
    try {
      await updateRow('workout_sessions', String(id), {
        ended_at: ended.toISOString(),
        duration_seconds: duration,
        total_volume_kg: Math.round(volume),
        calories,
      });
      for (const ex of exs) {
        let idx = 1;
        for (const s of ex.sets) {
          if (!s.done) continue;
          await insertRow('session_sets', {
            session_id: id,
            exercise_id: ex.exerciseId ?? null,
            exercise_name: ex.name,
            set_index: idx++,
            weight_kg: parseFloat(s.weight) || 0,
            reps: parseInt(s.reps) || 0,
            completed: true,
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['table', 'workout_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['table', 'session_sets'] });
    } finally {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/workouts');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={palette.text} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text variant="display" style={{ fontSize: 26 }}>
            {formatDuration(elapsed)}
          </Text>
          <Text variant="caption" color="textTertiary">
            {doneSets} sets · {Math.round(volume)} kg
          </Text>
        </View>
        <Pressable onPress={finish} hitSlop={10} style={{ paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: palette.primary }}>
          <Text variant="label" color={palette.textInverse}>
            Finish
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: rest != null ? 180 : 120 }} keyboardShouldPersistTaps="handled">
        {exs.map((ex, i) => (
          <Card key={ex.key} style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
              <Dumbbell size={16} color={palette.primary} />
              <View style={{ flex: 1 }}>
                <Text variant="bodySemibold">{ex.name}</Text>
                {ex.muscle ? (
                  <Text variant="caption" color="textTertiary">
                    {ex.muscle}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* set header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 6 }}>
              <Text variant="caption" color="textTertiary" style={{ width: 28 }}>
                #
              </Text>
              <Text variant="caption" color="textTertiary" style={{ flex: 1, textAlign: 'center' }}>
                KG
              </Text>
              <Text variant="caption" color="textTertiary" style={{ flex: 1, textAlign: 'center' }}>
                REPS
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {ex.sets.map((s, j) => (
              <View key={j} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text variant="bodyMedium" color="textTertiary" style={{ width: 28 }}>
                  {j + 1}
                </Text>
                <SetField value={s.weight} onChange={(v) => patchSet(i, j, 'weight', v)} done={s.done} />
                <SetField value={s.reps} onChange={(v) => patchSet(i, j, 'reps', v)} done={s.done} />
                <Pressable
                  onPress={() => toggleDone(i, j)}
                  style={{ width: 32, height: 32, marginLeft: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: s.done ? palette.primary : palette.surfaceElevated, borderWidth: 1, borderColor: s.done ? palette.primary : palette.border }}
                >
                  <Check size={16} color={s.done ? palette.textInverse : palette.textTertiary} />
                </Pressable>
              </View>
            ))}

            <Pressable onPress={() => addSet(i)} style={{ marginTop: spacing.xs, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.md, backgroundColor: palette.surfaceElevated }}>
              <Text variant="label" color={palette.primary}>
                + Add set
              </Text>
            </Pressable>
          </Card>
        ))}

        <Button variant="secondary" label="Add exercise" onPress={() => setPicker(true)} icon={<Plus size={18} color={palette.text} />} />
      </ScrollView>

      {/* Rest timer bar */}
      {rest != null && (
        <View style={{ position: 'absolute', bottom: insets.bottom + spacing.lg, left: spacing.xl, right: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.surfaceElevated, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderWidth: 1, borderColor: palette.borderStrong }}>
          <Timer size={18} color={palette.primary} />
          <Text variant="bodySemibold" style={{ flex: 1 }}>
            Rest · {formatDuration(rest)}
          </Text>
          <Pressable onPress={() => setRest((r) => (r ?? 0) + 30)} hitSlop={8}>
            <Text variant="label" color="textSecondary">
              +30s
            </Text>
          </Pressable>
          <Pressable onPress={() => setRest(null)} hitSlop={8}>
            <Text variant="label" color={palette.primary}>
              Skip
            </Text>
          </Pressable>
        </View>
      )}

      {/* Exercise picker */}
      <ExercisePicker visible={picker} onClose={() => setPicker(false)} onPick={addExercise} />
    </View>
  );
}

function SetField({ value, onChange, done }: { value: string; onChange: (v: string) => void; done: boolean }) {
  return (
    <View style={{ flex: 1, marginHorizontal: 4 }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="–"
        placeholderTextColor={palette.textTertiary}
        style={{
          textAlign: 'center',
          color: done ? palette.textTertiary : palette.text,
          fontFamily: 'SpaceGrotesk_600SemiBold',
          fontSize: 16,
          backgroundColor: palette.surfaceElevated,
          borderRadius: radius.sm,
          paddingVertical: 8,
        }}
      />
    </View>
  );
}

function ExercisePicker({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (e: Exercise) => void }) {
  const [q, setQ] = useState('');
  const exercises = useList<Exercise>('exercises', { limit: 300 });
  const results = useMemo(() => {
    const all = exercises.data ?? [];
    if (!q.trim()) return all.slice(0, 40);
    const lower = q.toLowerCase();
    return all.filter((e) => e.name.toLowerCase().includes(lower) || (e.muscle_group ?? '').toLowerCase().includes(lower)).slice(0, 40);
  }, [exercises.data, q]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Add exercise">
      <Input placeholder="Search exercises…" value={q} onChangeText={setQ} icon={<Search size={18} color={palette.textTertiary} />} containerStyle={{ marginBottom: spacing.md }} />
      <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
        {results.map((e) => (
          <Pressable key={e.id} onPress={() => onPick(e)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: palette.border }}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{e.name}</Text>
              <Text variant="caption" color="textTertiary">
                {e.muscle_group} · {e.equipment}
              </Text>
            </View>
            <ChevronRight size={16} color={palette.textTertiary} />
          </Pressable>
        ))}
      </ScrollView>
    </Sheet>
  );
}

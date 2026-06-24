import { useMemo, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X, Wind, Pill, Plus, Check, Brain, Smile } from 'lucide-react-native';
import { Text, Card, Button, Sheet, Input } from '@/components/ui';
import { useList, useInsert, useUpsert, useDelete } from '@/lib/hooks';
import { todayISO } from '@/lib/date';
import { palette, spacing, radius } from '@/theme/tokens';
import type { Checkin, Supplement, MeditationSession } from '@/lib/types';

const MOODS = ['😣', '🙁', '😐', '🙂', '😄'];
const SCALE = ['energy', 'stress'] as const;

export default function Wellbeing() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = todayISO();

  const checkins = useList<Checkin>('checkins', { eq: { date: today } });
  const upsertCheckin = useUpsert('checkins', ['user_id', 'date']);
  const supplements = useList<Supplement>('supplements', { eq: { active: true } });
  const suppLogs = useList<{ id: string; supplement_id: string; taken_at: string }>('supplement_logs', {
    gte: { column: 'taken_at', value: today },
  });
  const takeSupp = useInsert('supplement_logs');
  const meds = useList<MeditationSession>('meditation_sessions', { order: { column: 'created_at', ascending: false }, limit: 7 });
  const [addingSupp, setAddingSupp] = useState(false);

  const checkin = checkins.data?.[0];
  const minutesThisWeek = useMemo(() => (meds.data ?? []).reduce((a, m) => a + (m.minutes ?? 0), 0), [meds.data]);
  const takenIds = useMemo(() => new Set((suppLogs.data ?? []).map((l) => l.supplement_id)), [suppLogs.data]);

  const setMood = (v: number) => {
    Haptics.selectionAsync();
    upsertCheckin.mutate({ date: today, mood: v, energy: checkin?.energy, stress: checkin?.stress });
  };
  const setScale = (key: 'energy' | 'stress', v: number) => {
    Haptics.selectionAsync();
    upsertCheckin.mutate({ date: today, mood: checkin?.mood, energy: key === 'energy' ? v : checkin?.energy, stress: key === 'stress' ? v : checkin?.stress });
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <Text variant="h2">Wellbeing</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={palette.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}>
        {/* Daily check-in */}
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
            <Smile size={18} color={palette.amber} />
            <Text variant="h3">How are you?</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg }}>
            {MOODS.map((m, i) => (
              <Pressable key={i} onPress={() => setMood(i + 1)} style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: checkin?.mood === i + 1 ? palette.primarySoft : palette.surfaceElevated, borderWidth: 1, borderColor: checkin?.mood === i + 1 ? palette.primary : palette.border }}>
                <Text style={{ fontSize: 22 }}>{m}</Text>
              </Pressable>
            ))}
          </View>
          {SCALE.map((key) => (
            <View key={key} style={{ marginBottom: spacing.md }}>
              <Text variant="caption" color="textSecondary" style={{ textTransform: 'capitalize', marginBottom: 6 }}>
                {key}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = (checkin?.[key] ?? 0) === n;
                  return (
                    <Pressable key={n} onPress={() => setScale(key, n)} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: active || (checkin?.[key] ?? 0) >= n ? palette.primary : palette.surfaceHigh }} />
                  );
                })}
              </View>
            </View>
          ))}
        </Card>

        {/* Mind / breathwork */}
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
            <Brain size={18} color={palette.indigo} />
            <Text variant="h3">Mind</Text>
            {minutesThisWeek > 0 ? (
              <Text variant="caption" color="textTertiary">
                {Math.round(minutesThisWeek)} min this week
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable onPress={() => router.push({ pathname: '/breathwork', params: { preset: 'box' } })} style={{ flex: 1, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: palette.surfaceElevated, borderWidth: 1, borderColor: palette.border, gap: 6 }}>
              <Wind size={20} color={palette.indigo} />
              <Text variant="bodySemibold">Box breathing</Text>
              <Text variant="caption" color="textTertiary">
                4·4·4·4 · calm
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push({ pathname: '/breathwork', params: { preset: '478' } })} style={{ flex: 1, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: palette.surfaceElevated, borderWidth: 1, borderColor: palette.border, gap: 6 }}>
              <Wind size={20} color={palette.violet} />
              <Text variant="bodySemibold">4-7-8</Text>
              <Text variant="caption" color="textTertiary">
                wind down · sleep
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Supplements */}
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pill size={18} color={palette.emerald} />
              <Text variant="h3">Supplements</Text>
            </View>
            <Pressable onPress={() => setAddingSupp(true)} hitSlop={8}>
              <Plus size={20} color={palette.primary} />
            </Pressable>
          </View>
          {(supplements.data ?? []).length === 0 ? (
            <Text variant="caption" color="textTertiary">
              Add supplements or meds to track and get reminders.
            </Text>
          ) : (
            (supplements.data ?? []).map((s) => {
              const taken = takenIds.has(s.id);
              return (
                <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{s.name}</Text>
                    {s.dose ? (
                      <Text variant="caption" color="textTertiary">
                        {s.dose}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    disabled={taken}
                    onPress={() => takeSupp.mutate({ supplement_id: s.id, name: s.name, taken_at: new Date().toISOString() })}
                    style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: taken ? palette.emerald : palette.surfaceElevated, borderWidth: 1, borderColor: taken ? palette.emerald : palette.border }}
                  >
                    <Check size={16} color={taken ? palette.textInverse : palette.textTertiary} />
                  </Pressable>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>

      <AddSupplementSheet visible={addingSupp} onClose={() => setAddingSupp(false)} />
    </View>
  );
}

function AddSupplementSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const insert = useInsert('supplements');
  const submit = () => {
    if (!name.trim()) return;
    insert.mutate({ name: name.trim(), dose: dose.trim() || null, active: true });
    setName('');
    setDose('');
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Add supplement">
      <Input label="Name" placeholder="e.g. Creatine" value={name} onChangeText={setName} containerStyle={{ marginBottom: spacing.md }} autoFocus />
      <Input label="Dose" placeholder="e.g. 5 g" value={dose} onChangeText={setDose} containerStyle={{ marginBottom: spacing.lg }} />
      <Button label="Add" onPress={submit} disabled={!name.trim()} />
    </Sheet>
  );
}

import { useMemo, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Search, Dumbbell } from 'lucide-react-native';
import { Text, Input, Card } from '@/components/ui';
import { useList } from '@/lib/hooks';
import { palette, spacing, radius } from '@/theme/tokens';
import type { Exercise } from '@/lib/types';

export default function ExerciseLibrary() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState('');
  const exercises = useList<Exercise>('exercises', { limit: 400 });

  const grouped = useMemo(() => {
    const all = exercises.data ?? [];
    const lower = q.toLowerCase();
    const filtered = lower ? all.filter((e) => e.name.toLowerCase().includes(lower) || (e.muscle_group ?? '').toLowerCase().includes(lower)) : all;
    const map: Record<string, Exercise[]> = {};
    filtered.forEach((e) => {
      const g = e.muscle_group ?? 'Other';
      (map[g] ??= []).push(e);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [exercises.data, q]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <Text variant="h2">Exercise library</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={palette.text} />
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
        <Input placeholder="Search exercises…" value={q} onChangeText={setQ} icon={<Search size={18} color={palette.textTertiary} />} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {grouped.map(([group, items]) => (
          <View key={group} style={{ marginBottom: spacing.lg }}>
            <Text variant="label" color="textTertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm }}>
              {group}
            </Text>
            {items.map((e) => (
              <Card key={e.id} style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md }} padded>
                <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Dumbbell size={18} color={palette.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{e.name}</Text>
                  <Text variant="caption" color="textTertiary">
                    {e.equipment} · {e.category}
                    {e.is_compound ? ' · compound' : ''}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

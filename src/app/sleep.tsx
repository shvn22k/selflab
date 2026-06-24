import { useMemo, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { X, Moon, Plus, HeartPulse, Activity } from 'lucide-react-native';
import { Text, Card, Ring, Button, Sheet, Input } from '@/components/ui';
import { BarChart } from '@/components/charts/BarChart';
import { useList, useUpsert } from '@/lib/hooks';
import { computeReadiness } from '@/lib/readiness';
import { todayISO } from '@/lib/date';
import { palette, spacing, radius } from '@/theme/tokens';
import type { SleepLog, BodyMetric } from '@/lib/types';

function readinessColor(score: number): string {
  if (score >= 80) return palette.success;
  if (score >= 60) return palette.primary;
  if (score >= 40) return palette.warning;
  return palette.danger;
}

export default function Sleep() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sleeps = useList<SleepLog>('sleep_logs', { order: { column: 'date', ascending: false }, limit: 14 });
  const body = useList<BodyMetric>('body_metrics', { order: { column: 'date', ascending: false }, limit: 30 });
  const [logging, setLogging] = useState(false);

  const latest = sleeps.data?.[0] ?? null;

  const readiness = useMemo(() => {
    const b = body.data ?? [];
    const restingHrs = b.filter((x) => x.resting_hr != null).map((x) => x.resting_hr as number);
    const hrvs = b.filter((x) => x.hrv_ms != null).map((x) => x.hrv_ms as number);
    const avg = (a: number[]) => (a.length ? a.reduce((p, c) => p + c, 0) / a.length : null);
    return computeReadiness({
      sleepMinutes: latest?.duration_minutes ?? null,
      sleepQuality: latest?.quality ?? null,
      restingHr: restingHrs[0] ?? null,
      restingHrBaseline: avg(restingHrs),
      hrv: hrvs[0] ?? null,
      hrvBaseline: avg(hrvs),
    });
  }, [body.data, latest]);

  const chart = useMemo(() => {
    const last7 = (sleeps.data ?? []).slice(0, 7).reverse();
    return last7.map((s) => ({ label: format(new Date(s.date), 'EEE')[0], value: (s.duration_minutes ?? 0) / 60, highlight: s.date === todayISO() }));
  }, [sleeps.data]);

  const restingHr = (body.data ?? []).find((b) => b.resting_hr != null)?.resting_hr;
  const hrv = (body.data ?? []).find((b) => b.hrv_ms != null)?.hrv_ms;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <Text variant="h2">Sleep & Recovery</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={palette.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}>
        {/* Readiness */}
        <Card sheen style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xl }}>
            <Ring progress={readiness.score / 100} size={112} stroke={11} color={readinessColor(readiness.score)} colorTo={palette.teal}>
              <Text variant="display" style={{ fontSize: 28 }}>
                {readiness.score}
              </Text>
              <Text variant="caption" color="textTertiary">
                readiness
              </Text>
            </Ring>
            <View style={{ flex: 1, gap: 6 }}>
              <Text variant="h3">{readiness.label}</Text>
              <Text variant="caption" color="textSecondary" style={{ lineHeight: 18 }}>
                {readiness.recommendation}
              </Text>
            </View>
          </View>
        </Card>

        {/* Sleep duration chart */}
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Moon size={18} color={palette.sleep} />
              <Text variant="h3">Last 7 nights</Text>
            </View>
            {latest ? (
              <Text variant="caption" color="textSecondary">
                {Math.floor((latest.duration_minutes ?? 0) / 60)}h {(latest.duration_minutes ?? 0) % 60}m last
              </Text>
            ) : null}
          </View>
          {chart.length ? <BarChart data={chart} color={palette.sleep} goal={8} height={120} /> : <Text variant="caption" color="textTertiary">No sleep logged yet.</Text>}
        </Card>

        {/* Vitals */}
        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
          <Card style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <HeartPulse size={18} color={palette.heart} />
            <Text variant="h2">{restingHr ?? '--'}</Text>
            <Text variant="caption" color="textTertiary">
              Resting HR
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Activity size={18} color={palette.readiness} />
            <Text variant="h2">{hrv ? Math.round(hrv) : '--'}</Text>
            <Text variant="caption" color="textTertiary">
              HRV (ms)
            </Text>
          </Card>
        </View>

        <Button label="Log sleep" onPress={() => setLogging(true)} icon={<Plus size={18} color={palette.textInverse} />} />
      </ScrollView>

      <LogSleepSheet visible={logging} onClose={() => setLogging(false)} />
    </View>
  );
}

function LogSleepSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [hours, setHours] = useState('7');
  const [minutes, setMinutes] = useState('30');
  const [quality, setQuality] = useState(75);
  const upsert = useUpsert('sleep_logs', ['user_id', 'date']);

  const submit = () => {
    const dur = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    upsert.mutate({ date: todayISO(), duration_minutes: dur, quality, source: 'manual' });
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Log last night">
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <Input label="Hours" value={hours} onChangeText={setHours} keyboardType="number-pad" containerStyle={{ flex: 1 }} />
        <Input label="Minutes" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" containerStyle={{ flex: 1 }} />
      </View>
      <Text variant="label" color="textSecondary" style={{ marginBottom: spacing.sm }}>
        Quality
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        {[
          { q: 40, l: 'Poor' },
          { q: 60, l: 'Okay' },
          { q: 75, l: 'Good' },
          { q: 90, l: 'Great' },
        ].map((opt) => (
          <Pressable
            key={opt.q}
            onPress={() => setQuality(opt.q)}
            style={{ flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', backgroundColor: quality === opt.q ? palette.sleep : palette.surfaceElevated, borderWidth: 1, borderColor: quality === opt.q ? palette.sleep : palette.border }}
          >
            <Text variant="label" color={quality === opt.q ? palette.textInverse : palette.textSecondary}>
              {opt.l}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button label="Save" onPress={submit} />
    </Sheet>
  );
}

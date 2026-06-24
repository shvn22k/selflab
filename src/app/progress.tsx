import { useMemo, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { X, Plus, TrendingDown, TrendingUp, Camera, Scale } from 'lucide-react-native';
import { Text, Card, Button, Sheet, Input } from '@/components/ui';
import { LineChart } from '@/components/charts/LineChart';
import { useList, useInsert } from '@/lib/hooks';
import { uploadProgressPhoto } from '@/lib/photos';
import { todayISO } from '@/lib/date';
import { palette, spacing, radius } from '@/theme/tokens';
import type { BodyMetric, ProgressPhoto } from '@/lib/types';

export default function Progress() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const metrics = useList<BodyMetric>('body_metrics', { order: { column: 'date', ascending: true }, limit: 90 });
  const photos = useList<ProgressPhoto>('progress_photos', { order: { column: 'date', ascending: false }, limit: 30 });
  const insertPhoto = useInsert('progress_photos');
  const [logging, setLogging] = useState(false);

  const series = useMemo(() => (metrics.data ?? []).filter((m) => m.weight_kg != null).map((m) => m.weight_kg as number), [metrics.data]);
  const latest = (metrics.data ?? []).at(-1);
  const delta = series.length > 1 ? series[series.length - 1] - series[0] : 0;

  const addPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (res.canceled || !res.assets[0]) return;
    const uri = res.assets[0].uri;
    const stored = await uploadProgressPhoto(uri);
    insertPhoto.mutate({ date: todayISO(), storage_path: stored, pose: 'front' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <Text variant="h2">Progress</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={palette.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}>
        {/* Weight */}
        <Card sheen style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <View>
              <Text variant="caption" color="textTertiary" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                Weight
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <Text variant="hero" style={{ fontSize: 36 }}>
                  {latest?.weight_kg?.toFixed(1) ?? '--'}
                </Text>
                <Text variant="body" color="textSecondary">
                  kg
                </Text>
              </View>
            </View>
            {series.length > 1 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.lg }}>
                {delta <= 0 ? <TrendingDown size={16} color={palette.success} /> : <TrendingUp size={16} color={palette.warning} />}
                <Text variant="bodyMedium" color={delta <= 0 ? palette.success : palette.warning}>
                  {delta > 0 ? '+' : ''}
                  {delta.toFixed(1)} kg
                </Text>
              </View>
            ) : null}
          </View>
          {series.length > 1 ? (
            <LineChart data={series} width={300} height={110} color={palette.primary} />
          ) : (
            <Text variant="caption" color="textTertiary">
              Log your weight a few times to see your trend.
            </Text>
          )}
        </Card>

        {/* Composition */}
        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
          <Metric label="Body fat" value={latest?.body_fat_pct != null ? `${latest.body_fat_pct}%` : '--'} />
          <Metric label="Waist" value={latest?.waist_cm != null ? `${latest.waist_cm} cm` : '--'} />
          <Metric label="Resting HR" value={latest?.resting_hr != null ? `${latest.resting_hr}` : '--'} />
        </View>

        {/* Photos */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text variant="h3">Progress photos</Text>
          <Pressable onPress={addPhoto} hitSlop={8}>
            <Camera size={20} color={palette.primary} />
          </Pressable>
        </View>
        {(photos.data ?? []).length === 0 ? (
          <Pressable onPress={addPhoto}>
            <Card style={{ alignItems: 'center', paddingVertical: spacing['2xl'], marginBottom: spacing.lg }}>
              <Camera size={26} color={palette.textTertiary} />
              <Text variant="caption" color="textTertiary" style={{ marginTop: spacing.sm }}>
                Add your first photo
              </Text>
            </Card>
          </Pressable>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }} style={{ marginBottom: spacing.lg }}>
            {(photos.data ?? []).map((p) => (
              <View key={p.id} style={{ width: 130 }}>
                <Image source={{ uri: p.storage_path }} style={{ width: 130, height: 180, borderRadius: radius.lg, backgroundColor: palette.surfaceHigh }} contentFit="cover" />
                <Text variant="caption" color="textTertiary" style={{ marginTop: 4 }}>
                  {format(new Date(p.date), 'd MMM')}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        <Button label="Log weight & metrics" onPress={() => setLogging(true)} icon={<Scale size={18} color={palette.textInverse} />} />
      </ScrollView>

      <LogMetricsSheet visible={logging} onClose={() => setLogging(false)} />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', gap: 4 }} padded>
      <Text variant="h3" style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
        {value}
      </Text>
      <Text variant="caption" color="textTertiary">
        {label}
      </Text>
    </Card>
  );
}

function LogMetricsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [weight, setWeight] = useState('');
  const [bf, setBf] = useState('');
  const [waist, setWaist] = useState('');
  const insert = useInsert('body_metrics');
  const submit = () => {
    insert.mutate({
      date: todayISO(),
      weight_kg: parseFloat(weight) || null,
      body_fat_pct: parseFloat(bf) || null,
      waist_cm: parseFloat(waist) || null,
    });
    setWeight('');
    setBf('');
    setWaist('');
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Log metrics">
      <Input label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" containerStyle={{ marginBottom: spacing.md }} autoFocus />
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <Input label="Body fat %" value={bf} onChangeText={setBf} keyboardType="numeric" containerStyle={{ flex: 1 }} />
        <Input label="Waist (cm)" value={waist} onChangeText={setWaist} keyboardType="numeric" containerStyle={{ flex: 1 }} />
      </View>
      <Button label="Save" onPress={submit} />
    </Sheet>
  );
}

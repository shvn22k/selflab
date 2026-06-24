import { useMemo } from 'react';
import { View, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { format } from 'date-fns';
import { X, Timer, Flame, Mountain, Gauge, MapPin } from 'lucide-react-native';
import { Text, Card } from '@/components/ui';
import { useList } from '@/lib/hooks';
import { formatDistance } from '@/lib/activity';
import { formatDuration, formatPace } from '@/lib/date';
import { palette, spacing, radius } from '@/theme/tokens';
import type { Activity } from '@/lib/types';

export default function ActivityDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const activities = useList<Activity>('activities', { eq: { id: String(id) } });
  const a = activities.data?.[0];

  const region = useMemo(() => {
    const pts = a?.route ?? [];
    if (!pts.length) return null;
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    return {
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitudeDelta: Math.max(Math.max(...lats) - Math.min(...lats), 0.01) * 1.4,
      longitudeDelta: Math.max(Math.max(...lngs) - Math.min(...lngs), 0.01) * 1.4,
    };
  }, [a?.route]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <Text variant="h2" style={{ textTransform: 'capitalize' }}>
          {a?.type ?? 'Activity'}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={palette.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}>
        {!a ? (
          <Text variant="body" color="textTertiary">
            Activity not found.
          </Text>
        ) : (
          <>
            <Text variant="caption" color="textTertiary" style={{ marginBottom: spacing.lg }}>
              {format(new Date(a.started_at), 'EEEE, d MMM · HH:mm')}
            </Text>

            {region ? (
              <View style={{ height: 220, borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.lg, borderWidth: 1, borderColor: palette.border }}>
                <MapView
                  style={{ flex: 1 }}
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  initialRegion={region}
                  scrollEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Polyline coordinates={(a.route ?? []).map((p) => ({ latitude: p.lat, longitude: p.lng }))} strokeColor={palette.primary} strokeWidth={4} />
                </MapView>
              </View>
            ) : (
              <Card style={{ alignItems: 'center', paddingVertical: spacing['2xl'], marginBottom: spacing.lg }}>
                <MapPin size={24} color={palette.textTertiary} />
                <Text variant="caption" color="textTertiary" style={{ marginTop: spacing.sm }}>
                  No GPS route recorded for this session.
                </Text>
              </Card>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              <DetailStat icon={<MapPin size={16} color={palette.steps} />} label="Distance" value={formatDistance(a.distance_m ?? 0)} />
              <DetailStat icon={<Timer size={16} color={palette.cyan} />} label="Duration" value={formatDuration(a.duration_seconds ?? 0)} />
              <DetailStat icon={<Gauge size={16} color={palette.primary} />} label="Pace" value={formatPace(a.avg_pace_s_per_km)} />
              <DetailStat icon={<Flame size={16} color={palette.calories} />} label="Calories" value={`${Math.round(a.calories ?? 0)}`} />
              <DetailStat icon={<Mountain size={16} color={palette.violet} />} label="Elevation" value={`${Math.round(a.elevation_gain_m ?? 0)} m`} />
              {a.avg_hr ? <DetailStat icon={<Flame size={16} color={palette.heart} />} label="Avg HR" value={`${a.avg_hr}`} /> : null}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function DetailStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card style={{ width: '47%', gap: 6 }} padded>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon}
        <Text variant="caption" color="textTertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Text>
      </View>
      <Text variant="h2" style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
        {value}
      </Text>
    </Card>
  );
}

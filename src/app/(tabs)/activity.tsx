import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Footprints,
  MapPin,
  Play,
  Activity as ActIcon,
  Watch,
  Timer,
  Flame,
  Mountain,
  Bike,
  Wind,
} from 'lucide-react-native';
import { Screen, Text, Card, Ring, Button, EmptyState } from '@/components/ui';
import { useList } from '@/lib/hooks';
import { useProfileStore } from '@/stores/profile';
import { useSettings } from '@/stores/settings';
import { todayISO, formatDuration, formatPace, prettyDate } from '@/lib/date';
import { formatDistance } from '@/lib/activity';
import { requestHealthPermissions, syncHealthData, isHealthConnectSupported } from '@/lib/healthConnect';
import { palette, spacing, radius, gradients } from '@/theme/tokens';
import type { Activity, DailySteps } from '@/lib/types';

const TYPE_ICON: Record<string, any> = { run: ActIcon, walk: Footprints, ride: Bike, hike: Mountain, other: Wind };

export default function ActivityScreen() {
  const router = useRouter();
  const stepTarget = useProfileStore((s) => s.profile?.step_target) ?? 9000;
  const { healthConnectEnabled, setHealthConnectEnabled } = useSettings();
  const [syncing, setSyncing] = useState(false);

  const steps = useList<DailySteps>('daily_steps', { eq: { date: todayISO() } });
  const activities = useList<Activity>('activities', { order: { column: 'started_at', ascending: false }, limit: 20 });

  const todaySteps = steps.data?.[0];
  const stepCount = todaySteps?.steps ?? 0;

  const connectHealth = async () => {
    setSyncing(true);
    const ok = await requestHealthPermissions();
    if (ok) {
      setHealthConnectEnabled(true);
      await syncHealthData();
      steps.refetch();
    }
    setSyncing(false);
  };

  return (
    <Screen
      onRefresh={() => {
        steps.refetch();
        activities.refetch();
      }}
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="h1">Activity</Text>
          {isHealthConnectSupported() && (
            <Pressable
              onPress={async () => {
                setSyncing(true);
                await syncHealthData();
                steps.refetch();
                setSyncing(false);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: palette.surfaceElevated, borderWidth: 1, borderColor: palette.border }}
            >
              <Watch size={15} color={healthConnectEnabled ? palette.steps : palette.textTertiary} />
              <Text variant="caption" color={healthConnectEnabled ? palette.steps : 'textTertiary'}>
                {syncing ? 'Syncing…' : healthConnectEnabled ? 'Synced' : 'Health'}
              </Text>
            </Pressable>
          )}
        </View>
      }
    >
      {/* Steps hero */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Card style={{ marginBottom: spacing.lg, alignItems: 'center', paddingVertical: spacing['2xl'] }} sheen>
          <Ring progress={stepCount / stepTarget} size={170} stroke={15} color={palette.steps} colorTo={palette.primary}>
            <Footprints size={22} color={palette.steps} />
            <Text variant="hero" style={{ fontSize: 40, marginTop: 4 }}>
              {stepCount.toLocaleString()}
            </Text>
            <Text variant="caption" color="textTertiary">
              of {stepTarget.toLocaleString()} steps
            </Text>
          </Ring>
          <View style={{ flexDirection: 'row', gap: spacing['3xl'], marginTop: spacing.xl }}>
            <MiniStat label="Distance" value={formatDistance(todaySteps?.distance_m ?? 0)} />
            <MiniStat label="Active" value={`${todaySteps?.active_minutes ?? 0}m`} />
            <MiniStat label="Floors" value={`${todaySteps?.floors ?? 0}`} />
          </View>
        </Card>
      </Animated.View>

      {/* Start session */}
      <Animated.View entering={FadeInDown.duration(400).delay(60)}>
        <Pressable onPress={() => router.push('/activity/live')}>
          <View style={{ borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.lg }}>
            <LinearGradient colors={gradients.lime} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={24} color={palette.textInverse} fill={palette.textInverse} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h3" color={palette.textInverse}>
                  Start a session
                </Text>
                <Text variant="caption" color="rgba(10,11,14,0.7)">
                  Track a run, walk, ride or hike with live GPS
                </Text>
              </View>
            </LinearGradient>
          </View>
        </Pressable>
      </Animated.View>

      {/* Health Connect prompt */}
      {isHealthConnectSupported() && !healthConnectEnabled && (
        <Animated.View entering={FadeInDown.duration(400).delay(120)}>
          <Card glow={palette.steps} style={{ marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Watch size={22} color={palette.steps} />
            <View style={{ flex: 1 }}>
              <Text variant="bodySemibold">Connect your watch</Text>
              <Text variant="caption" color="textTertiary">
                Sync steps, heart rate, HRV & sleep from Health Connect.
              </Text>
            </View>
            <Button label="Connect" size="sm" fullWidth={false} onPress={connectHealth} loading={syncing} />
          </Card>
        </Animated.View>
      )}

      {/* Recent activity feed */}
      <Text variant="h3" style={{ marginBottom: spacing.md, marginTop: spacing.xs }}>
        Recent
      </Text>
      {(activities.data ?? []).length === 0 ? (
        <EmptyState
          icon={<MapPin size={24} color={palette.steps} />}
          title="No sessions yet"
          description="Your runs, walks and rides will appear here as a private feed."
        />
      ) : (
        (activities.data ?? []).map((a, i) => {
          const Icon = TYPE_ICON[a.type] ?? ActIcon;
          return (
            <Animated.View key={a.id} entering={FadeInDown.duration(350).delay(i * 40)}>
              <Pressable onPress={() => router.push(`/activity/${a.id}`)}>
                <Card style={{ marginBottom: spacing.md }} padded>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                    <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color={palette.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySemibold" style={{ textTransform: 'capitalize' }}>
                        {a.type}
                      </Text>
                      <Text variant="caption" color="textTertiary">
                        {prettyDate(a.started_at.slice(0, 10))}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <FeedStat icon={<MapPin size={13} color={palette.textTertiary} />} value={formatDistance(a.distance_m ?? 0)} />
                    <FeedStat icon={<Timer size={13} color={palette.textTertiary} />} value={formatDuration(a.duration_seconds ?? 0)} />
                    <FeedStat icon={<ActIcon size={13} color={palette.textTertiary} />} value={formatPace(a.avg_pace_s_per_km)} />
                    <FeedStat icon={<Flame size={13} color={palette.textTertiary} />} value={`${Math.round(a.calories ?? 0)} kcal`} />
                  </View>
                </Card>
              </Pressable>
            </Animated.View>
          );
        })
      )}
    </Screen>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="h3" style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}>
        {value}
      </Text>
      <Text variant="caption" color="textTertiary">
        {label}
      </Text>
    </View>
  );
}

function FeedStat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      {icon}
      <Text variant="caption" color="textSecondary">
        {value}
      </Text>
    </View>
  );
}

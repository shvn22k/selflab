import { useEffect, useRef, useState } from 'react';
import { View, Pressable, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { X, Play, Pause, Square } from 'lucide-react-native';
import { Text, Chip } from '@/components/ui';
import { routeDistance, avgPace, activityCalories, computeSplits, formatDistance } from '@/lib/activity';
import { formatDuration, formatPace } from '@/lib/date';
import { insertRow } from '@/lib/data';
import { useProfileStore } from '@/stores/profile';
import { palette, spacing, radius, gradients } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import type { Activity, RoutePoint } from '@/lib/types';

type Phase = 'idle' | 'tracking' | 'paused';
const TYPES: Activity['type'][] = ['run', 'walk', 'ride', 'hike'];

export default function LiveActivity() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const weight = useProfileStore((s) => s.profile?.weight_kg) ?? 75;

  const [type, setType] = useState<Activity['type']>('run');
  const [phase, setPhase] = useState<Phase>('idle');
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const startRef = useRef<number>(0);
  const accumRef = useRef<number>(0);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => setHasPermission(status === 'granted'));
    return () => {
      watchRef.current?.remove();
    };
  }, []);

  // elapsed timer
  useEffect(() => {
    if (phase !== 'tracking') return;
    const id = setInterval(() => setElapsed(accumRef.current + (Date.now() - startRef.current) / 1000), 250);
    return () => clearInterval(id);
  }, [phase]);

  const startWatch = async () => {
    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5, timeInterval: 2000 },
      (loc) => {
        if (phaseRef.current !== 'tracking') return;
        setPoints((prev) => [
          ...prev,
          { lat: loc.coords.latitude, lng: loc.coords.longitude, t: loc.timestamp, alt: loc.coords.altitude ?? undefined },
        ]);
      },
    );
  };

  const start = async () => {
    if (!hasPermission) {
      Alert.alert('Location needed', 'Enable location to track your route.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startRef.current = Date.now();
    setPhase('tracking');
    await startWatch();
  };

  const pause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    accumRef.current += (Date.now() - startRef.current) / 1000;
    setPhase('paused');
  };

  const resume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    startRef.current = Date.now();
    setPhase('tracking');
  };

  const distance = routeDistance(points);
  const pace = avgPace(distance, elapsed);
  const calories = activityCalories(type, weight, elapsed);

  const finish = async () => {
    watchRef.current?.remove();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (elapsed > 5) {
      await insertRow<Activity>('activities', {
        type,
        started_at: new Date(Date.now() - elapsed * 1000).toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: Math.round(elapsed),
        distance_m: Math.round(distance),
        avg_pace_s_per_km: Math.round(pace),
        calories,
        route: points,
        source: 'app',
      });
    }
    router.back();
  };

  const region =
    points.length > 0
      ? { latitude: points[points.length - 1].lat, longitude: points[points.length - 1].lng, latitudeDelta: 0.005, longitudeDelta: 0.005 }
      : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <MapView
        style={{ flex: 1 }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
        followsUserLocation
        region={region}
        customMapStyle={DARK_MAP}
      >
        {points.length > 1 && (
          <Polyline coordinates={points.map((p) => ({ latitude: p.lat, longitude: p.lng }))} strokeColor={palette.primary} strokeWidth={5} />
        )}
      </MapView>

      {/* close */}
      <Pressable
        onPress={() => router.back()}
        style={{ position: 'absolute', top: insets.top + spacing.sm, left: spacing.xl, width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border }}
      >
        <X size={20} color={palette.text} />
      </Pressable>

      {/* type selector */}
      {phase === 'idle' && (
        <View style={{ position: 'absolute', top: insets.top + spacing.sm, right: spacing.xl, flexDirection: 'row', gap: spacing.xs }}>
          {TYPES.map((tp) => (
            <Chip key={tp} label={tp} active={type === tp} onPress={() => setType(tp)} />
          ))}
        </View>
      )}

      {/* stats + controls panel */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: palette.bgElevated,
          borderTopLeftRadius: radius['2xl'],
          borderTopRightRadius: radius['2xl'],
          paddingTop: spacing.xl,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
          borderTopWidth: 1,
          borderColor: palette.borderStrong,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl }}>
          <BigStat label="Distance" value={formatDistance(distance)} />
          <BigStat label="Time" value={formatDuration(elapsed)} />
          <BigStat label="Pace" value={formatPace(pace)} />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center', justifyContent: 'center' }}>
          {phase === 'idle' && <ControlButton icon={<Play size={28} color={palette.textInverse} fill={palette.textInverse} />} primary onPress={start} />}
          {phase === 'tracking' && <ControlButton icon={<Pause size={26} color={palette.text} />} onPress={pause} />}
          {phase === 'paused' && (
            <>
              <ControlButton icon={<Square size={24} color={palette.danger} fill={palette.danger} />} onPress={finish} />
              <ControlButton icon={<Play size={26} color={palette.textInverse} fill={palette.textInverse} />} primary onPress={resume} />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="caption" color="textTertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </Text>
      <Text variant="display" style={{ fontSize: 28, marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

function ControlButton({ icon, onPress, primary }: { icon: React.ReactNode; onPress: () => void; primary?: boolean }) {
  if (primary) {
    return (
      <Pressable onPress={onPress}>
        <LinearGradient colors={gradients.primary} style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.borderStrong }}
    >
      {icon}
    </Pressable>
  );
}

// Minimal dark map theme
const DARK_MAP = [
  { elementType: 'geometry', stylers: [{ color: '#0f1116' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6a6f7a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1116' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#23262f' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0b0e' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

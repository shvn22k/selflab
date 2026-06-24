import { useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { Text, Button } from '@/components/ui';
import { useInsert } from '@/lib/hooks';
import { palette, spacing, gradients } from '@/theme/tokens';

interface Phase {
  label: string;
  seconds: number;
  scale: number;
}

const PRESETS: Record<string, { name: string; phases: Phase[] }> = {
  box: {
    name: 'Box breathing',
    phases: [
      { label: 'Breathe in', seconds: 4, scale: 1 },
      { label: 'Hold', seconds: 4, scale: 1 },
      { label: 'Breathe out', seconds: 4, scale: 0.55 },
      { label: 'Hold', seconds: 4, scale: 0.55 },
    ],
  },
  '478': {
    name: '4-7-8 breathing',
    phases: [
      { label: 'Breathe in', seconds: 4, scale: 1 },
      { label: 'Hold', seconds: 7, scale: 1 },
      { label: 'Breathe out', seconds: 8, scale: 0.5 },
    ],
  },
};

export default function Breathwork() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const config = PRESETS[preset ?? 'box'] ?? PRESETS.box;
  const insert = useInsert('meditation_sessions');

  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [count, setCount] = useState(config.phases[0].seconds);
  const [elapsed, setElapsed] = useState(0);
  const scale = useSharedValue(0.55);
  const startRef = useRef(Date.now());

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Drive the breathing cycle.
  useEffect(() => {
    if (!running) return;
    const phase = config.phases[phaseIdx];
    scale.value = withTiming(phase.scale, { duration: phase.seconds * 1000, easing: Easing.inOut(Easing.ease) });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    setCount(phase.seconds);

    const tick = setInterval(() => setCount((c) => Math.max(c - 1, 0)), 1000);
    const next = setTimeout(() => {
      setPhaseIdx((i) => (i + 1) % config.phases.length);
    }, phase.seconds * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(next);
    };
  }, [running, phaseIdx, config.phases, scale]);

  // Total elapsed seconds.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [running]);

  const start = () => {
    startRef.current = Date.now();
    setPhaseIdx(0);
    setRunning(true);
  };

  const finish = () => {
    const minutes = Math.round((elapsed / 60) * 10) / 10;
    if (minutes >= 0.3) insert.mutate({ kind: 'breathwork', minutes, preset: preset ?? 'box' });
    router.back();
  };

  const phase = config.phases[phaseIdx];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl }}>
        <Text variant="h3">{config.name}</Text>
        <Pressable onPress={finish} hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={palette.text} />
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[{ position: 'absolute', width: 280, height: 280, borderRadius: 140, overflow: 'hidden' }, animatedStyle]}>
            <LinearGradient colors={gradients.twilight} style={{ flex: 1, opacity: 0.85 }} />
          </Animated.View>
          <View style={{ alignItems: 'center' }}>
            <Text variant="h2" color={palette.white}>
              {running ? phase.label : 'Ready'}
            </Text>
            {running ? (
              <Text variant="display" color={palette.white} style={{ fontSize: 44 }}>
                {count}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
        {running ? (
          <Text variant="caption" color="textTertiary" align="center">
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} · breathe with the circle
          </Text>
        ) : null}
        {!running ? (
          <Button label="Begin" onPress={start} />
        ) : (
          <Button variant="secondary" label="Finish & save" onPress={finish} />
        )}
      </View>
    </View>
  );
}

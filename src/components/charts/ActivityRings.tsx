import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { palette } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface RingSpec {
  progress: number; // 0..1+
  color: string;
}

interface ActivityRingsProps {
  rings: RingSpec[]; // outer → inner
  size?: number;
  stroke?: number;
  gap?: number;
}

function AnimatedRing({ cx, cy, r, color, progress, stroke }: { cx: number; cy: number; r: number; color: string; progress: number; stroke: number }) {
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(progress, 1));
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = withTiming(clamped, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [clamped, anim]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - anim.value) }));
  return (
    <>
      <Circle cx={cx} cy={cy} r={r} stroke={`${color}26`} strokeWidth={stroke} fill="none" />
      <AnimatedCircle
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
      />
    </>
  );
}

export function ActivityRings({ rings, size = 130, stroke = 13, gap = 4 }: ActivityRingsProps) {
  const cx = size / 2;
  const cy = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {rings.map((ring, i) => {
          const r = size / 2 - stroke / 2 - i * (stroke + gap);
          if (r <= 0) return null;
          return <AnimatedRing key={i} cx={cx} cy={cy} r={r} color={ring.color} progress={ring.progress} stroke={stroke} />;
        })}
      </Svg>
    </View>
  );
}

export const defaultRingColors = [palette.ringMove, palette.ringExercise, palette.ringStand];

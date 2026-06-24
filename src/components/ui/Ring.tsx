import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { palette } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProps {
  /** 0..1 (can exceed 1 — clamps the arc but keeps colour) */
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  /** optional second colour → gradient */
  colorTo?: string;
  trackColor?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  rounded?: boolean;
  delay?: number;
}

export function Ring({
  progress,
  size = 120,
  stroke = 12,
  color = palette.primary,
  colorTo,
  trackColor = 'rgba(255,255,255,0.08)',
  children,
  style,
  rounded = true,
  delay = 0,
}: RingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(progress, 1));
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withTiming(clamped, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [clamped, anim]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - anim.value),
  }));

  const gradId = `ring-grad-${size}-${color}-${colorTo ?? ''}`.replace(/[^a-zA-Z0-9-]/g, '');

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {colorTo && (
          <Defs>
            <SvgGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={color} />
              <Stop offset="1" stopColor={colorTo} />
            </SvgGradient>
          </Defs>
        )}
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorTo ? `url(#${gradId})` : color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap={rounded ? 'round' : 'butt'}
        />
      </Svg>
      {children != null && (
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>{children}</View>
      )}
    </View>
  );
}

import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { palette, radius } from '@/theme/tokens';

interface ProgressBarProps {
  progress: number; // 0..1
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 8,
  color = palette.primary,
  trackColor = 'rgba(255,255,255,0.08)',
  style,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(progress, 1));
  const w = useSharedValue(0);

  useEffect(() => {
    w.value = withTiming(clamped, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [clamped, w]);

  const animatedStyle = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View style={[{ height, backgroundColor: trackColor, borderRadius: radius.pill, overflow: 'hidden' }, style]}>
      <Animated.View style={[{ height: '100%', backgroundColor: color, borderRadius: radius.pill }, animatedStyle]} />
    </View>
  );
}

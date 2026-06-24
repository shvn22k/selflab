import { useEffect } from 'react';
import { type ViewStyle, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { palette, radius } from '@/theme/tokens';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radiusKey?: keyof typeof radius;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, radiusKey = 'sm', style }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.85, { duration: 850, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius[radiusKey], backgroundColor: palette.surfaceHigh },
        animatedStyle,
        style,
      ]}
    />
  );
}

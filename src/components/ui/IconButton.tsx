import { type ReactNode } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { palette, radius } from '@/theme/tokens';

interface IconButtonProps {
  children: ReactNode;
  onPress?: () => void;
  size?: number;
  variant?: 'surface' | 'ghost' | 'primary';
  style?: ViewStyle;
}

export function IconButton({ children, onPress, size = 42, variant = 'surface', style }: IconButtonProps) {
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            variant === 'primary' ? palette.primary : variant === 'ghost' ? 'transparent' : palette.surfaceElevated,
          borderWidth: variant === 'ghost' ? 0 : 1,
          borderColor: palette.border,
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

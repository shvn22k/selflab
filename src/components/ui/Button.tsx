import { type ReactNode } from 'react';
import { Pressable, View, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { palette, radius, spacing, gradients, fonts } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label?: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
}

const HEIGHTS: Record<Size, number> = { sm: 38, md: 48, lg: 56 };
const FONTSIZE: Record<Size, number> = { sm: 13, md: 15, lg: 16 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled,
  loading,
  fullWidth = true,
  haptic = true,
  style,
}: ButtonProps) {
  const height = HEIGHTS[size];
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? palette.textInverse : palette.text} />
      ) : (
        <>
          {icon}
          {label ? (
            <Text
              style={{
                fontFamily: fonts.bodySemibold,
                fontSize: FONTSIZE[size],
                color: isPrimary ? palette.textInverse : isDanger ? palette.danger : palette.text,
                letterSpacing: 0.2,
              }}
            >
              {label}
            </Text>
          ) : null}
          {iconRight}
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        { width: fullWidth ? '100%' : undefined, opacity: disabled ? 0.45 : pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, { height, borderRadius: radius.pill }]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.base,
            {
              height,
              borderRadius: radius.pill,
              backgroundColor: variant === 'ghost' ? 'transparent' : palette.surfaceElevated,
              borderWidth: variant === 'ghost' ? StyleSheet.hairlineWidth : 0,
              borderColor: palette.borderStrong,
            },
          ]}
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});

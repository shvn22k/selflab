import { useState, type ReactNode } from 'react';
import { View, TextInput, type TextInputProps, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { palette, radius, spacing, fonts, fontSize } from '@/theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: ReactNode;
  right?: ReactNode;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, icon, right, error, containerStyle, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="label" color="textSecondary" style={{ marginBottom: spacing.sm, marginLeft: 2 }}>
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: palette.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: error ? palette.danger : focused ? palette.primary : palette.border,
          paddingHorizontal: spacing.lg,
          height: 52,
        }}
      >
        {icon}
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={palette.textTertiary}
          style={[
            {
              flex: 1,
              color: palette.text,
              fontFamily: fonts.bodyMedium,
              fontSize: fontSize.body,
              height: '100%',
            },
            style,
          ]}
        />
        {right}
      </View>
      {error ? (
        <Text variant="caption" color="danger" style={{ marginTop: spacing.xs, marginLeft: 2 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

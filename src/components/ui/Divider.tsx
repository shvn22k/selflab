import { View, StyleSheet, type ViewStyle } from 'react-native';
import { palette, spacing } from '@/theme/tokens';

export function Divider({ style }: { style?: ViewStyle }) {
  return (
    <View
      style={[
        { height: StyleSheet.hairlineWidth, backgroundColor: palette.border, marginVertical: spacing.md },
        style,
      ]}
    />
  );
}

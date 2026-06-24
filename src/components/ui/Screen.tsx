import { type ReactNode } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** add bottom padding so content clears the floating tab bar */
  tabBarSpace?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  header?: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  tabBarSpace = true,
  refreshing,
  onRefresh,
  header,
  style,
  contentStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top + spacing.sm;
  const paddingBottom = (tabBarSpace ? 110 : spacing.xl) + insets.bottom;

  const inner = (
    <View style={[padded && { paddingHorizontal: spacing.xl }, contentStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, style]}>
      {header ? <View style={{ paddingTop, paddingHorizontal: padded ? spacing.xl : 0 }}>{header}</View> : null}
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: header ? spacing.md : paddingTop, paddingBottom }}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
            ) : undefined
          }
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingTop: header ? spacing.md : paddingTop, paddingBottom }}>{inner}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
});

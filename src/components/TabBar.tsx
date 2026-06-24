import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LayoutGrid, Activity, UtensilsCrossed, Dumbbell, Sparkles } from 'lucide-react-native';
import { Text } from './ui/Text';
import { palette, radius, spacing } from '@/theme/tokens';

const ICONS: Record<string, any> = {
  index: LayoutGrid,
  activity: Activity,
  nutrition: UtensilsCrossed,
  workouts: Dumbbell,
  coach: Sparkles,
};

const LABELS: Record<string, string> = {
  index: 'Home',
  activity: 'Activity',
  nutrition: 'Fuel',
  workouts: 'Train',
  coach: 'Coach',
};

function TabItem({ focused, onPress, routeName }: { focused: boolean; onPress: () => void; routeName: string }) {
  const Icon = ICONS[routeName] ?? LayoutGrid;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      style={styles.item}
      onPressIn={() => (scale.value = withSpring(0.88))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Animated.View style={[styles.itemInner, animatedStyle]}>
        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
          <Icon size={21} color={focused ? palette.textInverse : palette.textTertiary} strokeWidth={2.4} />
        </View>
        <Text variant="caption" color={focused ? palette.text : palette.textTertiary} style={{ fontSize: 10 }}>
          {LABELS[routeName] ?? routeName}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.md) }]} pointerEvents="box-none">
      <View style={styles.barWrap}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.bar}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            return <TabItem key={route.key} focused={focused} onPress={onPress} routeName={route.name} />;
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  barWrap: {
    flexDirection: 'row',
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: Platform.OS === 'android' ? palette.surface : 'rgba(21,23,31,0.6)',
    width: '100%',
  },
  bar: {
    flexDirection: 'row',
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  item: { flex: 1, alignItems: 'center' },
  itemInner: { alignItems: 'center', gap: 4 },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: palette.primary,
  },
});

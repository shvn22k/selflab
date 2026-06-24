import { View } from 'react-native';
import { Screen, Text, EmptyState } from '@/components/ui';
import { LayoutGrid } from 'lucide-react-native';
import { palette, spacing } from '@/theme/tokens';

export default function DashboardScreen() {
  return (
    <Screen
      header={
        <View style={{ gap: 2 }}>
          <Text variant="caption" color="textTertiary" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Welcome back
          </Text>
          <Text variant="h1">Today</Text>
        </View>
      }
    >
      <View style={{ marginTop: spacing.xl }}>
        <EmptyState
          icon={<LayoutGrid size={26} color={palette.primary} />}
          title="Your dashboard is taking shape"
          description="Activity rings, Health Score, nutrition and your daily plan land here."
        />
      </View>
    </Screen>
  );
}

import { View } from 'react-native';
import { Screen, Text, EmptyState } from '@/components/ui';
import { Activity } from 'lucide-react-native';
import { palette, spacing } from '@/theme/tokens';

export default function ActivityScreen() {
  return (
    <Screen header={<Text variant="h1">Activity</Text>}>
      <View style={{ marginTop: spacing.xl }}>
        <EmptyState
          icon={<Activity size={26} color={palette.steps} />}
          title="Movement & GPS"
          description="Live runs, steps, routes and your private activity feed will live here."
        />
      </View>
    </Screen>
  );
}

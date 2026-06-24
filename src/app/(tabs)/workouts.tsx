import { View } from 'react-native';
import { Screen, Text, EmptyState } from '@/components/ui';
import { Dumbbell } from 'lucide-react-native';
import { palette, spacing } from '@/theme/tokens';

export default function WorkoutsScreen() {
  return (
    <Screen header={<Text variant="h1">Train</Text>}>
      <View style={{ marginTop: spacing.xl }}>
        <EmptyState
          icon={<Dumbbell size={26} color={palette.primary} />}
          title="Workouts & programs"
          description="Exercise library, set logging, rest timer, PRs and your weekly split land here."
        />
      </View>
    </Screen>
  );
}

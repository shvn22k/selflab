import { View } from 'react-native';
import { Screen, Text, EmptyState } from '@/components/ui';
import { Sparkles } from 'lucide-react-native';
import { palette, spacing } from '@/theme/tokens';

export default function CoachScreen() {
  return (
    <Screen header={<Text variant="h1">Coach</Text>}>
      <View style={{ marginTop: spacing.xl }}>
        <EmptyState
          icon={<Sparkles size={26} color={palette.primary} />}
          title="Your 24/7 coach"
          description="Morning briefings, real-time nudges and a chat that knows your whole day — powered by Gemini."
        />
      </View>
    </Screen>
  );
}

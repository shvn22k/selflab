import { View } from 'react-native';
import { Screen, Text, EmptyState } from '@/components/ui';
import { UtensilsCrossed } from 'lucide-react-native';
import { palette, spacing } from '@/theme/tokens';

export default function NutritionScreen() {
  return (
    <Screen header={<Text variant="h1">Fuel</Text>}>
      <View style={{ marginTop: spacing.xl }}>
        <EmptyState
          icon={<UtensilsCrossed size={26} color={palette.protein} />}
          title="Nutrition & calories"
          description="Log meals by search, barcode or a photo. Macros, water and AI estimates arrive here."
        />
      </View>
    </Screen>
  );
}

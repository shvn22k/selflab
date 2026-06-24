import { View } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { Text } from '../ui/Text';
import { palette, spacing } from '@/theme/tokens';

interface BarChartProps {
  data: { label: string; value: number; highlight?: boolean }[];
  width?: number;
  height?: number;
  color?: string;
  goal?: number;
  unit?: string;
}

export function BarChart({ data, width = 320, height = 130, color = palette.primary, goal }: BarChartProps) {
  if (!data.length) return <View style={{ width, height }} />;
  const max = Math.max(...data.map((d) => d.value), goal ?? 0) || 1;
  const gap = 8;
  const barW = (width - gap * (data.length - 1)) / data.length;
  const goalY = goal != null ? (1 - goal / max) * height : null;

  return (
    <View style={{ width }}>
      <Svg width={width} height={height}>
        {goalY != null && (
          <Line x1={0} y1={goalY} x2={width} y2={goalY} stroke={palette.textTertiary} strokeWidth={1} strokeDasharray="4 4" />
        )}
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * height, 3);
          const x = i * (barW + gap);
          const c = d.highlight ? color : `${color}55`;
          return <Rect key={i} x={x} y={height - h} width={barW} height={h} rx={Math.min(barW / 2, 7)} fill={c} />;
        })}
      </Svg>
      <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
        {data.map((d, i) => (
          <View key={i} style={{ width: barW, marginRight: i < data.length - 1 ? gap : 0, alignItems: 'center' }}>
            <Text variant="caption" color={d.highlight ? 'text' : 'textTertiary'}>
              {d.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

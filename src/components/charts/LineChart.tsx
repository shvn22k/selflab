import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';
import { palette } from '@/theme/tokens';

interface LineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  showDots?: boolean;
  strokeWidth?: number;
  /** draw a dashed baseline at this value */
  goal?: number;
}

/** Catmull-Rom → cubic bezier smoothing for an organic line. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function LineChart({
  data,
  width = 320,
  height = 120,
  color = palette.primary,
  fill = true,
  showDots = false,
  strokeWidth = 2.5,
  goal,
}: LineChartProps) {
  if (!data.length) return <View style={{ width, height }} />;
  const pad = 8;
  const min = Math.min(...data, goal ?? Infinity);
  const max = Math.max(...data, goal ?? -Infinity);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / Math.max(data.length - 1, 1);

  const points = data.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (v - min) / range) * (height - pad * 2),
  }));

  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} ${height - pad} L ${points[0].x} ${height - pad} Z`;
  const goalY = goal != null ? pad + (1 - (goal - min) / range) * (height - pad * 2) : null;
  const gradId = `line-fill-${color}`.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.28} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {fill && <Path d={area} fill={`url(#${gradId})`} />}
      {goalY != null && (
        <Line
          x1={pad}
          y1={goalY}
          x2={width - pad}
          y2={goalY}
          stroke={palette.textTertiary}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      )}
      <Path d={line} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {showDots &&
        points.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={3} fill={palette.bg} stroke={color} strokeWidth={2} />)}
      {!showDots && points.length > 0 && (
        <Circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={4}
          fill={color}
          stroke={palette.bg}
          strokeWidth={2}
        />
      )}
    </Svg>
  );
}

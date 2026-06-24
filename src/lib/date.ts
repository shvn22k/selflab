import { format, startOfDay, subDays, eachDayOfInterval } from 'date-fns';

export const todayISO = () => format(new Date(), 'yyyy-MM-dd');
export const isoDate = (d: Date) => format(d, 'yyyy-MM-dd');
export const toISODate = isoDate;

export function lastNDays(n: number): string[] {
  const end = startOfDay(new Date());
  const start = subDays(end, n - 1);
  return eachDayOfInterval({ start, end }).map((d) => isoDate(d));
}

export const dayLabel = (iso: string) => format(new Date(iso), 'EEE');
export const prettyDate = (iso: string) => format(new Date(iso), 'EEEE, d MMM');

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Winding down';
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatPace(secPerKm?: number | null): string {
  if (!secPerKm || !isFinite(secPerKm)) return '--';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

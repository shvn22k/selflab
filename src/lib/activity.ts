import type { RoutePoint } from './types';

const R = 6371000; // earth radius (m)

/** Haversine distance between two lat/lng points in metres. */
export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Total route distance (m). Filters out GPS jitter under 1m. */
export function routeDistance(points: RoutePoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const d = haversine(points[i - 1], points[i]);
    if (d > 1) total += d;
  }
  return total;
}

/** Cumulative positive elevation gain (m). */
export function elevationGain(points: RoutePoint[]): number {
  let gain = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1].alt;
    const b = points[i].alt;
    if (a != null && b != null && b > a) gain += b - a;
  }
  return gain;
}

/** Average pace in seconds per km. */
export function avgPace(distanceM: number, durationS: number): number {
  if (distanceM < 1) return 0;
  return durationS / (distanceM / 1000);
}

/** Per-kilometre splits from a route. */
export function computeSplits(points: RoutePoint[]): { km: number; pace_s: number }[] {
  const splits: { km: number; pace_s: number }[] = [];
  let dist = 0;
  let lastKmTime = points[0]?.t ?? 0;
  let km = 1;
  for (let i = 1; i < points.length; i++) {
    dist += haversine(points[i - 1], points[i]);
    if (dist >= km * 1000) {
      const t = points[i].t;
      splits.push({ km, pace_s: Math.round((t - lastKmTime) / 1000) });
      lastKmTime = t;
      km++;
    }
  }
  return splits;
}

const ACTIVITY_MET: Record<string, number> = { run: 9.8, walk: 3.8, ride: 7.5, hike: 6.0, other: 6.0 };

export function activityCalories(type: string, weightKg: number, durationS: number): number {
  const met = ACTIVITY_MET[type] ?? 6;
  return Math.round(met * weightKg * (durationS / 3600));
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

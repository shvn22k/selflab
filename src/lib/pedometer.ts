import { useEffect, useState } from 'react';
import { Pedometer } from 'expo-sensors';

export async function isPedometerAvailable(): Promise<boolean> {
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Live step count accumulated while the subscriber is mounted (since now). */
export function useLiveSteps(active = true): number {
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    if (!active) return;
    let sub: { remove: () => void } | undefined;
    let cancelled = false;
    isPedometerAvailable().then((ok) => {
      if (!ok || cancelled) return;
      sub = Pedometer.watchStepCount((result) => setSteps(result.steps));
    });
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [active]);

  return steps;
}

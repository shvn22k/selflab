import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SelfLab',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#BFF53C',
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

interface Reminder {
  hour: number;
  minute: number;
  title: string;
  body: string;
}

const CORE_REMINDERS: Reminder[] = [
  { hour: 7, minute: 30, title: 'Morning briefing ready', body: 'See your plan, targets and readiness for today.' },
  { hour: 12, minute: 30, title: 'Hydration check', body: 'Halfway through the day — how’s your water intake?' },
  { hour: 15, minute: 0, title: 'Protein check', body: 'Stay ahead of your protein target this afternoon.' },
  { hour: 21, minute: 30, title: 'Wind down', body: 'Time to start winding down for quality sleep.' },
  { hour: 22, minute: 0, title: 'Evening recap', body: 'Review your day and set up tomorrow.' },
];

/** Reschedules the full set of daily proactive reminders. */
export async function scheduleCoreReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of CORE_REMINDERS) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body },
      // Daily repeating trigger (cast to satisfy version-specific typings).
      trigger: { hour: r.hour, minute: r.minute, repeats: true } as never,
    });
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Fire an immediate local nudge (used by the proactive coach). */
export async function pushNudge(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
}

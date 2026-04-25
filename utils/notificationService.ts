/**
 * notificationService.ts
 * Schedules and cancels local push notifications for habit reminders.
 * Requires expo-notifications.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ── Default handler: show alerts when app is in foreground ──
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests permission to send notifications.
 * Call once after onboarding is complete.
 * Returns true if permission was granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedules a daily local notification for a single habit.
 * `reminderTime` format: "HH:MM" (24-hour).
 * Returns the notification identifier (use to cancel later).
 */
export async function scheduleHabitReminder(
  habitName: string,
  reminderTime: string
): Promise<string | null> {
  try {
    const [hourStr, minuteStr] = reminderTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (isNaN(hour) || isNaN(minute)) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚔️ Quest Awaits!',
        body: `Time to complete: ${habitName}`,
        data: { habitName },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return id;
  } catch (e) {
    console.warn('[notificationService] scheduleHabitReminder failed:', e);
    return null;
  }
}

/**
 * Schedules daily reminders for an array of habits that have reminder_time set.
 * Returns a map of habitId → notificationId.
 */
export async function scheduleDailyReminders(
  habits: Array<{ id: string; name: string; reminder_time: string | null }>
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};

  for (const habit of habits) {
    if (!habit.reminder_time) continue;
    const notifId = await scheduleHabitReminder(habit.name, habit.reminder_time);
    if (notifId) map[habit.id] = notifId;
  }

  return map;
}

/**
 * Cancels all scheduled notifications (e.g. on sign-out).
 */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

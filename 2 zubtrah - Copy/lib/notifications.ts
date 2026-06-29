import { Platform } from 'react-native';
import type { Subscription } from './supabase';

export type ReminderOption = {
  label: string;
  value: number;
};

export const REMINDER_OPTIONS: ReminderOption[] = [
  { label: 'Same Day', value: 0 },
  { label: '1 Day before', value: 1 },
  { label: '3 Days before', value: 3 },
  { label: '7 Days before', value: 7 },
  { label: '14 Days before', value: 14 },
  { label: '30 Days before', value: 30 },
  { label: '60 Days before', value: 60 },
];

// Detect whether expo-notifications can safely run in this environment.
// Expo Go (SDK 53+) removed notification support and throws when the
// module is loaded. We detect Expo Go by reading appOwnership from
// expo-constants BEFORE attempting to require expo-notifications.
function detectNotificationsSupported(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    const Constants = require('expo-constants');
    const c = Constants?.default ?? Constants;
    // appOwnership === 'expo' means running inside Expo Go
    if (c?.appOwnership === 'expo') return false;
    // executionEnvironment === 'storeClient' also indicates Expo Go
    if (c?.executionEnvironment === 'storeClient') return false;
  } catch {
    // expo-constants unavailable on this platform
  }
  return true;
}

const NOTIFICATIONS_SUPPORTED = detectNotificationsSupported();

export function notificationsAvailable(): boolean {
  return NOTIFICATIONS_SUPPORTED;
}

// Lazily load expo-notifications only on supported native runtimes.
// The require() is guarded by NOTIFICATIONS_SUPPORTED so it never runs
// inside Expo Go (where it would throw). The try/catch is a secondary
// safety net for any other unsupported environment.
let NotificationsModule: typeof import('expo-notifications') | null = null;
let notifLoadAttempted = false;

function getNotifications() {
  if (notifLoadAttempted) return NotificationsModule;
  notifLoadAttempted = true;
  if (!NOTIFICATIONS_SUPPORTED) {
    NotificationsModule = null;
    return NotificationsModule;
  }
  try {
    const mod = require('expo-notifications');
    if (mod?.setNotificationHandler) {
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
    NotificationsModule = mod;
  } catch {
    NotificationsModule = null;
  }
  return NotificationsModule;
}

function notifId(subId: string, reminderDays: number): string {
  return `sub-${subId}-rem-${reminderDays}`;
}

export function formatReminderMessage(subName: string, daysBefore: number): string {
  const clean = subName.trim();
  if (daysBefore === 0) return `${clean} renews today.`;
  if (daysBefore === 1) return `${clean} renews tomorrow.`;
  return `${clean} renews in ${daysBefore} days.`;
}

export function nextRenewalDate(
  renewalDateStr: string,
  cycle: 'monthly' | 'yearly'
): Date | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [yStr, mStr, dStr] = renewalDateStr.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10) - 1;
  const d = parseInt(dStr, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

  let candidate = new Date(y, m, d, 9, 0, 0, 0);
  if (isNaN(candidate.getTime())) return null;

  if (candidate.getTime() >= today.getTime()) return candidate;

  const maxIter = 12 * 20;
  let iter = 0;
  while (candidate.getTime() < today.getTime() && iter < maxIter) {
    if (cycle === 'yearly') {
      candidate = new Date(candidate.getFullYear() + 1, m, d, 9, 0, 0, 0);
    } else {
      const nextMonthIdx = candidate.getMonth() + 1;
      const nextYear = candidate.getFullYear() + (nextMonthIdx > 11 ? 1 : 0);
      const actualMonth = nextMonthIdx % 12;
      const daysInTargetMonth = new Date(nextYear, actualMonth + 1, 0).getDate();
      const day = Math.min(d, daysInTargetMonth);
      candidate = new Date(nextYear, actualMonth, day, 9, 0, 0, 0);
    }
    iter++;
  }
  return candidate.getTime() >= today.getTime() ? candidate : null;
}

function reminderTriggerDate(renewal: Date, daysBefore: number): Date {
  const t = new Date(renewal);
  t.setDate(t.getDate() - daysBefore);
  return t;
}

export async function ensurePermissions(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  try {
    const current = await N.getPermissionsAsync();
    if ((current as { granted?: boolean }).granted) return true;
    const req = await N.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return (req as { granted?: boolean }).granted === true;
  } catch {
    return false;
  }
}

export async function cancelAllScheduled(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  try {
    const scheduled = await N.getAllScheduledNotificationsAsync();
    const ids = scheduled
      .map((n) => n.identifier)
      .filter((id) => id && id.startsWith('sub-'));
    await Promise.all(ids.map((id) => N.cancelScheduledNotificationAsync(id)));
  } catch {}
}

export async function cancelForSubscription(subId: string): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  try {
    const scheduled = await N.getAllScheduledNotificationsAsync();
    const ids = scheduled
      .map((n) => n.identifier)
      .filter((id) => id && id.startsWith(`sub-${subId}-`));
    await Promise.all(ids.map((id) => N.cancelScheduledNotificationAsync(id)));
  } catch {}
}

export async function syncAllNotifications(
  subscriptions: Subscription[],
  enabled: boolean,
  reminderDays: number
): Promise<{ scheduled: number; skipped: number }> {
  if (!enabled) {
    // Even when disabled, cancel any existing scheduled ones (best-effort)
    const N = getNotifications();
    if (N) await cancelAllScheduled();
    return { scheduled: 0, skipped: 0 };
  }

  if (!NOTIFICATIONS_SUPPORTED) return { scheduled: 0, skipped: 0 };

  const N = getNotifications();
  if (!N) return { scheduled: 0, skipped: subscriptions.length };

  // Set up Android channel lazily on first actual scheduling.
  if (Platform.OS === 'android') {
    try {
      await N.setNotificationChannelAsync('subscription-reminders', {
        name: 'Subscription Reminders',
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1A6B5A',
        sound: 'default',
      });
    } catch {}
  }

  await cancelAllScheduled();

  const hasPerm = await ensurePermissions();
  if (!hasPerm) return { scheduled: 0, skipped: subscriptions.length };

  const validDays = REMINDER_OPTIONS.find((o) => o.value === reminderDays)?.value ?? 3;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let scheduled = 0;
  let skipped = 0;

  for (const sub of subscriptions) {
    if (!sub.active) { skipped++; continue; }
    const renewal = nextRenewalDate(sub.renewal_date, sub.billing_cycle);
    if (!renewal) { skipped++; continue; }
    const trigger = reminderTriggerDate(renewal, validDays);
    if (trigger.getTime() < now.getTime()) { skipped++; continue; }

    try {
      await N.scheduleNotificationAsync({
        content: {
          title: 'Subscription Reminder',
          body: formatReminderMessage(sub.name, validDays),
          sound: true,
          data: { subId: sub.id, subName: sub.name },
        },
        trigger: {
          date: trigger,
          channelId: 'subscription-reminders',
        } as never,
        identifier: notifId(sub.id, validDays),
      });
      scheduled++;
    } catch {
      skipped++;
    }
  }

  return { scheduled, skipped };
}

export async function getScheduledCount(): Promise<number> {
  const N = getNotifications();
  if (!N) return 0;
  try {
    const list = await N.getAllScheduledNotificationsAsync();
    return list.filter((n) => n.identifier?.startsWith('sub-')).length;
  } catch {
    return 0;
  }
}

// Called from root layout on Android to register the notification channel.
// Safe to call on any platform — no-ops if expo-notifications is unavailable
// or if running inside Expo Go (where the module throws on load).
// NOTE: We used to call this eagerly from root layout's useEffect. That caused
// the require('expo-notifications') call to throw in Expo Go. Now we only set
// up the channel lazily — inside syncAllNotifications, the first time
// notifications are actually scheduled. This way Expo Go never loads the module
// at all.
export async function setupAndroidChannel(): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED || Platform.OS !== 'android') return;
  let N: typeof import('expo-notifications') | null = null;
  try {
    N = getNotifications();
  } catch {
    N = null;
  }
  if (!N) return;
  try {
    await N.setNotificationChannelAsync('subscription-reminders', {
      name: 'Subscription Reminders',
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1A6B5A',
      sound: 'default',
    });
  } catch {}
}

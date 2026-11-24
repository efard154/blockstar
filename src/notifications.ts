import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { formatDuration, translate, type Language } from './i18n';
import type { BlockEvent, Routine } from './types';
import { planReminders } from './utils/reminders';
import { formatTime } from './utils/time';

const CHANNEL_ID = 'reminders';
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

if (supported) {
  // Show reminders as a banner even while the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** 'unknown' = not checked yet; never treat it as "please ask". */
export type PermissionState = 'unknown' | 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getPermissionState(): Promise<PermissionState> {
  if (!supported) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionState;
}

async function requestPermission(): Promise<PermissionState> {
  if (!supported) return 'unsupported';
  await ensureChannel();
  const { status } = await Notifications.requestPermissionsAsync();
  return status as PermissionState;
}

// One shared permission state, so a grant from Settings reaches the scheduler too.
let currentPermission: PermissionState = 'unknown';
const listeners = new Set<(s: PermissionState) => void>();

function publish(state: PermissionState) {
  currentPermission = state;
  listeners.forEach((l) => l(state));
}

function refreshPermission() {
  getPermissionState()
    .then(publish)
    .catch(() => publish('unsupported'));
}

async function requestAndPublish(): Promise<PermissionState> {
  const next = await requestPermission().catch(() => 'unsupported' as const);
  publish(next);
  return next;
}

/** Current notification permission, refreshed whenever the app returns to the foreground. */
export function useNotificationPermission() {
  const [state, setState] = useState<PermissionState>(currentPermission);

  useEffect(() => {
    listeners.add(setState);
    refreshPermission();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refreshPermission());
    return () => {
      listeners.delete(setState);
      sub.remove();
    };
  }, []);

  const request = useCallback(() => requestAndPublish(), []);
  return { state, request };
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

// Reschedules run one after another so overlapping calls can't interleave.
let queue: Promise<void> = Promise.resolve();

/**
 * Replaces all scheduled reminders with a fresh set for the upcoming window.
 * Pass `minutesBefore = null` to turn reminders off.
 */
export function rescheduleReminders(
  events: BlockEvent[],
  routines: Routine[],
  minutesBefore: number | null,
  language: Language,
): Promise<void> {
  queue = queue.then(async () => {
    if (!supported) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (minutesBefore === null) return;
    if ((await getPermissionState()) !== 'granted') return;

    await ensureChannel();
    const lead = formatDuration(language, minutesBefore);
    for (const r of planReminders(events, routines, minutesBefore, new Date())) {
      await Notifications.scheduleNotificationAsync({
        identifier: r.id,
        content: {
          title: r.event.title,
          body: translate(language, 'reminderBody')
            .replace('{lead}', lead)
            .replace('{time}', formatTime(r.event.start)),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: r.fireAt,
          channelId: CHANNEL_ID,
        },
      });
    }
  }).catch((err) => console.warn('Failed to schedule reminders', err));
  return queue;
}

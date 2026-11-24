import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useEvents } from '../events';
import { rescheduleReminders, useNotificationPermission } from '../notifications';
import { useSettings } from '../settings';

/**
 * Keeps scheduled reminders in sync with events, routines and settings.
 * Renders nothing; mount once inside the providers.
 */
export function ReminderSync() {
  const { events, routines, loaded } = useEvents();
  const { reminderMinutes, language } = useSettings();
  const permission = useNotificationPermission();
  const askedOnce = useRef(false);
  const [foregroundTick, setForegroundTick] = useState(0);

  // Ask for permission once, the first time reminders are on and it's still undecided.
  useEffect(() => {
    if (reminderMinutes === null || askedOnce.current) return;
    if (permission.state !== 'undetermined') return;
    askedOnce.current = true;
    permission.request();
  }, [reminderMinutes, permission.state, permission.request]);

  // Roll the scheduling window forward whenever the app comes back.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setForegroundTick((n) => n + 1));
    return () => sub.remove();
  }, []);

  // Debounced so quick edits (or a burst of swipes) reschedule only once.
  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      rescheduleReminders(events, routines, reminderMinutes, language);
    }, 800);
    return () => clearTimeout(id);
  }, [events, routines, reminderMinutes, language, loaded, permission.state, foregroundTick]);

  return null;
}

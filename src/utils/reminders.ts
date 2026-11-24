import type { BlockEvent, Routine } from '../types';
import { parseDateKey, routinesOn } from './routines';
import { addDays, toDateKey } from './time';

export const REMINDER_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120] as const;
export const DEFAULT_REMINDER_MINUTES = 10;

/** How far ahead reminders are scheduled; the window rolls forward whenever the app opens. */
export const REMINDER_WINDOW_DAYS = 7;
/** iOS keeps at most 64 pending local notifications per app. */
export const MAX_REMINDERS = 60;

export interface PlannedReminder {
  /** Stable id: same event + same time → same notification id */
  id: string;
  fireAt: Date;
  startAt: Date;
  event: BlockEvent;
}

/**
 * Reminders to schedule: every event and routine occurrence in the next
 * REMINDER_WINDOW_DAYS days whose reminder time is still in the future.
 */
export function planReminders(
  events: BlockEvent[],
  routines: Routine[],
  minutesBefore: number,
  now: Date,
): PlannedReminder[] {
  const from = toDateKey(now);
  const to = toDateKey(addDays(now, REMINDER_WINDOW_DAYS));

  const candidates: BlockEvent[] = events.filter((e) => e.date >= from && e.date <= to);
  for (let d = parseDateKey(from); toDateKey(d) <= to; d = addDays(d, 1)) {
    candidates.push(...routinesOn(routines, toDateKey(d)));
  }

  const soonest = now.getTime() + 5_000;
  return candidates
    .map((event) => {
      const startAt = parseDateKey(event.date);
      startAt.setMinutes(event.start);
      const fireAt = new Date(startAt.getTime() - minutesBefore * 60_000);
      return { id: `reminder:${event.id}:${fireAt.getTime()}`, fireAt, startAt, event };
    })
    .filter((r) => r.fireAt.getTime() > soonest)
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, MAX_REMINDERS);
}

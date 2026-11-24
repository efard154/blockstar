import type { BlockEvent, IconName, Routine } from '../types';
import { addDays, toDateKey } from './time';

export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS = [1, 2, 3, 4, 5];
export const WEEKENDS = [0, 6];

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function sameDays(a: number[], b: number[]): boolean {
  return a.length === b.length && [...a].sort().join() === [...b].sort().join();
}

/** The occurrence of a routine on a given day, shaped like a normal event. */
function occurrence(r: Routine, date: string): BlockEvent {
  return {
    id: `routine:${r.id}:${date}`,
    routineId: r.id,
    date,
    title: r.title,
    icon: r.icon,
    start: r.start,
    duration: r.duration,
  };
}

/** Routine occurrences on one date. */
export function routinesOn(routines: Routine[], dateKey: string): BlockEvent[] {
  const weekday = parseDateKey(dateKey).getDay();
  return routines
    .filter(
      (r) =>
        r.active && r.days.includes(weekday) && dateKey >= r.since && !r.skipped?.includes(dateKey),
    )
    .map((r) => occurrence(r, dateKey));
}

/** Routine occurrences for every date in an inclusive range. */
export function expandRoutines(routines: Routine[], from: string, to: string): BlockEvent[] {
  if (from > to || routines.every((r) => !r.active)) return [];
  const out: BlockEvent[] = [];
  for (let d = parseDateKey(from); toDateKey(d) <= to; d = addDays(d, 1)) {
    out.push(...routinesOn(routines, toDateKey(d)));
  }
  return out;
}

/** Total planned minutes per week across active routines. */
export function weeklyMinutes(routines: Routine[]): number {
  return routines
    .filter((r) => r.active)
    .reduce((sum, r) => sum + r.duration * r.days.length, 0);
}

export interface RoutineTemplate {
  key: 'morning' | 'workout' | 'focus' | 'lunch' | 'bedtime';
  icon: IconName;
  start: number;
  duration: number;
  days: number[];
}

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  { key: 'morning', icon: 'coffee', start: 6 * 60 + 30, duration: 30, days: EVERY_DAY },
  { key: 'workout', icon: 'dumbbell', start: 7 * 60, duration: 60, days: [1, 3, 5] },
  { key: 'focus', icon: 'laptop', start: 9 * 60, duration: 120, days: WEEKDAYS },
  { key: 'lunch', icon: 'silverware-fork-knife', start: 12 * 60, duration: 60, days: EVERY_DAY },
  { key: 'bedtime', icon: 'weather-night', start: 23 * 60, duration: 0, days: EVERY_DAY },
];

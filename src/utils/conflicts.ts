import type { BlockEvent, Routine } from '../types';
import { parseDateKey, routinesOn } from './routines';
import { MINUTES_IN_DAY } from './time';

export interface TimeSpan {
  start: number;
  duration: number;
}

export interface Conflict {
  title: string;
  start: number;
  duration: number;
  /** Set when the clash is on a specific date (routine vs. a one-off event) */
  date?: string;
}

export interface ConflictResult {
  conflict: Conflict;
  /** Nearest start time (same duration) that is free, or null if none fits today */
  suggestion: number | null;
}

/** Point-in-time items (no duration) still occupy their minute. */
const endOf = (s: TimeSpan) => s.start + Math.max(s.duration, 1);

export function overlaps(a: TimeSpan, b: TimeSpan): boolean {
  return a.start < endOf(b) && b.start < endOf(a);
}

/**
 * Nearest free start for `span` among `busy`, searching later first, then earlier,
 * on a 5-minute grid. The span must also end by midnight.
 */
export function nearestFreeStart(span: TimeSpan, busy: TimeSpan[], step = 5): number | null {
  const fits = (start: number) =>
    start >= 0 &&
    start + span.duration <= MINUTES_IN_DAY &&
    !busy.some((b) => overlaps({ start, duration: span.duration }, b));

  for (let delta = step; delta < MINUTES_IN_DAY; delta += step) {
    const later = Math.ceil((span.start + delta) / step) * step;
    if (fits(later)) return later;
    const earlier = Math.floor((span.start - delta) / step) * step;
    if (fits(earlier)) return earlier;
  }
  return null;
}

/** Clash check for a one-off event on `date` against other events and routine occurrences. */
export function eventConflict(
  span: TimeSpan,
  date: string,
  events: BlockEvent[],
  routines: Routine[],
  ignoreEventId?: string,
): ConflictResult | null {
  const busy = [
    ...events.filter((e) => e.date === date && e.id !== ignoreEventId),
    ...routinesOn(routines, date),
  ].sort((a, b) => a.start - b.start);

  const hit = busy.find((b) => overlaps(span, b));
  if (!hit) return null;
  return {
    conflict: { title: hit.title, start: hit.start, duration: hit.duration },
    suggestion: nearestFreeStart(span, busy),
  };
}

/**
 * Clash check for a routine repeating on `days`: against other active routines
 * that share a weekday, and upcoming one-off events on those weekdays.
 */
export function routineConflict(
  span: TimeSpan,
  days: number[],
  routines: Routine[],
  events: BlockEvent[],
  todayKey: string,
  ignoreRoutineId?: string,
): ConflictResult | null {
  const otherRoutines = routines.filter(
    (r) => r.active && r.id !== ignoreRoutineId && r.days.some((d) => days.includes(d)),
  );
  const upcomingEvents = events.filter(
    (e) => e.date >= todayKey && days.includes(parseDateKey(e.date).getDay()),
  );

  const routineHit = otherRoutines
    .sort((a, b) => a.start - b.start)
    .find((r) => overlaps(span, r));
  const eventHit = routineHit
    ? undefined
    : upcomingEvents
        .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)
        .find((e) => overlaps(span, e));

  if (!routineHit && !eventHit) return null;

  const conflict: Conflict = routineHit
    ? { title: routineHit.title, start: routineHit.start, duration: routineHit.duration }
    : { title: eventHit!.title, start: eventHit!.start, duration: eventHit!.duration, date: eventHit!.date };

  // A suggestion must be free on every repeat day, so treat all of these as busy.
  return { conflict, suggestion: nearestFreeStart(span, [...otherRoutines, ...upcomingEvents]) };
}

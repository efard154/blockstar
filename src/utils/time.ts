import type { BlockEvent, TimelineItem } from '../types';

export const MINUTES_IN_DAY = 24 * 60;

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

/** 990 -> "16:30" (24-hour clock) */
export function formatTime(minutes: number): string {
  const m = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** End of an event on the timeline. Point events (no duration) occupy up to the next whole hour. */
function occupiedUntil(event: BlockEvent): number {
  if (event.duration > 0) return event.start + event.duration;
  return Math.floor(event.start / 60) * 60 + 60;
}

/**
 * Builds a full-day timeline (00:00–24:00): events sorted by start time, with
 * "Add event" slots filling every free gap — one at the start of the gap,
 * then one on every whole hour until the next event (or midnight).
 */
export function buildTimeline(events: BlockEvent[]): TimelineItem[] {
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const items: TimelineItem[] = [];

  const fillSlots = (from: number, until: number) => {
    let t = from;
    while (t < until) {
      items.push({ kind: 'slot', key: `slot-${t}`, start: t });
      t = Math.floor(t / 60) * 60 + 60; // next whole hour
    }
  };

  let cursor = 0;
  for (const event of sorted) {
    fillSlots(cursor, event.start);
    items.push({ kind: 'event', key: event.id, event });
    cursor = Math.max(cursor, occupiedUntil(event));
  }
  fillSlots(cursor, MINUTES_IN_DAY);

  return items;
}

/**
 * Index to scroll to when a day opens: the current block for today,
 * otherwise the first event (or 08:00 when the day is empty).
 */
export function initialScrollIndex(items: TimelineItem[], isToday: boolean, now: Date): number {
  const startOf = (item: TimelineItem) => (item.kind === 'event' ? item.event.start : item.start);
  if (isToday) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let index = 0;
    items.forEach((item, i) => {
      if (startOf(item) <= nowMinutes) index = i;
    });
    return index;
  }
  const firstEvent = items.findIndex((item) => item.kind === 'event');
  if (firstEvent >= 0) return firstEvent;
  return Math.max(0, items.findIndex((item) => startOf(item) >= 8 * 60));
}

/** Default start time for a new event: end of the last event, or the next whole hour. */
export function suggestStart(events: BlockEvent[], now: Date, isToday: boolean): number {
  if (events.length > 0) {
    const last = events.reduce((a, b) =>
      a.start + a.duration > b.start + b.duration ? a : b,
    );
    return Math.min(last.start + last.duration, MINUTES_IN_DAY - 15);
  }
  if (isToday) {
    return Math.min((now.getHours() + 1) * 60, MINUTES_IN_DAY - 60);
  }
  return 9 * 60;
}

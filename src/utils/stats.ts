import type { BlockEvent, IconName } from '../types';
import { addDays, toDateKey } from './time';

export type Period = 'week' | 'month' | 'all';
export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export const DAY_PARTS: DayPart[] = ['morning', 'afternoon', 'evening', 'night'];

/** Weekday order for charts: Monday first (0 = Sunday in Date.getDay()). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export interface CountAndTime {
  count: number;
  minutes: number;
}

export interface EventStats {
  totalEvents: number;
  totalMinutes: number;
  activeDays: number;
  /** Average planned minutes per day that has at least one event */
  avgMinutesPerActiveDay: number;
  /** Weekday (0 = Sunday) with the most planned minutes, null when nothing is planned */
  busiestWeekday: number | null;
  /** Planned minutes per weekday, in WEEK_ORDER */
  byWeekday: { weekday: number; minutes: number; count: number }[];
  /** Sorted by minutes, then count, descending */
  byCategory: ({ icon: IconName } & CountAndTime)[];
  byDayPart: ({ part: DayPart } & CountAndTime)[];
  /** Most repeated titles */
  topTitles: { title: string; icon: IconName; count: number; minutes: number }[];
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Inclusive date-key range for a period, or null for all time. */
export function periodRange(period: Period, today: Date): { from: string; to: string } | null {
  if (period === 'all') return null;
  if (period === 'week') {
    const offset = (today.getDay() + 6) % 7; // days since Monday
    const monday = addDays(today, -offset);
    return { from: toDateKey(monday), to: toDateKey(addDays(monday, 6)) };
  }
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { from: toDateKey(first), to: toDateKey(last) };
}

export function dayPartOf(startMinutes: number): DayPart {
  const h = Math.floor(startMinutes / 60);
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export function computeStats(allEvents: BlockEvent[], period: Period, today: Date): EventStats {
  const range = periodRange(period, today);
  // Date keys are zero-padded YYYY-MM-DD, so string comparison is chronological.
  const events = range
    ? allEvents.filter((e) => e.date >= range.from && e.date <= range.to)
    : allEvents;

  const totalMinutes = events.reduce((sum, e) => sum + e.duration, 0);
  const activeDays = new Set(events.map((e) => e.date)).size;

  const weekday = new Map<number, CountAndTime>(WEEK_ORDER.map((d) => [d, { count: 0, minutes: 0 }]));
  const category = new Map<IconName, CountAndTime>();
  const dayPart = new Map<DayPart, CountAndTime>(DAY_PARTS.map((p) => [p, { count: 0, minutes: 0 }]));
  const titles = new Map<string, { title: string; icon: IconName; count: number; minutes: number }>();

  for (const e of events) {
    const w = weekday.get(parseDateKey(e.date).getDay())!;
    w.count += 1;
    w.minutes += e.duration;

    const c = category.get(e.icon) ?? { count: 0, minutes: 0 };
    c.count += 1;
    c.minutes += e.duration;
    category.set(e.icon, c);

    const p = dayPart.get(dayPartOf(e.start))!;
    p.count += 1;
    p.minutes += e.duration;

    const key = e.title.trim().toLowerCase();
    const t = titles.get(key) ?? { title: e.title.trim(), icon: e.icon, count: 0, minutes: 0 };
    t.count += 1;
    t.minutes += e.duration;
    titles.set(key, t);
  }

  const byWeekday = WEEK_ORDER.map((d) => ({ weekday: d, ...weekday.get(d)! }));
  const busiest = byWeekday.reduce<(typeof byWeekday)[number] | null>(
    (best, d) => (d.minutes > 0 && (!best || d.minutes > best.minutes) ? d : best),
    null,
  );

  return {
    totalEvents: events.length,
    totalMinutes,
    activeDays,
    avgMinutesPerActiveDay: activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0,
    busiestWeekday: busiest?.weekday ?? null,
    byWeekday,
    byCategory: [...category.entries()]
      .map(([icon, v]) => ({ icon, ...v }))
      .sort((a, b) => b.minutes - a.minutes || b.count - a.count),
    byDayPart: DAY_PARTS.map((part) => ({ part, ...dayPart.get(part)! })),
    topTitles: [...titles.values()]
      .sort((a, b) => b.count - a.count || b.minutes - a.minutes)
      .slice(0, 5),
  };
}

/** 135 -> "2h 15m"; compact form for tiles and chart labels. */
export function formatHoursShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

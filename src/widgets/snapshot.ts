import { formatDuration, translate, weekdayName, type Language } from '../i18n';
import type { ThemeColors } from '../themes';
import type { BlockEvent, Routine } from '../types';
import { parseDateKey, routinesOn } from '../utils/routines';
import { addDays, formatTime, toDateKey } from '../utils/time';

/**
 * Everything a home-screen widget needs, precomputed by the app. Widgets only
 * pick "what's relevant right now" from it, so they stay correct between app
 * launches (Android refreshes every 30 min, iOS on each event boundary).
 *
 * Keep this shape in sync with targets/widget/Snapshot.swift.
 */
export interface WidgetSnapshot {
  v: 1;
  generatedAt: number;
  lang: Language;
  dark: boolean;
  theme: {
    background: string;
    surface: string;
    primary: string;
    onPrimary: string;
    text: string;
    textMuted: string;
    accent: string;
  };
  strings: {
    next: string;
    today: string;
    progress: string;
    nothingNext: string;
    allDone: string;
    now: string;
    inPrefix: string;
    more: string;
    done: string;
    noEvents: string;
  };
  /** Today's date label, e.g. "Senin 23" — recomputed by widgets when the day changes */
  weekdays: string[];
  /** Events + routine occurrences for today and the next 2 days, sorted by start */
  items: WidgetItem[];
}

export interface WidgetItem {
  title: string;
  /** Epoch ms */
  start: number;
  /** Epoch ms; equals start for point-in-time items */
  end: number;
  time: string;
  /** YYYY-MM-DD of the item, in the device's local time */
  day: string;
  duration: string;
}

export const WIDGET_STORAGE_KEY = 'blockstar:widget:v1';
export const WIDGET_DAYS = 3;
export const WIDGET_MAX_ITEMS = 40;

export function buildSnapshot(
  events: BlockEvent[],
  routines: Routine[],
  language: Language,
  colors: ThemeColors,
  dark: boolean,
  now: Date,
): WidgetSnapshot {
  const t = (k: Parameters<typeof translate>[1]) => translate(language, k);
  const from = toDateKey(now);
  const to = toDateKey(addDays(now, WIDGET_DAYS - 1));

  const all: BlockEvent[] = events.filter((e) => e.date >= from && e.date <= to);
  for (let d = parseDateKey(from); toDateKey(d) <= to; d = addDays(d, 1)) {
    all.push(...routinesOn(routines, toDateKey(d)));
  }

  const items = all
    .map((e) => {
      const start = parseDateKey(e.date);
      start.setMinutes(e.start);
      return {
        title: e.title,
        start: start.getTime(),
        end: start.getTime() + e.duration * 60_000,
        time: formatTime(e.start),
        day: e.date,
        duration: e.duration > 0 ? formatDuration(language, e.duration) : '',
      };
    })
    .sort((a, b) => a.start - b.start)
    .slice(0, WIDGET_MAX_ITEMS);

  return {
    v: 1,
    generatedAt: now.getTime(),
    lang: language,
    dark,
    theme: {
      background: colors.background,
      surface: colors.surface,
      primary: colors.primary,
      onPrimary: colors.onPrimary,
      text: colors.text,
      textMuted: colors.textMuted,
      accent: colors.primaryStrong,
    },
    strings: {
      next: t('widgetNext'),
      today: t('today'),
      progress: t('widgetProgress'),
      nothingNext: t('widgetNothingNext'),
      allDone: t('widgetAllDone'),
      now: t('widgetNow'),
      inPrefix: t('widgetIn'),
      more: t('widgetMore'),
      done: t('widgetDone'),
      noEvents: t('widgetNoEvents'),
    },
    weekdays: [0, 1, 2, 3, 4, 5, 6].map((d) => weekdayName(language, d)),
    items,
  };
}

/* ---------- Helpers shared by the Android widgets and the in-app previews ---------- */

export function todayItems(s: WidgetSnapshot, now: Date): WidgetItem[] {
  const key = toDateKey(now);
  return s.items.filter((i) => i.day === key);
}

/** The item happening now, or the next one to start (today or later). */
export function nextItem(s: WidgetSnapshot, now: Date): { item: WidgetItem; ongoing: boolean } | null {
  const t = now.getTime();
  const ongoing = s.items.find((i) => i.start <= t && t < i.end);
  if (ongoing) return { item: ongoing, ongoing: true };
  const upcoming = s.items.find((i) => i.start > t);
  return upcoming ? { item: upcoming, ongoing: false } : null;
}

export function progressOf(s: WidgetSnapshot, now: Date): { done: number; total: number } {
  const today = todayItems(s, now);
  const t = now.getTime();
  return { done: today.filter((i) => Math.max(i.end, i.start + 1) <= t).length, total: today.length };
}

/** "25 min" / "2 h 10 min" style countdown, using the snapshot's language units. */
export function countdown(s: WidgetSnapshot, from: Date, to: number): string {
  const mins = Math.max(1, Math.round((to - from.getTime()) / 60_000));
  return `${s.strings.inPrefix} ${formatDuration(s.lang, mins)}`;
}

export function dayLabel(s: WidgetSnapshot, now: Date): string {
  return `${s.weekdays[now.getDay()]} ${now.getDate()}`;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BlockEvent, Routine } from './types';

const EVENTS_KEY = 'blockstar:events:v1';

function isBlockEvent(value: unknown): value is BlockEvent {
  if (typeof value !== 'object' || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.date === 'string' &&
    typeof e.title === 'string' &&
    typeof e.icon === 'string' &&
    typeof e.start === 'number' &&
    typeof e.duration === 'number'
  );
}

/**
 * Returns the saved events, or null if nothing has been saved yet
 * (first launch) so the caller can decide whether to seed sample data.
 */
export async function loadEvents(): Promise<BlockEvent[] | null> {
  const raw = await AsyncStorage.getItem(EVENTS_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isBlockEvent) : [];
  } catch {
    return [];
  }
}

export async function saveEvents(events: BlockEvent[]): Promise<void> {
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

const ROUTINES_KEY = 'blockstar:routines:v1';

function isRoutine(value: unknown): value is Routine {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.title === 'string' &&
    typeof r.icon === 'string' &&
    typeof r.start === 'number' &&
    typeof r.duration === 'number' &&
    Array.isArray(r.days) &&
    r.days.every((d) => typeof d === 'number') &&
    typeof r.active === 'boolean' &&
    typeof r.since === 'string' &&
    (r.skipped === undefined || (Array.isArray(r.skipped) && r.skipped.every((d) => typeof d === 'string')))
  );
}

export async function loadRoutines(): Promise<Routine[]> {
  const raw = await AsyncStorage.getItem(ROUTINES_KEY);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRoutine) : [];
  } catch {
    return [];
  }
}

export async function saveRoutines(routines: Routine[]): Promise<void> {
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}

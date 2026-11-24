import type { BlockEvent, IconName } from './types';
import { toDateKey } from './utils/time';

export const ICON_CHOICES: IconName[] = [
  'briefcase',
  'cart',
  'silverware-fork-knife',
  'weather-night',
  'dumbbell',
  'book-open-variant',
  'laptop',
  'coffee',
  'run',
  'car',
  'phone',
  'music',
];

export function createSeedEvents(today: Date): BlockEvent[] {
  const date = toDateKey(today);
  return [
    { id: 'seed-1', date, title: 'Study and prep. 👨🏻‍💻', icon: 'briefcase', start: 16 * 60, duration: 75 },
    { id: 'seed-2', date, title: 'Groceries shopping', icon: 'cart', start: 17 * 60 + 30, duration: 60 },
    { id: 'seed-3', date, title: 'Dinner with Amy 💜', icon: 'silverware-fork-knife', start: 18 * 60 + 30, duration: 150 },
    { id: 'seed-4', date, title: 'Bedtime', icon: 'weather-night', start: 23 * 60, duration: 0 },
  ];
}

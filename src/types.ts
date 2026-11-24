import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface BlockEvent {
  id: string;
  /** Date key in YYYY-MM-DD format */
  date: string;
  title: string;
  icon: IconName;
  /** Minutes since midnight */
  start: number;
  /** Duration in minutes; 0 means a point-in-time event (e.g. Bedtime) */
  duration: number;
  /** Set when this is an occurrence generated from a routine (not stored as an event) */
  routineId?: string;
}

export interface Routine {
  id: string;
  title: string;
  icon: IconName;
  /** Minutes since midnight */
  start: number;
  /** Duration in minutes; 0 means a point-in-time routine */
  duration: number;
  /** Weekdays it repeats on (0 = Sunday … 6 = Saturday) */
  days: number[];
  active: boolean;
  /** Date key the routine was created; it doesn't fill days before this */
  since: string;
  /** Date keys where this routine was skipped (swiped away on the timeline) */
  skipped?: string[];
}

export type TimelineItem =
  | { kind: 'event'; key: string; event: BlockEvent }
  | { kind: 'slot'; key: string; start: number };

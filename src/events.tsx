import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { createSeedEvents } from './data';
import { loadEvents, loadRoutines, saveEvents, saveRoutines } from './storage';
import type { BlockEvent, Routine } from './types';

interface EventsContextValue {
  events: BlockEvent[];
  setEvents: Dispatch<SetStateAction<BlockEvent[]>>;
  routines: Routine[];
  setRoutines: Dispatch<SetStateAction<Routine[]>>;
  loaded: boolean;
}

const EventsContext = createContext<EventsContextValue | null>(null);

/** Holds all events and routines for every screen; loads from and saves to device storage. */
export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<BlockEvent[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load saved data once; seed sample events only on the very first launch.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadEvents().catch((err) => {
        console.warn('Failed to load events', err);
        return [] as BlockEvent[];
      }),
      loadRoutines().catch((err) => {
        console.warn('Failed to load routines', err);
        return [] as Routine[];
      }),
    ]).then(([savedEvents, savedRoutines]) => {
      if (cancelled) return;
      setEvents(savedEvents ?? createSeedEvents(new Date()));
      setRoutines(savedRoutines);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist every change after the initial load.
  useEffect(() => {
    if (!loaded) return;
    saveEvents(events).catch((err) => console.warn('Failed to save events', err));
  }, [events, loaded]);

  useEffect(() => {
    if (!loaded) return;
    saveRoutines(routines).catch((err) => console.warn('Failed to save routines', err));
  }, [routines, loaded]);

  const value = useMemo(
    () => ({ events, setEvents, routines, setRoutines, loaded }),
    [events, routines, loaded],
  );
  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents(): EventsContextValue {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used inside EventsProvider');
  return ctx;
}

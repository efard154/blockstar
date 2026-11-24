import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useEvents } from '../events';
import { useSettings } from '../settings';
import { publishSnapshot, widgetsAvailable } from './native';
import { buildSnapshot } from './snapshot';

/**
 * Keeps the home-screen widgets fed with fresh data whenever events, routines,
 * language or theme change, and when the app returns to the foreground.
 * Renders nothing; no-op in Expo Go.
 */
export function WidgetSync() {
  const { events, routines, loaded } = useEvents();
  const { language, colors, theme } = useSettings();
  const [foregroundTick, setForegroundTick] = useState(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setForegroundTick((n) => n + 1));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!loaded || !widgetsAvailable) return;
    const id = setTimeout(() => {
      const snapshot = buildSnapshot(events, routines, language, colors, theme.dark, new Date());
      publishSnapshot(snapshot).catch((err) => console.warn('Failed to update widgets', err));
    }, 800);
    return () => clearTimeout(id);
  }, [events, routines, language, colors, theme.dark, loaded, foregroundTick]);

  return null;
}

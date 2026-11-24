/**
 * Android home-screen widgets. Only load this file when `androidWidgetsAvailable`
 * is true (see ../native.ts) — importing the library in Expo Go throws.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerWidgetTaskHandler,
  requestWidgetUpdate,
  type WidgetTaskHandlerProps,
} from 'react-native-android-widget';
import { WIDGET_STORAGE_KEY, type WidgetSnapshot } from '../snapshot';
import { WIDGET_KINDS } from '../native';
import { EmptyWidget, NextWidget, ProgressWidget, TodayWidget } from './widgets';

function render(widgetName: string, s: WidgetSnapshot | null, now: Date) {
  if (!s) return <EmptyWidget />;
  switch (widgetName) {
    case 'NextWidget':
      return <NextWidget s={s} now={now} />;
    case 'TodayWidget':
      return <TodayWidget s={s} now={now} />;
    case 'ProgressWidget':
      return <ProgressWidget s={s} now={now} />;
    default:
      return <EmptyWidget />;
  }
}

async function loadSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as WidgetSnapshot) : null;
    return parsed?.v === 1 ? parsed : null;
  } catch {
    return null;
  }
}

/** Runs headless when a widget is added, resized, periodically updated or tapped. */
async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetAction === 'WIDGET_DELETED') return;
  const snapshot = await loadSnapshot();
  renderWidget(render(widgetInfo.widgetName, snapshot, new Date()));
}

export function registerAndroidWidgets() {
  registerWidgetTaskHandler(widgetTaskHandler);
}

/** Redraws every placed widget right away (called by the app when data changes). */
export async function refreshAndroidWidgets(snapshot: WidgetSnapshot) {
  const now = new Date();
  await Promise.all(
    WIDGET_KINDS.map((kind) =>
      requestWidgetUpdate({ widgetName: kind, renderWidget: () => render(kind, snapshot, now) }).catch(() => {}),
    ),
  );
}

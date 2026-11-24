import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WIDGET_STORAGE_KEY, type WidgetSnapshot } from './snapshot';

/** Widget kinds; names must match app.json (Android) and targets/widget (iOS `kind`). */
export const WIDGET_KINDS = ['NextWidget', 'TodayWidget', 'ProgressWidget'] as const;
export type WidgetKind = (typeof WIDGET_KINDS)[number];

/** iOS App Group shared with the widget extension (see app.json + targets/widget). */
export const APP_GROUP = 'group.com.blockstar.app';

/**
 * Native widget code only exists in a development/production build, never in
 * Expo Go. The Android library throws on import when its module is missing,
 * so it is only ever required behind this check.
 */
export const androidWidgetsAvailable =
  Platform.OS === 'android' &&
  (TurboModuleRegistry.get('AndroidWidget') != null || NativeModules.AndroidWidget != null);

const iosExtensionStorage = (() => {
  if (Platform.OS !== 'ios') return null;
  // `expo` global is provided by expo-modules-core; the module only exists in a native build.
  const available = typeof expo !== 'undefined' && (expo?.modules as Record<string, unknown> | undefined)?.ExtensionStorage != null;
  if (!available) return null;
  const { ExtensionStorage } = require('@bacons/apple-targets') as typeof import('@bacons/apple-targets');
  return { storage: new ExtensionStorage(APP_GROUP), reload: () => ExtensionStorage.reloadWidget() };
})();

export const iosWidgetsAvailable = iosExtensionStorage !== null;
export const widgetsAvailable = androidWidgetsAvailable || iosWidgetsAvailable;

/** Saves the snapshot where the widgets can read it and asks them to redraw. */
export async function publishSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  const json = JSON.stringify(snapshot);

  if (androidWidgetsAvailable) {
    // The Android widget task handler runs in this app's JS runtime and reads AsyncStorage.
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, json);
    const { refreshAndroidWidgets } = require('./android/register') as typeof import('./android/register');
    await refreshAndroidWidgets(snapshot);
  }

  if (iosExtensionStorage) {
    // The SwiftUI widget reads this JSON from the shared App Group defaults.
    iosExtensionStorage.storage.set('snapshot', json);
    iosExtensionStorage.reload();
  }
}


import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate, type Language, type StringKey } from './i18n';
import { DEFAULT_REMINDER_MINUTES, REMINDER_OPTIONS } from './utils/reminders';
import { DEFAULT_THEME_ID, getTheme, THEMES, type Theme, type ThemeColors, type ThemeId } from './themes';

const SETTINGS_KEY = 'blockstar:settings:v1';

/** Where the pull-out menu tab sits on the screen edge. */
export type MenuSide = 'left' | 'right';
export type MenuHeight = 'top' | 'middle' | 'bottom';
export type MenuPosition = `${MenuSide}-${MenuHeight}`;
export const MENU_POSITIONS: MenuPosition[] = [
  'left-top',
  'left-middle',
  'left-bottom',
  'right-top',
  'right-middle',
  'right-bottom',
];

interface StoredSettings {
  language: Language;
  themeId: ThemeId;
  /** False until the user taps through the welcome screen */
  welcomeSeen: boolean;
  /** Minutes before an event to send a reminder; null = reminders off */
  reminderMinutes: number | null;
  menuPosition: MenuPosition;
  /** Show text labels next to the menu's popup buttons */
  menuLabels: boolean;
}

const DEFAULTS: StoredSettings = {
  language: 'en',
  themeId: DEFAULT_THEME_ID,
  welcomeSeen: false,
  reminderMinutes: DEFAULT_REMINDER_MINUTES,
  menuPosition: 'right-bottom',
  menuLabels: true,
};

interface SettingsContextValue extends StoredSettings {
  theme: Theme;
  colors: ThemeColors;
  t: (key: StringKey) => string;
  setLanguage: (language: Language) => void;
  setThemeId: (themeId: ThemeId) => void;
  setWelcomeSeen: (welcomeSeen: boolean) => void;
  setReminderMinutes: (minutes: number | null) => void;
  setMenuPosition: (position: MenuPosition) => void;
  setMenuLabels: (show: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function sanitize(value: unknown): StoredSettings {
  if (typeof value !== 'object' || value === null) return DEFAULTS;
  const v = value as Record<string, unknown>;
  const language: Language = v.language === 'id' || v.language === 'en' ? v.language : DEFAULTS.language;
  const themeId = THEMES.some((t) => t.id === v.themeId) ? (v.themeId as ThemeId) : DEFAULTS.themeId;
  const welcomeSeen = v.welcomeSeen === true;
  const reminderMinutes =
    v.reminderMinutes === null
      ? null
      : (REMINDER_OPTIONS as readonly unknown[]).includes(v.reminderMinutes)
        ? (v.reminderMinutes as number)
        : DEFAULTS.reminderMinutes;
  const menuPosition = MENU_POSITIONS.includes(v.menuPosition as MenuPosition)
    ? (v.menuPosition as MenuPosition)
    : DEFAULTS.menuPosition;
  const menuLabels = typeof v.menuLabels === 'boolean' ? v.menuLabels : DEFAULTS.menuLabels;
  return { language, themeId, welcomeSeen, reminderMinutes, menuPosition, menuLabels };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoredSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (raw) setSettings(sanitize(JSON.parse(raw)));
      })
      .catch((err) => console.warn('Failed to load settings', err))
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((patch: Partial<StoredSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch((err) =>
        console.warn('Failed to save settings', err),
      );
      return next;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(() => {
    const theme = getTheme(settings.themeId);
    return {
      ...settings,
      theme,
      colors: theme.colors,
      t: (key) => translate(settings.language, key),
      setLanguage: (language) => update({ language }),
      setThemeId: (themeId) => update({ themeId }),
      setWelcomeSeen: (welcomeSeen) => update({ welcomeSeen }),
      setReminderMinutes: (reminderMinutes) => update({ reminderMinutes }),
      setMenuPosition: (menuPosition) => update({ menuPosition }),
      setMenuLabels: (menuLabels) => update({ menuLabels }),
    };
  }, [settings, update]);

  // Avoid flashing the default theme/language before saved settings load.
  if (!loaded) return null;

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

/** Builds a StyleSheet from the active theme colors, recomputed only when the theme changes. */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(colors), [colors]);
}

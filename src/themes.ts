export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  /** Event card background */
  primary: string;
  /** Accents: selected day, active tab */
  primaryStrong: string;
  /** Text and icons on top of `primary` */
  onPrimary: string;
  text: string;
  textMuted: string;
  textDim: string;
  danger: string;
  tabBar: string;
}

export type ThemeId = 'midnight' | 'ocean' | 'forest' | 'sunset' | 'daylight' | 'blossom';

export interface Theme {
  id: ThemeId;
  dark: boolean;
  colors: ThemeColors;
}

export const THEMES: Theme[] = [
  {
    id: 'midnight',
    dark: true,
    colors: {
      background: '#000000',
      surface: '#161618',
      surfaceAlt: '#1C1C1E',
      border: '#5A5A60',
      primary: '#9A87E8',
      primaryStrong: '#7F6EE0',
      onPrimary: '#FFFFFF',
      text: '#FFFFFF',
      textMuted: '#8E8E93',
      textDim: '#6C6C70',
      danger: '#FF6B6B',
      tabBar: '#111113',
    },
  },
  {
    id: 'ocean',
    dark: true,
    colors: {
      background: '#06121F',
      surface: '#0E1E30',
      surfaceAlt: '#13263B',
      border: '#3D5875',
      primary: '#3A8DDE',
      primaryStrong: '#5AA9F0',
      onPrimary: '#FFFFFF',
      text: '#F2F7FC',
      textMuted: '#8CA3BA',
      textDim: '#5F778F',
      danger: '#FF7A7A',
      tabBar: '#0A1827',
    },
  },
  {
    id: 'forest',
    dark: true,
    colors: {
      background: '#0B130E',
      surface: '#142019',
      surfaceAlt: '#1A2920',
      border: '#43594B',
      primary: '#3E9E6B',
      primaryStrong: '#5CC28A',
      onPrimary: '#FFFFFF',
      text: '#F0F7F2',
      textMuted: '#8FA597',
      textDim: '#62786A',
      danger: '#FF7A7A',
      tabBar: '#101A14',
    },
  },
  {
    id: 'sunset',
    dark: true,
    colors: {
      background: '#140C0A',
      surface: '#221512',
      surfaceAlt: '#2B1B17',
      border: '#664139',
      primary: '#E8735A',
      primaryStrong: '#FF9470',
      onPrimary: '#FFFFFF',
      text: '#FFF5F1',
      textMuted: '#B39890',
      textDim: '#82675F',
      danger: '#FF5C7A',
      tabBar: '#1B110E',
    },
  },
  {
    id: 'daylight',
    dark: false,
    colors: {
      background: '#F4F4F8',
      surface: '#FFFFFF',
      surfaceAlt: '#E9E9EF',
      border: '#C5C5CF',
      primary: '#8A76E0',
      primaryStrong: '#6A55D6',
      onPrimary: '#FFFFFF',
      text: '#14141A',
      textMuted: '#6B6B78',
      textDim: '#9A9AA6',
      danger: '#D93838',
      tabBar: '#FFFFFF',
    },
  },
  {
    id: 'blossom',
    dark: false,
    colors: {
      background: '#FFF5F7',
      surface: '#FFFFFF',
      surfaceAlt: '#FBE6EC',
      border: '#EBC3CF',
      primary: '#E0709A',
      primaryStrong: '#C9507F',
      onPrimary: '#FFFFFF',
      text: '#2A1720',
      textMuted: '#8A6873',
      textDim: '#B597A1',
      danger: '#D93838',
      tabBar: '#FFFFFF',
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'midnight';

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StringKey } from '../i18n';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';
import type { IconName } from '../types';

export type TabKey = 'home' | 'timeline' | 'routines' | 'stats' | 'settings';

export const TABS: { key: TabKey; label: StringKey; icon: IconName }[] = [
  { key: 'home', label: 'tabHome', icon: 'home-variant-outline' },
  { key: 'timeline', label: 'tabTimeline', icon: 'menu' },
  { key: 'routines', label: 'tabRoutines', icon: 'sync' },
  { key: 'stats', label: 'tabStats', icon: 'chart-bar' },
  { key: 'settings', label: 'tabSettings', icon: 'cog' },
];

interface Props {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

export function TabBar({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const color = isActive ? colors.primaryStrong : colors.textMuted;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel={t(tab.label)}
            accessibilityState={{ selected: isActive }}
          >
            <MaterialCommunityIcons name={tab.icon} size={28} color={color} />
            {isActive && <Text style={[styles.label, { color }]}>{t(tab.label)}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: colors.tabBar,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.surfaceAlt,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    label: {
      fontSize: 12,
      marginTop: 2,
    },
  });

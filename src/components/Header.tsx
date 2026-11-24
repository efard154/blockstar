import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';

interface Props {
  title: string;
  subtitle?: string;
  onAdd: () => void;
  /** Shows a "Today" button when set */
  onToday?: () => void;
}

export function Header({ title, subtitle, onAdd, onToday }: Props) {
  const { colors, t } = useSettings();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {onToday && (
        <Pressable
          onPress={onToday}
          hitSlop={8}
          style={({ pressed }) => [styles.todayPill, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.todayText}>{t('today')}</Text>
        </Pressable>
      )}
      <Pressable
        onPress={onAdd}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t('addEvent')}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Feather name="plus" size={34} color={colors.text} />
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    titles: { flex: 1 },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
    },
    subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
    todayPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.primaryStrong,
    },
    todayText: { color: colors.primaryStrong, fontSize: 13, fontWeight: '700' },
    pressed: { opacity: 0.5 },
  });

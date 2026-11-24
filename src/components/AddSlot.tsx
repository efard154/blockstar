import { Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../theme';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';
import { formatTime } from '../utils/time';

interface Props {
  start: number;
  onPress: () => void;
}

export function AddSlot({ start, onPress }: Props) {
  const { colors, t } = useSettings();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${t('addEvent')} ${t('at')} ${formatTime(start)}`}
    >
      <Feather name="plus" size={24} color={colors.textMuted} style={styles.icon} />
      <Text style={styles.label}>{t('addEvent')}</Text>
      <Text style={styles.time}>{formatTime(start)}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    slot: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 62,
      paddingHorizontal: 18,
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { backgroundColor: colors.surfaceAlt },
    icon: { width: 30 },
    label: {
      flex: 1,
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 16,
    },
    time: {
      color: colors.textMuted,
      fontSize: 17,
      fontWeight: '700',
    },
  });

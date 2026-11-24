import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../theme';
import { formatDuration } from '../i18n';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';
import type { BlockEvent } from '../types';
import { formatTime } from '../utils/time';

interface Props {
  event: BlockEvent;
  onPress: () => void;
}

export function EventCard({ event, onPress }: Props) {
  const { colors, language, t } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const duration = event.duration > 0 ? formatDuration(language, event.duration) : null;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${event.title} ${t('at')} ${formatTime(event.start)}`}
    >
      <MaterialCommunityIcons name={event.icon} size={30} color={colors.onPrimary} style={styles.icon} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {event.title}
          </Text>
          {event.routineId && (
            <MaterialCommunityIcons name="repeat" size={14} color={colors.onPrimary} style={styles.repeat} />
          )}
        </View>
        {duration && <Text style={styles.duration}>{duration}</Text>}
      </View>
      <Text style={styles.time}>{formatTime(event.start)}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 64,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
    },
    pressed: { opacity: 0.85 },
    icon: { width: 36 },
    body: { flex: 1, marginLeft: 8, marginRight: 8 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    title: {
      color: colors.onPrimary,
      fontSize: 18,
      flexShrink: 1,
    },
    repeat: { marginLeft: 6, opacity: 0.85 },
    duration: {
      color: colors.onPrimary,
      fontSize: 11,
      fontStyle: 'italic',
      marginTop: 1,
    },
    time: {
      color: colors.onPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
  });

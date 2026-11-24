import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../theme';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';
import type { IconName } from '../types';

const ACTION_WIDTH = 96;

interface Props {
  children: ReactNode;
  /** Called once the row is swiped far enough to the left */
  onDelete: () => void;
  label: string;
  icon?: IconName;
  enabled?: boolean;
}

/** Swipe a row to the left to delete it (the parent offers undo). */
export function SwipeToDelete({ children, onDelete, label, icon = 'trash-can-outline', enabled = true }: Props) {
  const styles = useThemedStyles(makeStyles);
  return (
    <ReanimatedSwipeable
      enabled={enabled}
      friction={1.4}
      rightThreshold={ACTION_WIDTH * 0.6}
      overshootRight
      overshootFriction={6}
      containerStyle={styles.container}
      renderRightActions={(progress) => <DeleteAction progress={progress} label={label} icon={icon} />}
      onSwipeableOpen={() => onDelete()}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

function DeleteAction({ progress, label, icon }: { progress: SharedValue<number>; label: string; icon: IconName }) {
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.6, 1], 'clamp'),
    transform: [{ scale: interpolate(progress.value, [0, 1, 1.4], [0.6, 1, 1.15], 'clamp') }],
  }));

  return (
    <Reanimated.View style={styles.action}>
      <Reanimated.View style={[styles.actionContent, contentStyle]}>
        <MaterialCommunityIcons name={icon} size={24} color={colors.onPrimary} />
        <Text style={styles.actionText}>{label}</Text>
      </Reanimated.View>
    </Reanimated.View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { borderRadius: radius.sm, backgroundColor: colors.danger },
    action: {
      width: ACTION_WIDTH,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionContent: { alignItems: 'center', gap: 2 },
    actionText: { color: colors.onPrimary, fontSize: 12, fontWeight: '700' },
  });

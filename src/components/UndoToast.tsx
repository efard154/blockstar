import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { radius } from '../theme';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';

const VISIBLE_MS = 4500;

interface Props {
  /** Message to show; null hides the toast. Changing it restarts the timer. */
  message: string | null;
  /** Changes on every new deletion so a repeat message still restarts the timer */
  token: number;
  onUndo: () => void;
  onHide: () => void;
}

export function UndoToast({ message, token, onUndo, onHide }: Props) {
  const { t } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }).start();
    const id = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onHide());
    }, VISIBLE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, token]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <Pressable onPress={onUndo} hitSlop={10} accessibilityRole="button">
        <Text style={styles.undo}>{t('undo')}</Text>
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    toast: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    message: { color: colors.text, fontSize: 14, flex: 1 },
    undo: { color: colors.primaryStrong, fontSize: 15, fontWeight: '800' },
  });

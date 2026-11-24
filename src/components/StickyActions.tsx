import { useEffect, useState } from 'react';
import { Animated, BackHandler, PanResponder, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';
import type { IconName } from '../types';

/** Edge tab geometry: only PEEK px show; the rest is tucked off-screen until pulled. */
const HANDLE_WIDTH = 64;
const HANDLE_HEIGHT = 76;
const PEEK = 16;
const MAX_PULL = HANDLE_WIDTH - PEEK; // fully revealed
const OPEN_THRESHOLD = 28;
const BOTTOM_GAP = 24;
const TOP_GAP = 12;
const EDGE_GAP = 16;

const MINI_SIZE = 46;
const ITEM_SPACING = 58;

/**
 * Space the tab occupies at the bottom of the screen, so toasts can sit above
 * it. Zero extra space when the tab sits in the middle of the edge.
 */
export function useStickyActionsSpace(): number {
  const insets = useSafeAreaInsets();
  const { menuPosition } = useSettings();
  const base = Math.max(insets.bottom, 8);
  return menuPosition.endsWith('bottom') ? base + BOTTOM_GAP + HANDLE_HEIGHT : base;
}

interface Props {
  onAddEvent: () => void;
  onRoutines: () => void;
  onSettings: () => void;
}

const springBack = (value: Animated.Value) =>
  Animated.spring(value, { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }).start();

/**
 * A tab tucked into the screen edge (side and height come from Settings).
 * Pull it out — or tap it — and the menu slides in: Add event, Routines,
 * Settings. Tap the dimmed backdrop, press Android back, or pick an action to close.
 */
export function StickyActions({ onAddEvent, onRoutines, onSettings }: Props) {
  const { colors, t, menuPosition, menuLabels } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));
  /** How far the tab is pulled out, in px (0 = tucked in). */
  const [pull] = useState(() => new Animated.Value(0));

  const left = menuPosition.startsWith('left');
  const top = menuPosition.endsWith('top');
  const middle = menuPosition.endsWith('middle');
  /** +1 when the tab opens by pulling right (left edge), -1 when pulling left (right edge). */
  const direction = left ? 1 : -1;

  useEffect(() => {
    Animated.spring(progress, { toValue: open ? 1 : 0, friction: 8, tension: 70, useNativeDriver: true }).start();
    springBack(pull);
  }, [open, progress, pull]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [open]);

  // Rebuilt when the side changes so the drag direction follows the setting.
  const [panState, setPanState] = useState(() => ({ direction, pan: createPan(direction, pull, setOpen) }));
  if (panState.direction !== direction) setPanState({ direction, pan: createPan(direction, pull, setOpen) });
  const pan = panState.pan;

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  const actions: { icon: IconName; label: string; onPress: () => void }[] = [
    // Closest to the tab = most used.
    { icon: 'calendar-plus', label: t('addEvent'), onPress: () => choose(onAddEvent) },
    { icon: 'sync', label: t('tabRoutines'), onPress: () => choose(onRoutines) },
    { icon: 'cog-outline', label: t('tabSettings'), onPress: () => choose(onSettings) },
  ];
  const menuHeight = (actions.length - 1) * ITEM_SPACING + HANDLE_HEIGHT;

  // Vertical placement: near the top, centered, or above the home indicator.
  const bottomOffset = Math.max(insets.bottom, 8) + BOTTOM_GAP;
  const handleVertical: ViewStyle = top
    ? { top: TOP_GAP }
    : middle
      ? { top: '50%', marginTop: -HANDLE_HEIGHT / 2 }
      : { bottom: bottomOffset };
  // The menu's first button lines up with the tab; it grows downward from a
  // top tab and upward otherwise.
  const menuVertical: ViewStyle = top
    ? { top: TOP_GAP }
    : middle
      ? { top: '50%', marginTop: HANDLE_HEIGHT / 2 - menuHeight }
      : { bottom: bottomOffset };
  const itemOffset = (i: number): ViewStyle =>
    top
      ? { top: (HANDLE_HEIGHT - MINI_SIZE) / 2 + i * ITEM_SPACING }
      : { bottom: (HANDLE_HEIGHT - MINI_SIZE) / 2 + i * ITEM_SPACING };
  const handleSide: ViewStyle = left
    ? { left: -(HANDLE_WIDTH - PEEK), borderTopRightRadius: 16, borderBottomRightRadius: 16, flexDirection: 'row-reverse' }
    : { right: -(HANDLE_WIDTH - PEEK), borderTopLeftRadius: 16, borderBottomLeftRadius: 16, flexDirection: 'row' };

  const reveal = pull.interpolate({ inputRange: [0, MAX_PULL], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <>
      {/* Dimmed backdrop while open; tap anywhere to close */}
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel={t('cancel')} />
      </Animated.View>

      {/* Menu: slides in from the tab's edge. Sized to cover the buttons,
          because Android ignores taps outside a view's bounds. */}
      <View
        pointerEvents={open ? 'box-none' : 'none'}
        style={[styles.menu, menuVertical, left ? { left: EDGE_GAP } : { right: EDGE_GAP }, { height: menuHeight }]}
      >
        {actions.map((a, i) => (
          <Animated.View
            key={a.label}
            style={[
              styles.action,
              left ? { left: 0 } : { right: 0 },
              itemOffset(i),
              {
                opacity: progress,
                // Staggered: the item nearest the tab arrives first.
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-direction * (180 + i * 40), 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              onPress={a.onPress}
              style={[styles.actionRow, left && styles.actionRowLeft]}
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              {({ pressed }) => (
                <>
                  {menuLabels && (
                    <View style={[styles.labelPill, pressed && styles.pressed]}>
                      <Text style={styles.labelText}>{a.label}</Text>
                    </View>
                  )}
                  <View style={[styles.mini, pressed && styles.pressed]}>
                    <MaterialCommunityIcons name={a.icon} size={22} color={colors.text} />
                  </View>
                </>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {/* The edge tab: mostly off-screen; pull it out (or tap) to open */}
      <Animated.View
        {...pan.panHandlers}
        hitSlop={left ? { right: 20, top: 10, bottom: 10 } : { left: 20, top: 10, bottom: 10 }}
        accessible
        accessibilityRole="button"
        accessibilityLabel={t('menu')}
        accessibilityState={{ expanded: open }}
        onAccessibilityTap={() => setOpen(true)}
        style={[
          styles.handle,
          handleSide,
          handleVertical,
          {
            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [{ translateX: Animated.multiply(pull, direction) }],
          },
        ]}
      >
        <View style={styles.grip}>
          <View style={styles.gripLine} />
          <View style={styles.gripLine} />
        </View>
        <Animated.View style={[styles.handleIcon, { opacity: reveal }]}>
          <Feather name="menu" size={22} color={colors.onPrimary} />
        </Animated.View>
      </Animated.View>
    </>
  );
}

/** Drag handling for the tab; `direction` is +1 to pull right, -1 to pull left. */
function createPan(direction: number, pull: Animated.Value, setOpen: (open: boolean) => void) {
  return PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, g) => {
      // Follow the finger outwards, with some resistance past full reveal.
      const out = Math.max(0, g.dx * direction);
      pull.setValue(out > MAX_PULL ? MAX_PULL + (out - MAX_PULL) * 0.25 : out);
    },
    onPanResponderRelease: (_, g) => {
      const isTap = Math.abs(g.dx) < 4 && Math.abs(g.dy) < 4;
      if (isTap || g.dx * direction > OPEN_THRESHOLD || g.vx * direction > 0.4) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setOpen(true);
      }
      springBack(pull);
    },
    onPanResponderTerminate: () => springBack(pull),
  });
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
    handle: {
      position: 'absolute',
      width: HANDLE_WIDTH,
      height: HANDLE_HEIGHT,
      backgroundColor: colors.primaryStrong,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 8,
    },
    grip: { width: PEEK, flexDirection: 'row', justifyContent: 'center', gap: 3 },
    gripLine: { width: 2, height: 24, borderRadius: 1, backgroundColor: colors.onPrimary, opacity: 0.75 },
    handleIcon: { width: HANDLE_WIDTH - PEEK, alignItems: 'center' },
    menu: { position: 'absolute', width: 280 },
    action: { position: 'absolute' },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    actionRowLeft: { flexDirection: 'row-reverse' },
    labelPill: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    labelText: { color: colors.text, fontSize: 14, fontWeight: '600' },
    mini: {
      width: MINI_SIZE,
      height: MINI_SIZE,
      borderRadius: MINI_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 6,
    },
    pressed: { opacity: 0.7 },
  });

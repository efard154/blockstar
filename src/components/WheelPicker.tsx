import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';

/** Geometry modelled on the iOS UIPickerView: 32pt rows, 7 visible, ~216pt tall. */
export const ITEM_HEIGHT = 32;
const VISIBLE_ITEMS = 7;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

/** Drum projection: each row is STEP_DEG further around a cylinder of radius R. */
const STEP_DEG = 20;
const RADIUS = ITEM_HEIGHT / (2 * Math.sin(((STEP_DEG / 2) * Math.PI) / 180));
const DISTANCES = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

/** Looping wheels repeat their items this many times and quietly recentre. */
const LOOP_CYCLES = 5;

export interface WheelItem<T> {
  label: string;
  value: T;
}

interface Props<T> {
  items: WheelItem<T>[];
  value: T;
  onChange: (value: T) => void;
  width?: number;
  /** Wraps around endlessly like the iOS time picker */
  loop?: boolean;
  /** Fixed unit label next to the selected row, e.g. "hours" (iOS countdown style) */
  unit?: string;
  accessibilityLabel: string;
}

/** Where a row sits on the drum when it is `distance` rows below the middle. */
function project(distance: number) {
  const angle = Math.max(-90, Math.min(90, distance * STEP_DEG));
  const rad = (angle * Math.PI) / 180;
  return {
    rotate: `${-angle}deg`,
    // Pull rows toward the middle so spacing shrinks like a real drum.
    translateY: RADIUS * Math.sin(rad) - distance * ITEM_HEIGHT,
    opacity: distance === 0 ? 1 : Math.max(0, Math.cos(rad)) * 0.55,
  };
}

const PROJECTION = DISTANCES.map(project);

const tick = () => {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => {});
};

/** A single scroll wheel. Place one or more inside a <WheelGroup>. */
export function WheelPicker<T>({
  items,
  value,
  onChange,
  width = 72,
  loop = false,
  unit,
  accessibilityLabel,
}: Props<T>) {
  const styles = useThemedStyles(makeStyles);
  const scrollRef = useRef<any>(null);

  const n = items.length;
  const cycles = loop ? LOOP_CYCLES : 1;
  const base = loop ? Math.floor(cycles / 2) * n : 0;
  const rows = useMemo(
    () => Array.from({ length: n * cycles }, (_, j) => ({ row: j, item: items[j % n] })),
    [items, n, cycles],
  );

  const valueIndex = Math.max(0, items.findIndex((i) => i.value === value));
  const currentRow = useRef(base + valueIndex);
  const lastTickRow = useRef(base + valueIndex);
  // Start the animation driver at the selected row, not 0 — otherwise every row
  // renders as "far from the middle" (nearly invisible) until the user scrolls.
  const scrollY = useRef(new Animated.Value((base + valueIndex) * ITEM_HEIGHT)).current;

  const scrollToRow = (row: number, animated: boolean) => {
    currentRow.current = row;
    if (!animated) {
      lastTickRow.current = row;
      scrollY.setValue(row * ITEM_HEIGHT);
    }
    scrollRef.current?.scrollTo({ y: row * ITEM_HEIGHT, animated });
  };

  /** Puts the wheel on the current row without animation (initial open). */
  const placeAtCurrent = () => scrollToRow(currentRow.current, false);

  // Follow external value changes (sheet reopened, "move to" tapped).
  useEffect(() => {
    if (currentRow.current % n === valueIndex) return;
    scrollToRow(base + valueIndex, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueIndex]);

  const settle = (y: number) => {
    const row = Math.min(rows.length - 1, Math.max(0, Math.round(y / ITEM_HEIGHT)));
    const index = row % n;
    const changed = index !== currentRow.current % n;
    currentRow.current = row;
    // Jump back to the middle copy so a looping wheel never runs out.
    if (loop && (row < n || row >= rows.length - n)) scrollToRow(base + index, false);
    if (changed) onChange(items[index].value);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => settle(e.nativeEvent.contentOffset.y);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
    listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      // A light tick each time a new row crosses the selection bar.
      const row = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
      if (row !== lastTickRow.current) {
        lastTickRow.current = row;
        tick();
      }
    },
  });

  const step = (delta: number) => {
    const row = Math.min(rows.length - 1, Math.max(0, currentRow.current + delta));
    scrollToRow(row, true);
    onChange(items[row % n].value);
  };

  return (
    <View
      style={[styles.wheel, { width }]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: `${items[valueIndex]?.label ?? ''}${unit ? ' ' + unit : ''}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      <Animated.ScrollView
        ref={scrollRef}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: currentRow.current * ITEM_HEIGHT }}
        onLayout={placeAtCurrent}
        onContentSizeChange={placeAtCurrent}
        contentContainerStyle={{ paddingVertical: PADDING }}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={(e) => {
          // Slow release without momentum: settle right away.
          if (Math.abs(e.nativeEvent.velocity?.y ?? 0) < 0.05) onScrollEnd(e);
        }}
      >
        {rows.map(({ row, item }) => {
          const center = row * ITEM_HEIGHT;
          // When the wheel is d rows short of this item, the item sits d rows below the middle.
          const inputRange = DISTANCES.map((d) => center - d * ITEM_HEIGHT).reverse();
          const out = <K extends keyof ReturnType<typeof project>>(k: K) =>
            PROJECTION.map((p) => p[k]).reverse() as ReturnType<typeof project>[K][];
          return (
            <Pressable
              key={row}
              onPress={() => step(row - currentRow.current)}
              style={styles.item}
              importantForAccessibility="no"
            >
              <Animated.View
                style={[
                  styles.itemInner,
                  unit ? styles.itemWithUnit : null,
                  {
                    opacity: scrollY.interpolate({ inputRange, outputRange: out('opacity'), extrapolate: 'clamp' }),
                    transform: [
                      { perspective: 600 },
                      {
                        translateY: scrollY.interpolate({ inputRange, outputRange: out('translateY'), extrapolate: 'clamp' }),
                      },
                      { rotateX: scrollY.interpolate({ inputRange, outputRange: out('rotate'), extrapolate: 'clamp' }) },
                    ],
                  },
                ]}
              >
                <Text style={[styles.itemText, unit ? styles.itemTextWithUnit : null]}>{item.label}</Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </Animated.ScrollView>

      {unit && (
        <View pointerEvents="none" style={styles.unitBox}>
          <Text style={styles.unitText} numberOfLines={1}>
            {unit}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Hosts wheels side by side with one shared selection bar and soft edge fades,
 * like the native iOS date/time picker. `background` must match what's behind it.
 */
export function WheelGroup({ children, background }: { children: ReactNode; background: string }) {
  const styles = useThemedStyles(makeStyles);
  const clear = withAlpha(background, 0);
  const mid = withAlpha(background, 0.75);
  return (
    <View style={styles.group}>
      <View pointerEvents="none" style={styles.selectionBar} />
      <View style={styles.groupRow}>{children}</View>
      <LinearGradient pointerEvents="none" colors={[background, mid, clear]} style={[styles.fade, styles.fadeTop]} />
      <LinearGradient pointerEvents="none" colors={[clear, mid, background]} style={[styles.fade, styles.fadeBottom]} />
    </View>
  );
}

/** "#RRGGBB" + alpha → "rgba(r,g,b,a)" (a gradient needs the same hue at 0 alpha). */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    group: { height: WHEEL_HEIGHT, justifyContent: 'center' },
    groupRow: { flexDirection: 'row', justifyContent: 'center' },
    selectionBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: PADDING,
      height: ITEM_HEIGHT,
      borderRadius: 8,
      // Neutral gray like iOS's tertiary system fill, independent of the accent color.
      backgroundColor: 'rgba(120,120,128,0.2)',
    },
    fade: { position: 'absolute', left: 0, right: 0, height: PADDING - 6 },
    fadeTop: { top: 0 },
    fadeBottom: { bottom: 0 },
    wheel: { height: WHEEL_HEIGHT, overflow: 'hidden' },
    item: { height: ITEM_HEIGHT },
    itemInner: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
    itemWithUnit: { alignItems: 'flex-start' },
    itemText: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '400',
      fontVariant: ['tabular-nums'],
      letterSpacing: 0.3,
    },
    itemTextWithUnit: { width: 34, textAlign: 'right' },
    unitBox: {
      position: 'absolute',
      top: PADDING,
      height: ITEM_HEIGHT,
      left: 42,
      right: 0,
      justifyContent: 'center',
    },
    unitText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  });

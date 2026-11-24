import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { radius } from '../theme';
import { weekdayShort } from '../i18n';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';
import { addDays, isSameDay } from '../utils/time';

/** Weeks reachable on each side of the current week. */
const WEEKS_EACH_SIDE = 104;
const WEEK_COUNT = WEEKS_EACH_SIDE * 2 + 1;
const WEEK_INDEXES = Array.from({ length: WEEK_COUNT }, (_, i) => i);

function mondayOf(d: Date): Date {
  const monday = addDays(d, -((d.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function weekIndexOf(d: Date, baseMonday: Date): number {
  const diffDays = Math.round((mondayOf(d).getTime() - baseMonday.getTime()) / 86_400_000);
  return WEEKS_EACH_SIDE + Math.round(diffDays / 7);
}

interface Props {
  today: Date;
  selected: Date;
  onSelect: (d: Date) => void;
}

/**
 * Horizontally paged week strip (Mon–Sun). Swiping to another week selects
 * the same weekday there, so the timeline follows.
 */
export function WeekStrip({ today, selected, onSelect }: Props) {
  const styles = useThemedStyles(makeStyles);
  const baseMonday = useMemo(() => mondayOf(today), [today]);
  const listRef = useRef<FlatList<number>>(null);
  const [width, setWidth] = useState(0);
  const visibleIndex = useRef(WEEKS_EACH_SIDE);

  const selectedIndex = weekIndexOf(selected, baseMonday);

  // Keep the strip on the selected week when it changes from outside (e.g. "Today").
  useEffect(() => {
    if (width === 0 || selectedIndex === visibleIndex.current) return;
    if (selectedIndex < 0 || selectedIndex >= WEEK_COUNT) return;
    visibleIndex.current = selectedIndex;
    listRef.current?.scrollToIndex({ index: selectedIndex, animated: true });
  }, [selectedIndex, width]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index === visibleIndex.current) return;
    visibleIndex.current = index;
    const offset = (selected.getDay() + 6) % 7; // weekday position within Mon–Sun
    onSelect(addDays(baseMonday, (index - WEEKS_EACH_SIDE) * 7 + offset));
  };

  const renderWeek = useCallback(
    ({ item: index }: { item: number }) => (
      <Week
        monday={addDays(baseMonday, (index - WEEKS_EACH_SIDE) * 7)}
        width={width}
        today={today}
        selected={selected}
        onSelect={onSelect}
      />
    ),
    [baseMonday, width, today, selected, onSelect],
  );

  return (
    <View style={styles.wrapper} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <FlatList
          ref={listRef}
          data={WEEK_INDEXES}
          keyExtractor={(i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={selectedIndex}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          initialNumToRender={1}
          windowSize={3}
          renderItem={renderWeek}
          extraData={selected}
          onMomentumScrollEnd={onMomentumEnd}
        />
      )}
    </View>
  );
}

function Week(props: { monday: Date; width: number; today: Date; selected: Date; onSelect: (d: Date) => void }) {
  const { language } = useSettings();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.row, { width: props.width }]}>
      {Array.from({ length: 7 }, (_, i) => {
        const d = addDays(props.monday, i);
        const active = isSameDay(d, props.selected);
        const isToday = isSameDay(d, props.today);
        return (
          <Pressable
            key={i}
            onPress={() => props.onSelect(d)}
            style={[styles.day, active && styles.dayActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.name, (active || isToday) && styles.textActive]}>
              {weekdayShort(language, d.getDay())}
            </Text>
            <Text style={[styles.num, (active || isToday) && styles.textActive]}>{d.getDate()}</Text>
            {isToday && <View style={styles.todayDot} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: { paddingBottom: 10, minHeight: 64 },
    row: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 6,
    },
    day: {
      flex: 1,
      aspectRatio: 0.92,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    dayActive: {
      borderColor: colors.primaryStrong,
    },
    name: {
      color: colors.textMuted,
      fontSize: 9,
      fontWeight: '500',
    },
    num: {
      color: colors.textMuted,
      fontSize: 15,
    },
    textActive: {
      color: colors.primaryStrong,
    },
    todayDot: {
      position: 'absolute',
      bottom: 4,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primaryStrong,
    },
  });

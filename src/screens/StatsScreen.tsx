import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../theme';
import { useEvents } from '../events';
import { categoryName, weekdayName, weekdayShort, type StringKey } from '../i18n';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';
import type { IconName } from '../types';
import { computeStats, formatHoursShort, periodRange, type DayPart, type Period } from '../utils/stats';
import { expandRoutines } from '../utils/routines';
import { toDateKey } from '../utils/time';

const PERIODS: { id: Period; label: StringKey }[] = [
  { id: 'week', label: 'periodWeek' },
  { id: 'month', label: 'periodMonth' },
  { id: 'all', label: 'periodAll' },
];

const DAY_PART_ICONS: Record<DayPart, IconName> = {
  morning: 'weather-sunset-up',
  afternoon: 'white-balance-sunny',
  evening: 'weather-sunset-down',
  night: 'weather-night',
};

const CHART_HEIGHT = 140;

export function StatsScreen() {
  const { colors, language, t } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const { events, routines } = useEvents();
  const [period, setPeriod] = useState<Period>('week');
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  const stats = useMemo(() => {
    const today = new Date();
    // Routine occurrences count like events: within the period, or from the
    // first routine's start date up to today for "all time".
    const range = periodRange(period, today) ?? {
      from: routines.reduce((min, r) => (r.since < min ? r.since : min), toDateKey(today)),
      to: toDateKey(today),
    };
    const occurrences = expandRoutines(routines, range.from, range.to);
    return computeStats([...events, ...occurrences], period, today);
  }, [events, routines, period]);
  const countLabel = (n: number) => `${n} ${t(n === 1 ? 'eventCount' : 'eventsCount')}`;

  const maxWeekday = Math.max(...stats.byWeekday.map((d) => d.minutes));
  const maxWeekdayIndex = stats.byWeekday.findIndex((d) => d.minutes === maxWeekday && d.minutes > 0);
  // Selective labeling: only the tapped bar (or the tallest one by default) shows its value.
  const labeledBar = selectedBar ?? maxWeekdayIndex;

  const maxCategory = Math.max(1, ...stats.byCategory.map((c) => c.minutes));
  const maxDayPart = Math.max(1, ...stats.byDayPart.map((p) => p.count));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('tabStats')}</Text>

      {/* Period filter */}
      <View style={styles.segment}>
        {PERIODS.map((p) => {
          const active = p.id === period;
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                setPeriod(p.id);
                setSelectedBar(null);
              }}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{t(p.label)}</Text>
            </Pressable>
          );
        })}
      </View>

      {stats.totalEvents === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="chart-bar" size={48} color={colors.textDim} />
          <Text style={styles.emptyText}>{t('noStats')}</Text>
        </View>
      ) : (
        <>
          {/* Headline numbers */}
          <View style={styles.tiles}>
            <Tile label={t('statEvents')} value={String(stats.totalEvents)} />
            <Tile label={t('statPlanned')} value={formatHoursShort(stats.totalMinutes)} />
            <Tile label={t('statAvgPerDay')} value={formatHoursShort(stats.avgMinutesPerActiveDay)} />
            <Tile
              label={t('statBusiestDay')}
              value={stats.busiestWeekday === null ? '–' : weekdayName(language, stats.busiestWeekday)}
            />
          </View>

          {/* Planned time per weekday: single-series column chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('chartByWeekday')}</Text>
            <Text style={styles.cardHint}>{t('tapBarHint')}</Text>
            <View style={styles.chart}>
              {stats.byWeekday.map((d, i) => {
                const h = maxWeekday > 0 ? (d.minutes / maxWeekday) * CHART_HEIGHT : 0;
                const dimmed = selectedBar !== null && selectedBar !== i;
                return (
                  <Pressable
                    key={d.weekday}
                    style={styles.column}
                    onPress={() => setSelectedBar(selectedBar === i ? null : i)}
                    accessibilityRole="button"
                    accessibilityLabel={`${weekdayName(language, d.weekday)}: ${formatHoursShort(d.minutes)}, ${countLabel(d.count)}`}
                  >
                    <View style={styles.columnPlot}>
                      {labeledBar === i && (
                        <Text style={styles.barValue} numberOfLines={1}>
                          {formatHoursShort(d.minutes)}
                        </Text>
                      )}
                      <View
                        style={[
                          styles.bar,
                          { height: Math.max(h, d.minutes > 0 ? 4 : 0) },
                          dimmed && styles.barDimmed,
                        ]}
                      />
                    </View>
                    <Text style={[styles.axisLabel, selectedBar === i && styles.axisLabelActive]}>
                      {weekdayShort(language, d.weekday)}
                    </Text>
                  </Pressable>
                );
              })}
              <View pointerEvents="none" style={styles.baseline} />
            </View>
          </View>

          {/* By category */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('chartByCategory')}</Text>
            {stats.byCategory.map((c) => (
              <BarRow
                key={c.icon}
                icon={c.icon}
                label={categoryName(language, c.icon)}
                detail={`${countLabel(c.count)} · ${formatHoursShort(c.minutes)}`}
                ratio={c.minutes / maxCategory}
              />
            ))}
          </View>

          {/* Time of day */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('chartByDayPart')}</Text>
            {stats.byDayPart.map((p) => (
              <BarRow
                key={p.part}
                icon={DAY_PART_ICONS[p.part]}
                label={t(p.part)}
                detail={countLabel(p.count)}
                ratio={p.count / maxDayPart}
              />
            ))}
          </View>

          {/* Most frequent events */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('topEvents')}</Text>
            {stats.topTitles.map((e, i) => (
              <View key={e.title} style={[styles.topRow, i > 0 && styles.topRowDivider]}>
                <Text style={styles.rank}>{i + 1}</Text>
                <View style={styles.topIcon}>
                  <MaterialCommunityIcons name={e.icon} size={18} color={colors.onPrimary} />
                </View>
                <Text style={styles.topTitle} numberOfLines={1}>
                  {e.title}
                </Text>
                <Text style={styles.topDetail}>
                  ×{e.count}
                  {e.minutes > 0 ? ` · ${formatHoursShort(e.minutes)}` : ''}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function BarRow(props: { icon: IconName; label: string; detail: string; ratio: number }) {
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.barRow} accessible accessibilityLabel={`${props.label}: ${props.detail}`}>
      <View style={styles.barRowHeader}>
        <MaterialCommunityIcons name={props.icon} size={18} color={colors.textMuted} />
        <Text style={styles.barRowLabel} numberOfLines={1}>
          {props.label}
        </Text>
        <Text style={styles.barRowDetail}>{props.detail}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(props.ratio * 100, props.ratio > 0 ? 2 : 0)}%` }]} />
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
      paddingHorizontal: 4,
      paddingTop: 24,
      paddingBottom: 4,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.lg,
      padding: 3,
    },
    segmentItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 9,
      borderRadius: radius.lg - 2,
    },
    segmentItemActive: { backgroundColor: colors.primaryStrong },
    segmentText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
    segmentTextActive: { color: colors.onPrimary },
    empty: { alignItems: 'center', gap: 12, paddingVertical: 64 },
    emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    tile: {
      width: '47%',
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: 14,
      gap: 4,
    },
    tileValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
    tileLabel: { color: colors.textMuted, fontSize: 13 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: 16,
      gap: 12,
    },
    cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
    cardHint: { color: colors.textDim, fontSize: 12, marginTop: -8 },
    chart: { flexDirection: 'row', gap: 6 },
    column: { flex: 1, alignItems: 'center' },
    columnPlot: {
      height: CHART_HEIGHT + 20,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    bar: {
      width: '62%',
      backgroundColor: colors.primary,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
    barDimmed: { opacity: 0.35 },
    barValue: { color: colors.text, fontSize: 11, fontWeight: '700', marginBottom: 4 },
    axisLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 6 },
    axisLabelActive: { color: colors.text },
    baseline: {
      position: 'absolute',
      top: CHART_HEIGHT + 20,
      left: 0,
      right: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    barRow: { gap: 6 },
    barRowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    barRowLabel: { color: colors.text, fontSize: 14, flex: 1 },
    barRowDetail: { color: colors.textMuted, fontSize: 13 },
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceAlt,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    topRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    rank: { color: colors.textDim, fontSize: 14, fontWeight: '700', width: 16 },
    topIcon: {
      width: 30,
      height: 30,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topTitle: { color: colors.text, fontSize: 15, flex: 1 },
    topDetail: { color: colors.textMuted, fontSize: 13 },
  });

import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../theme';
import { useEvents } from '../events';
import { weekdayShort, type StringKey } from '../i18n';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';
import type { Routine } from '../types';
import { EventModal, type EventDraft } from '../components/EventModal';
import { BackButton } from '../components/BackButton';
import {
  EVERY_DAY,
  ROUTINE_TEMPLATES,
  sameDays,
  WEEKDAYS,
  WEEKENDS,
  weeklyMinutes,
  type RoutineTemplate,
} from '../utils/routines';
import { formatHoursShort, formatTime, toDateKey, WEEK_ORDER } from '../utils/time';
import { routineConflict } from '../utils/conflicts';

const TEMPLATE_TITLES: Record<RoutineTemplate['key'], StringKey> = {
  morning: 'routineMorning',
  workout: 'routineWorkout',
  focus: 'routineFocus',
  lunch: 'routineLunch',
  bedtime: 'routineBedtime',
};

export function RoutinesScreen({ onClose }: { onClose: () => void }) {
  const { colors, language, t } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const { routines, setRoutines, events } = useEvents();

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Routine | null>(null);
  const [initial, setInitial] = useState<Partial<EventDraft> | undefined>(undefined);

  const sorted = [...routines].sort((a, b) => a.start - b.start);
  const activeCount = routines.filter((r) => r.active).length;
  const existingTitles = new Set(routines.map((r) => r.title.trim().toLowerCase()));
  const suggestions = ROUTINE_TEMPLATES.filter(
    (tpl) => !existingTitles.has(t(TEMPLATE_TITLES[tpl.key]).toLowerCase()),
  );

  const openCreate = (prefill?: Partial<EventDraft>) => {
    setEditing(null);
    setInitial(prefill ?? { start: 7 * 60, duration: 30, days: EVERY_DAY });
    setModalVisible(true);
  };

  const openEdit = (r: Routine) => {
    setEditing(r);
    setModalVisible(true);
  };

  const handleSave = (draft: EventDraft) => {
    if (editing) {
      setRoutines((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...draft } : r)));
    } else {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setRoutines((prev) => [...prev, { id, active: true, since: toDateKey(new Date()), ...draft }]);
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    setModalVisible(false);
  };

  const toggleActive = (id: string, active: boolean) => {
    const routine = routines.find((r) => r.id === id);
    if (active && routine) {
      // Turning a paused routine back on must not create a clash either.
      const clash = routineConflict(routine, routine.days, routines, events, toDateKey(new Date()), id);
      if (clash) {
        Alert.alert(routine.title, `${t('conflictWith')} ${clash.conflict.title} (${formatTime(clash.conflict.start)})`);
        return;
      }
    }
    setRoutines((prev) => prev.map((r) => (r.id === id ? { ...r, active } : r)));
  };

  const daysLabel = (days: number[]) => {
    if (sameDays(days, EVERY_DAY)) return t('everyDay');
    if (sameDays(days, WEEKDAYS)) return t('weekdaysPreset');
    if (sameDays(days, WEEKENDS)) return t('weekendsPreset');
    return null;
  };

  /** "Every day" / "Weekdays" / "Weekends", otherwise e.g. "Mon · Wed · Fri". */
  const daysText = (days: number[]) =>
    daysLabel(days) ??
    WEEK_ORDER.filter((d) => days.includes(d))
      .map((d) => {
        const short = weekdayShort(language, d);
        return short.charAt(0) + short.slice(1).toLowerCase();
      })
      .join(' · ');

  const timeText = (start: number, duration: number) =>
    duration > 0 ? `${formatTime(start)}–${formatTime(Math.min(start + duration, 24 * 60))}` : formatTime(start);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={onClose} />
        <Text style={styles.title}>{t('tabRoutines')}</Text>
        <Pressable
          onPress={() => openCreate()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('addRoutine')}
          style={({ pressed }) => [styles.roundBtn, pressed && styles.pressed]}
        >
          <Feather name="plus" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {routines.length > 0 ? (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.section}>{t('yourRoutines')}</Text>
              <Text style={styles.sectionMeta}>
                {activeCount} {t('activeRoutines')} · {formatHoursShort(weeklyMinutes(routines))} {t('perWeek')}
              </Text>
            </View>

            <View style={styles.group}>
              {sorted.map((r, i) => (
                <Pressable
                  key={r.id}
                  onPress={() => openEdit(r)}
                  style={({ pressed }) => [styles.row, i > 0 && styles.rowDivider, pressed && styles.rowPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.title}, ${timeText(r.start, r.duration)}, ${daysText(r.days)}`}
                >
                  <View style={[styles.iconBox, !r.active && styles.iconBoxPaused]}>
                    <MaterialCommunityIcons
                      name={r.icon}
                      size={22}
                      color={r.active ? colors.onPrimary : colors.textMuted}
                    />
                  </View>

                  <View style={styles.rowBody}>
                    <View style={styles.titleLine}>
                      <Text style={[styles.rowTitle, !r.active && styles.textPaused]} numberOfLines={1}>
                        {r.title}
                      </Text>
                      {!r.active && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{t('paused')}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.metaLine}>
                      <Feather name="clock" size={12} color={colors.textMuted} />
                      <Text style={styles.metaText}>{timeText(r.start, r.duration)}</Text>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.metaText} numberOfLines={1}>
                        {daysText(r.days)}
                      </Text>
                    </View>
                  </View>

                  <Switch
                    value={r.active}
                    onValueChange={(v) => toggleActive(r.id, v)}
                    trackColor={{ false: colors.surfaceAlt, true: colors.primaryStrong }}
                    thumbColor={colors.onPrimary}
                    ios_backgroundColor={colors.surfaceAlt}
                    accessibilityLabel={r.title}
                  />
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="sync" size={32} color={colors.primaryStrong} />
            </View>
            <Text style={styles.emptyTitle}>{t('noRoutines')}</Text>
            <Text style={styles.emptyText}>{t('noRoutinesHint')}</Text>
          </View>
        )}

        {suggestions.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.section}>{t('suggestions')}</Text>
            </View>
            <View style={styles.group}>
              {suggestions.map((tpl, i) => {
                const title = t(TEMPLATE_TITLES[tpl.key]);
                return (
                  <Pressable
                    key={tpl.key}
                    onPress={() =>
                      openCreate({ title, icon: tpl.icon, start: tpl.start, duration: tpl.duration, days: tpl.days })
                    }
                    style={({ pressed }) => [styles.row, i > 0 && styles.rowDivider, pressed && styles.rowPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('addRoutine')}: ${title}`}
                  >
                    <View style={styles.suggestionIcon}>
                      <MaterialCommunityIcons name={tpl.icon} size={20} color={colors.primaryStrong} />
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle}>{title}</Text>
                      <Text style={styles.metaText}>
                        {timeText(tpl.start, tpl.duration)} · {daysText(tpl.days)}
                      </Text>
                    </View>
                    <Feather name="plus-circle" size={22} color={colors.primaryStrong} />
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <EventModal
        visible={modalVisible}
        kind="routine"
        editing={editing}
        initial={initial}
        checkConflict={(span) =>
          routineConflict(span, span.days, routines, events, toDateKey(new Date()), editing?.id)
        }
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 4,
    },
    title: { color: colors.text, fontSize: 26, fontWeight: '800', flex: 1 },
    roundBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryStrong,
    },
    pressed: { opacity: 0.7 },
    content: { paddingHorizontal: 16, paddingBottom: 32 },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 20,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    section: { color: colors.textMuted, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
    sectionMeta: { color: colors.textDim, fontSize: 12 },
    group: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 64,
    },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    rowPressed: { backgroundColor: colors.surfaceAlt },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBoxPaused: { backgroundColor: colors.surfaceAlt },
    rowBody: { flex: 1, gap: 4 },
    titleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowTitle: { color: colors.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },
    textPaused: { color: colors.textMuted },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: colors.surfaceAlt,
    },
    badgeText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
    metaLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { color: colors.textMuted, fontSize: 13, flexShrink: 1, fontVariant: ['tabular-nums'] },
    metaDot: { color: colors.textDim, fontSize: 10 },
    suggestionIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    empty: { alignItems: 'center', gap: 8, paddingTop: 48, paddingBottom: 16, paddingHorizontal: 24 },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      marginBottom: 4,
    },
    emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  });

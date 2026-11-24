import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../theme';
import { useEvents } from '../events';
import { formatDuration, weekdayShort, type StringKey } from '../i18n';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';
import type { Routine } from '../types';
import { EventModal, type EventDraft } from '../components/EventModal';
import { WEEK_ORDER, formatHoursShort } from '../utils/stats';
import {
  EVERY_DAY,
  ROUTINE_TEMPLATES,
  sameDays,
  WEEKDAYS,
  WEEKENDS,
  weeklyMinutes,
  type RoutineTemplate,
} from '../utils/routines';
import { formatTime, toDateKey } from '../utils/time';
import { routineConflict } from '../utils/conflicts';

const TEMPLATE_TITLES: Record<RoutineTemplate['key'], StringKey> = {
  morning: 'routineMorning',
  workout: 'routineWorkout',
  focus: 'routineFocus',
  lunch: 'routineLunch',
  bedtime: 'routineBedtime',
};

export function RoutinesScreen() {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabRoutines')}</Text>
        <Pressable
          onPress={() => openCreate()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('addRoutine')}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Feather name="plus" size={34} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {routines.length > 0 ? (
          <>
            <Text style={styles.summary}>
              {activeCount} {t('activeRoutines')} · {formatHoursShort(weeklyMinutes(routines))} {t('perWeek')}
            </Text>

            {sorted.map((r) => {
              const preset = daysLabel(r.days);
              const end = r.start + r.duration;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => openEdit(r)}
                  style={({ pressed }) => [styles.card, !r.active && styles.cardPaused, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.title}, ${formatTime(r.start)}`}
                >
                  <View style={[styles.iconBox, !r.active && styles.iconBoxPaused]}>
                    <MaterialCommunityIcons
                      name={r.icon}
                      size={24}
                      color={r.active ? colors.onPrimary : colors.textMuted}
                    />
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {r.duration > 0 ? `${formatTime(r.start)}–${formatTime(end)}` : formatTime(r.start)}
                      {r.duration > 0 ? ` · ${formatDuration(language, r.duration)}` : ''}
                      {!r.active ? ` · ${t('paused')}` : ''}
                    </Text>
                    <View style={styles.dots}>
                      {WEEK_ORDER.map((d) => {
                        const on = r.days.includes(d);
                        return (
                          <View key={d} style={[styles.dot, on && r.active && styles.dotOn, on && !r.active && styles.dotOnPaused]}>
                            <Text style={[styles.dotText, on && r.active && styles.dotTextOn]}>
                              {weekdayShort(language, d).charAt(0)}
                            </Text>
                          </View>
                        );
                      })}
                      {preset && <Text style={styles.preset}>{preset}</Text>}
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
              );
            })}
          </>
        ) : (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="sync" size={48} color={colors.textDim} />
            <Text style={styles.emptyTitle}>{t('noRoutines')}</Text>
            <Text style={styles.emptyText}>{t('noRoutinesHint')}</Text>
          </View>
        )}

        {suggestions.length > 0 && (
          <>
            <Text style={styles.section}>{t('suggestions')}</Text>
            <View style={styles.suggestions}>
              {suggestions.map((tpl) => {
                const title = t(TEMPLATE_TITLES[tpl.key]);
                return (
                  <Pressable
                    key={tpl.key}
                    onPress={() =>
                      openCreate({ title, icon: tpl.icon, start: tpl.start, duration: tpl.duration, days: tpl.days })
                    }
                    style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('addRoutine')}: ${title}`}
                  >
                    <MaterialCommunityIcons name={tpl.icon} size={20} color={colors.primaryStrong} />
                    <View style={styles.suggestionBody}>
                      <Text style={styles.suggestionTitle}>{title}</Text>
                      <Text style={styles.suggestionMeta}>
                        {formatTime(tpl.start)} · {daysLabel(tpl.days) ?? tpl.days.length + '×'}
                      </Text>
                    </View>
                    <Feather name="plus-circle" size={20} color={colors.textMuted} />
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
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 12,
    },
    title: { color: colors.text, fontSize: 26, fontWeight: '800' },
    pressed: { opacity: 0.7 },
    content: { paddingHorizontal: 12, paddingBottom: 32, gap: 10 },
    summary: { color: colors.textMuted, fontSize: 14, paddingHorizontal: 8, marginBottom: 2 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: 12,
    },
    cardPaused: { opacity: 0.75 },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBoxPaused: { backgroundColor: colors.surfaceAlt },
    cardBody: { flex: 1, gap: 3 },
    cardTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
    cardMeta: { color: colors.textMuted, fontSize: 13 },
    dots: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    dot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotOn: { backgroundColor: colors.primary },
    dotOnPaused: { backgroundColor: colors.border },
    dotText: { color: colors.textDim, fontSize: 10, fontWeight: '700' },
    dotTextOn: { color: colors.onPrimary },
    preset: { color: colors.textDim, fontSize: 12, marginLeft: 4 },
    empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
    emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
    section: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      marginTop: 14,
      paddingHorizontal: 8,
    },
    suggestions: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    suggestion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceAlt,
    },
    suggestionBody: { flex: 1 },
    suggestionTitle: { color: colors.text, fontSize: 15 },
    suggestionMeta: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  });

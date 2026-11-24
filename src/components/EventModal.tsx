import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../theme';
import { formatDuration, weekdayShort } from '../i18n';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';
import type { IconName } from '../types';
import { ICON_CHOICES } from '../data';
import { formatTime, MINUTES_IN_DAY, WEEK_ORDER } from '../utils/time';
import { EVERY_DAY } from '../utils/routines';
import { WheelGroup, WheelPicker, type WheelItem } from './WheelPicker';
import { Popup } from './Popup';
import type { ConflictResult } from '../utils/conflicts';
import { parseDateKey } from '../utils/routines';

export interface EventDraft {
  title: string;
  icon: IconName;
  start: number;
  duration: number;
  /** Repeat weekdays; only used for routines */
  days: number[];
}

interface Props {
  visible: boolean;
  /** 'routine' adds a weekday picker and routine wording */
  kind?: 'event' | 'routine';
  /** Existing item when editing; null when creating */
  editing: ({ id: string } & Partial<EventDraft>) | null;
  /** Prefill for a new item (e.g. tapped slot time or a template) */
  initial?: Partial<EventDraft>;
  /** Show the delete button when editing (default true) */
  allowDelete?: boolean;
  /** Small info line at the top of the sheet */
  note?: string;
  onClose: () => void;
  onSave: (draft: EventDraft) => void;
  onDelete: (id: string) => void;
  /** Returns the clash for the current time choice, or null when the time is free */
  checkConflict?: (draft: { start: number; duration: number; days: number[] }) => ConflictResult | null;
}

const pad = (n: number) => String(n).padStart(2, '0');
const MINUTE_STEP = 5;
const MAX_DURATION_HOURS = 12;
const HOUR_ITEMS: WheelItem<number>[] = Array.from({ length: 24 }, (_, h) => ({ label: pad(h), value: h }));
const MINUTE_ITEMS: WheelItem<number>[] = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => ({
  label: pad(i * MINUTE_STEP),
  value: i * MINUTE_STEP,
}));

const DURATION_HOUR_ITEMS: WheelItem<number>[] = Array.from({ length: MAX_DURATION_HOURS + 1 }, (_, h) => ({
  label: String(h),
  value: h,
}));
const DURATION_MINUTE_ITEMS: WheelItem<number>[] = MINUTE_ITEMS.map((m) => ({ label: String(m.value), value: m.value }));

/** Snap to the wheel's 5-minute grid. */
const snap = (minutes: number) => Math.round(minutes / MINUTE_STEP) * MINUTE_STEP;

export function EventModal({
  visible,
  kind = 'event',
  editing,
  initial,
  allowDelete = true,
  note,
  onClose,
  onSave,
  onDelete,
  checkConflict,
}: Props) {
  const isRoutine = kind === 'routine';
  const { colors, theme, language, t } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState<IconName>(ICON_CHOICES[0]);
  const [popup, setPopup] = useState<'icon' | 'start' | 'duration' | null>(null);
  // Popup edits stay in drafts until "Done", so Cancel leaves the form untouched.
  const [draftStart, setDraftStart] = useState(9 * 60);
  const [draftDuration, setDraftDuration] = useState(60);
  const [start, setStart] = useState(9 * 60);
  const [duration, setDuration] = useState(60);
  const [days, setDays] = useState<number[]>(EVERY_DAY);

  useEffect(() => {
    if (!visible) return;
    const src = editing ?? initial ?? {};
    setTitle(src.title ?? '');
    setIcon(src.icon ?? ICON_CHOICES[0]);
    setPopup(null);
    setStart(Math.min(snap(src.start ?? 9 * 60), MINUTES_IN_DAY - MINUTE_STEP));
    setDuration(Math.min(snap(src.duration ?? 60), MAX_DURATION_HOURS * 60 + 55));
    setDays(src.days ?? EVERY_DAY);
    // Only reset when the sheet opens or its target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editing]);

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  // An item can't run past midnight; longer picks are trimmed on save.
  const effectiveDuration = Math.min(duration, MINUTES_IN_DAY - start);
  const clash = checkConflict?.({ start, duration: effectiveDuration, days }) ?? null;
  const canSave = title.trim().length > 0 && (!isRoutine || days.length > 0) && !clash;

  const range = (s: number, d: number) =>
    d > 0 ? `${formatTime(s)}–${s + d >= MINUTES_IN_DAY ? '24:00' : formatTime(s + d)}` : formatTime(s);
  const clashDate = (key: string) => {
    const d = parseDateKey(key);
    return `${weekdayShort(language, d.getDay())} ${d.getDate()}`;
  };

  const openPopup = (which: 'icon' | 'start' | 'duration') => {
    Keyboard.dismiss();
    setDraftStart(start);
    setDraftDuration(duration);
    setPopup(which);
  };
  const closePopup = () => setPopup(null);

  const durationText = (m: number) => (m > 0 ? formatDuration(language, m) : t('noDuration'));

  const sheetTitle = isRoutine
    ? t(editing ? 'editRoutine' : 'newRoutine')
    : t(editing ? 'editEvent' : 'newEvent');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.cancel}>{t('cancel')}</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{sheetTitle}</Text>
            <Pressable
              onPress={() => canSave && onSave({ title: title.trim(), icon, start, duration: effectiveDuration, days })}
              hitSlop={10}
              disabled={!canSave}
            >
              <Text style={[styles.save, !canSave && styles.disabled]}>{t('save')}</Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {note && <Text style={styles.note}>{note}</Text>}

            {/* Icon + name */}
            <View style={styles.nameRow}>
              <Pressable
                onPress={() => openPopup('icon')}
                style={({ pressed }) => [styles.iconButton, pressed && styles.rowPressed]}
                accessibilityRole="button"
                accessibilityLabel={t('chooseIcon')}
              >
                <MaterialCommunityIcons name={icon} size={24} color={colors.onPrimary} />
              </Pressable>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t(isRoutine ? 'routineName' : 'eventName')}
                placeholderTextColor={colors.textDim}
                style={styles.input}
                autoFocus={!editing}
                returnKeyType="done"
                keyboardAppearance={theme.dark ? 'dark' : 'light'}
                selectionColor={colors.primaryStrong}
              />
            </View>

            {/* Start + duration rows: each opens a popup */}
            <View style={styles.rows}>
              <Pressable
                onPress={() => openPopup('start')}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="button"
                accessibilityLabel={`${t('start')}: ${formatTime(start)}`}
              >
                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.textMuted} />
                <Text style={styles.rowLabel}>{t('start')}</Text>
                <Text style={styles.rowValue}>{formatTime(start)}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
              </Pressable>
              <View style={styles.rowDivider} />
              <Pressable
                onPress={() => openPopup('duration')}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="button"
                accessibilityLabel={`${t('duration')}: ${durationText(effectiveDuration)}`}
              >
                <MaterialCommunityIcons name="timer-sand" size={20} color={colors.textMuted} />
                <Text style={styles.rowLabel}>{t('duration')}</Text>
                <Text style={styles.rowValue} numberOfLines={1}>
                  {durationText(effectiveDuration)}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
              </Pressable>
            </View>

            {clash && (
              <View style={styles.clash} accessibilityLiveRegion="polite">
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.danger} />
                <Text style={styles.clashText}>
                  {t('conflictWith')} <Text style={styles.clashTitle}>{clash.conflict.title}</Text>
                  {' · '}
                  {range(clash.conflict.start, clash.conflict.duration)}
                  {clash.conflict.date ? ` · ${clashDate(clash.conflict.date)}` : ''}
                </Text>
                {clash.suggestion !== null && (
                  <Pressable
                    onPress={() => setStart(clash.suggestion!)}
                    style={styles.moveBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.moveText}>
                      {t('moveTo').replace('{time}', formatTime(clash.suggestion))}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Repeat days (routines only) */}
            {isRoutine && (
              <View style={styles.dayRow}>
                {WEEK_ORDER.map((d) => {
                  const on = days.includes(d);
                  return (
                    <Pressable
                      key={d}
                      onPress={() => toggleDay(d)}
                      style={[styles.dayChip, on && styles.dayChipOn]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                    >
                      <Text style={[styles.dayChipText, on && styles.dayChipTextOn]}>
                        {weekdayShort(language, d)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {editing && allowDelete && (
              <Pressable onPress={() => onDelete(editing.id)} hitSlop={8} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>{t(isRoutine ? 'deleteRoutine' : 'deleteEvent')}</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>

        <Popup visible={popup === 'icon'} title={t('chooseIcon')} onClose={closePopup}>
          <View style={styles.iconGrid}>
            {ICON_CHOICES.map((name) => {
              const active = name === icon;
              return (
                <Pressable
                  key={name}
                  onPress={() => {
                    setIcon(name);
                    closePopup();
                  }}
                  style={[styles.iconCell, active && styles.iconCellActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={name}
                >
                  <MaterialCommunityIcons name={name} size={26} color={active ? colors.onPrimary : colors.text} />
                </Pressable>
              );
            })}
          </View>
        </Popup>

        <Popup
          visible={popup === 'start'}
          title={t('start')}
          onClose={closePopup}
          onDone={() => {
            setStart(draftStart);
            closePopup();
          }}
        >
          <WheelGroup background={colors.surface}>
            <WheelPicker
              items={HOUR_ITEMS}
              value={Math.floor(draftStart / 60)}
              onChange={(h) => setDraftStart((s) => h * 60 + (s % 60))}
              width={84}
              loop
              accessibilityLabel={`${t('start')}, ${t('hours')}`}
            />
            <WheelPicker
              items={MINUTE_ITEMS}
              value={draftStart % 60}
              onChange={(m) => setDraftStart((s) => Math.floor(s / 60) * 60 + m)}
              width={84}
              loop
              accessibilityLabel={`${t('start')}, ${t('minutes')}`}
            />
          </WheelGroup>
        </Popup>

        <Popup
          visible={popup === 'duration'}
          title={t('duration')}
          onClose={closePopup}
          onDone={() => {
            setDuration(draftDuration);
            closePopup();
          }}
        >
          <WheelGroup background={colors.surface}>
            <WheelPicker
              items={DURATION_HOUR_ITEMS}
              value={Math.floor(draftDuration / 60)}
              onChange={(h) => setDraftDuration((d) => h * 60 + (d % 60))}
              width={124}
              unit={t('hours')}
              accessibilityLabel={`${t('duration')}, ${t('hours')}`}
            />
            <WheelPicker
              items={DURATION_MINUTE_ITEMS}
              value={draftDuration % 60}
              onChange={(m) => setDraftDuration((d) => Math.floor(d / 60) * 60 + m)}
              width={124}
              loop
              unit={t('minutes')}
              accessibilityLabel={`${t('duration')}, ${t('minutes')}`}
            />
          </WheelGroup>
        </Popup>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginTop: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 6,
    },
    headerTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
    cancel: { color: colors.textMuted, fontSize: 16 },
    save: { color: colors.primaryStrong, fontSize: 16, fontWeight: '700' },
    disabled: { opacity: 0.35 },
    content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, gap: 16 },
    note: { color: colors.textMuted, fontSize: 13 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: radius.lg,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 18,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
    iconCell: {
      width: 56,
      height: 56,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconCellActive: { backgroundColor: colors.primary },
    rows: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, overflow: 'hidden' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      minHeight: 54,
    },
    rowPressed: { opacity: 0.6 },
    rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 46 },
    rowLabel: { color: colors.text, fontSize: 16 },
    rowValue: { color: colors.text, fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'right' },
    clash: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      padding: 12,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    clashText: { color: colors.text, fontSize: 14, flex: 1, minWidth: 160 },
    clashTitle: { fontWeight: '700' },
    moveBtn: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.primaryStrong,
    },
    moveText: { color: colors.onPrimary, fontSize: 13, fontWeight: '700' },
    dayRow: { flexDirection: 'row', gap: 6 },
    dayChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceAlt,
    },
    dayChipOn: { backgroundColor: colors.primary },
    dayChipText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
    dayChipTextOn: { color: colors.onPrimary },
    deleteBtn: { alignSelf: 'center', paddingVertical: 8 },
    deleteText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
  });

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, LayoutAnimation, StyleSheet, View } from 'react-native';
import { useEvents } from '../events';
import { Header } from '../components/Header';
import { WeekStrip } from '../components/WeekStrip';
import { EventCard } from '../components/EventCard';
import { AddSlot } from '../components/AddSlot';
import { EventModal, type EventDraft } from '../components/EventModal';
import { SwipeToDelete } from '../components/SwipeToDelete';
import { UndoToast } from '../components/UndoToast';
import { formatLongDate, weekdayName } from '../i18n';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';
import type { BlockEvent, Routine, TimelineItem } from '../types';
import { routinesOn } from '../utils/routines';
import { eventConflict, routineConflict } from '../utils/conflicts';
import {
  addDays,
  buildTimeline,
  initialScrollIndex,
  isSameDay,
  suggestStart,
  toDateKey,
} from '../utils/time';

export function TimelineScreen() {
  const { colors, language, t } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const today = useMemo(() => new Date(), []);

  const [selected, setSelected] = useState<Date>(today);
  const { events, setEvents, routines, setRoutines, loaded } = useEvents();

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<BlockEvent | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [initialStart, setInitialStart] = useState(9 * 60);

  // Last swipe-deletion, kept so it can be undone from the toast.
  type Removed = { kind: 'event'; event: BlockEvent } | { kind: 'skip'; routineId: string; date: string };
  const [removed, setRemoved] = useState<Removed | null>(null);
  const [removedToken, setRemovedToken] = useState(0);

  const selectedKey = toDateKey(selected);
  const isToday = isSameDay(selected, today);
  const dayEvents = useMemo(
    () => [...events.filter((e) => e.date === selectedKey), ...routinesOn(routines, selectedKey)],
    [events, routines, selectedKey],
  );
  const timeline = useMemo(() => buildTimeline(dayEvents), [dayEvents]);

  // The timeline covers the full day, so jump to the relevant hour when a day
  // opens (current time for today, first event otherwise). Editing events
  // does not re-scroll — only switching days or finishing the initial load.
  const listRef = useRef<FlatList<TimelineItem>>(null);
  const timelineRef = useRef(timeline);
  timelineRef.current = timeline;
  useEffect(() => {
    if (!loaded) return;
    const index = initialScrollIndex(timelineRef.current, isToday, new Date());
    const id = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
    }, 0);
    return () => clearTimeout(id);
  }, [loaded, selectedKey, isToday]);

  const title = isToday
    ? t('today')
    : isSameDay(selected, addDays(today, 1))
      ? t('tomorrow')
      : isSameDay(selected, addDays(today, -1))
        ? t('yesterday')
        : weekdayName(language, selected.getDay());

  const openCreate = (start?: number) => {
    setEditing(null);
    setInitialStart(start ?? suggestStart(dayEvents, new Date(), isToday));
    setModalVisible(true);
  };

  const openEdit = (event: BlockEvent) => {
    if (event.routineId) {
      // Routine occurrences are edited as the routine itself.
      setEditingRoutine(routines.find((r) => r.id === event.routineId) ?? null);
      return;
    }
    setEditing(event);
    setModalVisible(true);
  };

  const handleRoutineSave = (draft: EventDraft) => {
    if (editingRoutine) {
      setRoutines((prev) => prev.map((r) => (r.id === editingRoutine.id ? { ...r, ...draft } : r)));
    }
    setEditingRoutine(null);
  };

  const handleSave = ({ days: _days, ...draft }: EventDraft) => {
    if (editing) {
      setEvents((prev) => prev.map((e) => (e.id === editing.id ? { ...e, ...draft } : e)));
    } else {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setEvents((prev) => [...prev, { id, date: selectedKey, ...draft }]);
    }
    setModalVisible(false);
  };

  const animateNextLayout = () =>
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));

  /** Swipe-to-delete: removes an event, or skips a routine on this one day. */
  const swipeDelete = (event: BlockEvent) => {
    animateNextLayout();
    if (event.routineId) {
      const routineId = event.routineId;
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === routineId ? { ...r, skipped: [...(r.skipped ?? []), event.date] } : r,
        ),
      );
      setRemoved({ kind: 'skip', routineId, date: event.date });
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      setRemoved({ kind: 'event', event });
    }
    setRemovedToken((n) => n + 1);
  };

  const undoRemove = () => {
    if (!removed) return;
    animateNextLayout();
    if (removed.kind === 'event') {
      const restored = removed.event;
      setEvents((prev) => (prev.some((e) => e.id === restored.id) ? prev : [...prev, restored]));
    } else {
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === removed.routineId
            ? { ...r, skipped: (r.skipped ?? []).filter((d) => d !== removed.date) }
            : r,
        ),
      );
    }
    setRemoved(null);
  };

  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Header
        title={title}
        subtitle={formatLongDate(language, selected)}
        onAdd={() => openCreate()}
        onToday={isToday ? undefined : () => setSelected(today)}
      />
      <WeekStrip today={today} selected={selected} onSelect={setSelected} />

      {!loaded ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : (
        <FlatList
          ref={listRef}
          data={timeline}
          initialNumToRender={40}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) =>
            item.kind === 'event' ? (
              <SwipeToDelete
                onDelete={() => swipeDelete(item.event)}
                label={t(item.event.routineId ? 'skip' : 'delete')}
                icon={item.event.routineId ? 'debug-step-over' : 'trash-can-outline'}
              >
                <EventCard event={item.event} onPress={() => openEdit(item.event)} />
              </SwipeToDelete>
            ) : (
              <AddSlot start={item.start} onPress={() => openCreate(item.start)} />
            )
          }
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
            setTimeout(() => listRef.current?.scrollToIndex({ index, animated: false }), 100);
          }}
        />
      )}

      <EventModal
        visible={modalVisible}
        editing={editing}
        initial={{ start: initialStart }}
        checkConflict={(span) => eventConflict(span, selectedKey, events, routines, editing?.id)}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <EventModal
        visible={editingRoutine !== null}
        kind="routine"
        editing={editingRoutine}
        allowDelete={false}
        note={t('routineNote')}
        checkConflict={(span) =>
          routineConflict(span, span.days, routines, events, toDateKey(new Date()), editingRoutine?.id)
        }
        onClose={() => setEditingRoutine(null)}
        onSave={handleRoutineSave}
        onDelete={() => {}}
      />

      <UndoToast
        message={
          removed ? t(removed.kind === 'event' ? 'eventDeleted' : 'routineSkipped') : null
        }
        token={removedToken}
        onUndo={undoRemove}
        onHide={() => setRemoved(null)}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { paddingHorizontal: 8, paddingTop: 8, paddingBottom: 24 },
    separator: { height: 10 },
    loading: { marginTop: 40 },
  });

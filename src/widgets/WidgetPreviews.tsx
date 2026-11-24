import { StyleSheet, Text, View } from 'react-native';
import {
  countdown,
  dayLabel,
  nextItem,
  progressOf,
  todayItems,
  type WidgetSnapshot,
} from './snapshot';

/**
 * In-app look-alikes of the home-screen widgets (same data helpers as the
 * Android widgets and the same layout as the SwiftUI ones), used on the Home
 * screen and in onboarding.
 */

export const SMALL = 150;

function Frame({ s, width, height, children }: { s: WidgetSnapshot; width: number; height: number; children: any }) {
  return <View style={[styles.frame, { width, height, backgroundColor: s.theme.surface }]}>{children}</View>;
}

function Caption({ s, text }: { s: WidgetSnapshot; text: string }) {
  return <Text style={[styles.caption, { color: s.theme.textMuted }]}>{text.toUpperCase()}</Text>;
}

export function NextPreview({ s, now, size = SMALL }: { s: WidgetSnapshot; now: Date; size?: number }) {
  const next = nextItem(s, now);
  return (
    <Frame s={s} width={size} height={size}>
      <Caption s={s} text={s.strings.next} />
      {next ? (
        <View style={styles.fill}>
          <Text style={[styles.title, { color: s.theme.text }]} numberOfLines={2}>
            {next.item.title}
          </Text>
          <View>
            <Text style={[styles.bigTime, { color: s.theme.accent }]}>{next.item.time}</Text>
            <Text style={[styles.muted, { color: s.theme.textMuted }]} numberOfLines={1}>
              {next.ongoing ? s.strings.now : countdown(s, now, next.item.start)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.fill, styles.center]}>
          <Text style={[styles.muted, { color: s.theme.textMuted }]}>{s.strings.nothingNext}</Text>
        </View>
      )}
    </Frame>
  );
}

export function TodayPreview({ s, now, width, height = SMALL }: { s: WidgetSnapshot; now: Date; width: number; height?: number }) {
  const today = todayItems(s, now);
  const remaining = today.filter((i) => Math.max(i.end, i.start + 1) > now.getTime());
  const shown = remaining.slice(0, 4);
  return (
    <Frame s={s} width={width} height={height}>
      <View style={styles.row}>
        <Text style={[styles.header, { color: s.theme.text }]}>{s.strings.today}</Text>
        <Text style={[styles.muted, { color: s.theme.textMuted }]}>{dayLabel(s, now)}</Text>
      </View>
      {shown.length === 0 ? (
        <View style={[styles.fill, styles.center]}>
          <Text style={[styles.muted, { color: s.theme.textMuted }]}>
            {today.length > 0 ? s.strings.allDone : s.strings.noEvents}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {shown.map((i) => (
            <View key={`${i.start}-${i.title}`} style={styles.listRow}>
              <View style={[styles.bar, { backgroundColor: s.theme.primary }]} />
              <Text style={[styles.listTime, { color: s.theme.accent }]}>{i.time}</Text>
              <Text style={[styles.listTitle, { color: s.theme.text }]} numberOfLines={1}>
                {i.title}
              </Text>
            </View>
          ))}
          {remaining.length > shown.length && (
            <Text style={[styles.muted, { color: s.theme.textMuted }]}>
              +{remaining.length - shown.length} {s.strings.more}
            </Text>
          )}
        </View>
      )}
    </Frame>
  );
}

export function ProgressPreview({ s, now, size = SMALL }: { s: WidgetSnapshot; now: Date; size?: number }) {
  const { done, total } = progressOf(s, now);
  return (
    <Frame s={s} width={size} height={size}>
      <Caption s={s} text={s.strings.progress} />
      {total === 0 ? (
        <View style={[styles.fill, styles.center]}>
          <Text style={[styles.muted, { color: s.theme.textMuted }]}>{s.strings.noEvents}</Text>
        </View>
      ) : (
        <View style={[styles.fill, styles.bottom]}>
          <Text style={[styles.bigCount, { color: s.theme.text }]}>
            {done}/{total}
          </Text>
          <Text style={[styles.muted, { color: s.theme.textMuted, marginBottom: 8 }]}>{s.strings.done}</Text>
          <View style={[styles.track, { backgroundColor: s.dark ? '#2C2C30' : '#E4E4EA' }]}>
            <View
              style={[
                styles.trackFill,
                { width: `${(done / total) * 100}%`, backgroundColor: s.theme.primary },
              ]}
            />
          </View>
        </View>
      )}
    </Frame>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 22,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fill: { flex: 1, justifyContent: 'space-between', marginTop: 6 },
  center: { justifyContent: 'center' },
  bottom: { justifyContent: 'flex-end' },
  caption: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  title: { fontSize: 16, fontWeight: '700' },
  bigTime: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  bigCount: { fontSize: 34, fontWeight: '800', fontVariant: ['tabular-nums'] },
  muted: { fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { fontSize: 15, fontWeight: '800' },
  list: { marginTop: 8, gap: 5 },
  listRow: { flexDirection: 'row', alignItems: 'center' },
  bar: { width: 4, height: 16, borderRadius: 2, marginRight: 8 },
  listTime: { fontSize: 13, fontWeight: '700', width: 48, fontVariant: ['tabular-nums'] },
  listTitle: { fontSize: 13, flex: 1 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: 4 },
});

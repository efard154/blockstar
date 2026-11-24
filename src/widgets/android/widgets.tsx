import { FlexWidget, TextWidget, type ColorProp } from 'react-native-android-widget';
import {
  countdown,
  dayLabel,
  nextItem,
  progressOf,
  todayItems,
  type WidgetSnapshot,
} from '../snapshot';

const c = (hex: string) => hex as ColorProp;

function Shell({ s, children, label }: { s: WidgetSnapshot; children: any; label: string }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={label}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: c(s.theme.surface),
        borderRadius: 22,
        padding: 14,
        flexDirection: 'column',
      }}
    >
      {children}
    </FlexWidget>
  );
}

function Caption({ s, text }: { s: WidgetSnapshot; text: string }) {
  return (
    <TextWidget
      text={text.toUpperCase()}
      style={{ fontSize: 11, fontWeight: '700', color: c(s.theme.textMuted), letterSpacing: 0.06 }}
    />
  );
}

/** Small: what's happening now or next, with a countdown. */
export function NextWidget({ s, now }: { s: WidgetSnapshot; now: Date }) {
  const next = nextItem(s, now);
  return (
    <Shell s={s} label={s.strings.next}>
      <Caption s={s} text={s.strings.next} />
      {next ? (
        <FlexWidget style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between', marginTop: 6 }}>
          <TextWidget
            text={next.item.title}
            maxLines={2}
            truncate="END"
            style={{ fontSize: 16, fontWeight: '700', color: c(s.theme.text) }}
          />
          <FlexWidget style={{ flexDirection: 'column' }}>
            <TextWidget text={next.item.time} style={{ fontSize: 28, fontWeight: '800', color: c(s.theme.accent) }} />
            <TextWidget
              text={next.ongoing ? s.strings.now : countdown(s, now, next.item.start)}
              maxLines={1}
              style={{ fontSize: 12, color: c(s.theme.textMuted) }}
            />
          </FlexWidget>
        </FlexWidget>
      ) : (
        <FlexWidget style={{ flex: 1, justifyContent: 'center' }}>
          <TextWidget text={s.strings.nothingNext} style={{ fontSize: 14, color: c(s.theme.textMuted) }} />
        </FlexWidget>
      )}
    </Shell>
  );
}

/** Medium: the rest of today's agenda. */
export function TodayWidget({ s, now }: { s: WidgetSnapshot; now: Date }) {
  const today = todayItems(s, now);
  const remaining = today.filter((i) => Math.max(i.end, i.start + 1) > now.getTime());
  const shown = remaining.slice(0, 4);
  const extra = remaining.length - shown.length;

  return (
    <Shell s={s} label={s.strings.today}>
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}>
        <TextWidget text={s.strings.today} style={{ fontSize: 15, fontWeight: '800', color: c(s.theme.text) }} />
        <TextWidget text={dayLabel(s, now)} style={{ fontSize: 13, color: c(s.theme.textMuted) }} />
      </FlexWidget>

      {shown.length === 0 ? (
        <FlexWidget style={{ flex: 1, justifyContent: 'center' }}>
          <TextWidget
            text={today.length > 0 ? s.strings.allDone : s.strings.noEvents}
            style={{ fontSize: 14, color: c(s.theme.textMuted) }}
          />
        </FlexWidget>
      ) : (
        <FlexWidget style={{ flex: 1, flexDirection: 'column', marginTop: 8, flexGap: 5 }}>
          {shown.map((i) => (
            <FlexWidget
              key={`${i.start}-${i.title}`}
              style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}
            >
              <FlexWidget style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: c(s.theme.primary), marginRight: 8 }} />
              <TextWidget text={i.time} style={{ fontSize: 13, fontWeight: '700', color: c(s.theme.accent), width: 48 }} />
              <FlexWidget style={{ flex: 1 }}>
                <TextWidget text={i.title} maxLines={1} truncate="END" style={{ fontSize: 13, color: c(s.theme.text) }} />
              </FlexWidget>
            </FlexWidget>
          ))}
          {extra > 0 && (
            <TextWidget text={`+${extra} ${s.strings.more}`} style={{ fontSize: 12, color: c(s.theme.textMuted) }} />
          )}
        </FlexWidget>
      )}
    </Shell>
  );
}

/** Small: how much of today is done. */
export function ProgressWidget({ s, now }: { s: WidgetSnapshot; now: Date }) {
  const { done, total } = progressOf(s, now);
  return (
    <Shell s={s} label={s.strings.progress}>
      <Caption s={s} text={s.strings.progress} />
      {total === 0 ? (
        <FlexWidget style={{ flex: 1, justifyContent: 'center' }}>
          <TextWidget text={s.strings.noEvents} style={{ fontSize: 14, color: c(s.theme.textMuted) }} />
        </FlexWidget>
      ) : (
        <FlexWidget style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-end' }}>
          <TextWidget
            text={`${done}/${total}`}
            style={{ fontSize: 34, fontWeight: '800', color: c(s.theme.text) }}
          />
          <TextWidget text={s.strings.done} style={{ fontSize: 12, color: c(s.theme.textMuted), marginBottom: 8 }} />
          <FlexWidget
            style={{
              flexDirection: 'row',
              width: 'match_parent',
              height: 8,
              borderRadius: 4,
              backgroundColor: c(s.dark ? '#2C2C30' : '#E4E4EA'),
            }}
          >
            {done > 0 && (
              <FlexWidget style={{ flex: done, height: 8, borderRadius: 4, backgroundColor: c(s.theme.primary) }} />
            )}
            {total - done > 0 && <FlexWidget style={{ flex: total - done, height: 8 }} />}
          </FlexWidget>
        </FlexWidget>
      )}
    </Shell>
  );
}

/** Shown before the app has written any data (e.g. right after install). */
export function EmptyWidget() {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#161618',
        borderRadius: 22,
        padding: 14,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TextWidget text="Blockstar" style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }} />
      <TextWidget text="Open the app" style={{ fontSize: 12, color: '#8E8E93', marginTop: 4 }} />
    </FlexWidget>
  );
}

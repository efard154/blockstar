import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../theme';
import { useEvents } from '../events';
import { formatLongDate, weekdayName, type StringKey } from '../i18n';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';
import { buildSnapshot, countdown, nextItem, progressOf, todayItems } from '../widgets/snapshot';
import { WidgetGallery } from '../widgets/WidgetGallery';

function greetingKey(hour: number): StringKey {
  if (hour >= 4 && hour < 11) return 'greetingMorning';
  if (hour >= 11 && hour < 15) return 'greetingAfternoon';
  if (hour >= 15 && hour < 18) return 'greetingEvening';
  return 'greetingNight';
}

function greetingIcon(hour: number) {
  if (hour >= 4 && hour < 11) return 'weather-sunset-up' as const;
  if (hour >= 11 && hour < 15) return 'white-balance-sunny' as const;
  if (hour >= 15 && hour < 18) return 'weather-sunset-down' as const;
  return 'weather-night' as const;
}

export function HomeScreen({ onOpenTimeline }: { onOpenTimeline: () => void }) {
  const { colors, language, t, theme } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const { events, routines } = useEvents();

  // Tick every 30 s so the greeting, countdown and progress stay current.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const snapshot = useMemo(
    () => buildSnapshot(events, routines, language, colors, theme.dark, now),
    [events, routines, language, colors, theme.dark, now],
  );
  const next = nextItem(snapshot, now);
  const { done, total } = progressOf(snapshot, now);
  const later = todayItems(snapshot, now)
    .filter((i) => i.start > now.getTime() && i !== next?.item)
    .slice(0, 3);

  const hour = now.getHours();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <View style={styles.greetingRow}>
          <Text style={styles.hello}>{t(greetingKey(hour))}</Text>
          <MaterialCommunityIcons name={greetingIcon(hour)} size={28} color={colors.primaryStrong} />
        </View>
        <Text style={styles.date}>
          {weekdayName(language, now.getDay())}, {formatLongDate(language, now)}
        </Text>
      </View>

      {/* Next up */}
      <Pressable onPress={onOpenTimeline} style={({ pressed }) => [styles.hero, pressed && styles.pressed]}>
        <Text style={styles.heroCaption}>{t('widgetNext').toUpperCase()}</Text>
        {next ? (
          <>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {next.item.title}
            </Text>
            <View style={styles.heroRow}>
              <Text style={styles.heroTime}>{next.item.time}</Text>
              <Text style={styles.heroCountdown}>
                {next.ongoing ? t('widgetNow') : countdown(snapshot, now, next.item.start)}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.heroTitle}>{t('widgetNothingNext')}</Text>
        )}
      </Pressable>

      {/* Today's progress */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{t('today')}</Text>
          <Text style={styles.cardMeta}>
            {total === 0 ? t('widgetNoEvents') : `${done}/${total} ${t('widgetDone')}`}
          </Text>
        </View>
        {total > 0 && (
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${(done / total) * 100}%` }]} />
          </View>
        )}
        {later.length > 0 && (
          <View style={styles.later}>
            <Text style={styles.laterCaption}>{t('laterToday')}</Text>
            {later.map((i) => (
              <View key={`${i.start}-${i.title}`} style={styles.laterRow}>
                <Text style={styles.laterTime}>{i.time}</Text>
                <Text style={styles.laterTitle} numberOfLines={1}>
                  {i.title}
                </Text>
              </View>
            ))}
          </View>
        )}
        <Pressable onPress={onOpenTimeline} hitSlop={8} style={styles.link}>
          <Text style={styles.linkText}>{t('openTimeline')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.primaryStrong} />
        </Pressable>
      </View>

      {/* Home-screen widgets */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('homeWidgets')}</Text>
        <Text style={styles.sectionHint}>{t('homeWidgetsHint')}</Text>
      </View>
      <WidgetGallery snapshot={snapshot} now={now} />
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },
    greeting: { paddingTop: 24, paddingHorizontal: 4, paddingBottom: 4 },
    greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    hello: { color: colors.text, fontSize: 28, fontWeight: '800' },
    date: { color: colors.textMuted, fontSize: 15, marginTop: 4 },
    pressed: { opacity: 0.85 },
    hero: { backgroundColor: colors.primary, borderRadius: 20, padding: 18, gap: 6 },
    heroCaption: { color: colors.onPrimary, opacity: 0.8, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
    heroTitle: { color: colors.onPrimary, fontSize: 22, fontWeight: '700' },
    heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
    heroTime: { color: colors.onPrimary, fontSize: 32, fontWeight: '800', fontVariant: ['tabular-nums'] },
    heroCountdown: { color: colors.onPrimary, opacity: 0.85, fontSize: 14 },
    card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, gap: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
    cardMeta: { color: colors.textMuted, fontSize: 14 },
    track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
    trackFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
    later: { gap: 6 },
    laterCaption: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
    laterRow: { flexDirection: 'row', gap: 10 },
    laterTime: { color: colors.primaryStrong, fontSize: 14, fontWeight: '700', width: 48, fontVariant: ['tabular-nums'] },
    laterTitle: { color: colors.text, fontSize: 14, flex: 1 },
    link: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
    linkText: { color: colors.primaryStrong, fontSize: 14, fontWeight: '700' },
    sectionHeader: { marginTop: 10, paddingHorizontal: 4, gap: 2 },
    sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
    sectionHint: { color: colors.textMuted, fontSize: 14 },
  });

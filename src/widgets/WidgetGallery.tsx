import { Alert, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../theme';
import type { StringKey } from '../i18n';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';
import { androidWidgetsAvailable, requestPinWidget, widgetsAvailable, type WidgetKind } from './native';
import type { WidgetSnapshot } from './snapshot';
import { NextPreview, ProgressPreview, TodayPreview } from './WidgetPreviews';

const ENTRIES: { kind: WidgetKind; name: StringKey; size: StringKey; desc: StringKey }[] = [
  { kind: 'NextWidget', name: 'widgetNext', size: 'widgetSmall', desc: 'widgetNextDesc' },
  { kind: 'TodayWidget', name: 'today', size: 'widgetMedium', desc: 'widgetTodayDesc' },
  { kind: 'ProgressWidget', name: 'widgetProgress', size: 'widgetSmall', desc: 'widgetProgressDesc' },
];

/** The three widget types with live previews and an "add" action. */
export function WidgetGallery({ snapshot, now }: { snapshot: WidgetSnapshot; now: Date }) {
  const { t, colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const fullWidth = Math.min(width - 32, 420);

  const showSteps = () =>
    Alert.alert(t('howToAdd'), t(Platform.OS === 'ios' ? 'widgetStepsIos' : 'widgetStepsAndroid'));

  const add = async (kind: WidgetKind) => {
    // Android launchers can show their own "add widget" prompt; otherwise explain the steps.
    if (androidWidgetsAvailable && (await requestPinWidget(kind))) return;
    showSteps();
  };

  return (
    <View style={styles.list}>
      {!widgetsAvailable && (
        <View style={styles.note}>
          <Feather name="info" size={16} color={colors.textMuted} />
          <Text style={styles.noteText}>{t('widgetNeedsBuild')}</Text>
        </View>
      )}

      {ENTRIES.map((e) => (
        <View key={e.kind} style={styles.card}>
          <View style={styles.preview}>
            {e.kind === 'NextWidget' && <NextPreview s={snapshot} now={now} />}
            {e.kind === 'TodayWidget' && <TodayPreview s={snapshot} now={now} width={Math.min(fullWidth - 32, 330)} />}
            {e.kind === 'ProgressWidget' && <ProgressPreview s={snapshot} now={now} />}
          </View>
          <View style={styles.info}>
            <View style={styles.infoText}>
              <Text style={styles.name}>
                {t(e.name)} <Text style={styles.size}>· {t(e.size)}</Text>
              </Text>
              <Text style={styles.desc}>{t(e.desc)}</Text>
            </View>
            <Pressable
              onPress={() => (widgetsAvailable ? add(e.kind) : showSteps())}
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${t('addWidget')}: ${t(e.name)}`}
            >
              <Feather name="plus" size={16} color={colors.onPrimary} />
              <Text style={styles.addText}>{t('addWidget')}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: { gap: 12 },
    note: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceAlt,
    },
    noteText: { color: colors.textMuted, fontSize: 13, flex: 1 },
    card: { backgroundColor: colors.surfaceAlt, borderRadius: 20, padding: 16, gap: 14 },
    preview: { alignItems: 'center', paddingVertical: 6 },
    info: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    infoText: { flex: 1 },
    name: { color: colors.text, fontSize: 16, fontWeight: '700' },
    size: { color: colors.textMuted, fontWeight: '400' },
    desc: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.primaryStrong,
    },
    pressed: { opacity: 0.7 },
    addText: { color: colors.onPrimary, fontSize: 14, fontWeight: '700' },
  });

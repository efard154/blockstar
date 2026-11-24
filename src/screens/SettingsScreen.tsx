import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../theme';
import { formatDuration, LANGUAGES, themeName } from '../i18n';
import { useNotificationPermission } from '../notifications';
import { REMINDER_OPTIONS } from '../utils/reminders';
import { useSettings, useThemedStyles } from '../settings';
import { THEMES, type ThemeColors } from '../themes';

export function SettingsScreen() {
  const {
    colors,
    t,
    language,
    setLanguage,
    themeId,
    setThemeId,
    setWelcomeSeen,
    reminderMinutes,
    setReminderMinutes,
  } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const permission = useNotificationPermission();

  const chooseReminder = (minutes: number | null) => {
    setReminderMinutes(minutes);
    if (minutes !== null && permission.state === 'undetermined') permission.request();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('tabSettings')}</Text>

      <Text style={styles.section}>{t('language')}</Text>
      <View style={styles.group}>
        {LANGUAGES.map((lang, i) => {
          const active = lang.id === language;
          return (
            <Pressable
              key={lang.id}
              onPress={() => setLanguage(lang.id)}
              style={({ pressed }) => [
                styles.row,
                i > 0 && styles.rowDivider,
                pressed && styles.rowPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <Text style={styles.rowText}>{lang.label}</Text>
              {active && <Feather name="check" size={20} color={colors.primaryStrong} />}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>{t('reminders')}</Text>
      <View style={[styles.group, styles.reminderGroup]}>
        <Text style={styles.hint}>{t('reminderHint')}</Text>
        <View style={styles.chips}>
          {[null, ...REMINDER_OPTIONS].map((m) => {
            const active = m === reminderMinutes;
            return (
              <Pressable
                key={String(m)}
                onPress={() => chooseReminder(m)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {m === null ? t('reminderOff') : formatDuration(language, m)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {reminderMinutes !== null && permission.state === 'denied' && (
          <View style={styles.warning}>
            <Feather name="bell-off" size={16} color={colors.danger} />
            <Text style={styles.warningText}>{t('notificationsBlocked')}</Text>
            <Pressable onPress={() => Linking.openSettings()} hitSlop={8}>
              <Text style={styles.link}>{t('openSettings')}</Text>
            </Pressable>
          </View>
        )}
        {reminderMinutes !== null && permission.state === 'undetermined' && (
          <Pressable onPress={() => permission.request()} style={styles.allowBtn}>
            <Feather name="bell" size={16} color={colors.onPrimary} />
            <Text style={styles.allowText}>{t('allowNotifications')}</Text>
          </Pressable>
        )}
        {permission.state === 'unsupported' && (
          <Text style={styles.hint}>{t('notificationsUnsupported')}</Text>
        )}
      </View>

      <Text style={styles.section}>{t('theme')}</Text>
      <View style={styles.themeGrid}>
        {THEMES.map((theme) => {
          const active = theme.id === themeId;
          const c = theme.colors;
          return (
            <Pressable
              key={theme.id}
              onPress={() => setThemeId(theme.id)}
              style={[styles.themeCard, active && styles.themeCardActive]}
              accessibilityRole="radio"
              accessibilityLabel={themeName(language, theme.id)}
              accessibilityState={{ checked: active }}
            >
              {/* Mini preview of the timeline in this theme */}
              <View style={[styles.preview, { backgroundColor: c.background }]}>
                <View style={[styles.previewBar, { backgroundColor: c.primary }]} />
                <View
                  style={[
                    styles.previewBar,
                    { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 },
                  ]}
                />
                <View style={[styles.previewBar, { backgroundColor: c.primary }]} />
              </View>
              <View style={styles.themeFooter}>
                <Text style={styles.themeName} numberOfLines={1}>
                  {themeName(language, theme.id)}
                </Text>
                {active && <Feather name="check-circle" size={16} color={colors.primaryStrong} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>{t('other')}</Text>
      <View style={styles.group}>
        <Pressable
          onPress={() => setWelcomeSeen(false)}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.rowText}>{t('replayWelcome')}</Text>
          <Feather name="play-circle" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16, paddingBottom: 32 },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
      paddingHorizontal: 4,
      paddingTop: 24,
      paddingBottom: 12,
    },
    section: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    group: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      minHeight: 52,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    rowPressed: { backgroundColor: colors.surfaceAlt },
    rowText: { color: colors.text, fontSize: 16 },
    reminderGroup: { padding: 14, gap: 12 },
    hint: { color: colors.textMuted, fontSize: 13 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
    },
    chipActive: { backgroundColor: colors.primaryStrong },
    chipText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
    chipTextActive: { color: colors.onPrimary },
    warning: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    warningText: { color: colors.text, fontSize: 13, flex: 1 },
    link: { color: colors.primaryStrong, fontSize: 13, fontWeight: '700' },
    allowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
      borderRadius: radius.md,
      backgroundColor: colors.primaryStrong,
    },
    allowText: { color: colors.onPrimary, fontSize: 14, fontWeight: '700' },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    themeCard: {
      width: '47%',
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: 'transparent',
      padding: 8,
    },
    themeCardActive: { borderColor: colors.primaryStrong },
    preview: {
      borderRadius: radius.md,
      padding: 8,
      gap: 6,
    },
    previewBar: {
      height: 14,
      borderRadius: 3,
    },
    themeFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      paddingHorizontal: 2,
    },
    themeName: { color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  });

import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../theme';
import { formatDuration, LANGUAGES, themeName } from '../i18n';
import { useNotificationPermission } from '../notifications';
import { REMINDER_OPTIONS } from '../utils/reminders';
import { Popup } from '../components/Popup';
import { WheelGroup, WheelPicker } from '../components/WheelPicker';
import { BackButton } from '../components/BackButton';
import { MENU_POSITIONS, useSettings, useThemedStyles, type MenuPosition } from '../settings';
import type { IconName } from '../types';
import { THEMES, type ThemeColors } from '../themes';

export function SettingsScreen({ onClose }: { onClose: () => void }) {
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
    menuPosition,
    setMenuPosition,
    menuLabels,
    setMenuLabels,
  } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const permission = useNotificationPermission();

  // Reminder picker popup; edits a draft until "Done".
  const [reminderPicker, setReminderPicker] = useState(false);
  const [draftReminder, setDraftReminder] = useState<number | null>(reminderMinutes);
  const reminderLabel = (m: number | null) => (m === null ? t('reminderOff') : formatDuration(language, m));
  const reminderItems = [null, ...REMINDER_OPTIONS].map((m) => ({ label: reminderLabel(m), value: m as number | null }));
  const openReminderPicker = () => {
    setDraftReminder(reminderMinutes);
    setReminderPicker(true);
  };

  const chooseReminder = (minutes: number | null) => {
    setReminderMinutes(minutes);
    if (minutes !== null && permission.state === 'undetermined') permission.request();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <BackButton onPress={onClose} />
          <Text style={styles.title}>{t('tabSettings')}</Text>
        </View>

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
          <Pressable
            onPress={openReminderPicker}
            style={({ pressed }) => [styles.pickerRow, pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel={`${t('remindBefore')}: ${reminderLabel(reminderMinutes)}`}
          >
            <Feather name={reminderMinutes === null ? 'bell-off' : 'bell'} size={18} color={colors.textMuted} />
            <Text style={styles.rowText}>{t('remindBefore')}</Text>
            <Text style={styles.pickerValue}>{reminderLabel(reminderMinutes)}</Text>
            <Feather name="chevron-right" size={18} color={colors.textDim} />
          </Pressable>
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

        <Text style={styles.section}>{t('menuButton')}</Text>
        <View style={[styles.group, styles.reminderGroup]}>
          <Text style={styles.hint}>{t('menuButtonHint')}</Text>
          {/* A phone outline with one arrow button per edge position */}
          <View style={styles.phone} accessibilityRole="radiogroup" accessibilityLabel={t('menuButton')}>
            {(['left', 'right'] as const).map((side) => (
              <View key={side} style={styles.phoneSide}>
                {MENU_POSITIONS.filter((p) => p.startsWith(side)).map((p) => {
                  const active = p === menuPosition;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setMenuPosition(p)}
                      style={[styles.positionBtn, active && styles.positionBtnActive]}
                      accessibilityRole="radio"
                      accessibilityLabel={t(p)}
                      accessibilityState={{ checked: active }}
                    >
                      <MaterialCommunityIcons
                        name={POSITION_ICONS[p]}
                        size={22}
                        color={active ? colors.onPrimary : colors.textMuted}
                      />
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.rowText}>{t('menuLabels')}</Text>
            <Switch
              value={menuLabels}
              onValueChange={setMenuLabels}
              trackColor={{ false: colors.surfaceAlt, true: colors.primaryStrong }}
              thumbColor={colors.onPrimary}
              ios_backgroundColor={colors.surfaceAlt}
              accessibilityLabel={t('menuLabels')}
            />
          </View>
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

      <Popup
        visible={reminderPicker}
        title={t('reminders')}
        onClose={() => setReminderPicker(false)}
        onDone={() => {
          chooseReminder(draftReminder);
          setReminderPicker(false);
        }}
      >
        <WheelGroup background={colors.surface}>
          <WheelPicker
            items={reminderItems}
            value={draftReminder}
            onChange={setDraftReminder}
            width={200}
            accessibilityLabel={t('remindBefore')}
          />
        </WheelGroup>
      </Popup>
    </View>
  );
}

const POSITION_ICONS: Record<MenuPosition, IconName> = {
  'left-top': 'arrow-top-left',
  'left-middle': 'arrow-left',
  'left-bottom': 'arrow-bottom-left',
  'right-top': 'arrow-top-right',
  'right-middle': 'arrow-right',
  'right-bottom': 'arrow-bottom-right',
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16, paddingBottom: 32 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 12 },
    title: { color: colors.text, fontSize: 26, fontWeight: '800', flex: 1 },
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
    pickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 48,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.surfaceAlt,
    },
    pickerValue: { color: colors.text, fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'right' },
    hint: { color: colors.textMuted, fontSize: 13 },
    phone: {
      alignSelf: 'center',
      width: 150,
      height: 220,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 8,
      borderRadius: 26,
      borderWidth: 2,
      borderColor: colors.border,
    },
    phoneSide: { justifyContent: 'space-between' },
    positionBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    positionBtnActive: { backgroundColor: colors.primaryStrong },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
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

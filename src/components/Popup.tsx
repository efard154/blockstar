import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius } from '../theme';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';

interface Props {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Shows Cancel / Done buttons when set; otherwise tapping outside closes */
  onDone?: () => void;
}

/**
 * Centered popup card drawn as an overlay. Render it inside the screen or modal
 * it belongs to (not as a separate native Modal) so it stacks reliably.
 */
export function Popup({ visible, title, children, onClose, onDone }: Props) {
  const { t } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, friction: 8, tension: 90, useNativeDriver: true }).start();
  }, [visible, anim]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: anim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('cancel')} />
      </Animated.View>
      <Animated.View
        style={[
          styles.card,
          {
            opacity: anim,
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
          },
        ]}
        accessibilityViewIsModal
      >
        <Text style={styles.title}>{title}</Text>
        {children}
        {onDone && (
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.footerBtn} hitSlop={6}>
              <Text style={styles.cancel}>{t('cancel')}</Text>
            </Pressable>
            <Pressable onPress={onDone} style={[styles.footerBtn, styles.doneBtn]} hitSlop={6}>
              <Text style={styles.done}>{t('done')}</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      zIndex: 10,
      elevation: 10,
    },
    backdrop: { backgroundColor: 'rgba(0,0,0,0.55)' },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      gap: 16,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 12,
    },
    title: { color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
    footer: { flexDirection: 'row', gap: 10 },
    footerBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceAlt,
    },
    doneBtn: { backgroundColor: colors.primaryStrong },
    cancel: { color: colors.text, fontSize: 15, fontWeight: '600' },
    done: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
  });

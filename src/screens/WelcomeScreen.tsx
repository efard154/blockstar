import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../theme';
import { LANGUAGES } from '../i18n';
import { useEvents } from '../events';
import { buildSnapshot } from '../widgets/snapshot';
import { NextPreview, ProgressPreview, TodayPreview } from '../widgets/WidgetPreviews';
import { useSettings, useThemedStyles } from '../settings';
import type { ThemeColors } from '../themes';

const APP_NAME = 'Blockstar';
const PARTICLE_COUNT = 14;

/** Logo blocks: they drop in one after another, like events filling a timeline. */
const BLOCKS = [
  { width: 0.78, filled: true },
  { width: 0.58, filled: false },
  { width: 0.92, filled: true },
];

/** Deterministic pseudo-random so particles keep their place across re-renders. */
function seeded(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

interface Props {
  onDone: () => void;
}

export function WelcomeScreen({ onDone }: Props) {
  const { colors, t, language, setLanguage } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const { width, height } = useWindowDimensions();
  const [leaving, setLeaving] = useState(false);
  const [step, setStep] = useState(0);
  const stepAnim = useRef(new Animated.Value(1)).current;
  const { events, routines } = useEvents();
  const { theme } = useSettings();

  const blockAnims = useRef(BLOCKS.map(() => new Animated.Value(0))).current;
  const starPop = useRef(new Animated.Value(0)).current;
  const starSpin = useRef(new Animated.Value(0)).current;
  const starPulse = useRef(new Animated.Value(0)).current;
  const letterAnims = useRef(APP_NAME.split('').map(() => new Animated.Value(0))).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const button = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0)),
  ).current;

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        left: seeded(i, 1) * (width - 20),
        top: seeded(i, 2) * (height - 60),
        size: 8 + Math.round(seeded(i, 3) * 10),
        duration: 1800 + Math.round(seeded(i, 4) * 2200),
        delay: Math.round(seeded(i, 5) * 1500),
        accent: seeded(i, 6) > 0.6,
      })),
    [width, height],
  );

  useEffect(() => {
    let running: Animated.CompositeAnimation[] = [];
    let cancelled = false;

    const startLoops = () => {
      if (cancelled) return;
      const loops = [
        Animated.loop(
          Animated.timing(starSpin, {
            toValue: 1,
            duration: 9000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(starPulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(starPulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ]),
        ),
        Animated.loop(
          Animated.timing(glow, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ),
      ];
      loops.forEach((l) => l.start());
      running.push(...loops);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;

        if (reduceMotion) {
          // Respect the system setting: show the final state without motion.
          [...blockAnims, starPop, ...letterAnims, tagline, button, ...particleAnims].forEach((v) =>
            v.setValue(1),
          );
          return;
        }

        // Twinkling background stars run the whole time.
        const twinkles = particleAnims.map((v, i) =>
          Animated.loop(
            Animated.sequence([
              Animated.delay(particles[i].delay),
              Animated.timing(v, { toValue: 1, duration: particles[i].duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(v, { toValue: 0, duration: particles[i].duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ]),
          ),
        );
        twinkles.forEach((l) => l.start());
        running.push(...twinkles);

        // Intro choreography: blocks drop → star bursts in → title types up → tagline & button.
        const intro = Animated.sequence([
          Animated.delay(250),
          Animated.stagger(
            140,
            blockAnims.map((v) =>
              Animated.spring(v, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
            ),
          ),
          Animated.spring(starPop, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
          Animated.stagger(
            45,
            letterAnims.map((v) =>
              Animated.timing(v, { toValue: 1, duration: 380, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
            ),
          ),
          Animated.parallel([
            Animated.timing(tagline, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.sequence([
              Animated.delay(200),
              Animated.spring(button, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
            ]),
          ]),
        ]);
        running.push(intro);
        intro.start(({ finished }) => finished && startLoops());
      });

    return () => {
      cancelled = true;
      running.forEach((a) => a.stop());
      running = [];
    };
    // Animated values are stable refs; run the intro once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => {
    if (leaving) return;
    setLeaving(true);
    Animated.timing(exit, {
      toValue: 1,
      duration: 420,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onDone());
  };

  const goToWidgets = () => {
    setStep(1);
    stepAnim.setValue(0);
    Animated.spring(stepAnim, { toValue: 1, friction: 9, tension: 60, useNativeDriver: true }).start();
  };

  const previewNow = new Date();
  const previewSnapshot = buildSnapshot(events, routines, language, colors, theme.dark, previewNow);
  const smallSize = Math.min(150, (width - 48 - 12) / 2);
  const stepStyle = {
    opacity: stepAnim,
    transform: [{ translateX: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
  };

  const logoWidth = Math.min(200, width * 0.5);
  const spin = starSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [{ scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
        },
      ]}
    >
      {/* Twinkling background stars */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            styles.particle,
            {
              left: p.left,
              top: p.top,
              opacity: particleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.7] }),
              transform: [
                { scale: particleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] }) },
                { translateY: particleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [6, -6] }) },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="star-four-points"
            size={p.size}
            color={p.accent ? colors.primaryStrong : colors.textDim}
          />
        </Animated.View>
      ))}

      {/* Language switch */}
      <View style={styles.langSwitch}>
        {LANGUAGES.map((lang) => {
          const active = lang.id === language;
          return (
            <Pressable
              key={lang.id}
              onPress={() => setLanguage(lang.id)}
              style={[styles.langPill, active && styles.langPillActive]}
              accessibilityRole="radio"
              accessibilityLabel={lang.label}
              accessibilityState={{ checked: active }}
            >
              <Text style={[styles.langText, active && styles.langTextActive]}>
                {lang.id.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {step === 0 && (
        <Pressable onPress={handleStart} hitSlop={10} style={styles.skip} accessibilityRole="button">
          <Text style={styles.skipText}>{t('skip')}</Text>
        </Pressable>
      )}

      {step === 1 ? (
        <Animated.View style={[styles.center, styles.widgetStep, stepStyle]}>
          <Text style={styles.stepTitle}>{t('onboardWidgetsTitle')}</Text>
          <Text style={styles.stepText}>{t('onboardWidgetsText')}</Text>
          <View style={styles.previewRow}>
            <NextPreview s={previewSnapshot} now={previewNow} size={smallSize} />
            <ProgressPreview s={previewSnapshot} now={previewNow} size={smallSize} />
          </View>
          <TodayPreview s={previewSnapshot} now={previewNow} width={smallSize * 2 + 12} />
        </Animated.View>
      ) : (
      <View style={styles.center}>
        {/* Logo: stacked blocks + star */}
        <View style={[styles.logo, { width: logoWidth }]}>
          {BLOCKS.map((b, i) => (
            <Animated.View
              key={i}
              style={[
                styles.block,
                b.filled ? styles.blockFilled : styles.blockOutline,
                {
                  width: logoWidth * b.width,
                  opacity: blockAnims[i],
                  transform: [
                    { translateY: blockAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-120, 0] }) },
                    { scaleX: blockAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
                  ],
                },
              ]}
            />
          ))}

          <Animated.View
            style={[
              styles.star,
              {
                opacity: starPop,
                transform: [
                  { scale: starPop.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
                  { rotate: starPop.interpolate({ inputRange: [0, 1], outputRange: ['-200deg', '0deg'] }) },
                ],
              },
            ]}
          >
            <Animated.View
              style={{
                transform: [
                  { rotate: spin },
                  { scale: starPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) },
                ],
              }}
            >
              <MaterialCommunityIcons name="star-four-points" size={52} color={colors.primaryStrong} />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Title: letters rise in one by one */}
        <View style={styles.titleRow} accessible accessibilityRole="header" accessibilityLabel={APP_NAME}>
          {APP_NAME.split('').map((ch, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.title,
                {
                  opacity: letterAnims[i],
                  transform: [
                    { translateY: letterAnims[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                  ],
                },
              ]}
            >
              {ch}
            </Animated.Text>
          ))}
        </View>

        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: tagline,
              transform: [{ translateY: tagline.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            },
          ]}
        >
          {t('welcomeTagline')}
        </Animated.Text>
      </View>
      )}

      {/* Call to action with a pulsing glow ring */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: button,
            transform: [{ translateY: button.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
          },
        ]}
      >
        <View style={styles.dots}>
          {[0, 1].map((i) => (
            <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.buttonWrap}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              {
                opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                transform: [
                  { scaleX: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
                  { scaleY: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) },
                ],
              },
            ]}
          />
          <Pressable
            onPress={step === 0 ? goToWidgets : handleStart}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{t(step === 0 ? 'nextStep' : 'getStarted')}</Text>
            <MaterialCommunityIcons name="arrow-right" size={22} color={colors.onPrimary} />
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    particle: { position: 'absolute' },
    langSwitch: {
      flexDirection: 'row',
      alignSelf: 'flex-end',
      margin: 16,
      padding: 3,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
    },
    langPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
    langPillActive: { backgroundColor: colors.primaryStrong },
    langText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
    langTextActive: { color: colors.onPrimary },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    logo: { gap: 10, marginBottom: 36 },
    block: { height: 30, borderRadius: radius.md },
    blockFilled: { backgroundColor: colors.primary },
    blockOutline: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    star: { position: 'absolute', right: -30, top: -38 },
    titleRow: { flexDirection: 'row' },
    title: {
      color: colors.text,
      fontSize: 40,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    tagline: {
      color: colors.textMuted,
      fontSize: 16,
      marginTop: 10,
      textAlign: 'center',
    },
    footer: { paddingHorizontal: 24, paddingBottom: 32 },
    skip: { position: 'absolute', top: 22, left: 20, zIndex: 2 },
    skipText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
    widgetStep: { gap: 16 },
    stepTitle: { color: colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
    stepText: { color: colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 21, marginBottom: 8 },
    previewRow: { flexDirection: 'row', gap: 12 },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { width: 20, backgroundColor: colors.primaryStrong },
    buttonWrap: { justifyContent: 'center' },
    glow: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      borderRadius: radius.lg,
      backgroundColor: colors.primaryStrong,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 56,
      borderRadius: radius.lg,
      backgroundColor: colors.primaryStrong,
    },
    buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    buttonText: { color: colors.onPrimary, fontSize: 18, fontWeight: '700' },
  });

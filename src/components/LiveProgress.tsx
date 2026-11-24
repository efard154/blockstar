import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BAR_HEIGHT = 4;
const SHINE_WIDTH = 48;

interface Props {
  /** 0–1 share of the event that has elapsed */
  progress: number;
  color: string;
}

/**
 * Thin live progress bar for an event that is happening now. The fill glides
 * to each new value and a soft shine sweeps across it on a loop. Everything
 * runs on the native driver (transforms only).
 */
export function LiveProgress({ progress, color }: Props) {
  const [width, setWidth] = useState(0);
  const [fill] = useState(() => new Animated.Value(0));
  const [shine] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
  }, []);

  // Grow smoothly to the latest value (first appearance animates from 0).
  useEffect(() => {
    Animated.timing(fill, {
      toValue: Math.min(1, Math.max(0, progress)),
      duration: reduceMotion ? 0 : 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, reduceMotion, fill]);

  useEffect(() => {
    if (reduceMotion || width === 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shine, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(700),
        Animated.timing(shine, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, width, shine]);

  return (
    <View
      style={styles.track}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      {width > 0 && (
        // The fill is full width, slid left so only the elapsed share shows.
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              transform: [{ translateX: fill.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }],
            },
          ]}
        >
          {!reduceMotion && (
            <Animated.View
              style={[
                styles.shine,
                {
                  // Sweep only across the visible (elapsed) part: from its left edge to the right end.
                  transform: [{ translateX: shinePosition(fill, shine, width) }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

/**
 * In fill coordinates the elapsed part spans [start, width], start = (1 - fill) * width.
 * position = start - SHINE + shine * (width + SHINE - start)
 */
function shinePosition(fill: Animated.Value, shine: Animated.Value, width: number) {
  const start = Animated.multiply(Animated.subtract(1, fill), width);
  const span = Animated.subtract(width + SHINE_WIDTH, start);
  return Animated.add(Animated.subtract(start, SHINE_WIDTH), Animated.multiply(shine, span));
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' },
  shine: { position: 'absolute', top: 0, bottom: 0, width: SHINE_WIDTH },
});

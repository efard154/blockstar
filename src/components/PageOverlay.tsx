import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, BackHandler, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { useSettings } from '../settings';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * A full page that slides in from the right over the main screen (and back out
 * on close). Android's back button closes it.
 */
export function PageOverlay({ visible, onClose, children }: Props) {
  const { colors } = useSettings();
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Mount as soon as it becomes visible; unmount only after the slide-out finishes.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 280 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, progress]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onCloseRef.current();
      return true;
    });
    return () => sub.remove();
  }, [visible]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.background,
          transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [width, 0] }) }],
        },
      ]}
      accessibilityViewIsModal
    >
      {children}
    </Animated.View>
  );
}

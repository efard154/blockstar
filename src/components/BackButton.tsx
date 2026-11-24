import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSettings } from '../settings';

/** Round "back" button for pages opened from the main screen. */
export function BackButton({ onPress }: { onPress: () => void }) {
  const { colors, t } = useSettings();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={t('back')}
      style={({ pressed }) => [styles.button, { backgroundColor: colors.surfaceAlt }, pressed && styles.pressed]}
    >
      <Feather name="chevron-left" size={24} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});

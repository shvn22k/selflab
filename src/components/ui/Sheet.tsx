import { type ReactNode } from 'react';
import { Modal, Pressable, View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { Text } from './Text';
import { palette, radius, spacing } from '@/theme/tokens';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <AnimatedPressable style={StyleSheet.absoluteFill} onPress={onClose} entering={FadeIn} exiting={FadeOut}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.overlay }]} />
        </AnimatedPressable>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ marginTop: 'auto' }}>
          <Animated.View
            entering={SlideInDown.springify().damping(18)}
            exiting={SlideOutDown}
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}
          >
            <View style={styles.handle} />
            {title ? (
              <Text variant="h2" style={{ marginBottom: spacing.lg }}>
                {title}
              </Text>
            ) : null}
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.bgElevated,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: palette.borderStrong,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.surfaceHigh,
    marginBottom: spacing.lg,
  },
});

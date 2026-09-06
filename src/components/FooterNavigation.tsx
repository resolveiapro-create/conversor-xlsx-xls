import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

interface Props {
  step: number;
  onBack: () => void;
  onNext: () => void;
}

export function FooterNavigation({ step, onBack, onNext }: Props): React.JSX.Element {
  return (
    <View style={styles.footer}>
      <Pressable disabled={step === 0} onPress={onBack} style={({ pressed }) => [styles.back, step === 0 && styles.disabled, pressed && styles.pressed]}>
        <Text style={styles.backText}>Voltar</Text>
      </Pressable>
      <Text style={styles.counter}>Etapa {step + 1} de 7</Text>
      <Pressable disabled={step === 6} onPress={onNext} style={({ pressed }) => [styles.next, step === 6 && styles.disabled, pressed && styles.pressed]}>
        <Text style={styles.nextText}>Avançar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', backgroundColor: colors.white, borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  back: { borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, minWidth: 88, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backText: { color: colors.text, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  counter: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  next: { backgroundColor: colors.red, borderRadius: radius.sm, minWidth: 88, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  nextText: { color: colors.white, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  disabled: { opacity: 0.32 },
  pressed: { opacity: 0.7 },
});

import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

interface Props {
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
}

export function QuantityControl({ value, onChange, compact = false }: Props): React.JSX.Element {
  return (
    <View style={[styles.wrapper, compact && styles.compact]}>
      <Pressable onPress={() => onChange(Math.max(0, value - 1))} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>−</Text>
      </Pressable>
      <TextInput
        keyboardType="number-pad"
        onChangeText={(text) => onChange(Math.max(0, Number.parseInt(text || '0', 10) || 0))}
        selectTextOnFocus
        style={styles.input}
        value={String(value)}
      />
      <Pressable onPress={() => onChange(value + 1)} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.md },
  compact: { marginBottom: 0 },
  button: { alignItems: 'center', backgroundColor: colors.navy, borderRadius: radius.sm, height: 42, justifyContent: 'center', width: 42 },
  buttonText: { color: colors.white, fontSize: 22, fontWeight: '700', lineHeight: 25 },
  input: { borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.text, fontSize: 16, fontWeight: '800', height: 42, marginHorizontal: spacing.sm, minWidth: 64, paddingHorizontal: spacing.sm, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});

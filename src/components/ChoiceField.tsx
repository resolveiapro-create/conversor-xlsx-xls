import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

interface Props<T extends string> {
  label: string;
  value: T | '';
  options: readonly T[];
  onChange: (value: T) => void;
  placeholder?: string;
}

export function ChoiceField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selecione',
}: Props<T>): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>{value || placeholder}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={styles.options}>
              {options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    option === value && styles.selectedOption,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.optionText, option === value && styles.selectedText]}>{option}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setOpen(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: spacing.xs },
  field: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  value: { color: colors.text, flex: 1, fontSize: 15 },
  placeholder: { color: colors.placeholder },
  chevron: { color: colors.muted, fontSize: 20, marginLeft: spacing.sm },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,26,46,0.58)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: { backgroundColor: colors.white, borderRadius: radius.lg, maxHeight: '75%', padding: spacing.lg, width: '100%' },
  sheetTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: spacing.md },
  options: { flexGrow: 0 },
  option: { borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  selectedOption: { backgroundColor: '#FDE8EC' },
  optionText: { color: colors.text, fontSize: 15 },
  selectedText: { color: colors.red, fontWeight: '700' },
  cancelButton: { alignItems: 'center', marginTop: spacing.sm, padding: spacing.md },
  cancelText: { color: colors.muted, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});

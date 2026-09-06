import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { STEP_TITLES } from '../constants';
import { colors, radius, spacing } from '../theme';

interface Props {
  step: number;
  onChange: (step: number) => void;
}

export function StepTabs({ step, onChange }: Props): React.JSX.Element {
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    scroll.current?.scrollTo({ x: Math.max(0, step * 118 - 40), animated: true });
  }, [step]);

  return (
    <View style={styles.container}>
      <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {STEP_TITLES.map((title, index) => (
          <Pressable
            key={title}
            onPress={() => onChange(index)}
            style={({ pressed }) => [styles.tab, index === step && styles.activeTab, pressed && styles.pressed]}
          >
            <Text style={[styles.number, index === step && styles.activeText]}>{index + 1}</Text>
            <Text numberOfLines={1} style={[styles.label, index === step && styles.activeText]}>{title}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.white, borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth },
  content: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tab: { alignItems: 'center', borderRadius: radius.pill, flexDirection: 'row', maxWidth: 175, minHeight: 38, paddingHorizontal: spacing.md },
  activeTab: { backgroundColor: colors.red },
  number: { color: colors.muted, fontSize: 12, fontWeight: '800', marginRight: spacing.xs },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', maxWidth: 135 },
  activeText: { color: colors.white },
  pressed: { opacity: 0.72 },
});

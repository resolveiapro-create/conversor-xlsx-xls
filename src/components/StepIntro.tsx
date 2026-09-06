import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme';

interface Props {
  title: string;
  description: string;
}

export function StepIntro({ title, description }: Props): React.JSX.Element {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.xs },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { QuantityControl } from '../components/QuantityControl';
import { SectionCard } from '../components/SectionCard';
import { StepIntro } from '../components/StepIntro';
import { useReport } from '../context/ReportContext';
import { colors, spacing } from '../theme';

export function MaterialsScreen(): React.JSX.Element {
  const { draft, dispatch } = useReport();
  return (
    <>
      <StepIntro title="Materiais" description="O catálogo e os códigos SAP são fixos. Informe somente a quantidade utilizada." />
      <SectionCard>
        {draft.materials.map((material, index) => (
          <View key={material.id} style={[styles.item, index === draft.materials.length - 1 && styles.lastItem]}>
            <View style={styles.description}>
              <Text style={styles.name}>{material.description}</Text>
              <Text style={styles.code}>COD SAP {material.sapCode}</Text>
            </View>
            <QuantityControl
              compact
              value={material.quantity}
              onChange={(quantity) => dispatch({ type: 'SET_MATERIAL_QUANTITY', id: material.id, quantity })}
            />
          </View>
        ))}
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  item: { borderBottomColor: colors.line, borderBottomWidth: 1, paddingBottom: spacing.lg, marginBottom: spacing.lg },
  lastItem: { borderBottomWidth: 0, marginBottom: 0 },
  description: { marginBottom: spacing.md },
  name: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  code: { color: colors.muted, fontSize: 12, marginTop: spacing.xs },
});

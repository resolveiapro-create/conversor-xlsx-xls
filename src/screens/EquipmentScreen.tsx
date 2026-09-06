import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceField } from '../components/ChoiceField';
import { FormField } from '../components/FormField';
import { PhotoInput } from '../components/PhotoInput';
import { QuantityControl } from '../components/QuantityControl';
import { SectionCard } from '../components/SectionCard';
import { StepIntro } from '../components/StepIntro';
import { SGP_PREFIX } from '../constants';
import { useReport } from '../context/ReportContext';
import { pickAndStorePhoto, removeStoredPhoto, type PhotoSource } from '../services/photoService';
import { colors, spacing } from '../theme';
import type { EquipmentItem, IdentifierType } from '../types';

const IDENTIFIER_TYPES: readonly IdentifierType[] = ['SGP', 'SN'];

export function EquipmentScreen(): React.JSX.Element {
  const { draft, dispatch } = useReport();
  const update = (id: string, patch: Partial<EquipmentItem>) => dispatch({ type: 'UPDATE_EQUIPMENT', id, patch });

  async function pick(item: EquipmentItem, source: PhotoSource): Promise<void> {
    const photo = await pickAndStorePhoto(draft.id, item.id, source);
    if (!photo) return;
    await removeStoredPhoto(item.photo);
    dispatch({ type: 'SET_EQUIPMENT_PHOTO', id: item.id, photo });
  }

  async function remove(item: EquipmentItem): Promise<void> {
    await removeStoredPhoto(item.photo);
    dispatch({ type: 'SET_EQUIPMENT_PHOTO', id: item.id, photo: undefined });
  }

  return (
    <>
      <StepIntro title="Equipamentos" description="Até seis equipamentos. O prefixo do SGP é aplicado automaticamente no arquivo final." />
      {draft.equipment.map((item) => (
        <SectionCard key={item.id} title={`Equipamento ${item.number} · foto ${item.photoNumber}`}>
          <FormField label="Descrição do equipamento" value={item.description} onChangeText={(description) => update(item.id, { description })} autoCapitalize="characters" />
          <ChoiceField label="Identificação" value={item.identifierType} options={IDENTIFIER_TYPES} onChange={(identifierType) => update(item.id, { identifierType })} />
          {item.identifierType === 'SGP' ? <Text style={styles.prefix}>Prefixo fixo: {SGP_PREFIX}</Text> : null}
          <FormField
            label={item.identifierType === 'SGP' ? 'Complemento do SGP' : 'Número de série (SN)'}
            value={item.identifier}
            onChangeText={(identifier) => update(item.id, { identifier })}
            autoCapitalize="characters"
          />
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Quantidade</Text>
            <QuantityControl compact value={item.quantity} onChange={(quantity) => update(item.id, { quantity })} />
          </View>
          <PhotoInput
            title="Foto do equipamento"
            subtitle={`Célula ${item.photoCell}`}
            photo={item.photo}
            onPick={(source) => pick(item, source)}
            onRemove={() => remove(item)}
          />
        </SectionCard>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  prefix: { color: colors.muted, fontSize: 12, marginBottom: spacing.sm, marginTop: -spacing.sm },
  quantityRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  quantityLabel: { color: colors.text, fontSize: 13, fontWeight: '700' },
});

import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChoiceField } from '../components/ChoiceField';
import { FormField } from '../components/FormField';
import { SectionCard } from '../components/SectionCard';
import { StepIntro } from '../components/StepIntro';
import { COMPANY, TECHNICIAN, UF } from '../constants';
import { useReport } from '../context/ReportContext';
import { pickOsPdf } from '../services/osImportService';
import { extractedFieldCount } from '../services/osTextParser';
import { colors, radius, spacing } from '../theme';
import type { AccessType, ActivityType, ActivationData } from '../types';

const ACCESS_TYPES: readonly Exclude<AccessType, ''>[] = ['EDD', 'FIBRA', 'GPON', 'BSOD', 'Terceiro'];
const ACTIVITIES: readonly Exclude<ActivityType, ''>[] = ['Ativação', 'Pré ativação', 'Vistoria', 'Alteração de Facilidade', 'Alteração de Velocidade', 'Insucesso'];

export function ActivationDataScreen(): React.JSX.Element {
  const { draft, dispatch } = useReport();
  const [importing, setImporting] = useState(false);
  const data = draft.activation;
  const update = (patch: Partial<ActivationData>) => dispatch({ type: 'UPDATE_ACTIVATION', patch });

  async function importPdf(): Promise<void> {
    try {
      setImporting(true);
      const result = await pickOsPdf(draft.id);
      if (!result) return;
      update({
        ...(result.extracted ?? {}),
        sourcePdfName: result.name,
        sourcePdfUri: result.uri,
      });
      Alert.alert(
        result.extracted ? 'OS importada' : 'PDF anexado',
        result.extracted
          ? `${extractedFieldCount(result.extracted)} campos foram preenchidos automaticamente. Confira antes de avançar.${result.extractionWarning ? `\n\nAviso: ${result.extractionWarning}` : ''}`
          : `O PDF ficou vinculado ao rascunho, mas não foi possível reconhecer os campos automaticamente.${result.extractionWarning ? `\n\n${result.extractionWarning}` : ''}`,
      );
    } catch (error) {
      Alert.alert('Não foi possível importar a OS', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <StepIntro title="Dados da Ativação" description="Importe a OS em PDF para preencher os dados. UF, empreiteira e técnico já estão fixos no modelo oficial." />
      <Pressable disabled={importing} onPress={() => void importPdf()} style={({ pressed }) => [styles.importButton, pressed && styles.pressed]}>
        {importing ? <ActivityIndicator color={colors.white} /> : <Text style={styles.importText}>Importar PDF da OS</Text>}
      </Pressable>
      {data.sourcePdfName ? <Text style={styles.pdfName}>PDF anexado: {data.sourcePdfName}</Text> : null}

      <SectionCard title="Cliente e ordem de serviço">
        <FormField label="Cliente" value={data.client} onChangeText={(client) => update({ client })} autoCapitalize="characters" />
        <FormField label="Item WF" value={data.itemWf} onChangeText={(itemWf) => update({ itemWf })} autoCapitalize="characters" />
        <FormField label="Endereço" value={data.address} onChangeText={(address) => update({ address })} autoCapitalize="characters" />
        <FormField label="Cód. Cir" value={data.circuitCode} onChangeText={(circuitCode) => update({ circuitCode })} autoCapitalize="characters" />
        <FormField label="Cidade" value={data.city} onChangeText={(city) => update({ city })} autoCapitalize="characters" />
        <FormField label="Velocidade" value={data.speed} onChangeText={(speed) => update({ speed })} autoCapitalize="characters" />
        <FormField label="Designação" value={data.designation} onChangeText={(designation) => update({ designation })} autoCapitalize="characters" />
      </SectionCard>

      <SectionCard title="Contato e execução">
        <FormField label="Contato" value={data.contact} onChangeText={(contact) => update({ contact })} autoCapitalize="words" />
        <FormField label="Telefone" value={data.phone} onChangeText={(phone) => update({ phone })} keyboardType="phone-pad" />
        <ChoiceField label="Tipo de Acesso" value={data.accessType} options={ACCESS_TYPES} onChange={(accessType) => update({ accessType })} />
        <ChoiceField label="Atividade" value={data.activity} options={ACTIVITIES} onChange={(activity) => update({ activity })} />
        <FormField label="Data" value={data.date} onChangeText={(date) => update({ date })} keyboardType="numbers-and-punctuation" placeholder="dd/mm/aaaa" />
        <FormField label="Nº RAT" value={data.ratNumber} onChangeText={(ratNumber) => update({ ratNumber })} autoCapitalize="characters" />
        <FormField label="Nome do cliente que validou a atividade" value={data.validatedBy} onChangeText={(validatedBy) => update({ validatedBy })} autoCapitalize="words" />
      </SectionCard>

      <SectionCard title="Dados fixos do modelo">
        <View style={styles.fixedRow}><Text style={styles.fixedLabel}>UF</Text><Text style={styles.fixedValue}>{UF}</Text></View>
        <View style={styles.fixedRow}><Text style={styles.fixedLabel}>Empreiteira</Text><Text style={styles.fixedValue}>{COMPANY}</Text></View>
        <View style={styles.fixedRow}><Text style={styles.fixedLabel}>Técnico</Text><Text style={styles.fixedValue}>{TECHNICIAN}</Text></View>
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  importButton: { alignItems: 'center', backgroundColor: colors.navy, borderRadius: radius.md, marginBottom: spacing.sm, minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.lg },
  importText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  pdfName: { color: colors.success, fontSize: 12, marginBottom: spacing.lg },
  fixedRow: { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  fixedLabel: { color: colors.muted, fontSize: 13 },
  fixedValue: { color: colors.text, fontSize: 13, fontWeight: '800', maxWidth: '70%', textAlign: 'right' },
  pressed: { opacity: 0.72 },
});

import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '../components/SectionCard';
import { StepIntro } from '../components/StepIntro';
import { COMPANY, TECHNICIAN, UF } from '../constants';
import { useReport } from '../context/ReportContext';
import { generateReportFile, shareXlsFile } from '../services/reportFileService';
import { convertXlsxFileToXls } from '../services/xlsConverterService';
import { colors, radius, spacing } from '../theme';
import { reportFilenameXls } from '../utils/filename';

function SummaryRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value || '—'}</Text>
    </View>
  );
}

export function PreviewScreen(): React.JSX.Element {
  const { draft } = useReport();
  const [convertingToXls, setConvertingToXls] = useState(false);
  const a = draft.activation;
  const generalCount = draft.generalPhotos.filter((item) => item.photo).length;
  const equipmentCount = draft.equipment.filter((item) => item.description || item.identifier || item.photo).length;

  async function exportReportAsXls(): Promise<void> {
    try {
      setConvertingToXls(true);
      const xlsxFileUri = await generateReportFile(draft);
      const xlsFileUri = await convertXlsxFileToXls(xlsxFileUri, reportFilenameXls(a.client, a.date));
      const shared = await shareXlsFile(xlsFileUri);
      if (!shared) Alert.alert('Relatório convertido', `Arquivo .xls salvo em:\n${xlsFileUri}`);
    } catch (error) {
      Alert.alert(
        'Não foi possível converter para .xls',
        error instanceof Error ? error.message : 'Verifique sua conexão com a internet e tente novamente.',
      );
    } finally {
      setConvertingToXls(false);
    }
  }

  return (
    <>
      <StepIntro title="Pré-visualização" description="Confira os dados antes de gerar o arquivo .XLS oficial com as fotos incorporadas." />
      <SectionCard title="Dados do cliente e da ativação">
        <SummaryRow label="Cliente" value={a.client} />
        <SummaryRow label="Item WF / Cód. Cir" value={`${a.itemWf || '—'} / ${a.circuitCode || '—'}`} />
        <SummaryRow label="Endereço" value={a.address} />
        <SummaryRow label="Cidade / UF" value={`${a.city || '—'} / ${UF}`} />
        <SummaryRow label="Velocidade / Designação" value={`${a.speed || '—'} / ${a.designation || '—'}`} />
        <SummaryRow label="Tipo / Atividade" value={`${a.accessType || '—'} / ${a.activity || '—'}`} />
        <SummaryRow label="Contato / Tel" value={`${a.contact || '—'} / ${a.phone || '—'}`} />
        <SummaryRow label="Data / Nº RAT" value={`${a.date || '—'} / ${a.ratNumber || '—'}`} />
        <SummaryRow label="Validado por" value={a.validatedBy} />
        <SummaryRow label="Empreiteira / Técnico" value={`${COMPANY} / ${TECHNICIAN}`} />
      </SectionCard>

      <SectionCard title={`Fotos gerais — ${generalCount}/9 anexadas`}>
        <View style={styles.photoGrid}>
          {draft.generalPhotos.map((item) => (
            <View key={item.id} style={styles.photoItem}>
              <View style={styles.thumbnail}>
                {item.photo ? <Image source={{ uri: item.photo.uri }} resizeMode="cover" style={styles.thumbnailImage} /> : <Text style={styles.noPhoto}>sem foto</Text>}
              </View>
              <Text numberOfLines={2} style={styles.photoLabel}>{item.number}. {item.label}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title={`Equipamentos — ${equipmentCount} preenchido(s)`}>
        {draft.equipment.map((item) => (
          <View key={item.id} style={styles.equipmentRow}>
            <Text style={styles.equipmentTitle}>Equipamento {item.number}: {item.description || '—'}</Text>
            <Text style={styles.equipmentMeta}>{item.identifierType}: {item.identifier || '—'} · Qtd {item.quantity}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="RVO">
        <View style={styles.rvoPreview}>
          {draft.rvoPhoto ? <Image source={{ uri: draft.rvoPhoto.uri }} resizeMode="contain" style={styles.thumbnailImage} /> : <Text style={styles.noPhoto}>sem imagem</Text>}
        </View>
      </SectionCard>

      <SectionCard title="Materiais">
        {draft.materials.map((item) => <SummaryRow key={item.id} label={item.description} value={String(item.quantity)} />)}
      </SectionCard>

      <Pressable
        disabled={convertingToXls}
        onPress={() => void exportReportAsXls()}
        style={({ pressed }) => [styles.exportButton, pressed && styles.pressed, convertingToXls && styles.disabled]}
      >
        {convertingToXls ? <ActivityIndicator color={colors.white} /> : <Text style={styles.exportText}>Baixar em .XLS</Text>}
      </Pressable>
      <Text style={styles.exportHelp}>Envia o arquivo ao servidor de conversão (LibreOffice) e mantém fotos e formatação. Requer internet.</Text>
    </>
  );
}

const styles = StyleSheet.create({
  summaryRow: { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: spacing.sm },
  summaryLabel: { color: colors.muted, fontSize: 12 },
  summaryValue: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 2 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoItem: { width: '48%' },
  thumbnail: { alignItems: 'center', aspectRatio: 4 / 3, backgroundColor: '#EDF1F6', borderRadius: radius.sm, justifyContent: 'center', overflow: 'hidden' },
  thumbnailImage: { height: '100%', width: '100%' },
  noPhoto: { color: colors.muted, fontSize: 11 },
  photoLabel: { color: colors.text, fontSize: 10, lineHeight: 14, marginBottom: spacing.sm, marginTop: spacing.xs },
  equipmentRow: { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: spacing.sm },
  equipmentTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  equipmentMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  rvoPreview: { alignItems: 'center', aspectRatio: 12.6 / 14.45, backgroundColor: '#EDF1F6', borderRadius: radius.md, justifyContent: 'center', maxHeight: 420, overflow: 'hidden', width: '100%' },
  exportButton: { alignItems: 'center', backgroundColor: colors.red, borderRadius: radius.md, justifyContent: 'center', minHeight: 54, paddingHorizontal: spacing.xl },
  exportText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  exportHelp: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: spacing.xl, marginTop: spacing.sm, textAlign: 'center' },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.55 },
});

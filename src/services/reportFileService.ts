import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import reportTemplate from '../../assets/templates/relatorio_aceite.xlsx';
import type { ReportDraft, StoredPhoto } from '../types';
import { reportFilename } from '../utils/filename';
import { buildReportWorkbook } from './xlsxExporter';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLS_MIME = 'application/vnd.ms-excel';

function outputDirectory(): string {
  if (!FileSystem.documentDirectory) {
    throw new Error('O armazenamento do aplicativo não está disponível neste aparelho.');
  }
  return `${FileSystem.documentDirectory}r2pro/relatorios/`;
}

function allPhotos(draft: ReportDraft): StoredPhoto[] {
  const photos = [
    ...draft.generalPhotos.map((item) => item.photo),
    ...draft.equipment.map((item) => item.photo),
    draft.rvoPhoto,
  ].filter((photo): photo is StoredPhoto => Boolean(photo));
  return [...new Map(photos.map((photo) => [photo.uri, photo])).values()];
}

async function loadTemplateBase64(): Promise<string> {
  const asset = Asset.fromModule(reportTemplate);
  await asset.downloadAsync();
  if (!asset.localUri) {
    throw new Error('Não foi possível carregar o modelo oficial do relatório.');
  }
  return FileSystem.readAsStringAsync(asset.localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

async function loadImageLookup(draft: ReportDraft): Promise<Record<string, string>> {
  const entries = await Promise.all(
    allPhotos(draft).map(async (photo) => [
      photo.uri,
      await FileSystem.readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 }),
    ] as const),
  );
  return Object.fromEntries(entries);
}

export async function generateReportFile(draft: ReportDraft): Promise<string> {
  const [templateBase64, imageLookup] = await Promise.all([
    loadTemplateBase64(),
    loadImageLookup(draft),
  ]);
  const outputBase64 = await buildReportWorkbook(templateBase64, draft, imageLookup);
  const directory = outputDirectory();
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const fileUri = `${directory}${reportFilename(draft.activation.client, draft.activation.date)}`;
  await FileSystem.writeAsStringAsync(fileUri, outputBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileUri;
}

export async function shareReportFile(fileUri: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) {
    return false;
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: XLSX_MIME,
    dialogTitle: 'Compartilhar relatório de aceite',
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
  });
  return true;
}

export async function shareXlsFile(fileUri: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) {
    return false;
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: XLS_MIME,
    dialogTitle: 'Compartilhar relatório de aceite (.xls)',
    UTI: 'com.microsoft.excel.xls',
  });
  return true;
}

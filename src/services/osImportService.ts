import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { isAvailable, recognizeText } from '@dariyd/react-native-text-recognition';

import type { ActivationData } from '../types';
import { extractedFieldCount, parseEmbratelOsText } from './osTextParser';

export interface OsImportResult {
  name: string;
  uri: string;
  extracted?: Partial<ActivationData>;
  extractionWarning?: string;
}

function reportDirectory(reportId: string): string {
  if (!FileSystem.documentDirectory) {
    throw new Error('O armazenamento do aplicativo não está disponível neste aparelho.');
  }
  return `${FileSystem.documentDirectory}r2pro/${reportId}/source/`;
}

function onlyActivationFields(value: unknown): Partial<ActivationData> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const allowed: Array<keyof ActivationData> = [
    'client', 'itemWf', 'address', 'circuitCode', 'city', 'speed', 'contact',
    'designation', 'phone', 'accessType', 'activity', 'date', 'ratNumber', 'validatedBy',
  ];
  const result: Partial<ActivationData> = {};
  for (const key of allowed) {
    const candidate = (value as Record<string, unknown>)[key];
    if (typeof candidate === 'string') {
      Object.assign(result, { [key]: candidate.trim() });
    }
  }
  return Object.keys(result).length ? result : undefined;
}

async function extractThroughConfiguredService(
  sourceUri: string,
  sourceName: string,
): Promise<Partial<ActivationData> | undefined> {
  const endpoint = process.env.EXPO_PUBLIC_OS_PARSER_URL?.trim();
  if (!endpoint) return undefined;

  const form = new FormData();
  form.append('file', {
    uri: sourceUri,
    name: sourceName,
    type: 'application/pdf',
  } as unknown as Blob);
  const response = await fetch(endpoint, { method: 'POST', body: form });
  if (!response.ok) {
    throw new Error(`O serviço de leitura da OS respondeu com status ${response.status}.`);
  }
  return onlyActivationFields(await response.json());
}

async function extractOnDevice(sourceUri: string): Promise<Partial<ActivationData>> {
  if (!(await isAvailable())) {
    throw new Error('O reconhecimento de texto não está disponível neste aparelho.');
  }
  const recognition = await recognizeText(sourceUri, {
    languages: ['pt'],
    recognitionLevel: 'line',
    maxPages: 1,
    pdfDpi: 200,
    preprocessImages: false,
  });
  if (!recognition.success) {
    throw new Error(recognition.errorMessage || 'O aparelho não conseguiu ler o conteúdo do PDF.');
  }
  const recognizedText = recognition.fullText
    || recognition.pages?.map((page) => page.fullText).filter(Boolean).join('\n')
    || '';
  const extracted = parseEmbratelOsText(recognizedText);
  if (extractedFieldCount(extracted) < 4) {
    throw new Error('O arquivo não corresponde ao modelo de Relatório de Agendamento reconhecido pelo R2 PRO.');
  }
  return extracted;
}

export async function pickOsPdf(reportId: string): Promise<OsImportResult | undefined> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) {
    return undefined;
  }

  const source = result.assets[0];
  const directory = reportDirectory(reportId);
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const destination = `${directory}ordem-servico.pdf`;
  await FileSystem.copyAsync({ from: source.uri, to: destination });

  let extracted: Partial<ActivationData> | undefined;
  let extractionWarning: string | undefined;
  try {
    extracted = await extractOnDevice(destination);
  } catch (localError) {
    try {
      extracted = await extractThroughConfiguredService(destination, source.name);
    } catch (remoteError) {
      extractionWarning = remoteError instanceof Error ? remoteError.message : 'Falha no serviço alternativo de leitura.';
    }
    if (!extracted && !extractionWarning) {
      extractionWarning = localError instanceof Error ? localError.message : 'Não foi possível ler o PDF neste aparelho.';
    }
  }
  return { name: source.name, uri: destination, extracted, extractionWarning };
}

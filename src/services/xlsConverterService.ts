import * as FileSystem from 'expo-file-system/legacy';

const CONVERTER_BASE_URL = process.env.EXPO_PUBLIC_XLS_CONVERTER_URL?.replace(/\/+$/, '');

interface ConvertResponse {
  base64?: string;
  error?: string;
  detail?: string;
}

function requireConverterUrl(): string {
  if (!CONVERTER_BASE_URL) {
    throw new Error(
      'O endereço do conversor de XLS não está configurado. Defina EXPO_PUBLIC_XLS_CONVERTER_URL no arquivo .env.',
    );
  }
  return CONVERTER_BASE_URL;
}

/**
 * Envia um .xlsx já gerado (por xlsxExporter/reportFileService) para o
 * converter-service (Node + LibreOffice headless, ver converter-service/server.js)
 * e baixa de volta o .xls (BIFF8) resultante, preservando fotos, fórmulas e
 * formatação.
 *
 * Protocolo (precisa bater com converter-service/server.js):
 *   POST {baseUrl}/convert  body: { base64: "<xlsx em base64>" }
 *   resposta: { base64: "<xls em base64>" }  ou  { error: "..." }
 *
 * Requer conexão com a internet — o conversor real roda no servidor
 * (LibreOffice headless), não é possível gerar um .xls fiel só no
 * dispositivo sem perder as fotos incorporadas.
 */
export async function convertXlsxFileToXls(xlsxFileUri: string, xlsFileName: string): Promise<string> {
  const baseUrl = requireConverterUrl();

  const xlsxBase64 = await FileSystem.readAsStringAsync(xlsxFileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(`${baseUrl}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64: xlsxBase64 }),
  });

  let parsed: ConvertResponse;
  try {
    parsed = (await response.json()) as ConvertResponse;
  } catch {
    throw new Error('Resposta inesperada do servidor de conversão.');
  }

  if (!response.ok || !parsed.base64) {
    throw new Error(
      parsed.error ?? parsed.detail ?? `O servidor de conversão respondeu com erro (HTTP ${response.status}).`,
    );
  }

  const directory = xlsxFileUri.slice(0, xlsxFileUri.lastIndexOf('/') + 1);
  const localXlsUri = `${directory}${xlsFileName}`;

  await FileSystem.writeAsStringAsync(localXlsUri, parsed.base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return localXlsUri;
}

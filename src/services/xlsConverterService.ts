import * as FileSystem from 'expo-file-system/legacy';

const CONVERTER_BASE_URL = process.env.EXPO_PUBLIC_XLS_CONVERTER_URL?.replace(/\/+$/, '');

interface ConvertResult {
  id: string;
  originalName: string;
  convertedName: string;
  status: 'success' | 'error';
  downloadUrl?: string;
  errorMessage?: string;
}

interface ConvertResponse {
  results: ConvertResult[];
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
 * conversor LibreOffice hospedado no Railway (r2pro.up.railway.app) e baixa
 * de volta o .xls (BIFF8) resultante, preservando fotos, fórmulas e
 * formatação.
 *
 * Requer conexão com a internet — o conversor real roda no servidor
 * (LibreOffice headless), não é possível gerar um .xls fiel só no
 * dispositivo sem perder as fotos incorporadas.
 */
export async function convertXlsxFileToXls(xlsxFileUri: string, xlsFileName: string): Promise<string> {
  const baseUrl = requireConverterUrl();

  const uploadResult = await FileSystem.uploadAsync(`${baseUrl}/api/convert`, xlsxFileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'files',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    parameters: {},
  });

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(`O servidor de conversão respondeu com erro (HTTP ${uploadResult.status}).`);
  }

  let parsed: ConvertResponse;
  try {
    parsed = JSON.parse(uploadResult.body) as ConvertResponse;
  } catch {
    throw new Error('Resposta inesperada do servidor de conversão.');
  }

  const result = parsed.results?.[0];
  if (!result || result.status !== 'success' || !result.downloadUrl) {
    throw new Error(result?.errorMessage ?? 'Não foi possível converter o arquivo para .xls.');
  }

  const directory = xlsxFileUri.slice(0, xlsxFileUri.lastIndexOf('/') + 1);
  const localXlsUri = `${directory}${xlsFileName}`;

  const download = await FileSystem.downloadAsync(`${baseUrl}${result.downloadUrl}`, localXlsUri);
  if (download.status < 200 || download.status >= 300) {
    throw new Error(`Falha ao baixar o arquivo .xls convertido (HTTP ${download.status}).`);
  }

  return download.uri;
}

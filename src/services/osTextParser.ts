import type { AccessType, ActivityType, ActivationData } from '../types';

const LABELS = new Set([
  'ACAO',
  'ATIVIDADE',
  'BAIRRO',
  'CEP',
  'CIDADE',
  'CLIENTE',
  'CM',
  'COD CIR 1',
  'COMPLEMENTO',
  'CONTATO',
  'CONTATO LOCAL DO CLIENTE',
  'DATA/HORA COMBINADA COM O CLIENTE',
  'DESIGNACAO',
  'ENDERECO',
  'EMPRESA',
  'FONE',
  'NUMERO',
  'ORDER ENTRY',
  'OS SAPWEB',
  'OTS',
  'PVT COORDENADOR',
  'REFERENCIA',
  'SENHA DE ACEITACAO PRIMESYS',
  'SERVICO',
  'TECNOLOGIA',
  'TECNICO EXECUTANTE',
  'TELEFONE DO CONTATO LOCAL DO CLIENTE',
  'TICKET CPE',
  'TICKET GAT',
  'TICKET TELEFONIA',
  'TIPO DO TICKET CPE',
  'UF',
  'VELOCIDADE',
]);

const ACCESS_TYPES: readonly Exclude<AccessType, ''>[] = ['EDD', 'FIBRA', 'GPON', 'BSOD', 'Terceiro'];

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function cleanText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/\u00a0/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isLabel(line: string): boolean {
  return LABELS.has(fold(line));
}

function findLabel(lines: readonly string[], label: string): number {
  const expected = fold(label);
  return lines.findIndex((line) => fold(line) === expected);
}

function nextMatchingValue(
  lines: readonly string[],
  label: string,
  matcher: (line: string) => boolean,
  limit = 14,
): string | undefined {
  const start = findLabel(lines, label);
  if (start < 0) return undefined;
  for (let index = start + 1; index < Math.min(lines.length, start + limit + 1); index += 1) {
    const candidate = lines[index];
    if (candidate && !isLabel(candidate) && matcher(candidate)) return candidate.trim();
  }
  return undefined;
}

function normalizedPhone(value?: string): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return value.trim();
}

function mappedActivity(value?: string): ActivityType | undefined {
  if (!value) return undefined;
  const normalized = fold(value);
  if (normalized.includes('INSUCESSO')) return 'Insucesso';
  if (normalized.includes('PRE ATIVACAO') || normalized.includes('PRE-ATIVACAO')) return 'Pré ativação';
  if (normalized.includes('VISTORIA')) return 'Vistoria';
  if (normalized.includes('ALTERACAO DE FACILIDADE')) return 'Alteração de Facilidade';
  if (normalized.includes('ALTERA')) return 'Alteração de Velocidade';
  if (normalized.includes('ATIVA')) return 'Ativação';
  return undefined;
}

function mappedAccessType(value?: string): AccessType | undefined {
  if (!value) return undefined;
  const normalized = fold(value);
  return ACCESS_TYPES.find((item) => fold(item) === normalized);
}

function findAddress(lines: readonly string[]): string | undefined {
  const streetIndex = lines.findIndex((line) => /^(AVENIDA|AV\.?|RUA|RODOVIA|ESTRADA|ALAMEDA|TRAVESSA|PRA[CÇ]A)\b/i.test(line));
  if (streetIndex < 0) return undefined;

  const street = lines[streetIndex]?.trim();
  const inlineAddress = street?.match(/^((?:AVENIDA|AV\.?|RUA|RODOVIA|ESTRADA|ALAMEDA|TRAVESSA|PRA[CÇ]A)\s+.+?)\s+(\d{1,7}[A-Z/-]*)(?:\s+(.+))?$/i);
  if (inlineAddress) {
    const base = `${inlineAddress[1]}, ${inlineAddress[2]}`;
    return inlineAddress[3] ? `${base} - ${inlineAddress[3]}` : base;
  }

  let number: string | undefined;
  let complement: string | undefined;
  for (let index = streetIndex + 1; index < Math.min(lines.length, streetIndex + 10); index += 1) {
    const candidate = lines[index];
    if (!candidate) continue;
    if (fold(candidate) === 'BAIRRO') break;
    if (isLabel(candidate)) continue;
    if (!number && /^\d{1,7}[A-Z/-]*$/i.test(candidate)) {
      number = candidate;
      continue;
    }
    if (number && !complement && !/^\(?\d{2}\)?\s*\d/.test(candidate)) complement = candidate;
  }

  return [street, number].filter(Boolean).join(', ') + (complement ? ` - ${complement}` : '');
}

function findCity(lines: readonly string[], compact: string): string | undefined {
  const states = new Set(['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']);
  const stateIndex = lines.findIndex((line) => states.has(fold(line)));
  if (stateIndex >= 0) {
    for (let index = stateIndex - 1; index >= Math.max(0, stateIndex - 8); index -= 1) {
      const candidate = lines[index];
      if (candidate && !isLabel(candidate) && /[A-Za-zÀ-ÿ]/.test(candidate)) return candidate.trim();
    }
  }

  const statesPattern = [...states].join('|');
  const beforeState = compact.match(new RegExp(`([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]{1,60}?)\\s+(?:${statesPattern})\\s+\\(?\\d{2}\\)?\\s*\\d{4,5}`, 'i'))?.[1]?.trim();
  return beforeState?.split(/\s+/).at(-1);
}

function assignIfPresent<K extends keyof ActivationData>(
  target: Partial<ActivationData>,
  key: K,
  value: ActivationData[K] | undefined,
): void {
  if (value !== undefined && value !== '') target[key] = value;
}

export function parseEmbratelOsText(source: string): Partial<ActivationData> {
  const text = cleanText(source);
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const compact = text.replace(/\s+/g, ' ');
  const foldedCompact = fold(compact);
  const result: Partial<ActivationData> = {};

  const item = compact.match(/[IiLl]tem\s*:?\s*(\d{5,})\b/)?.[1];
  const client = nextMatchingValue(
    lines,
    'CLIENTE',
    (line) => /[A-Za-zÀ-ÿ]{3}/.test(line) && !/^\d{2}\/\d{2}\/\d{4}/.test(line) && !line.includes('://'),
    8,
  ) || compact.match(/\bCLIENTE\s+DATA\/HORA COMBINADA COM O CLIENTE\s+(.+?)\s+\d{2}\/\d{2}\/\d{4}\b/i)?.[1]?.trim();
  const activityRaw = nextMatchingValue(lines, 'ATIVIDADE', (line) => /[A-Za-zÀ-ÿ]{4}/.test(line), 8)
    || compact.match(/\bATIVIDADE\s+DESIGNA[CÇ][AÃ]O\s+(.+?)\s+[A-Z]{2,6}\s*\/\s*[A-Z0-9]{2,8}\s*\/\s*\d{6,}/i)?.[1]?.trim();
  const dateSection = foldedCompact.indexOf('DATA/HORA COMBINADA COM O CLIENTE');
  const scheduledDate = dateSection >= 0
    ? compact.slice(dateSection, dateSection + 320).match(/\b(\d{2}\/\d{2}\/\d{4})\b/)?.[1]
    : undefined;
  const designationMatch = compact.match(/\b([A-Z]{2,6})\s*\/\s*([A-Z0-9]{2,8})\s*\/\s*(\d{6,})\b/i);
  const designation = designationMatch
    ? `${designationMatch[1]}/${designationMatch[2]}/${designationMatch[3]}`.toUpperCase()
    : undefined;
  const circuitCode = nextMatchingValue(lines, 'COD. CIR 1', (line) => /^\d{5,}$/.test(line), 14);
  const technology = nextMatchingValue(
    lines,
    'TECNOLOGIA',
    (line) => ACCESS_TYPES.some((item) => fold(item) === fold(line)),
    12,
  );
  const speed = nextMatchingValue(
    lines,
    'VELOCIDADE',
    (line) => /^\d+(?:[.,]\d+)?\s*(?:K|M|G|KBPS|MBPS|GBPS)$/i.test(line),
    12,
  );
  const headerPhone = nextMatchingValue(
    lines,
    'FONE',
    (line) => {
      const digits = line.replace(/\D/g, '');
      return (digits.length === 10 || digits.length === 11) && !line.includes('/');
    },
    12,
  ) || (compact.split(/DETALHES DO AGENDAMENTO\s*:/i)[0] ?? compact).match(/\(\d{2}\)\s*\d{4,5}[-\s]?\d{4}/)?.[0];
  const contact = compact.match(/Contato cliente\s*:\s*([^/]{2,80}?)\s*\/\s*Telefone\s*:/i)?.[1]?.trim();
  const validatedBy = compact.match(/Contato que vai validar\s*:\s*([^/]{2,80}?)\s*\/\s*Telefone\s*:/i)?.[1]?.trim();

  assignIfPresent(result, 'client', client);
  assignIfPresent(result, 'itemWf', item);
  assignIfPresent(result, 'address', findAddress(lines));
  assignIfPresent(result, 'circuitCode', circuitCode);
  assignIfPresent(result, 'city', findCity(lines, compact));
  assignIfPresent(result, 'speed', speed?.replace(/\s+/g, '').toUpperCase());
  assignIfPresent(result, 'contact', contact);
  assignIfPresent(result, 'designation', designation);
  assignIfPresent(result, 'phone', normalizedPhone(headerPhone));
  assignIfPresent(result, 'accessType', mappedAccessType(technology));
  assignIfPresent(result, 'activity', mappedActivity(activityRaw));
  assignIfPresent(result, 'date', scheduledDate);
  assignIfPresent(result, 'validatedBy', validatedBy);

  return result;
}

export function extractedFieldCount(data?: Partial<ActivationData>): number {
  if (!data) return 0;
  return Object.values(data).filter((value) => typeof value === 'string' && value.trim().length > 0).length;
}

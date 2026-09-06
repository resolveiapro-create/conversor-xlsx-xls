export function safeFilePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
    .slice(0, 60);
}

export function reportFilename(client: string, date: string): string {
  const clientPart = safeFilePart(client) || 'CLIENTE';
  const datePart = safeFilePart(date) || new Date().toISOString().slice(0, 10);
  return `RELATORIO_ACEITE_${clientPart}_${datePart}.xlsx`;
}

export function reportFilenameXls(client: string, date: string): string {
  return reportFilename(client, date).replace(/\.xlsx$/i, '.xls');
}

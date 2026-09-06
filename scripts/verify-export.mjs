import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import JSZip from 'jszip';
import { buildReportWorkbook } from '../src/services/xlsxExporter.ts';

const templateBase64 = (await fs.readFile(new URL('../assets/templates/relatorio_aceite.xlsx', import.meta.url))).toString('base64');
const voiceTests = Array.from({ length: 19 }, (_, index) => ({
  id: `voice-${index}`,
  section: index < 13 ? 'Originadas pelo PABX' : 'Destinadas ao PABX',
  label: `Teste ${index + 1}`,
  result: index === 2 ? 'FALHA' : 'OK',
}));
const photoCells = ['A14', 'C14', 'E14', 'A18', 'C18', 'E18', 'A22', 'C22', 'E22'];
const equipmentCells = ['A26', 'C26', 'E26', 'A30', 'C30', 'E30'];
const draft = {
  id: 'verification',
  updatedAt: new Date().toISOString(),
  currentStep: 6,
  activation: {
    client: 'CLIENTE TESTE', itemWf: 'WF123', address: 'RUA TESTE, 100', circuitCode: 'CIR456',
    city: 'MARINGÁ', speed: '500 MB', contact: 'JOÃO', designation: 'DESIG789', phone: '(44) 99999-9999',
    accessType: 'FIBRA', activity: 'Ativação', date: '29/08/2026', ratNumber: 'RAT001',
    validatedBy: 'CLIENTE VALIDADOR', sourcePdfName: '', sourcePdfUri: '',
  },
  generalPhotos: photoCells.map((cell, index) => ({ id: `general-${index}`, number: index + 1, label: `FOTO ${index + 1}`, cell })),
  equipment: equipmentCells.map((photoCell, index) => ({
    id: `equipment-${index}`, number: index + 1, photoNumber: index + 10, photoCell,
    description: `EQUIPAMENTO ${index + 1}`, identifierType: index === 1 ? 'SN' : 'SGP',
    identifier: `12345${index}`, quantity: index + 1,
  })),
  materials: Array.from({ length: 4 }, (_, index) => ({ id: `material-${index}`, description: `MATERIAL ${index}`, sapCode: `700${index}`, quantity: index + 2 })),
  voiceTests,
};

const outputBase64 = await buildReportWorkbook(templateBase64, draft, {});
const zip = await JSZip.loadAsync(outputBase64, { base64: true });
const sheetOne = await zip.file('xl/worksheets/sheet1.xml').async('string');
const sheetThree = await zip.file('xl/worksheets/sheet3.xml').async('string');
const sheetFour = await zip.file('xl/worksheets/sheet4.xml').async('string');

assert.match(sheetOne, /CLIENTE: CLIENTE TESTE/);
assert.match(sheetOne, /DESCRIÇÃO DO EQUIPAMENTO: EQUIPAMENTO 6/);
assert.match(sheetThree, /FALHA/);
assert.match(sheetFour, /EQUIPAMENTO 6/);
assert.match(sheetFour, /<mergeCell ref="A9:C9"\/>/);
assert.doesNotMatch(await zip.file('xl/workbook.xml').async('string'), /#REF!/);

console.log('Exportador XLSX verificado com sucesso.');

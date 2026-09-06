import JSZip from 'jszip';

import type { EquipmentItem, ReportDraft, StoredPhoto } from '../types';

const OFFICE_REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const IMAGE_REL_TYPE = `${OFFICE_REL_NS}/image`;
const EMU_PER_PIXEL = 9525;
const EMU_PER_CM = 360000;
const SGP_PREFIX = '(90)289110';

type ImageLookup = Record<string, string>;

interface PicturePlacement {
  photo: StoredPhoto;
  base64: string;
  cell: string;
  name: string;
  boxWidthPx: number;
  boxHeightPx: number;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cleanCellAttributes(attributes: string): string {
  return attributes.replace(/\s+t="[^"]*"/g, '');
}

function replaceCell(xml: string, cell: string, body: string, type?: string): string {
  const paired = new RegExp(`<c\\s+r="${cell}"([^>]*)>[\\s\\S]*?<\\/c>`);
  const selfClosing = new RegExp(`<c\\s+r="${cell}"([^>]*)\\/>`);
  const makeCell = (attributes: string) => {
    const typeAttribute = type ? ` t="${type}"` : '';
    return `<c r="${cell}"${cleanCellAttributes(attributes)}${typeAttribute}>${body}</c>`;
  };

  if (selfClosing.test(xml)) {
    return xml.replace(selfClosing, (_match, attributes: string) => makeCell(attributes));
  }
  if (paired.test(xml)) {
    return xml.replace(paired, (_match, attributes: string) => makeCell(attributes));
  }
  throw new Error(`Célula ${cell} não encontrada no modelo XLSX.`);
}

function setInlineString(xml: string, cell: string, value: string): string {
  const preserve = /^\s|\s$|\n/.test(value) ? ' xml:space="preserve"' : '';
  return replaceCell(xml, cell, `<is><t${preserve}>${escapeXml(value)}</t></is>`, 'inlineStr');
}

function setNumber(xml: string, cell: string, value: number): string {
  return replaceCell(xml, cell, `<v>${Number.isFinite(value) ? value : 0}</v>`);
}

function stripBrokenDefinedNames(xml: string): string {
  return xml.replace(/<definedNames>[\s\S]*?<\/definedNames>/, '');
}

function removeMacroShapes(xml: string): string {
  const anchorPattern = /<xdr:twoCellAnchor\b[\s\S]*?<\/xdr:twoCellAnchor>|<xdr:oneCellAnchor\b[\s\S]*?<\/xdr:oneCellAnchor>/g;
  return xml.replace(anchorPattern, (anchor) => (anchor.includes('<xdr:sp ') ? '' : anchor));
}

function displayIdentifier(item: EquipmentItem): string {
  const raw = item.identifier.trim();
  if (item.identifierType === 'SN') {
    return raw;
  }
  if (!raw) {
    return SGP_PREFIX;
  }
  if (raw.startsWith('(90)') || raw.startsWith('90')) {
    return raw;
  }
  return `${SGP_PREFIX}${raw}`;
}

function equipmentIsActive(item: EquipmentItem): boolean {
  return Boolean(item.description.trim() || item.identifier.trim() || item.photo);
}

function shiftRowBlock(block: string, amount: number): string {
  const currentRow = Number(block.match(/<row\b[^>]*\br="(\d+)"/)?.[1]);
  if (!Number.isFinite(currentRow)) {
    return block;
  }
  const nextRow = currentRow + amount;
  return block
    .replace(/(<row\b[^>]*\br=")\d+("[^>]*>)/, `$1${nextRow}$2`)
    .replace(/r="([A-Z]+)(\d+)"/g, (_match, col: string, row: string) => `r="${col}${Number(row) + amount}"`);
}

function ensureSixEquipmentRows(xml: string): string {
  const dataMatch = xml.match(/<sheetData>([\s\S]*?)<\/sheetData>/);
  if (!dataMatch) {
    throw new Error('A aba de equipamentos não possui sheetData.');
  }

  const rows = dataMatch[1]!.match(/<row\b[\s\S]*?<\/row>/g) ?? [];
  const rowSeven = rows.find((row) => /<row\b[^>]*\br="7"/.test(row));
  if (!rowSeven) {
    throw new Error('A linha-base para o sexto equipamento não foi encontrada.');
  }

  const shiftedRows = rows.map((row) => {
    const rowNumber = Number(row.match(/<row\b[^>]*\br="(\d+)"/)?.[1]);
    return rowNumber >= 8 ? shiftRowBlock(row, 1) : row;
  });
  const insertIndex = shiftedRows.findIndex((row) => /<row\b[^>]*\br="9"/.test(row));
  shiftedRows.splice(insertIndex < 0 ? shiftedRows.length : insertIndex, 0, shiftRowBlock(rowSeven, 1));

  let result = xml.replace(dataMatch[0], `<sheetData>${shiftedRows.join('')}</sheetData>`);
  result = result.replace(/<dimension ref="A1:C14"\/>/, '<dimension ref="A1:C15"/>');
  result = result.replace(/<mergeCell ref="A8:C8"\/>/, '<mergeCell ref="A9:C9"/>');
  return result;
}

function parseCell(cell: string): { col: number; row: number } {
  const match = cell.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Referência de célula inválida: ${cell}`);
  }
  let col = 0;
  for (const character of match[1]!) {
    col = col * 26 + character.charCodeAt(0) - 64;
  }
  return { col: col - 1, row: Number(match[2]!) - 1 };
}

function fitInside(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number,
): { width: number; height: number; offsetX: number; offsetY: number } {
  const safeWidth = Math.max(1, imageWidth);
  const safeHeight = Math.max(1, imageHeight);
  const scale = Math.min(boxWidth / safeWidth, boxHeight / safeHeight);
  const width = Math.max(1, Math.round(safeWidth * scale));
  const height = Math.max(1, Math.round(safeHeight * scale));
  return {
    width,
    height,
    offsetX: Math.max(0, Math.round((boxWidth - width) / 2)),
    offsetY: Math.max(0, Math.round((boxHeight - height) / 2)),
  };
}

function pictureAnchor(
  placement: PicturePlacement,
  relationshipId: string,
  pictureId: number,
): string {
  const { col, row } = parseCell(placement.cell);
  const margin = 4;
  const fit = fitInside(
    placement.photo.width,
    placement.photo.height,
    Math.max(1, placement.boxWidthPx - margin * 2),
    Math.max(1, placement.boxHeightPx - margin * 2),
  );
  const offsetX = (fit.offsetX + margin) * EMU_PER_PIXEL;
  const offsetY = (fit.offsetY + margin) * EMU_PER_PIXEL;
  const width = fit.width * EMU_PER_PIXEL;
  const height = fit.height * EMU_PER_PIXEL;

  return `<xdr:oneCellAnchor>
<xdr:from><xdr:col>${col}</xdr:col><xdr:colOff>${offsetX}</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>${offsetY}</xdr:rowOff></xdr:from>
<xdr:ext cx="${width}" cy="${height}"/>
<xdr:pic>
<xdr:nvPicPr><xdr:cNvPr id="${pictureId}" name="${escapeXml(placement.name)}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>
<xdr:blipFill><a:blip xmlns:r="${OFFICE_REL_NS}" r:embed="${relationshipId}" cstate="print"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>
<xdr:spPr bwMode="auto"><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln><a:noFill/></a:ln></xdr:spPr>
</xdr:pic>
<xdr:clientData/>
</xdr:oneCellAnchor>`;
}

function addAnchor(drawingXml: string, anchor: string): string {
  return drawingXml.replace('</xdr:wsDr>', `${anchor}</xdr:wsDr>`);
}

function addImageRelationship(relsXml: string, id: string, target: string): string {
  const relationship = `<Relationship Id="${id}" Type="${IMAGE_REL_TYPE}" Target="${target}"/>`;
  return relsXml.replace('</Relationships>', `${relationship}</Relationships>`);
}

function relationshipDocument(): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
}

function addJpegContentType(xml: string): string {
  if (/Extension="jpe?g"/.test(xml)) {
    return xml;
  }
  return xml.replace(
    '<Default Extension="png" ContentType="image/png"/>',
    '<Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/>',
  );
}

async function requiredText(zip: JSZip, path: string): Promise<string> {
  const entry = zip.file(path);
  if (!entry) {
    throw new Error(`Arquivo obrigatório ausente no modelo: ${path}`);
  }
  return entry.async('string');
}

function mapSheetOne(sheetXml: string, draft: ReportDraft): string {
  const a = draft.activation;
  let xml = sheetXml;
  const cells: Array<[string, string]> = [
    ['A5', `CLIENTE: ${a.client}`],
    ['D5', `ITEM WF: ${a.itemWf}   CÓD. CIR: ${a.circuitCode}`],
    ['A6', `ENDEREÇO: ${a.address}`],
    ['D6', `VELOCIDADE: ${a.speed}               DESIGNAÇÃO: ${a.designation}`],
    ['A7', `CIDADE: ${a.city}`],
    ['C7', 'UF: PARANÁ'],
    ['D7', `TIPO DE ACESSO: ${a.accessType}          ATIVIDADE: ${a.activity}`],
    ['A8', `CONTATO: ${a.contact}`],
    ['C8', `TEL: ${a.phone}`],
    ['D8', `DATA: ${a.date}                                  Nº RAT: ${a.ratNumber}`],
    ['A9', `NOME DO CLIENTE QUE VALIDOU A ATIVIDADE: ${a.validatedBy}`],
    ['A11', 'EMPREITEIRA: MULTIVALE'],
    ['E11', 'TÉCNICO: DIOGO L. OLIVERA'],
  ];
  for (const [cell, value] of cells) {
    xml = setInlineString(xml, cell, value);
  }

  const descriptionCells = ['A27', 'C27', 'E27', 'A31', 'C31', 'E31'];
  const identifierCells = ['A28', 'C28', 'E28', 'A32', 'C32', 'E32'];
  draft.equipment.forEach((item, index) => {
    const descriptionCell = descriptionCells[index];
    const identifierCell = identifierCells[index];
    if (!descriptionCell || !identifierCell) return;
    xml = setInlineString(xml, descriptionCell, `DESCRIÇÃO DO EQUIPAMENTO: ${item.description}`);
    xml = setInlineString(xml, identifierCell, `${item.identifierType}: ${displayIdentifier(item)}`);
  });
  return xml;
}

function mapVoiceSheet(sheetXml: string, draft: ReportDraft): string {
  const cells = [
    'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15',
    'B17', 'B18', 'B19', 'B20', 'B21', 'B22',
  ];
  let xml = sheetXml;
  draft.voiceTests.forEach((test, index) => {
    const cell = cells[index];
    if (cell) xml = setInlineString(xml, cell, test.result);
  });
  return xml;
}

function mapEquipmentAndMaterialsSheet(sheetXml: string, draft: ReportDraft): string {
  let xml = ensureSixEquipmentRows(sheetXml);
  xml = setInlineString(xml, 'B2', 'SGP / SN');

  draft.equipment.forEach((item, index) => {
    const row = index + 3;
    const active = equipmentIsActive(item);
    xml = setInlineString(xml, `A${row}`, active ? item.description : '');
    xml = setInlineString(xml, `B${row}`, active ? displayIdentifier(item) : '');
    xml = active
      ? setNumber(xml, `C${row}`, Math.max(0, item.quantity || 0))
      : setInlineString(xml, `C${row}`, '');
  });

  draft.materials.forEach((material, index) => {
    const row = index + 11;
    xml = setNumber(xml, `C${row}`, Math.max(0, material.quantity || 0));
  });
  return xml;
}

function photoPlacements(draft: ReportDraft, images: ImageLookup): PicturePlacement[] {
  const widthByColumn: Record<string, number> = { A: 488, C: 487, E: 506 };
  const placements: PicturePlacement[] = [];
  for (const slot of draft.generalPhotos) {
    if (!slot.photo) continue;
    const base64 = images[slot.photo.uri];
    if (!base64) continue;
    placements.push({
      photo: slot.photo,
      base64,
      cell: slot.cell,
      name: `Foto ${slot.number} - ${slot.label}`,
      boxWidthPx: widthByColumn[slot.cell.charAt(0)] ?? 488,
      boxHeightPx: 400,
    });
  }
  for (const item of draft.equipment) {
    if (!item.photo) continue;
    const base64 = images[item.photo.uri];
    if (!base64) continue;
    placements.push({
      photo: item.photo,
      base64,
      cell: item.photoCell,
      name: `Foto ${item.photoNumber} - Equipamento ${item.number}`,
      boxWidthPx: widthByColumn[item.photoCell.charAt(0)] ?? 488,
      boxHeightPx: 400,
    });
  }
  return placements;
}

export async function buildReportWorkbook(
  templateBase64: string,
  draft: ReportDraft,
  imagesByUri: ImageLookup,
): Promise<string> {
  const zip = await JSZip.loadAsync(templateBase64, { base64: true });

  let workbookXml = await requiredText(zip, 'xl/workbook.xml');
  let sheetOneXml = await requiredText(zip, 'xl/worksheets/sheet1.xml');
  const sheetTwoXml = await requiredText(zip, 'xl/worksheets/sheet2.xml');
  let sheetThreeXml = await requiredText(zip, 'xl/worksheets/sheet3.xml');
  let sheetFourXml = await requiredText(zip, 'xl/worksheets/sheet4.xml');
  let drawingOneXml = removeMacroShapes(await requiredText(zip, 'xl/drawings/drawing1.xml'));
  let drawingTwoXml = removeMacroShapes(await requiredText(zip, 'xl/drawings/drawing2.xml'));
  let drawingOneRels = await requiredText(zip, 'xl/drawings/_rels/drawing1.xml.rels');
  let contentTypes = await requiredText(zip, '[Content_Types].xml');

  workbookXml = stripBrokenDefinedNames(workbookXml);
  sheetOneXml = mapSheetOne(sheetOneXml, draft);
  sheetThreeXml = mapVoiceSheet(sheetThreeXml, draft);
  sheetFourXml = mapEquipmentAndMaterialsSheet(sheetFourXml, draft);
  contentTypes = addJpegContentType(contentTypes);

  const placements = photoPlacements(draft, imagesByUri);
  placements.forEach((placement, index) => {
    const relationshipId = `rId${index + 2}`;
    const mediaName = `r2-photo-${index + 1}.jpeg`;
    zip.file(`xl/media/${mediaName}`, placement.base64, { base64: true });
    drawingOneRels = addImageRelationship(drawingOneRels, relationshipId, `../media/${mediaName}`);
    drawingOneXml = addAnchor(
      drawingOneXml,
      pictureAnchor(placement, relationshipId, 100 + index),
    );
  });

  let drawingTwoRels = relationshipDocument();
  const rvoBase64 = draft.rvoPhoto ? imagesByUri[draft.rvoPhoto.uri] : undefined;
  if (draft.rvoPhoto && rvoBase64) {
    const rvoPlacement: PicturePlacement = {
      photo: draft.rvoPhoto,
      base64: rvoBase64,
      cell: 'A1',
      name: 'RVO',
      boxWidthPx: Math.round((12.6 * EMU_PER_CM) / EMU_PER_PIXEL),
      boxHeightPx: Math.round((14.45 * EMU_PER_CM) / EMU_PER_PIXEL),
    };
    zip.file('xl/media/r2-rvo.jpeg', rvoPlacement.base64, { base64: true });
    drawingTwoRels = addImageRelationship(drawingTwoRels, 'rId1', '../media/r2-rvo.jpeg');
    drawingTwoXml = addAnchor(drawingTwoXml, pictureAnchor(rvoPlacement, 'rId1', 200));
  }

  zip.file('xl/workbook.xml', workbookXml);
  zip.file('xl/worksheets/sheet1.xml', sheetOneXml);
  zip.file('xl/worksheets/sheet2.xml', sheetTwoXml);
  zip.file('xl/worksheets/sheet3.xml', sheetThreeXml);
  zip.file('xl/worksheets/sheet4.xml', sheetFourXml);
  zip.file('xl/drawings/drawing1.xml', drawingOneXml);
  zip.file('xl/drawings/drawing2.xml', drawingTwoXml);
  zip.file('xl/drawings/_rels/drawing1.xml.rels', drawingOneRels);
  zip.file('xl/drawings/_rels/drawing2.xml.rels', drawingTwoRels);
  zip.file('[Content_Types].xml', contentTypes);

  return zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

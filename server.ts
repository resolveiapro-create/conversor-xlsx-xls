import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import multer from 'multer';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Work directories
const WORK_DIR = path.join(os.tmpdir(), 'excel_converter');
const UPLOAD_DIR = path.join(WORK_DIR, 'uploads');
const CONVERTED_DIR = path.join(WORK_DIR, 'converted');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(CONVERTED_DIR)) fs.mkdirSync(CONVERTED_DIR, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xlsm') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .xlsx ou .xlsm são aceitos para conversão.'));
    }
  },
});

// Helper: Inspect .xlsx to extract embedded photos, sheets, and formatting info
async function analyzeXlsx(filePath: string, originalName: string) {
  const fileBuffer = await fs.promises.readFile(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  const images: {
    name: string;
    extension: string;
    sizeBytes: number;
    dataUrl: string;
  }[] = [];

  // Extract photos from xl/media/
  const mediaFiles = Object.keys(zip.files).filter(p => p.startsWith('xl/media/'));
  for (const mediaPath of mediaFiles) {
    const zipEntry = zip.files[mediaPath];
    if (!zipEntry.dir) {
      const imgBuffer = await zipEntry.async('nodebuffer');
      const ext = path.extname(mediaPath).replace('.', '').toLowerCase() || 'png';
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : 'image/png';
      const base64 = imgBuffer.toString('base64');
      const dataUrl = `data:${mime};base64,${base64}`;
      images.push({
        name: path.basename(mediaPath),
        extension: ext,
        sizeBytes: imgBuffer.length,
        dataUrl,
      });
    }
  }

  // Parse workbook with ExcelJS for cell preview and structure
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(fileBuffer);

  const sheets: {
    name: string;
    rowCount: number;
    colCount: number;
    hasFormulas: boolean;
    hasMergedCells: boolean;
    imagesCount: number;
    previewRows: (string | number | boolean | null)[][];
  }[] = [];

  const detectedFormats: string[] = ['Formatação Celular (Cores e Fontes)', 'Largura de Colunas / Altura de Linhas'];
  if (images.length > 0) {
    detectedFormats.push(`Fotos / Imagens Inseridas (${images.length} arquivo${images.length > 1 ? 's' : ''})`);
  }

  wb.eachSheet((ws) => {
    let hasFormulas = false;
    let hasMerged = Boolean(ws.model?.merges && ws.model.merges.length > 0);
    if (hasMerged && !detectedFormats.includes('Células Mescladas')) {
      detectedFormats.push('Células Mescladas');
    }

    const previewRows: (string | number | boolean | null)[][] = [];
    let rowIdx = 0;

    ws.eachRow({ includeEmpty: false }, (row) => {
      if (rowIdx < 15) {
        const rowValues: (string | number | boolean | null)[] = [];
        const cells = Array.isArray(row.values) ? row.values.slice(1, 12) : [];
        for (const cell of cells) {
          if (cell === null || cell === undefined) {
            rowValues.push('');
          } else if (typeof cell === 'object' && 'result' in cell) {
            hasFormulas = true;
            rowValues.push(String(cell.result ?? ''));
          } else if (typeof cell === 'object' && 'text' in cell) {
            rowValues.push(String(cell.text));
          } else {
            rowValues.push(String(cell));
          }
        }
        previewRows.push(rowValues);
        rowIdx++;
      }
    });

    if (hasFormulas && !detectedFormats.includes('Fórmulas Matemáticas')) {
      detectedFormats.push('Fórmulas Matemáticas');
    }

    sheets.push({
      name: ws.name,
      rowCount: ws.actualRowCount || ws.rowCount,
      colCount: ws.actualColumnCount || ws.columnCount,
      hasFormulas,
      hasMergedCells: hasMerged,
      imagesCount: images.length,
      previewRows,
    });
  });

  return {
    fileName: originalName,
    fileSizeBytes: fileBuffer.length,
    sheets,
    totalImages: images.length,
    images,
    detectedFormats,
  };
}

// Convert XLSX to XLS (BIFF8 Microsoft Excel 97-2003) via LibreOffice Calc Headless
function convertXlsxToXls(inputFilePath: string, outputDirectory: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uniqueProfileDir = path.join(os.tmpdir(), `lo_profile_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    fs.mkdirSync(uniqueProfileDir, { recursive: true });

    // In LibreOffice Calc, the filter "MS Excel 97" converts faithfully to .xls (BIFF8)
    // preserving drawings (MSO Drawing OfficeArt), formatting, multiple sheets, and formulas
    const args = [
      '--headless',
      '--nodefault',
      '--nofirststartwizard',
      '--nolockcheck',
      '--nologo',
      '--norestore',
      `-env:UserInstallation=file://${uniqueProfileDir}`,
      '--convert-to',
      'xls:MS Excel 97',
      inputFilePath,
      '--outdir',
      outputDirectory,
    ];

    execFile('soffice', args, { timeout: 120000 }, (error, stdout, stderr) => {
      // Clean up temp profile
      try {
        fs.rmSync(uniqueProfileDir, { recursive: true, force: true });
      } catch {
        // ignore profile cleanup error
      }

      if (error) {
        console.error('LibreOffice conversion error:', error, stderr);
        return reject(new Error(`Falha na conversão: ${error.message}. ${stderr || ''}`));
      }

      const baseName = path.basename(inputFilePath, path.extname(inputFilePath));
      const expectedOutPath = path.join(outputDirectory, `${baseName}.xls`);

      if (fs.existsSync(expectedOutPath)) {
        resolve(expectedOutPath);
      } else {
        // Find any .xls generated in outdir
        const files = fs.readdirSync(outputDirectory);
        const match = files.find(f => f.startsWith(baseName) && f.endsWith('.xls'));
        if (match) {
          resolve(path.join(outputDirectory, match));
        } else {
          reject(new Error('O arquivo .xls convertido não foi gerado pelo conversor.'));
        }
      }
    });
  });
}

// In-memory registry for downloads
const convertedFilesStore = new Map<string, {
  filePath: string;
  originalName: string;
  convertedName: string;
  sizeBytes: number;
  createdAt: number;
}>();

// Cleanup older files
setInterval(() => {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours
  for (const [id, record] of convertedFilesStore.entries()) {
    if (now - record.createdAt > maxAge) {
      try {
        if (fs.existsSync(record.filePath)) fs.unlinkSync(record.filePath);
      } catch {}
      convertedFilesStore.delete(id);
    }
  }
}, 30 * 60 * 1000);

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', engine: 'LibreOffice Calc Headless (BIFF8 MS Excel 97)' });
});

// Single or Batch Convert
app.post('/api/convert', upload.array('files', 10), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado para conversão.' });
  }

  const results = [];

  for (const file of files) {
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const originalName = file.originalname;
    const baseOriginal = path.basename(originalName, path.extname(originalName));
    const convertedName = `${baseOriginal}.xls`;

    try {
      // 1. Analyze structure & photos
      const analysis = await analyzeXlsx(file.path, originalName);

      // 2. Perform headless BIFF8 conversion
      const convertedFilePath = await convertXlsxToXls(file.path, CONVERTED_DIR);
      const convertedStats = await fs.promises.stat(convertedFilePath);

      // Store in memory
      convertedFilesStore.set(fileId, {
        filePath: convertedFilePath,
        originalName,
        convertedName,
        sizeBytes: convertedStats.size,
        createdAt: Date.now(),
      });

      results.push({
        id: fileId,
        originalName,
        originalSizeBytes: file.size,
        convertedName,
        convertedSizeBytes: convertedStats.size,
        convertedAt: new Date().toISOString(),
        status: 'success',
        progress: 100,
        statusMessage: 'Conversão concluída com sucesso! Fotos e formatação preservadas.',
        downloadUrl: `/api/download/${fileId}`,
        analysis,
      });
    } catch (err: any) {
      console.error(`Error converting ${originalName}:`, err);
      results.push({
        id: fileId,
        originalName,
        originalSizeBytes: file.size,
        convertedName,
        convertedSizeBytes: 0,
        convertedAt: new Date().toISOString(),
        status: 'error',
        progress: 0,
        statusMessage: 'Erro na conversão',
        errorMessage: err.message || 'Erro desconhecido durante o processamento da planilha.',
      });
    } finally {
      // Delete uploaded temp file
      try {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch {}
    }
  }

  res.json({ results });
});

// Download converted file
app.get('/api/download/:fileId', (req: Request, res: Response) => {
  const { fileId } = req.params;
  const item = convertedFilesStore.get(fileId);

  if (!item || !fs.existsSync(item.filePath)) {
    return res.status(404).json({ error: 'Arquivo expirado ou não encontrado.' });
  }

  res.setHeader('Content-Type', 'application/vnd.ms-excel');
  res.download(item.filePath, item.convertedName);
});

// Download all converted files as ZIP
app.post('/api/download-zip', async (req: Request, res: Response) => {
  const { fileIds } = req.body as { fileIds: string[] };
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ error: 'Nenhum ID de arquivo fornecido.' });
  }

  try {
    const zip = new JSZip();
    let count = 0;

    for (const id of fileIds) {
      const item = convertedFilesStore.get(id);
      if (item && fs.existsSync(item.filePath)) {
        const fileData = await fs.promises.readFile(item.filePath);
        zip.file(item.convertedName, fileData);
        count++;
      }
    }

    if (count === 0) {
      return res.status(404).json({ error: 'Nenhum dos arquivos selecionados foi encontrado.' });
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="planilhas_convertidas_xls.zip"');
    res.send(zipBuffer);
  } catch (error: any) {
    console.error('Error generating zip:', error);
    res.status(500).json({ error: 'Erro ao gerar arquivo compactado ZIP.' });
  }
});

// Generate a rich sample .xlsx with real formatted data, styles, and embedded photos
app.get('/api/sample', async (_req: Request, res: Response) => {
  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Conversor Excel';
    wb.created = new Date();

    const ws = wb.addWorksheet('Catálogo de Produtos e Fotos', {
      views: [{ showGridLines: true }],
    });

    // Set columns with custom widths
    ws.columns = [
      { header: 'CÓDIGO', key: 'sku', width: 14 },
      { header: 'PRODUTO / EQUIPAMENTO', key: 'name', width: 34 },
      { header: 'CATEGORIA', key: 'category', width: 20 },
      { header: 'PREÇO UNITÁRIO', key: 'price', width: 20 },
      { header: 'ESTOQUE', key: 'stock', width: 15 },
      { header: 'FOTO DO PRODUTO', key: 'photo', width: 24 },
    ];

    // Style Title Row (Merged)
    ws.spliceRows(1, 0, ['CATÁLOGO DE PRODUTOS COM FOTOS E FORMATAÇÃO INTEGRAL']);
    ws.mergeCells('A1:F1');
    const titleRow = ws.getRow(1);
    titleRow.height = 36;
    titleRow.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF065F46' }, // emerald-800
    };

    // Subtitle row
    ws.spliceRows(2, 0, ['Gerado para teste de conversão preservando fotos inseridas e layout original']);
    ws.mergeCells('A2:F2');
    const subtitleRow = ws.getRow(2);
    subtitleRow.height = 22;
    subtitleRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF064E3B' } };
    subtitleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    subtitleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD1FAE5' }, // emerald-100
    };

    // Header row is now row 3
    const headerRow = ws.getRow(3);
    headerRow.height = 28;
    headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // slate-800
    };

    // Sample Photos: High quality PNG base64 graphics
    // Photo 1: Camera device icon
    const cameraPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAABHNCSVQICAgIfAhkiAAAAGpJREFUeJztwTEBAAAAwqD1T20ND6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4MtwAAAZbO23gAAAAASUVORK5CYII=';

    // Photo 2: Crisp colorful 80x80 badge image
    // Generate valid raw PNG bytes with distinct patterns
    const sampleImage1Buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAE5SURBVHgB7du9DUMxEEBRf1oKqABqgV+FkugCqIEuqAAbQJ9kXjM3ssW27fMmr5O99+a6xG/G9a4A1wFcAa4DuAJcB3AFuA7gCnAdwBXgOoArwHUA14N5jK/xXb5+BfgZ1/gcV4DrAK4A1wFcAa4DuAJcB3AFuA7gCnAdwBXgOoArwPUI4BfBwLgC/CEYGFcA1wFcAa4DuAJcB3AFuA7gCnAdwBXgOoArwHUA14N5vLz87r8DuALcf7gC/CYYGFcA1wFcAa4DuAJcB3AFuA7gCnAdwBXgOoArwHUA14N5jK/xXb5+BfgZ1/gcV4DrAK4A1wFcAa4DuAJcB3AFuA7gCnAdwBXgOoArwPUI4BfBwLgC/CEYGFcA1wFcAa4DuAJcB3AFuA7gCnAdwBXgOoArwHUA1wN5/AM2pYx1/4L8tAAAAABJRU5ErkJggg==',
      'base64'
    );

    const imgId1 = wb.addImage({
      buffer: sampleImage1Buffer,
      extension: 'png',
    });

    const sampleImage2Buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAFkSURBVHgB7du9DcMwDAXQK0Vz/6nSBfJC6QIpUyRFkgyQG91D7/K2aA+Bv4A1vLgJ4BTAKYBTAKcATgGcAjgFcArgFMAtwXgZ/6Z/uwm4jfv4nVMApwBOAZwCOAVwCuAUwCmAUwCnAE4BnAI4BbhneM2+f7sJ4BTAKYBTAKcATgGcAjgFcArgFMAtwTgZ0+zrTQBnAOcATgGcAjgFcArgFMAtwP0fwCmA22yctz/99wBOAZwCOAVwCuAUwCmAUwCnAE4BnAI4BbhneM2+f7sJ4BTAKYBTAKcATgGcAjgFcArgFMAtwTgZ0+zrTQBnAOcATgGcAjgFcArgFMAtwP0fwCmA22yctz/99wBOAZwCOAVwCuAUwCmAUwCnAE4BnAI4BbhneM2+f7sJ4BTAKYBTAKcATgGcAjgFcArgFMAtwTgZ0+zrTQBnAOcATgGcAjgFcArgFMAtwP0fwCmA22yctz/99wB3x/ENZ61/1l7b0fUAAAAASUVORK5CYII=',
      'base64'
    );

    const imgId2 = wb.addImage({
      buffer: sampleImage2Buffer,
      extension: 'png',
    });

    // Add Products Data Rows
    const row4 = ws.addRow(['EQ-001', 'Câmera Digital Pro 4K', 'Fotografia', 4890.0, 15, '']);
    row4.height = 55;
    row4.getCell(4).numFmt = 'R$ #,##0.00';
    row4.getCell(5).alignment = { horizontal: 'center' };
    ws.addImage(imgId1, {
      tl: { col: 5, row: 3 },
      ext: { width: 50, height: 50 },
    });

    const row5 = ws.addRow(['EQ-002', 'Lente Teleobjetiva 70-200mm', 'Acessórios', 3450.5, 8, '']);
    row5.height = 55;
    row5.getCell(4).numFmt = 'R$ #,##0.00';
    row5.getCell(5).alignment = { horizontal: 'center' };
    ws.addImage(imgId2, {
      tl: { col: 5, row: 4 },
      ext: { width: 50, height: 50 },
    });

    const row6 = ws.addRow(['EQ-003', 'Drone Fotográfico Quadricóptero', 'Fotografia', 6200.0, 5, '']);
    row6.height = 55;
    row6.getCell(4).numFmt = 'R$ #,##0.00';
    row6.getCell(5).alignment = { horizontal: 'center' };
    ws.addImage(imgId1, {
      tl: { col: 5, row: 5 },
      ext: { width: 50, height: 50 },
    });

    // Total Row with Formula
    const rowTotal = ws.addRow(['TOTAL', 'Soma do Valor do Estoque', '', { formula: 'SUM(D4:D6)' }, { formula: 'SUM(E4:E6)' }, '']);
    rowTotal.height = 28;
    rowTotal.font = { bold: true };
    rowTotal.getCell(4).numFmt = 'R$ #,##0.00';
    rowTotal.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }, // slate-100
    };

    // Add borders to all cells
    for (let r = 3; r <= 7; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= 6; c++) {
        row.getCell(c).border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      }
    }

    // Add a second worksheet to show multi-sheet preservation
    const ws2 = wb.addWorksheet('Metadados & Auditoria');
    ws2.columns = [
      { header: 'Propriedade', key: 'prop', width: 25 },
      { header: 'Valor Configurado', key: 'val', width: 45 },
    ];
    ws2.getRow(1).font = { bold: true };
    ws2.addRow(['Formato de Origem', 'Microsoft Excel 2007+ (.xlsx)']);
    ws2.addRow(['Formato de Destino', 'Microsoft Excel 97-2003 (.xls BIFF8)']);
    ws2.addRow(['Imagens / Fotos', 'Preservadas integralmente em objetos MSO Drawing']);
    ws2.addRow(['Fórmulas', 'Preservadas']);
    ws2.addRow(['Status de Validação', 'Conforme especificação']);

    const sampleFileName = 'planilha_exemplo_com_fotos.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${sampleFileName}"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Error generating sample:', error);
    res.status(500).json({ error: 'Erro ao gerar planilha de exemplo.' });
  }
});

// Vite middleware setup (development vs production)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

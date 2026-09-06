import express from 'express';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const app = express();
app.use(express.json({ limit: '25mb' }));

// Nome do binário do LibreOffice. No Windows costuma ser "soffice.exe"
// (ou o caminho completo, ex: "C:\\Program Files\\LibreOffice\\program\\soffice.exe").
// No Linux/Mac normalmente basta "soffice" se estiver no PATH.
const SOFFICE_BIN = process.env.SOFFICE_BIN || 'soffice';

app.post('/convert', async (req, res) => {
  const { base64 } = req.body ?? {};
  if (!base64) {
    return res.status(400).json({ error: 'Campo "base64" ausente no corpo da requisição.' });
  }

  const dir = await mkdtemp(join(tmpdir(), 'r2pro-'));
  const inputPath = join(dir, 'relatorio.xlsx');

  try {
    await writeFile(inputPath, base64, 'base64');

    await new Promise((resolve, reject) => {
      execFile(
        SOFFICE_BIN,
        [
          '--headless',
          '--norestore',
          '--convert-to',
          'xls:"MS Excel 97"',
          '--outdir',
          dir,
          inputPath,
        ],
        { timeout: 60_000 },
        (err, stdout, stderr) => {
          if (err) {
            reject(new Error(stderr || err.message));
          } else {
            resolve(stdout);
          }
        },
      );
    });

    const outputPath = join(dir, 'relatorio.xls');
    const outputBuffer = await readFile(outputPath);
    res.json({ base64: outputBuffer.toString('base64') });
  } catch (error) {
    console.error('Falha na conversão:', error);
    res.status(500).json({ error: 'Falha ao converter o arquivo.', detail: String(error) });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Conversor .xlsx -> .xls rodando em http://0.0.0.0:${PORT}`);
});

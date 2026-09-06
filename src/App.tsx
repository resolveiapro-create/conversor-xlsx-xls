import React, { useState } from 'react';
import { ConvertedItem } from './types';
import { FileUploader } from './components/FileUploader';
import { ConversionCard } from './components/ConversionCard';
import { PreservationPillars } from './components/PreservationBadge';
import { InspectorModal } from './components/InspectorModal';
import {
  FileSpreadsheet,
  Download,
  Trash2,
  CheckCircle,
  Sparkles,
  Info,
  Layers,
  ShieldCheck,
  ArrowRight,
  FileArchive,
} from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<ConvertedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<ConvertedItem | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Upload and convert files
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    setGlobalError(null);
    setIsProcessing(true);

    // Add items in initial analyzing/converting state
    const newItems: ConvertedItem[] = files.map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      return {
        id,
        originalName: file.name,
        originalSizeBytes: file.size,
        convertedName: `${baseName}.xls`,
        convertedSizeBytes: 0,
        convertedAt: new Date().toISOString(),
        status: 'converting',
        progress: 40,
        statusMessage: 'Processando fotos e compilando formato BIFF8...',
      };
    });

    setItems((prev) => [...newItems, ...prev]);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao realizar a conversão.');
      }

      const data = await response.json();
      const serverResults: ConvertedItem[] = data.results || [];

      // Update state with server results
      setItems((prev) => {
        // Map matching items by filename
        const updated = [...prev];
        serverResults.forEach((res) => {
          const idx = updated.findIndex((item) => item.originalName === res.originalName && item.status === 'converting');
          if (idx !== -1) {
            updated[idx] = res;
          } else {
            updated.unshift(res);
          }
        });
        return updated;
      });
    } catch (err: any) {
      console.error('Conversion error:', err);
      setGlobalError(err.message || 'Ocorreu um erro durante a conversão.');
      // Mark pending items as error
      setItems((prev) =>
        prev.map((item) =>
          item.status === 'converting'
            ? {
                ...item,
                status: 'error',
                progress: 0,
                statusMessage: 'Erro',
                errorMessage: err.message || 'Falha na conversão',
              }
            : item
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Load sample file from server and convert it directly
  const handleLoadSample = async () => {
    try {
      setIsProcessing(true);
      setGlobalError(null);

      const res = await fetch('/api/sample');
      if (!res.ok) throw new Error('Não foi possível carregar a planilha de exemplo.');

      const blob = await res.blob();
      const sampleFile = new File([blob], 'catalogo_produtos_com_fotos.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      await handleFilesSelected([sampleFile]);
    } catch (err: any) {
      console.error('Sample loading error:', err);
      setGlobalError(err.message || 'Falha ao carregar arquivo de teste.');
      setIsProcessing(false);
    }
  };

  // Download all successful conversions as ZIP
  const handleDownloadZip = async () => {
    const successItems = items.filter((item) => item.status === 'success');
    if (successItems.length === 0) return;

    try {
      setIsDownloadingZip(true);
      const res = await fetch('/api/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: successItems.map((i) => i.id) }),
      });

      if (!res.ok) throw new Error('Falha ao gerar arquivo compactado ZIP.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'planilhas_convertidas_xls.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('ZIP download error:', err);
      setGlobalError('Não foi possível gerar o arquivo ZIP para download.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const successCount = items.filter((i) => i.status === 'success').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-200">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Conversor XLSX para XLS
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  Preservação de Fotos & Formatação
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Excel 2007+ (.XLSX) ➔ Excel 97-2003 (.XLS BIFF8) com precisão integral
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Motor BIFF8 Ativo
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Banner with core objective statement */}
        <div className="mb-6 bg-linear-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              Fidelidade Visual e Gráfica Garantida
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              Converta planilhas mantendo fotos inseridas e formatações originais
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Muitos conversores comuns perdem imagens embutidas, quebram larguras de colunas ou removem estilos
              de células. Nossa ferramenta preserva fotos de produtos, logotipos, cores, fontes, fórmulas e
              células mescladas diretamente nos registros binários do Excel 97-2003 (.XLS).
            </p>
          </div>
        </div>

        {/* 4 Pillars of Preservation */}
        <PreservationPillars />

        {/* Global Error Banner */}
        {globalError && (
          <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-start gap-3">
            <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Aviso:</p>
              <p>{globalError}</p>
            </div>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mb-8">
          <FileUploader
            onFilesSelected={handleFilesSelected}
            onLoadSample={handleLoadSample}
            isProcessing={isProcessing}
          />
        </div>

        {/* Converted Files Section */}
        {items.length > 0 && (
          <div className="space-y-4 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Planilhas em Processamento & Concluídas
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {successCount} de {items.length} convertida(s) com sucesso
                </p>
              </div>

              <div className="flex items-center gap-2">
                {successCount > 1 && (
                  <button
                    onClick={handleDownloadZip}
                    disabled={isDownloadingZip}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <FileArchive className="w-3.5 h-3.5" />
                    {isDownloadingZip ? 'Compactando...' : 'Baixar Todas (.ZIP)'}
                  </button>
                )}

                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Lista
                </button>
              </div>
            </div>

            {/* List of Cards */}
            <div className="space-y-3">
              {items.map((item) => (
                <ConversionCard
                  key={item.id}
                  item={item}
                  onInspect={(selected) => setInspectingItem(selected)}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </div>
        )}

        {/* Technical FAQ & Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-700" />
            Como garantimos a preservação de fotos e formatação no arquivo .XLS?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Preservação de Fotos em Objetos MSO Drawing
              </h4>
              <p>
                No formato moderno <code>.xlsx</code> (OpenXML), as imagens ficam compactadas na pasta <code>xl/media/</code>. Durante a conversão para <code>.xls</code> (BIFF8), nosso motor dedicado processa os limites vetoriais e âncoras de duas células (Two-Cell Anchors), gravando as fotos diretamente nos registros nativos <strong>OfficeArt (MSO Drawing)</strong> com proporções intactas.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Compatibilidade com Softwares e ERPs Legados
              </h4>
              <p>
                O arquivo gerado é um binário genuíno Excel 97-2003. É a solução perfeita para sistemas fiscais, módulos legados de ERPs (como TOTVS, SAP R/3, Protheus), sistemas bancários ou automações que exigem estritamente a extensão <code>.XLS</code> e recusam arquivos modernos <code>.XLSX</code>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Conversor de Planilhas XLSX para XLS • Preservação de Fotos, Imagens e Formatação Original
          </p>
          <div className="flex items-center gap-4">
            <span>Formato de Saída: <strong>Microsoft Excel 97-2003 (.XLS BIFF8)</strong></span>
          </div>
        </div>
      </footer>

      {/* Inspection Modal */}
      {inspectingItem && (
        <InspectorModal item={inspectingItem} onClose={() => setInspectingItem(null)} />
      )}
    </div>
  );
}

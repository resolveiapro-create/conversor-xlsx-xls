import React from 'react';
import { ConvertedItem } from '../types';
import {
  FileSpreadsheet,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';

interface ConversionCardProps {
  key?: React.Key;
  item: ConvertedItem;
  onInspect: (item: ConvertedItem) => void;
  onRemove: (id: string) => void;
}

export function ConversionCard({ item, onInspect, onRemove }: ConversionCardProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isConverting = item.status === 'converting' || item.status === 'analyzing';
  const isSuccess = item.status === 'success';
  const isError = item.status === 'error';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* File Info */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isSuccess
              ? 'bg-emerald-100/80 text-emerald-700'
              : isError
              ? 'bg-rose-100 text-rose-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isConverting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isSuccess ? (
            <FileSpreadsheet className="w-6 h-6" />
          ) : (
            <AlertCircle className="w-6 h-6" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900 truncate" title={item.originalName}>
              {item.originalName}
            </h4>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              XLSX
            </span>
            <span className="text-slate-400 text-xs">➔</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              XLS (BIFF8)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
            <span>Tamanho: {formatBytes(item.originalSizeBytes)}</span>
            {isSuccess && (
              <>
                <span>•</span>
                <span>Destino: {formatBytes(item.convertedSizeBytes)}</span>
              </>
            )}

            {/* Preserved badges */}
            {item.analysis && (
              <>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <ImageIcon className="w-3 h-3" />
                  {item.analysis.totalImages} {item.analysis.totalImages === 1 ? 'foto preservada' : 'fotos preservadas'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  <Layers className="w-3 h-3" />
                  {item.analysis.sheets.length} {item.analysis.sheets.length === 1 ? 'aba' : 'abas'}
                </span>
              </>
            )}
          </div>

          {/* Progress or error */}
          {isConverting && (
            <div className="mt-2">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <p className="text-[11px] text-emerald-700 mt-1 font-medium">{item.statusMessage}</p>
            </div>
          )}

          {isError && (
            <p className="text-xs text-rose-600 mt-1 font-medium">
              {item.errorMessage || 'Falha ao converter o arquivo.'}
            </p>
          )}

          {isSuccess && (
            <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Arquivo .XLS pronto com fotos e formatações preservadas.
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        {isSuccess && (
          <>
            <button
              onClick={() => onInspect(item)}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1.5"
              title="Visualizar fotos extraídas e detalhes das células"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              Inspecionar
            </button>

            {item.downloadUrl && (
              <a
                href={item.downloadUrl}
                download={item.convertedName}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar .XLS
              </a>
            )}
          </>
        )}

        <button
          onClick={() => onRemove(item.id)}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Remover da lista"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

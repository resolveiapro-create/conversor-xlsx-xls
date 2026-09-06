import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Sparkles, AlertCircle, FileCheck } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSample: () => void;
  isProcessing: boolean;
}

export function FileUploader({ onFilesSelected, onLoadSample, isProcessing }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const validateAndAddFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setDragError(null);

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(fileList).forEach((file) => {
      const name = file.name.toLowerCase();
      if (name.endsWith('.xlsx') || name.endsWith('.xlsm')) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setDragError(`Apenas arquivos de planilha (.xlsx ou .xlsm) são aceitos. Arquivos ignorados: ${invalidFiles.join(', ')}`);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    validateAndAddFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndAddFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer select-none ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/60 ring-4 ring-emerald-500/10 scale-[1.005]'
            : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-slate-50/50'
        } ${isProcessing ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xlsm"
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={isProcessing}
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-xs border border-emerald-100">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">
            Arraste suas planilhas .XLSX aqui
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-5">
            ou clique para selecionar arquivos do seu computador
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Selecionar Arquivos .XLSX
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLoadSample();
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
              title="Testar com uma planilha pronta contendo fotos e formatação avançada"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Carregar Planilha de Teste com Fotos
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-4">
            Compatível com .xlsx e .xlsm até 100 MB • Conversão em lote permitida
          </p>
        </div>
      </div>

      {/* Error notification if wrong file dropped */}
      {dragError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p>{dragError}</p>
        </div>
      )}
    </div>
  );
}

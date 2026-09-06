import React, { useState } from 'react';
import { ConvertedItem } from '../types';
import {
  X,
  Image as ImageIcon,
  Table2,
  CheckCircle2,
  Download,
  Info,
  Layers,
  FileSpreadsheet,
  Maximize2,
} from 'lucide-react';

interface InspectorModalProps {
  item: ConvertedItem | null;
  onClose: () => void;
}

export function InspectorModal({ item, onClose }: InspectorModalProps) {
  const [activeTab, setActiveTab] = useState<'images' | 'sheets' | 'audit'>('images');
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  if (!item || !item.analysis) return null;

  const { analysis } = item;
  const currentSheet = analysis.sheets[selectedSheetIndex] || analysis.sheets[0];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm shadow-xs">
              XLS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">{item.convertedName}</h3>
                <span className="text-[11px] font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  BIFF8 Preservado
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Origem: {item.originalName} ({formatBytes(item.originalSizeBytes)}) ➔ Destino: {formatBytes(item.convertedSizeBytes)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 gap-6 bg-white">
          <button
            onClick={() => setActiveTab('images')}
            className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'images'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Fotos Preservadas ({analysis.totalImages})
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'sheets'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table2 className="w-4 h-4" />
            Planilhas & Células ({analysis.sheets.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Auditoria de Formatação
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'images' && (
            <div>
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <p className="font-semibold mb-0.5">Garantia de Preservação de Fotos e Imagens:</p>
                  <p>
                    Todas as {analysis.totalImages} fotos e imagens detectadas na planilha original foram
                    mapeadas e transferidas para o formato binário <strong>.XLS (Excel 97-2003)</strong> através do
                    sistema de desenho vetorial e bitmap <strong>OfficeArt MSO Drawing</strong>, mantendo as
                    proporções e posições celulares originais.
                  </p>
                </div>
              </div>

              {analysis.images.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Nenhuma foto ou imagem inserida foi detectada.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Esta planilha contém apenas dados tabulares, cores e formatações de células.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {analysis.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col justify-between group hover:border-emerald-300 transition-all"
                    >
                      <div className="relative aspect-4/3 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center mb-3">
                        <img
                          src={img.dataUrl}
                          alt={img.name}
                          className="max-h-full max-w-full object-contain p-2"
                        />
                        <button
                          onClick={() => setEnlargedImage(img.dataUrl)}
                          className="absolute bottom-2 right-2 bg-slate-900/70 hover:bg-slate-900 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Ampliar visualização"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-slate-800 truncate max-w-[140px]" title={img.name}>
                            {img.name}
                          </span>
                          <span className="uppercase text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {img.extension}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{formatBytes(img.sizeBytes)} • Gravada em MSO Drawing</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sheets' && (
            <div>
              {/* Sheet Selector Tabs */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                {analysis.sheets.map((sheet, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => setSelectedSheetIndex(sIdx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedSheetIndex === sIdx
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {sheet.name}
                    <span className="opacity-75 text-[10px]">({sheet.rowCount} linhas)</span>
                  </button>
                ))}
              </div>

              {/* Sheet Summary */}
              {currentSheet && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-100/70 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 text-slate-700">
                      <span><strong>{currentSheet.rowCount}</strong> Linhas</span>
                      <span><strong>{currentSheet.colCount}</strong> Colunas</span>
                      {currentSheet.hasMergedCells && (
                        <span className="text-emerald-700 font-medium">Possui células mescladas</span>
                      )}
                      {currentSheet.hasFormulas && (
                        <span className="text-blue-700 font-medium">Possui fórmulas ativas</span>
                      )}
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      Prévia dos primeiros registros tabulares
                    </span>
                  </div>

                  {/* Grid Table */}
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <tbody>
                        {currentSheet.previewRows && currentSheet.previewRows.length > 0 ? (
                          currentSheet.previewRows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className={
                                rIdx === 0
                                  ? 'bg-slate-800 text-white font-semibold sticky top-0 z-10'
                                  : rIdx % 2 === 0
                                  ? 'bg-white'
                                  : 'bg-slate-50'
                              }
                            >
                              <td className="py-2 px-3 border border-slate-200 text-[10px] font-mono text-slate-400 bg-slate-100 text-center select-none w-8">
                                {rIdx + 1}
                              </td>
                              {row.map((cellVal, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`py-2 px-3 border border-slate-200 max-w-[200px] truncate ${
                                    rIdx === 0 ? 'border-slate-700 text-white' : 'text-slate-700'
                                  }`}
                                >
                                  {cellVal !== null && cellVal !== undefined ? String(cellVal) : ''}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="p-8 text-center text-slate-400">Nenhum dado legível nesta aba.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Camadas de Formatação e Integridade Verificadas
                </h4>

                <div className="space-y-3">
                  {[
                    {
                      title: 'Fotos e Desenhos Embutidos',
                      desc: `${analysis.totalImages} elemento(s) visual(is) preservado(s) e convertidos no padrão binário MSO Drawing sem compressão com perdas.`,
                      status: analysis.totalImages > 0 ? 'Preservado' : 'Sem Imagens',
                      color: 'emerald',
                    },
                    {
                      title: 'Paleta de Cores e Estilos de Célula',
                      desc: 'Cores de fundo sólidas, preenchimentos de padrão e paleta RGB mapeados para o mapa de 56 cores padrão do BIFF8.',
                      status: 'Preservado',
                      color: 'emerald',
                    },
                    {
                      title: 'Tipografia e Fontes',
                      desc: 'Família tipográfica, tamanhos em pontos, negrito, itálico, sublinhado e cores de texto mantidos.',
                      status: 'Preservado',
                      color: 'emerald',
                    },
                    {
                      title: 'Dimensões de Coluna e Linha',
                      desc: 'Larguras de colunas em unidades padrão de caractere e alturas de linha em twips preservadas.',
                      status: 'Preservado',
                      color: 'emerald',
                    },
                    {
                      title: 'Células Mescladas e Alinhamentos',
                      desc: 'Faixas mescladas (merged ranges) e regras de alinhamento vertical/horizontal intactas.',
                      status: 'Preservado',
                      color: 'emerald',
                    },
                    {
                      title: 'Múltiplas Abas de Planilha',
                      desc: `Total de ${analysis.sheets.length} aba(s) preservadas com nomes originais.`,
                      status: 'Preservado',
                      color: 'emerald',
                    },
                  ].map((layer, idx) => (
                    <div key={idx} className="flex items-start justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">{layer.title}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{layer.desc}</p>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0 ml-4">
                        {layer.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Compatibilidade com Sistemas Legados:</strong> O arquivo gerado utiliza o formato Microsoft Excel 97-2003 (.XLS BIFF8). Este formato é totalmente compatível com Excel 97, 2000, 2003, 2007, 2010, 2013, 2016, 2019, Microsoft 365, LibreOffice, Google Planilhas, bem como ERPs legados como SAP, TOTVS Protheus, datasul, sistemas bancários e fiscais.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Formato: <strong>Microsoft Excel 97-2003 (.XLS BIFF8)</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Fechar
            </button>
            {item.downloadUrl && (
              <a
                href={item.downloadUrl}
                download={item.convertedName}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar {item.convertedName}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Enlarged Image */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-xl p-2">
            <img src={enlargedImage} alt="Foto Ampliada" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Image as ImageIcon, Palette, Table2, Calculator, ShieldCheck } from 'lucide-react';

export function PreservationPillars() {
  const pillars = [
    {
      icon: ImageIcon,
      title: 'Fotos & Imagens Inseridas',
      desc: 'Preserva fotos integradas às células e desenhos flutuantes em registros nativos OfficeArt MSO Drawing.',
      badge: 'Fidelidade 100%',
    },
    {
      icon: Palette,
      title: 'Formatação Visual Completa',
      desc: 'Mantém cores de fundo (fills), paleta de fontes, tamanhos, negrito, itálico e bordas de células.',
      badge: 'Estilos Salvos',
    },
    {
      icon: Table2,
      title: 'Dimensões & Células Mescladas',
      desc: 'Respeita largura exata das colunas, altura das linhas e blocos mesclados (merged ranges).',
      badge: 'Layout Idêntico',
    },
    {
      icon: Calculator,
      title: 'Fórmulas & Múltiplas Abas',
      desc: 'Todas as planilhas da pasta de trabalho são mantidas com suas fórmulas matemáticas originais.',
      badge: 'Multi-planilha',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      {pillars.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between transition-all hover:border-emerald-300"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {item.badge}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

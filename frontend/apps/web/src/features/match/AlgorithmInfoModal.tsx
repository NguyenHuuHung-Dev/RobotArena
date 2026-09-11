import React from 'react';
import { AlgorithmDefinition } from '../../stores/simulationStore';

interface AlgorithmInfoModalProps {
  algorithm: AlgorithmDefinition | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const AlgorithmInfoModal: React.FC<AlgorithmInfoModalProps> = ({ algorithm, onClose, onDelete }) => {
  if (!algorithm) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-black w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 border-2 border-black shrink-0"
              style={{ backgroundColor: algorithm.color }}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black font-sans uppercase tracking-tight text-black">
                  {algorithm.name}
                </h3>
                {algorithm.isCustom && (
                  <span className="px-2 py-0.5 border border-rose-600 bg-rose-50 text-rose-700 text-[10px] font-mono font-bold">
                    THUẬT TOÁN CỦA BẠN
                  </span>
                )}
                {algorithm.category && !algorithm.isCustom && (
                  <span className="px-2 py-0.5 border border-black bg-neutral-100 text-[10px] font-mono font-bold">
                    {algorithm.category}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-neutral-500 mt-0.5">ID: {algorithm.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 border border-black flex items-center justify-center font-mono font-black text-sm hover:bg-black hover:text-white transition shrink-0"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="py-4 space-y-5">
          {/* Lead Summary */}
          <div className="p-3 bg-neutral-50 border border-black text-xs font-mono text-neutral-800 leading-relaxed font-semibold">
            {algorithm.shortDesc}
          </div>

          {/* Complexity Specs */}
          {(algorithm.timeComplexity || algorithm.spaceComplexity) && (
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 border border-neutral-300 bg-neutral-50">
                <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  ĐỘ PHỨC TẠP THỜI GIAN
                </div>
                <div className="text-sm font-bold text-black mt-1">
                  {algorithm.timeComplexity || 'O(V + E)'}
                </div>
              </div>
              <div className="p-3 border border-neutral-300 bg-neutral-50">
                <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  ĐỘ PHỨC TẠP BỘ NHỚ
                </div>
                <div className="text-sm font-bold text-black mt-1">
                  {algorithm.spaceComplexity || 'O(V)'}
                </div>
              </div>
            </div>
          )}

          {/* Full Mechanism Description */}
          {algorithm.fullDesc && (
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-black mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 bg-black inline-block" />
                NGUYÊN LÝ HOẠT ĐỘNG & BẢN CHẤT
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-sans">
                {algorithm.fullDesc}
              </p>
            </div>
          )}

          {/* Pros & Cons Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {algorithm.pros && algorithm.pros.length > 0 && (
              <div className="border border-black p-3 bg-white">
                <div className="text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> ƯU ĐIỂM CHIẾN THUẬT
                </div>
                <ul className="space-y-1.5 text-xs text-neutral-700 font-sans">
                  {algorithm.pros.map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-neutral-400 shrink-0">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {algorithm.cons && algorithm.cons.length > 0 && (
              <div className="border border-black p-3 bg-white">
                <div className="text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="text-amber-600 font-bold">⚠</span> HẠN CHẾ & BẪY MÊ CUNG
                </div>
                <ul className="space-y-1.5 text-xs text-neutral-700 font-sans">
                  {algorithm.cons.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-neutral-400 shrink-0">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-3">
          {algorithm.isCustom && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn thuật toán "${algorithm.name}" khỏi danh sách?`)) {
                  onDelete(algorithm.id);
                  onClose();
                }
              }}
              className="px-3.5 py-1.5 border border-rose-600 text-rose-600 font-mono font-bold text-xs hover:bg-rose-600 hover:text-white transition flex items-center gap-1.5"
              title="Xóa thuật toán cá nhân này"
            >
              <span>✕</span> XÓA THUẬT TOÁN NÀY
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-5 py-1.5 border border-black bg-black text-white font-mono font-bold text-xs hover:bg-neutral-800 transition"
          >
            ĐÃ HIỂU [ĐÓNG]
          </button>
        </div>
      </div>
    </div>
  );
};

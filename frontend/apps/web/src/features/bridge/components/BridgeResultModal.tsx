import React from 'react';

interface BridgeResultModalProps {
  isOpen: boolean;
  status: 'success' | 'fallen';
  totalCost: number;
  budget: number;
  threeStarBudget: number;
  twoStarBudget: number;
  onRetry: () => void;
  onNextLevel?: () => void;
  hasNextLevel: boolean;
}

export const BridgeResultModal: React.FC<BridgeResultModalProps> = ({
  isOpen,
  status,
  totalCost,
  budget,
  threeStarBudget,
  twoStarBudget,
  onRetry,
  onNextLevel,
  hasNextLevel,
}) => {
  if (!isOpen) return null;

  const isSuccess = status === 'success';

  const getStars = () => {
    if (!isSuccess) return 0;
    if (totalCost <= threeStarBudget) return 3;
    if (totalCost <= twoStarBudget) return 2;
    return 1;
  };

  const stars = getStars();
  const savedBudget = Math.max(0, budget - totalCost);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="max-w-md w-full border-2 border-black bg-white p-6 space-y-5 shadow-2xl text-black">
        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div
            className={`text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 inline-block border ${
              isSuccess
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-rose-600 bg-rose-50 text-rose-800'
            }`}
          >
            {isSuccess ? 'THỬ TẢI THÀNH CÔNG' : 'CẦU BỊ GÃY SẬP'}
          </div>

          <h2 className="text-2xl font-black uppercase text-black font-sans">
            {isSuccess ? 'Xe Đã Vượt Cầu An Toàn' : 'Kết Cấu Vượt Quá Tải Trọng'}
          </h2>

          <p className="text-xs font-sans text-neutral-600">
            {isSuccess
              ? 'Chiếc xe đã vượt qua nhịp cầu thành công mà không gây đứt gãy kết cấu vượt quá giới hạn an toàn.'
              : 'Ứng suất kéo hoặc nén vượt ngưỡng cho phép của vật liệu đã làm gãy thanh chịu lực chính.'}
          </p>
        </div>

        {/* Stars Display for Success */}
        {isSuccess && (
          <div className="flex justify-center items-center gap-1 text-4xl py-1">
            <span className={stars >= 1 ? 'text-amber-500' : 'text-neutral-300'}>★</span>
            <span className={stars >= 2 ? 'text-amber-500' : 'text-neutral-300'}>★</span>
            <span className={stars >= 3 ? 'text-amber-500' : 'text-neutral-300'}>★</span>
          </div>
        )}

        {/* Cost & Savings Summary */}
        <div className="border border-neutral-300 bg-neutral-50 p-4 space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-neutral-500">Ngân sách quy định:</span>
            <span className="font-bold text-black">${budget.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Chi phí thi công:</span>
            <span className="font-bold text-black">${totalCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-1.5">
            <span className="text-emerald-700 font-bold">Tiết kiệm được:</span>
            <span className="font-bold text-emerald-700 font-mono">
              +${savedBudget.toLocaleString()} ({Math.round((savedBudget / budget) * 100)}%)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {isSuccess && hasNextLevel && onNextLevel && (
            <button
              type="button"
              onClick={onNextLevel}
              className="w-full py-2.5 bg-black text-white hover:bg-neutral-800 text-xs font-mono font-bold uppercase tracking-wider transition"
            >
              TIẾP TỤC MÀN KẾ TIẾP →
            </button>
          )}

          <button
            type="button"
            onClick={onRetry}
            className={`w-full py-2.5 text-xs font-mono font-bold uppercase tracking-wider border border-black transition ${
              isSuccess ? 'bg-white hover:bg-neutral-100 text-black' : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            {isSuccess ? 'TỐI ƯU HÓA CHI PHÍ LẦN NỮA' : 'QUAY LẠI THIẾT KẾ & SỬA CẦU'}
          </button>
        </div>
      </div>
    </div>
  );
};

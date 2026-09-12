import React, { useState } from 'react';
import { MaterialType } from '../physics/bridgeTypes';
import { SHOP_PARTS, ShopPart } from '../physics/bridgeShop';

interface BridgeToolbarProps {
  selectedMaterial: MaterialType;
  onSelectMaterial: (mat: MaterialType) => void;
  selectedPart: ShopPart | null;
  onSelectPart: (part: ShopPart) => void;
  activeTool: 'build' | 'delete';
  onSelectTool: (tool: 'build' | 'delete') => void;
  isSimulating: boolean;
  onStartSimulation: () => void;
  onResetSimulation: () => void;
  onClearAll: () => void;
  onAutoDeck: () => void;
  onOpenGuide: () => void;
  onLoadSample: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  totalCost: number;
  budget: number;
  threeStarBudget: number;
  twoStarBudget: number;
}

type CategoryTab = 'ALL' | 'ROAD' | 'WOOD' | 'STEEL' | 'CABLE';

export const BridgeToolbar: React.FC<BridgeToolbarProps> = ({
  selectedPart,
  onSelectPart,
  activeTool,
  onSelectTool,
  isSimulating,
  onStartSimulation,
  onResetSimulation,
  onClearAll,
  onAutoDeck,
  onOpenGuide,
  onLoadSample,
  snapToGrid,
  onToggleSnap,
  totalCost,
  budget,
  threeStarBudget,
  twoStarBudget,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('ALL');

  const isOverBudget = totalCost > budget;
  const costPercentage = Math.min(100, Math.round((totalCost / budget) * 100));

  const getStars = () => {
    if (isOverBudget) return 0;
    if (totalCost <= threeStarBudget) return 3;
    if (totalCost <= twoStarBudget) return 2;
    return 1;
  };

  const stars = getStars();

  const filteredParts = SHOP_PARTS.filter((part) => {
    if (activeTab === 'ALL') return true;
    return part.category === activeTab;
  });

  return (
    <div className="border border-black bg-white p-5 space-y-4 text-black">
      {/* 1. Budget & Project Status Strip */}
      <div className="p-3 bg-neutral-50 border border-neutral-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
              NGÂN SÁCH:
            </span>
            <span className="font-mono font-bold text-sm text-black">
              ${totalCost.toLocaleString()} / ${budget.toLocaleString()}
            </span>
            {isOverBudget ? (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-rose-600 text-white">
                VƯỢT ${ (totalCost - budget).toLocaleString() }
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-700 text-white">
                DƯ ${ (budget - totalCost).toLocaleString() }
              </span>
            )}
          </div>

          <div className="w-52 sm:w-64 h-1.5 bg-neutral-200 border border-neutral-300 overflow-hidden">
            <div
              className={`h-full ${
                isOverBudget
                  ? 'bg-rose-600'
                  : costPercentage > 85
                  ? 'bg-amber-600'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${costPercentage}%` }}
            />
          </div>
        </div>

        {/* Stars Ranking */}
        <div className="flex flex-col items-end gap-0.5 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-500">
              ĐÁNH GIÁ:
            </span>
            <div className="flex text-sm font-bold">
              <span className={stars >= 1 ? 'text-amber-500' : 'text-neutral-300'}>★</span>
              <span className={stars >= 2 ? 'text-amber-500' : 'text-neutral-300'}>★</span>
              <span className={stars >= 3 ? 'text-amber-500' : 'text-neutral-300'}>★</span>
            </div>
          </div>
          <span className="text-[10px] text-neutral-400">
            3★: ≤${threeStarBudget.toLocaleString()} · 2★: ≤${twoStarBudget.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 2. Cửa Hàng Bán Mảnh Ghép Kết Cấu (Part Shop) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
            CỬA HÀNG MẢNH GHÉP KẾT CẤU
          </h3>
          <span className="text-[10px] font-mono text-neutral-500">
            Kích thước & giá định sẵn
          </span>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 text-[11px] font-mono font-bold">
          {(
            [
              { key: 'ALL', label: 'TẤT CẢ' },
              { key: 'ROAD', label: 'MẶT ĐƯỜNG' },
              { key: 'WOOD', label: 'DẦM GỖ' },
              { key: 'STEEL', label: 'KHUNG THÉP' },
              { key: 'CABLE', label: 'DÂY CÁP' },
            ] as { key: CategoryTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 border transition-colors ${
                activeTab === tab.key
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-300 bg-white text-neutral-600 hover:border-black hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Parts Shelf Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
          {filteredParts.map((part) => {
            const isSelected = selectedPart?.id === part.id && activeTool === 'build';

            return (
              <button
                key={part.id}
                type="button"
                disabled={isSimulating}
                onClick={() => {
                  onSelectTool('build');
                  onSelectPart(part);
                }}
                className={`p-2.5 text-left border transition-colors ${
                  isSelected
                    ? 'border-2 border-black bg-black text-white'
                    : 'border border-neutral-300 bg-white hover:border-black text-black'
                } ${isSimulating ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-sans font-bold truncate">
                    {part.name}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1 py-0.2 ${
                      isSelected
                        ? 'bg-neutral-800 text-neutral-200'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {part.lengthMeters}m
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <span
                    className={`font-mono font-bold text-xs ${
                      isSelected ? 'text-emerald-400' : 'text-emerald-700'
                    }`}
                  >
                    ${part.price.toLocaleString()}
                  </span>
                  <span
                    className={`text-[9px] font-mono ${
                      isSelected ? 'text-neutral-300' : 'text-neutral-400'
                    }`}
                  >
                    {part.strengthBadge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tiện Ích */}
      <div className="pt-3 border-t border-black flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={isSimulating}
            onClick={onAutoDeck}
            className="px-3 py-1.5 bg-black text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Tự động nối phẳng mặt đường nhịp cầu"
          >
            TRẢI MẶT CẦU
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={onLoadSample}
            className="px-3 py-1.5 border border-black bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-mono font-bold uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Nạp kết cấu giàn tam giác mẫu chuẩn kỹ sư"
          >
            CẦU MẪU
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            className="px-3 py-1.5 border border-neutral-300 hover:border-black text-black text-xs font-mono font-bold uppercase tracking-wider transition"
            title="Xem hướng dẫn nguyên lý kết cấu"
          >
            HƯỚNG DẪN
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={() => onSelectTool('delete')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition ${
              activeTool === 'delete'
                ? 'border-rose-600 bg-rose-600 text-white'
                : 'border-neutral-300 bg-white hover:border-black text-neutral-700'
            }`}
          >
            XÓA THANH
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={onToggleSnap}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition ${
              snapToGrid
                ? 'border-black bg-black text-white'
                : 'border-neutral-300 bg-white text-neutral-400 hover:border-black hover:text-black'
            }`}
          >
            LƯỚI: {snapToGrid ? 'BẬT' : 'TẮT'}
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={onClearAll}
            className="px-2 py-1.5 text-xs font-mono font-bold uppercase text-neutral-400 hover:text-rose-600 transition"
          >
            XÓA HẾT
          </button>
        </div>

        <div>
          {!isSimulating ? (
            <button
              type="button"
              onClick={onStartSimulation}
              disabled={isOverBudget}
              className="px-5 py-2 bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-mono font-bold uppercase tracking-wider transition"
            >
              BẮT ĐẦU THỬ TẢI →
            </button>
          ) : (
            <button
              type="button"
              onClick={onResetSimulation}
              className="px-5 py-2 border border-black bg-white hover:bg-neutral-100 text-black text-xs font-mono font-bold uppercase tracking-wider transition"
            >
              DỪNG & SỬA [■]
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

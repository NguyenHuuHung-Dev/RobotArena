import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useSimulationStore } from '../../stores/simulationStore';
import { MAZE_ALGORITHM_TEMPLATES, validateAlgorithmCode } from '../../stores/editorStore';

interface AddAlgorithmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAlgorithmModal: React.FC<AddAlgorithmModalProps> = ({ isOpen, onClose }) => {
  const { addCustomAlgorithm } = useSimulationStore();

  const [name, setName] = useState('Thuật toán của tôi');
  const [color, setColor] = useState('#000000');
  const [selectedTemplate, setSelectedTemplate] = useState('turn_astar');
  const [code, setCode] = useState(MAZE_ALGORITHM_TEMPLATES.turn_astar.code);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedTemplate(key);
    setValidationError(null);
    const tpl = MAZE_ALGORITHM_TEMPLATES[key];
    if (tpl) {
      setCode(tpl.code);
    }
  };

  const handleSave = () => {
    setValidationError(null);
    const validation = validateAlgorithmCode(code);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Mã nguồn không hợp lệ.');
      return;
    }

    const id = `custom_${Date.now()}`;
    addCustomAlgorithm({
      id,
      name: name.trim() || 'Thuật toán tùy chỉnh',
      shortDesc: 'Do lập trình viên tự định nghĩa',
      color,
      code,
      isCustom: true,
    });
    onClose();
  };

  const presetColors = ['#000000', '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white border-2 border-black w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="border-b-2 border-black p-4 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight uppercase text-black font-sans">
              Thêm Thuật Toán Tìm Đường Mới
            </h2>
            <p className="text-xs text-neutral-500">
              Lập trình logic tìm đường bằng TypeScript và đưa trực tiếp vào đấu trường mê cung
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm font-mono font-bold border border-black hover:bg-black hover:text-white transition"
          >
            ĐÓNG [×]
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="border-b border-neutral-300 p-4 bg-neutral-50 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="block text-neutral-600 font-semibold mb-1 uppercase">Tên thuật toán:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-black px-3 py-1.5 text-black font-sans font-medium focus:outline-none"
              placeholder="VD: A* Siêu tốc..."
            />
          </div>

          <div>
            <label className="block text-neutral-600 font-semibold mb-1 uppercase">Mẫu tham khảo ban đầu:</label>
            <select
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="w-full bg-white border border-black px-3 py-1.5 text-black focus:outline-none cursor-pointer"
            >
              {Object.entries(MAZE_ALGORITHM_TEMPLATES).map(([key, tpl]) => (
                <option key={key} value={key}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-neutral-600 font-semibold mb-1 uppercase">Màu đại diện:</label>
            <div className="flex items-center gap-2 mt-1">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 border ${
                    color === c ? 'border-2 border-black scale-110 shadow-sm' : 'border-neutral-300'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-6 h-6 p-0 border border-black cursor-pointer bg-transparent"
                title="Chọn màu khác"
              />
            </div>
          </div>
        </div>

        {validationError && (
          <div className="bg-rose-50 border-b border-rose-300 p-3 text-xs font-mono text-rose-800 flex items-start gap-2">
            <span className="font-bold text-rose-600 shrink-0 text-sm">⚠</span>
            <div className="leading-relaxed font-semibold">{validationError}</div>
          </div>
        )}

        {/* Monaco Editor */}
        <div className="flex-1 bg-white border-b border-black">
          <Editor
            height="100%"
            defaultLanguage="typescript"
            theme="vs"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              fontFamily: "'JetBrains Mono', Consolas, monospace",
            }}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 flex items-center justify-between bg-neutral-50 text-xs font-mono">
          <span className="text-neutral-500">
            Hàm `onStep(sensor)` sẽ được gọi ở mỗi nhịp mô phỏng để robot quyết định nước đi kế tiếp.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-black text-black bg-white hover:bg-neutral-100 uppercase font-bold"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-black text-white hover:bg-neutral-800 uppercase font-bold tracking-wider shadow-sm transition"
            >
              Lưu & Tham Gia Đua →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

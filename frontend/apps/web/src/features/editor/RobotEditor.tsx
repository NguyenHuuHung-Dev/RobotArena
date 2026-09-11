import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore, MAZE_ALGORITHM_TEMPLATES, validateAlgorithmCode } from '../../stores/editorStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { useNavigate } from 'react-router-dom';

export const RobotEditor: React.FC = () => {
  const {
    code,
    robotName,
    selectedTemplate,
    isCompiling,
    statusMessage,
    setCode,
    setRobotName,
    setSelectedTemplate,
    setIsCompiling,
    setStatusMessage,
    resetToDefault,
  } = useEditorStore();

  const { addCustomAlgorithm, algorithmsList, removeAlgorithm } = useSimulationStore();
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedCustomId, setSelectedCustomId] = useState<string | null>(null);
  const navigate = useNavigate();

  const customAlgorithms = algorithmsList.filter((a) => a.isCustom && a.code);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
    setSelectedCustomId(null);
    setNotification(null);
  };

  const handleCompile = (): boolean => {
    setIsCompiling(true);
    setStatusMessage('Đang kiểm tra an toàn & cú pháp thuật toán...');
    setNotification(null);

    const validation = validateAlgorithmCode(code);
    setIsCompiling(false);

    if (!validation.isValid) {
      const errMsg = validation.error || 'Mã nguồn không hợp lệ.';
      setStatusMessage(errMsg);
      setNotification({ text: errMsg, type: 'error' });
      return false;
    }

    setStatusMessage('Kiểm tra thành công! Thuật toán chuẩn công bằng (Fair Play) và sẵn sàng thi đấu.');
    setNotification({
      text: 'Thuật toán hợp lệ! Đã vượt qua kiểm duyệt chống gian lận (Anti-Cheat).',
      type: 'success',
    });
    return true;
  };

  const handleDeployToMaze = () => {
    const isValid = handleCompile();
    if (!isValid) return;

    addCustomAlgorithm({
      id: `dev_${Date.now()}`,
      name: robotName || 'Thuật toán Dev',
      shortDesc: 'Viết từ Trình soạn thảo',
      color: '#000000',
      code,
      isCustom: true,
    });
    setTimeout(() => {
      navigate('/arena');
    }, 250);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-3 font-sans">
      {/* Editor Top Bar - Sharp Geometric Minimalist */}
      <div className="border border-black bg-white p-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-neutral-600">Tên thuật toán:</span>
            <input
              type="text"
              value={robotName}
              onChange={(e) => setRobotName(e.target.value)}
              className="bg-neutral-50 border border-black px-3 py-1 text-xs font-semibold text-black focus:outline-none"
            />
          </div>

          {/* Template Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-neutral-600">Mẫu có sẵn:</span>
            <select
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="bg-neutral-50 border border-black px-3 py-1 text-xs font-semibold text-black focus:outline-none cursor-pointer"
            >
              {Object.entries(MAZE_ALGORITHM_TEMPLATES).map(([key, tpl]) => (
                <option key={key} value={key}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Saved Algorithms Selector */}
          {customAlgorithms.length > 0 && (
            <div className="flex items-center gap-1.5 border-l border-neutral-300 pl-3">
              <span className="text-xs font-mono font-bold uppercase text-rose-700">Code đã lưu:</span>
              <select
                value={selectedCustomId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const found = customAlgorithms.find((a) => a.id === val);
                  if (found && found.code) {
                    setCode(found.code);
                    setRobotName(found.name);
                    setSelectedCustomId(val);
                    setNotification({ text: `Đã tải thuật toán "${found.name}".`, type: 'success' });
                  }
                }}
                className="bg-rose-50 border border-rose-300 px-2 py-1 text-xs font-mono font-semibold text-black focus:outline-none cursor-pointer"
              >
                <option value="">-- Chọn thuật toán ({customAlgorithms.length}) --</option>
                {customAlgorithms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {selectedCustomId && (
                <button
                  type="button"
                  onClick={() => {
                    const target = customAlgorithms.find((a) => a.id === selectedCustomId);
                    if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn thuật toán "${target?.name || ''}"?`)) {
                      removeAlgorithm(selectedCustomId);
                      setSelectedCustomId(null);
                      setNotification({ text: 'Đã xóa thuật toán thành công.', type: 'success' });
                    }
                  }}
                  className="px-2 py-1 border border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-mono font-bold transition"
                  title="Xóa thuật toán cá nhân này"
                >
                  ✕ XÓA
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-xs font-bold">
          <button
            onClick={resetToDefault}
            className="px-3 py-1.5 border border-black bg-white hover:bg-neutral-100 uppercase"
          >
            Đặt lại mã gốc
          </button>

          <button
            onClick={handleCompile}
            disabled={isCompiling}
            className="px-4 py-1.5 border border-black bg-neutral-100 hover:bg-neutral-200 uppercase"
          >
            {isCompiling ? 'Đang kiểm tra...' : 'Kiểm tra cú pháp'}
          </button>

          <button
            onClick={handleDeployToMaze}
            className="px-5 py-1.5 bg-black text-white hover:bg-neutral-800 uppercase tracking-wider transition"
          >
            Lưu & Đưa Vào Đua →
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`px-4 py-2 border text-xs font-mono font-medium ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-900 border-green-600'
              : 'bg-red-50 text-red-900 border-red-600'
          }`}
        >
          {notification.text}
        </div>
      )}

      {/* Monaco Editor Container */}
      <div className="flex-1 border-2 border-black bg-white">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme="vs"
          value={code}
          onChange={handleEditorChange}
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

      {/* Footer status bar */}
      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 border-t border-neutral-200 pt-2 px-1">
        <div>Thư viện: @robot-arena/robot-sdk (Hỗ trợ A*, Floodfill, BFS, Tối ưu góc cua)</div>
        <div className="text-black font-semibold">{statusMessage || 'Sẵn sàng lập trình thuật toán'}</div>
      </div>
    </div>
  );
};

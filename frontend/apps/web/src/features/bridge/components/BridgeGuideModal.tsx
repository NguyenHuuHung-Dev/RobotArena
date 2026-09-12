import React from 'react';

interface BridgeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSample: () => void;
}

export const BridgeGuideModal: React.FC<BridgeGuideModalProps> = ({
  isOpen,
  onClose,
  onLoadSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-black bg-white p-6 sm:p-8 space-y-6 shadow-2xl text-black">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-black pb-4">
          <div className="space-y-1">
            <div className="inline-block px-2 py-0.5 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-wider">
              HƯỚNG DẪN KỸ THUẬT KẾT CẤU
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-black font-sans">
              Nguyên Lý Cơ Học & Cấu Trúc Giàn (Truss)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-black px-2.5 py-1 text-xs font-mono font-bold uppercase hover:bg-neutral-100 transition"
          >
            ĐÓNG [×]
          </button>
        </div>

        {/* Question & Technical Reason */}
        <div className="border border-neutral-300 bg-neutral-50 p-4 space-y-2 text-xs">
          <h3 className="font-bold text-black uppercase font-mono tracking-wider">
            VẤN ĐỀ: VÌ SAO MẶT ĐƯỜNG ĐƠN LẬP TỨC GẬP XUỐNG?
          </h3>
          <div className="text-neutral-700 space-y-1.5 leading-relaxed font-sans">
            <p>
              • <strong>Khớp nối tự do (Pin Joints):</strong> Các thanh nối với nhau qua nút đóng vai trò như khớp bản lề xoay tự do. Nếu chỉ đặt một dải mặt đường nằm ngang từ bờ này sang bờ kia, hệ thống không có khả năng chống uốn và sẽ tự do gập xuống theo trọng lực.
            </p>
            <p>
              • <strong>Tải trọng động:</strong> Xe chạy qua tác dụng tải trọng tập trung từ 1.5 đến 8.5 tấn. Cần có hệ thống giàn truyền lực phân tán đều sang các mố đá hai bên vách núi.
            </p>
          </div>
        </div>

        {/* Visual Diagrams: Bad vs Good */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Wrong Design */}
          <div className="border border-black bg-white p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase">
              <span className="text-rose-600">[SAI] KHÔNG CÓ GIÀN</span>
              <span className="text-neutral-400">GẬP KHỚP</span>
            </div>
            <div className="h-28 border border-neutral-200 bg-neutral-50 flex items-center justify-center p-2">
              <svg viewBox="0 0 240 100" className="w-full h-full">
                <rect x="0" y="30" width="30" height="70" fill="#000000" />
                <rect x="210" y="30" width="30" height="70" fill="#000000" />
                <path d="M 30 30 Q 120 85 210 30" fill="none" stroke="#dc2626" strokeWidth="3" strokeDasharray="4 2" />
                <path d="M 120 50 L 120 75 M 115 70 L 120 75 L 125 70" stroke="#dc2626" strokeWidth="2" fill="none" />
                <text x="120" y="92" textAnchor="middle" fontSize="9" fill="#dc2626" fontFamily="monospace" fontWeight="bold">Gập khớp rơi xuống</text>
              </svg>
            </div>
            <p className="text-[11px] text-neutral-600 font-sans">
              Dải mặt đường phẳng không có độ cứng chống uốn, khi có tải trọng sẽ võng và gãy.
            </p>
          </div>

          {/* Right Design */}
          <div className="border border-black bg-white p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase">
              <span className="text-emerald-700">[ĐÚNG] GIÀN TAM GIÁC</span>
              <span className="text-neutral-400">BẤT BIẾN HÌNH</span>
            </div>
            <div className="h-28 border border-neutral-200 bg-neutral-50 flex items-center justify-center p-2">
              <svg viewBox="0 0 240 100" className="w-full h-full">
                <rect x="0" y="30" width="30" height="70" fill="#000000" />
                <rect x="210" y="30" width="30" height="70" fill="#000000" />
                <line x1="30" y1="30" x2="210" y2="30" stroke="#000000" strokeWidth="3.5" />
                <line x1="75" y1="65" x2="165" y2="65" stroke="#b45309" strokeWidth="2.5" />
                <line x1="30" y1="30" x2="75" y2="65" stroke="#b45309" strokeWidth="2" />
                <line x1="75" y1="65" x2="120" y2="30" stroke="#b45309" strokeWidth="2" />
                <line x1="120" y1="30" x2="165" y2="65" stroke="#b45309" strokeWidth="2" />
                <line x1="165" y1="65" x2="210" y2="30" stroke="#b45309" strokeWidth="2" />
                <text x="120" y="88" textAnchor="middle" fontSize="9" fill="#047857" fontFamily="monospace" fontWeight="bold">Tam giác phân tán lực</text>
              </svg>
            </div>
            <p className="text-[11px] text-neutral-600 font-sans">
              Các thanh giằng tạo thành hệ tam giác khóa cứng góc quay, phân tán lực đều vào mố đá.
            </p>
          </div>
        </div>

        {/* 3 Steps */}
        <div className="space-y-2">
          <div className="text-xs font-mono font-bold uppercase text-black">
            QUY TRÌNH THIẾT KẾ:
          </div>
          <div className="border border-neutral-300 divide-y divide-neutral-200 text-xs font-sans">
            <div className="p-3 flex items-start gap-3">
              <span className="font-mono font-bold text-black shrink-0">[01]</span>
              <div>
                <strong className="text-black font-bold">Trải mặt cầu:</strong> Dùng nút [TRẢI MẶT CẦU] để tạo đường phẳng nối liền hai bờ vách đá.
              </div>
            </div>
            <div className="p-3 flex items-start gap-3">
              <span className="font-mono font-bold text-black shrink-0">[02]</span>
              <div>
                <strong className="text-black font-bold">Gia cố giàn tam giác:</strong> Dùng Dầm Gỗ 3m (hoặc Thép) kéo từ các nút mặt cầu xuống tạo hình tam giác liên hoàn bắt vào 2 mố đá.
              </div>
            </div>
            <div className="p-3 flex items-start gap-3">
              <span className="font-mono font-bold text-black shrink-0">[03]</span>
              <div>
                <strong className="text-black font-bold">Sử dụng điểm tựa & cáp treo:</strong> Với các màn có trụ giữa sông hoặc mỏm đá cao, kéo cáp neo xuống giữa cầu để chia tải trọng.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 border-t border-black flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onLoadSample();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-black text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-800 transition"
          >
            NẠP CẦU MẪU THAM KHẢO →
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 border border-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-100 transition"
          >
            TỰ THIẾT KẾ
          </button>
        </div>
      </div>
    </div>
  );
};

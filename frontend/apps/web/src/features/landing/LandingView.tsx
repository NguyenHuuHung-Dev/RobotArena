import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, LeaderboardPlayer } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';
import { HeroLiveRadar } from './HeroLiveRadar';

export const LandingView: React.FC = () => {
  const { user, setAuthModalOpen } = useAuthStore();
  const [topPlayer, setTopPlayer] = useState<LeaderboardPlayer | null>(null);
  const [totalMatches, setTotalMatches] = useState<number>(0);

  useEffect(() => {
    Promise.all([
      apiClient.get<LeaderboardPlayer[]>('/leaderboard').catch(() => ({ data: [] })),
      apiClient.get<any[]>('/trandau').catch(() => ({ data: [] })),
    ]).then(([lbRes, tdRes]) => {
      if (lbRes.data && lbRes.data.length > 0) {
        setTopPlayer(lbRes.data[0]);
      }
      if (tdRes.data) {
        setTotalMatches(tdRes.data.length);
      }
    });
  }, []);

  return (
    <div className="space-y-16 font-sans text-black selection:bg-black selection:text-white">
      {/* Hero Section - 2-Column High-Impact Layout with Live Radar Centerpiece */}
      <section className="border border-black bg-white p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headline, Description & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-neutral-600 bg-neutral-100 border border-neutral-300 px-3 py-1">
              <span>ROBOTARENA · ESPORTS THI ĐẤU LẬP TRÌNH THỜI GIAN THỰC</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-black leading-[1.08] font-sans">
                Đấu Trường Lập Trình <br />
                Giải Thuật Trực Tuyến.
              </h1>
              <p className="text-base sm:text-lg text-neutral-600 font-sans font-normal leading-relaxed max-w-2xl">
                Nơi lập trình viên so tài giải thuật thời gian thực từ 2 đến 5 người. Tối ưu hóa đường đi ngắn nhất, giảm thiểu góc cua và lưu trữ thành tích vĩnh viễn trên Microsoft SQL Server.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2 text-[11px] font-mono font-bold text-neutral-700">
              <span className="px-2.5 py-1 border border-neutral-300 bg-neutral-50">
                ✓ 10s Chọn Thuật Toán Độc Quyền
              </span>
              <span className="px-2.5 py-1 border border-neutral-300 bg-neutral-50">
                ✓ Hiện Tên Người Chơi 5s Trên Chuột
              </span>
              <span className="px-2.5 py-1 border border-neutral-300 bg-neutral-50">
                ✓ Lưu Điểm SQL Server & REST API
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/online"
                className="px-6 py-3.5 bg-black text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-800 transition flex items-center gap-2 shadow-sm"
              >
                CHƠI NGAY: MÊ CUNG 2-5 NGƯỜI →
              </Link>

              <Link
                to="/arena"
                className="px-5 py-3.5 border border-black bg-white text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-100 transition"
              >
                MÔ PHỎNG ĐƠN
              </Link>

              <Link
                to="/editor"
                className="px-5 py-3.5 border border-black bg-white text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-100 transition"
              >
                SOẠN CODE MONACO
              </Link>

              {!user && (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-4 py-3.5 border border-neutral-300 text-neutral-600 text-xs font-mono font-bold uppercase tracking-wider hover:border-black hover:text-black transition"
                >
                  ĐĂNG NHẬP
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Live Animated Interactive Radar Arena Centerpiece */}
          <div className="lg:col-span-5 flex justify-center">
            <HeroLiveRadar />
          </div>
        </div>

        {/* Platform Architecture & Live Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 mt-8 border-t border-neutral-200 text-xs font-mono">
          <div>
            <div className="text-neutral-400 uppercase text-[10px] tracking-wider">BACKEND & SIGNALR</div>
            <div className="font-bold text-black text-sm mt-0.5">.NET 10 Web API</div>
          </div>
          <div>
            <div className="text-neutral-400 uppercase text-[10px] tracking-wider">CƠ SỞ DỮ LIỆU</div>
            <div className="font-bold text-black text-sm mt-0.5">Microsoft SQL Server</div>
          </div>
          <div>
            <div className="text-neutral-400 uppercase text-[10px] tracking-wider">TRẬN ĐẤU ĐÃ LƯU</div>
            <div className="font-bold text-black text-sm mt-0.5">{totalMatches || 1}+ Trận</div>
          </div>
          <div>
            <div className="text-neutral-400 uppercase text-[10px] tracking-wider">QUÁN QUÂN HIỆN TẠI</div>
            <div className="font-bold text-rose-600 text-sm mt-0.5 truncate">
              {topPlayer ? `${topPlayer.tenHienThi} (${topPlayer.soTranThang}W)` : 'Kỵ Sĩ Chuột 01'}
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Game Catalog Section - Extensible for Any Future Game */}
      <section className="space-y-6">
        <div className="border-b border-black pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
              KHO GAME ĐỐI KHÁNG THUẬT TOÁN
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase text-black font-sans">
              Các Bộ Môn Thi Đấu (Game Arenas)
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            Hỗ trợ mở rộng nhiều thể loại game giải thuật khác nhau
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Game 1: Active Micromouse */}
          <div className="border-2 border-black bg-white p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-black text-white uppercase tracking-wider">
                  ĐANG MỞ · 2 - 5 NGƯỜI
                </span>
                <span className="text-xs font-mono text-neutral-400 font-bold">GAME #01</span>
              </div>

              <h3 className="text-xl font-bold uppercase text-black font-sans">
                Mê Cung Siêu Tốc (Micromouse)
              </h3>

              <p className="text-xs font-sans text-neutral-600 leading-relaxed">
                Robot chuột đua giải mê cung, giải quyết ngõ cụt quay lui, tối ưu hóa góc cua mượt mà 60 FPS. Tích hợp Micromouse Flood Fill, A* Phạt Cua, DFS Trémaux hoặc tự viết code.
              </p>

              <div className="text-[11px] font-mono text-neutral-500 space-y-1 pt-1">
                <div>• Đồng bộ: <strong>SignalR WebSocket</strong></div>
                <div>• Thời gian chuẩn bị: <strong>10 Giây</strong></div>
                <div>• Chọn thuật toán: <strong>Độc quyền (không trùng)</strong></div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex gap-2">
              <Link
                to="/online"
                className="flex-1 py-2 bg-black text-white text-center text-xs font-mono font-bold uppercase hover:bg-neutral-800 transition"
              >
                VÀO ĐUA ONLINE →
              </Link>
              <Link
                to="/arena"
                className="px-3 py-2 border border-black text-center text-xs font-mono font-bold uppercase hover:bg-neutral-100 transition"
                title="Xem mô phỏng đơn"
              >
                MÔ PHỎNG
              </Link>
            </div>
          </div>

          {/* Game 2: Upcoming Battle Tank AI */}
          <div className="border border-neutral-300 bg-neutral-50/70 p-6 flex flex-col justify-between space-y-4 hover:border-black transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-neutral-400 text-neutral-600 uppercase">
                  SẮP RA MẮT · 2 - 4 BOT
                </span>
                <span className="text-xs font-mono text-neutral-400 font-bold">GAME #02</span>
              </div>

              <h3 className="text-xl font-bold uppercase text-black font-sans">
                Xe Tăng Radar AI (Battle Tank)
              </h3>

              <p className="text-xs font-sans text-neutral-600 leading-relaxed">
                Đấu trường xe tăng lập trình bắn súng sinh tồn. Viết logic điều khiển radar quét vị trí đối thủ, tính góc nòng súng bắn đón đầu và né đạn phản xạ từ tường chắn.
              </p>

              <div className="text-[11px] font-mono text-neutral-500 space-y-1 pt-1">
                <div>• Chế độ: <strong>Đấu vòng tròn & Sinh tồn</strong></div>
                <div>• Cảm biến: <strong>Radar 360 độ</strong></div>
                <div>• Trạng thái: <strong>Đang phát triển API</strong></div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <button
                disabled
                className="w-full py-2 border border-neutral-300 bg-neutral-100 text-neutral-400 text-xs font-mono font-bold uppercase cursor-not-allowed"
              >
                BẢN THỬ NGHIỆM (SẮP CÓ)
              </button>
            </div>
          </div>

          {/* Game 3: Upcoming Autonomous Racing */}
          <div className="border border-neutral-300 bg-neutral-50/70 p-6 flex flex-col justify-between space-y-4 hover:border-black transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-neutral-400 text-neutral-600 uppercase">
                  SẮP RA MẮT · ĐUA TỐC ĐỘ
                </span>
                <span className="text-xs font-mono text-neutral-400 font-bold">GAME #03</span>
              </div>

              <h3 className="text-xl font-bold uppercase text-black font-sans">
                Đua Xe Tự Hành (Autonomous Cup)
              </h3>

              <p className="text-xs font-sans text-neutral-600 leading-relaxed">
                Đua xe thể thao tự hành trên sa hình đua F1. Thuật toán tối ưu hóa vận tốc cực đại ở đoạn thẳng và bộ điều khiển góc cua bám sát dây cung đường chạy (Apex Line).
              </p>

              <div className="text-[11px] font-mono text-neutral-500 space-y-1 pt-1">
                <div>• Chế độ: <strong>Time Attack & Đua đối đầu</strong></div>
                <div>• Điều khiển: <strong>Gia tốc & Góc lái PID</strong></div>
                <div>• Trạng thái: <strong>Lên kế hoạch sa hình</strong></div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <button
                disabled
                className="w-full py-2 border border-neutral-300 bg-neutral-100 text-neutral-400 text-xs font-mono font-bold uppercase cursor-not-allowed"
              >
                BẢN THỬ NGHIỆM (SẮP CÓ)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Pillars Section */}
      <section className="border border-black bg-white p-8 space-y-6">
        <div className="border-b border-black pb-3">
          <div className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
            KIẾN TRÚC & TÍNH NĂNG NỀN TẢNG
          </div>
          <h2 className="text-2xl font-extrabold uppercase text-black font-sans">
            Tại Sao Chọn RobotArena?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-neutral-400">01 / THỜI GIAN THỰC</div>
            <h4 className="font-bold text-base uppercase text-black">Đấu Online 2 Đến 5 Người</h4>
            <p className="text-xs font-sans text-neutral-600 leading-relaxed">
              Phòng đấu SignalR WebSocket kết nối tức thì. Mỗi người có 10 giây chuẩn bị, quy tắc chọn giải thuật độc quyền và tên người chơi hiển thị định kỳ trên đầu robot khi thi đấu.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-neutral-400">02 / SÁNG TẠO GIẢI THUẬT</div>
            <h4 className="font-bold text-base uppercase text-black">Monaco Code Editor</h4>
            <p className="text-xs font-sans text-neutral-600 leading-relaxed">
              Trình biên soạn code thông minh tích hợp sẵn. Lập trình viên có thể tùy biến giải thuật tìm đường riêng, thử nghiệm trực tiếp trên mê cung và tranh tài cùng bạn bè.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-neutral-400">03 / MINH BẠCH & VĨNH VIỄN</div>
            <h4 className="font-bold text-base uppercase text-black">Lưu Trữ SQL Server</h4>
            <p className="text-xs font-sans text-neutral-600 leading-relaxed">
              Hệ thống lưu trữ từng bước đi, số lần rẽ, thời gian miligiây vào database Microsoft SQL Server qua RESTful API. Tự động tính toán điểm kinh nghiệm, tỷ lệ thắng và thăng cấp người chơi.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

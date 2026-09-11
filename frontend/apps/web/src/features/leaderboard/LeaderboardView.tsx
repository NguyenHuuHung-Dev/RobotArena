import React, { useEffect, useState } from 'react';
import { apiClient, LeaderboardPlayer, RecentMatchRecord } from '../../services/api';

export const LeaderboardView: React.FC = () => {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pRes, mRes] = await Promise.all([
        apiClient.get<LeaderboardPlayer[]>('/leaderboard'),
        apiClient.get<RecentMatchRecord[]>('/leaderboard/recent'),
      ]);
      setPlayers(pRes.data);
      setRecentMatches(mRes.data);
    } catch (e) {
      console.error('Failed to load SQL Server leaderboard', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 font-sans">
      <div className="border-b border-black pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-1">
            DỮ LIỆU THỜI GIAN THỰC · MICROSOFT SQL SERVER
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-black font-sans uppercase">
            Bảng Xếp Hạng & Lịch Sử Đấu
          </h2>
          <p className="text-sm text-neutral-600 font-serif italic mt-1">
            Xếp hạng người chơi và robot dựa trên số trận thắng, cấp độ và tỷ lệ chiến thắng đối đầu.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 bg-black text-white text-xs font-mono font-bold uppercase hover:bg-neutral-800 transition"
        >
          [LÀM MỚI DỮ LIỆU]
        </button>
      </div>

      {/* Top Players Table */}
      <div className="border-2 border-black bg-white overflow-hidden">
        <div className="bg-neutral-100 p-3 border-b border-black flex items-center justify-between">
          <span className="font-mono text-xs font-bold uppercase text-black">
            BẢNG XẾP HẠNG CAO THỦ (TOP RACERS)
          </span>
          <span className="text-[10px] font-mono text-neutral-500">CƠ SỞ DỮ LIỆU: RobotArenaDB</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white border-b border-neutral-300 uppercase font-bold text-neutral-600">
              <tr>
                <th className="py-3 px-4 text-center w-16">HẠNG</th>
                <th className="py-3 px-4">NGƯỜI CHƠI</th>
                <th className="py-3 px-4 text-center">CẤP ĐỘ</th>
                <th className="py-3 px-4 text-right">SỐ TRẬN</th>
                <th className="py-3 px-4 text-right">CHIẾN THẮNG</th>
                <th className="py-3 px-4 text-right">TỶ LỆ THẮNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {players.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-400">
                    {isLoading ? 'Đang tải dữ liệu từ SQL Server...' : 'Chưa có dữ liệu người chơi.'}
                  </td>
                </tr>
              ) : (
                players.map((p, idx) => (
                  <tr key={p.nguoiChoiId} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 text-center font-bold">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-black text-sm flex items-center gap-2">
                      <div
                        className="w-3 h-3 border border-black inline-block shrink-0"
                        style={{ backgroundColor: p.mauSac }}
                      />
                      {p.tenHienThi}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-neutral-700">
                      Cấp {p.capDo}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">{p.soTranDaChoi}</td>
                    <td className="py-3 px-4 text-right font-bold text-black">{p.soTranThang}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {p.tyLeThang}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="border-2 border-black bg-white overflow-hidden">
        <div className="bg-neutral-100 p-3 border-b border-black flex items-center justify-between">
          <span className="font-mono text-xs font-bold uppercase text-black">
            LỊCH SỬ CÁC TRẬN ĐẤU GẦN ĐÂY (thanhtich)
          </span>
          <span className="text-[10px] font-mono text-neutral-500">BẢNG: thanhtich + trandau</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white border-b border-neutral-300 uppercase font-bold text-neutral-600">
              <tr>
                <th className="py-3 px-4">PHÒNG ĐẤU</th>
                <th className="py-3 px-4">NGƯỜI CHƠI</th>
                <th className="py-3 px-4">THUẬT TOÁN</th>
                <th className="py-3 px-4 text-center">XẾP HẠNG</th>
                <th className="py-3 px-4 text-right">THỜI GIAN</th>
                <th className="py-3 px-4 text-right">SỐ BƯỚC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {recentMatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-400">
                    Chưa có trận đấu nào được ghi nhận. Hãy tham gia Đấu Online để lưu thành tích!
                  </td>
                </tr>
              ) : (
                recentMatches.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-black">{m.maPhong}</td>
                    <td className="py-3 px-4 font-sans font-bold text-black flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 border border-black inline-block shrink-0"
                        style={{ backgroundColor: m.mauSac }}
                      />
                      {m.tenHienThi}
                    </td>
                    <td className="py-3 px-4 text-neutral-600">{m.thuatToanSuDung}</td>
                    <td className="py-3 px-4 text-center font-bold text-black">
                      {m.xepHang === 1 ? '🥇 VÔ ĐỊCH' : `HẠNG #${m.xepHang}`}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-neutral-700">
                      {(m.thoiGianHoanThanhMs / 1000).toFixed(2)}s
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">{m.soBuocDi}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

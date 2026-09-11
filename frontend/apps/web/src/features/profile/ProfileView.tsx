import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { apiClient } from '../../services/api';

const COLOR_PALETTE = [
  { label: 'Đen Tuyển', value: '#000000' },
  { label: 'Đỏ Huyết', value: '#dc2626' },
  { label: 'Xanh Lam', value: '#2563eb' },
  { label: 'Lục Bảo', value: '#16a34a' },
  { label: 'Cam Rực', value: '#ea580c' },
  { label: 'Tím Đậm', value: '#9333ea' },
  { label: 'Vàng Đậm', value: '#ca8a04' },
  { label: 'Hồng Fuchsia', value: '#c026d3' },
];

export const ProfileView: React.FC = () => {
  const { user, setAuthModalOpen } = useAuthStore();

  const [playerDetails, setPlayerDetails] = useState<any>(null);
  const [tenHienThi, setTenHienThi] = useState('');
  const [mauSac, setMauSac] = useState('#000000');
  const [email, setEmail] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [matKhauXacNhan, setMatKhauXacNhan] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const res = await apiClient.get(`/nguoichoi/${user.nguoiChoiId}`);
      setPlayerDetails(res.data);
      setTenHienThi(res.data.tenHienThi);
      setMauSac(res.data.mauSac);
    } catch (e) {
      console.error('Failed to fetch player profile', e);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="border-2 border-black bg-white p-8 max-w-md mx-auto text-center space-y-4 font-sans">
        <h3 className="text-lg font-black uppercase">Yêu Cầu Đăng Nhập</h3>
        <p className="text-xs font-mono text-neutral-600">
          Vui lòng đăng nhập để xem và quản lý hồ sơ cá nhân của bạn.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="px-6 py-2.5 bg-black text-white text-xs font-mono font-bold uppercase hover:bg-neutral-800 transition"
        >
          ĐĂNG NHẬP NGAY →
        </button>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      await apiClient.put(`/nguoichoi/${user.nguoiChoiId}`, {
        tenHienThi,
        mauSac,
      });

      if (email) {
        await apiClient.put(`/taikhoan/${user.taiKhoanId}`, {
          email,
        });
      }

      // Update local storage auth user
      const updatedUser = { ...user, tenHienThi, mauSac };
      localStorage.setItem('robotarena_user', JSON.stringify(updatedUser));
      useAuthStore.setState({ user: updatedUser });

      setMessage('Cập nhật thông tin hồ sơ thành công!');
      fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi khi cập nhật hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matKhauMoi) return;
    if (matKhauMoi !== matKhauXacNhan) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      await apiClient.put(`/taikhoan/${user.taiKhoanId}`, {
        matKhauMoi,
      });
      setMessage('Đổi mật khẩu mới thành công!');
      setMatKhauMoi('');
      setMatKhauXacNhan('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi khi đổi mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  const soTran = playerDetails?.soTranDaChoi || user.soTranDaChoi || 0;
  const soThang = playerDetails?.soTranThang || user.soTranThang || 0;
  const tyLeThang = soTran > 0 ? Math.round((soThang / soTran) * 100) : 0;

  return (
    <div className="space-y-8 font-sans selection:bg-black selection:text-white max-w-4xl mx-auto">
      {/* Header Profile Summary */}
      <div className="border-2 border-black bg-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 border-2 border-black flex items-center justify-center font-bold text-white text-xl shadow-xs"
            style={{ backgroundColor: mauSac }}
          >
            {tenHienThi.slice(0, 1).toUpperCase() || 'R'}
          </div>
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
              HỒ SƠ ĐẤU THỦ · CẤP {playerDetails?.capDo || user.capDo}
            </div>
            <h2 className="text-2xl font-black uppercase text-black">{tenHienThi}</h2>
            <div className="text-xs font-mono text-neutral-600 mt-0.5">
              Tên đăng nhập: <strong className="text-black font-bold">@{user.tenDangNhap}</strong>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 border-t sm:border-t-0 sm:border-l border-neutral-200 pt-4 sm:pt-0 sm:pl-6 text-xs font-mono w-full sm:w-auto">
          <div className="p-2 border border-neutral-200 text-center">
            <div className="text-[10px] text-neutral-500 uppercase">SỐ TRẬN</div>
            <div className="text-lg font-black text-black">{soTran}</div>
          </div>
          <div className="p-2 border border-neutral-200 text-center">
            <div className="text-[10px] text-neutral-500 uppercase">CHIẾN THẮNG</div>
            <div className="text-lg font-black text-black">{soThang}</div>
          </div>
          <div className="p-2 border border-neutral-200 text-center">
            <div className="text-[10px] text-neutral-500 uppercase">TỶ LỆ THẮNG</div>
            <div className="text-lg font-black text-rose-600">{tyLeThang}%</div>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 text-xs font-mono text-emerald-800">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border-l-4 border-rose-600 text-xs font-mono text-rose-800">
          ✕ {error}
        </div>
      )}

      {/* Profile Edit Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form 1: General Info */}
        <div className="border border-black bg-white p-6 space-y-4">
          <div className="border-b border-black pb-2">
            <h3 className="font-extrabold text-sm uppercase tracking-wide">
              THÔNG TIN CÁ NHÂN & MÀU ROBOT
            </h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block uppercase font-bold text-neutral-600 mb-1">
                Tên Hiển Thị (Display Name)
              </label>
              <input
                type="text"
                required
                value={tenHienThi}
                onChange={(e) => setTenHienThi(e.target.value)}
                className="w-full px-3 py-2 border border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block uppercase font-bold text-neutral-600 mb-1">
                Email Liên Hệ
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: racer@robotarena.vn"
                className="w-full px-3 py-2 border border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block uppercase font-bold text-neutral-600 mb-2">
                Màu Sắc Đại Diện Robot
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setMauSac(c.value)}
                    className={`flex items-center gap-1.5 p-1.5 border text-[11px] transition ${
                      mauSac === c.value
                        ? 'border-black bg-neutral-100 font-bold'
                        : 'border-neutral-200 hover:border-black'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 border border-black inline-block shrink-0"
                      style={{ backgroundColor: c.value }}
                    />
                    <span className="truncate">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-black text-white font-bold uppercase hover:bg-neutral-800 transition disabled:opacity-50"
              >
                {isLoading ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI HỒ SƠ →'}
              </button>
            </div>
          </form>
        </div>

        {/* Form 2: Change Password */}
        <div className="border border-black bg-white p-6 space-y-4">
          <div className="border-b border-black pb-2">
            <h3 className="font-extrabold text-sm uppercase tracking-wide">
              BẢO MẬT & ĐỔI MẬT KHẨU
            </h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block uppercase font-bold text-neutral-600 mb-1">
                Mật Khẩu Mới
              </label>
              <input
                type="password"
                required
                value={matKhauMoi}
                onChange={(e) => setMatKhauMoi(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block uppercase font-bold text-neutral-600 mb-1">
                Xác Nhận Mật Khẩu Mới
              </label>
              <input
                type="password"
                required
                value={matKhauXacNhan}
                onChange={(e) => setMatKhauXacNhan(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-black focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !matKhauMoi}
                className="w-full py-2.5 border border-black bg-white text-black font-bold uppercase hover:bg-neutral-100 transition disabled:opacity-50"
              >
                {isLoading ? 'ĐANG XỬ LÝ...' : 'CẬP NHẬT MẬT KHẨU →'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Player Match History */}
      <div className="border-2 border-black bg-white overflow-hidden">
        <div className="bg-neutral-100 p-3 border-b border-black flex items-center justify-between">
          <span className="font-mono text-xs font-bold uppercase text-black">
            LỊCH SỬ THI ĐẤU CÁ NHÂN (10 TRẬN GẦN NHẤT)
          </span>
          <span className="text-[10px] font-mono text-neutral-500">DATABASE: thanhtich</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white border-b border-neutral-300 uppercase font-bold text-neutral-600">
              <tr>
                <th className="py-2.5 px-4">TRẬN</th>
                <th className="py-2.5 px-4">THUẬT TOÁN</th>
                <th className="py-2.5 px-4 text-center">XẾP HẠNG</th>
                <th className="py-2.5 px-4 text-right">THỜI GIAN</th>
                <th className="py-2.5 px-4 text-right">SỐ BƯỚC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {playerDetails?.lichSuThanhTich && playerDetails.lichSuThanhTich.length > 0 ? (
                playerDetails.lichSuThanhTich.map((m: any) => (
                  <tr key={m.id} className="hover:bg-neutral-50 transition">
                    <td className="py-2.5 px-4 font-bold">#{m.tranDauId}</td>
                    <td className="py-2.5 px-4 text-neutral-700">{m.thuatToanSuDung}</td>
                    <td className="py-2.5 px-4 text-center font-bold">
                      {m.xepHang === 1 ? '🥇 VÔ ĐỊCH' : `HẠNG #${m.xepHang}`}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {(m.thoiGianHoanThanhMs / 1000).toFixed(2)}s
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold">{m.soBuocDi}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-400">
                    Chưa có lịch sử trận đấu nào. Hãy tham gia Đấu Online ngay!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

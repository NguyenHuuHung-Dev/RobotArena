import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';

const COLOR_OPTIONS = [
  { label: 'Đen Tuyển', value: '#000000' },
  { label: 'Đỏ Huyết', value: '#dc2626' },
  { label: 'Xanh Lam', value: '#2563eb' },
  { label: 'Lục Bảo', value: '#16a34a' },
  { label: 'Cam Rực', value: '#ea580c' },
  { label: 'Tím Đậm', value: '#9333ea' },
];

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen, login, register, isLoading, error } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [tenDangNhap, setTenDangNhap] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [tenHienThi, setTenHienThi] = useState('');
  const [mauSac, setMauSac] = useState('#000000');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await login(tenDangNhap, matKhau);
    } else {
      await register(tenDangNhap, matKhau, tenHienThi, mauSac);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border-2 border-black p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-black" />
            <h3 className="font-extrabold text-base tracking-tight uppercase">
              {mode === 'login' ? 'ĐĂNG NHẬP ROBOTARENA' : 'ĐĂNG KÝ TÀI KHOẢN MỚI'}
            </h3>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="w-7 h-7 flex items-center justify-center border border-black font-mono text-sm hover:bg-black hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-0 border border-black text-xs font-mono font-bold uppercase">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 text-center transition ${
              mode === 'login' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 text-center transition ${
              mode === 'register' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            Tạo Tài Khoản
          </button>
        </div>

        {error && (
          <div className="p-3 bg-neutral-100 border-l-4 border-rose-600 text-xs font-mono text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block uppercase font-bold text-neutral-600 mb-1">Tên Đăng Nhập</label>
            <input
              type="text"
              required
              value={tenDangNhap}
              onChange={(e) => setTenDangNhap(e.target.value)}
              placeholder="VD: robot_master"
              className="w-full px-3 py-2 border border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block uppercase font-bold text-neutral-600 mb-1">Mật Khẩu</label>
            <input
              type="password"
              required
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block uppercase font-bold text-neutral-600 mb-1">Tên Hiển Thị (Racer Name)</label>
                <input
                  type="text"
                  required
                  value={tenHienThi}
                  onChange={(e) => setTenHienThi(e.target.value)}
                  placeholder="VD: Siêu Chuột Bão Tố"
                  className="w-full px-3 py-2 border border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block uppercase font-bold text-neutral-600 mb-1">Màu Đại Diện Robot</label>
                <div className="flex gap-2 items-center">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setMauSac(c.value)}
                      style={{ backgroundColor: c.value }}
                      className={`w-7 h-7 border transition-all ${
                        mauSac === c.value ? 'ring-2 ring-offset-2 ring-black scale-110' : 'border-neutral-300'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-black text-white font-bold uppercase tracking-wider hover:bg-neutral-800 transition disabled:opacity-50"
            >
              {isLoading
                ? 'ĐANG XỬ LÝ...'
                : mode === 'login'
                ? 'XÁC NHẬN ĐĂNG NHẬP →'
                : 'HOÀN TẤT ĐĂNG KÝ →'}
            </button>
          </div>
        </form>

        <div className="text-[11px] font-mono text-neutral-400 text-center border-t border-neutral-200 pt-3">
          Tài khoản dùng thử: <span className="font-bold text-black">player1</span> / <span className="font-bold text-black">123456</span>
        </div>
      </div>
    </div>
  );
};

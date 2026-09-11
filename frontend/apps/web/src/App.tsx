import React, { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { AuthModal } from './features/auth/AuthModal';

export const App: React.FC = () => {
  const { user, setAuthModalOpen, logout } = useAuthStore();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* Top Header - Streamlined, Responsive, Never Overflowing */}
      <header className="sticky top-0 z-40 border-b border-black bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-baseline gap-2 shrink-0 group">
            <h1 className="font-black text-lg sm:text-xl tracking-tight text-black font-sans uppercase">
              RobotArena<span className="text-rose-600">.</span>
            </h1>
            <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase hidden lg:inline">
              Mê Cung
            </span>
          </Link>

          {/* Clean Primary Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2 text-xs font-mono font-bold uppercase overflow-hidden">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-2.5 py-1.5 transition border shrink-0 ${
                  isActive
                    ? 'border-black bg-black text-white'
                    : 'border-transparent text-neutral-600 hover:text-black hover:border-black'
                }`
              }
            >
              Trang Chủ
            </NavLink>

            <NavLink
              to="/arena"
              className={({ isActive }) =>
                `px-2.5 py-1.5 transition border shrink-0 ${
                  isActive
                    ? 'border-black bg-black text-white'
                    : 'border-transparent text-neutral-600 hover:text-black hover:border-black'
                }`
              }
            >
              Đấu Trường
            </NavLink>

            <NavLink
              to="/online"
              className={({ isActive }) =>
                `px-2.5 py-1.5 transition border shrink-0 ${
                  isActive
                    ? 'border-black bg-black text-white'
                    : 'border-transparent text-neutral-600 hover:text-black hover:border-black'
                }`
              }
            >
              Đấu Online (2-5)
            </NavLink>

            <NavLink
              to="/editor"
              className={({ isActive }) =>
                `px-2.5 py-1.5 transition border shrink-0 hidden md:inline-block ${
                  isActive
                    ? 'border-black bg-black text-white'
                    : 'border-transparent text-neutral-600 hover:text-black hover:border-black'
                }`
              }
            >
              Soạn Code
            </NavLink>

            <NavLink
              to="/leaderboard"
              className={({ isActive }) =>
                `px-2.5 py-1.5 transition border shrink-0 ${
                  isActive
                    ? 'border-black bg-black text-white'
                    : 'border-transparent text-neutral-600 hover:text-black hover:border-black'
                }`
              }
            >
              Bảng Xếp Hạng
            </NavLink>

            {/* Compact More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="px-2 py-1.5 border border-neutral-300 hover:border-black text-[11px] font-mono font-bold flex items-center gap-1 text-neutral-600 hover:text-black"
                title="Tính năng thêm"
              >
                THÊM ▾
              </button>

              {showMoreMenu && (
                <div
                  className="absolute left-0 mt-1 w-44 bg-white border-2 border-black p-1 shadow-lg z-50 text-xs font-mono space-y-1"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <Link
                    to="/editor"
                    className="block px-3 py-1.5 hover:bg-neutral-100 uppercase text-black font-bold md:hidden"
                  >
                    Soạn thảo Code
                  </Link>
                  <Link
                    to="/challenges"
                    className="block px-3 py-1.5 hover:bg-neutral-100 uppercase text-black font-bold"
                  >
                    Thử Thách Mê Cung
                  </Link>
                  <a
                    href="http://localhost:5200/swagger"
                    target="_blank"
                    rel="noreferrer"
                    className="block px-3 py-1.5 hover:bg-neutral-100 uppercase text-emerald-700 font-bold"
                  >
                    [REST] Swagger UI ↗
                  </a>
                </div>
              )}
            </div>
          </nav>

          {/* User Account / Profile Badge */}
          <div className="shrink-0 flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 border border-black p-1 px-2 text-xs font-mono bg-white">
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 hover:opacity-80 transition"
                  title="Xem và chỉnh sửa hồ sơ cá nhân"
                >
                  <div
                    className="w-3 h-3 border border-black inline-block shrink-0"
                    style={{ backgroundColor: user.mauSac }}
                  />
                  <span className="font-bold font-sans text-black truncate max-w-[90px] sm:max-w-[130px]">
                    {user.tenHienThi}
                  </span>
                  <span className="text-[10px] text-neutral-400">C{user.capDo}</span>
                </Link>

                <Link
                  to="/profile"
                  className="px-1.5 py-0.5 bg-neutral-100 hover:bg-black hover:text-white transition text-[10px] font-bold uppercase hidden sm:inline-block"
                >
                  HỒ SƠ
                </Link>

                <button
                  onClick={logout}
                  className="text-[10px] text-neutral-400 hover:text-rose-600 font-bold uppercase transition ml-1"
                  title="Đăng xuất"
                >
                  [THOÁT]
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-3 py-1.5 border border-black bg-black text-white hover:bg-neutral-800 text-xs font-mono font-bold uppercase transition"
              >
                ĐĂNG NHẬP →
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-black py-4 bg-white text-neutral-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>ROBOTARENA · HỆ THỐNG THI ĐẤU THUẬT TOÁN MÊ CUNG (.NET 10 + SQL SERVER)</div>
          <div className="flex items-center gap-3 text-neutral-600">
            <span>2-5 ĐẤU THỦ ONLINE</span>
            <span>·</span>
            <span>10S CHỌN THUẬT TOÁN</span>
            <span>·</span>
            <span>TÊN HIỆN 5S TRÊN CHUỘT</span>
            <span>·</span>
            <span>SIGNALR</span>
          </div>
        </div>
      </footer>

      {/* Global Auth Modal */}
      <AuthModal />
    </div>
  );
};

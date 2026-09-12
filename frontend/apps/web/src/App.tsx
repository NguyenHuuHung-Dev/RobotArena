import React, { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { AuthModal } from './features/auth/AuthModal';
import { SWAGGER_URL } from './services/api';

export const App: React.FC = () => {
  const { user, setAuthModalOpen, logout } = useAuthStore();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* Top Header - Sharp Square, High Contrast, Minimalist */}
      <header className="sticky top-0 z-40 border-b border-black bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <img
              src="/logo.png"
              alt="RobotArena Logo"
              className="w-8 h-8 object-contain group-hover:scale-105 transition-transform"
            />
            <div className="flex items-baseline gap-1.5">
              <h1 className="font-black text-lg sm:text-xl tracking-tight text-neutral-950 font-sans uppercase">
                RobotArena<span className="text-rose-600">.</span>
              </h1>
              <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase hidden lg:inline">
                Arena Platform
              </span>
            </div>
          </Link>

          {/* Clean Primary Navigation */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-mono font-bold uppercase">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 transition-colors ${
                  isActive
                    ? 'bg-black text-white font-bold'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                }`
              }
            >
              Trang Chủ
            </NavLink>

            <NavLink
              to="/arena"
              className={({ isActive }) =>
                `px-3 py-1.5 transition-colors ${
                  isActive
                    ? 'bg-black text-white font-bold'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                }`
              }
            >
              Mê Cung
            </NavLink>

            <NavLink
              to="/online"
              className={({ isActive }) =>
                `px-3 py-1.5 transition-colors ${
                  isActive
                    ? 'bg-black text-white font-bold'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                }`
              }
            >
              Đấu Online
            </NavLink>

            <NavLink
              to="/caro"
              className={({ isActive }) =>
                `px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-black text-white font-bold'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                }`
              }
            >
              <span>Cờ Caro</span>
              <span className="text-[9px] px-1 py-0.2 bg-rose-600 text-white font-mono">
                AI
              </span>
            </NavLink>

            <NavLink
              to="/bridge"
              className={({ isActive }) =>
                `px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-black text-white font-bold'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                }`
              }
            >
              <span>Xây Cầu</span>
              <span className="text-[9px] px-1 py-0.2 bg-emerald-700 text-white font-mono">
                Vật Lý
              </span>
            </NavLink>

            <NavLink
              to="/leaderboard"
              className={({ isActive }) =>
                `px-3 py-1.5 transition-colors ${
                  isActive
                    ? 'bg-black text-white font-bold'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                }`
              }
            >
              Bảng Xếp Hạng
            </NavLink>

            {/* Compact More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="px-2.5 py-1.5 border border-black text-[11px] font-mono font-bold flex items-center gap-1 text-black transition-colors bg-white hover:bg-neutral-100"
                title="Tính năng thêm"
              >
                THÊM ▾
              </button>

              {showMoreMenu && (
                <div
                  className="absolute left-0 mt-1 w-52 bg-white border border-black p-1 shadow-lg z-50 text-xs font-mono space-y-0.5"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <Link
                    to="/editor"
                    className="block px-3 py-1.5 hover:bg-neutral-100 uppercase text-black font-bold transition-colors"
                  >
                    Soạn Code Monaco
                  </Link>
                  <Link
                    to="/challenges"
                    className="block px-3 py-1.5 hover:bg-neutral-100 uppercase text-black font-bold transition-colors"
                  >
                    Thử Thách Mê Cung
                  </Link>
                  <a
                    href={SWAGGER_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="block px-3 py-1.5 hover:bg-neutral-100 uppercase text-emerald-700 font-bold transition-colors"
                  >
                    Swagger UI ↗
                  </a>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Dropdown Toggle for small/tablet screens */}
          <div className="lg:hidden relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="px-2.5 py-1.5 border border-black bg-neutral-50 text-xs font-mono font-bold uppercase flex items-center gap-1"
            >
              <span>MENU</span>
              <span>▾</span>
            </button>

            {showMoreMenu && (
              <div
                className="absolute right-0 mt-1 w-56 bg-white border-2 border-black p-2 shadow-2xl z-50 text-xs font-mono space-y-1"
                onClick={() => setShowMoreMenu(false)}
              >
                <Link to="/" className="block px-3 py-1.5 hover:bg-neutral-100 uppercase font-bold text-black">
                  Trang Chủ
                </Link>
                <Link to="/arena" className="block px-3 py-1.5 hover:bg-neutral-100 uppercase font-bold text-black">
                  Đấu Trường Mê Cung
                </Link>
                <Link to="/online" className="block px-3 py-1.5 hover:bg-neutral-100 uppercase font-bold text-black">
                  Đua Online (2-5)
                </Link>
                <Link to="/caro" className="block px-3 py-1.5 hover:bg-neutral-100 uppercase font-bold text-rose-600 flex items-center justify-between">
                  <span>Cờ Caro AI</span>
                  <span className="text-[9px] px-1 bg-rose-600 text-white font-mono font-bold">MỚI</span>
                </Link>
                <Link to="/bridge" className="block px-3 py-1.5 hover:bg-neutral-100 uppercase font-bold text-emerald-700 flex items-center justify-between">
                  <span>Kỹ Sư Xây Cầu</span>
                  <span className="text-[9px] px-1 bg-emerald-600 text-white font-mono font-bold">MỚI</span>
                </Link>
                <Link to="/leaderboard" className="block px-3 py-1.5 hover:bg-neutral-100 uppercase font-bold text-black">
                  Bảng Xếp Hạng
                </Link>
                <Link to="/editor" className="block px-3 py-1.5 hover:bg-neutral-100 uppercase font-bold text-black">
                  Soạn Code Monaco
                </Link>
                <Link to="/challenges" className="block px-3 py-1.5 hover:bg-neutral-100 uppercase font-bold text-black">
                  Thử Thách Mê Cung
                </Link>
                <a
                  href={SWAGGER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="block px-3 py-1.5 hover:bg-neutral-100 uppercase font-bold text-neutral-500"
                >
                  Swagger UI ↗
                </a>
              </div>
            )}
          </div>

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
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="RobotArena Logo" className="w-4 h-4 object-contain" />
            <span>ROBOTARENA · NỀN TẢNG THI ĐẤU THUẬT TOÁN ĐA NĂNG</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-600">
            <span>MÊ CUNG MULTIPLAYER</span>
            <span>·</span>
            <span>CỜ CARO AI</span>
            <span>·</span>
            <span>XÂY CẦU VẬT LÝ</span>
            <span>·</span>
            <span>.NET 10 + SIGNALR</span>
          </div>
        </div>
      </footer>

      {/* Global Auth Modal */}
      <AuthModal />
    </div>
  );
};

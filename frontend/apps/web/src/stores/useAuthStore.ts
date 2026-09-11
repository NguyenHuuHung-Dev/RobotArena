import { create } from 'zustand';
import { apiClient, AuthUser } from '../services/api';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  login: (tenDangNhap: string, matKhau: string) => Promise<boolean>;
  register: (tenDangNhap: string, matKhau: string, tenHienThi: string, mauSac: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Load initial from localStorage
  const savedUser = localStorage.getItem('robotarena_user');
  let initialUser: AuthUser | null = null;
  if (savedUser) {
    try {
      initialUser = JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('robotarena_user');
    }
  }

  return {
    user: initialUser,
    isLoading: false,
    error: null,
    isAuthModalOpen: false,
    setAuthModalOpen: (open) => set({ isAuthModalOpen: open, error: null }),

    login: async (tenDangNhap, matKhau) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.post<AuthUser>('/auth/login', {
          tenDangNhap,
          matKhau,
        });
        const user = response.data;
        localStorage.setItem('robotarena_token', user.token);
        localStorage.setItem('robotarena_user', JSON.stringify(user));
        set({ user, isLoading: false, isAuthModalOpen: false, error: null });
        return true;
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Đăng nhập thất bại. Kiểm tra lại tài khoản.';
        set({ isLoading: false, error: msg });
        return false;
      }
    },

    register: async (tenDangNhap, matKhau, tenHienThi, mauSac) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.post<AuthUser>('/auth/register', {
          tenDangNhap,
          matKhau,
          tenHienThi,
          mauSac,
        });
        const user = response.data;
        localStorage.setItem('robotarena_token', user.token);
        localStorage.setItem('robotarena_user', JSON.stringify(user));
        set({ user, isLoading: false, isAuthModalOpen: false, error: null });
        return true;
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại.';
        set({ isLoading: false, error: msg });
        return false;
      }
    },

    logout: () => {
      localStorage.removeItem('robotarena_token');
      localStorage.removeItem('robotarena_user');
      set({ user: null });
    },
  };
});

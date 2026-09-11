import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5200/api';
export const HUB_URL = 'http://localhost:5200/hub/arena';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('robotarena_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AuthUser {
  taiKhoanId: number;
  nguoiChoiId: number;
  tenDangNhap: string;
  tenHienThi: string;
  capDo: number;
  diemKinhNghiem: number;
  soTranDaChoi: number;
  soTranThang: number;
  mauSac: string;
  token: string;
}

export interface LeaderboardPlayer {
  nguoiChoiId: number;
  tenHienThi: string;
  capDo: number;
  soTranDaChoi: number;
  soTranThang: number;
  mauSac: string;
  tyLeThang: number;
}

export interface RecentMatchRecord {
  id: number;
  maPhong: string;
  tenHienThi: string;
  mauSac: string;
  thuatToanSuDung: string;
  thoiGianHoanThanhMs: number;
  soBuocDi: number;
  xepHang: number;
  ngayGhiNhan: string;
}

import { MaterialType } from './bridgeTypes';
import { PIXEL_PER_METER } from './materials';

export interface ShopPart {
  id: string;
  name: string;
  category: MaterialType | 'PREFAB';
  materialType: MaterialType;
  lengthMeters: number;
  lengthPixels: number;
  price: number;
  description: string;
  strengthBadge: string;
  isPrefab?: boolean;
}

export const SHOP_PARTS: ShopPart[] = [
  // Nhóm 1: Mặt đường
  {
    id: 'road-2m',
    name: 'Mặt Đường Ngắn',
    category: 'ROAD',
    materialType: 'ROAD',
    lengthMeters: 2.0,
    lengthPixels: 2.0 * PIXEL_PER_METER,
    price: 360,
    description: 'Bản mặt cầu cho xe chạy, nhịp ngắn chịu tải tập trung rất tốt.',
    strengthBadge: 'Nén: 240kN · 2.0m',
  },
  {
    id: 'road-4m',
    name: 'Mặt Đường Chuẩn',
    category: 'ROAD',
    materialType: 'ROAD',
    lengthMeters: 4.0,
    lengthPixels: 4.0 * PIXEL_PER_METER,
    price: 720,
    description: 'Kích thước chuẩn tối ưu nhất để kết nối giữa các bờ vực.',
    strengthBadge: 'Nén: 240kN · 4.0m ★',
  },
  {
    id: 'road-6m',
    name: 'Mặt Đường Dài',
    category: 'ROAD',
    materialType: 'ROAD',
    lengthMeters: 6.0,
    lengthPixels: 6.0 * PIXEL_PER_METER,
    price: 1080,
    description: 'Vượt nhịp rộng nhanh chóng, cần gia cố giàn phụ bên dưới để chống võng.',
    strengthBadge: 'Nén: 240kN · 6.0m',
  },

  // Nhóm 2: Dầm Gỗ
  {
    id: 'wood-2m',
    name: 'Dầm Gỗ Đứng',
    category: 'WOOD',
    materialType: 'WOOD',
    lengthMeters: 2.0,
    lengthPixels: 2.0 * PIXEL_PER_METER,
    price: 180,
    description: 'Gỗ thông nhẹ, giá rẻ, thích hợp làm thanh chống đứng chia nhịp.',
    strengthBadge: 'Chịu lực: 90kN · 2.0m',
  },
  {
    id: 'wood-3m',
    name: 'Dầm Gỗ Xiên Tam Giác',
    category: 'WOOD',
    materialType: 'WOOD',
    lengthMeters: 3.0,
    lengthPixels: 3.0 * PIXEL_PER_METER,
    price: 270,
    description: 'Độ dài hoàn hảo tạo các tam giác giàn bất biến chịu lực cắt.',
    strengthBadge: 'Chịu lực: 90kN · 3.0m ★',
  },
  {
    id: 'wood-4m',
    name: 'Dầm Gỗ Dài',
    category: 'WOOD',
    materialType: 'WOOD',
    lengthMeters: 4.0,
    lengthPixels: 4.0 * PIXEL_PER_METER,
    price: 360,
    description: 'Gia cố liên kết dọc hoặc tạo khung đỡ dưới đáy cầu.',
    strengthBadge: 'Chịu lực: 90kN · 4.0m',
  },

  // Nhóm 3: Khung Thép
  {
    id: 'steel-2.5m',
    name: 'Khung Thép Chống Nén',
    category: 'STEEL',
    materialType: 'STEEL',
    lengthMeters: 2.5,
    lengthPixels: 2.5 * PIXEL_PER_METER,
    price: 1050,
    description: 'Hợp kim thép cứng cáp chịu tải trọng siêu nặng tại các mố neo.',
    strengthBadge: 'Siêu tải: 400kN · 2.5m',
  },
  {
    id: 'steel-4m',
    name: 'Xà Thép Giàn Khung',
    category: 'STEEL',
    materialType: 'STEEL',
    lengthMeters: 4.0,
    lengthPixels: 4.0 * PIXEL_PER_METER,
    price: 1680,
    description: 'Thanh xà thép chịu nén & kéo khủng, làm cột trụ chịu mô-men uốn.',
    strengthBadge: 'Siêu tải: 400kN · 4.0m ★',
  },

  // Nhóm 4: Dây Cáp
  {
    id: 'cable-4m',
    name: 'Cáp Neo Vách Đá',
    category: 'CABLE',
    materialType: 'CABLE',
    lengthMeters: 4.0,
    lengthPixels: 4.0 * PIXEL_PER_METER,
    price: 540,
    description: 'Dây cáp bện thép chịu kéo cực đại, nối từ mỏm đá cao xuống cầu.',
    strengthBadge: 'Kéo: 480kN · 4.0m',
  },
  {
    id: 'cable-6m',
    name: 'Cáp Treo Trung Tâm',
    category: 'CABLE',
    materialType: 'CABLE',
    lengthMeters: 6.0,
    lengthPixels: 6.0 * PIXEL_PER_METER,
    price: 810,
    description: 'Nâng đỡ võng giữa nhịp cầu sông rộng hoặc vực sâu không trụ.',
    strengthBadge: 'Kéo: 480kN · 6.0m ★',
  },
  {
    id: 'cable-8m',
    name: 'Cáp Dây Văng Nhịp Lớn',
    category: 'CABLE',
    materialType: 'CABLE',
    lengthMeters: 8.0,
    lengthPixels: 8.0 * PIXEL_PER_METER,
    price: 1080,
    description: 'Tạo hệ thống cầu dây văng hiện đại phân tán tải trọng sang mố neo.',
    strengthBadge: 'Kéo: 480kN · 8.0m',
  },
];
